export class DSLParser {
    private commandCount: number = 0;

    /**
     * Parse DSL string into AST nodes
     * Supports:
     * - create Shape { properties }
     * - Shape { properties }
     * - move id to x, y, z
     * - rotate id by x, y, z
     * - scale id to x [, y, z]
     * - applyMaterial to shape { material: "oak" }
     * - delete id
     * - etc.
     */
    parse(dslString: string): any {
        // Support both syntaxes:
        // 1. Command syntax: 'create Wall { height: 10, width: 5 }'
        // 2. Block syntax: 'Wall { height: 10, width: 5 }'
        // 3. Transform commands: 'move id to 0, 5, 0'
        // 4. Material commands: 'applyMaterial to id { material: "oak" }'
        
        // Try shape/create syntax first
        const createMatch = /create\s+(\w+)\s*\{([^}]*)\}/i.exec(dslString);
        const blockMatch = /^(\w+)\s*\{([^}]*)\}$/i.exec(dslString.trim());
        
        // Try transform commands
        const moveMatch = /move\s+(\w+)\s+to\s+([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(dslString);
        const rotateMatch = /rotate\s+(\w+)\s+by\s+([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(dslString);
        const scaleMatch = /scale\s+(\w+)\s+to\s+([\d.]+)(?:\s*,\s*([\d.]+))?(?:\s*,\s*([\d.]+))?/i.exec(dslString);
        const deleteMatch = /delete\s+(\w+)/i.exec(dslString);
        const duplicateMatch = /duplicate\s+(\w+)/i.exec(dslString);
        const mirrorMatch = /mirror\s+(\w+)\s+(x|y|z)/i.exec(dslString);
        const materialMatch = /applyMaterial(?:\s+to\s+(\w+))?\s*\{([^}]*)\}/i.exec(dslString);
        
        if (createMatch) {
            // Command syntax with 'create' keyword
            const type = createMatch[1];
            const propsString = createMatch[2];
            return this.createShapeNode(type, propsString);
        } else if (blockMatch) {
            // Block syntax without 'create' keyword
            const type = blockMatch[1];
            const propsString = blockMatch[2];
            return this.createShapeNode(type, propsString);
        } else if (moveMatch) {
            return {
                command: 'move',
                objectId: moveMatch[1],
                x: parseFloat(moveMatch[2]),
                y: parseFloat(moveMatch[3]),
                z: parseFloat(moveMatch[4]),
                id: this.commandCount++
            };
        } else if (rotateMatch) {
            return {
                command: 'rotate',
                objectId: rotateMatch[1],
                x: parseFloat(rotateMatch[2]),
                y: parseFloat(rotateMatch[3]),
                z: parseFloat(rotateMatch[4]),
                id: this.commandCount++
            };
        } else if (scaleMatch) {
            return {
                command: 'scale',
                objectId: scaleMatch[1],
                x: parseFloat(scaleMatch[2]),
                y: scaleMatch[3] ? parseFloat(scaleMatch[3]) : parseFloat(scaleMatch[2]),
                z: scaleMatch[4] ? parseFloat(scaleMatch[4]) : parseFloat(scaleMatch[2]),
                id: this.commandCount++
            };
        } else if (deleteMatch) {
            return {
                command: 'delete',
                objectId: deleteMatch[1],
                id: this.commandCount++
            };
        } else if (duplicateMatch) {
            return {
                command: 'duplicate',
                objectId: duplicateMatch[1],
                id: this.commandCount++
            };
        } else if (mirrorMatch) {
            return {
                command: 'mirror',
                objectId: mirrorMatch[1],
                axis: mirrorMatch[2].toLowerCase(),
                id: this.commandCount++
            };
        } else if (materialMatch) {
            const propsString = materialMatch[2];
            const props = this.parseProperties(propsString);
            return {
                command: 'applyMaterial',
                material: props.material || 'default',
                id: this.commandCount++
            };
        } else {
            throw new Error('Invalid DSL syntax: ' + dslString);
        }
    }

    private createShapeNode(type: string, propsString: string): any {
        const props = this.parseProperties(propsString);

        // Only accept known types
        const allowed = [
            'Wall', 'Prism', 'House', 'house', 
            'Door', 'Window', 'Roof', 'Foundation',
            'Beam', 'Column', 'Floor',
            'physics', 'simulate', 'earthquake'
        ];
        
        if (!allowed.includes(type)) {
            throw new Error(`Unknown shape type: ${type}`);
        }

        return { 
            type, 
            properties: props,
            id: this.commandCount++
        };
    }

    private parseProperties(propsString: string): Record<string, any> {
        const props: any = {};
        
        // Handle nested objects and arrays
        const parts = this.smartSplit(propsString);
        
        parts.forEach(part => {
            const colonIndex = part.indexOf(':');
            if (colonIndex > 0) {
                const key = part.substring(0, colonIndex).trim();
                const value = part.substring(colonIndex + 1).trim();
                props[key] = this.parseValue(value);
            }
        });

        return props;
    }

    private parseValue(value: string): any {
        value = value.trim();

        // Try to parse as number
        if (/^[\d.]+$/.test(value)) {
            return parseFloat(value);
        }

        // Try to parse as boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Try to parse as array [x, y, z]
        if (value.startsWith('[') && value.endsWith(']')) {
            const elements = value.slice(1, -1).split(',').map(e => {
                const num = parseFloat(e.trim());
                return isNaN(num) ? e.trim().replace(/^['"]|['"]$/g, '') : num;
            });
            return elements;
        }

        // Try to parse as object { key: value }
        if (value.startsWith('{') && value.endsWith('}')) {
            return this.parseProperties(value.slice(1, -1));
        }

        // Parse as string
        return value.replace(/^['"]|['"]$/g, '');
    }

    private smartSplit(str: string, delimiter: string = ','): string[] {
        const parts: string[] = [];
        let current = '';
        let depth = 0;
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }

            if (!inString) {
                if (char === '{' || char === '[') depth++;
                if (char === '}' || char === ']') depth--;

                if (char === delimiter && depth === 0) {
                    parts.push(current.trim());
                    current = '';
                    continue;
                }
            }

            current += char;
        }

        if (current.trim()) {
            parts.push(current.trim());
        }

        return parts;
    }
}