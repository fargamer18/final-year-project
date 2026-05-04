// Tokyo Skinny House - 3D Replication
// Focus: Ultra-narrow footprint (12ft), High verticality, Light wells
House {
    width: 12, height: 45, depth: 40,
    style: "skinny-house",
    storeys: 4,
    plotWidthFt: 12, plotDepthFt: 40,
    hasLift: true,
    designIntent: "tokyo-urban-minimalism"
}

// Transparent Light Well (Vertical Core)
create core { name: "Glass Light Well", width: 4, height: 45, depth: 6, position: [-4, 22.5, 0], color: "#ced4da", opacity: 0.3 }

// Compact Floor Slabs
create floor { name: "L3 Living Deck", width: 12, height: 0.8, depth: 40, position: [0, 34.5, 0], color: "#ffffff" }
