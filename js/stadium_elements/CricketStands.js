import * as THREE from 'three';
import { createIndividualRoof } from './Roofs.js';

export function generateCricketStands(allParams, groupToAddTo) {
    const numSegments = 60; 
    const boundaryRadiusX = allParams.cricketBoundaryRadiusX;
    const boundaryRadiusZ = allParams.cricketBoundaryRadiusZ;
    const standOffset = allParams.standOffsetFromBoundary || 5;
    const standRingRadiusX = boundaryRadiusX + standOffset;
    const standRingRadiusZ = boundaryRadiusZ + standOffset;
    const numTiers = allParams.numTiers;
    const tierParamsArr = [
        {
            numRows: allParams.tier1_numRows,
            frontWallHeight: allParams.tier1_frontWallHeight,
            rowStepHeight: allParams.tier1_rowStepHeight,
            rowStepDepth: allParams.tier1_rowStepDepth,
            walkwayAtTopDepth: allParams.tier1_walkwayAtTopDepth,
            backWallHeight: allParams.tier1_backWallHeight,
        },
        {
            numRows: allParams.tier2_numRows,
            frontWallHeight: allParams.tier2_frontWallHeight,
            rowStepHeight: allParams.tier2_rowStepHeight,
            rowStepDepth: allParams.tier2_rowStepDepth,
            walkwayAtTopDepth: allParams.tier2_walkwayAtTopDepth,
            backWallHeight: allParams.tier2_backWallHeight,
            verticalOffset: allParams.tier2_verticalOffset,
            horizontalOffset: allParams.tier2_horizontalOffset,
        },
        {
            numRows: allParams.tier3_numRows,
            frontWallHeight: allParams.tier3_frontWallHeight,
            rowStepHeight: allParams.tier3_rowStepHeight,
            rowStepDepth: allParams.tier3_rowStepDepth,
            walkwayAtTopDepth: allParams.tier3_walkwayAtTopDepth,
            backWallHeight: allParams.tier3_backWallHeight,
            verticalOffset: allParams.tier3_verticalOffset,
            horizontalOffset: allParams.tier3_horizontalOffset,
        }
    ];
    const seatColors = allParams.cricketStandColors || ['#e53935', '#fbc02d', '#1e88e5'];
    const NUM_SECTIONS = seatColors.length;

    const seatsPerRow = 2;
    const totalRows = tierParamsArr.reduce((sum, tier) => sum + (tier.numRows || 0), 0);
    const maxSeatsPerColor = Math.ceil((numSegments / NUM_SECTIONS) * totalRows * seatsPerRow);
    const seatGeometry = new THREE.BoxGeometry(1, 1, 1); 
    const seatMaterials = seatColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.2 }));
    const seatInstancedMeshes = seatMaterials.map((mat, i) => new THREE.InstancedMesh(seatGeometry, mat, maxSeatsPerColor));
    seatInstancedMeshes.forEach(im => im.instanceMatrix.setUsage(THREE.DynamicDrawUsage));
    const seatInstanceOffsets = Array(NUM_SECTIONS).fill(0);
    seatInstancedMeshes.forEach(im => groupToAddTo.add(im));

    for (let i = 0; i < numSegments; i++) {
        const angleStart = (i / numSegments) * Math.PI * 2;
        const angleEnd = ((i + 1) / numSegments) * Math.PI * 2;
        const angleMid = (angleStart + angleEnd) / 2;
        const sectionIdx = Math.floor((i / numSegments) * NUM_SECTIONS) % NUM_SECTIONS;
        const seatColor = seatColors[sectionIdx];

        const segmentGroup = new THREE.Group();
        segmentGroup.name = `CricketStandSegment${i}_Group`;

        let baseRadiusX = standRingRadiusX;
        let baseRadiusZ = standRingRadiusZ;
        let baseY = 0;
        let baseXOffset = 0;
        let baseYOffset = 0;

        for (let t = 0; t < numTiers; t++) {
            const tier = tierParamsArr[t];
            if (!tier || tier.numRows <= 0) continue;
            if (t > 0) {
                baseY += tierParamsArr[t].verticalOffset || 0;
                baseXOffset += tierParamsArr[t].horizontalOffset || 0;
            }
            let rowBaseXOffset = baseXOffset;
            let rowBaseY = baseY + tier.frontWallHeight;
            for (let r = 0; r < tier.numRows; r++) {

                const rowRadiusX = baseRadiusX + rowBaseXOffset + r * tier.rowStepDepth;
                const rowRadiusZ = baseRadiusZ + rowBaseXOffset + r * tier.rowStepDepth;
                const rowY = rowBaseY + r * tier.rowStepHeight;

                for (let s = 0; s < seatsPerRow; s++) {
                    const seatFrac = (s + 0.5) / seatsPerRow;
                    const seatAngle = angleStart + (angleEnd - angleStart) * seatFrac;
                    const x = Math.cos(seatAngle) * rowRadiusX;
                    const z = Math.sin(seatAngle) * rowRadiusZ;
                    const seatWidth = 1.2 * Math.abs(rowRadiusX * (angleEnd - angleStart) / seatsPerRow);
                    const seatDepth = tier.rowStepDepth * 0.9;
                    const seatHeight = tier.rowStepHeight * 0.8;
                    const dummy = new THREE.Object3D();
                    dummy.position.set(x, rowY + seatHeight / 2, z);
                    dummy.scale.set(seatWidth, seatHeight, seatDepth);
                    dummy.lookAt(0, rowY + seatHeight / 2, 0);
                    dummy.updateMatrix();
                    const mesh = seatInstancedMeshes[sectionIdx];
                    const idx = seatInstanceOffsets[sectionIdx];
                    if (idx < mesh.count) {
                        mesh.setMatrixAt(idx, dummy.matrix);
                        seatInstanceOffsets[sectionIdx]++;
                    }
                }
                const avgRowRadius = (rowRadiusX + rowRadiusZ) / 2;
                const arcSegmentAngleSpan = angleEnd - angleStart;
                const stepWidth = Math.abs(avgRowRadius * arcSegmentAngleSpan);
                const stepDepth = tier.rowStepDepth * 0.95;
                const stepGeo = new THREE.BoxGeometry(stepWidth, 0.15, stepDepth);
                const stepMat = new THREE.MeshStandardMaterial({ color: '#b3e5fc', roughness: 0.7, metalness: 0.1 });
                const stepMesh = new THREE.Mesh(stepGeo, stepMat);
                const stepX = Math.cos(angleMid) * rowRadiusX;
                const stepZ = Math.sin(angleMid) * rowRadiusZ;
                stepMesh.position.set(stepX, rowY - 0.075, stepZ);
                stepMesh.rotation.y = angleMid + Math.PI / 2;
                segmentGroup.add(stepMesh);
            }
            if (tier.backWallHeight > 0) {
                const backWallBaseRadiusX = baseRadiusX + baseXOffset + tier.numRows * tier.rowStepDepth + tier.walkwayAtTopDepth;
                const backWallBaseRadiusZ = baseRadiusZ + baseXOffset + tier.numRows * tier.rowStepDepth + tier.walkwayAtTopDepth;
                const avgBackWallRadius = (backWallBaseRadiusX + backWallBaseRadiusZ) / 2;
                const arcSegmentAngleSpan = angleEnd - angleStart;
                const wallY = baseY + tier.frontWallHeight + tier.numRows * tier.rowStepHeight;
                const wallHeight = tier.backWallHeight;
                const wallWidth = Math.abs(avgBackWallRadius * arcSegmentAngleSpan);
                const wallDepth = 0.3 * tier.rowStepDepth;
                const wallGeo = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
                const wallMat = new THREE.MeshStandardMaterial({ color: '#bdbdbd', roughness: 0.8, metalness: 0.1 });
                const wallMesh = new THREE.Mesh(wallGeo, wallMat);
                const wallX = Math.cos(angleMid) * backWallBaseRadiusX;
                const wallZ = Math.sin(angleMid) * backWallBaseRadiusZ;
                wallMesh.position.set(wallX, wallY + wallHeight / 2, wallZ);
                wallMesh.rotation.y = angleMid + Math.PI / 2;
                segmentGroup.add(wallMesh);
            }
            baseY += tier.frontWallHeight + tier.numRows * tier.rowStepHeight + tier.walkwayAtTopDepth + (tier.backWallHeight || 0);
            baseXOffset += tier.numRows * tier.rowStepDepth + tier.walkwayAtTopDepth;
        }
        groupToAddTo.add(segmentGroup);
    }
}
