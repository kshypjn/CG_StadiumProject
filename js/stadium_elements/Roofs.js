import * as THREE from 'three';

export function createIndividualRoof(standGroup, standLength, color, heightOffset, depth, tilt, thickness, standProfileDepth, standTopY, supportColor = '#666666') {
    const roofAssemblyGroup = new THREE.Group();
    roofAssemblyGroup.name = `${standGroup.name.replace('Group', '')}RoofAssembly`;

    const roofSlabMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    const roofSlabGeo = new THREE.BoxGeometry(depth, thickness, standLength);
    const roofSlabMesh = new THREE.Mesh(roofSlabGeo, roofSlabMaterial);
    roofSlabMesh.castShadow = true;
    roofSlabMesh.name = "RoofSlab";

    const slab_X_center = standProfileDepth - (depth / 2);
    const slab_Y_center = standTopY + heightOffset + (thickness / 2);
    const slab_Z_center = standLength / 2;

    roofSlabMesh.position.set(slab_X_center, slab_Y_center, slab_Z_center);
    roofSlabMesh.rotation.z = tilt; 
    roofAssemblyGroup.add(roofSlabMesh);

    const supportMaterial = new THREE.MeshStandardMaterial({
        color: supportColor,
        metalness: 0.4,
        roughness: 0.6
    });
    const supportRadius = 0.3;
    const desiredNumSupports = 2;

    for (let i = 0; i < desiredNumSupports; i++) {
        let Z_pos_support_in_slab_local_space;
        if (desiredNumSupports === 1) {
            Z_pos_support_in_slab_local_space = 0;
        } else if (desiredNumSupports === 2) {
            const inset = standLength * 0.1;
            Z_pos_support_in_slab_local_space = (i === 0)
                ? -standLength / 2 + inset
                :  standLength / 2 - inset;
        } else {
            const inset = standLength * 0.1;
            const Z_start = -standLength / 2 + inset;
            const Z_end = standLength / 2 - inset;
            Z_pos_support_in_slab_local_space = Z_start + i * ((Z_end - Z_start) / (desiredNumSupports - 1));
        }
        const Z_pos_support_in_assembly_space = slab_Z_center + Z_pos_support_in_slab_local_space;

        const base_X = standProfileDepth - depth;
        const base_Y = 0;
        const base_Z = Z_pos_support_in_assembly_space;
        const basePoint = new THREE.Vector3(base_X, base_Y, base_Z);

        const attach_X_relative_to_slab_center = -depth / 2;
        const attach_Y_relative_to_slab_center = -thickness / 2;
        const attach_Z_relative_to_slab_center = Z_pos_support_in_slab_local_space;

        let attachPointOnSlab = new THREE.Vector3(
            attach_X_relative_to_slab_center,
            attach_Y_relative_to_slab_center,
            attach_Z_relative_to_slab_center
        );

        attachPointOnSlab.applyEuler(new THREE.Euler(0, 0, tilt, 'XYZ'));
        attachPointOnSlab.add(roofSlabMesh.position);

        const directionVector = new THREE.Vector3().subVectors(attachPointOnSlab, basePoint);
        const supportActualLength = directionVector.length();
        const midPoint = new THREE.Vector3().addVectors(basePoint, attachPointOnSlab).multiplyScalar(0.5);

        if (supportActualLength < 0.1) continue;

        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(supportRadius, supportRadius, supportActualLength, 12),
            supportMaterial
        );
        support.castShadow = true;
        support.position.copy(midPoint);
        support.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), directionVector.clone().normalize());

        roofAssemblyGroup.add(support);
    }

    standGroup.add(roofAssemblyGroup);
}
//overall 
export function createOverallRoof(allParams, groupToAddTo, maxStandDepthOverride, maxStandHeightOverride) {
    const material = new THREE.MeshStandardMaterial({
        color: allParams.overallRoofColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: allParams.overallRoofOpacity || 0.9
    });

    let maxStandDepth = typeof maxStandDepthOverride === 'number' ? maxStandDepthOverride : 0;
    let maxStandHeight = typeof maxStandHeightOverride === 'number' ? maxStandHeightOverride : 0;

    if (maxStandDepth === 0 || maxStandHeight === 0) {
        if (allParams.useIndividualStandSettings) {
            allParams.stands.forEach(sp => {
                if (sp.show) {
                    const depth = (sp.numRows * sp.rowStepDepth) + sp.walkwayAtTopDepth;
                    if (depth > maxStandDepth) maxStandDepth = depth;
                    const height = sp.frontWallHeight + (sp.numRows * sp.rowStepHeight) + sp.backWallHeight;
                    if (height > maxStandHeight) maxStandHeight = height;
                }
            });
        } else {
            maxStandDepth = (allParams.standNumRows * allParams.standRowStepDepth) + allParams.standWalkwayAtTopDepth;
            maxStandHeight = allParams.standFrontWallHeight + (allParams.standNumRows * allParams.standRowStepHeight) + allParams.standBackWallHeight;
        }
    }

    if (maxStandDepth === 0 && allParams.showStands) maxStandDepth = 20;
    if (maxStandHeight === 0 && allParams.showStands) maxStandHeight = allParams.standBackWallHeight > 0 ? allParams.standBackWallHeight : 15;

    const outerRoofLength = allParams.pitchLength + 2 * (allParams.standOffsetFromPitch + maxStandDepth + allParams.overallRoofOverhang);
    const outerRoofWidth = allParams.pitchWidth + 2 * (allParams.standOffsetFromPitch + maxStandDepth + allParams.overallRoofOverhang);
    const innerHoleLength = allParams.pitchLength;
    const innerHoleWidth = allParams.pitchWidth;
    const roofThickness = allParams.individualRoofThickness || 0.5;

    const roofShape = new THREE.Shape();
    const halfOuterL = outerRoofLength / 2;
    const halfOuterW = outerRoofWidth / 2;
    roofShape.moveTo(-halfOuterL, -halfOuterW);
    roofShape.lineTo(halfOuterL, -halfOuterW);
    roofShape.lineTo(halfOuterL, halfOuterW);
    roofShape.lineTo(-halfOuterL, halfOuterW);
    roofShape.closePath();

    const holePath = new THREE.Path();
    const halfInnerL = innerHoleLength / 2;
    const halfInnerW = innerHoleWidth / 2;
    holePath.moveTo(-halfInnerL, -halfInnerW);
    holePath.lineTo(-halfInnerL, halfInnerW);
    holePath.lineTo(halfInnerL, halfInnerW);
    holePath.lineTo(halfInnerL, -halfInnerW);
    holePath.closePath();
    roofShape.holes.push(holePath);

    const extrudeSettings = { steps: 1, depth: roofThickness, bevelEnabled: false };
    const overallRoofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    overallRoofGeometry.rotateX(-Math.PI / 2);
    overallRoofGeometry.translate(0, roofThickness / 2, 0);

    const overallRoofMesh = new THREE.Mesh(overallRoofGeometry, material);
    overallRoofMesh.position.set(
        0,
        maxStandHeight + (roofThickness/2),
        0
    );
    overallRoofMesh.castShadow = true;
    overallRoofMesh.name = "OverallStadiumRoof";
    groupToAddTo.add(overallRoofMesh);

    const supportMaterial = new THREE.MeshStandardMaterial({ color: allParams.supportColor || '#555555' });
    const supportRadius = 0.5;
    const supportActualHeight = maxStandHeight;

    const supportPositions = [
        { x: halfOuterL - allParams.overallRoofOverhang, z: halfOuterW - allParams.overallRoofOverhang },
        { x: -halfOuterL + allParams.overallRoofOverhang, z: halfOuterW - allParams.overallRoofOverhang },
        { x: halfOuterL - allParams.overallRoofOverhang, z: -halfOuterW + allParams.overallRoofOverhang },
        { x: -halfOuterL + allParams.overallRoofOverhang, z: -halfOuterW + allParams.overallRoofOverhang }
    ];

    supportPositions.forEach(pos => {
        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(supportRadius, supportRadius, supportActualHeight, 16),
            supportMaterial
        );
        support.castShadow = true;
        support.position.set(pos.x, supportActualHeight / 2, pos.z);
        groupToAddTo.add(support);
    });
}

