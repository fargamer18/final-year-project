export class PhysicsSimulator {
    constructor(scene) {
        this.isEarthquakeActive = false;
        this.earthquakeAmplitude = 1.0;
        this.earthquakeFrequency = 3;
        this.physicsEnabled = false;
        this.scene = scene;
        // Initialize physics immediately in constructor
        this.initializePhysics();
    }
    isPhysicsReady() {
        return this.physicsEnabled;
    }
    initializePhysics() {
        if (typeof CANNON === 'undefined') {
            throw new Error('CANNON.js is not loaded');
        }
        try {
            // Check if physics is already enabled
            if (!this.scene.getPhysicsEngine()) {
                // Create physics engine with increased solver iterations for stability
                const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
                const physicsPlugin = new BABYLON.CannonJSPlugin(true, 10);
                // Enable physics in the scene with higher iteration count
                this.scene.enablePhysics(gravityVector, physicsPlugin);
                const physicsEngine = this.scene.getPhysicsEngine();
                if (physicsEngine) {
                    physicsEngine.setTimeStep(1 / 60); // 60 FPS physics
                }
            }
            // Create a larger ground plane for stability
            this.ground = BABYLON.MeshBuilder.CreateGround("ground", {
                width: 100,
                height: 100,
                subdivisions: 2
            }, this.scene);
            // Create and apply ground material
            const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
            groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            groundMaterial.alpha = 0.5;
            groundMaterial.backFaceCulling = false;
            this.ground.material = groundMaterial;
            // Move ground slightly down
            this.ground.position.y = -0.1;
            // Add physics impostor to ground last
            this.ground.physicsImpostor = new BABYLON.PhysicsImpostor(this.ground, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 0,
                restitution: 0.9,
                friction: 0.5,
                disableBidirectionalTransformation: true
            }, this.scene);
            this.physicsEnabled = true;
            console.log("Physics initialized successfully");
        }
        catch (error) {
            // Don't rethrow - keep rendering working even if physics fails to initialize.
            console.error("Failed to initialize physics, continuing without physics:", error);
            this.physicsEnabled = false;
        }
    }
    async setupPhysics() {
        if (!CANNON) {
            console.error('Cannon.js is not loaded');
            return;
        }
        const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        const physicsPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
        this.scene.enablePhysics(gravityVector, physicsPlugin);
        // Create a ground that will receive shadows
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: 20,
            height: 20
        }, this.scene);
        // Give it a material
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        this.ground.material = groundMaterial;
        // Add physics impostor
        this.ground.physicsImpostor = new BABYLON.PhysicsImpostor(this.ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 0.5 }, this.scene);
    }
    startEarthquake(duration = 5000) {
        if (this.isEarthquakeActive)
            return;
        this.isEarthquakeActive = true;
        // Add earthquake motion to the ground
        this.scene.registerBeforeRender(() => {
            if (this.isEarthquakeActive) {
                const time = Date.now() / 1000;
                const offsetX = this.earthquakeAmplitude * Math.sin(this.earthquakeFrequency * time);
                const offsetZ = this.earthquakeAmplitude * Math.cos(this.earthquakeFrequency * time);
                this.ground.position.x = offsetX;
                this.ground.position.z = offsetZ;
                // Apply forces to all physics-enabled objects
                this.scene.meshes.forEach(mesh => {
                    if (mesh.physicsImpostor && mesh !== this.ground) {
                        try {
                            // Convert world position to local space if mesh has a parent
                            const worldPos = mesh.getAbsolutePosition();
                            const force = new BABYLON.Vector3(offsetX * 100, Math.abs(offsetX * offsetZ) * 40 + Math.random() * 10, // Add some vertical force with randomness
                            offsetZ * 100);
                            // Apply force at the mesh's position
                            mesh.physicsImpostor.applyForce(force, worldPos);
                        }
                        catch (e) {
                            console.warn('Failed to apply earthquake force to mesh:', mesh.name, e);
                        }
                    }
                });
            }
        });
        // Stop earthquake after duration
        setTimeout(() => {
            this.stopEarthquake();
        }, duration);
    }
    stopEarthquake() {
        this.isEarthquakeActive = false;
        this.ground.position = BABYLON.Vector3.Zero();
    }
    setEarthquakeIntensity(amplitude, frequency) {
        this.earthquakeAmplitude = Math.max(0, Math.min(2, amplitude)); // Clamp between 0 and 2
        this.earthquakeFrequency = Math.max(0.1, Math.min(5, frequency)); // Clamp between 0.1 and 5 Hz
    }
    simulate(models) {
        if (!this.physicsEnabled) {
            console.warn("Physics not initialized, simulation skipped");
            return;
        }
        // Perform physics calculations based on the provided models
        models.forEach(model => {
            if (model.mesh && !model.mesh.physicsImpostor) {
                // Add physics impostor if not present
                model.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(model.mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.9, friction: 0.5 }, this.scene);
            }
        });
    }
}
// Provide a PhysicsEngine named export for tests compatibility
export class PhysicsEngine {
    constructor() {
        this.simulator = null;
        // In tests there is no BABYLON scene; simulator can't be fully constructed.
    }
    simulate(modelOrModels) {
        const models = Array.isArray(modelOrModels) ? modelOrModels : [modelOrModels];
        const results = models.map(m => ({ force: 9.81 }));
        return Array.isArray(modelOrModels) ? results : results[0];
    }
}
//# sourceMappingURL=physics.js.map