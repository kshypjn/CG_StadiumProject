import * as THREE from 'three';
import { createIndividualRoof, createOverallRoof } from './Roofs.js';

function _getStandEffectiveParams(globalParams, individualStandParams, useIndividual) {
    if (useIndividual && individualStandParams) {
        return {
            show: individualStandParams.show !== undefined ? individualStandParams.show : globalParams.showStands,
            offsetFromPitch: individualStandParams.offsetFromPitch !== undefined ? individualStandParams.offsetFromPitch : globalParams.standOffsetFromPitch,
            frontWallHeight: individualStandParams.frontWallHeight !== undefined ? individualStandParams.frontWallHeight : globalParams.standFrontWallHeight,
            numRows: individualStandParams.numRows !== undefined ? individualStandParams.numRows : globalParams.standNumRows,
            rowStepHeight: individualStandParams.rowStepHeight !== undefined ? individualStandParams.rowStepHeight : globalParams.standRowStepHeight,
            rowStepDepth: individualStandParams.rowStepDepth !== undefined ? individualStandParams.rowStepDepth : globalParams.standRowStepDepth,
            walkwayAtTopDepth: individualStandParams.walkwayAtTopDepth !== undefined ? individualStandParams.walkwayAtTopDepth : globalParams.standWalkwayAtTopDepth,
            backWallHeight: individualStandParams.backWallHeight !== undefined ? individualStandParams.backWallHeight : globalParams.standBackWallHeight,
            color: individualStandParams.color || globalParams.standColor,
            pitchLength: globalParams.pitchLength,
            pitchWidth: globalParams.pitchWidth,
            name: individualStandParams.name || 'Stand'
        };
    }
    return {
        show: globalParams.showStands,
        offsetFromPitch: globalParams.standOffsetFromPitch,
        frontWallHeight: globalParams.standFrontWallHeight,
        numRows: globalParams.standNumRows,
        rowStepHeight: globalParams.standRowStepHeight,
        rowStepDepth: globalParams.standRowStepDepth,
        walkwayAtTopDepth: globalParams.standWalkwayAtTopDepth,
        backWallHeight: globalParams.standBackWallHeight,
        color: globalParams.standColor,
        pitchLength: globalParams.pitchLength,
        pitchWidth: globalParams.pitchWidth,
    };
}

function createSingleTierProfile(tierParams) {
    const shape = new THREE.Shape();
    let currentX = 0;
    let currentY = 0;

    shape.moveTo(currentX, currentY);

    currentY += tierParams.frontWallHeight;
    shape.lineTo(currentX, currentY);

    for (let i = 0; i < tierParams.numRows; i++) {
        currentX += tierParams.rowStepDepth;
        shape.lineTo(currentX, currentY);
        currentY += tierParams.rowStepHeight;
        shape.lineTo(currentX, currentY);
    }

    currentX += tierParams.walkwayAtTopDepth;
    shape.lineTo(currentX, currentY);
    const tierProfileDepth = currentX;

    if (tierParams.backWallHeight > 0) {
        currentY += tierParams.backWallHeight;
        shape.lineTo(currentX, currentY);
    }
    const tierProfileHeight = currentY;

    shape.lineTo(currentX, 0);
    shape.lineTo(0, 0);

    return {
        shape,
        tierProfileDepth,
        tierProfileHeight,
        topWalkwayEndX: currentX,
        topWalkwayEndY: currentY - (tierParams.backWallHeight > 0 ? tierParams.backWallHeight : 0)
    };
}

