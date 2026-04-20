// ArchGPT DSL - House with Advanced Materials and CAD Tools
// Demonstrates materials, transformations, and CAD operations

// --- Create a house with specific dimensions ---
create house {
    width: 10,
    height: 6,
    depth: 12,
    wallThickness: 0.3,
    position: [0, 0, 0]
}

// --- Apply wood material to walls ---
applyMaterial {
    material: "oak"
}

// --- Create foundation with concrete ---
create Foundation {
    width: 10.6,
    height: 0.5,
    depth: 12.6,
    position: [0, -0.5, 0]
}

applyMaterial {
    material: "concrete"
}

// --- Create roof with tile material ---
create Roof {
    width: 10,
    height: 3,
    depth: 12,
    position: [0, 6.5, 0]
}

applyMaterial {
    material: "tileRoof"
}

// --- Create windows with glass ---
create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [2, 3, 6.1]
}

applyMaterial {
    material: "clearGlass"
}

create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [-2, 3, 6.1]
}

applyMaterial {
    material: "clearGlass"
}

// --- Create door with wood frame and glass panel ---
create Door {
    width: 1,
    height: 2.2,
    depth: 0.08,
    position: [0, 1.1, 12]
}

applyMaterial {
    material: "mahogany"
}

// --- Apply earthquake physics ---
physics {
    mass: 1,
    restitution: 0.1,
    friction: 0.8
}

simulate earthquake {
    duration: 5000,
    amplitude: 0.3,
    frequency: 3
}
