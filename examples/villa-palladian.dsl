// Palladian Villa - 3D Replication
// Focus: Strict Bilateral Symmetry, Grand Columned Portico
House {
    width: 120, height: 40, depth: 100,
    style: "palladian",
    storeys: 3,
    plotWidthFt: 150, plotDepthFt: 120,
    hasLift: true,
    designIntent: "neoclassical-order"
}

// Strict Central Core
create core { name: "Central Stair Hall", width: 15, height: 50, depth: 15, position: [0, 25, 0], color: "#3e2723" }

// Symmetrical Wings
create wall { name: "East Wing", width: 30, height: 24, depth: 60, position: [45, 14, 0], color: "#f8f9fa" }
create wall { name: "West Wing", width: 30, height: 24, depth: 60, position: [-45, 14, 0], color: "#f8f9fa" }

// Temple-Front Portico
create wall { name: "Grand Ionic Columns", width: 24, height: 30, depth: 10, position: [0, 17, 55], color: "#f8f9fa" }
