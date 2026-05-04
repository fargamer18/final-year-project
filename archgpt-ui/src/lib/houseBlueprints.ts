import type { HouseArchetype, HouseFamily, HouseModifier } from "./houseTaxonomy";

// ── Room categories ──────────────────────────────────────────────
export type RoomCategory =
  | "LIVING"
  | "DINING"
  | "KITCHEN"
  | "BEDROOM"
  | "WET AREA"
  | "PARKING"
  | "SERVICE"
  | "OPEN TO SKY"
  | "SIT OUT"
  | "ENTERTAINMENT"
  | "CIRCULATION"
  | "RETAIL"
  | "OFFICE"
  | "SPACE";

export type AnchorPosition =
  | "NW" | "N" | "NE"
  | "W"  | "center" | "E"
  | "SW" | "S" | "SE";

// ── Room blueprint ───────────────────────────────────────────────
export type RoomBlueprint = {
  name: string;
  category: RoomCategory;
  widthFt: number;
  depthFt: number;
  minWidthFt: number;
  minDepthFt: number;
  heightFt: number;
  anchor: AnchorPosition;
  adjacentTo?: string[];
  mustFaceRoad?: boolean;
  requiresPlumbing?: boolean;
  requiresVentilation?: boolean;
  materialPreset?: string;
};

// ── Floor blueprint ──────────────────────────────────────────────
export type FloorBlueprint = {
  level: string;
  slabThicknessFt: number;
  floorHeightFt: number;
  rooms: RoomBlueprint[];
  core: string[];
};

// ── Structural grid ──────────────────────────────────────────────
export type StructuralGrid = {
  columnSpacingXFt: number;
  columnSpacingZFt: number;
  beamDepthFt: number;
  columnSizeFt: number;
};

// ── Material palette ─────────────────────────────────────────────
export type MaterialPalette = {
  wall: string;
  floor: string;
  roof: string;
  door: string;
  window: string;
  accent: string;
  trim: string;
};

// ── MEP zones ────────────────────────────────────────────────────
export type MEPZoneType =
  | "wet-riser"
  | "dry-riser"
  | "electrical-shaft"
  | "hvac-duct"
  | "plumbing-stack";

export type MEPZone = {
  name: string;
  type: MEPZoneType;
  positionHint: AnchorPosition;
};

// ── Facade rules ─────────────────────────────────────────────────
export type RoofProfile =
  | "flat"
  | "pitched"
  | "a-frame"
  | "hip"
  | "butterfly"
  | "mansard"
  | "gabled";

export type FacadeRules = {
  mainEntrance: "front" | "side";
  windowPattern: "regular" | "asymmetric" | "ribbon" | "curtain-wall";
  balconyFloors: number[];
  roofProfile: RoofProfile;
};

// ── Modifier slots ───────────────────────────────────────────────
export type ModifierSlots = {
  liftPosition: AnchorPosition;
  basementUse: string[];
  courtyardPosition: "center" | "rear" | "side";
  poolPosition: "rear" | "side" | "rooftop";
};

// ── Main blueprint type ──────────────────────────────────────────
export type ArchetypeBlueprint = {
  archetype: HouseArchetype;
  family: HouseFamily;
  label: string;
  defaultPlot: { widthFt: number; depthFt: number };
  defaultStoreys: number;
  maxStoreys: number;
  defaultSetbacks: { front: number; back: number; left: number; right: number };
  structuralGrid: StructuralGrid;
  materialPalette: MaterialPalette;
  floors: FloorBlueprint[];
  mepZones: MEPZone[];
  facadeRules: FacadeRules;
  modifierSlots: ModifierSlots;
  userEditable: boolean;
};

// ── Helper: create a room shorthand ──────────────────────────────
export function room(
  name: string,
  category: RoomCategory,
  widthFt: number,
  depthFt: number,
  anchor: AnchorPosition = "NW",
  options: Partial<Omit<RoomBlueprint, "name" | "category" | "widthFt" | "depthFt" | "anchor">> = {},
): RoomBlueprint {
  return {
    name,
    category,
    widthFt,
    depthFt,
    minWidthFt: options.minWidthFt ?? Math.round(widthFt * 0.7),
    minDepthFt: options.minDepthFt ?? Math.round(depthFt * 0.7),
    heightFt: options.heightFt ?? 10,
    anchor,
    ...options,
  };
}

// ── Blueprint registry ───────────────────────────────────────────
const BLUEPRINT_REGISTRY = new Map<HouseArchetype, ArchetypeBlueprint>();

export function registerBlueprint(bp: ArchetypeBlueprint) {
  BLUEPRINT_REGISTRY.set(bp.archetype, bp);
}

export function getBlueprint(archetype: HouseArchetype): ArchetypeBlueprint | null {
  return BLUEPRINT_REGISTRY.get(archetype) ?? null;
}

export function getAllBlueprints(): ArchetypeBlueprint[] {
  return Array.from(BLUEPRINT_REGISTRY.values());
}

export function hasBlueprint(archetype: HouseArchetype): boolean {
  return BLUEPRINT_REGISTRY.has(archetype);
}

