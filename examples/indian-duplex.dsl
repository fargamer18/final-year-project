// Indian Vertical Duplex - 3D Replication
// Focus: Double-Height Drawing Room, Puja Room, Jaisalmer Stone
House {
    width: 30, height: 35, depth: 40,
    style: "indian-duplex",
    storeys: 2,
    plotWidthFt: 30, plotDepthFt: 40,
    hasLift: true,
    designIntent: "indian-urban-duplex"
}

// Double Height Drawing Room (Grandeur)
create wall { name: "Double Height Void", width: 16, height: 22, depth: 16, position: [0, 11, 10], color: "#ebcf97", opacity: 0.5 }

// Puja Room (Cultural Niche)
create wall { name: "Puja Room", width: 6, height: 8, depth: 6, position: [10, 4, -15], color: "#fdfdfd" }

// Balconies with Teak Railings
create balcony { name: "First Floor Balcony", width: 24, height: 0.4, depth: 4, position: [0, 12.5, 22], color: "#4a3728" }
