// Simple parser for the DSL
/**
 * Split a string by a delimiter while respecting brace/bracket nesting depth.
 */
function depthAwareSplit(input, delimiter = ',') {
    const parts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '{' || char === '[')
            depth++;
        if (char === '}' || char === ']')
            depth = Math.max(0, depth - 1);
        if (char === delimiter && depth === 0) {
            if (current.trim())
                parts.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    if (current.trim())
        parts.push(current.trim());
    return parts;
}
export function parseDSL(dslCode) {
    try {
        // Remove comments and whitespace
        dslCode = dslCode.replace(/\/\/.*$/gm, '').trim();
        // Match the House block, allowing nested braces
        const houseMatch = dslCode.match(/House\s*\{([\s\S]*?)\}/);
        if (!houseMatch) {
            throw new Error('No House definition found in DSL');
        }
        let width;
        let height;
        let depth;
        let wallThickness;
        let material;
        const propertyLines = depthAwareSplit(houseMatch[1]);
        for (const line of propertyLines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            if (key && value) {
                if (value.startsWith('{') && value.endsWith('}')) {
                    // Handle nested objects (like materials)
                    const innerStr = value.slice(1, -1);
                    const materialObj = {};
                    depthAwareSplit(innerStr).forEach(pair => {
                        const pairColonIndex = pair.indexOf(':');
                        if (pairColonIndex === -1)
                            return;
                        const k = pair.slice(0, pairColonIndex).trim();
                        const v = pair.slice(pairColonIndex + 1).trim();
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
        const createRegex = /(?:^|\n)\s*create\s+([A-Za-z][\w-]*)\s*\{([\s\S]*?)\}/gi;
        let match;
        while ((match = createRegex.exec(dslCode))) {
            const type = match[1];
            const block = match[2];
            const props = {};
            const parts = [];
            let current = '';
            let depth = 0;
            for (let i = 0; i < block.length; i++) {
                const char = block[i];
                if (char === '{' || char === '[')
                    depth++;
                if (char === '}' || char === ']')
                    depth = Math.max(0, depth - 1);
                if ((char === ',' || char === '\n') && depth === 0) {
                    if (current.trim())
                        parts.push(current.trim());
                    current = '';
                }
                else {
                    current += char;
                }
            }
            if (current.trim())
                parts.push(current.trim());
            parts.forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1)
                    return;
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                if (key === 'position' && value.startsWith('[')) {
                    const coords = value.slice(1, -1).split(',').map(c => parseFloat(c.trim())).filter(n => !isNaN(n));
                    if (coords.length === 3)
                        props.position = [coords[0], coords[1], coords[2]];
                }
                else if (key === 'name') {
                    props[key] = value.replace(/['"]/g, '');
                }
                else if (key === 'material') {
                    if (value.startsWith('{')) {
                        const matchWalls = value.match(/walls\s*:\s*['"]([^'"]+)['"]/);
                        props.material = matchWalls ? matchWalls[1] : value;
                    }
                    else {
                        props.material = value.replace(/['"]/g, '');
                    }
                }
                else if (['width', 'height', 'depth', 'radius'].includes(key)) {
                    const numVal = parseFloat(value);
                    if (!isNaN(numVal))
                        props[key] = numVal;
                }
            });
            if (props.width !== undefined || props.height !== undefined || props.depth !== undefined) {
                elements.push({ type, properties: props });
                console.log(`   ✓ Added ${type}`);
            }
            else {
                console.log(`   ✗ Skipped ${type} - no dimensions`);
            }
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