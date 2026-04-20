class Wall {
    constructor(opts) {
        this.height = opts.height;
        this.width = opts.width;
        this.x = opts.x;
        this.y = opts.y;
    }
}
class Prism {
    constructor(opts) {
        this.height = opts.height;
        this.width = opts.width;
        this.depth = opts.depth ?? 1;
        this.x = opts.x;
        this.y = opts.y;
        this.z = opts.z ?? 0;
    }
}
export { Wall, Prism };
//# sourceMappingURL=primitives.js.map