// 30x40 Bangalore House Floor Plan
// Based on typical Indian residential architecture
// Dimensions: 30 feet wide x 40 feet deep

// ==================== GROUND FLOOR ====================

// Outer walls (perimeter)
create Wall {
    width: 30,
    height: 9,
    depth: 0.3,
    position: [0, 0, 0],
    name: "front_wall"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 30,
    height: 9,
    depth: 0.3,
    position: [0, 0, 40],
    name: "back_wall"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 0.3,
    height: 9,
    depth: 40,
    position: [-15, 0, 20],
    name: "left_wall"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 0.3,
    height: 9,
    depth: 40,
    position: [15, 0, 20],
    name: "right_wall"
}
applyMaterial { material: "whiteBrick" }

// Foundation
create Foundation {
    width: 30.6,
    height: 0.5,
    depth: 40.6,
    position: [0, -0.5, 20],
    name: "foundation"
}
applyMaterial { material: "concrete" }

// ==================== GROUND FLOOR LAYOUT ====================

// Front Gate/Entrance
create Door {
    width: 1.2,
    height: 2.2,
    depth: 0.1,
    position: [0, 1, -0.15],
    name: "main_entrance"
}
applyMaterial { material: "mahogany" }

// Verandah (Front porch area)
create Floor {
    width: 30,
    height: 0,
    depth: 4,
    position: [0, 0.05, 2],
    name: "verandah_gf"
}
applyMaterial { material: "tile" }

// Living Room (center-left, ground floor)
create Wall {
    width: 12,
    height: 9,
    depth: 0.2,
    position: [-9, 0, 10],
    name: "living_wall1"
}
applyMaterial { material: "whiteBrick" }

create Floor {
    width: 12,
    height: 0,
    depth: 7,
    position: [-9, 0.05, 13],
    name: "living_room_gf"
}
applyMaterial { material: "polishedConcrete" }

// Living Room Window 1
create Window {
    width: 1.8,
    height: 1.5,
    depth: 0.1,
    position: [-14, 3, -0.15],
    name: "living_window1"
}
applyMaterial { material: "clearGlass" }

// Living Room Window 2
create Window {
    width: 1.8,
    height: 1.5,
    depth: 0.1,
    position: [-4, 3, -0.15],
    name: "living_window2"
}
applyMaterial { material: "clearGlass" }

// Kitchen (back-left, ground floor)
create Wall {
    width: 12,
    height: 9,
    depth: 0.2,
    position: [-9, 0, 26],
    name: "kitchen_wall1"
}
applyMaterial { material: "whitePaint" }

create Floor {
    width: 12,
    height: 0,
    depth: 7,
    position: [-9, 0.05, 23],
    name: "kitchen_gf"
}
applyMaterial { material: "whiteTile" }

// Kitchen Window
create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [-9, 3, 39.85],
    name: "kitchen_window"
}
applyMaterial { material: "frostedGlass" }

// Bedroom 1 (right side, ground floor)
create Wall {
    width: 13,
    height: 9,
    depth: 0.2,
    position: [6.5, 0, 13],
    name: "bedroom1_wall"
}
applyMaterial { material: "beigePaint" }

create Floor {
    width: 13,
    height: 0,
    depth: 10,
    position: [6.5, 0.05, 18],
    name: "bedroom1_gf"
}
applyMaterial { material: "oak" }

// Bedroom 1 Windows
create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [1, 3, 39.85],
    name: "bed1_window1"
}
applyMaterial { material: "clearGlass" }

create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [12, 3, 39.85],
    name: "bed1_window2"
}
applyMaterial { material: "clearGlass" }

// Bathroom 1 (right-front, ground floor)
create Wall {
    width: 5,
    height: 9,
    depth: 0.2,
    position: [12.5, 0, 7],
    name: "bath1_wall"
}
applyMaterial { material: "whiteTile" }

create Floor {
    width: 5,
    height: 0,
    depth: 5,
    position: [12.5, 0.05, 9.5],
    name: "bathroom1_gf"
}
applyMaterial { material: "whiteTile" }

// Bathroom 1 Window (small ventilation)
create Window {
    width: 0.8,
    height: 0.8,
    depth: 0.1,
    position: [15, 3.5, -0.15],
    name: "bath1_vent"
}
applyMaterial { material: "frostedGlass" }

