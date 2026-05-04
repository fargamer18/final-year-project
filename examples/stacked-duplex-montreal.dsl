// Montreal Stacked Duplex - 3D Replication
// Focus: Vertical unit stacking, External private entrance, Brick facade
House {
    width: 30, height: 26, depth: 50,
    style: "stacked-duplex",
    storeys: 2,
    plotWidthFt: 40, plotDepthFt: 60,
    designIntent: "montreal-plex-housing"
}

// Upper Unit External Entrance
create balcony { name: "Private Entrance Landing", width: 8, height: 0.5, depth: 10, position: [18, 12, 20], color: "#8b4513" }

// Unit Separation Slab
create floor { name: "Unit Separation", width: 30, height: 1.0, depth: 50, position: [0, 13, 0], color: "#f8f9fa" }
