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
export function parseCreateStatements(dslCode) {
    console.log('=== DSL PARSER START ===');
    const elements = [];
    try {
        // First, split by lines and find all create blocks
        const lines = dslCode.split('\n');
        console.log(`Total lines: ${lines.length}`);
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            // Look for "create TYPE {"
            if (line.startsWith('create ')) {
                const typeMatch = line.match(/create\s+(\w+)\s*{?/);
                if (typeMatch) {
                    const type = typeMatch[1];
                    console.log(`\n>> Found '${type}' at line ${i}`);
                    const props = {};
                    i++;
                    // Read properties until we find the closing brace
                    let depth = 1; // We already saw the opening brace
                    while (i < lines.length && depth > 0) {
                        const propLine = lines[i].trim();
                        if (propLine.includes('{'))
                            depth++;
                        if (propLine.includes('}')) {
                            depth--;
                            if (depth === 0) {
                                console.log(`   Closing brace found at line ${i}`);
                                break;
                            }
                        }
                        if (propLine && !propLine.startsWith('//') && !propLine.includes('{') && !propLine.includes('}')) {
                            // Parse this property line
                            // Format: key: value, or key: [a, b, c],
                            if (propLine.includes(':')) {
                                const [keyPart, valuePart] = propLine.split(':', 2);
                                const key = keyPart.trim();
                                const value = valuePart.trim().replace(/,\s*$/, ''); // Remove trailing comma
                                if (key === 'position' && value.startsWith('[')) {
                                    // Parse array position
                                    const arrayMatch = value.match(/\[(.*)\]/);
                                    if (arrayMatch) {
                                        const coords = arrayMatch[1]
                                            .split(',')
                                            .map(c => parseFloat(c.trim()))
                                            .filter(n => !isNaN(n));
                                        if (coords.length === 3) {
                                            props.position = [coords[0], coords[1], coords[2]];
                                            console.log(`   -> position: [${coords[0]}, ${coords[1]}, ${coords[2]}]`);
                                        }
                                    }
                                }
                                else if (key === 'name') {
                                    props.name = value.replace(/['"]/g, '');
                                    console.log(`   -> name: "${props.name}"`);
                                }
                                else if (key === 'material') {
                                    props.material = value.replace(/['"]/g, '');
                                    console.log(`   -> material: "${props.material}"`);
                                }
                                else if (['width', 'height', 'depth', 'radius'].includes(key)) {
                                    const numVal = parseFloat(value);
                                    if (!isNaN(numVal)) {
                                        props[key] = numVal;
                                        console.log(`   -> ${key}: ${numVal}`);
                                    }
                                }
                            }
                        }
                        i++;
                    }
                    // Check if we got required dimensions
                    if (props.width !== undefined || props.height !== undefined || props.depth !== undefined) {
                        elements.push({ type, properties: props });
                        console.log(`   ✓ Added ${type}`);
                    }
                    else {
                        console.log(`   ✗ Skipped ${type} - no dimensions`);
                    }
                    continue;
                }
            }
            i++;
        }
        console.log(`\n=== DSL PARSER END: Found ${elements.length} elements ===\n`);
    }
    catch (error) {
        console.error('Parser error:', error);
        throw error;
    }
    return elements;
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