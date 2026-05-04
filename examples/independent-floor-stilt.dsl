// Independent Floor (Stilt+4) - 3D Replication
// Focus: Stilt Parking, Multi-storey Stacking, CNC Jaali Screens
House {
    width: 25, height: 55, depth: 50,
    style: "stilt-plus-four",
    storeys: 5,
    plotWidthFt: 25, plotDepthFt: 50,
    hasLift: true,
    designIntent: "indian-high-density-vertical"
}

// Stilt Parking (Ground Level)
create wall { name: "Stilt Column Front Left", width: 1.5, height: 10, depth: 1.5, position: [-10, 5, 20], color: "#212529" }
create wall { name: "Stilt Column Front Right", width: 1.5, height: 10, depth: 1.5, position: [10, 5, 20], color: "#212529" }

// CNC Jaali Screens for Privacy/Aesthetics
create wall { name: "Facade Jaali Screen", width: 10, height: 40, depth: 0.1, position: [-8, 30, 25.1], color: "#b45309", opacity: 0.6 }

// Individual Floor Slabs
create floor { name: "L3 Floor Slab", width: 25, height: 0.8, depth: 50, position: [0, 31.5, 0], color: "#e5e5e5" }
