import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pane } from 'tweakpane';

import { generateAllStands } from './js/stadium_elements/Stands.js'; 
import { createStadiumExtras } from './js/stadium_elements/Extras.js';
import { createStadiumFloodlights, activeSpotLights, activeSpotLightHelpers } from './js/stadium_elements/Floodlights.js';
import { generateCricketStands } from './js/stadium_elements/CricketStands.js';
import { createCricketOverallRoof } from './js/stadium_elements/Roofs.js';
import { createCricketExtras } from './js/stadium_elements/CricketExtras.js';

let scene, camera, renderer, controls;
let stadiumGroup;
let customAdHoardingTexture = null;

const PARAMS = {
    
    stadiumType: 'football', 

    pitchLength: 100.6,
    pitchWidth: 64.0,   
    lineWidth: 0.15,

    cricketBoundaryRadiusX: 75,
    cricketBoundaryRadiusZ: 65,
    cricketWicketLength: 20.12,
    cricketWicketWidth: 4.0,
    cricketCreaseLineWidth: 0.05,

    // common params
    showPitch: true,
    showStands: true,
    standOffsetFromBoundary: 5,
    standFrontWallHeight: 1,
    standNumRows: 20,
    standRowStepHeight: 0.4,
    standRowStepDepth: 0.8,
    standWalkwayAtTopDepth: 2,
    standBackWallHeight: 3,
    standColor: '#888888',
    useIndividualStandSettings: false,
    stands: [
        { name: 'East Stand', show: true, offsetFromPitch: 1, frontWallHeight: 1, numRows: 20, rowStepHeight: 0.4, rowStepDepth: 0.8, walkwayAtTopDepth: 2, backWallHeight: 3, color: '#888888' },
        { name: 'West Stand', show: true, offsetFromPitch: 1, frontWallHeight: 1, numRows: 20, rowStepHeight: 0.4, rowStepDepth: 0.8, walkwayAtTopDepth: 2, backWallHeight: 3, color: '#888888' },
        { name: 'North Stand', show: true, offsetFromPitch: 1, frontWallHeight: 1, numRows: 20, rowStepHeight: 0.4, rowStepDepth: 0.8, walkwayAtTopDepth: 2, backWallHeight: 3, color: '#888888' },
        { name: 'South Stand', show: true, offsetFromPitch: 1, frontWallHeight: 1, numRows: 20, rowStepHeight: 0.4, rowStepDepth: 0.8, walkwayAtTopDepth: 2, backWallHeight: 3, color: '#888888' }
    ],

   
    numTiers: 3, 

    tier1_numRows: 20,
    tier1_frontWallHeight: 1.0,
    tier1_rowStepHeight: 0.4,
    tier1_rowStepDepth: 0.8,
    tier1_walkwayAtTopDepth: 1.5,
    tier1_backWallHeight: 0.5,   

    tier2_numRows: 15,
    tier2_frontWallHeight: 0.5,   
    tier2_rowStepHeight: 0.45,    
    tier2_rowStepDepth: 0.85,
    tier2_walkwayAtTopDepth: 2.0,  
    tier2_backWallHeight: 1.0,
    tier2_verticalOffset: 3.0,    
    tier2_horizontalOffset: -1.0, 

    tier3_numRows: 10,
    tier3_frontWallHeight: 0.5,
    tier3_rowStepHeight: 0.5,      
    tier3_rowStepDepth: 0.9,
    tier3_walkwayAtTopDepth: 1.0,
    tier3_backWallHeight: 1.5,
    tier3_verticalOffset: 3.5,    
    tier3_horizontalOffset: -1.5,

    roofType: 'individual',
    showAdHoardings: true,
    adHoardingHeight: 1,
    adHoardingOffsetFromBoundary: 1,
    adHoardingColor: '#9400ff',
    adHoardingEmissiveIntensity: 0.5,
    showScoreboard: true,
    scoreboardStandName: 'North',
    showFloodlights: true,
    floodlightTowerHeight: 38,
    numFloodlightTowersCricket: 6,
    // camera 
    cameraPreset: 'default',
    cameraPresetPositions: {
        default: { position: [0, 100, 200], target: [0, 0, 0] },
        pitch_side: { position: [150, 50, 0], target: [0, 0, 0] },
        corner: { position: [100, 80, 100], target: [0, 0, 0] },
        aerial: { position: [0, 200, 0], target: [0, 0, 0] }
    },
    standOffsetFromPitch: 5,
    standFrontWallHeight: 1,
    standNumRows: 20,
    standRowStepHeight: 0.4,
    standRowStepDepth: 0.8,
    standWalkwayAtTopDepth: 2,
    standBackWallHeight: 3,
    scoreboardWidth: 18,
    scoreboardHeight: 7,
    scoreboardFrameThickness: 0.4,
    scoreboardFrameColor: '#282828',
    scoreboardScreenColor: '#101018',
    scoreboardTextColor: '#FFFFFF',
    scoreboardTeamA: 'HOME',
    scoreboardScoreA: 0,
    scoreboardTeamB: 'AWAY',
    scoreboardScoreB: 0,
    scoreboardGameTime: "00:00",
    scoreboardTimeFontSize: 40,
    scoreboardTeamFontSize: 35,
    scoreboardScoreFontSize: 70,
    scoreboardEmissiveIntensity: 0.9,
   
    scoreboardOffsetY_fromRoof: 1.0,
    scoreboardOffsetZ_localToStand: 0,
    scoreboardOffsetDepth_onRoof: 0,
    scoreboardSupportHeight: 3,
    scoreboardSupportColor: '#444444',

    overallRoofHeight: 35,
    overallRoofOverhang: 5,
    overallRoofColor: '#777777',
    overallRoofOpacity: 0.9,
    // Individual roof params
    individualRoofEnable: true,
    individualRoofHeightOffset: 2,
    individualRoofCoverageFactor: 0.75, 
    individualRoofMinCoverage: 5,  
    individualRoofMaxCoverage: 40,   
    individualRoofTilt: Math.PI / 18,
    individualRoofThickness: 0.5,
    individualRoofColor: '#999999',
    supportColor: '#555555',

    showAdHoardings: true,
    adHoardingOffsetFromPitch: 2,
    showFloodlights: true,
    floodlightTowerColor: '#cccccc',
    numLightsPerTower: 3, 
    spotlightColorPreset: 0xfff8e1, 
    spotlightIntensity: 150,  
    spotlightAngle: Math.PI / 5, 
    spotlightPenumbra: 0.2,
    spotlightDistance: 700,  
    showSpotlightHelpers: false, 
    // day light
    timeOfDay: 'day', 
    sunColors: {
        day: '#FFFFFF',
        night: '#6a8cff', 
    },
    ambientColors: {
        day: '#888888',
        night: '#223366', 
    },
    sunIntensity: {
        day: 1.0,
        night: 0.12, 
    },
    ambientIntensity: {
        day: 0.6,
        night: 0.25, 
    },
    skyColors: {
        day: '#87CEEB',
        night: '#0a0a22', 
    },
    enableFloodlightsAtNight: true,
    
    showCricketPitch: true,
    cricketOutfieldColor: '#228B22',
    cricketBoundaryRadiusX: 75,
    cricketBoundaryRadiusZ: 65,
    cricketBoundaryRopeColor: '#FFFFFF',
    cricketBoundaryRopeRadius: 0.15,
    cricket30YardCircleRadiusX: 27.43,
    cricket30YardCircleRadiusZ: 27.43,
    cricket30YardCircleColor: '#FFFFFF',
    cricketInnerCircleLineThickness: 0.08,
    numStandSegmentsCricket: 6, 


    standOffsetFromBoundary: 10,
    numStandSegmentsCricket: 24,
    cricketStandColors: ['#8BC34A', '#9E9E9E', '#B0E0E6'], 
    numFloodlightTowersCricket: 6, 
    cricketStandColor1: '#8BC34A', 
    cricketStandColor2: '#9E9E9E',
    cricketStandColor3: '#B0E0E6',
    standColor1: '#8bc34a',
    standColor2: '#9e9e9e',
    standColor3: '#b0e0e6',
    standColors: ['#8bc34a', '#9e9e9e', '#b0e0e6'],

    cricketOverallRoofEnable: true,
    cricketOverallRoofHeightOffset: 3,
    cricketOverallRoofOuterOverhang: 10,
    cricketOverallRoofInnerOverhang: 5,
    cricketOverallRoofThickness: 0.8,
    cricketOverallRoofColor: '#778899',
    cricketOverallRoofOpacity: 0.95,
    cricketRoofNumSupports: 12,
    cricketRoofSupportRadius: 0.5,

    showCricketScoreboard: true,
    cricketScoreboardWidth: 25,
    cricketScoreboardHeight: 10,
    cricketScoreboardPositionX: 0,
    cricketScoreboardPositionY: 15,
    cricketScoreboardPositionZ: -90,
    cricketScoreboardRotationY: 0,
    cricketScoreboardScreenColor: '#0A0A1A',
    cricketScoreboardTextColor: '#FFFF00',
    cricketScoreboardEmissiveIntensity: 1.5,
    cricketTeam1Name: 'HOME',
    cricketTeam1Score: '185/3',
    cricketTeam1Overs: '(19.2)',
    cricketTeam2Name: 'AWAY',
    cricketTeam2Score: '120/7',
    cricketTeam2Overs: '(15.0)',
    cricketBatsman1Name: 'PLAYER A',
    cricketBatsman1Score: '78 (45)',
    cricketBatsman2Name: 'PLAYER B',
    cricketBatsman2Score: '32 (22)*',
    cricketBowlerName: 'BOWLER X',
    cricketBowlerFigures: '3-25 (3.2)',
    cricketStatusText: 'HOME NEEDS 10 RUNS FROM 4 BALLS',

    showCricketAdHoardings: true,
    cricketAdHoardingHeight: 2, 
    cricketAdHoardingSegments: 10,
    cricketAdHoardingRadiusOffset: 0.5,
};


