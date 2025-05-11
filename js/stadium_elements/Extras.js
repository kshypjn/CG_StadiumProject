import * as THREE from 'three';

let adMaterialCache = null;
let scoreboardScreenMaterial = null;
let scoreboardFrameMaterial = null;

function clearExtrasFromGroup(stadiumGroup, groupName) {
    const oldGroup = stadiumGroup.getObjectByName(groupName);
    if (oldGroup) {
        oldGroup.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            }
        });
        stadiumGroup.remove(oldGroup);
    }
}

function createLEDScreenTexture(image = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const ledSize = 4;
    const ledSpacing = 1;
    const totalLedsX = Math.floor(canvas.width / (ledSize + ledSpacing));
    const totalLedsY = Math.floor(canvas.height / (ledSize + ledSpacing));
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (let y = 0; y < totalLedsY; y++) {
            for (let x = 0; x < totalLedsX; x++) {
                const pixelX = x * (ledSize + ledSpacing);
                const pixelY = y * (ledSize + ledSpacing);
                const imageData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
                ctx.fillStyle = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, 0.8)`;
                ctx.beginPath();
                ctx.arc(
                    pixelX + ledSize/2,
                    pixelY + ledSize/2,
                    ledSize/2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    } else {
        for (let y = 0; y < totalLedsY; y++) {
            for (let x = 0; x < totalLedsX; x++) {
                const pixelX = x * (ledSize + ledSpacing);
                const pixelY = y * (ledSize + ledSpacing);
                const hue = (x + y) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
                ctx.beginPath();
                ctx.arc(
                    pixelX + ledSize/2,
                    pixelY + ledSize/2,
                    ledSize/2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
}

let defaultAdMaterial = null;

function createMainScoreboardTexture(canvasWidth, canvasHeight, params) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
        
    ctx.fillStyle = params.scoreboardScreenColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = params.scoreboardTextColor;
    ctx.textBaseline = 'middle';
    const padding = canvas.width * 0.05;
    const contentWidth = canvas.width - 2 * padding;
    const contentHeight = canvas.height - 2 * padding;
    const topSectionHeight = contentHeight * 0.25;
    const midSectionHeight = contentHeight * 0.4;
    const flagSectionHeight = contentHeight * 0.35;

    ctx.font = `bold ${params.scoreboardTimeFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(params.scoreboardGameTime, canvas.width / 2, padding + topSectionHeight / 2);

    ctx.font = `bold ${params.scoreboardTeamFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(params.scoreboardTeamA, padding, padding + topSectionHeight + midSectionHeight / 2);

    ctx.font = `bold ${params.scoreboardScoreFontSize}px sans-serif`;
    ctx.textAlign = 'right';
    const scoreA_X = padding + contentWidth * 0.4;
    ctx.fillText(params.scoreboardScoreA, scoreA_X, padding + topSectionHeight + midSectionHeight / 2);

    ctx.font = `bold ${params.scoreboardScoreFontSize * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('-', canvas.width / 2, padding + topSectionHeight + midSectionHeight / 2);

    ctx.font = `bold ${params.scoreboardScoreFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    const scoreB_X = canvas.width - padding - contentWidth * 0.4;
    ctx.fillText(params.scoreboardScoreB, scoreB_X, padding + topSectionHeight + midSectionHeight / 2);

    ctx.font = `bold ${params.scoreboardTeamFontSize}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(params.scoreboardTeamB, canvas.width - padding, padding + topSectionHeight + midSectionHeight / 2);

    const flagWidth = contentWidth * 0.2;
    const flagHeight = flagSectionHeight * 0.7;
    const flagY = padding + topSectionHeight + midSectionHeight + (flagSectionHeight - flagHeight) / 2;

    ctx.fillStyle = '#5555CC';
    ctx.fillRect(padding + contentWidth * 0.1, flagY, flagWidth, flagHeight);
    ctx.fillStyle = '#CC5555';
    ctx.fillRect(canvas.width - padding - contentWidth * 0.1 - flagWidth, flagY, flagWidth, flagHeight);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

export function createStadiumExtras(allParams, stadiumGroup, standObjects = [], uploadedAdTexture = null) {
    clearExtrasFromGroup(stadiumGroup, 'ExtrasGroup');
    const extrasGroup = new THREE.Group();
    extrasGroup.name = 'ExtrasGroup';

    if (allParams.showAdHoardings && allParams.stadiumType !== 'cricket') {
        const adHeight = allParams.adHoardingHeight;
        const adOffset = allParams.adHoardingOffsetFromPitch;
        const emissiveIntensity = allParams.adHoardingEmissiveIntensity || 1.0;
        let adMaterial;
        if (uploadedAdTexture) {
            adMaterial = new THREE.MeshStandardMaterial({
                map: uploadedAdTexture,
                side: THREE.DoubleSide,
                emissive: 0xffffff,
                emissiveIntensity: emissiveIntensity,
                emissiveMap: uploadedAdTexture
            });
        } else {
            if (!defaultAdMaterial || defaultAdMaterial.color.getHexString() !== allParams.adHoardingColor.substring(1) || defaultAdMaterial.emissiveIntensity !== emissiveIntensity) {
                if (defaultAdMaterial) {
                    if (defaultAdMaterial.map) defaultAdMaterial.map.dispose();
                    defaultAdMaterial.dispose();
                }
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = allParams.adHoardingColor;
                ctx.fillRect(0, 0, 256, 64);
                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.textAlign = 'center';
                ctx.fillText('STADIUM ADS', 128, 38);
                const defaultTex = new THREE.CanvasTexture(canvas);
                defaultTex.wrapS = THREE.RepeatWrapping;
                defaultTex.wrapT = THREE.RepeatWrapping;
                defaultAdMaterial = new THREE.MeshStandardMaterial({
                    map: defaultTex,
                    side: THREE.DoubleSide,
                    emissive: 0xffffff,
                    emissiveIntensity: emissiveIntensity,
                    emissiveMap: defaultTex
                });
            }
            adMaterial = defaultAdMaterial;
        }
        const l = allParams.pitchLength;
        const w = allParams.pitchWidth;
        const createAdHoarding = (width, height, position, rotationY) => {
            const geometry = new THREE.PlaneGeometry(width, height);
            const hoarding = new THREE.Mesh(geometry, adMaterial);
            hoarding.position.copy(position);
            hoarding.rotation.y = rotationY;
            if (adMaterial.map) {
                const clonedMaterial = adMaterial.clone();
                const texture = adMaterial.map.clone();
                texture.needsUpdate = true;
                const imageAspectRatio = texture.image ? texture.image.width / texture.image.height : 4;
                texture.repeat.set(width / (height * imageAspectRatio) * 2 , 1);
                clonedMaterial.map = texture;
                if (clonedMaterial.emissiveMap) {
                    const emissiveTex = clonedMaterial.emissiveMap.clone();
                    emissiveTex.needsUpdate = true;
                    emissiveTex.repeat.copy(texture.repeat);
                    clonedMaterial.emissiveMap = emissiveTex;
                }
                hoarding.material = clonedMaterial;
            }
            extrasGroup.add(hoarding);
            console.log("Added ad hoarding at:", hoarding.position);
        };
        createAdHoarding(l, adHeight, new THREE.Vector3(0, adHeight / 2 + 0.01, -w / 2 - adOffset), 0);
        createAdHoarding(l, adHeight, new THREE.Vector3(0, adHeight / 2 + 0.01, w / 2 + adOffset), Math.PI);
        createAdHoarding(w, adHeight, new THREE.Vector3(l / 2 + adOffset, adHeight / 2 + 0.01, 0), -Math.PI / 2);
        createAdHoarding(w, adHeight, new THREE.Vector3(-l / 2 - adOffset, adHeight / 2 + 0.01, 0), Math.PI / 2);
    }

    if (allParams.showScoreboard && standObjects.length > 0) {
        const targetStandNamePartial = allParams.scoreboardStandName.toLowerCase();
        const scoreboardStandData = standObjects.find(s => s.name.toLowerCase().includes(targetStandNamePartial + "standgroup"));

        if (scoreboardStandData) {
            const standNode = stadiumGroup.getObjectByName(scoreboardStandData.name);
            if (standNode) {
                const sbWidth = allParams.scoreboardWidth;
                const sbHeight = allParams.scoreboardHeight;
                const frameThick = allParams.scoreboardFrameThickness;

                const screenTexture = createMainScoreboardTexture(1024, 512, allParams);

                if (!scoreboardScreenMaterial || scoreboardScreenMaterial.map !== screenTexture || scoreboardScreenMaterial.emissiveIntensity !== allParams.scoreboardEmissiveIntensity) {
                    if (scoreboardScreenMaterial) {
                        if(scoreboardScreenMaterial.map) scoreboardScreenMaterial.map.dispose();
                        scoreboardScreenMaterial.dispose();
                    }
                    scoreboardScreenMaterial = new THREE.MeshStandardMaterial({
                        map: screenTexture,
                        side: THREE.FrontSide,
                        emissive: 0xffffff,
                        emissiveMap: screenTexture,
                        emissiveIntensity: allParams.scoreboardEmissiveIntensity,
                        metalness: 0.05,
                        roughness: 0.6
                    });
                }

                const screenGeo = new THREE.PlaneGeometry(sbWidth, sbHeight);
                const screenMesh = new THREE.Mesh(screenGeo, scoreboardScreenMaterial);
                screenMesh.name = "ScoreboardScreen";
                screenMesh.position.z = frameThick / 2 + 0.01;

                if (!scoreboardFrameMaterial || scoreboardFrameMaterial.color.getHexString() !== allParams.scoreboardFrameColor.substring(1)) {
                    if (scoreboardFrameMaterial) scoreboardFrameMaterial.dispose();
                    scoreboardFrameMaterial = new THREE.MeshStandardMaterial({
                        color: allParams.scoreboardFrameColor,
                        metalness: 0.4,
                        roughness: 0.5
                    });
                }

                const frameGeo = new THREE.BoxGeometry(sbWidth + frameThick, sbHeight + frameThick, frameThick);
                const frameMesh = new THREE.Mesh(frameGeo, scoreboardFrameMaterial);
                frameMesh.name = "ScoreboardFrame";
                frameMesh.castShadow = true;

                const scoreboardAssembly = new THREE.Group();
                scoreboardAssembly.add(frameMesh);
                scoreboardAssembly.add(screenMesh);
                scoreboardAssembly.name = `MainScoreboardOn${standNode.name}`;

                let roofTopY_localToStand = standNode.userData.totalProfileHeightAtBack;

                const individualRoofAssembly = standNode.getObjectByName(`${standNode.name.replace('Group', '')}RoofAssembly`);
                if (individualRoofAssembly && allParams.roofType === 'individual' && allParams.individualRoofEnable) {
                    const roofSlabMesh = individualRoofAssembly.getObjectByName("RoofSlab");
                    if (roofSlabMesh) {
                        const slabLocalPos = roofSlabMesh.position.clone();
                        const slabThickness = allParams.individualRoofThickness;
                        const actualRoofObjectTiltX = roofSlabMesh.rotation.x;
                        roofTopY_localToStand = slabLocalPos.y + (slabThickness / 2) * Math.cos(actualRoofObjectTiltX);
                    }
                }

                const sbTotalHeight = sbHeight + frameThick;
                const sb_assembly_base_Y_on_roof = roofTopY_localToStand + allParams.scoreboardOffsetY_fromRoof;
                const sb_assembly_center_Y = sb_assembly_base_Y_on_roof + allParams.scoreboardSupportHeight + sbTotalHeight / 2;

                const sb_assembly_local_X = standNode.userData.totalProfileDepth * 0.7 + allParams.scoreboardOffsetDepth_onRoof;
                const sb_assembly_local_Z = standNode.userData.standLength / 2 + allParams.scoreboardOffsetZ_localToStand;

                scoreboardAssembly.position.set(sb_assembly_local_X, sb_assembly_center_Y, sb_assembly_local_Z);

                const scoreboardWorldPos = new THREE.Vector3();
                scoreboardAssembly.getWorldPosition(scoreboardWorldPos);
                const pitchCenter = new THREE.Vector3(0, scoreboardWorldPos.y, 0);
                scoreboardAssembly.lookAt(standNode.worldToLocal(pitchCenter.clone()));
                scoreboardAssembly.rotation.z = 0;

                const sbSupportMat = new THREE.MeshStandardMaterial({ color: allParams.scoreboardSupportColor, metalness: 0.5, roughness: 0.5 });
                const sbSupportRadius = 0.2;
                const sbSupportActualHeight = allParams.scoreboardSupportHeight;
                const supportPlacementWidth = sbWidth * 0.7;

                for (let i = 0; i < 2; i++) {
                    const support = new THREE.Mesh(
                        new THREE.CylinderGeometry(sbSupportRadius, sbSupportRadius, sbSupportActualHeight, 12),
                        sbSupportMat
                    );
                    support.castShadow = true;
                    support.position.set(
                        (i === 0 ? -1 : 1) * supportPlacementWidth / 2,
                        -sbTotalHeight / 2 - sbSupportActualHeight / 2,
                        0
                    );
                    scoreboardAssembly.add(support);
                }

                standNode.add(scoreboardAssembly);
            }
        }
    }

    if (extrasGroup.children.length > 0) {
        if(extrasGroup.parent !== stadiumGroup) {
            stadiumGroup.add(extrasGroup);
        }
    }
}
