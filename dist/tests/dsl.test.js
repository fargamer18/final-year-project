import { DSLParser } from '../core/parser.js';
import { DSLInterpreter } from '../core/interpreter.js';
describe('DSLParser and DSLInterpreter', () => {
    let parser;
    let interpreter;
    beforeEach(() => {
        parser = new DSLParser();
        interpreter = new DSLInterpreter();
    });
    test('should parse a simple DSL command with create keyword', () => {
        const dslCommand = 'create Wall { height: 10, width: 5 }';
        const ast = parser.parse(dslCommand);
        expect(ast).toBeDefined();
        expect(ast.type).toBe('Wall');
        expect(ast.properties.height).toBe(10);
        expect(ast.properties.width).toBe(5);
    });
    test('should parse a simple DSL command with block syntax (no create)', () => {
        const dslCommand = 'Wall { height: 10, width: 5 }';
        const ast = parser.parse(dslCommand);
        expect(ast).toBeDefined();
        expect(ast.type).toBe('Wall');
        expect(ast.properties.height).toBe(10);
        expect(ast.properties.width).toBe(5);
    });
    test('should parse House definition with block syntax', () => {
        const dslCommand = 'House { width: 8, height: 6, depth: 10 }';
        const ast = parser.parse(dslCommand);
        expect(ast).toBeDefined();
        expect(ast.type).toBe('House');
        expect(ast.properties.width).toBe(8);
        expect(ast.properties.height).toBe(6);
        expect(ast.properties.depth).toBe(10);
    });
    test('should execute a parsed DSL command', () => {
        const dslCommand = 'create Wall { height: 10, width: 5 }';
        const ast = parser.parse(dslCommand);
        const result = interpreter.execute(ast);
        expect(result).toBeTruthy(); // Assuming execution returns a truthy value
    });
    test('should handle invalid DSL commands gracefully', () => {
        const invalidDslCommand = 'create InvalidShape { }';
        expect(() => parser.parse(invalidDslCommand)).toThrowError();
    });
});
//# sourceMappingURL=dsl.test.js.map