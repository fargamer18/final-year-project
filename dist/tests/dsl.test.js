import { DSLParser } from '../core/parser';
import { DSLInterpreter } from '../core/interpreter';
describe('DSLParser and DSLInterpreter', () => {
    let parser;
    let interpreter;
    beforeEach(() => {
        parser = new DSLParser();
        interpreter = new DSLInterpreter();
    });
    test('should parse a simple DSL command', () => {
        const dslCommand = 'create Wall { height: 10, width: 5 }';
        const ast = parser.parse(dslCommand);
        expect(ast).toBeDefined();
        expect(ast.type).toBe('Wall');
        expect(ast.properties.height).toBe(10);
        expect(ast.properties.width).toBe(5);
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
