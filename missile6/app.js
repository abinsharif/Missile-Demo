class MissileSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.missile = null;
        this.terrain = null;
        this.vehicles = [];
        this.buildings = [];
        this.navies = [];
        this.explosions = [];
        this.targetPosition = null;
        this.isLaunched = false;
        this.launchPlatform = null;
        
        this.stats = {
            missilesFired: 0,
            targetsHit: 0,
            destructions: 0
        };
        
        this.scenarios = ['plains', 'mountains', 'city', 'sea'];
        this.currentScenario = 'plains';
        this.cameraMode = 'free';
        this.controlMode = 'manual';
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 30, 80);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        const container = document.getElementById('canvasContainer');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1);
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLighting();
        
        // Load initial scenario
        this.loadScenario(this.currentScenario);
        
        this.addLog('Simulation initialized');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    loadScenario(scenario) {
        // Clear existing elements
        this.clearScene();
        this.currentScenario = scenario;
        
        switch(scenario) {
            case 'plains':
                this.createPlains();
                break;
            case 'mountains':
                this.createMountains();
                break;
            case 'city':
                this.createCity();
                break;
            case 'sea':
                this.createSea();
                break;
        }
        
        this.createLaunchSite();
        this.addLog(`Loaded ${scenario} scenario`);
    }
    
    clearScene() {
        // Remove vehicles, buildings, ships
        this.vehicles.forEach(vehicle => {
            if (vehicle.mesh) this.scene.remove(vehicle.mesh);
        });
        this.buildings.forEach(building => this.scene.remove(building));
        this.navies.forEach(ship => {
            if (ship.mesh) this.scene.remove(ship.mesh);
        });
        
        this.vehicles = [];
        this.buildings = [];
        this.navies = [];
        
        // Remove terrain
        if (this.terrain) {
            this.scene.remove(this.terrain);
            this.terrain = null;
        }
        
        // Remove launch platform
        if (this.launchPlatform) {
            this.scene.remove(this.launchPlatform);
            this.launchPlatform = null;
        }
        
        // Clear explosions
        this.explosions.forEach(explosion => this.scene.remove(explosion));
        this.explosions = [];
    }
    
    createPlains() {
        // Create flat grassy terrain
        const geometry = new THREE.PlaneGeometry(400, 400, 50, 50);
        const material = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
        
        // Add some trees
        this.createTrees(50);
    }
    
    createMountains() {
        // Create mountainous terrain with proper peaks
        const geometry = new THREE.PlaneGeometry(400, 400, 100, 100);
        const vertices = geometry.attributes.position.array;
        
        // Generate realistic mountain heights
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            
            // Multiple peak system
            let height = 0;
            height += 15 * Math.sin(x * 0.02) * Math.cos(y * 0.02);
            height += 10 * Math.sin(x * 0.05) * Math.sin(y * 0.05);
            height += 5 * Math.sin(x * 0.1) * Math.cos(y * 0.1);
            height = Math.max(0, height);
            
            vertices[i + 2] = height;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            wireframe: false
        });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
        
        // Add trees on lower slopes
        this.createTrees(15);
    }
    
    createCity() {
        // Create flat urban terrain
        const geometry = new THREE.PlaneGeometry(400, 400);
        const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
        
        // Create road network and buildings
        this.createRoadNetwork();
        this.createBuildings();
        this.createVehicles();
    }
    
    createSea() {
        // Create animated water surface
        const geometry = new THREE.PlaneGeometry(400, 400, 64, 64);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.scene.add(this.terrain);
        
        // Create naval vessels
        this.createNavalVessels();
    }
    
    createRoadNetwork() {
        // Create grid-based road system
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        // Horizontal roads
        for (let i = -150; i <= 150; i += 50) {
            const roadGeometry = new THREE.PlaneGeometry(400, 8);
            const road = new THREE.Mesh(roadGeometry, roadMaterial);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0.01, i);
            this.scene.add(road);
        }
        
        // Vertical roads
        for (let i = -150; i <= 150; i += 50) {
            const roadGeometry = new THREE.PlaneGeometry(8, 400);
            const road = new THREE.Mesh(roadGeometry, roadMaterial);
            road.rotation.x = -Math.PI / 2;
            road.position.set(i, 0.01, 0);
            this.scene.add(road);
        }
    }
    
    createBuildings() {
        const buildingCount = 30;
        const buildingTypes = [
            { width: 10, depth: 10, height: 20, color: 0x808080 },
            { width: 15, depth: 15, height: 35, color: 0x606060 },
            { width: 8, depth: 12, height: 15, color: 0x909090 },
            { width: 20, depth: 8, height: 25, color: 0x707070 }
        ];
        
        for (let i = 0; i < buildingCount; i++) {
            const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            const geometry = new THREE.BoxGeometry(type.width, type.height, type.depth);
            const material = new THREE.MeshLambertMaterial({ color: type.color });
            
            const building = new THREE.Mesh(geometry, material);
            
            // Place away from roads
            let x, z;
            do {
                x = (Math.random() - 0.5) * 300;
                z = (Math.random() - 0.5) * 300;
            } while (this.isNearRoad(x, z, 15));
            
            building.position.set(x, type.height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            
            this.scene.add(building);
            this.buildings.push(building);
        }
    }
    
    isNearRoad(x, z, buffer) {
        // Check if position is near road grid
        const roadPositions = [-150, -100, -50, 0, 50, 100, 150];
        
        for (let roadX of roadPositions) {
            if (Math.abs(x - roadX) < buffer) return true;
        }
        
        for (let roadZ of roadPositions) {
            if (Math.abs(z - roadZ) < buffer) return true;
        }
        
        return false;
    }
    
    createVehicles() {
        const vehicleCount = 15;
        const vehicleTypes = [
            { width: 2, length: 4, height: 1.5, color: 0xff0000, speed: 0.3 }, // Car
            { width: 2.5, length: 5, height: 2, color: 0x0000ff, speed: 0.2 }, // SUV
            { width: 2.5, length: 8, height: 3, color: 0xffff00, speed: 0.15 }, // Bus
            { width: 2.2, length: 6, height: 2.5, color: 0x00ff00, speed: 0.25 } // Truck
        ];
        
        const roadPositions = [-150, -100, -50, 0, 50, 100, 150];
        
        for (let i = 0; i < vehicleCount; i++) {
            const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const geometry = new THREE.BoxGeometry(type.width, type.height, type.length);
            const material = new THREE.MeshLambertMaterial({ color: type.color });
            
            const vehicle = new THREE.Mesh(geometry, material);
            
            // Place on roads
            const isHorizontal = Math.random() > 0.5;
            if (isHorizontal) {
                vehicle.position.set(
                    (Math.random() - 0.5) * 380,
                    type.height / 2,
                    roadPositions[Math.floor(Math.random() * roadPositions.length)]
                );
                vehicle.userData = {
                    direction: new THREE.Vector3(Math.random() > 0.5 ? 1 : -1, 0, 0),
                    speed: type.speed,
                    type: 'vehicle'
                };
            } else {
                vehicle.position.set(
                    roadPositions[Math.floor(Math.random() * roadPositions.length)],
                    type.height / 2,
                    (Math.random() - 0.5) * 380
                );
                vehicle.userData = {
                    direction: new THREE.Vector3(0, 0, Math.random() > 0.5 ? 1 : -1),
                    speed: type.speed,
                    type: 'vehicle'
                };
                vehicle.rotation.y = Math.PI / 2;
            }
            
            vehicle.castShadow = true;
            
            this.scene.add(vehicle);
            this.vehicles.push({ mesh: vehicle, destroyed: false });
        }
    }
    
    createNavalVessels() {
        const vesselCount = 12;
        const vesselTypes = [
            { width: 8, length: 40, height: 8, color: 0x404040, speed: 0.1, name: 'battleship' },
            { width: 6, length: 30, height: 6, color: 0x505050, speed: 0.15, name: 'cruiser' },
            { width: 4, length: 25, height: 5, color: 0x606060, speed: 0.2, name: 'destroyer' },
            { width: 2, length: 12, height: 3, color: 0x707070, speed: 0.3, name: 'patrol_boat' },
            { width: 10, length: 50, height: 12, color: 0x8B4513, speed: 0.08, name: 'cargo_ship' }
        ];
        
        for (let i = 0; i < vesselCount; i++) {
            const type = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
            const geometry = new THREE.BoxGeometry(type.width, type.height, type.length);
            const material = new THREE.MeshLambertMaterial({ color: type.color });
            
            const vessel = new THREE.Mesh(geometry, material);
            
            // Random position on water
            vessel.position.set(
                (Math.random() - 0.5) * 350,
                type.height / 2,
                (Math.random() - 0.5) * 350
            );
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            vessel.userData = {
                direction: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
                speed: type.speed,
                type: 'naval',
                name: type.name
            };
            vessel.rotation.y = angle;
            
            this.scene.add(vessel);
            this.navies.push({ mesh: vessel, destroyed: false });
        }
    }
    
    createLaunchSite() {
        if (this.currentScenario === 'sea') {
            // Moving battleship launcher
            const shipGeometry = new THREE.BoxGeometry(12, 8, 60);
            const shipMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
            this.launchPlatform = new THREE.Mesh(shipGeometry, shipMaterial);
            this.launchPlatform.position.set(0, 4, 0);
            this.launchPlatform.castShadow = true;
            
            // Add platform on top
            const platformGeometry = new THREE.CylinderGeometry(8, 10, 2, 8);
            const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(0, 6, 0);
            this.launchPlatform.add(platform);
            
            this.launchPlatform.userData = {
                direction: new THREE.Vector3(1, 0, 0),
                speed: 0.05,
                type: 'launcher'
            };
        } else {
            // Static ground launcher
            const platformGeometry = new THREE.CylinderGeometry(8, 10, 2, 8);
            const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            this.launchPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
            this.launchPlatform.position.set(0, 1, 0);
            this.launchPlatform.castShadow = true;
            this.launchPlatform.receiveShadow = true;
        }
        
        this.scene.add(this.launchPlatform);
    }
    
    createTrees(count) {
        for (let i = 0; i < count; i++) {
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 1, 8, 6);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            
            const leavesGeometry = new THREE.SphereGeometry(4, 8, 6);
            const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            
            const tree = new THREE.Group();
            trunk.position.y = 4;
            leaves.position.y = 10;
            tree.add(trunk);
            tree.add(leaves);
            
            tree.position.set(
                (Math.random() - 0.5) * 300,
                0,
                (Math.random() - 0.5) * 300
            );
            
            tree.castShadow = true;
            this.scene.add(tree);
        }
    }
    
    updateVehicles() {
        this.vehicles.forEach(vehicle => {
            if (vehicle.destroyed) return;
            
            const mesh = vehicle.mesh;
            const direction = mesh.userData.direction;
            const speed = mesh.userData.speed;
            
            // Move vehicle
            mesh.position.add(direction.clone().multiplyScalar(speed));
            
            // Boundary check and turn around
            if (Math.abs(mesh.position.x) > 190 || Math.abs(mesh.position.z) > 190) {
                mesh.userData.direction.multiplyScalar(-1);
            }
        });
        
        // Update naval vessels
        this.navies.forEach(vessel => {
            if (vessel.destroyed) return;
            
            const mesh = vessel.mesh;
            const direction = mesh.userData.direction;
            const speed = mesh.userData.speed;
            
            mesh.position.add(direction.clone().multiplyScalar(speed));
            
            if (Math.abs(mesh.position.x) > 190 || Math.abs(mesh.position.z) > 190) {
                mesh.userData.direction.multiplyScalar(-1);
                mesh.rotation.y += Math.PI;
            }
        });
        
        // Update launch platform if it's a ship
        if (this.launchPlatform && this.launchPlatform.userData && this.launchPlatform.userData.type === 'launcher') {
            const direction = this.launchPlatform.userData.direction;
            const speed = this.launchPlatform.userData.speed;
            
            this.launchPlatform.position.add(direction.clone().multiplyScalar(speed));
            
            if (Math.abs(this.launchPlatform.position.x) > 150 || Math.abs(this.launchPlatform.position.z) > 150) {
                this.launchPlatform.userData.direction.multiplyScalar(-1);
            }
        }
        
        // Animate water for sea scenario
        if (this.currentScenario === 'sea' && this.terrain) {
            const vertices = this.terrain.geometry.attributes.position.array;
            const time = Date.now() * 0.001;
            
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const y = vertices[i + 1];
                vertices[i + 2] = Math.sin(x * 0.02 + time) * 0.5 + Math.cos(y * 0.02 + time * 1.1) * 0.3;
            }
            
            this.terrain.geometry.attributes.position.needsUpdate = true;
            this.terrain.geometry.computeVertexNormals();
        }
    }
    
    launchMissile() {
        if (this.isLaunched) return;
        
        const missileType = document.getElementById('missileType').value;
        const warheadType = document.getElementById('warheadType').value;
        const warheadSize = document.getElementById('warheadSize').value;
        const angle = parseInt(document.getElementById('launchAngle').value);
        const power = parseInt(document.getElementById('launchPower').value);
        const direction = parseInt(document.getElementById('launchDirection').value);
        
        // Create missile
        const missileGeometry = new THREE.ConeGeometry(0.5, 8, 8);
        const missileColors = { light: 0x00ff00, medium: 0xffff00, heavy: 0xff0000 };
        const missileMaterial = new THREE.MeshLambertMaterial({ color: missileColors[missileType] });
        
        this.missile = new THREE.Mesh(missileGeometry, missileMaterial);
        
        // Position at launch platform
        const launchPos = this.launchPlatform.position.clone();
        launchPos.y += (this.currentScenario === 'sea' ? 15 : 10);
        this.missile.position.copy(launchPos);
        
        // Calculate velocity based on parameters
        const radianAngle = (angle * Math.PI) / 180;
        const radianDirection = (direction * Math.PI) / 180;
        const velocity = power * 0.8;
        
        this.missile.userData = {
            velocity: new THREE.Vector3(
                Math.cos(radianDirection) * velocity * Math.cos(radianAngle),
                velocity * Math.sin(radianAngle),
                Math.sin(radianDirection) * velocity * Math.cos(radianAngle)
            ),
            type: missileType,
            warhead: warheadType,
            size: warheadSize,
            launched: true,
            trail: []
        };
        
        // Orient missile to face direction
        this.missile.lookAt(
            this.missile.position.x + this.missile.userData.velocity.x,
            this.missile.position.y + this.missile.userData.velocity.y,
            this.missile.position.z + this.missile.userData.velocity.z
        );
        
        this.scene.add(this.missile);
        this.isLaunched = true;
        
        this.stats.missilesFired++;
        this.updateStats();
        this.addLog(`${missileType} missile launched with ${warheadType} warhead`);
        
        document.getElementById('missionStatus').textContent = 'Missile In Flight';
    }
    
    updateMissile() {
        if (!this.missile || !this.isLaunched) return;
        
        const userData = this.missile.userData;
        
        // Apply gravity
        userData.velocity.y -= 0.02;
        
        // Update position
        this.missile.position.add(userData.velocity);
        
        // Update orientation to face movement direction
        const direction = userData.velocity.clone().normalize();
        this.missile.lookAt(
            this.missile.position.x + direction.x,
            this.missile.position.y + direction.y,
            this.missile.position.z + direction.z
        );
        
        // Check for collisions
        this.checkMissileCollisions();
        
        // Check if hit ground or water
        const groundLevel = this.currentScenario === 'sea' ? 0 : 0;
        if (this.missile.position.y <= groundLevel) {
            this.explodeMissile();
        }
        
        // Update camera if following
        if (this.cameraMode === 'follow' && this.missile) {
            this.camera.position.copy(this.missile.position.clone().add(new THREE.Vector3(-20, 10, -20)));
            this.camera.lookAt(this.missile.position);
        }
    }
    
    checkMissileCollisions() {
        if (!this.missile) return;
        
        const missilePos = this.missile.position;
        
        // Check building collisions
        this.buildings.forEach(building => {
            const buildingBox = new THREE.Box3().setFromObject(building);
            if (buildingBox.containsPoint(missilePos)) {
                this.explodeMissile();
                this.addLog('Missile hit building - early detonation!', 'warning');
            }
        });
        
        // Check vehicle collisions
        this.vehicles.forEach(vehicle => {
            if (!vehicle.destroyed) {
                const vehicleBox = new THREE.Box3().setFromObject(vehicle.mesh);
                if (vehicleBox.containsPoint(missilePos)) {
                    this.explodeMissile();
                    this.addLog('Missile hit vehicle - early detonation!', 'warning');
                }
            }
        });
    }
    
    explodeMissile() {
        if (!this.missile) return;
        
        const explosionPos = this.missile.position.clone();
        const warheadSize = this.missile.userData.size;
        const warheadType = this.missile.userData.warhead;
        
        // Create explosion effect
        this.createExplosion(explosionPos, warheadSize, warheadType);
        
        // Calculate destruction radius
        const destructionRadius = this.getDestructionRadius(warheadSize, warheadType);
        this.destroyNearbyObjects(explosionPos, destructionRadius);
        
        // Remove missile
        this.scene.remove(this.missile);
        this.missile = null;
        this.isLaunched = false;
        
        this.addLog(`Missile exploded with ${destructionRadius}m destruction radius`, 'error');
        document.getElementById('missionStatus').textContent = 'Mission Complete';
        
        this.stats.targetsHit++;
        this.updateStats();
    }
    
    getDestructionRadius(size, type) {
        const sizeMultipliers = { small: 1, medium: 1.5, large: 2, xl: 3 };
        const typeMultipliers = { he: 1, frag: 1.2, inc: 0.8, nuke: 5 };
        
        return 10 * sizeMultipliers[size] * typeMultipliers[type];
    }
    
    createExplosion(position, size, type) {
        const explosionColors = {
            he: 0xff4500,
            frag: 0xffd700,
            inc: 0xff0000,
            nuke: 0xffffff
        };
        
        const sizeMultipliers = { small: 1, medium: 2, large: 4, xl: 8 };
        const explosionSize = 5 * sizeMultipliers[size];
        
        // Main explosion sphere
        const explosionGeometry = new THREE.SphereGeometry(explosionSize, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: explosionColors[type],
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Animate explosion
        let scale = 0;
        let opacity = 0.8;
        
        const animateExplosion = () => {
            scale += 0.1;
            opacity -= 0.05;
            
            if (opacity > 0) {
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = opacity;
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        
        animateExplosion();
        
        // Add particle effects for larger explosions
        if (sizeMultipliers[size] >= 4) {
            this.createParticleExplosion(position, explosionSize);
        }
    }
    
    createParticleExplosion(position, size) {
        const particleCount = Math.min(size * 5, 100); // Limit particles to prevent freezing
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.5 ? 0xff4500 : 0xffd700,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * size * 0.5,
                Math.random() * size * 0.3,
                (Math.random() - 0.5) * size * 0.5
            );
            
            particle.userData = { velocity, life: 1.0 };
            particles.add(particle);
        }
        
        this.scene.add(particles);
        this.explosions.push(particles);
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            let hasLiveParticles = false;
            
            explosion.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    hasLiveParticles = true;
                    
                    // Update particle
                    particle.position.add(particle.userData.velocity);
                    particle.userData.velocity.y -= 0.05; // Gravity
                    particle.userData.life -= 0.02;
                    particle.material.opacity = particle.userData.life;
                    
                    if (particle.userData.life <= 0) {
                        explosion.remove(particle);
                    }
                }
            });
            
            if (!hasLiveParticles) {
                this.scene.remove(explosion);
                return false;
            }
            
            return true;
        });
    }
    
    destroyNearbyObjects(position, radius) {
        let destructionCount = 0;
        
        // Destroy buildings
        this.buildings = this.buildings.filter(building => {
            const distance = building.position.distanceTo(position);
            if (distance < radius) {
                this.scene.remove(building);
                destructionCount++;
                return false;
            }
            return true;
        });
        
        // Destroy vehicles
        this.vehicles.forEach(vehicle => {
            if (!vehicle.destroyed) {
                const distance = vehicle.mesh.position.distanceTo(position);
                if (distance < radius) {
                    vehicle.destroyed = true;
                    this.scene.remove(vehicle.mesh);
                    destructionCount++;
                }
            }
        });
        
        // Destroy naval vessels
        this.navies.forEach(vessel => {
            if (!vessel.destroyed) {
                const distance = vessel.mesh.position.distanceTo(position);
                if (distance < radius) {
                    vessel.destroyed = true;
                    this.scene.remove(vessel.mesh);
                    destructionCount++;
                }
            }
        });
        
        this.stats.destructions += destructionCount;
        this.updateStats();
        
        if (destructionCount > 0) {
            this.addLog(`Destroyed ${destructionCount} objects`, 'success');
        }
    }
    
    setupEventListeners() {
        // UI Controls
        document.getElementById('scenarioSelect').addEventListener('change', (e) => {
            this.loadScenario(e.target.value);
        });
        
        document.getElementById('launchBtn').addEventListener('click', () => {
            this.launchMissile();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        document.getElementById('cameraMode').addEventListener('change', (e) => {
            this.cameraMode = e.target.value;
            this.updateCameraMode();
        });
        
        document.getElementById('controlMode').addEventListener('change', (e) => {
            this.controlMode = e.target.value;
        });
        
        // Range sliders
        document.getElementById('launchAngle').addEventListener('input', (e) => {
            document.getElementById('angleValue').textContent = e.target.value;
        });
        
        document.getElementById('launchPower').addEventListener('input', (e) => {
            document.getElementById('powerValue').textContent = e.target.value;
        });
        
        document.getElementById('launchDirection').addEventListener('input', (e) => {
            document.getElementById('directionValue').textContent = e.target.value;
        });
        
        // Canvas click for targeting
        this.renderer.domElement.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
    
    handleCanvasClick(event) {
        if (this.controlMode !== 'target' || this.isLaunched) return;
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        
        const intersects = raycaster.intersectObject(this.terrain);
        if (intersects.length > 0) {
            this.targetPosition = intersects[0].point;
            document.getElementById('coordinatesDisplay').textContent = 
                `Target: (${Math.round(this.targetPosition.x)}, ${Math.round(this.targetPosition.z)})`;
            
            // Show target indicator
            const indicator = document.getElementById('targetIndicator');
            indicator.style.left = `${event.clientX - rect.left}px`;
            indicator.style.top = `${event.clientY - rect.top}px`;
            indicator.classList.remove('hidden');
            
            this.addLog(`Target set at (${Math.round(this.targetPosition.x)}, ${Math.round(this.targetPosition.z)})`);
        }
    }
    
    updateCameraMode() {
        switch(this.cameraMode) {
            case 'free':
                this.camera.position.set(0, 30, 80);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'top':
                this.camera.position.set(0, 150, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'follow':
                // Will be handled in updateMissile
                break;
        }
    }
    
    resetSimulation() {
        // Remove missile if exists
        if (this.missile) {
            this.scene.remove(this.missile);
            this.missile = null;
        }
        
        this.isLaunched = false;
        this.targetPosition = null;
        
        // Clear explosions
        this.explosions.forEach(explosion => this.scene.remove(explosion));
        this.explosions = [];
        
        // Hide target indicator
        document.getElementById('targetIndicator').classList.add('hidden');
        
        // Reset UI
        document.getElementById('missionStatus').textContent = 'Ready to Launch';
        document.getElementById('coordinatesDisplay').textContent = 'Target: None';
        
        // Reload current scenario
        this.loadScenario(this.currentScenario);
        
        this.addLog('Simulation reset');
    }
    
    updateStats() {
        document.getElementById('missilesFired').textContent = this.stats.missilesFired;
        document.getElementById('targetsHit').textContent = this.stats.targetsHit;
        document.getElementById('destructions').textContent = this.stats.destructions;
        
        const accuracy = this.stats.missilesFired > 0 ? 
            Math.round((this.stats.targetsHit / this.stats.missilesFired) * 100) : 0;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }
    
    addLog(message, type = 'info') {
        const logEntries = document.getElementById('logEntries');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        
        logEntries.appendChild(entry);
        logEntries.scrollTop = logEntries.scrollHeight;
        
        // Keep only last 50 entries
        while (logEntries.children.length > 50) {
            logEntries.removeChild(logEntries.firstChild);
        }
    }
    
    onWindowResize() {
        const container = document.getElementById('canvasContainer');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update all systems
        this.updateVehicles();
        this.updateMissile();
        this.updateExplosions();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulation = new MissileSimulation();
});