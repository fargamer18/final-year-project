declare class DSLInterpreter {
    private ast;
    constructor(ast: any);
    execute(): void;
    private createWall;
    private createPrism;
}
export { DSLInterpreter };