let mainDirectionalLight, mainAmbientLight;
let lastTimeUpdate = Date.now();

function init() {
    console.log('Starting initialization...');
    
   
    const container = document.getElementById('container');
    if (!container) {
        console.error('Container element not found! Make sure you have a div with id="container" in your HTML');
        return;
    }
    console.log('Container found:', container);

    scene = new THREE.Scene();
    console.log('Scene created');
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 200); 
    camera.lookAt(0, 0, 0);
    console.log('Camera created and positioned');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = false;
    container.appendChild(renderer.domElement);
    console.log('Renderer created and added to container');

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    console.log('Controls initialized');

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    mainAmbientLight = ambientLight;
    console.log('Ambient light added');

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 75);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    mainDirectionalLight = directionalLight;
    console.log('Directional light added');


    stadiumGroup = new THREE.Group();
    scene.add(stadiumGroup);
    console.log('Stadium group created and added to scene');

    // controls
    const pane = new Pane({ title: 'Stadium Controls' });


    const stadiumTypeBinding = pane.addBinding(PARAMS, 'stadiumType', {
        options: { Football: 'football', Cricket: 'cricket' }
    });


    const footballParamsFolder = pane.addFolder({ title: 'Football Settings', hidden: PARAMS.stadiumType !== 'football' });
    const cricketParamsFolder = pane.addFolder({ title: 'Cricket Settings', hidden: PARAMS.stadiumType === 'football' });

    stadiumTypeBinding.on('change', (ev) => {
        footballParamsFolder.hidden = ev.value !== 'football';
        cricketParamsFolder.hidden = ev.value !== 'cricket';
        updateRoofFoldersVisibility();
        updateGeneralStandControlsVisibility();
        scoreboardFolder.hidden = ev.value !== 'football';
        regenerateStadium();
    });

    // Football pitch controls
    const footballPitchFolder = footballParamsFolder.addFolder({ title: 'Football Pitch' });
    footballPitchFolder.addBinding(PARAMS, 'pitchLength', { min: 90, max: 120, step: 0.1 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'pitchWidth', { min: 45, max: 90, step: 0.1 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'lineWidth', { min: 0.1, max: 0.2, step: 0.01 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'showPitch').on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'showStands').on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standOffsetFromPitch', { min: 1, max: 20, step: 0.5 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standFrontWallHeight', { min: 0.2, max: 3, step: 0.1 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standNumRows', { min: 5, max: 60, step: 1 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standRowStepHeight', { min: 0.2, max: 1, step: 0.05 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standRowStepDepth', { min: 0.5, max: 1.5, step: 0.05 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standWalkwayAtTopDepth', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standBackWallHeight', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
    footballPitchFolder.addBinding(PARAMS, 'standColor', { view: 'color' }).on('change', regenerateStadium);


    const cameraFolder = pane.addFolder({ title: 'Camera' });
    cameraFolder.addBinding(PARAMS, 'cameraPreset', {
        options: {
            'Default View': 'default',
            'Pitch Side': 'pitch_side',
            'Corner View': 'corner',
            'Aerial View': 'aerial'
        }
    }).on('change', (ev) => {
        const preset = PARAMS.cameraPresetPositions[ev.value];
        if (preset) {

            const startPosition = camera.position.clone();
            const startTarget = controls.target.clone();
            const endPosition = new THREE.Vector3(...preset.position);
            const endTarget = new THREE.Vector3(...preset.target);
            
            const duration = 1000; 
            const startTime = Date.now();
            
            function animateCamera() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                controls.target.lerpVectors(startTarget, endTarget, easeProgress);
                
                if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            }
            
            animateCamera();
        }
    });


    const cameraPositionFolder = cameraFolder.addFolder({ title: 'Adjust Current View' });
    cameraPositionFolder.addBinding(camera.position, 'x', { min: -300, max: 300, step: 1, label: 'X Position' });
    cameraPositionFolder.addBinding(camera.position, 'y', { min: 0, max: 300, step: 1, label: 'Y Position' });
    cameraPositionFolder.addBinding(camera.position, 'z', { min: -300, max: 300, step: 1, label: 'Z Position' });
    cameraPositionFolder.addBinding(controls.target, 'x', { min: -100, max: 100, step: 1, label: 'Target X' });
    cameraPositionFolder.addBinding(controls.target, 'y', { min: -100, max: 100, step: 1, label: 'Target Y' });
    cameraPositionFolder.addBinding(controls.target, 'z', { min: -100, max: 100, step: 1, label: 'Target Z' });


    const savePresetBtn = cameraFolder.addButton({ title: 'Save Current View' });
    savePresetBtn.on('click', () => {
        const presetName = prompt('Enter a name for this camera preset:', 'custom_preset');
        if (presetName) {
            PARAMS.cameraPresetPositions[presetName] = {
                position: [camera.position.x, camera.position.y, camera.position.z],
                target: [controls.target.x, controls.target.y, controls.target.z]
            };
            const presetBinding = cameraFolder.children[0];
            const newOptions = { ...presetBinding.options };
            newOptions[presetName] = presetName;
            presetBinding.options = newOptions;
        }
    });


    const standsFolder = pane.addFolder({ title: 'Stands Global Settings' });
    standsFolder.addBinding(PARAMS, 'showStands').on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standOffsetFromPitch', { min: 1, max: 20, step: 0.5 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standFrontWallHeight', { min: 0.2, max: 3, step: 0.1 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standNumRows', { min: 5, max: 60, step: 1 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standRowStepHeight', { min: 0.2, max: 1, step: 0.05 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standRowStepDepth', { min: 0.5, max: 1.5, step: 0.05 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standWalkwayAtTopDepth', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standBackWallHeight', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
    standsFolder.addBinding(PARAMS, 'standColor', { view: 'color' }).on('change', regenerateStadium);

    
    const tieredStandsFolder = standsFolder.addFolder({ title: 'Multi-tiered Stands' });
    tieredStandsFolder.addBinding(PARAMS, 'numTiers', { min: 1, max: 3, step: 1, label: 'Number of Tiers' })
        .on('change', (ev) => {
        
            tier1Folder.hidden = ev.value < 1; 
            tier2Folder.hidden = ev.value < 2;
            tier3Folder.hidden = ev.value < 3;
            regenerateStadium();
        });


    const tier1Folder = tieredStandsFolder.addFolder({ title: 'Tier 1 (Lower)' });
    tier1Folder.addBinding(PARAMS, 'tier1_numRows', { min: 5, max: 50, step: 1 }).on('change', regenerateStadium);
    tier1Folder.addBinding(PARAMS, 'tier1_frontWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier1Folder.addBinding(PARAMS, 'tier1_rowStepHeight', { min: 0.2, max: 1, step: 0.01 }).on('change', regenerateStadium);
    tier1Folder.addBinding(PARAMS, 'tier1_rowStepDepth', { min: 0.5, max: 1.5, step: 0.01 }).on('change', regenerateStadium);
    tier1Folder.addBinding(PARAMS, 'tier1_walkwayAtTopDepth', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier1Folder.addBinding(PARAMS, 'tier1_backWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);


    const tier2Folder = tieredStandsFolder.addFolder({ title: 'Tier 2 (Middle)', hidden: PARAMS.numTiers < 2 });
    tier2Folder.addBinding(PARAMS, 'tier2_numRows', { min: 5, max: 50, step: 1 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_frontWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_rowStepHeight', { min: 0.2, max: 1, step: 0.01 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_rowStepDepth', { min: 0.5, max: 1.5, step: 0.01 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_walkwayAtTopDepth', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_backWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_verticalOffset', { min: 0, max: 10, step: 0.1, label: 'Vert. Offset from T1' }).on('change', regenerateStadium);
    tier2Folder.addBinding(PARAMS, 'tier2_horizontalOffset', { min: -10, max: 5, step: 0.1, label: 'Horiz. Offset from T1' }).on('change', regenerateStadium);

    const tier3Folder = tieredStandsFolder.addFolder({ title: 'Tier 3 (Upper)', hidden: PARAMS.numTiers < 3 });
    tier3Folder.addBinding(PARAMS, 'tier3_numRows', { min: 5, max: 50, step: 1 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_frontWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_rowStepHeight', { min: 0.2, max: 1, step: 0.01 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_rowStepDepth', { min: 0.5, max: 1.5, step: 0.01 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_walkwayAtTopDepth', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_backWallHeight', { min: 0, max: 5, step: 0.1 }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_verticalOffset', { min: 0, max: 10, step: 0.1, label: 'Vert. Offset from T2' }).on('change', regenerateStadium);
    tier3Folder.addBinding(PARAMS, 'tier3_horizontalOffset', { min: -10, max: 5, step: 0.1, label: 'Horiz. Offset from T2' }).on('change', regenerateStadium);

    tier1Folder.hidden = PARAMS.numTiers < 1;
    tier2Folder.hidden = PARAMS.numTiers < 2;
    tier3Folder.hidden = PARAMS.numTiers < 3;


    const individualToggle = standsFolder.addBinding(PARAMS, 'useIndividualStandSettings', { label: 'Enable Individual Stands' });
    const individualStandFolders = [];
    PARAMS.stands.forEach((standParams, index) => {
        const individualStandFolder = standsFolder.addFolder({
            title: `${standParams.name} Settings`,
            expanded: false
        });
        individualStandFolder.addBinding(standParams, 'show').on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'offsetFromPitch', { min: 1, max: 20, step: 0.5 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'frontWallHeight', { min: 0.2, max: 3, step: 0.1 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'numRows', { min: 5, max: 60, step: 1 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'rowStepHeight', { min: 0.2, max: 1, step: 0.05 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'rowStepDepth', { min: 0.5, max: 1.5, step: 0.05 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'walkwayAtTopDepth', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'backWallHeight', { min: 0, max: 10, step: 0.5 }).on('change', regenerateStadium);
        individualStandFolder.addBinding(standParams, 'color', { view: 'color' }).on('change', regenerateStadium);
        individualStandFolders.push(individualStandFolder);
    });

    function updateIndividualFoldersVisibility() {
        individualStandFolders.forEach(folder => {
            folder.hidden = !PARAMS.useIndividualStandSettings;
        });
    }
    updateIndividualFoldersVisibility();
    individualToggle.on('change', updateIndividualFoldersVisibility);


    const roofFolder = pane.addFolder({ title: 'Roof Settings' });
    roofFolder.addBinding(PARAMS, 'roofType', {
        options: { None: 'none', Overall: 'overall', Individual: 'individual' }
    }).on('change', regenerateStadium);
    const overallRoofFolder = roofFolder.addFolder({ title: 'Overall Roof' });
    overallRoofFolder.addBinding(PARAMS, 'overallRoofHeight', { min: 10, max: 70, step: 1 }).on('change', regenerateStadium);
    overallRoofFolder.addBinding(PARAMS, 'overallRoofOverhang', { min: 0, max: 20, step: 0.5 }).on('change', regenerateStadium);
    overallRoofFolder.addBinding(PARAMS, 'overallRoofColor', { view: 'color' }).on('change', regenerateStadium);
    overallRoofFolder.addBinding(PARAMS, 'overallRoofOpacity', { min: 0.1, max: 1.0, step: 0.05 }).on('change', regenerateStadium);

    const individualRoofFolder = roofFolder.addFolder({ title: 'Individual Roofs' });
    individualRoofFolder.addBinding(PARAMS, 'individualRoofEnable').on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofHeightOffset', { min: -5, max: 10, step: 0.1 }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofCoverageFactor', { min: 0.1, max: 1.2, step: 0.05, label: 'Coverage Factor' }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofMinCoverage', { min: 1, max: 20, step: 0.5, label: 'Min Coverage (m)' }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofMaxCoverage', { min: 5, max: 60, step: 0.5, label: 'Max Coverage (m)' }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofTilt', { min: 0, max: Math.PI / 4, step: 0.01 }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofThickness', { min: 0.1, max: 2, step: 0.05 }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'individualRoofColor', { view: 'color' }).on('change', regenerateStadium);
    individualRoofFolder.addBinding(PARAMS, 'supportColor', { view: 'color', label: 'Support Color' }).on('change', regenerateStadium);

    function updateRoofFoldersVisibility() {
        const isCricket = PARAMS.stadiumType === 'cricket';
        roofFolder.hidden = isCricket;
        overallRoofFolder.hidden = isCricket;
        individualRoofFolder.hidden = isCricket;
        if (isCricket && PARAMS.roofType !== 'individual') {
            PARAMS.roofType = 'individual';
            regenerateStadium();
        }
    }
    updateRoofFoldersVisibility();

    const extrasFolder = pane.addFolder({ title: 'Extras' });
    const adFolder = extrasFolder.addFolder({ title: 'Ad Hoardings' });
    adFolder.addBinding(PARAMS, 'showAdHoardings').on('change', regenerateStadium);
    adFolder.addBinding(PARAMS, 'adHoardingHeight', { min: 0.5, max: 3, step: 0.05 }).on('change', regenerateStadium);
    adFolder.addBinding(PARAMS, 'adHoardingOffsetFromPitch', { min: 0.5, max: 10, step: 0.1 }).on('change', regenerateStadium);
    adFolder.addBinding(PARAMS, 'adHoardingColor', { view: 'color', label: 'Default Color' }).on('change', regenerateStadium);
    adFolder.addBinding(PARAMS, 'adHoardingEmissiveIntensity', { min: 0, max: 2, step: 0.05, label: 'LED Glow' }).on('change', regenerateStadium);


    const scoreboardFolder = extrasFolder.addFolder({ title: 'Main Scoreboard', hidden: PARAMS.stadiumType !== 'football' });
    scoreboardFolder.addBinding(PARAMS, 'showScoreboard').on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardStandName', {
        options: { North: 'North', South: 'South', East: 'East', West: 'West' }
    }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardWidth', { min: 5, max: 40, step: 0.5 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardHeight', { min: 2, max: 15, step: 0.5 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardFrameThickness', { min: 0.1, max: 2, step: 0.05 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardFrameColor', { view: 'color' }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardScreenColor', { view: 'color' }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardTextColor', { view: 'color' }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardTeamA').on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardScoreA', { min: 0, max: 99, step: 1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardTeamB').on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardScoreB', { min: 0, max: 99, step: 1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardGameTime').on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardTimeFontSize', { min: 10, max: 100, step: 1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardTeamFontSize', { min: 10, max: 100, step: 1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardScoreFontSize', { min: 20, max: 150, step: 1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardEmissiveIntensity', { min: 0, max: 3, step: 0.05 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardOffsetY_fromRoof', { min: -2, max: 15, step: 0.1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardOffsetZ_localToStand', { min: -20, max: 20, step: 0.1, label: 'Offset Along Stand' }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardOffsetDepth_onRoof', { min: 0, max: 10, step: 0.1, label: 'Offset Behind Stand' }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardSupportHeight', { min: 0, max: 10, step: 0.1 }).on('change', regenerateStadium);
    scoreboardFolder.addBinding(PARAMS, 'scoreboardSupportColor', { view: 'color', label: 'Support Color' }).on('change', regenerateStadium);
    const floodFolder = pane.addFolder({ title: 'Floodlights' });
    floodFolder.addBinding(PARAMS, 'showFloodlights').on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'floodlightTowerHeight', { min: 20, max: 60, step: 1 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'floodlightTowerColor', { view: 'color' }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'numLightsPerTower', { min: 1, max: 12, step: 1 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'spotlightColorPreset', {
        options: {
            'Warm White': 0xfff8e1,
            'Cool White': 0xe0f0ff,
            'Stadium Yellow': 0xfffeca
        }
    }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'spotlightIntensity', { min: 0.1, max: 1000, step: 1 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'spotlightAngle', { min: Math.PI/16, max: Math.PI/2, step: 0.01 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'spotlightPenumbra', { min: 0, max: 1, step: 0.01 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'spotlightDistance', { min: 100, max: 2000, step: 10 }).on('change', regenerateStadium);
    floodFolder.addBinding(PARAMS, 'showSpotlightHelpers').on('change', regenerateStadium);


    const lightingFolder = pane.addFolder({ title: 'Lighting & Time of Day' });
    lightingFolder.addBinding(PARAMS, 'timeOfDay', {
        options: { Day: 'day', Night: 'night' }
    }).on('change', updateLightingBasedOnTime);
    lightingFolder.addBinding(PARAMS, 'enableFloodlightsAtNight');


    const cricketPitchFolder = cricketParamsFolder.addFolder({ title: 'Cricket Pitch' });
    cricketPitchFolder.addBinding(PARAMS, 'cricketBoundaryRadiusX', { min: 50, max: 100, step: 1 }).on('change', regenerateStadium);
    cricketPitchFolder.addBinding(PARAMS, 'cricketBoundaryRadiusZ', { min: 50, max: 100, step: 1 }).on('change', regenerateStadium);
    cricketPitchFolder.addBinding(PARAMS, 'cricketCreaseLineWidth', { min: 0.02, max: 0.1, step: 0.01 }).on('change', regenerateStadium);
    cricketPitchFolder.addBinding(PARAMS, 'showCricketPitch').on('change', regenerateStadium);
    cricketPitchFolder.addBinding(PARAMS, 'cricketOutfieldColor', { view: 'color' }).on('change', regenerateStadium);


    const cricketStandsFolder = cricketParamsFolder.addFolder({ title: 'Cricket Stands' });
    cricketStandsFolder.addBinding(PARAMS, 'showStands').on('change', regenerateStadium);
    cricketStandsFolder.addBinding(PARAMS, 'standOffsetFromBoundary', { min: 1, max: 20, step: 0.5 }).on('change', regenerateStadium);
    

    const standColorsFolder = cricketStandsFolder.addFolder({ title: 'Stand Colors' });
    standColorsFolder.addBinding(PARAMS, 'cricketStandColor1', { view: 'color', label: 'Color 1' }).on('change', () => {
        PARAMS.cricketStandColors[0] = PARAMS.cricketStandColor1;
        regenerateStadium();
    });
    standColorsFolder.addBinding(PARAMS, 'cricketStandColor2', { view: 'color', label: 'Color 2' }).on('change', () => {
        PARAMS.cricketStandColors[1] = PARAMS.cricketStandColor2;
        regenerateStadium();
    });
    standColorsFolder.addBinding(PARAMS, 'cricketStandColor3', { view: 'color', label: 'Color 3' }).on('change', () => {
        PARAMS.cricketStandColors[2] = PARAMS.cricketStandColor3;
        regenerateStadium();
    });


    const cricketRoofFolder = cricketParamsFolder.addFolder({ title: 'Overall Roof (Cricket)' });
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofEnable', { label: 'Enable Roof' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofHeightOffset', { min: -10, max: 20, step: 0.1, label: 'Height Offset' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofOuterOverhang', { min: 0, max: 30, step: 0.1, label: 'Outer Overhang' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofInnerOverhang', { min: 0, max: 20, step: 0.1, label: 'Inner Overhang' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofThickness', { min: 0.1, max: 5, step: 0.05, label: 'Thickness' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofColor', { view: 'color', label: 'Color' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketOverallRoofOpacity', { min: 0.1, max: 1, step: 0.01, label: 'Opacity' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketRoofNumSupports', { min: 4, max: 32, step: 1, label: 'Num Supports' }).on('change', regenerateStadium);
    cricketRoofFolder.addBinding(PARAMS, 'cricketRoofSupportRadius', { min: 0.1, max: 2, step: 0.05, label: 'Support Radius' }).on('change', regenerateStadium);

 
    const hiddenAdInput = document.createElement('input');
    hiddenAdInput.type = 'file';
    hiddenAdInput.accept = 'image/png, image/jpeg, image/jpg';
    hiddenAdInput.style.display = 'none';
    document.body.appendChild(hiddenAdInput);


    const uploadBtn = adFolder.addButton({ title: 'Upload Ad Image' });
    uploadBtn.on('click', () => {
        hiddenAdInput.click();
    });

    hiddenAdInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(e.target.result, (texture) => {
                    if (customAdHoardingTexture) {
                        customAdHoardingTexture.dispose();
                    }
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.needsUpdate = true;
                    customAdHoardingTexture = texture;
                    PARAMS.adHoardingImage = null;
                    regenerateStadium();
                });
            };
            reader.readAsDataURL(file);
        }
    });

    const clearBtn = adFolder.addButton({ title: 'Clear Ad Image' });
    clearBtn.on('click', () => {
        if (customAdHoardingTexture) {
            customAdHoardingTexture.dispose();
            customAdHoardingTexture = null;
        }
        hiddenAdInput.value = '';
        regenerateStadium();
    });

    updateLightingBasedOnTime(); 
    regenerateStadium(); 
    window.addEventListener('resize', onWindowResize, false);
    animate();
    console.log('Initialization complete');
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();
    const delta = (now - lastTimeUpdate) / 1000;
    lastTimeUpdate = now;
    controls.update();
    renderer.render(scene, camera);
    console.log('Animation frame rendered'); 
}


function regenerateStadium() {
    console.log(`Regenerating stadium as type: ${PARAMS.stadiumType}`);
    while (stadiumGroup.children.length > 0) {
        const child = stadiumGroup.children[0];
        stadiumGroup.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
    }
    const oldCricketField = stadiumGroup.getObjectByName('CricketFieldGroup');
    if (oldCricketField) stadiumGroup.remove(oldCricketField);
    const toRemove = [];
    stadiumGroup.children.forEach(child => {
        if (child.geometry && (child.geometry.type === 'PlaneGeometry' || child.geometry.type === 'BoxGeometry')) {
            toRemove.push(child);
        }
        if (child.type === 'Line' || child.type === 'LineLoop') {
            toRemove.push(child);
        }
    });
    toRemove.forEach(child => stadiumGroup.remove(child));

    if (PARAMS.stadiumType === 'football') {
        if (PARAMS.showPitch) createPitch();
        if (PARAMS.showStands) generateAllStands(PARAMS, stadiumGroup);
    } else if (PARAMS.stadiumType === 'cricket') {
        createCricketField(PARAMS, stadiumGroup);
        if (PARAMS.showStands) {
            generateCricketStands(PARAMS, stadiumGroup);
            createCricketOverallRoof(PARAMS, stadiumGroup);
        }
    }
    
    let standObjects = [];
    console.log("Collecting stand objects for extras...");
    stadiumGroup.children.forEach(child => {
        if (child.isGroup && child.name && child.name.includes('StandGroup')) {
            console.log(`Found stand group: ${child.name}`, {
                userData: child.userData,
                position: child.position,
                rotation: child.rotation
            });
            if (child.userData && child.userData.standLength !== undefined) {
                standObjects.push({
                    name: child.name,
                    length: child.userData.standLength,
                    position: child.position.clone(),
                    rotation: child.rotation.clone()
                });
            } else {
                console.warn(`Stand ${child.name} missing required userData`);
            }
        }
    });
    console.log("Stand objects collected for extras:", standObjects);
    console.log("Extras parameters:", {
        showAdHoardings: PARAMS.showAdHoardings,
        adHoardingHeight: PARAMS.adHoardingHeight,
        adHoardingOffsetFromPitch: PARAMS.adHoardingOffsetFromPitch
    });

    if (PARAMS.stadiumType === 'football') {
        createStadiumExtras(PARAMS, stadiumGroup, standObjects, customAdHoardingTexture);
    } else if (PARAMS.stadiumType === 'cricket') {
        createCricketExtras(PARAMS, stadiumGroup, customAdHoardingTexture);
    }

    createStadiumFloodlights(PARAMS, stadiumGroup, scene);
    console.log('Stadium group children:', stadiumGroup.children.length);
}


function createStripedPitchTexture(width, height, numStripes = 8) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const stripeWidth = width / numStripes;
    const colorA = '#388E3C'; 
    const colorB = '#43A047'; 
    for (let i = 0; i < numStripes; i++) {
        ctx.fillStyle = (i % 2 === 0) ? colorA : colorB;
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
    }
    return new THREE.CanvasTexture(canvas);
}


function createPitch() {
    const pitchTexture = createStripedPitchTexture(1024, 512, 8); 
    pitchTexture.wrapS = THREE.ClampToEdgeWrapping;
    pitchTexture.wrapT = THREE.ClampToEdgeWrapping;
    pitchTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pitchMaterial = new THREE.MeshStandardMaterial({ map: pitchTexture, side: THREE.DoubleSide });
    const pitchGeometry = new THREE.PlaneGeometry(PARAMS.pitchLength, PARAMS.pitchWidth);
    const pitchMesh = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    stadiumGroup.add(pitchMesh);

    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    function createLine(width, height, depth, x, y, z, rotationY = 0) {
        const lineGeo = new THREE.BoxGeometry(width, height, depth);
        const line = new THREE.Mesh(lineGeo, lineMaterial);
        line.position.set(x, y + PARAMS.lineWidth / 2 + 0.001, z);
        line.rotation.y = rotationY;
        line.castShadow = false;
        stadiumGroup.add(line);
    }
    const halfL = PARAMS.pitchLength / 2;
    const halfW = PARAMS.pitchWidth / 2;

    createLine(PARAMS.pitchLength, PARAMS.lineWidth, PARAMS.lineWidth, 0, 0, halfW);
    createLine(PARAMS.pitchLength, PARAMS.lineWidth, PARAMS.lineWidth, 0, 0, -halfW);
    createLine(PARAMS.lineWidth, PARAMS.lineWidth, PARAMS.pitchWidth, halfL, 0, 0);
    createLine(PARAMS.lineWidth, PARAMS.lineWidth, PARAMS.pitchWidth, -halfL, 0, 0);
    createLine(PARAMS.lineWidth, PARAMS.lineWidth, PARAMS.pitchWidth, 0, 0, 0);

    const centerCircleRadius = 9.15;
    const segments = 32;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * centerCircleRadius, 0.01 + PARAMS.lineWidth/2, Math.sin(theta) * centerCircleRadius));
    }
    const circleLineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const circleLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const centerCircleLine = new THREE.LineLoop(circleLineGeometry, circleLineMaterial);
    stadiumGroup.add(centerCircleLine);

    const penaltyAreaLength = 16.5;
    const penaltyAreaWidth = 40.32;
    const goalAreaLength = 5.5;
    const goalAreaWidth = 18.32;
    let paX = halfL - penaltyAreaLength;
    createLine(penaltyAreaLength, PARAMS.lineWidth, PARAMS.lineWidth, halfL - penaltyAreaLength / 2, 0, penaltyAreaWidth / 2);
    createLine(penaltyAreaLength, PARAMS.lineWidth, PARAMS.lineWidth, halfL - penaltyAreaLength / 2, 0, -penaltyAreaWidth / 2);
    createLine(PARAMS.lineWidth, PARAMS.lineWidth, penaltyAreaWidth, paX, 0, 0);
    paX = -halfL + penaltyAreaLength;
    createLine(penaltyAreaLength, PARAMS.lineWidth, PARAMS.lineWidth, -halfL + penaltyAreaLength / 2, 0, penaltyAreaWidth / 2);
    createLine(penaltyAreaLength, PARAMS.lineWidth, PARAMS.lineWidth, -halfL + penaltyAreaLength / 2, 0, -penaltyAreaWidth / 2);
    createLine(PARAMS.lineWidth, PARAMS.lineWidth, penaltyAreaWidth, paX, 0, 0);

    const goalDepth = 2;
    const goalWidth = 7.32;
    const goalHeight = 2.44;
    const goalPostRadius = 0.06;
    const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    function createGoal(xOffset) {
        const goalGroup = new THREE.Group();
        const postGeo = new THREE.CylinderGeometry(goalPostRadius, goalPostRadius, goalHeight, 12);
        const leftPost = new THREE.Mesh(postGeo, goalMaterial);
        leftPost.position.set(xOffset, goalHeight / 2, goalWidth / 2);
        leftPost.castShadow = true;
        goalGroup.add(leftPost);
        const rightPost = new THREE.Mesh(postGeo, goalMaterial);
        rightPost.position.set(xOffset, goalHeight / 2, -goalWidth / 2);
        rightPost.castShadow = true;
        goalGroup.add(rightPost);
        const crossbarGeo = new THREE.CylinderGeometry(goalPostRadius, goalPostRadius, goalWidth, 12);
        const crossbar = new THREE.Mesh(crossbarGeo, goalMaterial);
        crossbar.position.set(xOffset, goalHeight, 0);
        crossbar.rotation.x = Math.PI / 2;
        crossbar.castShadow = true;
        goalGroup.add(crossbar);
        stadiumGroup.add(goalGroup);
    }
    createGoal(halfL + goalPostRadius);
    createGoal(-halfL - goalPostRadius);

    const flagPoleHeight = 1.5;
    const flagPoleRadius = 0.05;
    const flagHeight = 0.4;
    const flagWidth = 0.5;
    const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cornerFlagMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const cornerFlagPositions = [
        { x: halfL, z:  halfW, poleRotationOffset: 0 },
        { x: halfL, z: -halfW, poleRotationOffset: Math.PI / 2 },
        { x: -halfL, z: -halfW, poleRotationOffset: Math.PI },
        { x: -halfL, z:  halfW, poleRotationOffset: -Math.PI / 2 }
    ];
    cornerFlagPositions.forEach(pos => {
        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(flagPoleRadius, flagPoleRadius, flagPoleHeight, 8),
            flagPoleMaterial
        );
        flagPole.position.set(pos.x, flagPoleHeight / 2 + 0.01, pos.z);
        flagPole.castShadow = true;
        stadiumGroup.add(flagPole);

        const flagShape = new THREE.Shape();
        flagShape.moveTo(0, 0);
        flagShape.lineTo(flagWidth, flagHeight / 2);
        flagShape.lineTo(0, flagHeight);
        flagShape.lineTo(0, 0);
        const flagGeometry = new THREE.ShapeGeometry(flagShape);
        const flagMesh = new THREE.Mesh(flagGeometry, cornerFlagMaterial);
        flagMesh.position.set(
            pos.x,
            flagPoleHeight - (flagHeight / 2) + 0.01,
            pos.z
        );
        flagMesh.rotation.y = pos.poleRotationOffset;
        flagMesh.castShadow = true;
        stadiumGroup.add(flagMesh);
    });

    const arcRadius = 1.0;
    const arcSegments = 16;
    const arcLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    function createCornerArc(centerX, centerZ, startAngle, endAngle) {
        const arcPoints = [];
        for (let i = 0; i <= arcSegments; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / arcSegments);
            arcPoints.push(new THREE.Vector3(
                centerX + Math.cos(angle) * arcRadius,
                0.01 + PARAMS.lineWidth/2,
                centerZ + Math.sin(angle) * arcRadius
            ));
        }
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arc = new THREE.Line(arcGeometry, arcLineMaterial);
        stadiumGroup.add(arc);
    }

    createCornerArc(halfL, halfW, Math.PI, 3 * Math.PI / 2);
    createCornerArc(halfL, -halfW, Math.PI / 2, Math.PI);
    createCornerArc(-halfL, -halfW, 0, Math.PI / 2);
    createCornerArc(-halfL, halfW, 3 * Math.PI / 2, 2 * Math.PI);
}

function getLightingPreset(time) {
    if (time >= 5 && time < 7) return 'dawn';
    if (time >= 7 && time < 18) return 'day';
    if (time >= 18 && time < 20) return 'dusk';
    return 'night';
}

function lerpColor(colorA, colorB, factor) {
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);
    return cA.lerp(cB, factor);
}

function lerpFloat(valA, valB, factor) {
    return valA * (1 - factor) + valB * factor;
}

function updateLightingBasedOnTime() {
    const isDay = PARAMS.timeOfDay === 'day';
    const sunColor = isDay ? PARAMS.sunColors.day : PARAMS.sunColors.night;
    const ambientColor = isDay ? PARAMS.ambientColors.day : PARAMS.ambientColors.night;
    const skyColor = isDay ? PARAMS.skyColors.day : PARAMS.skyColors.night;
    const sunIntensity = isDay ? PARAMS.sunIntensity.day : PARAMS.sunIntensity.night;
    const ambientIntensity = isDay ? PARAMS.ambientIntensity.day : PARAMS.ambientIntensity.night;

    if (mainDirectionalLight) {
        mainDirectionalLight.color.set(sunColor);
        mainDirectionalLight.intensity = sunIntensity;
        mainDirectionalLight.position.set(50, isDay ? 100 : 60, isDay ? 75 : 40);
    }
    if (mainAmbientLight) {
        mainAmbientLight.color.set(ambientColor);
        mainAmbientLight.intensity = ambientIntensity;
    }
    if (scene) {
        scene.background.set(skyColor);
        if (scene.fog) {
            scene.fog.color.set(skyColor);
            scene.fog.near = isDay ? 150 : 100;
            scene.fog.far = isDay ? 500 : 300;
        } else {
            scene.fog = new THREE.Fog(skyColor, isDay ? 150 : 100, isDay ? 500 : 300);
        }
    }

    
    const nightIntensity = PARAMS.spotlightIntensity;
    const dayIntensity = nightIntensity * 0.01;
    if (PARAMS.showFloodlights && activeSpotLights.length > 0) {
        let newIntensity;
        let helpersVisible;
        if (isDay || !PARAMS.enableFloodlightsAtNight) {
            newIntensity = dayIntensity;
            helpersVisible = false;
        } else {
            newIntensity = nightIntensity;
            helpersVisible = PARAMS.showSpotlightHelpers;
        }
        activeSpotLights.forEach(light => {
            light.intensity = newIntensity;
            light.angle = PARAMS.spotlightAngle;
            light.penumbra = PARAMS.spotlightPenumbra;
            light.distance = PARAMS.spotlightDistance;
        });
        activeSpotLightHelpers.forEach(helper => {
            helper.visible = helpersVisible;
            if (helpersVisible) helper.update();
        });
    } else if (activeSpotLights.length > 0) {
        activeSpotLights.forEach(light => {
            light.intensity = 0;
        });
        activeSpotLightHelpers.forEach(helper => {
            helper.visible = false;
        });
    }
}


function createCricketField(params, parentGroup) {
    if (!params.showCricketPitch) return;
    const fieldGroup = new THREE.Group();
    fieldGroup.name = "CricketFieldGroup";

    const outfieldShape = new THREE.Shape();
    const xRadius = params.cricketBoundaryRadiusX + 20;
    const zRadius = params.cricketBoundaryRadiusZ + 20;
    outfieldShape.ellipse(0, 0, xRadius, zRadius, 0, 2 * Math.PI, false, 0);
    const outfieldGeometry = new THREE.ShapeGeometry(outfieldShape, 64);
    const outfieldMaterial = new THREE.MeshStandardMaterial({
        color: params.cricketOutfieldColor,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.0
    });
    const outfieldMesh = new THREE.Mesh(outfieldGeometry, outfieldMaterial);
    outfieldMesh.rotation.x = -Math.PI / 2;
    outfieldMesh.receiveShadow = true;
    outfieldMesh.name = "Outfield";
    fieldGroup.add(outfieldMesh);

    const wicketMaterial = new THREE.MeshStandardMaterial({
        color: '#CDA680', 
        roughness: 0.7,
        metalness: 0.0
    });
    const wicketGeo = new THREE.PlaneGeometry(params.cricketWicketLength, params.cricketWicketWidth);
    const wicketMesh = new THREE.Mesh(wicketGeo, wicketMaterial);
    wicketMesh.rotation.x = -Math.PI / 2;
    wicketMesh.position.y = 0.01;
    wicketMesh.receiveShadow = true;
    wicketMesh.name = "WicketArea";
    fieldGroup.add(wicketMesh);

    function createLineSegment(length, width, x, z, yPos = 0.02, rotationY = 0, color = '#FFFFFF') { 
        const lineGeo = new THREE.BoxGeometry(length, params.cricketCreaseLineWidth, width);
        const lineMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity:0.2 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(x, yPos + params.cricketCreaseLineWidth / 2, z);
        line.rotation.y = rotationY;
        fieldGroup.add(line);
    }

    const halfWicketL = params.cricketWicketLength / 2;
    const halfWicketW = params.cricketWicketWidth / 2;
    const poppingCreaseLength = Math.max(params.cricketWicketWidth, 2.64);
    createLineSegment(params.cricketCreaseLineWidth, poppingCreaseLength, halfWicketL, 0);
    createLineSegment(params.cricketCreaseLineWidth, poppingCreaseLength, -halfWicketL, 0);
    const bowlingCreaseXOffset = 1.22;
    createLineSegment(params.cricketCreaseLineWidth, params.cricketWicketWidth, halfWicketL - bowlingCreaseXOffset, 0);
    createLineSegment(params.cricketCreaseLineWidth, params.cricketWicketWidth, -halfWicketL + bowlingCreaseXOffset, 0);
    const returnCreaseLength = 2.44;
    createLineSegment(returnCreaseLength, params.cricketCreaseLineWidth, halfWicketL + returnCreaseLength / 2 - bowlingCreaseXOffset, halfWicketW, 0, Math.PI / 2);
    createLineSegment(returnCreaseLength, params.cricketCreaseLineWidth, halfWicketL + returnCreaseLength / 2 - bowlingCreaseXOffset, -halfWicketW, 0, Math.PI / 2);
    createLineSegment(returnCreaseLength, params.cricketCreaseLineWidth, -halfWicketL - returnCreaseLength / 2 + bowlingCreaseXOffset, halfWicketW, 0, Math.PI / 2);
    createLineSegment(returnCreaseLength, params.cricketCreaseLineWidth, -halfWicketL - returnCreaseLength / 2 + bowlingCreaseXOffset, -halfWicketW, 0, Math.PI / 2);

    const circlePoints = [];
    const circleSegments = 64;
    const yCircle = 0.025;
    for (let i = 0; i <= circleSegments; i++) {
        const angle = (i / circleSegments) * Math.PI * 2;
        circlePoints.push(new THREE.Vector3(
            Math.cos(angle) * params.cricket30YardCircleRadiusX,
            yCircle,
            Math.sin(angle) * params.cricket30YardCircleRadiusZ
        ));
    }
    const numDashes = 64;
    const ellipseCurveForDashes = new THREE.EllipseCurve(
        0, 0,
        params.cricket30YardCircleRadiusX, params.cricket30YardCircleRadiusZ,
        0, 2 * Math.PI, false, 0
    );
    const curvePoints = ellipseCurveForDashes.getPoints(numDashes * 2);
    for(let i = 0; i < curvePoints.length - 1; i += 2) {
        if(i+1 >= curvePoints.length) break;
        const p1 = curvePoints[i];
        const p2 = curvePoints[i+1];
        const actualDashLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        const dashGeo = new THREE.BoxGeometry(actualDashLength, params.cricketInnerCircleLineThickness, params.cricketInnerCircleLineThickness);
        const dashMat = new THREE.MeshStandardMaterial({color: params.cricket30YardCircleColor, emissive: params.cricket30YardCircleColor, emissiveIntensity:0.2});
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set( (p1.x + p2.x) / 2, yCircle + params.cricketInnerCircleLineThickness / 2, (p1.y + p2.y) / 2 );
        dash.lookAt(new THREE.Vector3(p2.x, yCircle, p2.y));
        dash.rotateY(Math.PI/2);
        fieldGroup.add(dash);
    }

    const boundaryRopeMaterial = new THREE.MeshStandardMaterial({
        color: params.cricketBoundaryRopeColor,
        roughness: 0.5,
        metalness: 0.1
    });
    const boundaryPoints3D = [];
    const boundarySegments = 128;
    const yBoundary = params.cricketBoundaryRopeRadius + 0.01;
    for (let i = 0; i <= boundarySegments; i++) {
        const angle = (i / boundarySegments) * Math.PI * 2;
        boundaryPoints3D.push(new THREE.Vector3(
            Math.cos(angle) * params.cricketBoundaryRadiusX,
            yBoundary,
            Math.sin(angle) * params.cricketBoundaryRadiusZ
        ));
    }
    const boundaryCurve3D = new THREE.CatmullRomCurve3(boundaryPoints3D, true);
    const boundaryGeo = new THREE.TubeGeometry(boundaryCurve3D, boundarySegments, params.cricketBoundaryRopeRadius, 12, true);
    const boundaryRopeMesh = new THREE.Mesh(boundaryGeo, boundaryRopeMaterial);
    boundaryRopeMesh.name = "BoundaryRope";
    fieldGroup.add(boundaryRopeMesh);

    parentGroup.add(fieldGroup);
}

function updateGeneralStandControlsVisibility() {
    const isCricket = PARAMS.stadiumType === 'cricket';
    if (typeof individualToggle !== 'undefined' && Array.isArray(individualStandFolders)) {
        individualToggle.hidden = isCricket;
        individualStandFolders.forEach(folder => { folder.hidden = isCricket; });
    }

}

init();