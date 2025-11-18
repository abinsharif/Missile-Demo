class MissileSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentScenario = 'plains';
        
        // Simulation state
        this.missile = null;
        this.target = null;
        this.isLaunching = false;
        this.vehicles = [];
        this.ships = [];
        this.buildings = [];
        this.trees = [];
        this.roads = [];
        this.launchPlatform = null;
        
        // Physics
        this.gravity = -9.81;
        this.missileTrail = [];
        this.animationId = null;
        
        // Camera controls
        this.cameraAngleX = 0;
        this.cameraAngleY = 0.3;
        this.cameraDistance = 300;
        
        // Data
        this.data = {
            missile_types: [
                {"name": "Light", "weight": 500, "speed_modifier": 1.2},
                {"name": "Medium", "weight": 1000, "speed_modifier": 1.0},
                {"name": "Heavy", "weight": 2000, "speed_modifier": 0.8},
                {"name": "Super Heavy", "weight": 5000, "speed_modifier": 0.6}
            ],
            warhead_types: [
                {"name": "HE", "damage_modifier": 1.0, "radius_modifier": 1.0},
                {"name": "Frag", "damage_modifier": 1.2, "radius_modifier": 1.3},
                {"name": "Inc", "damage_modifier": 0.8, "radius_modifier": 1.5},
                {"name": "EMP", "damage_modifier": 1.5, "radius_modifier": 2.0},
                {"name": "Nuke", "damage_modifier": 10.0, "radius_modifier": 5.0}
            ],
            warhead_sizes: [
                {"name": "Small", "base_radius": 20, "damage_modifier": 0.5},
                {"name": "Medium", "base_radius": 40, "damage_modifier": 1.0},
                {"name": "Large", "base_radius": 60, "damage_modifier": 1.5},
                {"name": "XL", "base_radius": 100, "damage_modifier": 2.0}
            ],
            vehicle_types: [
                {"type": "sedan", "length": 4.5, "width": 1.8, "height": 1.4, "speed": 15},
                {"type": "suv", "length": 5.0, "width": 2.0, "height": 1.8, "speed": 12},
                {"type": "truck", "length": 8.0, "width": 2.5, "height": 3.0, "speed": 8},
                {"type": "bus", "length": 12.0, "width": 2.5, "height": 3.2, "speed": 6}
            ],
            ship_types: [
                {"type": "battleship", "length": 150, "width": 20, "height": 25, "speed": 5},
                {"type": "destroyer", "length": 100, "width": 12, "height": 15, "speed": 8},
                {"type": "cargo", "length": 200, "width": 30, "height": 40, "speed": 3},
                {"type": "speedboat", "length": 10, "width": 3, "height": 2, "speed": 20},
                {"type": "yacht", "length": 30, "width": 8, "height": 10, "speed": 12}
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();

        // Fix: updateSize and resize event after camera is initialized
        const canvas = document.getElementById('viewport');
        const updateSize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
            if (this.camera) {
                this.camera.aspect = rect.width / rect.height;
                this.camera.updateProjectionMatrix();
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        this.setupEventListeners();
        this.loadScenario();
        this.animate();

        // Hide loading screen
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        }, 1000);
    }
    
    setupRenderer() {
    const canvas = document.getElementById('viewport');
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    // updateSize and resize event moved to init after camera setup
    this.renderer.setClearColor(0x87CEEB);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 2000);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        this.scene.add(directionalLight);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        const x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        const y = this.cameraDistance * Math.sin(this.cameraAngleY);
        const z = this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        
        this.camera.position.set(x, y + 50, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupEventListeners() {
        // Scenario selection
        const scenarioSelect = document.getElementById('scenario-select');
        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', (e) => {
                console.log('Scenario changed to:', e.target.value);
                this.currentScenario = e.target.value;
                this.loadScenario();
                this.resetSimulation();
            });
        }
        
        // Range inputs
        const angleInput = document.getElementById('launch-angle');
        const velocityInput = document.getElementById('velocity');
        
        if (angleInput) {
            angleInput.addEventListener('input', (e) => {
                document.getElementById('angle-value').textContent = e.target.value + '°';
            });
        }
        
        if (velocityInput) {
            velocityInput.addEventListener('input', (e) => {
                document.getElementById('velocity-value').textContent = e.target.value + ' m/s';
            });
        }
        
        // Buttons
        const launchBtn = document.getElementById('launch-btn');
        const resetBtn = document.getElementById('reset-btn');
        const cameraResetBtn = document.getElementById('camera-reset');
        
        if (launchBtn) {
            launchBtn.addEventListener('click', () => {
                this.launchMissile();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSimulation();
            });
        }
        
        if (cameraResetBtn) {
            cameraResetBtn.addEventListener('click', () => {
                this.resetCamera();
            });
        }
        
        // Mouse controls
        const canvas = this.renderer.domElement;
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click for target selection
                this.handleTargetSelection(e);
            } else if (e.button === 2) { // Right click for camera
                isMouseDown = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                const deltaX = e.clientX - mouseX;
                const deltaY = e.clientY - mouseY;
                
                this.cameraAngleX += deltaX * 0.01;
                this.cameraAngleY = Math.max(-1.5, Math.min(1.5, this.cameraAngleY + deltaY * 0.01));
                
                this.updateCameraPosition();
                
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        canvas.addEventListener('wheel', (e) => {
            this.cameraDistance += e.deltaY * 0.1;
            this.cameraDistance = Math.max(50, Math.min(1000, this.cameraDistance));
            this.updateCameraPosition();
            e.preventDefault();
        });
        
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Warhead change for blast radius update
        const warheadType = document.getElementById('warhead-type');
        const warheadSize = document.getElementById('warhead-size');
        
        if (warheadType) {
            warheadType.addEventListener('change', () => {
                if (this.target) this.updateBlastRadiusStat();
            });
        }
        
        if (warheadSize) {
            warheadSize.addEventListener('change', () => {
                if (this.target) this.updateBlastRadiusStat();
            });
        }
    }
    
    loadScenario() {
        console.log('Loading scenario:', this.currentScenario);
        
        // Clear existing objects
        this.clearScene();
        
        // Update UI
        document.body.className = `scenario-${this.currentScenario}`;
        
        switch (this.currentScenario) {
            case 'plains':
                this.createPlainsScenario();
                break;
            case 'mountains':
                this.createMountainsScenario();
                break;
            case 'city':
                this.createCityScenario();
                break;
            case 'sea':
                this.createSeaScenario();
                break;
        }
        
        this.createLaunchPlatform();
        this.updateLaunchPlatformInfo();
    }
    
    clearScene() {
        // Remove all dynamic objects
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.userData && child.userData.isDynamic) {
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });
        
        this.vehicles = [];
        this.ships = [];
        this.buildings = [];
        this.trees = [];
        this.roads = [];
    }
    
    createPlainsScenario() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.userData.isDynamic = true;
        this.scene.add(ground);
        
        // Add scattered trees
        for (let i = 0; i < 300; i++) {
            this.createTree(
                (Math.random() - 0.5) * 1500,
                0,
                (Math.random() - 0.5) * 1500,
                Math.random() * 4 + 1
            );
        }
        
        this.renderer.setClearColor(0x87CEEB);
    }
    
    createMountainsScenario() {
        // Create terrain with height variation
        const geometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = this.getTerrainHeight(x, z) * 30;
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        terrain.userData.isDynamic = true;
        this.scene.add(terrain);
        
        // Add trees on lower elevations
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 1200;
            const z = (Math.random() - 0.5) * 1200;
            const height = this.getTerrainHeight(x, z) * 30;
            
            if (height < 15) {
                this.createTree(x, height, z, 0.6 + Math.random() * 0.6);
            }
        }
        
        this.renderer.setClearColor(0x87CEEB);
    }
    
    createCityScenario() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.userData.isDynamic = true;
        this.scene.add(ground);
        
        // Create city grid
        this.createCityGrid();
        
        // Add vehicles on roads
        setTimeout(() => this.createVehicles(), 100);
        
        this.renderer.setClearColor(0x87CEEB);
    }
    
    createSeaScenario() {
        // Create water surface
        const waterGeometry = new THREE.PlaneGeometry(3000, 3000);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.userData.isDynamic = true;
        water.userData.isWater = true;
        this.scene.add(water);
        
        // Create ships
        this.createShips();
        
        this.renderer.setClearColor(0x4a90e2);
    }
    
    getTerrainHeight(x, z) {
        return Math.sin(x * 0.01) * Math.cos(z * 0.01) + 
               Math.sin(x * 0.03) * 0.3 + 
               Math.sin(z * 0.02) * 0.5;
    }
    
    createTree(x, y, z, s=1) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5 * s, 0.8 * s, 6 * s);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 3 * s;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(4 * s);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 8 * s;
        foliage.castShadow = true;
        group.add(foliage);
        
        group.position.set(x, y, z);
        group.userData.isDynamic = true;
        group.userData.isDestructible = true;
        this.scene.add(group);
        this.trees.push(group);
    }
    
    createCityGrid() {
        const blockSize = 80;
        const roadWidth = 15;
        
        for (let x = -400; x <= 400; x += blockSize) {
            for (let z = -400; z <= 400; z += blockSize) {
                // Skip center area for launch platform
                if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
                
                // Create building
                if (Math.random() > 0.2) {
                    this.createBuilding(x, z, blockSize - roadWidth);
                }
                
                // Create roads
                this.createRoad(x, z, blockSize, roadWidth);
            }
        }
    }
    
    createBuilding(x, z, size) {
        const height = 15 + Math.random() * 50;
        const geometry = new THREE.BoxGeometry(size * 0.7, height, size * 0.7);
        const material = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.1, 0.1, 0.4 + Math.random() * 0.3) 
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        building.userData.isDynamic = true;
        building.userData.isDestructible = true;
        this.scene.add(building);
        this.buildings.push(building);
    }
    
    createRoad(x, z, blockSize, roadWidth) {
        // Horizontal road
        const hRoadGeometry = new THREE.PlaneGeometry(blockSize, roadWidth);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const hRoad = new THREE.Mesh(hRoadGeometry, roadMaterial);
        hRoad.rotation.x = -Math.PI / 2;
        hRoad.position.set(x, 0.1, z - blockSize / 2);
        hRoad.userData.isDynamic = true;
        hRoad.userData.isRoad = true;
        this.scene.add(hRoad);
        
        this.roads.push({
            mesh: hRoad,
            start: { x: x - blockSize / 2, z: z - blockSize / 2 },
            end: { x: x + blockSize / 2, z: z - blockSize / 2 },
            direction: { x: 1, z: 0 }
        });
        
        // Vertical road  
        const vRoadGeometry = new THREE.PlaneGeometry(roadWidth, blockSize);
        const vRoad = new THREE.Mesh(vRoadGeometry, roadMaterial);
        vRoad.rotation.x = -Math.PI / 2;
        vRoad.position.set(x - blockSize / 2, 0.1, z);
        vRoad.userData.isDynamic = true;
        vRoad.userData.isRoad = true;
        this.scene.add(vRoad);
        
        this.roads.push({
            mesh: vRoad,
            start: { x: x - blockSize / 2, z: z - blockSize / 2 },
            end: { x: x - blockSize / 2, z: z + blockSize / 2 },
            direction: { x: 0, z: 1 }
        });
    }
    
    createVehicles() {
        if (this.currentScenario !== 'city' || this.roads.length === 0) return;
        
        for (let i = 0; i < 15; i++) {
            const road = this.roads[Math.floor(Math.random() * this.roads.length)];
            const vehicleType = this.data.vehicle_types[Math.floor(Math.random() * this.data.vehicle_types.length)];
            this.createVehicle(road, vehicleType);
        }
    }
    
    createVehicle(road, vehicleType) {
        const group = new THREE.Group();
        
        // Vehicle body
        const bodyGeometry = new THREE.BoxGeometry(vehicleType.length, vehicleType.height, vehicleType.width);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5) 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = vehicleType.height / 2;
        body.castShadow = true;
        group.add(body);
        
        // Position on road
        const t = Math.random();
        const x = road.start.x + (road.end.x - road.start.x) * t;
        const z = road.start.z + (road.end.z - road.start.z) * t;
        group.position.set(x, 1, z);
        
        // Set rotation based on road direction
        const angle = Math.atan2(road.direction.z, road.direction.x);
        group.rotation.y = angle;
        
        group.userData.isDynamic = true;
        group.userData.isDestructible = true;
        group.userData.vehicleType = vehicleType;
        group.userData.road = road;
        group.userData.roadProgress = t;
        group.userData.speed = vehicleType.speed / 200;
        
        this.scene.add(group);
        this.vehicles.push(group);
    }
    
    createShips() {
        if (this.currentScenario !== 'sea') return;
        
        for (let i = 0; i < 10; i++) {
            const shipType = this.data.ship_types[Math.floor(Math.random() * this.data.ship_types.length)];
            this.createShip(shipType);
        }
    }
    
    createShip(shipType) {
        const group = new THREE.Group();
        
        // Ship hull
        const hullGeometry = new THREE.BoxGeometry(shipType.length, shipType.height * 0.4, shipType.width);
        const hullMaterial = new THREE.MeshLambertMaterial({ 
            color: shipType.type === 'battleship' ? 0x555555 : new THREE.Color().setHSL(0.6, 0.3, 0.4) 
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = shipType.height * 0.2;
        hull.castShadow = true;
        group.add(hull);
        
        // Superstructure for larger ships
        if (shipType.length > 50) {
            const superGeometry = new THREE.BoxGeometry(shipType.length * 0.2, shipType.height * 0.3, shipType.width * 0.5);
            const superMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
            const superstructure = new THREE.Mesh(superGeometry, superMaterial);
            superstructure.position.set(0, shipType.height * 0.4, 0);
            superstructure.castShadow = true;
            group.add(superstructure);
        }
        
        // Random position in water
        const x = (Math.random() - 0.5) * 1500;
        const z = (Math.random() - 0.5) * 1500;
        group.position.set(x, 0, z);
        
        // Random rotation
        group.rotation.y = Math.random() * Math.PI * 2;
        
        group.userData.isDynamic = true;
        group.userData.isDestructible = true;
        group.userData.shipType = shipType;
        group.userData.speed = shipType.speed / 100;
        group.userData.direction = Math.random() * Math.PI * 2;
        
        this.scene.add(group);
        this.ships.push(group);
    }
    
    createLaunchPlatform() {
        if (this.launchPlatform) {
            this.scene.remove(this.launchPlatform);
        }
        
        if (this.currentScenario === 'sea') {
            // Use battleship as launch platform
            const battleship = this.ships.find(ship => ship.userData.shipType.type === 'battleship');
            if (battleship) {
                this.launchPlatform = battleship;
                return;
            }
            
            // Create dedicated battleship if none exists
            const battleshipType = this.data.ship_types.find(t => t.type === 'battleship');
            if (battleshipType) {
                this.createShip(battleshipType);
                this.launchPlatform = this.ships[this.ships.length - 1];
                this.launchPlatform.position.set(0, 0, 0);
            }
        } else {
            // Fixed launch platform
            const group = new THREE.Group();
            
            const platformGeometry = new THREE.CylinderGeometry(4, 6, 2);
            const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.y = 1;
            platform.castShadow = true;
            group.add(platform);
            
            // Launcher
            const launcherGeometry = new THREE.CylinderGeometry(0.8, 1.2, 6);
            const launcherMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const launcher = new THREE.Mesh(launcherGeometry, launcherMaterial);
            launcher.position.y = 4;
            launcher.rotation.z = -Math.PI / 6;
            launcher.castShadow = true;
            group.add(launcher);
            
            group.position.set(0, 0, 0);
            group.userData.isDynamic = true;
            this.scene.add(group);
            this.launchPlatform = group;
        }
    }
    
    updateLaunchPlatformInfo() {
        const platformInfo = document.getElementById('launch-platform');
        if (platformInfo) {
            if (this.currentScenario === 'sea') {
                platformInfo.textContent = 'Launch Platform: Battleship (Mobile)';
            } else {
                platformInfo.textContent = 'Launch Platform: Fixed';
            }
        }
    }
    
    handleTargetSelection(event) {
        if (this.isLaunching) return;
        
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, this.camera);
        
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            this.target = intersect.point.clone();
            
            console.log('Target set at:', this.target);
            
            // Update UI
            const distance = this.getLaunchPosition().distanceTo(this.target);
            const targetInfo = document.getElementById('target-info');
            if (targetInfo) {
                targetInfo.textContent = `Target: (${this.target.x.toFixed(1)}, ${this.target.z.toFixed(1)}) - ${distance.toFixed(1)}m`;
            }
            
            const launchBtn = document.getElementById('launch-btn');
            if (launchBtn) {
                launchBtn.textContent = 'Launch Missile';
                launchBtn.disabled = false;
            }
            
            this.updateBlastRadiusStat();
            this.updateDistanceStat();
        }
    }
    
    getLaunchPosition() {
        if (this.currentScenario === 'sea' && this.launchPlatform) {
            return this.launchPlatform.position.clone().add(new THREE.Vector3(0, 15, 0));
        }
        return new THREE.Vector3(0, 8, 0);
    }
    
    launchMissile() {
        if (this.isLaunching || !this.target) return;
        
        console.log('Launching missile...');
        
        this.isLaunching = true;
        const launchBtn = document.getElementById('launch-btn');
        if (launchBtn) {
            launchBtn.disabled = true;
            launchBtn.textContent = 'Launching...';
        }
        
        // Get launch parameters
        const angleElement = document.getElementById('launch-angle');
        const velocityElement = document.getElementById('velocity');
        const missileTypeElement = document.getElementById('missile-type');
        
        const angle = angleElement ? parseFloat(angleElement.value) * Math.PI / 180 : Math.PI / 4;
        const velocity = velocityElement ? parseFloat(velocityElement.value) : 100;
        const missileType = missileTypeElement ? missileTypeElement.value : 'Medium';
        
        // Create missile
        this.createMissile(angle, velocity, missileType);
        
        // Start missile animation
        if (this.missile) {
            this.missile.userData.launchTime = Date.now();
            this.animateMissile();
        }
    }
    
    createMissile(angle, velocity, missileType) {
        const group = new THREE.Group();
        
        // Missile body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.2, 6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(0.3, 1.5);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 3.75;
        group.add(nose);
        
        // Fins
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.8);
            const finMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(
                Math.cos(i * Math.PI / 2) * 0.4,
                -2.5,
                Math.sin(i * Math.PI / 2) * 0.4
            );
            group.add(fin);
        }
        
        const launchPos = this.getLaunchPosition();
        group.position.copy(launchPos);
        
        // Calculate trajectory
        const distance = launchPos.distanceTo(this.target);
        const missileData = this.data.missile_types.find(m => m.name === missileType);
        const actualVelocity = velocity * (missileData ? missileData.speed_modifier : 1.0);
        const timeToTarget = this.calculateFlightTime(distance, angle, actualVelocity);
        
        group.userData.isDynamic = true;
        group.userData.velocity = actualVelocity;
        group.userData.angle = angle;
        group.userData.missileType = missileType;
        group.userData.startPos = launchPos.clone();
        group.userData.targetPos = this.target.clone();
        group.userData.timeToTarget = timeToTarget;
        group.userData.maxHeight = 0;
        
        this.scene.add(group);
        this.missile = group;
        this.missileTrail = [];
        
        console.log('Missile created with velocity:', actualVelocity, 'angle:', angle, 'time to target:', timeToTarget);
    }
    
    calculateFlightTime(distance, angle, velocity) {
        // Simplified ballistic trajectory calculation
        const g = Math.abs(this.gravity);
        const vx = velocity * Math.cos(angle);
        const vy = velocity * Math.sin(angle);
        
        // Time to reach maximum height and return to ground level
        const timeToMaxHeight = vy / g;
        const maxHeight = (vy * vy) / (2 * g);
        const totalTime = 2 * timeToMaxHeight;
        
        // Adjust for actual horizontal distance needed
        const theoreticalDistance = vx * totalTime;
        const timeScaling = distance / theoreticalDistance;
        
        return totalTime * timeScaling;
    }
    
    animateMissile() {
        if (!this.missile || !this.isLaunching) return;
        
        const currentTime = (Date.now() - this.missile.userData.launchTime) / 1000;
        const progress = Math.min(currentTime / this.missile.userData.timeToTarget, 1);
        
        if (progress >= 1) {
            // Impact
            this.handleMissileImpact();
            return;
        }
        
        // Calculate position using parabolic trajectory
        const startPos = this.missile.userData.startPos;
        const targetPos = this.missile.userData.targetPos;
        const velocity = this.missile.userData.velocity;
        const angle = this.missile.userData.angle;
        
        // Horizontal movement
        const x = startPos.x + (targetPos.x - startPos.x) * progress;
        const z = startPos.z + (targetPos.z - startPos.z) * progress;
        
        // Vertical movement with gravity
        const t = currentTime;
        const vx = velocity * Math.cos(angle);
        const vy = velocity * Math.sin(angle);
        const y = Math.max(startPos.y + vy * t + 0.5 * this.gravity * t * t, 0);
        
        this.missile.position.set(x, y, z);
        
        // Update max height
        this.missile.userData.maxHeight = Math.max(this.missile.userData.maxHeight, y);
        
        // Rotate missile to face movement direction
        if (progress > 0.01) {
            const prevPos = this.missileTrail.length > 0 ? this.missileTrail[this.missileTrail.length - 1] : startPos;
            const direction = new THREE.Vector3().subVectors(this.missile.position, prevPos).normalize();
            
            if (direction.length() > 0) {
                this.missile.lookAt(this.missile.position.clone().add(direction));
                this.missile.rotateX(-Math.PI / 2);
            }
        }
        
        // Add trail
        this.missileTrail.push(this.missile.position.clone());
        if (this.missileTrail.length > 15) {
            this.missileTrail.shift();
        }
        
        // Check for collisions
        if (this.checkMissileCollisions()) {
            this.handleMissileImpact();
            return;
        }
        
        // Update stats
        this.updateFlightStats(currentTime, this.missile.userData.maxHeight);
        
        requestAnimationFrame(() => this.animateMissile());
    }
    
    checkMissileCollisions() {
        if (!this.missile) return false;
        
        const missilePos = this.missile.position;
        const collisionRadius = 3;
        
        // Check collision with buildings
        for (const building of this.buildings) {
            if (building.position.distanceTo(missilePos) < collisionRadius + 8) {
                return true;
            }
        }
        
        // Check collision with trees
        for (const tree of this.trees) {
            if (tree.position.distanceTo(missilePos) < collisionRadius + 4) {
                return true;
            }
        }
        
        // Check collision with vehicles
        for (const vehicle of this.vehicles) {
            if (vehicle.position.distanceTo(missilePos) < collisionRadius + 2) {
                return true;
            }
        }
        
        // Check collision with ships
        for (const ship of this.ships) {
            if (ship !== this.launchPlatform && ship.position.distanceTo(missilePos) < collisionRadius + ship.userData.shipType.length / 4) {
                return true;
            }
        }
        
        return false;
    }
    
    handleMissileImpact() {
        if (!this.missile) return;
        
        const impactPos = this.missile.position.clone();
        console.log('Missile impact at:', impactPos);
        
        // Create explosion
        this.createExplosion(impactPos);
        
        // Remove missile
        this.scene.remove(this.missile);
        this.missile = null;
        
        // Calculate destruction
        this.calculateDestruction(impactPos);
        
        // Update UI
        this.isLaunching = false;
        const launchBtn = document.getElementById('launch-btn');
        if (launchBtn) {
            launchBtn.textContent = 'Set Target First';
            launchBtn.disabled = true;
        }
        
        // Reset target
        this.target = null;
        const targetInfo = document.getElementById('target-info');
        if (targetInfo) {
            targetInfo.textContent = 'Click on terrain to set target';
        }
    }
    
    createExplosion(position) {
        const explosionRadius = this.calculateBlastRadius();
        
        // Create multiple explosion spheres for better effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const explosionGeometry = new THREE.SphereGeometry(explosionRadius * (0.5 + i * 0.3));
                const explosionMaterial = new THREE.MeshBasicMaterial({ 
                    color: i === 0 ? 0xffff00 : (i === 1 ? 0xff4400 : 0x880000),
                    transparent: true,
                    opacity: 0.8 - i * 0.2
                });
                const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
                explosion.position.copy(position);
                explosion.userData.isDynamic = true;
                this.scene.add(explosion);
                
                // Animate explosion
                let scale = 0;
                const animate = () => {
                    scale += 0.15;
                    explosion.scale.setScalar(scale);
                    explosion.material.opacity = Math.max(0, (0.8 - i * 0.2) - scale * 0.3);
                    
                    if (scale < 2.5) {
                        requestAnimationFrame(animate);
                    } else {
                        this.scene.remove(explosion);
                    }
                };
                animate();
            }, i * 100);
        }
    }
    
    calculateDestruction(impactPos) {
        const blastRadius = this.calculateBlastRadius();
        let targetsHit = 0;
        
        // Destroy buildings
        this.buildings = this.buildings.filter(building => {
            const distance = building.position.distanceTo(impactPos);
            if (distance <= blastRadius) {
                this.scene.remove(building);
                targetsHit++;
                return false;
            }
            return true;
        });
        
        // Destroy trees
        this.trees = this.trees.filter(tree => {
            const distance = tree.position.distanceTo(impactPos);
            if (distance <= blastRadius) {
                this.scene.remove(tree);
                targetsHit++;
                return false;
            }
            return true;
        });
        
        // Destroy vehicles
        this.vehicles = this.vehicles.filter(vehicle => {
            const distance = vehicle.position.distanceTo(impactPos);
            if (distance <= blastRadius) {
                this.scene.remove(vehicle);
                targetsHit++;
                return false;
            }
            return true;
        });
        
        // Destroy ships
        this.ships = this.ships.filter(ship => {
            const distance = ship.position.distanceTo(impactPos);
            if (distance <= blastRadius && ship !== this.launchPlatform) {
                this.scene.remove(ship);
                targetsHit++;
                return false;
            }
            return true;
        });
        
        // Update stats
        const targetsHitElement = document.getElementById('targets-hit-stat');
        if (targetsHitElement) {
            targetsHitElement.textContent = targetsHit;
        }
        
        console.log('Targets destroyed:', targetsHit);
    }
    
    calculateBlastRadius() {
        const warheadTypeElement = document.getElementById('warhead-type');
        const warheadSizeElement = document.getElementById('warhead-size');
        
        const warheadType = warheadTypeElement ? warheadTypeElement.value : 'HE';
        const warheadSize = warheadSizeElement ? warheadSizeElement.value : 'Medium';
        
        const warheadData = this.data.warhead_types.find(w => w.name === warheadType);
        const sizeData = this.data.warhead_sizes.find(s => s.name === warheadSize);
        
        const baseRadius = sizeData ? sizeData.base_radius : 40;
        const modifier = warheadData ? warheadData.radius_modifier : 1.0;
        
        return baseRadius * modifier;
    }
    
    updateBlastRadiusStat() {
        const radius = this.calculateBlastRadius();
        const blastRadiusElement = document.getElementById('blast-radius-stat');
        if (blastRadiusElement) {
            blastRadiusElement.textContent = `${radius.toFixed(1)}m`;
        }
    }
    
    updateDistanceStat() {
        if (!this.target) return;
        
        const distance = this.getLaunchPosition().distanceTo(this.target);
        const distanceElement = document.getElementById('distance-stat');
        if (distanceElement) {
            distanceElement.textContent = `${distance.toFixed(1)}m`;
        }
    }
    
    updateFlightStats(time, maxHeight) {
        const flightTimeElement = document.getElementById('flight-time-stat');
        const maxHeightElement = document.getElementById('max-height-stat');
        const impactForceElement = document.getElementById('impact-force-stat');
        
        if (flightTimeElement) {
            flightTimeElement.textContent = `${time.toFixed(1)}s`;
        }
        
        if (maxHeightElement) {
            maxHeightElement.textContent = `${maxHeight.toFixed(1)}m`;
        }
        
        if (impactForceElement && this.missile) {
            const missileData = this.data.missile_types.find(m => m.name === this.missile.userData.missileType);
            const weight = missileData ? missileData.weight : 1000;
            const velocity = this.missile.userData.velocity;
            const impactForce = (weight * velocity) / 1000;
            impactForceElement.textContent = `${impactForce.toFixed(1)} kN`;
        }
    }
    
    resetSimulation() {
        console.log('Resetting simulation...');
        
        // Remove missile if exists
        if (this.missile) {
            this.scene.remove(this.missile);
            this.missile = null;
        }
        
        // Reset state
        this.isLaunching = false;
        this.target = null;
        this.missileTrail = [];
        
        // Reset UI
        const launchBtn = document.getElementById('launch-btn');
        const targetInfo = document.getElementById('target-info');
        
        if (launchBtn) {
            launchBtn.textContent = 'Set Target First';
            launchBtn.disabled = true;
        }
        
        if (targetInfo) {
            targetInfo.textContent = 'Click on terrain to set target';
        }
        
        // Reset stats
        ['distance-stat', 'flight-time-stat', 'max-height-stat', 'impact-force-stat', 'blast-radius-stat', 'targets-hit-stat'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '-';
            }
        });
        
        // Reload scenario
        this.loadScenario();
    }
    
    resetCamera() {
        this.cameraAngleX = 0;
        this.cameraAngleY = 0.3;
        this.cameraDistance = 300;
        this.updateCameraPosition();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update vehicles
        this.updateVehicles();
        
        // Update ships
        this.updateShips();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateVehicles() {
        if (this.currentScenario !== 'city') return;
        
        this.vehicles.forEach(vehicle => {
            const road = vehicle.userData.road;
            if (!road) return;
            
            // Move along road
            vehicle.userData.roadProgress += vehicle.userData.speed;
            
            if (vehicle.userData.roadProgress >= 1) {
                vehicle.userData.roadProgress = 0;
            }
            
            // Update position
            const t = vehicle.userData.roadProgress;
            const x = road.start.x + (road.end.x - road.start.x) * t;
            const z = road.start.z + (road.end.z - road.start.z) * t;
            vehicle.position.set(x, 1, z);
        });
    }
    
    updateShips() {
        if (this.currentScenario !== 'sea') return;
        
        this.ships.forEach(ship => {
            // Don't move the launch platform
            if (ship === this.launchPlatform) return;
            
            // Move in current direction
            const speed = ship.userData.speed;
            const direction = ship.userData.direction;
            
            ship.position.x += Math.cos(direction) * speed;
            ship.position.z += Math.sin(direction) * speed;
            
            // Change direction occasionally
            if (Math.random() < 0.005) {
                ship.userData.direction += (Math.random() - 0.5) * 0.3;
            }
            
            // Keep ships in bounds
            const maxDist = 1200;
            if (ship.position.length() > maxDist) {
                ship.userData.direction += Math.PI;
            }
            
            // Update rotation
            ship.rotation.y = ship.userData.direction;
        });
    }
}

// Initialize simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing missile simulation...');
    new MissileSimulation();
});