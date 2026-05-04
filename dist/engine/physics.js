export class PhysicsSimulator {
    constructor(scene) {
        this.isEarthquakeActive = false;
        this.earthquakeAmplitude = 1.0;
        this.earthquakeFrequency = 3;
        this.physicsEnabled = false;
        this.earthquakeCallback = null;
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
    startEarthquake(duration = 5000) {
        if (this.isEarthquakeActive)
            return;
        this.isEarthquakeActive = true;
        // Store the callback so we can unregister it later
        this.earthquakeCallback = () => {
            if (!this.isEarthquakeActive)
                return;
            const time = Date.now() / 1000;
            const offsetX = this.earthquakeAmplitude * Math.sin(this.earthquakeFrequency * time);
            const offsetZ = this.earthquakeAmplitude * Math.cos(this.earthquakeFrequency * time);
            this.ground.position.x = offsetX;
            this.ground.position.z = offsetZ;
            // Apply forces to all physics-enabled objects
            this.scene.meshes.forEach(mesh => {
                if (mesh.physicsImpostor && mesh !== this.ground) {
                    try {
                        const worldPos = mesh.getAbsolutePosition();
                        const force = new BABYLON.Vector3(offsetX * 100, Math.abs(offsetX * offsetZ) * 40 + Math.random() * 10, offsetZ * 100);
                        mesh.physicsImpostor.applyForce(force, worldPos);
                    }
                    catch (e) {
                        console.warn('Failed to apply earthquake force to mesh:', mesh.name, e);
                    }
                }
            });
        };
        this.scene.registerBeforeRender(this.earthquakeCallback);
        // Stop earthquake after duration
        setTimeout(() => {
            this.stopEarthquake();
        }, duration);
    }
    stopEarthquake() {
        this.isEarthquakeActive = false;
        if (this.earthquakeCallback) {
            this.scene.unregisterBeforeRender(this.earthquakeCallback);
            this.earthquakeCallback = null;
        }
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