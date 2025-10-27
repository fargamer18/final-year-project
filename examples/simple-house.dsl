// Simple house example using our CAD DSL

House {
    // Basic house dimensions
    width: 6,
    height: 4,
    depth: 8,
    
    // Wall properties
    wallThickness: 0.2,

    // Optional properties for materials
    material: {
        walls: "white",
        roof: "red",
        foundation: "gray"
    }
}