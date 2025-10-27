export declare class PhysicsSimulator {
    private scene;
    private ground;
    private isEarthquakeActive;
    private earthquakeAmplitude;
    private earthquakeFrequency;
    private physicsEnabled;
    constructor(scene: BABYLON.Scene);
    isPhysicsReady(): boolean;
    private initializePhysics;
    private setupPhysics;
    startEarthquake(duration?: number): void;
    stopEarthquake(): void;
    setEarthquakeIntensity(amplitude: number, frequency: number): void;
    simulate(models: any[]): void;
}
