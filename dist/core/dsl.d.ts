import * as BABYLON from 'babylonjs';
export interface DSLShape {
    type: string;
    dimensions: {
        width?: number;
        height?: number;
        depth?: number;
        radius?: number;
    };
    position: {
        x: number;
        y: number;
        z: number;
    };
    material?: {
        color: string;
        texture?: string;
    };
}
export interface DSLModel {
    shapes: DSLShape[];
    transforms?: {
        rotation?: {
            x: number;
            y: number;
            z: number;
        };
        scale?: {
            x: number;
            y: number;
            z: number;
        };
    };
}
export interface DSLCommand {
    type: string;
    properties: Record<string, any>;
    children?: DSLCommand[];
}
export declare class DSLInterpreter {
    private scene;
    constructor(scene: BABYLON.Scene);
    interpret(commands: DSLCommand[]): void;
    private executeCommand;
}
