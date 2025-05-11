import * as THREE from 'three';


let activeFloodlightStructuresGroup = null;
export let activeSpotLights = [];
export let activeSpotLightHelpers = [];

function clearPreviousFloodlights(stadiumGroup, scene) {
    if (activeFloodlightStructuresGroup) {
        activeFloodlightStructuresGroup.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        stadiumGroup.remove(activeFloodlightStructuresGroup);
        activeFloodlightStructuresGroup = null;
    }

    activeSpotLights.forEach(light => {
        if (light.parent) light.parent.remove(light);
        if (light.target && light.target.parent) light.target.parent.remove(light.target);
        if (light.dispose) light.dispose();
    });
    activeSpotLights.length = 0;

    activeSpotLightHelpers.forEach(helper => {
        if (helper.parent) helper.parent.remove(helper);
        if (helper.dispose) helper.dispose();
    });
    activeSpotLightHelpers.length = 0;
}

export function createStadiumFloodlights(allParams, groupToAddTo, scene) {
    clearPreviousFloodlights(groupToAddTo, scene); 
    if (!allParams.showFloodlights) return;

    let towerPositions = [];
    const towerHeight = allParams.floodlightTowerHeight;
    const isNight = allParams.timeOfDay === 'night';
    let shadowSpotlightCount = 0;
    const maxShadowSpotlights = 8;

    if (allParams.stadiumType === 'football') {
        const pitchL = allParams.pitchLength;
        const pitchW = allParams.pitchWidth;
        const standOffsetFootball = allParams.standOffsetFromPitch;
        const estimatedFootballStandProfileDepth = (allParams.numTiers > 0 && allParams.tier1_numRows > 0)
            ? (allParams.tier1_numRows * allParams.tier1_rowStepDepth) + allParams.tier1_walkwayAtTopDepth
            : 20;
        const towerOffsetFactor = 1.2;
        const towerXOffset = pitchL / 2 + standOffsetFootball + estimatedFootballStandProfileDepth * 0.5 + 10 * towerOffsetFactor;
        const towerZOffset = pitchW / 2 + standOffsetFootball + estimatedFootballStandProfileDepth * 0.5 + 10 * towerOffsetFactor;

        towerPositions = [
            new THREE.Vector3(towerXOffset, 0, towerZOffset),
            new THREE.Vector3(-towerXOffset, 0, towerZOffset),
            new THREE.Vector3(-towerXOffset, 0, -towerZOffset),
            new THREE.Vector3(towerXOffset, 0, -towerZOffset)
        ];

    } else if (allParams.stadiumType === 'cricket') {
        const numTowers = allParams.numFloodlightTowersCricket || 6;
        const boundaryRadiusX = allParams.cricketBoundaryRadiusX;
        const boundaryRadiusZ = allParams.cricketBoundaryRadiusZ;
        const standOffsetCricket = allParams.standOffsetFromBoundary || 5;
        const estimatedCricketStandProfileDepth = (allParams.numTiers > 0 && allParams.tier1_numRows > 0)
            ? (allParams.tier1_numRows * allParams.tier1_rowStepDepth) + allParams.tier1_walkwayAtTopDepth
            : 20;  
        const floodlightAdditionalOffset = 15; 

        const floodlightRingRadiusX = boundaryRadiusX + standOffsetCricket + estimatedCricketStandProfileDepth + floodlightAdditionalOffset;
        const floodlightRingRadiusZ = boundaryRadiusZ + standOffsetCricket + estimatedCricketStandProfileDepth + floodlightAdditionalOffset;

        for (let i = 0; i < numTowers; i++) {
            const angle = (i / numTowers) * Math.PI * 2;
            const x = floodlightRingRadiusX * Math.cos(angle);
            const z = floodlightRingRadiusZ * Math.sin(angle);
            towerPositions.push(new THREE.Vector3(x, 0, z));
        }
    }

    const pitchCenterTarget = new THREE.Vector3(0, 0, 0);

    towerPositions.forEach((pos, towerIndex) => {

        const towerGroup = new THREE.Group();
        towerGroup.name = `FloodlightTower${towerIndex + 1}`;


        const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, towerHeight, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: allParams.floodlightTowerColor });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = towerHeight / 2;
        pole.castShadow = true;
        towerGroup.add(pole);


        const numLights = allParams.numLightsPerTower;
        const lightSpacing = 2;
        const totalLightWidth = (numLights - 1) * lightSpacing;
        const startX = -totalLightWidth / 2;

        for (let i = 0; i < numLights; i++) {
            const lightX = startX + i * lightSpacing;
            
          
            const housingGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.2);
            const housingMaterial = new THREE.MeshStandardMaterial({ color: allParams.floodlightTowerColor });
            const housing = new THREE.Mesh(housingGeometry, housingMaterial);
            housing.position.set(lightX, towerHeight - 1, 0);
            housing.castShadow = true;
            towerGroup.add(housing);
            const spotlight = new THREE.SpotLight(
                allParams.spotlightColorPreset,
                allParams.spotlightIntensity
            );
            spotlight.position.set(lightX, towerHeight - 0.6, 0);
            spotlight.angle = allParams.spotlightAngle;
            spotlight.penumbra = allParams.spotlightPenumbra;
            spotlight.decay = 2;
            spotlight.distance = allParams.spotlightDistance;
            if (i === 0) {
                spotlight.castShadow = true;
                spotlight.shadow.mapSize.width = 1024;
                spotlight.shadow.mapSize.height = 1024;
                spotlight.shadow.camera.near = 20;
                spotlight.shadow.camera.far = allParams.spotlightDistance;
                spotlight.shadow.bias = -0.001;
            } else {
                spotlight.castShadow = false;
            }
            const target = new THREE.Object3D();
            target.position.set(0, 0, 0);
            scene.add(target);
            spotlight.target = target;
            towerGroup.add(spotlight);
            activeSpotLights.push(spotlight);
            if (allParams.showSpotlightHelpers) {
                const helper = new THREE.SpotLightHelper(spotlight);
                scene.add(helper);
                activeSpotLightHelpers.push(helper);
            }
        }

        towerGroup.position.copy(pos);
        towerGroup.lookAt(new THREE.Vector3(0, 0, 0));
        towerGroup.rotateY(Math.PI);
        groupToAddTo.add(towerGroup);
    });
} 