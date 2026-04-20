// ArchGPT DSL - CAD Operations Example
// Demonstrates transformations: move, rotate, scale, duplicate, mirror

// --- Create initial wall ---
create Wall {
    width: 5,
    height: 3,
    depth: 0.2,
    position: [0, 0, 0]
}

applyMaterial {
    material: "redBrick"
}

// --- Move the wall 2 units to the right ---
move Wall to 2, 0, 0

// --- Rotate the wall 45 degrees around Z axis ---
rotate Wall by 0, 0, 45

// --- Scale the wall 1.5x in all dimensions ---
scale Wall to 1.5, 1.5, 1.5

// --- Create a beam ---
create Beam {
    width: 0.3,
    height: 0.3,
    depth: 8,
    position: [5, 0, 0]
}

applyMaterial {
    material: "steel"
}

// --- Duplicate the beam 3 times ---
duplicate Beam
duplicate Beam
duplicate Beam

// --- Mirror a wall on the X axis ---
create Wall {
    width: 4,
    height: 2.5,
    depth: 0.2,
    position: [-3, 0, 5]
}

applyMaterial {
    material: "whiteBrick"
}

mirror Wall x

// --- Join two objects ---
create Column {
    width: 0.4,
    height: 4,
    depth: 0.4,
    position: [0, 0, 3]
}

applyMaterial {
    material: "concrete"
}

// --- Create a complex structure by duplicating and arranging ---
create Prism {
    width: 2,
    height: 2,
    depth: 2,
    position: [0, 0, -5]
}

applyMaterial {
    material: "marble"
}

// Scale it smaller to create architectural detail
scale Prism to 0.8

// Duplicate and arrange along an axis
duplicate Prism
move Prism to 3, 0, -5

duplicate Prism
move Prism to 6, 0, -5

duplicate Prism
move Prism to 9, 0, -5