// Internal wall - dividing living and kitchen
create Wall {
    width: 0.2,
    height: 9,
    depth: 8,
    position: [-9, 0, 19],
    name: "divider_gf"
}
applyMaterial { material: "whiteBrick" }

// ==================== STAIRCASE ====================

create Wall {
    width: 3,
    height: 9,
    depth: 3,
    position: [11, 0.05, 8],
    name: "staircase_gf"
}
applyMaterial { material: "concrete" }

// ==================== FIRST FLOOR ====================

// Outer walls (first floor structure)
create Wall {
    width: 30,
    height: 8,
    depth: 0.3,
    position: [0, 3, 0],
    name: "front_wall_1f"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 30,
    height: 8,
    depth: 0.3,
    position: [0, 3, 40],
    name: "back_wall_1f"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 0.3,
    height: 8,
    depth: 40,
    position: [-15, 3, 20],
    name: "left_wall_1f"
}
applyMaterial { material: "whiteBrick" }

create Wall {
    width: 0.3,
    height: 8,
    depth: 40,
    position: [15, 3, 20],
    name: "right_wall_1f"
}
applyMaterial { material: "whiteBrick" }

// First floor slab
create Floor {
    width: 30,
    height: 0,
    depth: 40,
    position: [0, 3.05, 20],
    name: "floor_1f"
}
applyMaterial { material: "polishedConcrete" }

// Bedroom 2 (left-front, first floor)
create Wall {
    width: 12,
    height: 8,
    depth: 0.2,
    position: [-9, 3, 12],
    name: "bedroom2_wall"
}
applyMaterial { material: "beigePaint" }

create Floor {
    width: 12,
    height: 0,
    depth: 9,
    position: [-9, 3.05, 16.5],
    name: "bedroom2_1f"
}
applyMaterial { material: "walnut" }

// Bedroom 2 Windows
create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [-14, 5, -0.15],
    name: "bed2_window1"
}
applyMaterial { material: "clearGlass" }

create Window {
    width: 1.5,
    height: 1.2,
    depth: 0.1,
    position: [-4, 5, -0.15],
    name: "bed2_window2"
}
applyMaterial { material: "clearGlass" }

// Master Bedroom (right side, first floor)
create Wall {
    width: 13,
    height: 8,
    depth: 0.2,
    position: [6.5, 3, 18],
    name: "master_wall"
}
applyMaterial { material: "beigePaint" }

create Floor {
    width: 13,
    height: 0,
    depth: 18,
    position: [6.5, 3.05, 27],
    name: "master_bedroom_1f"
}
applyMaterial { material: "pine" }

// Master Bedroom Windows
create Window {
    width: 1.8,
    height: 1.5,
    depth: 0.1,
    position: [0.5, 5, 39.85],
    name: "master_window1"
}
applyMaterial { material: "clearGlass" }

create Window {
    width: 1.8,
    height: 1.5,
    depth: 0.1,
    position: [12.5, 5, 39.85],
    name: "master_window2"
}
applyMaterial { material: "clearGlass" }

// Bathroom 2 (left-back, first floor)
create Wall {
    width: 12,
    height: 8,
    depth: 0.2,
    position: [-9, 3, 32],
    name: "bathroom2_wall"
}
applyMaterial { material: "whiteTile" }

create Floor {
    width: 12,
    height: 0,
    depth: 6,
    position: [-9, 3.05, 35],
    name: "bathroom2_1f"
}
applyMaterial { material: "whiteTile" }

// Bathroom 2 Window
create Window {
    width: 0.8,
    height: 0.8,
    depth: 0.1,
    position: [-9, 5.5, 39.85],
    name: "bath2_vent"
}
applyMaterial { material: "frostedGlass" }

// ==================== ROOF ====================

create Roof {
    width: 30,
    height: 4,
    depth: 40,
    position: [0, 11, 20],
    name: "main_roof"
}
applyMaterial { material: "tileRoof" }

// ==================== PHYSICS & ENVIRONMENT ====================

physics {
    mass: 1,
    restitution: 0.1,
    friction: 0.8
}

// Optional earthquake simulation
// Uncomment to enable:
// simulate earthquake {
//     duration: 5000,
//     amplitude: 0.3,
//     frequency: 2
// }
