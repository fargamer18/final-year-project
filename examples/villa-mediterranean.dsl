// Mediterranean Villa - 3D Replication
// Focus: Central Courtyards, Arched Porticos, Terracotta Tones
House {
    width: 80, height: 28, depth: 60,
    style: "mediterranean",
    storeys: 2,
    plotWidthFt: 100, plotDepthFt: 80,
    hasBasement: true,
    designIntent: "mediterranean-estate"
}

// Central Courtyard (Thermal Well)
create floor { name: "Central Courtyard", width: 20, height: 0.2, depth: 20, position: [0, 2.1, 0], color: "#a8dadc" }

// Grand Loggia (Arched Portico)
create floor { name: "Front Loggia", width: 40, height: 0.5, depth: 12, position: [0, 2.25, 30], color: "#bc6c25" }

// Subtype Materials
create wall { name: "Stucco Facade", width: 70, height: 12, depth: 50, position: [0, 8, 0], color: "#f2e8cf" }
create roof { name: "Terracotta Roof", width: 84, height: 4, depth: 64, position: [0, 28, 0], color: "#8b4513" }
