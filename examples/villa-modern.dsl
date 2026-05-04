// Modernist Villa - 3D Replication (Inspired by CGTrader #3044585)
// Focus: Stark Orthogonal Massing, Deep Cantilevers, Glass Facades
House {
    width: 100, height: 32, depth: 80,
    style: "modernist",
    storeys: 2,
    plotWidthFt: 120, plotDepthFt: 100,
    hasLift: true,
    designIntent: "high-tech-modernism"
}

// Deep Slab Cantilevers (CGTrader characteristic)
create floor { name: "L1 Cantilever Slab", width: 110, height: 1.2, depth: 90, position: [0, 16, 5], color: "#212529" }

// Glass Curtain Walls
create wall { name: "Ground Floor Glass Box", width: 90, height: 14, depth: 70, position: [0, 9, 0], color: "#caf0f8", opacity: 0.4 }

// Vertical Core (Integrated Lift)
create core { name: "Structural Spine", width: 12, height: 40, depth: 12, position: [-40, 20, 0], color: "#212529" }
