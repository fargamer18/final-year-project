interface Model {
    type: string;
    properties: Record<string, any>;
    children?: Model[];
}
export declare class BabylonRenderer {
    private scene;
    private physics;
    constructor(scene: BABYLON.Scene);
    private setupEnvironment;
    render(model: Model): BABYLON.Mesh[];
    private createMeshFromModel;
    private createWall;
    private createRoof;
    private createHouse;
}
export default BabylonRenderer;
