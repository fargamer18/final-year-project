// London Terrace House - 3D Replication
// Focus: Shared walls, Narrow street frontage, Ironwork balconies
House {
    width: 20, height: 38, depth: 60,
    style: "terrace-house",
    storeys: 3,
    plotWidthFt: 20, plotDepthFt: 70,
    designIntent: "london-victorian-terrace"
}

// Shared Wall Context (Visualized as dark boundary)
create wall { name: "Party Wall Left", width: 0.5, height: 38, depth: 60, position: [-10, 19, 0], color: "#3e2723" }

// Front Balcony (Traditional Ironwork feel)
create balcony { name: "L1 Ironwork Balcony", width: 18, height: 0.4, depth: 3, position: [0, 13.5, 31.5], color: "#3e2723" }
