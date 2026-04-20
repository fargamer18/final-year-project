import { DSLModel } from '../core/dsl.js';
export declare class ThreeRenderer {
    private scene;
    private camera;
    private renderer;
    constructor(container: HTMLElement);
    render(model: DSLModel): void;
    animate(): void;
    private createGeometry;
}
