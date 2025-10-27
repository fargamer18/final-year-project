import { PhysicsEngine } from '../engine/physics';
import { Wall, Prism } from '../models/primitives';
describe('PhysicsEngine', () => {
    let physicsEngine;
    beforeEach(() => {
        physicsEngine = new PhysicsEngine();
    });
    test('should simulate physics for a Wall', () => {
        const wall = new Wall({ height: 10, width: 5, x: 0, y: 0 });
        const result = physicsEngine.simulate(wall);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('force');
        expect(result.force).toBeGreaterThan(0);
    });
    test('should simulate physics for a Prism', () => {
        const prism = new Prism({ height: 10, width: 5, x: 0, y: 0 });
        const result = physicsEngine.simulate(prism);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('force');
        expect(result.force).toBeGreaterThan(0);
    });
    test('should handle multiple models', () => {
        const wall = new Wall({ height: 10, width: 5, x: 0, y: 0 });
        const prism = new Prism({ height: 10, width: 5, x: 5, y: 5 });
        const results = physicsEngine.simulate([wall, prism]);
        expect(results).toHaveLength(2);
        results.forEach(result => {
            expect(result).toBeDefined();
            expect(result).toHaveProperty('force');
            expect(result.force).toBeGreaterThan(0);
        });
    });
});
