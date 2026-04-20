class Wall {
    public height: number;
    public width: number;
    public x: number;
    public y: number;

    constructor(opts: { height: number; width: number; x: number; y: number }) {
        this.height = opts.height;
        this.width = opts.width;
        this.x = opts.x;
        this.y = opts.y;
    }
}

class Prism {
    public height: number;
    public width: number;
    public depth: number;
    public x: number;
    public y: number;
    public z: number;

    constructor(opts: { height: number; width: number; depth?: number; x: number; y: number; z?: number }) {
        this.height = opts.height;
        this.width = opts.width;
        this.depth = opts.depth ?? 1;
        this.x = opts.x;
        this.y = opts.y;
        this.z = opts.z ?? 0;
    }
}

export { Wall, Prism };