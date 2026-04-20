export declare class DSLParser {
    private commandCount;
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
    parse(dslString: string): any;
    private createShapeNode;
    private parseProperties;
    private parseValue;
    private smartSplit;
}
