export declare class PhysicsSimulator {
    private scene;
    private ground;
    private isEarthquakeActive;
    private earthquakeAmplitude;
    private earthquakeFrequency;
    private physicsEnabled;
    private earthquakeCallback;
    constructor(scene: BABYLON.Scene);
    isPhysicsReady(): boolean;
    private initializePhysics;
    startEarthquake(duration?: number): void;
    stopEarthquake(): void;
    setEarthquakeIntensity(amplitude: number, frequency: number): void;
    simulate(models: any[]): void;
}
export declare class PhysicsEngine {
    private simulator;
    constructor();
    simulate(modelOrModels: any): any;
}
