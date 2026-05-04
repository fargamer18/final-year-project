import { registerBlueprint, room, type ArchetypeBlueprint } from "../houseBlueprints";

// ── Farmhouse ────────────────────────────────────────────────────
// 5 BHK with garage, basement study, lift, wide verandah, pitched roof
const farmhouseBlueprint: ArchetypeBlueprint = {
  archetype: "farmhouse",
  family: "detached",
  label: "Farmhouse",
  defaultPlot: { widthFt: 60, depthFt: 45 },
  defaultStoreys: 2,
  maxStoreys: 2,
  defaultSetbacks: { front: 6, back: 5, left: 4, right: 4 },
  structuralGrid: { columnSpacingXFt: 14, columnSpacingZFt: 14, beamDepthFt: 1.5, columnSizeFt: 1.0 },
  materialPalette: { wall: "#f5ede0", floor: "#d4c4a8", roof: "#5d4037", door: "#6d4c30", window: "#c8dce8", accent: "#8d6e4c", trim: "#bca88a" },
  floors: [
    {
      level: "Basement",
      slabThicknessFt: 0.6,
      floorHeightFt: 8.5,
      core: ["stair core", "lift core"],
      rooms: [
        room("study / library", "SERVICE", 14, 12, "NW"),
        room("storage", "SERVICE", 10, 10, "NE"),
        room("utility room", "SERVICE", 10, 8, "E", { requiresPlumbing: true }),
        room("home theatre", "ENTERTAINMENT", 16, 14, "SW"),
        room("service wash", "WET AREA", 6, 6, "SE", { requiresPlumbing: true }),
      ],
    },
    {
      level: "Ground floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 10.6,
      core: ["stair core", "lift core"],
      rooms: [
        room("front verandah", "SIT OUT", 40, 8, "N", { mustFaceRoad: true }),
        room("foyer", "CIRCULATION", 8, 8, "N", { mustFaceRoad: true }),
        room("living room", "LIVING", 20, 16, "NW", { mustFaceRoad: true, heightFt: 12 }),
        room("formal dining", "DINING", 14, 14, "NE"),
        room("kitchen", "KITCHEN", 14, 12, "E", { requiresPlumbing: true, requiresVentilation: true }),
        room("pantry", "SERVICE", 6, 6, "E"),
        room("master bedroom", "BEDROOM", 16, 14, "SW", { adjacentTo: ["master bathroom", "walk-in closet"] }),
        room("master bathroom", "WET AREA", 8, 8, "S", { requiresPlumbing: true }),
        room("walk-in closet", "SERVICE", 6, 6, "S"),
        room("garage", "PARKING", 18, 20, "W"),
        room("powder room", "WET AREA", 5, 5, "S", { requiresPlumbing: true }),
        room("mud room", "SERVICE", 6, 6, "W"),
        room("rear sit-out", "SIT OUT", 16, 8, "S"),
      ],
    },
    {
      level: "First floor",
      slabThicknessFt: 0.6,
      floorHeightFt: 10,
      core: ["stair core", "lift core"],
      rooms: [
        room("bedroom 2", "BEDROOM", 14, 12, "NW", { adjacentTo: ["bathroom 2"] }),
        room("bathroom 2", "WET AREA", 7, 6, "N", { requiresPlumbing: true }),
        room("bedroom 3", "BEDROOM", 14, 12, "NE", { adjacentTo: ["bathroom 3"] }),
        room("bathroom 3", "WET AREA", 7, 6, "N", { requiresPlumbing: true }),
        room("bedroom 4", "BEDROOM", 12, 12, "SE", { adjacentTo: ["shared bath"] }),
        room("bedroom 5", "BEDROOM", 12, 12, "SW", { adjacentTo: ["shared bath"] }),
        room("shared bath", "WET AREA", 8, 6, "S", { requiresPlumbing: true }),
        room("family lounge", "LIVING", 14, 12, "center"),
        room("linen store", "SERVICE", 6, 4, "E"),
        room("balcony", "OPEN TO SKY", 14, 5, "N"),
      ],
    },
  ],
  mepZones: [
    { name: "Wet riser", type: "wet-riser", positionHint: "NE" },
    { name: "Electrical shaft", type: "electrical-shaft", positionHint: "SE" },
    { name: "Plumbing stack", type: "plumbing-stack", positionHint: "NE" },
    { name: "HVAC duct", type: "hvac-duct", positionHint: "center" },
  ],
  facadeRules: {
    mainEntrance: "front",
    windowPattern: "regular",
    balconyFloors: [1],
    roofProfile: "pitched",
  },
  modifierSlots: {
    liftPosition: "NE",
    basementUse: ["study", "storage", "utility", "home theatre"],
    courtyardPosition: "rear",
    poolPosition: "rear",
  },
  userEditable: true,
};

export function registerFarmhouseBlueprint() {
  registerBlueprint(farmhouseBlueprint);
}