// ── Modifier application ─────────────────────────────────────────
export function applyModifiers(
  blueprint: ArchetypeBlueprint,
  modifiers: HouseModifier[],
): ArchetypeBlueprint {
  const result: ArchetypeBlueprint = structuredClone(blueprint);

  if (modifiers.includes("lift")) {
    result.floors.forEach((floor) => {
      if (!floor.core.includes("lift core")) {
        floor.core.push("lift core");
      }
    });
    result.mepZones.push({
      name: "Lift shaft",
      type: "dry-riser",
      positionHint: result.modifierSlots.liftPosition,
    });
  }

  if (modifiers.includes("basement")) {
    const basementRooms = result.modifierSlots.basementUse.map((use, i) =>
      room(use, "SERVICE", 14, 12, i === 0 ? "NW" : "NE"),
    );
    result.floors.unshift({
      level: "Basement",
      slabThicknessFt: 0.6,
      floorHeightFt: 8.5,
      rooms: basementRooms,
      core: [...result.floors[0]?.core ?? ["stair core"]],
    });
  }

  if (modifiers.includes("courtyard")) {
    const groundFloor = result.floors.find((f) => /ground/i.test(f.level));
    if (groundFloor) {
      groundFloor.rooms.push(
        room("courtyard", "OPEN TO SKY", 12, 12, "center"),
      );
    }
  }

  if (modifiers.includes("terrace")) {
    const topFloor = result.floors[result.floors.length - 1];
    if (topFloor && !topFloor.rooms.some((r) => /terrace/i.test(r.name))) {
      topFloor.rooms.push(room("open terrace", "OPEN TO SKY", 16, 12, "S"));
    }
  }

  if (modifiers.includes("pool")) {
    const groundFloor = result.floors.find((f) => /ground/i.test(f.level));
    if (groundFloor) {
      groundFloor.rooms.push(room("pool deck", "OPEN TO SKY", 14, 8, "S"));
      groundFloor.rooms.push(room("pool equipment", "SERVICE", 6, 4, "SE"));
    }
  }

  if (modifiers.includes("covered-parking")) {
    const groundFloor = result.floors.find((f) => /ground/i.test(f.level));
    if (groundFloor) {
      const parkingRoom = groundFloor.rooms.find((r) => /parking/i.test(r.name));
      if (parkingRoom) {
        parkingRoom.name = "covered parking";
      }
    }
  }

  if (modifiers.includes("home-office")) {
    const firstFloor = result.floors.find((f) => /first|1st/i.test(f.level)) ?? result.floors[0];
    if (firstFloor) {
      firstFloor.rooms.push(room("home office", "SERVICE", 10, 8, "NE"));
    }
  }

  if (modifiers.includes("verandah")) {
    const groundFloor = result.floors.find((f) => /ground/i.test(f.level));
    if (groundFloor && !groundFloor.rooms.some((r) => /verandah|porch/i.test(r.name))) {
      groundFloor.rooms.push(room("front verandah", "SIT OUT", 14, 6, "N", { mustFaceRoad: true }));
    }
  }

  if (modifiers.includes("double-height")) {
    const groundFloor = result.floors.find((f) => /ground/i.test(f.level));
    if (groundFloor) {
      const livingRoom = groundFloor.rooms.find((r) => /living/i.test(r.name));
      if (livingRoom) {
        livingRoom.heightFt = 20;
        livingRoom.name = "double-height " + livingRoom.name;
      }
    }
  }

  return result;
}

// ── Plot constraint fitting ──────────────────────────────────────
export function fitToPlot(
  blueprint: ArchetypeBlueprint,
  plotWidthFt: number,
  plotDepthFt: number,
): ArchetypeBlueprint {
  const result: ArchetypeBlueprint = structuredClone(blueprint);
  const setbacks = result.defaultSetbacks;
  const buildableWidth = plotWidthFt - setbacks.left - setbacks.right;
  const buildableDepth = plotDepthFt - setbacks.front - setbacks.back;
  const defaultWidth = result.defaultPlot.widthFt - setbacks.left - setbacks.right;
  const defaultDepth = result.defaultPlot.depthFt - setbacks.front - setbacks.back;

  if (buildableWidth <= 0 || buildableDepth <= 0) {
    return result;
  }

  const scaleX = Math.min(1, buildableWidth / defaultWidth);
  const scaleZ = Math.min(1, buildableDepth / defaultDepth);

  result.defaultPlot.widthFt = plotWidthFt;
  result.defaultPlot.depthFt = plotDepthFt;

  result.floors.forEach((floor) => {
    floor.rooms.forEach((r) => {
      const newWidth = Math.round(r.widthFt * scaleX);
      const newDepth = Math.round(r.depthFt * scaleZ);
      r.widthFt = Math.max(r.minWidthFt, newWidth);
      r.depthFt = Math.max(r.minDepthFt, newDepth);
    });
  });

  result.structuralGrid.columnSpacingXFt = Math.round(result.structuralGrid.columnSpacingXFt * scaleX);
  result.structuralGrid.columnSpacingZFt = Math.round(result.structuralGrid.columnSpacingZFt * scaleZ);

  return result;
}
