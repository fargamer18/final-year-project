interface Model {
    type: string;
    properties: Record<string, any>;
    children?: Model[];
}
export declare class BabylonRenderer {
    private scene;
    private physics;
    sunLight: BABYLON.DirectionalLight | null;
    private hemiLight;
    private fillLight;
    private shadowGenerator;
    private sceneGround;
    private sceneGroundMaterial;
    private lightingPreset;
    constructor(scene: BABYLON.Scene);
    private setupEnvironment;
    applyLightingPreset(preset: 'day' | 'night'): void;
    private createSurfaceMaterial;
    private createGlassMaterial;
    private polishMesh;
    setSunPosition(position: BABYLON.Vector3, intensity: number): void;
    render(model: Model): BABYLON.Mesh[];
    private createMeshFromModel;
    private createWall;
    private createFloor;
    private createDoor;
    private createWindow;
    private createFoundation;
    private createRoof;
    private createHouse;
}
export default BabylonRenderer;
