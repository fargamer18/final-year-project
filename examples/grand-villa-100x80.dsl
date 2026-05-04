// Grand Luxury Villa - 100x80
// Designed to address peer feedback: Hierarchy, Depth, and Material Identity

House {
    width: 100,
    height: 35,
    depth: 80,
    style: "luxury",
    roadFacing: "north",
    mainEntranceFacing: "north",
    storeys: 3,
    plotWidthFt: 120,
    plotDepthFt: 100,
    hasBasement: true,
    hasLift: true,
    source: "architect-pro"
}

// ==================== FOUNDATION & BASEMENT ====================

create Foundation {
    name: "Main Plinth",
    width: 106,
    height: 1.5,
    depth: 86,
    position: [0, -0.75, 0]
}
applyMaterial { material: "granite" }

create Floor {
    name: "Basement Floor",
    width: 90,
    height: 0.5,
    depth: 70,
    position: [0, -11.5, 0]
}
applyMaterial { material: "polishedConcrete" }

create Wall {
    name: "Basement North Wall",
    width: 90,
    height: 10,
    depth: 0.5,
    position: [0, -6.5, 35]
}
applyMaterial { material: "concrete" }

// ==================== GROUND FLOOR (G) ====================

// Grand Entrance Slab
create Floor {
    name: "Ground Floor Slab",
    width: 100,
    height: 0.5,
    depth: 80,
    position: [0, 0.25, 0]
}
applyMaterial { material: "marble" }

// Hierarchy: Grand Entrance Portico
create Floor {
    name: "Entrance Portico",
    width: 30,
    height: 0.4,
    depth: 15,
    position: [0, 0.26, 45]
}
applyMaterial { material: "marble" }

// Double-Height Columns for Hierarchy
create Column {
    name: "Entrance Column Left",
    width: 1.2,
    height: 22,
    depth: 1.2,
    position: [-12, 11, 52]
}
applyMaterial { material: "whitePaint" }

create Column {
    name: "Entrance Column Right",
    width: 1.2,
    height: 22,
    depth: 1.2,
    position: [12, 11, 52]
}
applyMaterial { material: "whitePaint" }

// Grand Entrance Door (Double height look)
create Door {
    name: "Grand Entrance",
    width: 6,
    height: 9,
    depth: 0.4,
    position: [0, 4.5, 40.2]
}
applyMaterial { material: "mahogany" }

// Glass Facade for Luxury Identity
create Wall {
    name: "Living Room Glass Facade",
    width: 40,
    height: 10,
    depth: 0.2,
    position: [-25, 5, 40]
}
applyMaterial { material: "clearGlass" }

// ==================== FIRST FLOOR (F1) ====================

// First Floor Slab with Cantilever
create Floor {
    name: "First Floor Slab",
    width: 110,  // Cantilevered 5ft on each side
    height: 0.5,
    depth: 85,   // Cantilevered 5ft on front
    position: [0, 10.75, 2.5]
}
applyMaterial { material: "marble" }

// Offset/Depth: Master Bedroom pushed forward
create Wall {
    name: "Master Suite Front",
    width: 30,
    height: 10,
    depth: 0.4,
    position: [30, 15.5, 45]
}
applyMaterial { material: "walnut" } // Wood accent for material identity

create Window {
    name: "Master Suite Window",
    width: 20,
    height: 7,
    depth: 0.2,
    position: [30, 15.5, 45.3]
}
applyMaterial { material: "tintedGlass" }

// ==================== SECOND FLOOR (F2) / TERRACE ====================

create Floor {
    name: "Second Floor Slab",
    width: 80,   // Stepped back for terrace
    height: 0.5,
    depth: 60,
    position: [-10, 21.25, -10]
}
applyMaterial { material: "marble" }

// Roof with overhangs
create Roof {
    name: "Villa Flat Roof",
    width: 90,
    height: 1,
    depth: 70,
    position: [-10, 31, -10]
}
applyMaterial { material: "metalRoof" }

// ==================== LIFT & CORE ====================

create Wall {
    name: "Lift Shaft",
    width: 8,
    height: 45,
    depth: 8,
    position: [40, 11, -30]
}
applyMaterial { material: "steel" }

// ==================== PARKING SPACE ====================

create Floor {
    name: "Parking Area",
    width: 40,
    height: 0.1,
    depth: 30,
    position: [-35, 0.05, 55]
}
applyMaterial { material: "asphaltShingles" }

create Wall {
    name: "Parking Canopy",
    width: 40,
    height: 0.3,
    depth: 30,
    position: [-35, 10, 55]
}
applyMaterial { material: "aluminum" }

// ==================== REFINEMENTS ====================

physics {
    mass: 1000,
    restitution: 0.05
}
