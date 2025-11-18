// Advanced 3D Missile Launch Simulator - Fixed and Enhanced
class MissileSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.missile = null;
        this.launcher = null;
        this.terrain = null;
        this.water = null;
        this.objects = [];
        this.vehicles = [];
        this.particles = [];
        this.explosions = [];
        this.clouds = [];
        
        // Simulation state
        this.isLaunched = false;
        this.targetMode = false;
        this.targetPosition = null;
        this.missionStartTime = 0;
        this.lastImpactTime = null;
        this.maxDistance = 0;
        
        // Physics parameters - FIXED: Using THREE.Vector3
        this.gravity = 9.81;
        this.airDensity = 1.225;
        this.windSpeed = new THREE.Vector3(Math.random() * 5 - 2.5, 0, Math.random() * 5 - 2.5);
        
        // Camera controls
        this.cameraMode = 'free';
        this.mouseX = 0;
        this.mouseY = 0;
        this.keys = {};
        this.cameraDistance = 50;
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Scenario data with realistic terrain variations
        this.scenarios = {
            grassland: { name: 'Grassland', color: 0x4F7942, fogColor: 0x87CEEB, windMultiplier: 1.0 },
            city: { name: 'City', color: 0x5C5C5C, fogColor: 0xA0A0A0, windMultiplier: 0.7 },
            desert: { name: 'Desert', color: 0xD2691E, fogColor: 0xF4A460, windMultiplier: 1.5 },
            sea: { name: 'Sea', color: 0x006994, fogColor: 0x4682B4, windMultiplier: 2.0 },
            forest: { name: 'Forest', color: 0x2F4F2F, fogColor: 0x556B2F, windMultiplier: 0.5 },
            mountains: { name: 'Mountains', color: 0x8B7D6B, fogColor: 0xB0C4DE, windMultiplier: 2.5 }
        };
        
        this.currentScenario = 'grassland';
        this.currentTimeOfDay = 'day';
        
        // Enhanced missile configuration
        this.missileConfig = {
            type: 'light',
            warheadType: 'he',
            warheadSize: 'medium',
            angle: 45,
            initialVelocity: 100,
            coneAngle: 0
        };
        
        this.missileSpecs = {
            light: { mass: 500, drag: 0.25, length: 3, radius: 0.1, color: 0xC0C0C0, maxVel: 300 },
            medium: { mass: 1000, drag: 0.3, length: 4, radius: 0.15, color: 0x808080, maxVel: 250 },
            heavy: { mass: 2000, drag: 0.35, length: 5, radius: 0.2, color: 0x404040, maxVel: 200 }
        };
        
        this.warheadSpecs = {
            he: { blastRadius: 50, particles: 150, color: 0xFF4500, shockwave: true },
            frag: { blastRadius: 75, particles: 300, color: 0xFF6347, shockwave: true },
            inc: { blastRadius: 60, particles: 200, color: 0xFF8C00, fire: true },
            nuke: { blastRadius: 300, particles: 800, color: 0xFFFFFF, mushroom: true }
        };
        
        this.sizeMultipliers = {
            small: 0.5, medium: 1.0, large: 1.5, xl: 2.0
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupLighting();
        this.setupTerrain();
        this.setupLauncher();
        this.setupControls();
        this.setupEventListeners();
        this.loadScenario(this.currentScenario);
        this.animate();
        
        console.log('3D Missile Simulator initialized successfully');
    }
    
    setupScene() {
        // Create scene with enhanced fog
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0003);
        
        // Create camera with better positioning
        const viewportElement = document.getElementById('viewport');
        const width = viewportElement.clientWidth;
        const height = viewportElement.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 8000);
        this.camera.position.set(50, 25, 50);
        this.camera.lookAt(0, 0, 0);
        
        // Create enhanced renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        
        viewportElement.appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Enhanced ambient lighting
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        
        // Main directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xFFFFDD, 1.2);
        this.directionalLight.position.set(200, 200, 100);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 1000;
        this.directionalLight.shadow.camera.left = -400;
        this.directionalLight.shadow.camera.right = 400;
        this.directionalLight.shadow.camera.top = 400;
        this.directionalLight.shadow.camera.bottom = -400;
        this.scene.add(this.directionalLight);
        
        // Secondary fill light
        this.fillLight = new THREE.DirectionalLight(0x8BB5FF, 0.3);
        this.fillLight.position.set(-50, 50, -50);
        this.scene.add(this.fillLight);
    }
    
    setupTerrain() {
        // Create highly detailed terrain
        const geometry = new THREE.PlaneGeometry(3000, 3000, 300, 300);
        const vertices = geometry.attributes.position.array;
        
        // Create realistic height map
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Multiple octaves of noise for realistic terrain
            const height = Math.sin(x * 0.005) * Math.cos(z * 0.005) * 15 +
                          Math.sin(x * 0.01) * Math.sin(z * 0.01) * 8 +
                          Math.sin(x * 0.02) * Math.cos(z * 0.02) * 4 +
                          Math.random() * 2;
            
            vertices[i + 1] = Math.max(-2, height);
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Enhanced terrain material
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x4F7942,
            wireframe: false
        });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }
    
    setupLauncher() {
        const launcherGroup = new THREE.Group();
        
        // Enhanced launcher base with details
        const baseGeometry = new THREE.CylinderGeometry(4, 5, 3, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1.5;
        base.castShadow = true;
        launcherGroup.add(base);
        
        // Multiple launcher tubes
        for (let i = 0; i < 4; i++) {
            const tubeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
            const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            tube.position.set(Math.cos(angle) * 2, 9, Math.sin(angle) * 2);
            tube.castShadow = true;
            launcherGroup.add(tube);
        }
        
        // Support structures
        for (let i = 0; i < 8; i++) {
            const supportGeometry = new THREE.BoxGeometry(0.3, 8, 0.3);
            const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            support.position.set(Math.cos(angle) * 3.5, 4, Math.sin(angle) * 3.5);
            support.castShadow = true;
            launcherGroup.add(support);
        }
        
        this.launcher = launcherGroup;
        this.scene.add(launcherGroup);
    }
    
    createMissile() {
        const spec = this.missileSpecs[this.missileConfig.type];
        const missileGroup = new THREE.Group();
        
        // Enhanced missile body with details
        const bodyGeometry = new THREE.CylinderGeometry(spec.radius, spec.radius * 0.8, spec.length, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: spec.color,
            shininess: 100,
            specular: 0x444444
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        missileGroup.add(body);
        
        // Warhead section
        const warheadGeometry = new THREE.ConeGeometry(spec.radius, spec.length * 0.4, 16);
        const warheadMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000, shininess: 100 });
        const warhead = new THREE.Mesh(warheadGeometry, warheadMaterial);
        warhead.position.y = spec.length * 0.7;
        warhead.castShadow = true;
        missileGroup.add(warhead);
        
        // Control fins
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.1, spec.length * 0.4, spec.radius * 1.5);
            const finMaterial = new THREE.MeshLambertMaterial({ color: spec.color });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            fin.position.set(
                Math.cos(angle) * spec.radius * 1.2,
                -spec.length * 0.25,
                Math.sin(angle) * spec.radius * 1.2
            );
            fin.castShadow = true;
            missileGroup.add(fin);
        }
        
        // Engine nozzles
        for (let i = 0; i < 4; i++) {
            const nozzleGeometry = new THREE.ConeGeometry(spec.radius * 0.3, spec.radius * 0.8, 8);
            const nozzleMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
            const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            nozzle.position.set(
                Math.cos(angle) * spec.radius * 0.7,
                -spec.length * 0.6,
                Math.sin(angle) * spec.radius * 0.7
            );
            nozzle.rotation.x = Math.PI;
            nozzle.castShadow = true;
            missileGroup.add(nozzle);
        }
        
        // Initial position and setup
        missileGroup.position.copy(this.launcher.position);
        missileGroup.position.y = 15;
        
        // Enhanced physics properties
        missileGroup.userData = {
            velocity: new THREE.Vector3(),
            mass: spec.mass,
            drag: spec.drag,
            launched: false,
            startTime: 0,
            trail: [],
            fuel: 1.0,
            burnTime: 3.0,
            thrust: spec.mass * 15
        };
        
        return missileGroup;
    }
    
    loadScenario(scenarioName) {
        // Clear existing objects
        this.objects.forEach(obj => {
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            this.scene.remove(obj);
        });
        
        this.vehicles.forEach(vehicle => {
            vehicle.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            this.scene.remove(vehicle);
        });
        
        this.objects = [];
        this.vehicles = [];
        
        const scenario = this.scenarios[scenarioName];
        
        // Update environment settings
        this.terrain.material.color.setHex(scenario.color);
        this.scene.fog.color.setHex(scenario.fogColor);
        this.renderer.setClearColor(scenario.fogColor);
        
        // Update wind based on scenario
        this.windSpeed.multiplyScalar(scenario.windMultiplier);
        
        // Load scenario-specific content
        switch (scenarioName) {
            case 'grassland':
                this.createGrasslandScene();
                break;
            case 'city':
                this.createCityScene();
                break;
            case 'desert':
                this.createDesertScene();
                break;
            case 'sea':
                this.createSeaScene();
                break;
            case 'forest':
                this.createForestScene();
                break;
            case 'mountains':
                this.createMountainScene();
                break;
        }
        
        this.addAtmosphericEffects();
    }
    
    createGrasslandScene() {
        // Dense tree coverage with variety
        const treeTypes = ['oak', 'pine', 'birch'];
        for (let i = 0; i < 80; i++) {
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            const tree = this.createTree(treeType);
            tree.position.set(
                (Math.random() - 0.5) * 2400,
                0,
                (Math.random() - 0.5) * 2400
            );
            this.objects.push(tree);
            this.scene.add(tree);
        }
        
        // Rural buildings with variety
        const buildingTypes = ['farmhouse', 'barn', 'silo', 'shed'];
        for (let i = 0; i < 25; i++) {
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            const building = this.createRuralBuilding(buildingType);
            building.position.set(
                (Math.random() - 0.5) * 2000,
                0,
                (Math.random() - 0.5) * 2000
            );
            this.objects.push(building);
            this.scene.add(building);
        }
        
        // Mixed vehicles
        const vehicleTypes = ['tractor', 'truck', 'car'];
        for (let i = 0; i < 35; i++) {
            const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const vehicle = this.createVehicle(vehicleType);
            this.vehicles.push(vehicle);
            this.scene.add(vehicle);
        }
        
        // Add roads
        this.createRoads(15);
    }
    
    createCityScene() {
        // Dense urban landscape
        for (let i = 0; i < 120; i++) {
            const building = this.createSkyscraper();
            // Cluster buildings in city blocks
            const blockX = Math.floor(Math.random() * 8) * 150 - 600;
            const blockZ = Math.floor(Math.random() * 8) * 150 - 600;
            building.position.set(
                blockX + (Math.random() - 0.5) * 120,
                0,
                blockZ + (Math.random() - 0.5) * 120
            );
            this.objects.push(building);
            this.scene.add(building);
        }
        
        // Heavy traffic
        const cityVehicles = ['car', 'bus', 'truck', 'taxi'];
        for (let i = 0; i < 100; i++) {
            const vehicleType = cityVehicles[Math.floor(Math.random() * cityVehicles.length)];
            const vehicle = this.createVehicle(vehicleType);
            this.vehicles.push(vehicle);
            this.scene.add(vehicle);
        }
        
        // Street grid
        this.createUrbanGrid();
    }
    
    createDesertScene() {
        // Create dunes
        this.modifyTerrainForDesert();
        
        // Sparse vegetation
        for (let i = 0; i < 40; i++) {
            const cactus = this.createCactus();
            cactus.position.set(
                (Math.random() - 0.5) * 2400,
                0,
                (Math.random() - 0.5) * 2400
            );
            this.objects.push(cactus);
            this.scene.add(cactus);
        }
        
        // Desert outposts
        for (let i = 0; i < 8; i++) {
            const outpost = this.createDesertOutpost();
            outpost.position.set(
                (Math.random() - 0.5) * 2000,
                0,
                (Math.random() - 0.5) * 2000
            );
            this.objects.push(outpost);
            this.scene.add(outpost);
        }
        
        // Desert vehicles
        const desertVehicles = ['jeep', 'atv', 'truck'];
        for (let i = 0; i < 18; i++) {
            const vehicleType = desertVehicles[Math.floor(Math.random() * desertVehicles.length)];
            const vehicle = this.createVehicle(vehicleType);
            this.vehicles.push(vehicle);
            this.scene.add(vehicle);
        }
    }
    
    createSeaScene() {
        // Create animated water
        this.createWater();
        
        // Replace launcher with naval vessel
        this.scene.remove(this.launcher);
        this.launcher = this.createNavalLauncher();
        this.scene.add(this.launcher);
        
        // Various ships and boats
        const shipTypes = ['destroyer', 'carrier', 'cruiser', 'boat', 'yacht'];
        for (let i = 0; i < 45; i++) {
            const shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
            const ship = this.createShip(shipType);
            ship.position.set(
                (Math.random() - 0.5) * 2400,
                0,
                (Math.random() - 0.5) * 2400
            );
            this.vehicles.push(ship);
            this.scene.add(ship);
        }
        
        // Coastal features
        this.addCoastalFeatures();
    }
    
    createForestScene() {
        // Dense forest with undergrowth
        const treeTypes = ['pine', 'fir', 'spruce', 'oak'];
        for (let i = 0; i < 200; i++) {
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            const tree = this.createTree(treeType);
            tree.position.set(
                (Math.random() - 0.5) * 2400,
                0,
                (Math.random() - 0.5) * 2400
            );
            this.objects.push(tree);
            this.scene.add(tree);
        }
        
        // Forest facilities
        for (let i = 0; i < 12; i++) {
            const facility = this.createForestFacility();
            facility.position.set(
                (Math.random() - 0.5) * 2000,
                0,
                (Math.random() - 0.5) * 2000
            );
            this.objects.push(facility);
            this.scene.add(facility);
        }
        
        // Forest vehicles
        const forestVehicles = ['truck', 'atv', 'ranger'];
        for (let i = 0; i < 20; i++) {
            const vehicleType = forestVehicles[Math.floor(Math.random() * forestVehicles.length)];
            const vehicle = this.createVehicle(vehicleType);
            this.vehicles.push(vehicle);
            this.scene.add(vehicle);
        }
    }
    
    createMountainScene() {
        // Dramatically modify terrain for mountains
        this.modifyTerrainForMountains();
        
        // Mountain vegetation
        const alpineTrees = ['pine', 'fir'];
        for (let i = 0; i < 60; i++) {
            const treeType = alpineTrees[Math.floor(Math.random() * alpineTrees.length)];
            const tree = this.createTree(treeType);
            tree.position.set(
                (Math.random() - 0.5) * 2200,
                Math.random() * 20,
                (Math.random() - 0.5) * 2200
            );
            this.objects.push(tree);
            this.scene.add(tree);
        }
        
        // Mountain facilities
        for (let i = 0; i < 6; i++) {
            const facility = this.createMountainBase();
            facility.position.set(
                (Math.random() - 0.5) * 1800,
                Math.random() * 15,
                (Math.random() - 0.5) * 1800
            );
            this.objects.push(facility);
            this.scene.add(facility);
        }
        
        // Mountain vehicles
        const mountainVehicles = ['jeep', 'atv'];
        for (let i = 0; i < 12; i++) {
            const vehicleType = mountainVehicles[Math.floor(Math.random() * mountainVehicles.length)];
            const vehicle = this.createVehicle(vehicleType);
            this.vehicles.push(vehicle);
            this.scene.add(vehicle);
        }
    }
    
    createTree(type) {
        const treeGroup = new THREE.Group();
        let trunkHeight, trunkRadius, foliageSize, foliageColor, trunkColor;
        
        switch (type) {
            case 'oak':
                trunkHeight = 6 + Math.random() * 4;
                trunkRadius = 0.4 + Math.random() * 0.2;
                foliageSize = 4 + Math.random() * 2;
                foliageColor = 0x228B22;
                trunkColor = 0x8B4513;
                break;
            case 'pine':
                trunkHeight = 8 + Math.random() * 6;
                trunkRadius = 0.3 + Math.random() * 0.1;
                foliageSize = 3 + Math.random() * 1;
                foliageColor = 0x006400;
                trunkColor = 0x654321;
                break;
            case 'birch':
                trunkHeight = 5 + Math.random() * 3;
                trunkRadius = 0.2 + Math.random() * 0.1;
                foliageSize = 3 + Math.random() * 1.5;
                foliageColor = 0x32CD32;
                trunkColor = 0xF5F5DC;
                break;
            default:
                trunkHeight = 5; trunkRadius = 0.3; foliageSize = 3; foliageColor = 0x228B22; trunkColor = 0x8B4513;
        }
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 12);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: trunkColor });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Foliage
        if (type === 'pine') {
            // Create cone-shaped foliage for pine
            const foliageGeometry = new THREE.ConeGeometry(foliageSize, trunkHeight * 0.8, 12);
            const foliageMaterial = new THREE.MeshLambertMaterial({ color: foliageColor });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = trunkHeight + (trunkHeight * 0.4);
            foliage.castShadow = true;
            treeGroup.add(foliage);
        } else {
            // Spherical foliage for other trees
            const foliageGeometry = new THREE.SphereGeometry(foliageSize, 12, 8);
            const foliageMaterial = new THREE.MeshLambertMaterial({ color: foliageColor });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = trunkHeight + foliageSize * 0.5;
            foliage.castShadow = true;
            treeGroup.add(foliage);
        }
        
        treeGroup.userData = { type: 'tree', destructible: true, health: 100 };
        return treeGroup;
    }
    
    createVehicle(type) {
        const vehicle = new THREE.Group();
        let size, color, speed, wheels;
        
        switch (type) {
            case 'car':
                size = { x: 4, y: 1.5, z: 2 };
                color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
                speed = 0.3 + Math.random() * 0.2;
                wheels = 4;
                break;
            case 'truck':
                size = { x: 8, y: 3, z: 2.5 };
                color = new THREE.Color().setHSL(Math.random(), 0.6, 0.4);
                speed = 0.15 + Math.random() * 0.1;
                wheels = 6;
                break;
            case 'bus':
                size = { x: 12, y: 3.5, z: 2.5 };
                color = new THREE.Color(0.9, 0.9, 0.1);
                speed = 0.12 + Math.random() * 0.08;
                wheels = 6;
                break;
            case 'tractor':
                size = { x: 5, y: 2.5, z: 2 };
                color = new THREE.Color(0.1, 0.7, 0.1);
                speed = 0.08 + Math.random() * 0.06;
                wheels = 4;
                break;
            case 'jeep':
                size = { x: 4.5, y: 2, z: 2.2 };
                color = new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.8, 0.4);
                speed = 0.25 + Math.random() * 0.15;
                wheels = 4;
                break;
            default:
                size = { x: 4, y: 1.5, z: 2 };
                color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
                speed = 0.2; wheels = 4;
        }
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size.y / 2 + 0.5;
        body.castShadow = true;
        vehicle.add(body);
        
        // Wheels with proper positioning
        const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        const wheelPositions = wheels === 6 ? [
            [-size.x * 0.35, 0, -size.z * 0.7], [size.x * 0.35, 0, -size.z * 0.7],
            [-size.x * 0.35, 0, 0], [size.x * 0.35, 0, 0],
            [-size.x * 0.35, 0, size.z * 0.7], [size.x * 0.35, 0, size.z * 0.7]
        ] : [
            [-size.x * 0.4, 0, -size.z * 0.7], [size.x * 0.4, 0, -size.z * 0.7],
            [-size.x * 0.4, 0, size.z * 0.7], [size.x * 0.4, 0, size.z * 0.7]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1] + 0.6, pos[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            vehicle.add(wheel);
        });
        
        // Headlights for night mode
        if (this.currentTimeOfDay === 'night') {
            const headlightGeometry = new THREE.SphereGeometry(0.15, 8, 6);
            const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });
            
            for (let i = 0; i < 2; i++) {
                const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
                headlight.position.set(
                    (i === 0 ? -1 : 1) * size.x * 0.35,
                    size.y * 0.4 + 0.5,
                    size.z * 0.6
                );
                vehicle.add(headlight);
            }
        }
        
        // Random starting position
        vehicle.position.set(
            (Math.random() - 0.5) * 2400,
            0,
            (Math.random() - 0.5) * 2400
        );
        
        vehicle.userData = {
            type: 'vehicle',
            destructible: true,
            health: 100,
            speed: speed,
            direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            pathChange: 0
        };
        
        return vehicle;
    }
    
    createSkyscraper() {
        const height = 40 + Math.random() * 120;
        const width = 15 + Math.random() * 25;
        const depth = 15 + Math.random() * 25;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.6, 0.1 + Math.random() * 0.2, 0.3 + Math.random() * 0.4)
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2;
        building.castShadow = true;
        building.userData = { type: 'building', destructible: true, health: 500 };
        
        return building;
    }
    
    createShip(type) {
        const ship = new THREE.Group();
        let size, color, speed;
        
        switch (type) {
            case 'destroyer':
                size = { x: 35, y: 8, z: 12 };
                color = 0x708090;
                speed = 0.08;
                break;
            case 'carrier':
                size = { x: 80, y: 12, z: 20 };
                color = 0x696969;
                speed = 0.04;
                break;
            case 'cruiser':
                size = { x: 45, y: 10, z: 15 };
                color = 0x2F4F4F;
                speed = 0.06;
                break;
            case 'boat':
                size = { x: 15, y: 4, z: 6 };
                color = 0x4682B4;
                speed = 0.15;
                break;
            default:
                size = { x: 25, y: 6, z: 10 };
                color = 0x4169E1;
                speed = 0.1;
        }
        
        // Hull
        const hullGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const hullMaterial = new THREE.MeshLambertMaterial({ color: color });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = size.y / 2;
        hull.castShadow = true;
        ship.add(hull);
        
        // Superstructure
        if (type !== 'boat') {
            const superGeometry = new THREE.BoxGeometry(size.x * 0.4, size.y * 0.8, size.z * 0.6);
            const superMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
            const superstructure = new THREE.Mesh(superGeometry, superMaterial);
            superstructure.position.set(0, size.y + size.y * 0.4, 0);
            superstructure.castShadow = true;
            ship.add(superstructure);
        }
        
        ship.userData = {
            type: 'ship',
            destructible: true,
            health: type === 'carrier' ? 1000 : type === 'destroyer' ? 500 : 200,
            speed: speed,
            direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            bobOffset: Math.random() * Math.PI * 2
        };
        
        return ship;
    }
    
    createWater() {
        const waterGeometry = new THREE.PlaneGeometry(4000, 4000, 200, 200);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        
        this.water = new THREE.Mesh(waterGeometry, waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -1;
        this.scene.add(this.water);
        
        // Animate water
        this.water.userData = { time: 0 };
    }
    
    createNavalLauncher() {
        const launcherGroup = new THREE.Group();
        
        // Aircraft carrier hull
        const hullGeometry = new THREE.BoxGeometry(100, 15, 30);
        const hullMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 7.5;
        hull.castShadow = true;
        launcherGroup.add(hull);
        
        // Flight deck
        const deckGeometry = new THREE.BoxGeometry(95, 2, 28);
        const deckMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = 16;
        launcherGroup.add(deck);
        
        // Superstructure
        const superGeometry = new THREE.BoxGeometry(20, 25, 15);
        const superMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const superstructure = new THREE.Mesh(superGeometry, superMaterial);
        superstructure.position.set(30, 30, 0);
        superstructure.castShadow = true;
        launcherGroup.add(superstructure);
        
        // Missile launch silos
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 2; j++) {
                const siloGeometry = new THREE.CylinderGeometry(1, 1, 15, 12);
                const siloMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
                const silo = new THREE.Mesh(siloGeometry, siloMaterial);
                silo.position.set(
                    (i - 3.5) * 8,
                    25,
                    (j - 0.5) * 8
                );
                silo.castShadow = true;
                launcherGroup.add(silo);
            }
        }
        
        return launcherGroup;
    }
    
    addAtmosphericEffects() {
        // Clear existing clouds
        this.clouds.forEach(cloud => this.scene.remove(cloud));
        this.clouds = [];
        
        // Add clouds based on scenario
        const cloudCount = this.currentScenario === 'desert' ? 15 : 40;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 4000,
                80 + Math.random() * 40,
                (Math.random() - 0.5) * 4000
            );
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    createCloud() {
        const cloud = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const cloudGeometry = new THREE.SphereGeometry(12 + Math.random() * 8, 12, 8);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.2
            });
            const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudPart.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 30
            );
            cloud.add(cloudPart);
        }
        
        cloud.userData = {
            speed: 0.05 + Math.random() * 0.1,
            direction: new THREE.Vector3(1, 0, Math.random() * 0.2 - 0.1).normalize()
        };
        
        return cloud;
    }
    
    updateTimeOfDay(timeOfDay) {
        this.currentTimeOfDay = timeOfDay;
        
        switch (timeOfDay) {
            case 'day':
                this.directionalLight.intensity = 1.2;
                this.directionalLight.color.setHex(0xFFFFDD);
                this.ambientLight.intensity = 0.4;
                break;
            case 'evening':
                this.directionalLight.intensity = 0.8;
                this.directionalLight.color.setHex(0xFF8C00);
                this.ambientLight.intensity = 0.25;
                break;
            case 'night':
                this.directionalLight.intensity = 0.15;
                this.directionalLight.color.setHex(0x4169E1);
                this.ambientLight.intensity = 0.1;
                break;
        }
    }
    
    launch() {
        if (this.isLaunched) return;
        
        this.missile = this.createMissile();
        this.scene.add(this.missile);
        
        const spec = this.missileSpecs[this.missileConfig.type];
        const angleRad = (this.missileConfig.angle * Math.PI) / 180;
        const coneRad = (this.missileConfig.coneAngle * Math.PI) / 180;
        
        // Calculate initial velocity with enhanced physics
        const baseVelocity = new THREE.Vector3(
            Math.sin(coneRad) * Math.cos(Math.random() * 2 * Math.PI),
            Math.sin(angleRad),
            Math.cos(angleRad) + Math.sin(coneRad) * Math.sin(Math.random() * 2 * Math.PI)
        );
        baseVelocity.multiplyScalar(this.missileConfig.initialVelocity);
        
        this.missile.userData.velocity.copy(baseVelocity);
        this.missile.userData.launched = true;
        this.missile.userData.startTime = Date.now();
        
        // Orient missile properly
        this.missile.lookAt(
            this.missile.position.x + baseVelocity.x,
            this.missile.position.y + baseVelocity.y,
            this.missile.position.z + baseVelocity.z
        );
        
        this.isLaunched = true;
        this.missionStartTime = Date.now();
        this.maxDistance = 0;
        
        // Create spectacular launch effects
        this.createLaunchEffects();
        
        document.getElementById('launchBtn').disabled = true;
        console.log('Missile launched successfully');
    }
    
    createLaunchEffects() {
        const launchPosition = this.launcher.position.clone();
        launchPosition.y += 15;
        
        // Main launch blast
        for (let i = 0; i < 100; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 8, 6),
                new THREE.MeshBasicMaterial({ 
                    color: i < 50 ? 0xFF4500 : 0xFFFFFF,
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            particle.position.copy(launchPosition);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    Math.random() * 15,
                    (Math.random() - 0.5) * 20
                ),
                life: 1.0,
                decay: 0.015 + Math.random() * 0.01
            };
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
        
        // Smoke clouds
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const smoke = new THREE.Mesh(
                    new THREE.SphereGeometry(2 + Math.random() * 2, 8, 6),
                    new THREE.MeshBasicMaterial({ 
                        color: 0x808080,
                        transparent: true,
                        opacity: 0.6
                    })
                );
                
                smoke.position.copy(launchPosition);
                smoke.position.x += (Math.random() - 0.5) * 10;
                smoke.position.z += (Math.random() - 0.5) * 10;
                
                smoke.userData = {
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 5,
                        5 + Math.random() * 5,
                        (Math.random() - 0.5) * 5
                    ),
                    life: 1.0,
                    decay: 0.005,
                    expansion: 0.05
                };
                
                this.particles.push(smoke);
                this.scene.add(smoke);
            }, i * 100);
        }
    }
    
    updatePhysics(deltaTime) {
        if (!this.missile || !this.missile.userData.launched) return;
        
        const missile = this.missile;
        const userData = missile.userData;
        const position = missile.position;
        const velocity = userData.velocity;
        
        // Enhanced gravity calculation
        const altitude = Math.max(0, position.y);
        const earthRadius = 6371000;
        const gravityAtAltitude = this.gravity * Math.pow(earthRadius / (earthRadius + altitude), 2);
        
        // Atmospheric effects
        let airDensity = this.airDensity * Math.exp(-altitude / 8400);
        if (this.currentScenario === 'mountains') airDensity *= 0.7;
        if (this.currentScenario === 'sea') airDensity *= 1.1;
        
        // Enhanced drag calculation
        const speed = velocity.length();
        const dragCoefficient = userData.drag;
        const crossSectionalArea = Math.PI * Math.pow(this.missileSpecs[this.missileConfig.type].radius, 2);
        const dragForce = 0.5 * airDensity * speed * speed * dragCoefficient * crossSectionalArea;
        
        // Apply drag
        if (speed > 0) {
            const dragVector = velocity.clone().normalize().multiplyScalar(-dragForce / userData.mass);
            velocity.add(dragVector.multiplyScalar(deltaTime));
        }
        
        // Thrust phase
        if (userData.fuel > 0) {
            const thrustVector = new THREE.Vector3(0, 1, 0);
            thrustVector.applyQuaternion(missile.quaternion);
            const thrustForce = userData.thrust / userData.mass;
            velocity.add(thrustVector.multiplyScalar(thrustForce * deltaTime));
            
            userData.fuel -= deltaTime / userData.burnTime;
            
            // Create engine trail during thrust
            this.createEngineTrail(position);
        }
        
        // Apply gravity
        velocity.y -= gravityAtAltitude * deltaTime;
        
        // Enhanced wind effects
        const windEffect = this.windSpeed.clone();
        windEffect.multiplyScalar((1 - airDensity / this.airDensity) * 0.3);
        velocity.add(windEffect.multiplyScalar(deltaTime));
        
        // Update position
        const deltaPosition = velocity.clone().multiplyScalar(deltaTime);
        position.add(deltaPosition);
        
        // Orient missile in flight direction
        if (velocity.length() > 1) {
            const futurePosition = position.clone().add(velocity.clone().normalize().multiplyScalar(5));
            missile.lookAt(futurePosition);
        }
        
        // Enhanced missile trail
        this.createMissileTrail(position);
        
        // Update distance tracking
        const currentDistance = position.distanceTo(this.launcher.position);
        if (currentDistance > this.maxDistance) {
            this.maxDistance = currentDistance;
        }
        
        // Ground collision detection
        if (position.y <= this.getTerrainHeightAtPosition(position.x, position.z)) {
            this.explode();
        }
    }
    
    createMissileTrail(position) {
        if (!this.missile || !this.missile.userData.trail) this.missile.userData.trail = [];
        
        // Remove old trail parts
        if (this.missile.userData.trail.length > 50) {
            const oldTrail = this.missile.userData.trail.shift();
            this.scene.remove(oldTrail);
        }
        
        const trailParticle = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 4),
            new THREE.MeshBasicMaterial({ 
                color: this.missile.userData.fuel > 0 ? 0xFF6600 : 0xFF4500,
                transparent: true,
                opacity: 0.8
            })
        );
        trailParticle.position.copy(position);
        this.missile.userData.trail.push(trailParticle);
        this.scene.add(trailParticle);
    }
    
    createEngineTrail(position) {
        for (let i = 0; i < 3; i++) {
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(0.4 + Math.random() * 0.2, 6, 4),
                new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.5 ? 0xFF4500 : 0xFFFFFF,
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            flame.position.copy(position);
            flame.position.y -= 2 + Math.random() * 2;
            flame.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    -5 - Math.random() * 5,
                    (Math.random() - 0.5) * 5
                ),
                life: 1.0,
                decay: 0.05
            };
            
            this.particles.push(flame);
            this.scene.add(flame);
        }
    }
    
    getTerrainHeightAtPosition(x, z) {
        // Simple height calculation - in real implementation would sample terrain geometry
        const height = Math.sin(x * 0.005) * Math.cos(z * 0.005) * 15 +
                      Math.sin(x * 0.01) * Math.sin(z * 0.01) * 8;
        return Math.max(-2, height);
    }
    
    explode() {
        if (!this.missile) return;
        
        const explosionPosition = this.missile.position.clone();
        explosionPosition.y = Math.max(0, this.getTerrainHeightAtPosition(explosionPosition.x, explosionPosition.z));
        
        const warheadSpec = this.warheadSpecs[this.missileConfig.warheadType];
        const sizeMultiplier = this.sizeMultipliers[this.missileConfig.warheadSize];
        const blastRadius = warheadSpec.blastRadius * sizeMultiplier;
        
        console.log(`Explosion: ${this.missileConfig.warheadType} ${this.missileConfig.warheadSize} at distance ${this.maxDistance.toFixed(1)}m`);
        
        // Create spectacular explosion
        this.createExplosion(explosionPosition, warheadSpec, sizeMultiplier);
        
        // Destroy objects in blast radius
        this.destroyObjectsInRadius(explosionPosition, blastRadius);
        
        // Clean up missile
        this.scene.remove(this.missile);
        if (this.missile.userData.trail) {
            this.missile.userData.trail.forEach(trail => this.scene.remove(trail));
        }
        this.missile = null;
        
        this.lastImpactTime = Date.now();
        this.isLaunched = false;
        
        document.getElementById('launchBtn').disabled = false;
    }
    
    createExplosion(position, warheadSpec, sizeMultiplier) {
        // Multiple expanding shockwaves
        for (let ring = 0; ring < 6; ring++) {
            setTimeout(() => {
                const explosionGeometry = new THREE.RingGeometry(0, 1, 32);
                const explosionMaterial = new THREE.MeshBasicMaterial({
                    color: warheadSpec.color,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                });
                const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
                explosion.position.copy(position);
                explosion.rotation.x = -Math.PI / 2;
                
                explosion.userData = {
                    startTime: Date.now(),
                    maxRadius: (60 + ring * 20) * sizeMultiplier,
                    duration: 3000,
                    ring: ring
                };
                
                this.explosions.push(explosion);
                this.scene.add(explosion);
            }, ring * 150);
        }
        
        // Massive particle explosion
        const particleCount = warheadSpec.particles * sizeMultiplier;
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.3, 6, 4),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(
                        Math.random() * 0.15, 
                        0.8 + Math.random() * 0.2, 
                        0.4 + Math.random() * 0.6
                    ),
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            particle.position.copy(position);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 80,
                Math.random() * 60 + 20,
                (Math.random() - 0.5) * 80
            ).multiplyScalar(sizeMultiplier);
            
            particle.userData = {
                velocity: velocity,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.004
            };
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
        
        // Nuclear mushroom cloud effect
        if (warheadSpec.mushroom) {
            setTimeout(() => {
                this.createMushroomCloud(position, sizeMultiplier);
            }, 1000);
        }
    }
    
    createMushroomCloud(position, sizeMultiplier) {
        const mushroomGroup = new THREE.Group();
        
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(
            10 * sizeMultiplier, 
            5 * sizeMultiplier, 
            50 * sizeMultiplier, 
            16
        );
        const stemMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.7
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 25 * sizeMultiplier;
        mushroomGroup.add(stem);
        
        // Cap
        const capGeometry = new THREE.SphereGeometry(25 * sizeMultiplier, 16, 12);
        const capMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 60 * sizeMultiplier;
        mushroomGroup.add(cap);
        
        mushroomGroup.position.copy(position);
        mushroomGroup.userData = {
            startTime: Date.now(),
            duration: 15000,
            expansion: 0
        };
        
        this.explosions.push(mushroomGroup);
        this.scene.add(mushroomGroup);
    }
    
    destroyObjectsInRadius(center, radius) {
        let destroyedCount = 0;
        
        [...this.objects, ...this.vehicles].forEach(obj => {
            if (obj.userData && obj.userData.destructible) {
                const distance = obj.position.distanceTo(center);
                if (distance < radius) {
                    // Create destruction effect
                    this.createDestructionEffect(obj.position, obj.userData.type);
                    
                    // Remove object
                    this.scene.remove(obj);
                    
                    // Remove from arrays
                    const objIndex = this.objects.indexOf(obj);
                    if (objIndex > -1) this.objects.splice(objIndex, 1);
                    
                    const vehicleIndex = this.vehicles.indexOf(obj);
                    if (vehicleIndex > -1) this.vehicles.splice(vehicleIndex, 1);
                    
                    destroyedCount++;
                }
            }
        });
        
        console.log(`Destroyed ${destroyedCount} objects in blast radius`);
    }
    
    createDestructionEffect(position, objectType) {
        const debrisCount = objectType === 'building' ? 30 : objectType === 'vehicle' ? 20 : 15;
        
        for (let i = 0; i < debrisCount; i++) {
            const debris = new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.3 + Math.random() * 0.5, 
                    0.3 + Math.random() * 0.5, 
                    0.3 + Math.random() * 0.5
                ),
                new THREE.MeshLambertMaterial({ 
                    color: objectType === 'tree' ? 0x8B4513 : 
                           objectType === 'vehicle' ? 0x444444 : 0x808080 
                })
            );
            
            debris.position.copy(position);
            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 30,
                    Math.random() * 25 + 10,
                    (Math.random() - 0.5) * 30
                ),
                life: 1.0,
                decay: 0.008,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.2,
                    y: (Math.random() - 0.5) * 0.2,
                    z: (Math.random() - 0.5) * 0.2
                }
            };
            
            this.particles.push(debris);
            this.scene.add(debris);
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            if (userData.velocity) {
                particle.position.add(userData.velocity.clone().multiplyScalar(deltaTime));
                userData.velocity.y -= this.gravity * deltaTime;
                
                // Air resistance
                userData.velocity.multiplyScalar(0.99);
            }
            
            if (userData.rotationSpeed) {
                particle.rotation.x += userData.rotationSpeed.x;
                particle.rotation.y += userData.rotationSpeed.y;
                particle.rotation.z += userData.rotationSpeed.z;
            }
            
            if (userData.expansion) {
                particle.scale.multiplyScalar(1 + userData.expansion);
            }
            
            userData.life -= userData.decay;
            
            if (particle.material.opacity !== undefined) {
                particle.material.opacity = Math.max(0, userData.life);
            }
            
            if (userData.life <= 0 || particle.position.y < -20) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const userData = explosion.userData;
            const elapsed = Date.now() - userData.startTime;
            
            if (elapsed < userData.duration) {
                const progress = elapsed / userData.duration;
                
                if (explosion.geometry && explosion.geometry.type === 'RingGeometry') {
                    // Expanding ring explosion
                    const currentRadius = userData.maxRadius * Math.min(1, progress * 2);
                    explosion.geometry.dispose();
                    explosion.geometry = new THREE.RingGeometry(currentRadius * 0.7, currentRadius, 32);
                    explosion.material.opacity = Math.max(0, 1 - progress);
                } else if (userData.expansion !== undefined) {
                    // Mushroom cloud expansion
                    const scale = 1 + progress * 0.5;
                    explosion.scale.set(scale, scale, scale);
                    explosion.material.opacity = Math.max(0, 1 - progress * 0.7);
                }
            } else {
                this.scene.remove(explosion);
                this.explosions.splice(i, 1);
            }
        }
    }
    
    updateVehicles(deltaTime) {
        this.vehicles.forEach(vehicle => {
            const userData = vehicle.userData;
            
            if (userData.direction && userData.speed) {
                // Enhanced movement with bobbing for ships
                const movement = userData.direction.clone().multiplyScalar(userData.speed);
                vehicle.position.add(movement);
                
                // Ship bobbing effect
                if (userData.type === 'ship' && this.currentScenario === 'sea') {
                    userData.bobOffset += deltaTime * 2;
                    vehicle.position.y = Math.sin(userData.bobOffset) * 0.5;
                    vehicle.rotation.z = Math.sin(userData.bobOffset * 1.1) * 0.05;
                }
                
                // Orient vehicle in travel direction
                if (movement.length() > 0) {
                    vehicle.lookAt(
                        vehicle.position.x + userData.direction.x,
                        vehicle.position.y,
                        vehicle.position.z + userData.direction.z
                    );
                }
                
                // Random direction changes
                userData.pathChange += deltaTime;
                if (userData.pathChange > 8 + Math.random() * 12) {
                    userData.direction.x += (Math.random() - 0.5) * 0.3;
                    userData.direction.z += (Math.random() - 0.5) * 0.3;
                    userData.direction.normalize();
                    userData.pathChange = 0;
                }
                
                // Keep vehicles in reasonable bounds
                if (Math.abs(vehicle.position.x) > 1400 || Math.abs(vehicle.position.z) > 1400) {
                    userData.direction.multiplyScalar(-1);
                }
            }
        });
    }
    
    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            const userData = cloud.userData;
            
            if (userData.direction && userData.speed) {
                const movement = userData.direction.clone().multiplyScalar(userData.speed);
                cloud.position.add(movement);
                
                // Wrap clouds around
                if (cloud.position.x > 2000) cloud.position.x = -2000;
                if (cloud.position.x < -2000) cloud.position.x = 2000;
                if (cloud.position.z > 2000) cloud.position.z = -2000;
                if (cloud.position.z < -2000) cloud.position.z = 2000;
            }
        });
    }
    
    updateWater(deltaTime) {
        if (this.water && this.water.userData) {
            this.water.userData.time += deltaTime;
            const vertices = this.water.geometry.attributes.position.array;
            
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const z = vertices[i + 2];
                vertices[i + 1] = Math.sin(x * 0.01 + this.water.userData.time) * 
                                Math.cos(z * 0.01 + this.water.userData.time) * 0.5;
            }
            
            this.water.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    updateStats() {
        const currentTime = Date.now();
        let altitude = 0;
        let velocity = 0;
        let distance = 0;
        let time = 0;
        
        if (this.missile && this.missile.userData.launched) {
            altitude = Math.max(0, this.missile.position.y);
            velocity = this.missile.userData.velocity.length();
            distance = this.missile.position.distanceTo(this.launcher.position);
            time = (currentTime - this.missionStartTime) / 1000;
        } else if (this.lastImpactTime && this.missionStartTime > 0) {
            altitude = 0;
            velocity = 0;
            distance = this.maxDistance;
            time = (this.lastImpactTime - this.missionStartTime) / 1000;
        }
        
        document.getElementById('altitude').textContent = `${altitude.toFixed(1)} m`;
        document.getElementById('velocity').textContent = `${velocity.toFixed(1)} m/s`;
        document.getElementById('distance').textContent = `${distance.toFixed(1)} m`;
        document.getElementById('time').textContent = `${time.toFixed(1)} s`;
    }
    
    setupControls() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (event) => this.onMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('wheel', (event) => this.onMouseWheel(event));
        canvas.addEventListener('click', (event) => this.onCanvasClick(event));
        
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    }
    
    onMouseDown(event) {
        if (event.button === 0) {
            this.mouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onMouseMove(event) {
        if (this.cameraMode === 'free' && this.mouseDown) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onMouseUp() {
        this.mouseDown = false;
    }
    
    onMouseWheel(event) {
        if (this.cameraMode === 'free') {
            const delta = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(delta);
            
            const distance = this.camera.position.length();
            if (distance < 10) {
                this.camera.position.normalize().multiplyScalar(10);
            } else if (distance > 2000) {
                this.camera.position.normalize().multiplyScalar(2000);
            }
        }
        event.preventDefault();
    }
    
    onCanvasClick(event) {
        if (this.targetMode) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
            
            const intersects = raycaster.intersectObject(this.terrain);
            
            if (intersects.length > 0) {
                this.targetPosition = intersects[0].point;
                this.calculateTrajectoryToTarget();
                console.log('Target set at:', this.targetPosition);
            }
        }
    }
    
    calculateTrajectoryToTarget() {
        if (!this.targetPosition) return;
        
        const launcherPos = this.launcher.position;
        const targetPos = this.targetPosition;
        
        const dx = targetPos.x - launcherPos.x;
        const dz = targetPos.z - launcherPos.z;
        const dy = targetPos.y - launcherPos.y;
        
        const range = Math.sqrt(dx * dx + dz * dz);
        const g = this.gravity;
        
        // Calculate optimal trajectory
        let bestAngle = 45;
        let bestVelocity = 200;
        let minError = Infinity;
        
        for (let angle = 15; angle <= 75; angle += 2) {
            const angleRad = (angle * Math.PI) / 180;
            const velocity = Math.sqrt((g * range) / Math.sin(2 * angleRad));
            
            if (velocity > 0 && velocity < 500) {
                const calculatedRange = (velocity * velocity * Math.sin(2 * angleRad)) / g;
                const error = Math.abs(calculatedRange - range);
                
                if (error < minError) {
                    minError = error;
                    bestAngle = angle;
                    bestVelocity = velocity;
                }
            }
        }
        
        // Update UI
        document.getElementById('angle').value = bestAngle;
        document.getElementById('angleValue').textContent = `${bestAngle}°`;
        const clampedVelocity = Math.min(500, Math.max(50, bestVelocity));
        document.getElementById('initialVelocity').value = clampedVelocity;
        document.getElementById('velocityValue').textContent = `${clampedVelocity.toFixed(0)} m/s`;
        
        this.missileConfig.angle = bestAngle;
        this.missileConfig.initialVelocity = clampedVelocity;
    }
    
    onKeyDown(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON' || event.target.tagName === 'LABEL') return;
        
        this.keys[event.code] = true;
        
        const moveSpeed = 8;
        const rotateSpeed = 0.05;
        
        switch (event.code) {
            case 'KeyW':
                this.camera.position.z -= moveSpeed;
                break;
            case 'KeyS':
                this.camera.position.z += moveSpeed;
                break;
            case 'KeyA':
                this.camera.position.x -= moveSpeed;
                break;
            case 'KeyD':
                this.camera.position.x += moveSpeed;
                break;
            case 'KeyQ':
                this.camera.position.y += moveSpeed;
                break;
            case 'KeyE':
                this.camera.position.y -= moveSpeed;
                break;
            case 'Equal':
            case 'NumpadAdd':
                this.camera.position.multiplyScalar(0.9);
                break;
            case 'Minus':
            case 'NumpadSubtract':
                this.camera.position.multiplyScalar(1.1);
                break;
        }
        
        if (this.camera.position.y < 2) this.camera.position.y = 2;
        
        event.preventDefault();
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    updateCamera() {
        if (this.cameraMode === 'follow' && this.missile) {
            const offset = new THREE.Vector3(0, 20, 40);
            this.camera.position.copy(this.missile.position).add(offset);
            this.camera.lookAt(this.missile.position);
        } else if (this.cameraMode === 'top' && this.missile) {
            this.camera.position.copy(this.missile.position);
            this.camera.position.y += 100;
            this.camera.lookAt(this.missile.position.x, 0, this.missile.position.z);
        }
    }
    
    setupEventListeners() {
        // Scenario selection
        document.querySelectorAll('input[name="scenario"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.currentScenario = event.target.value;
                this.loadScenario(this.currentScenario);
            });
        });
        
        // Time of day
        document.querySelectorAll('input[name="timeOfDay"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.updateTimeOfDay(event.target.value);
            });
        });
        
        // Missile configuration
        document.querySelectorAll('input[name="missileType"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.missileConfig.type = event.target.value;
            });
        });
        
        document.querySelectorAll('input[name="warheadType"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.missileConfig.warheadType = event.target.value;
            });
        });
        
        document.querySelectorAll('input[name="warheadSize"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.missileConfig.warheadSize = event.target.value;
            });
        });
        
        // Camera mode
        document.querySelectorAll('input[name="cameraMode"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.cameraMode = event.target.value;
            });
        });
        
        // Sliders
        document.getElementById('angle').addEventListener('input', (event) => {
            this.missileConfig.angle = parseFloat(event.target.value);
            document.getElementById('angleValue').textContent = `${this.missileConfig.angle}°`;
        });
        
        document.getElementById('initialVelocity').addEventListener('input', (event) => {
            this.missileConfig.initialVelocity = parseFloat(event.target.value);
            document.getElementById('velocityValue').textContent = `${this.missileConfig.initialVelocity} m/s`;
        });
        
        document.getElementById('coneAngle').addEventListener('input', (event) => {
            this.missileConfig.coneAngle = parseFloat(event.target.value);
            document.getElementById('coneValue').textContent = `${this.missileConfig.coneAngle}°`;
        });
        
        // Target mode
        document.getElementById('targetMode').addEventListener('change', (event) => {
            this.targetMode = event.target.checked;
        });
        
        // Buttons
        document.getElementById('launchBtn').addEventListener('click', () => this.launch());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }
    
    reset() {
        if (this.missile) {
            this.scene.remove(this.missile);
            if (this.missile.userData.trail) {
                this.missile.userData.trail.forEach(trail => this.scene.remove(trail));
            }
            this.missile = null;
        }
        
        // Clear effects
        this.particles.forEach(particle => this.scene.remove(particle));
        this.explosions.forEach(explosion => this.scene.remove(explosion));
        this.particles = [];
        this.explosions = [];
        
        this.isLaunched = false;
        this.targetPosition = null;
        this.missionStartTime = 0;
        this.lastImpactTime = null;
        this.maxDistance = 0;
        
        // Reset camera
        this.camera.position.set(50, 25, 50);
        this.camera.lookAt(0, 0, 0);
        
        document.getElementById('launchBtn').disabled = false;
        console.log('Simulator reset');
    }
    
    onWindowResize() {
        const viewportElement = document.getElementById('viewport');
        const width = viewportElement.clientWidth;
        const height = viewportElement.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 0.016; // 60 FPS target
        
        this.updatePhysics(deltaTime);
        this.updateParticles(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateVehicles(deltaTime);
        this.updateClouds(deltaTime);
        this.updateWater(deltaTime);
        this.updateCamera();
        this.updateStats();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Additional helper methods for creating detailed objects
    createRoads(count) {
        for (let i = 0; i < count; i++) {
            const roadGeometry = new THREE.PlaneGeometry(500 + Math.random() * 500, 8);
            const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
            const road = new THREE.Mesh(roadGeometry, roadMaterial);
            
            road.rotation.x = -Math.PI / 2;
            road.rotation.z = Math.random() * Math.PI;
            road.position.set(
                (Math.random() - 0.5) * 2000,
                0.1,
                (Math.random() - 0.5) * 2000
            );
            
            this.objects.push(road);
            this.scene.add(road);
        }
    }
    
    createUrbanGrid() {
        // Create grid of roads for city
        for (let x = -6; x <= 6; x++) {
            for (let z = -6; z <= 6; z++) {
                if (x === 0 || z === 0 || Math.random() > 0.3) {
                    const roadGeometry = new THREE.PlaneGeometry(120, 10);
                    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                    const road = new THREE.Mesh(roadGeometry, roadMaterial);
                    
                    road.rotation.x = -Math.PI / 2;
                    if (Math.random() > 0.5) road.rotation.z = Math.PI / 2;
                    road.position.set(x * 150, 0.1, z * 150);
                    
                    this.objects.push(road);
                    this.scene.add(road);
                }
            }
        }
    }
    
    modifyTerrainForDesert() {
        // Enhance terrain for desert dunes
        const vertices = this.terrain.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            const height = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 25 +
                          Math.sin(x * 0.008) * Math.sin(z * 0.008) * 10 +
                          Math.random() * 3;
            vertices[i + 1] = Math.max(0, height);
        }
        this.terrain.geometry.attributes.position.needsUpdate = true;
        this.terrain.geometry.computeVertexNormals();
    }
    
    modifyTerrainForMountains() {
        // Create dramatic mountain terrain
        const vertices = this.terrain.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            const height = Math.sin(x * 0.002) * Math.cos(z * 0.002) * 80 +
                          Math.sin(x * 0.005) * Math.sin(z * 0.005) * 40 +
                          Math.sin(x * 0.01) * Math.cos(z * 0.01) * 15 +
                          Math.random() * 10;
            vertices[i + 1] = Math.max(-5, height);
        }
        this.terrain.geometry.attributes.position.needsUpdate = true;
        this.terrain.geometry.computeVertexNormals();
    }
    
    createCactus() {
        const cactusGroup = new THREE.Group();
        
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 8 + Math.random() * 4, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 4;
        body.castShadow = true;
        cactusGroup.add(body);
        
        // Random arms
        if (Math.random() > 0.4) {
            const armGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 12);
            const arm = new THREE.Mesh(armGeometry, bodyMaterial);
            arm.position.set(1.2, 5, 0);
            arm.rotation.z = Math.PI / 2 - Math.random() * 0.5;
            arm.castShadow = true;
            cactusGroup.add(arm);
        }
        
        cactusGroup.userData = { type: 'cactus', destructible: true, health: 50 };
        return cactusGroup;
    }
    
    createRuralBuilding(type) {
        const buildingGroup = new THREE.Group();
        let size, color, height;
        
        switch (type) {
            case 'farmhouse':
                size = { x: 12, y: 8, z: 10 };
                color = 0xDEB887;
                height = size.y;
                break;
            case 'barn':
                size = { x: 20, y: 12, z: 15 };
                color = 0x8B0000;
                height = size.y;
                break;
            case 'silo':
                size = { x: 6, y: 20, z: 6 };
                color = 0xC0C0C0;
                height = size.y;
                break;
            default:
                size = { x: 8, y: 6, z: 8 };
                color = 0x8B4513;
                height = size.y;
        }
        
        const buildingGeometry = type === 'silo' ? 
            new THREE.CylinderGeometry(size.x/2, size.x/2, size.y, 16) :
            new THREE.BoxGeometry(size.x, size.y, size.z);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2;
        building.castShadow = true;
        buildingGroup.add(building);
        
        buildingGroup.userData = { type: 'building', destructible: true, health: 200 };
        return buildingGroup;
    }
    
    createDesertOutpost() {
        const outpostGroup = new THREE.Group();
        
        // Main building
        const buildingGeometry = new THREE.BoxGeometry(15, 8, 12);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = 4;
        building.castShadow = true;
        outpostGroup.add(building);
        
        // Watchtower
        const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(10, 6, 0);
        tower.castShadow = true;
        outpostGroup.add(tower);
        
        outpostGroup.userData = { type: 'outpost', destructible: true, health: 300 };
        return outpostGroup;
    }
    
    createForestFacility() {
        const facilityGroup = new THREE.Group();
        
        // Ranger station
        const buildingGeometry = new THREE.BoxGeometry(18, 10, 12);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8FBC8F });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = 5;
        building.castShadow = true;
        facilityGroup.add(building);
        
        // Roof
        const roofGeometry = new THREE.ConeGeometry(12, 6, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 13;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        facilityGroup.add(roof);
        
        facilityGroup.userData = { type: 'facility', destructible: true, health: 250 };
        return facilityGroup;
    }
    
    createMountainBase() {
        const baseGroup = new THREE.Group();
        
        // Base structure built into mountain
        const baseGeometry = new THREE.BoxGeometry(25, 12, 20);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 6;
        base.castShadow = true;
        baseGroup.add(base);
        
        // Antenna array
        for (let i = 0; i < 3; i++) {
            const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 8);
            const antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set((i-1) * 8, 20, 0);
            antenna.castShadow = true;
            baseGroup.add(antenna);
        }
        
        baseGroup.userData = { type: 'base', destructible: true, health: 400 };
        return baseGroup;
    }
    
    addCoastalFeatures() {
        // Add lighthouses, ports, etc.
        for (let i = 0; i < 5; i++) {
            const lighthouse = new THREE.Group();
            
            const baseGeometry = new THREE.CylinderGeometry(3, 4, 25, 16);
            const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 12.5;
            base.castShadow = true;
            lighthouse.add(base);
            
            // Light
            const lightGeometry = new THREE.SphereGeometry(2, 8, 6);
            const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.y = 27;
            lighthouse.add(light);
            
            lighthouse.position.set(
                (Math.random() - 0.5) * 2000,
                0,
                (Math.random() - 0.5) * 2000
            );
            
            lighthouse.userData = { type: 'lighthouse', destructible: true, health: 150 };
            this.objects.push(lighthouse);
            this.scene.add(lighthouse);
        }
    }
}

// Initialize simulator when page loads
window.addEventListener('load', () => {
    try {
        const simulator = new MissileSimulator();
        console.log('3D Missile Simulator loaded successfully!');
    } catch (error) {
        console.error('Failed to initialize simulator:', error);
    }
});