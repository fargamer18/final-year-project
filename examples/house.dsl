// Simple house with 4 walls and a prism roof
create house {
    width: 8,
    height: 6,
    depth: 10,
    wallThickness: 0.3,
    position: [0, 0, 0]
}

// Add physics properties
physics {
    mass: 1,
    restitution: 0.2,
    friction: 0.4
}

// Enable earthquake simulation
simulate earthquake {
    duration: 10000,
    amplitude: 0.5,
    frequency: 2
}