export function createCricketOverallRoof(allParams, groupToAddTo) {
    if (!allParams.cricketOverallRoofEnable) return;
    console.log("Creating Cricket Overall Roof...");
    const boundaryRadiusX = allParams.cricketBoundaryRadiusX;
    const boundaryRadiusZ = allParams.cricketBoundaryRadiusZ;
    const standOffset = allParams.standOffsetFromBoundary;
    const roofThickness = allParams.cricketOverallRoofThickness;
    const roofColor = new THREE.Color(allParams.cricketOverallRoofColor);
    const roofOpacity = allParams.cricketOverallRoofOpacity;
    const outerOverhang = allParams.cricketOverallRoofOuterOverhang;
    const innerOverhang = allParams.cricketOverallRoofInnerOverhang;
    const heightOffset = allParams.cricketOverallRoofHeightOffset;
    let maxStandRadialDepth = 0;
    let maxStandHeightAtBack = 0;
    let currentRadialDepth = 0;
    let currentY = 0;
    const tierParamsArr = [
        { numRows: allParams.tier1_numRows, frontWallHeight: allParams.tier1_frontWallHeight, rowStepHeight: allParams.tier1_rowStepHeight, rowStepDepth: allParams.tier1_rowStepDepth, walkwayAtTopDepth: allParams.tier1_walkwayAtTopDepth, backWallHeight: allParams.tier1_backWallHeight },
        { numRows: allParams.tier2_numRows, frontWallHeight: allParams.tier2_frontWallHeight, rowStepHeight: allParams.tier2_rowStepHeight, rowStepDepth: allParams.tier2_rowStepDepth, walkwayAtTopDepth: allParams.tier2_walkwayAtTopDepth, backWallHeight: allParams.tier2_backWallHeight, verticalOffset: allParams.tier2_verticalOffset, horizontalOffset: allParams.tier2_horizontalOffset },
        { numRows: allParams.tier3_numRows, frontWallHeight: allParams.tier3_frontWallHeight, rowStepHeight: allParams.tier3_rowStepHeight, rowStepDepth: allParams.tier3_rowStepDepth, walkwayAtTopDepth: allParams.tier3_walkwayAtTopDepth, backWallHeight: allParams.tier3_backWallHeight, verticalOffset: allParams.tier3_verticalOffset, horizontalOffset: allParams.tier3_horizontalOffset }
    ];
    for (let t = 0; t < allParams.numTiers; t++) {
        const tier = tierParamsArr[t];
        if (!tier || tier.numRows <= 0) continue;
        if (t > 0) {
            currentY += tier.verticalOffset;
            currentRadialDepth += tier.horizontalOffset;
        }
        currentY += tier.frontWallHeight;
        for (let r = 0; r < tier.numRows; r++) {
            currentRadialDepth += tier.rowStepDepth;
            currentY += tier.rowStepHeight;
        }
        currentRadialDepth += tier.walkwayAtTopDepth;
        if (tier.backWallHeight > 0) {
            currentY += tier.backWallHeight;
        }
        if (currentRadialDepth > maxStandRadialDepth) maxStandRadialDepth = currentRadialDepth;
        if (currentY > maxStandHeightAtBack) maxStandHeightAtBack = currentY;
    }

    const outerRadiusX = boundaryRadiusX + standOffset + maxStandRadialDepth + outerOverhang;
    const outerRadiusZ = boundaryRadiusZ + standOffset + maxStandRadialDepth + outerOverhang;
    const innerRadiusX = boundaryRadiusX - innerOverhang;
    const innerRadiusZ = boundaryRadiusZ - innerOverhang;

    const roofShape = new THREE.Shape();
    const numSegments = 64;
    for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const x = Math.cos(angle) * outerRadiusX;
        const y = Math.sin(angle) * outerRadiusZ;
        if (i === 0) {
            roofShape.moveTo(x, y);
        } else {
            roofShape.lineTo(x, y);
        }
    }
    roofShape.closePath();

    const holePath = new THREE.Path();
    for (let i = 0; i <= numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const x = Math.cos(angle) * innerRadiusX;
        const y = Math.sin(angle) * innerRadiusZ;
        if (i === 0) {
            holePath.moveTo(x, y);
        } else {
            holePath.lineTo(x, y);
        }
    }
    holePath.closePath();
    roofShape.holes.push(holePath);

    const extrudeSettings = { steps: 1, depth: roofThickness, bevelEnabled: false };
    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    roofGeometry.rotateX(-Math.PI / 2);
    roofGeometry.translate(0, roofThickness / 2, 0);

    const roofMaterial = new THREE.MeshStandardMaterial({
        color: roofColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: roofOpacity
    });

    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.set(0, maxStandHeightAtBack + heightOffset + (roofThickness/2), 0);
    roofMesh.castShadow = true;
    roofMesh.name = "CricketOverallRoof";
    groupToAddTo.add(roofMesh);

    const supportMaterial = new THREE.MeshStandardMaterial({ color: allParams.supportColor || '#555555' });
    const supportRadius = 0.5;
    const supportActualHeight = maxStandHeightAtBack + heightOffset;

    const numSupports = 8;
    for (let i = 0; i < numSupports; i++) {
        const angle = (i / numSupports) * Math.PI * 2;
        const x = Math.cos(angle) * (outerRadiusX - outerOverhang/2);
        const z = Math.sin(angle) * (outerRadiusZ - outerOverhang/2);

        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(supportRadius, supportRadius, supportActualHeight, 16),
            supportMaterial
        );
        support.castShadow = true;
        support.position.set(x, supportActualHeight / 2, z);
        groupToAddTo.add(support);
    }
} 