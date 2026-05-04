import { registerBlueprint, room, type ArchetypeBlueprint } from "../houseBlueprints";

// ── Villa ────────────────────────────────────────────────────────
const villaBlueprint: ArchetypeBlueprint = {
  archetype: "villa",
  family: "detached",
  label: "Villa",
  defaultPlot: { widthFt: 60, depthFt: 40 },
  defaultStoreys: 3,
  maxStoreys: 4,
  defaultSetbacks: { front: 5, back: 4, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 14, columnSpacingZFt: 14, beamDepthFt: 1.5, columnSizeFt: 1.0 },
  materialPalette: { wall: "#f7f2ea", floor: "#e8dccb", roof: "#5d5248", door: "#8a5a33", window: "#a8c7d8", accent: "#c7a77f", trim: "#d9c8b2" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 10.2,
      core: ["stair core"],
      rooms: [
        room("covered parking", "PARKING", 16, 20, "SW", { mustFaceRoad: true }),
        room("foyer", "CIRCULATION", 8, 8, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 18, 16, "NW", { mustFaceRoad: true }),
        room("formal dining", "DINING", 12, 14, "NE"),
        room("kitchen", "KITCHEN", 12, 10, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("utility", "SERVICE", 8, 8, "SE", { requiresPlumbing: true }),
        room("powder room", "WET AREA", 5, 6, "S", { requiresPlumbing: true }),
        room("front veranda", "SIT OUT", 14, 6, "N", { mustFaceRoad: true }),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 10.2,
      core: ["stair core"],
      rooms: [
        room("master bedroom", "BEDROOM", 16, 14, "NW", { adjacentTo: ["master bathroom", "walk-in closet"] }),
        room("master bathroom", "WET AREA", 8, 8, "N", { requiresPlumbing: true }),
        room("walk-in closet", "SERVICE", 6, 6, "NE"),
        room("bedroom 2", "BEDROOM", 12, 12, "E", { adjacentTo: ["shared bath"] }),
        room("bedroom 3", "BEDROOM", 12, 12, "SE", { adjacentTo: ["shared bath"] }),
        room("family lounge", "LIVING", 14, 12, "SW"),
        room("shared bath", "WET AREA", 8, 6, "S", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 12, 4, "N"),
      ],
    },
    {
      level: "Second floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 9.6,
      core: ["stair core"],
      rooms: [
        room("guest suite", "BEDROOM", 14, 12, "NW", { adjacentTo: ["guest bath"] }),
        room("guest bath", "WET AREA", 6, 6, "N", { requiresPlumbing: true }),
        room("study / library", "SERVICE", 10, 10, "NE"),
        room("open terrace", "OPEN TO SKY", 16, 12, "S"),
        room("store room", "SERVICE", 6, 8, "SE"),
        room("service wash", "WET AREA", 6, 6, "E", { requiresPlumbing: true }),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Electrical shaft", type: "electrical-shaft", positionHint: "SE" },
    { name: "Plumbing stack", type: "plumbing-stack", positionHint: "NE" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1, 2],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "NE",
    basementUse: ["overflow parking", "storage", "utility", "home theatre", "lift lobby"],
    courtyardPosition: "center",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Bungalow ─────────────────────────────────────────────────────
const bungalowBlueprint: ArchetypeBlueprint = {
  archetype: "bungalow",
  family: "detached",
  label: "Bungalow",
  defaultPlot: { widthFt: 38, depthFt: 28 },
  defaultStoreys: 1,
  maxStoreys: 1,
  defaultSetbacks: { front: 4, back: 3, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 12, columnSpacingZFt: 12, beamDepthFt: 1.2, columnSizeFt: 0.9 },
  materialPalette: { wall: "#f5f0e8", floor: "#dbd0c0", roof: "#6b5b4f", door: "#7c5a30", window: "#b8d4e3", accent: "#a08060", trim: "#c0b098" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.4,
      core: ["stair core"],
      rooms: [
        room("front porch", "SIT OUT", 12, 6, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 16, 14, "NW", { mustFaceRoad: true }),
        room("dining", "DINING", 12, 12, "NE"),
        room("kitchen", "KITCHEN", 10, 10, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("master bedroom", "BEDROOM", 14, 12, "SW", { adjacentTo: ["master bath"] }),
        room("master bath", "WET AREA", 7, 6, "S", { requiresPlumbing: true }),
        room("bedroom 2", "BEDROOM", 12, 10, "SE", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 6, 6, "E", { requiresPlumbing: true }),
        room("parking", "PARKING", 12, 16, "W"),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "SE" },
    { name: "Electrical panel", type: "electrical-shaft", positionHint: "SW" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [],
    roofProfile: "pitched",
  },
  modifierSlots: {
    liftPosition: "center",
    basementUse: ["storage", "utility", "pump room"],
    courtyardPosition: "rear",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Contemporary ─────────────────────────────────────────────────
const contemporaryBlueprint: ArchetypeBlueprint = {
  archetype: "contemporary",
  family: "detached",
  label: "Contemporary",
  defaultPlot: { widthFt: 34, depthFt: 24 },
  defaultStoreys: 2,
  maxStoreys: 3,
  defaultSetbacks: { front: 4, back: 3, left: 3, right: 3 },
  structuralGrid: { columnSpacingXFt: 12, columnSpacingZFt: 12, beamDepthFt: 1.2, columnSizeFt: 0.9 },
  materialPalette: { wall: "#e8e8e8", floor: "#d4d0cc", roof: "#3a3a3a", door: "#555555", window: "#c8dce8", accent: "#7b68ee", trim: "#b0b0b0" },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.6,
      core: ["stair core"],
      rooms: [
        room("parking", "PARKING", 12, 16, "SW"),
        room("foyer", "CIRCULATION", 6, 6, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 14, 14, "NW", { mustFaceRoad: true }),
        room("dining", "DINING", 10, 12, "NE"),
        room("kitchen", "KITCHEN", 10, 10, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("powder room", "WET AREA", 4, 6, "S", { requiresPlumbing: true }),
        room("utility", "SERVICE", 6, 6, "SE", { requiresPlumbing: true }),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 9.6,
      core: ["stair core"],
      rooms: [
        room("master bedroom", "BEDROOM", 14, 12, "NW", { adjacentTo: ["master bath"] }),
        room("master bath", "WET AREA", 7, 6, "N", { requiresPlumbing: true }),
        room("bedroom 2", "BEDROOM", 12, 10, "NE", { adjacentTo: ["shared bath"] }),
        room("bedroom 3", "BEDROOM", 10, 10, "SE", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 6, 6, "S", { requiresPlumbing: true }),
        room("balcony", "OPEN TO SKY", 10, 4, "N"),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Electrical shaft", type: "electrical-shaft", positionHint: "SE" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "asymmetric",
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

// ── Mediterranean Villa ──────────────────────────────────────────
const mediterraneanVillaBlueprint: ArchetypeBlueprint = {
  archetype: "villa",
  family: "detached",
  label: "Mediterranean Villa",
  defaultPlot: { widthFt: 80, depthFt: 60 },
  defaultStoreys: 2,
  maxStoreys: 3,
  defaultSetbacks: { front: 12, back: 8, left: 6, right: 6 },
  structuralGrid: { columnSpacingXFt: 16, columnSpacingZFt: 16, beamDepthFt: 1.5, columnSizeFt: 1.2 },
  materialPalette: { 
    wall: "#f2e8cf", // Warm stucco
    floor: "#bc6c25", // Terracotta tiles
    roof: "#8b4513", // Red clay tiles
    door: "#606c38", // Olive wood
    window: "#a8dadc", // Light blue glass
    accent: "#dda15e", // Stone trim
    trim: "#bc6c25" 
  },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.8,
      floorHeightFt: 11,
      core: ["stair core"],
      rooms: [
        room("central courtyard", "OPEN TO SKY", 20, 20, "center"),
        room("loggia", "SIT OUT", 20, 8, "S"),
        room("grand living", "LIVING", 22, 18, "NW"),
        room("dining hall", "DINING", 16, 14, "NE"),
        room("kitchen", "KITCHEN", 14, 12, "E"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1],
    roofProfile: "pitched",
  },
  modifierSlots: {
    liftPosition: "center",
    basementUse: ["wine cellar", "storage"],
    courtyardPosition: "center",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Modernist Villa (CGTrader Inspired) ──────────────────────────
const modernistVillaBlueprint: ArchetypeBlueprint = {
  archetype: "villa",
  family: "detached",
  label: "Modernist Villa",
  defaultPlot: { widthFt: 100, depthFt: 80 },
  defaultStoreys: 2,
  maxStoreys: 2,
  defaultSetbacks: { front: 20, back: 10, left: 10, right: 10 },
  structuralGrid: { columnSpacingXFt: 20, columnSpacingZFt: 20, beamDepthFt: 1.2, columnSizeFt: 0.8 },
  materialPalette: { 
    wall: "#ffffff", // Stark white render
    floor: "#ced4da", // Polished concrete
    roof: "#343a40", // Dark metal slab
    door: "#212529", // Black steel
    window: "#caf0f8", // Clear glass curtain wall
    accent: "#6c757d", // Exposed concrete
    trim: "#adb5bd" 
  },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 1.0,
      floorHeightFt: 12,
      core: ["lift core", "stair core"],
      rooms: [
        room("open living", "LIVING", 30, 25, "NW"),
        room("gallery", "CIRCULATION", 10, 25, "center"),
        room("indoor pool", "OPEN TO SKY", 20, 15, "SE"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "curtain-wall",
    balconyFloors: [1],
    roofProfile: "flat",
  },
  modifierSlots: {
    liftPosition: "W",
    basementUse: ["gym", "home cinema", "parking"],
    courtyardPosition: "side",
    poolPosition: "side",
  },
  userEditable: true,
};

// ── Palladian Villa ──────────────────────────────────────────────
const palladianVillaBlueprint: ArchetypeBlueprint = {
  archetype: "villa",
  family: "detached",
  label: "Palladian Villa",
  defaultPlot: { widthFt: 120, depthFt: 100 },
  defaultStoreys: 3,
  maxStoreys: 3,
  defaultSetbacks: { front: 30, back: 20, left: 15, right: 15 },
  structuralGrid: { columnSpacingXFt: 14, columnSpacingZFt: 14, beamDepthFt: 2.0, columnSizeFt: 1.5 },
  materialPalette: { 
    wall: "#f8f9fa", // Limestone
    floor: "#e9ecef", // Marble
    roof: "#495057", // Lead/Slate grey
    door: "#3e2723", // Dark oak
    window: "#dee2e6", // Small paned glass
    accent: "#ced4da", // Sculptural stone
    trim: "#f8f9fa" 
  },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 1.2,
      floorHeightFt: 14,
      core: ["stair core"],
      rooms: [
        room("vestibule", "CIRCULATION", 12, 12, "center"),
        room("salon", "LIVING", 24, 24, "center"),
        room("east wing library", "OFFICE", 18, 14, "E"),
        room("west wing study", "OFFICE", 18, 14, "W"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [],
    roofProfile: "hip",
  },
  modifierSlots: {
    liftPosition: "NW",
    basementUse: ["servants quarters", "storage"],
    courtyardPosition: "rear",
    poolPosition: "rear",
  },
  userEditable: true,
};

// ── Tropical Villa ───────────────────────────────────────────────
const tropicalVillaBlueprint: ArchetypeBlueprint = {
  archetype: "villa",
  family: "detached",
  label: "Tropical Villa",
  defaultPlot: { widthFt: 90, depthFt: 90 },
  defaultStoreys: 1,
  maxStoreys: 2,
  defaultSetbacks: { front: 15, back: 15, left: 10, right: 10 },
  structuralGrid: { columnSpacingXFt: 18, columnSpacingZFt: 18, beamDepthFt: 1.0, columnSizeFt: 0.6 },
  materialPalette: { 
    wall: "#fffcf2", // Bamboo/Light plaster
    floor: "#ccc5b9", // Polished stone
    roof: "#403d39", // Thatched/Dark shingle
    door: "#252422", // Dark teak
    window: "#ebf2fa", // Tinted glass
    accent: "#eb5e28", // Terracotta accent
    trim: "#ccc5b9" 
  },
  floors: [
    {
      level: "Ground floor",
      slabThicknessFt: 0.5,
      floorHeightFt: 10,
      core: ["stair core"],
      rooms: [
        room("pavilion living", "LIVING", 20, 20, "NW"),
        room("outdoor shower", "WET AREA", 8, 8, "SE"),
        room("reflecting pool", "OPEN TO SKY", 30, 10, "center"),
      ],
    },
  ],
  mepZones: [],
  facadeRules: {
    mainEntrance: "side",
    windowPattern: "regular",
    balconyFloors: [1],
    roofProfile: "pitched",
  },
  modifierSlots: {
    liftPosition: "NE",
    basementUse: ["water tank", "storage"],
    courtyardPosition: "center",
    poolPosition: "center",
  },
  userEditable: true,
};

// ── Register all ─────────────────────────────────────────────────
export function registerDetachedBlueprints() {
  registerBlueprint(villaBlueprint);
  registerBlueprint(bungalowBlueprint);
  registerBlueprint(contemporaryBlueprint);
  registerBlueprint(mediterraneanVillaBlueprint);
  registerBlueprint(modernistVillaBlueprint);
  registerBlueprint(palladianVillaBlueprint);
  registerBlueprint(tropicalVillaBlueprint);
}
