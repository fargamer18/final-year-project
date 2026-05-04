// Tropical Villa - 3D Replication
// Focus: Pavilion Style (Separated Masses), Semi-Open Living, Deep Overhangs
House {
    width: 90, height: 22, depth: 90,
    style: "tropical",
    storeys: 1,
    plotWidthFt: 120, plotDepthFt: 120,
    designIntent: "balinese-resort"
}

// Separated Pavilions
create wall { name: "Living Pavilion", width: 30, height: 12, depth: 30, position: [-30, 8, 30], color: "#fffcf2" }
create wall { name: "Bedroom Pavilion", width: 30, height: 12, depth: 30, position: [30, 8, 30], color: "#fffcf2" }

// Central Reflecting Pool
create floor { name: "Reflecting Pool", width: 40, height: 0.1, depth: 60, position: [0, 0.05, -10], color: "#ebf2fa" }

// Deep Overhanging Roofs
create roof { name: "Thatch Overhang", width: 40, height: 2, depth: 40, position: [-30, 20, 30], color: "#403d39" }
