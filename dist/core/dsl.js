// Simple parser for the DSL
export function parseDSL(dslCode) {
    try {
        // Remove comments and whitespace
        dslCode = dslCode.replace(/\/\/.*$/gm, '').trim();
        // Basic parsing of the house structure
        const houseMatch = dslCode.match(/House\s*{([^}]*)}/s);
        if (!houseMatch) {
            throw new Error('No House definition found in DSL');
        }
        let width;
        let height;
        let depth;
        let wallThickness;
        let material;
        const propertyLines = houseMatch[1].split(',').map(line => line.trim()).filter(Boolean);
        for (const line of propertyLines) {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) {
                if (value.startsWith('{')) {
                    // Handle nested objects (like materials)
                    const objStr = value.replace(/[{}]/g, '');
                    const materialObj = {};
                    objStr.split(',').map(pair => pair.trim()).filter(Boolean).forEach(pair => {
                        const [k, v] = pair.split(':').map(p => p.trim());
                        if (k && v) {
                            materialObj[k] = v.replace(/"/g, '');
                        }
                    });
                    if (key === 'material') {
                        material = materialObj;
                    }
                }
                else {
                    // Handle numeric values
                    const numValue = value.includes('.') ? parseFloat(value) : parseInt(value);
                    switch (key) {
                        case 'width':
                            width = numValue;
                            break;
                        case 'height':
                            height = numValue;
                            break;
                        case 'depth':
                            depth = numValue;
                            break;
                        case 'wallThickness':
                            wallThickness = numValue;
                            break;
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
    }
    catch (error) {
        console.error('Error parsing DSL:', error);
        throw error;
    }
}
export class DSLInterpreter {
    constructor(scene) {
        this.scene = scene;
    }
    interpret(commands) {
        commands.forEach(command => this.executeCommand(command));
    }
    executeCommand(command) {
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
//# sourceMappingURL=dsl.js.map