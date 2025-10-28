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

        ast.forEach((command: any) => {
            if (!command.type) throw new Error('Invalid AST node');
            // very small simulation of execution
            console.log('Executing command', command.type, command.properties || command);
        });

        return true;
    }
}

// named export already provided above by the class declaration