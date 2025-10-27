export class PhysicsSimulator {
    constructor(scene) {
        this.isEarthquakeActive = false;
        this.earthquakeAmplitude = 0.5;
        this.earthquakeFrequency = 2;
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
            // Create physics engine with increased solver iterations for stability
            const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
            const physicsPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
            // Configure physics engine for better stability
            physicsPlugin.setTimeStep(1 / 60);
            this.scene.enablePhysics(gravityVector, physicsPlugin);
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
            console.error("Failed to initialize physics:", error);
            throw error;
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
                        mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(offsetX * 10, 0, offsetZ * 10));
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
//# sourceMappingURL=physics.js.map