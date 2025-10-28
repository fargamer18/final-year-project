import * as BABYLON from 'babylonjs';

export interface HouseProperties {
    width: number;
    height: number;
    depth: number;
    wallThickness?: number;
    material?: {
        walls?: string;
        roof?: string;
        foundation?: string;
    };
}

// Simple parser for the DSL
export function parseDSL(dslCode: string): HouseProperties {
    try {
        // Remove comments and whitespace
        dslCode = dslCode.replace(/\/\/.*$/gm, '').trim();
        
        // Basic parsing of the house structure
        const houseMatch = dslCode.match(/House\s*{([^}]*)}/s);
        if (!houseMatch) {
            throw new Error('No House definition found in DSL');
        }

        let width: number | undefined;
        let height: number | undefined;
        let depth: number | undefined;
        let wallThickness: number | undefined;
        let material: HouseProperties['material'] | undefined;

        const propertyLines = houseMatch[1].split(',').map(line => line.trim()).filter(Boolean);
        
        for (const line of propertyLines) {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) {
                if (value.startsWith('{')) {
                    // Handle nested objects (like materials)
                    const objStr = value.replace(/[{}]/g, '');
                    const materialObj: HouseProperties['material'] = {};
                    objStr.split(',').map(pair => pair.trim()).filter(Boolean).forEach(pair => {
                        const [k, v] = pair.split(':').map(p => p.trim());
                        if (k && v) {
                            (materialObj as any)[k] = v.replace(/"/g, '');
                        }
                    });
                    if (key === 'material') {
                        material = materialObj;
                    }
                } else {
                    // Handle numeric values
                    const numValue = value.includes('.') ? parseFloat(value) : parseInt(value);
                    switch (key) {
                        case 'width': width = numValue; break;
                        case 'height': height = numValue; break;
                        case 'depth': depth = numValue; break;
                        case 'wallThickness': wallThickness = numValue; break;
                    }
                }
            }
        }

        // Validate required properties
        if (width === undefined || height === undefined || depth === undefined) {
            throw new Error('Missing required properties: width, height, and depth must be specified');
        }

        // Construct and return the validated house properties
        return {
            width,
            height,
            depth,
            ...(wallThickness !== undefined ? { wallThickness } : {}),
            ...(material ? { material } : {})
        };
    } catch (error) {
        console.error('Error parsing DSL:', error);
        throw error;
    }
}

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
        rotation?: { x: number; y: number; z: number };
        scale?: { x: number; y: number; z: number };
    };
}

export interface DSLCommand {
    type: string;
    properties: Record<string, any>;
    children?: DSLCommand[];
}

export class DSLInterpreter {
    private scene: BABYLON.Scene;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }

    interpret(commands: DSLCommand[]): void {
        commands.forEach(command => this.executeCommand(command));
    }

    private executeCommand(command: DSLCommand): void {
        switch (command.type) {
            case 'create':
                if (command.properties.type === 'house') {
                    // Handle house creation
                    break;
                }
                break;
            case 'physics':
                // Handle physics properties
                break;
            case 'simulate':
                if (command.properties.type === 'earthquake') {
                    // Handle earthquake simulation
                }
                break;
        }
    }
}