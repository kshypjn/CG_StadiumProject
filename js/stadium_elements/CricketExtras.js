import * as THREE from 'three';

function _createCricketScoreboardTexture(params, widthPx = 1024, heightPx = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = params.cricketScoreboardScreenColor || '#0A0A1A';
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.fillStyle = params.cricketScoreboardTextColor || '#FFFF00';
    ctx.textBaseline = 'middle';
    const baseFontSize = heightPx / 15;

    ctx.font = `bold ${baseFontSize * 1.2}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${params.cricketTeam1Name}: ${params.cricketTeam1Score} ${params.cricketTeam1Overs}`, widthPx * 0.05, heightPx * 0.15);

    ctx.font = `bold ${baseFontSize * 1.2}px sans-serif`;
    ctx.fillText(`${params.cricketTeam2Name}: ${params.cricketTeam2Score} ${params.cricketTeam2Overs}`, widthPx * 0.05, heightPx * 0.3);

    ctx.font = `${baseFontSize * 0.9}px sans-serif`;
    ctx.fillText(`BAT 1: ${params.cricketBatsman1Name} - ${params.cricketBatsman1Score}`, widthPx * 0.05, heightPx * 0.5);
    ctx.fillText(`BAT 2: ${params.cricketBatsman2Name} - ${params.cricketBatsman2Score}`, widthPx * 0.05, heightPx * 0.6);

    ctx.textAlign = 'right';
    ctx.fillText(`BOWLER: ${params.cricketBowlerName}`, widthPx * 0.95, heightPx * 0.5);
    ctx.fillText(`FIG: ${params.cricketBowlerFigures}`, widthPx * 0.95, heightPx * 0.6);

    ctx.font = `italic bold ${baseFontSize * 1.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(params.cricketStatusText, widthPx / 2, heightPx * 0.85);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function _createCricketScoreboardObject(params, texture) {
    const scoreboardGroup = new THREE.Group();
    scoreboardGroup.name = "CricketScoreboard";

    const screenGeo = new THREE.PlaneGeometry(params.cricketScoreboardWidth, params.cricketScoreboardHeight);
    const screenMat = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.FrontSide,
        metalness: 0.2,
        roughness: 1.0,
        transparent: true,
        opacity: 1
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);

    const frameThickness = params.scoreboardFrameThickness || 0.5;
    const frameColor = params.scoreboardFrameColor || '#333333';
    const frameGeo = new THREE.BoxGeometry(
        params.cricketScoreboardWidth + frameThickness,
        params.cricketScoreboardHeight + frameThickness,
        frameThickness
    );
    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.4, roughness: 0.6 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -frameThickness / 2;

    scoreboardGroup.add(frameMesh);
    scoreboardGroup.add(screenMesh);

    scoreboardGroup.position.set(
        params.cricketScoreboardPositionX,
        params.cricketScoreboardPositionY + params.cricketScoreboardHeight / 2,
        params.cricketScoreboardPositionZ
    );
    scoreboardGroup.rotation.y = params.cricketScoreboardRotationY;

    return scoreboardGroup;
}

function _createCricketAdHoardings(params, parentGroup, uploadedTexture) {
    if (!params.showCricketAdHoardings) return;

    const hoardingsGroup = new THREE.Group();
    hoardingsGroup.name = "CricketAdHoardings";

    const radiusOffsetX = params.cricketBoundaryRadiusX + params.cricketAdHoardingRadiusOffset;
    const radiusOffsetZ = params.cricketBoundaryRadiusZ + params.cricketAdHoardingRadiusOffset;
    const height = params.cricketAdHoardingHeight;

    const tubeRadius = 0.1;
    const tubeSegments = 64;
    const tubePathSegments = 128;

    const pathPoints = [];
    for (let i = 0; i <= tubePathSegments; i++) {
        const angle = (i / tubePathSegments) * Math.PI * 2;
        pathPoints.push(new THREE.Vector3(
            Math.cos(angle) * radiusOffsetX,
            height / 2,
            Math.sin(angle) * radiusOffsetZ
        ));
    }

    const path = new THREE.CatmullRomCurve3(pathPoints, true);
    const tubeGeometry = new THREE.TubeGeometry(path, tubePathSegments, tubeRadius, 16, true);

    let adMaterial;
    if (uploadedTexture) {
        adMaterial = new THREE.MeshStandardMaterial({
            map: uploadedTexture.clone(),
            side: THREE.DoubleSide,
            emissive: 0xffffff,
            emissiveMap: uploadedTexture.clone(),
            emissiveIntensity: params.adHoardingEmissiveIntensity || 0.5,
            metalness: 0.0,
            roughness: 0.8
        });
        adMaterial.map.needsUpdate = true;
        if (adMaterial.emissiveMap) adMaterial.emissiveMap.needsUpdate = true;
    } else {
        adMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(params.adHoardingColor || '#AA00FF'),
            emissive: new THREE.Color(params.adHoardingColor || '#AA00FF'),
            emissiveIntensity: params.adHoardingEmissiveIntensity || 0.5,
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 0.8
        });
    }

    const tubeMesh = new THREE.Mesh(tubeGeometry, adMaterial);
    hoardingsGroup.add(tubeMesh);
    parentGroup.add(hoardingsGroup);
}

export function createCricketExtras(allParams, stadiumGroup, uploadedAdTexture) {
    console.log("Creating Cricket Extras...");

    if (allParams.showCricketScoreboard) {
        const scoreboardTexture = _createCricketScoreboardTexture(allParams);
        const scoreboardObject = _createCricketScoreboardObject(allParams, scoreboardTexture);
        stadiumGroup.add(scoreboardObject);
    }

    if (allParams.showCricketAdHoardings) {
        _createCricketAdHoardings(allParams, stadiumGroup, uploadedAdTexture);
    }
} 