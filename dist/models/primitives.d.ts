declare class Wall {
    height: number;
    width: number;
    x: number;
    y: number;
    constructor(opts: {
        height: number;
        width: number;
        x: number;
        y: number;
    });
}
declare class Prism {
    height: number;
    width: number;
    depth: number;
    x: number;
    y: number;
    z: number;
    constructor(opts: {
        height: number;
        width: number;
        depth?: number;
        x: number;
        y: number;
        z?: number;
    });
}
export { Wall, Prism };
