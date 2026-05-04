export class DSLInterpreter {
    constructor() {
        // no-op constructor; interpreter is stateless for tests
    }

    execute(ast: any) {
        if (!ast) return false;
        // If single node, just handle it
        if (!Array.isArray(ast)) {
            ast = [ast];
        }

        ast.forEach((node: any) => {
            // Parser returns 'type' for shape commands, 'command' for transform commands
            const kind = node.type || node.command;
            if (!kind) throw new Error('Invalid AST node');
            console.log('Executing command', kind, node.properties || node);
        });

        return true;
    }
}

// named export already provided above by the class declaration