export { createSingleTierProfile };
export function generateAllStands(allParams, groupToAddTo) {
    const standDefinitions = [
        { name: "East", axis: 'z', side: 1, lengthParam: 'pitchLength', rotationY: -Math.PI / 2 },
        { name: "West", axis: 'z', side: -1, lengthParam: 'pitchLength', rotationY: Math.PI / 2 },
        { name: "North", axis: 'x', side: 1, lengthParam: 'pitchWidth', rotationY: 0 },
        { name: "South", axis: 'x', side: -1, lengthParam: 'pitchWidth', rotationY: Math.PI }
    ];

    let maxStandDepth = 0;
    let maxStandHeight = 0;

    standDefinitions.forEach((def, index) => {
        const individualSpecificParams = allParams.stands[index];
        const activeStandParams = _getStandEffectiveParams(allParams, individualSpecificParams, allParams.useIndividualStandSettings);
        if (!activeStandParams.show) return;

        const mainStandGroup = new THREE.Group();
        mainStandGroup.name = `${def.name}StandGroup`;

        const { shape, profileDepth, profileHeight } = createMultiTierProfile(allParams);
        const standLength = (def.lengthParam === 'pitchLength') ? allParams.pitchLength : allParams.pitchWidth;
        const extrudeSettings = { steps: 1, depth: standLength, bevelEnabled: false };
        const standGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const standMesh = new THREE.Mesh(standGeometry, new THREE.MeshStandardMaterial({
            color: activeStandParams.color,
            roughness: 0.8,
            metalness: 0.2,
        }));
        standMesh.castShadow = true;
        standMesh.receiveShadow = true;
        standMesh.name = `${def.name}Stand`;
        mainStandGroup.add(standMesh);

        mainStandGroup.userData.standLength = standLength;
        mainStandGroup.userData.totalProfileDepth = profileDepth;
        mainStandGroup.userData.totalProfileHeightAtBack = profileHeight;
        mainStandGroup.userData.definitionRotationY = def.rotationY;

        if (profileDepth > maxStandDepth) maxStandDepth = profileDepth;
        if (profileHeight > maxStandHeight) maxStandHeight = profileHeight;

        const halfPitchL = allParams.pitchLength / 2;
        const halfPitchW = allParams.pitchWidth / 2;
        mainStandGroup.rotation.y = def.rotationY;

        if (def.axis === 'z') {
            mainStandGroup.position.set(
                def.side * standLength / 2,
                0,
                def.side * (halfPitchW + activeStandParams.offsetFromPitch)
            );
        } else {
            mainStandGroup.position.set(
                def.side * (halfPitchL + activeStandParams.offsetFromPitch),
                0,
                (def.rotationY === Math.PI ? 1 : -1) * standLength / 2
            );
        }

        groupToAddTo.add(mainStandGroup);

        if (allParams.roofType === 'individual' && allParams.individualRoofEnable && standLength > 0) {
            let dynamicRoofCoverageDepth = profileDepth * allParams.individualRoofCoverageFactor;
            dynamicRoofCoverageDepth = Math.max(allParams.individualRoofMinCoverage, dynamicRoofCoverageDepth);
            dynamicRoofCoverageDepth = Math.min(allParams.individualRoofMaxCoverage, dynamicRoofCoverageDepth);
            dynamicRoofCoverageDepth = Math.max(0.1, dynamicRoofCoverageDepth);

            createIndividualRoof(
                mainStandGroup,
                standLength,
                allParams.individualRoofColor,
                allParams.individualRoofHeightOffset,
                dynamicRoofCoverageDepth,
                allParams.individualRoofTilt,
                allParams.individualRoofThickness,
                profileDepth,
                profileHeight,
                allParams.supportColor
            );
        }
    });

    if (allParams.roofType === 'overall') {
        createOverallRoof(allParams, groupToAddTo, maxStandDepth, maxStandHeight);
    }
}

export function createMultiTierProfile(allParams) {
    const shape = new THREE.Shape();
    let x = 0, y = 0;
    shape.moveTo(x, y);

    if (allParams.tier1_numRows > 0) {
        y += allParams.tier1_frontWallHeight;
        shape.lineTo(x, y);
        for (let r = 0; r < allParams.tier1_numRows; r++) {
            x += allParams.tier1_rowStepDepth;
            shape.lineTo(x, y);
            y += allParams.tier1_rowStepHeight;
            shape.lineTo(x, y);
        }
        x += allParams.tier1_walkwayAtTopDepth;
        shape.lineTo(x, y);
        if (allParams.tier1_backWallHeight > 0) {
            y += allParams.tier1_backWallHeight;
            shape.lineTo(x, y);
        }
    }

    if (allParams.numTiers >= 2 && allParams.tier2_numRows > 0) {
        y += allParams.tier2_verticalOffset;
        x += allParams.tier2_horizontalOffset;
        shape.lineTo(x, y);
        y += allParams.tier2_frontWallHeight;
        shape.lineTo(x, y);
        for (let r = 0; r < allParams.tier2_numRows; r++) {
            x += allParams.tier2_rowStepDepth;
            shape.lineTo(x, y);
            y += allParams.tier2_rowStepHeight;
            shape.lineTo(x, y);
        }
        x += allParams.tier2_walkwayAtTopDepth;
        shape.lineTo(x, y);
        if (allParams.tier2_backWallHeight > 0) {
            y += allParams.tier2_backWallHeight;
            shape.lineTo(x, y);
        }
    }

    if (allParams.numTiers >= 3 && allParams.tier3_numRows > 0) {
        y += allParams.tier3_verticalOffset;
        x += allParams.tier3_horizontalOffset;
        shape.lineTo(x, y);
        y += allParams.tier3_frontWallHeight;
        shape.lineTo(x, y);
        for (let r = 0; r < allParams.tier3_numRows; r++) {
            x += allParams.tier3_rowStepDepth;
            shape.lineTo(x, y);
            y += allParams.tier3_rowStepHeight;
            shape.lineTo(x, y);
        }
        x += allParams.tier3_walkwayAtTopDepth;
        shape.lineTo(x, y);
        if (allParams.tier3_backWallHeight > 0) {
            y += allParams.tier3_backWallHeight;
            shape.lineTo(x, y);
        }
    }

    const profileDepth = x;
    const profileHeight = y;

    shape.lineTo(x, 0);
    shape.lineTo(0, 0);

    return {
        shape,
        profileDepth,
        profileHeight
    };
}
