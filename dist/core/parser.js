export class DSLParser {
    parse(dslString) {
        // Very small placeholder parser for tests
        // Example: 'create Wall { height: 10, width: 5 }'
        const createMatch = /create\s+(\w+)\s*\{([^}]*)\}/i.exec(dslString);
        if (!createMatch)
            throw new Error('Invalid DSL string');
        const type = createMatch[1];
        const propsString = createMatch[2];
        const props = {};
        propsString.split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
            const [k, v] = part.split(':').map(x => x.trim());
            const num = Number(v);
            props[k] = isNaN(num) ? v.replace(/^['"]|['"]$/g, '') : num;
        });
        // Only accept known types for tests
        const allowed = ['Wall', 'Prism'];
        if (!allowed.includes(type)) {
            throw new Error('Unknown shape type');
        }
        return { type, properties: props };
    }
}
//# sourceMappingURL=parser.js.map