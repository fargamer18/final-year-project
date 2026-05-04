import { registerBlueprint, room, type ArchetypeBlueprint } from "../houseBlueprints";

// ── Duplex ───────────────────────────────────────────────────────
const duplexBlueprint: ArchetypeBlueprint = {
  archetype: "duplex",
  family: "vertical",
  label: "Duplex",
  defaultPlot: { widthFt: 34, depthFt: 24 },
  defaultStoreys: 2,
  maxStoreys: 3,
  defaultSetbacks: { front: 4, back: 3, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 12, columnSpacingZFt: 12, beamDepthFt: 1.2, columnSizeFt: 0.9 },
  materialPalette: { wall: "#e0dcd6", floor: "#c8c0b4", roof: "#3e3e3e", door: "#6b4226", window: "#b4ccd8", accent: "#8b7355", trim: "#a09080" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.7,
      core: ["stair core"],
      rooms: [
        room("parking", "PARKING", 10, 16, "SW"),
        room("foyer", "CIRCULATION", 6, 6, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 14, 14, "NW", { mustFaceRoad: true }),
        room("dining", "DINING", 10, 12, "NE"),
        room("kitchen", "KITCHEN", 10, 10, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("powder room", "WET AREA", 4, 5, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 6, 6, "SE", { requiresPlumbing: true }),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.7,
      core: ["stair core"],
      rooms: [
        room("master bedroom", "BEDROOM", 14, 12, "NW", { adjacentTo: ["master bath", "walk-in closet"] }),
        room("master bath", "WET AREA", 7, 6, "N", { requiresPlumbing: true }),
        room("walk-in closet", "SERVICE", 5, 5, "NE"),
        room("bedroom 2", "BEDROOM", 12, 10, "E", { adjacentTo: ["shared bath"] }),
        room("bedroom 3", "BEDROOM", 10, 10, "SE", { adjacentTo: ["shared bath"] }),
        room("family lounge", "LIVING", 10, 10, "SW"),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Electrical shaft", type: "electrical-shaft", positionHint: "SE" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "NE",
    basementUse: ["storage", "utility", "parking"],
    courtyardPosition: "rear",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Apartment ────────────────────────────────────────────────────
const apartmentBlueprint: ArchetypeBlueprint = {
  archetype: "apartment",
  family: "multifamily",
  label: "Apartment",
  defaultPlot: { widthFt: 30, depthFt: 22 },
  defaultStoreys: 4,
  maxStoreys: 8,
  defaultSetbacks: { front: 5, back: 4, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 10, columnSpacingZFt: 12, beamDepthFt: 1.5, columnSizeFt: 1.0 },
  materialPalette: { wall: "#d8d8d8", floor: "#c0bab0", roof: "#2c2c2c", door: "#5a4030", window: "#a8c0d0", accent: "#6d28d9", trim: "#909090" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 10,
      core: ["stair core", "lift core"],
      rooms: [
        room("entry lobby", "CIRCULATION", 8, 6, "N", { mustFaceRoad: true }),
        room("security desk", "SERVICE", 4, 4, "NE"),
        room("mail room", "SERVICE", 4, 4, "NW"),
        room("parking", "PARKING", 18, 16, "S"),
        room("lift lobby", "CIRCULATION", 4, 4, "center"),
        room("stair lobby", "CIRCULATION", 4, 4, "SE"),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.4,
      core: ["stair core", "lift core"],
      rooms: [
        room("unit living", "LIVING", 12, 12, "NW"),
        room("unit kitchen", "KITCHEN", 8, 8, "NE", { requiresPlumbing: true, requiresVentilation: true }),
        room("unit bedroom", "BEDROOM", 12, 10, "SW", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 4, 4, "SE", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 8, 4, "N"),
      ],
    },
    {
      level: "Second floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.4,
      core: ["stair core", "lift core"],
      rooms: [
        room("unit living", "LIVING", 12, 12, "NW"),
        room("unit kitchen", "KITCHEN", 8, 8, "NE", { requiresPlumbing: true, requiresVentilation: true }),
        room("unit bedroom", "BEDROOM", 12, 10, "SW", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 4, 4, "SE", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 8, 4, "N"),
      ],
    },
    {
      level: "Third floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.4,
      core: ["stair core", "lift core"],
      rooms: [
        room("unit living", "LIVING", 12, 12, "NW"),
        room("unit kitchen", "KITCHEN", 8, 8, "NE", { requiresPlumbing: true, requiresVentilation: true }),
        room("unit bedroom", "BEDROOM", 12, 10, "SW", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 4, 4, "SE", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 8, 4, "N"),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Dry riser", type: "dry-riser", positionHint: "SE" },
    { name: "Electrical shaft", type: "electrical-shaft", positionHint: "SW" },
    { name: "Plumbing stack", type: "plumbing-stack", positionHint: "NE" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1, 2, 3],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "center",
    basementUse: ["resident parking", "bike parking", "services", "trash room", "lift lobby"],
    courtyardPosition: "center",
    poolPosition: "rooftop",
  },
  userEditable: true,
};

// ── Townhouse ────────────────────────────────────────────────────
const townhouseBlueprint: ArchetypeBlueprint = {
  archetype: "townhouse",
  family: "shared-wall",
  label: "Townhouse",
  defaultPlot: { widthFt: 28, depthFt: 18 },
  defaultStoreys: 2,
  maxStoreys: 3,
  defaultSetbacks: { front: 3, back: 2, left: 0, right: 0 },
  structuralGrid: { columnSpacingXFt: 10, columnSpacingZFt: 9, beamDepthFt: 1.0, columnSizeFt: 0.8 },
  materialPalette: { wall: "#dcd4c8", floor: "#c4baa8", roof: "#484848", door: "#6b4226", window: "#b0c8d8", accent: "#8b6e4e", trim: "#a89880" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.2,
      core: ["stair core"],
      rooms: [
        room("parking", "PARKING", 10, 14, "SW"),
        room("foyer", "CIRCULATION", 4, 4, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 12, 12, "NW", { mustFaceRoad: true }),
        room("dining", "DINING", 8, 10, "NE"),
        room("kitchen", "KITCHEN", 8, 8, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("powder room", "WET AREA", 4, 4, "S", { requiresPlumbing: true }),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.2,
      core: ["stair core"],
      rooms: [
        room("master bedroom", "BEDROOM", 12, 10, "NW", { adjacentTo: ["master bath"] }),
        room("master bath", "WET AREA", 6, 5, "N", { requiresPlumbing: true }),
        room("bedroom 2", "BEDROOM", 10, 10, "NE", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 5, 5, "SE", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 8, 4, "N"),
        room("store room", "SERVICE", 4, 4, "S"),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Electrical panel", type: "electrical-shaft", positionHint: "SE" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "NE",
    basementUse: ["storage", "utility"],
    courtyardPosition: "rear",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Indian Vertical Duplex ───────────────────────────────────────
const indianDuplexBlueprint: ArchetypeBlueprint = {
  archetype: "duplex",
  family: "vertical",
  label: "Indian Vertical Duplex",
  defaultPlot: { widthFt: 30, depthFt: 40 },
  defaultStoreys: 2,
  maxStoreys: 4,
  defaultSetbacks: { front: 5, back: 4, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 12, columnSpacingZFt: 12, beamDepthFt: 1.5, columnSizeFt: 1.0 },
  materialPalette: { 
    wall: "#fdfdfd", // White wash
    floor: "#ebcf97", // Jaisalmer stone
    roof: "#1a1a1a", // Concrete slab
    door: "#4a3728", // Teak wood
    window: "#b4ccd8", // Clear glass
    accent: "#8b4513", // Red brick/stone accent
    trim: "#d4a373" // Jaali finish
  },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 11,
      core: ["stair core", "lift core"],
      rooms: [
        room("covered parking", "PARKING", 14, 18, "SW", { mustFaceRoad: true }),
        room("puja room", "SERVICE", 6, 6, "NE"),
        room("double height living", "LIVING", 16, 16, "NW"),
        room("modular kitchen", "KITCHEN", 10, 12, "E"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1, 2],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "center",
    basementUse: ["storage", "utilities"],
    courtyardPosition: "center",
    poolPosition: "rooftop",
  },
  userEditable: true,
};

// ── Independent Floor (Stilt+4) ──────────────────────────────────
const independentFloorBlueprint: ArchetypeBlueprint = {
  archetype: "apartment",
  family: "multifamily",
  label: "Independent Floor (Stilt+4)",
  defaultPlot: { widthFt: 25, depthFt: 50 },
  defaultStoreys: 4,
  maxStoreys: 5,
  defaultSetbacks: { front: 6, back: 5, left: 0, right: 0 },
  structuralGrid: { columnSpacingXFt: 10, columnSpacingZFt: 15, beamDepthFt: 1.5, columnSizeFt: 1.2 },
  materialPalette: { 
    wall: "#e5e5e5", 
    floor: "#ced4da", 
    roof: "#212529", 
    door: "#212529", 
    window: "#caf0f8", 
    accent: "#b45309", 
    trim: "#adb5bd" 
  },
  floors: [
    {
      level: "Stilt level",
      slabThicknessFt: 0.8,
      floorHeightFt: 9,
      core: ["lift core", "stair core"],
      rooms: [
        room("car parking 1", "PARKING", 10, 18, "NW"),
        room("car parking 2", "PARKING", 10, 18, "NE"),
        room("lift lobby", "CIRCULATION", 6, 8, "center"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "ribbon",
    balconyFloors: [1, 2, 3, 4],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "center",
    basementUse: ["water tanks", "storage"],
    courtyardPosition: "rear",
    poolPosition: "rooftop",
  },
  userEditable: true,
};

// ── Register all ─────────────────────────────────────────────────
export function registerUrbanBlueprints() {
  registerBlueprint(duplexBlueprint);
  registerBlueprint(apartmentBlueprint);
  registerBlueprint(townhouseBlueprint);
  registerBlueprint(indianDuplexBlueprint);
  registerBlueprint(independentFloorBlueprint);
}
