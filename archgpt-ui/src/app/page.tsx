"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Plus, Sparkles, X } from "lucide-react";
import { HouseModelViewport } from "../components/HouseModelViewport";
import { ProfessionalsDrawer } from "../components/ProfessionalsDrawer";
import { buildHouseDsl } from "../lib/houseDsl";
import { buildHouseQuestionFlow, classifyHouseConcept, formatHouseConcept, type HouseDecision } from "../lib/houseTaxonomy";
import { getBlueprint, hasBlueprint, applyModifiers, fitToPlot, type ArchetypeBlueprint } from "../lib/houseBlueprints";
import { initBlueprints } from "../lib/blueprints";
import { CadWorkspace } from "../components/CadWorkspace";
import { DecisionTreeWizard } from "../components/DecisionTreeWizard";
import { type ArchitecturalIR } from "../lib/spatialSolver";

type Message = { role: "user" | "bot"; content: string };
type HouseSpec = {
  status?: string;
  request?: string;
  source?: "backend" | "local";
  program?: StructureProgram;
  structureType?: string;
  houseConcept?: HouseDecision;
  site?: {
    plotWidthFt?: number;
    plotDepthFt?: number;
    roadFacing?: string;
    mainEntranceFacing?: string;
  };
  building?: {
    totalStoreys?: number;
    style?: string;
  };
  facade?: {
    mainEntranceFacing?: string;
  };
  floors?: FloorPlan[];
  notes?: string[];
  questions?: string[];
};
type FloorPlan = {
  level: string;
  spaces: string[];
  core?: string[];
};
type StructureProgram =
  | "house"
  | "villa"
  | "apartment"
  | "office"
  | "clinic"
  | "school"
  | "retail"
  | "restaurant"
  | "warehouse"
  | "mixed-use"
  | "studio"
  | "temple";
type CadTool = string;
type CadSelection = { floorIndex: number; roomIndex: number } | null;
type CadAnnotation = {
  id: string;
  floorIndex: number;
  roomIndex: number;
  tool: string;
  label: string;
};
type CadToolGroup = {
  title: string;
  description: string;
  tools: string[];
};
type LocalPlotDimensions = {
  plotWidthFt: number;
  plotDepthFt: number;
} | null;
type StructureFeatures = {
  hasLift: boolean;
  hasBasement: boolean;
  hasCourtyard: boolean;
  hasDoubleHeight: boolean;
  hasCoveredParking: boolean;
  hasTerrace: boolean;
  hasArcadeRoom: boolean;
  hasVerandah: boolean;
  hasPool: boolean;
  hasHomeOffice: boolean;
};
type LawReview = {
  status?: string;
  riskLevel?: string;
  safeToProceed?: boolean;
  summary?: string;
  issues?: string[];
  recommendations?: string[];
};
type ProfessionalGuidance = {
  requested: string[];
  recommended: string[];
  note: string;
};
type PlannerResult = {
  spec: HouseSpec;
  lawReview: LawReview | null;
  lawReviewError: string;
  dsl: string;
  semanticIR?: ArchitecturalIR;
};
type ChatHistoryItem = {
  id: number;
  title: string;
  messages: Message[];
  plannerResult: PlannerResult | null;
};
type PromptIntent = "create" | "modify" | "general";
type HouseSpecResponse = {
  spec?: HouseSpec;
  lawReview?: LawReview | null;
  lawReviewError?: string;
  dsl?: string;
  error?: string;
  message?: string;
};
type LawChatResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  message?: string;
};
type ProfessionalsDrawerContext = {
  requestSummary: string;
  guidanceNote: string;
};

const CREATE_PROMPT_PATTERN = /\b(?:make me|generate|create|build|design)\b/i;
const MODIFY_PROMPT_PATTERN = /\b(?:change|modify|update|add|remove|replace|edit|revise|refine|adjust|expand|extend|increase|decrease|alter|renovate)\b/i;
const GENERATOR_PROMPT_PATTERN = /\b(?:house|home|villa|apartment|bungalow|duplex|residence|floor plan|plan layout|dwg|site plan|layout|concept|draft|sketch|elevation|interior|exterior|3d model|model)\b/i;
const LAW_PROMPT_PATTERN = /\b(?:law|legal|zoning|setback|setbacks|bye[-\s]?law|byelaw|fsi|far|floor area ratio|coverage|building code|regulation|regulations|compliance|permit|approval|sanction|occupancy|planning permission|tree permit|tree removal|tree cutting|tree felling|bbmp|bda|municipal|municipality|town planning|planning authority|loophole|bypass|evade|circumvent|workaround|exempt)\b/i;
const TREE_ACTION_PROMPT_PATTERN = /\b(?:tree|trees)\b/i;
const TREE_ACTION_VERB_PATTERN = /\b(?:cut|remove|fell|clear|prune|trim)\b/i;

// Hard-patched for the current network environment to resolve persistent CORS failures
const ARCHGPT_API_BASE = "http://192.168.1.10:3001";

async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number }) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function resizeTextarea(element: HTMLTextAreaElement | null, minHeight: number, maxHeight: number) {
  if (!element) {
    return;
  }

  element.style.height = "auto";
  const nextHeight = Math.max(element.scrollHeight, minHeight);
  const clampedHeight = Math.min(nextHeight, maxHeight);
  element.style.height = `${clampedHeight}px`;
  element.style.overflowY = nextHeight > maxHeight ? "auto" : "hidden";
}

const CAD_TOOL_GROUPS: CadToolGroup[] = [
  {
    title: "Draw",
    description: "Create geometry and drafting primitives.",
    tools: [
      "line",
      "pline",
      "circle",
      "arc",
      "rectangle",
      "polygon",
      "ellipse",
      "spline",
      "donut",
      "point",
      "xline",
      "ray",
      "multiline",
      "hatch",
      "gradient",
      "boundary",
      "region",
      "revcloud",
      "wipeout",
      "table",
      "text",
      "mtext",
      "dimension",
      "leader",
      "mleader",
    ],
  },
  {
    title: "Modify",
    description: "Edit geometry and room layouts.",
    tools: [
      "move",
      "copy",
      "rotate",
      "scale",
      "mirror",
      "offset",
      "array",
      "trim",
      "extend",
      "fillet",
      "chamfer",
      "break",
      "breakatpoint",
      "join",
      "explode",
      "stretch",
      "lengthen",
      "align",
      "erase",
      "pedit",
      "split",
      "reverse",
      "overkill",
    ],
  },
  {
    title: "Annotation",
    description: "Text, dimensions, leaders, and notes.",
    tools: [
      "dimlinear",
      "dimaligned",
      "dimangular",
      "dimradius",
      "dimdiameter",
      "dimbaseline",
      "dimcontinue",
      "dimcenter",
      "tolerance",
      "field",
      "multileaderstyle",
    ],
  },
  {
    title: "Layers",
    description: "Layer management and object properties.",
    tools: [
      "layer",
      "layon",
      "layoff",
      "layiso",
      "layuniso",
      "layfrz",
      "laythw",
      "laylock",
      "layunlock",
      "matchprop",
      "properties",
      "quickproperties",
      "chprop",
      "list",
    ],
  },
  {
    title: "Blocks",
    description: "Reusable content and attributes.",
    tools: [
      "block",
      "wblock",
      "insert",
      "bedit",
      "refedit",
      "attdef",
      "attedit",
      "battman",
      "explodeblock",
      "blockreplace",
    ],
  },
  {
    title: "View",
    description: "Navigation and display controls.",
    tools: [
      "zoom",
      "pan",
      "orbit",
      "3dorbit",
      "steeringwheel",
      "navvcube",
      "viewcube",
      "ucs",
      "plan",
      "3d",
    ],
  },
  {
    title: "3D Create",
    description: "Primitive solid creation commands.",
    tools: [
      "box",
      "cylinder",
      "sphere",
      "cone",
      "torus",
      "wedge",
      "pyramid",
      "plane",
      "helix",
    ],
  },
  {
    title: "3D Modify",
    description: "Solid and face editing tools.",
    tools: [
      "extrude",
      "presspull",
      "revolve",
      "sweep",
      "loft",
      "union",
      "subtract",
      "intersect",
      "slice",
      "shell",
      "filletedge",
      "chamferedge",
      "offsetedge",
      "moveface",
      "rotateface",
      "scaleface",
    ],
  },
  {
    title: "Surface",
    description: "Surface modeling commands.",
    tools: [
      "planesurf",
      "extrudesurf",
      "revolvesurf",
      "sweepsurf",
      "loftsurf",
      "offsetsurface",
      "patch",
      "blendsurf",
      "filletsurf",
    ],
  },
  {
    title: "Solid Editing",
    description: "Inspection and solid utilities.",
    tools: [
      "solidedit",
      "section",
      "interfere",
      "massprop",
      "thicken",
      "imprint",
      "check",
    ],
  },
  {
    title: "Parametric",
    description: "Constraints and parametric relationships.",
    tools: [
      "dconstraint",
      "geomconstraint",
      "dimconstraint",
      "parametricmanager",
      "inferconstraint",
      "fix",
      "parallel",
      "perpendicular",
      "tangent",
      "symmetric",
    ],
  },
  {
    title: "Utilities",
    description: "Measurement, cleanup, and repair.",
    tools: ["dist", "area", "id", "measure", "divide", "cal", "units", "purge", "audit", "recover"],
  },
  {
    title: "Output",
    description: "Plotting and export commands.",
    tools: ["plot", "pagesetup", "export", "pdfexport", "publish", "etransmit"],
  },
];

function classifyPromptIntent(prompt: string): PromptIntent {
  const normalizedPrompt = prompt.trim();
  if (MODIFY_PROMPT_PATTERN.test(normalizedPrompt)) {
    return "modify";
  }
  if (CREATE_PROMPT_PATTERN.test(normalizedPrompt)) {
    return "create";
  }
  return "general";
}

function shouldOpenGenerator(prompt: string, intent: PromptIntent) {
  if (intent === "create") {
    return true;
  }

  if (intent !== "general") {
    return false;
  }

  return GENERATOR_PROMPT_PATTERN.test(prompt) && !isLawPrompt(prompt);
}

function isLawPrompt(prompt: string) {
  const normalizedPrompt = prompt.trim();
  if (LAW_PROMPT_PATTERN.test(normalizedPrompt)) {
    return true;
  }

  const mentionsTreeAction = TREE_ACTION_PROMPT_PATTERN.test(normalizedPrompt) && TREE_ACTION_VERB_PATTERN.test(normalizedPrompt);
  const mentionsSiteContext = /\b(?:plot|site|land|house|building|construction)\b/i.test(normalizedPrompt);

  return mentionsTreeAction && mentionsSiteContext;
}

function hasPositivePlotDimensions(spec: HouseSpec | null) {
  return Boolean(
    spec &&
      typeof spec.site?.plotWidthFt === "number" &&
      spec.site.plotWidthFt > 0 &&
      typeof spec.site?.plotDepthFt === "number" &&
      spec.site.plotDepthFt > 0,
  );
}

function inferLocalPlotDimensions(prompt: string, previousSpec: HouseSpec | null): LocalPlotDimensions {
  const dimensionMatch = prompt.match(/\b(\d{2,3})\s*(?:x|×)\s*(\d{2,3})\b/i);
  if (dimensionMatch) {
    return {
      plotWidthFt: Number(dimensionMatch[1]),
      plotDepthFt: Number(dimensionMatch[2]),
    };
  }

  const previousPlot = previousSpec && previousSpec.source !== "local" && hasPositivePlotDimensions(previousSpec)
    ? previousSpec.site
    : null;

  if (previousPlot) {
    return {
      plotWidthFt: previousPlot.plotWidthFt!,
      plotDepthFt: previousPlot.plotDepthFt!,
    };
  }

  return null;
}

function requestHasFeature(prompt: string, featurePattern: RegExp, negatedPatterns: RegExp[] = []) {
  const normalizedPrompt = String(prompt || "");
  if (negatedPatterns.some((pattern) => pattern.test(normalizedPrompt))) {
    return false;
  }

  return featurePattern.test(normalizedPrompt);
}

function inferLocalStoreys(prompt: string, previousSpec: HouseSpec | null, preferredStoreys = 2) {
  const gPlusMatch = prompt.match(/\bg\s*\+?\s*(\d+)\b/i);
  if (gPlusMatch) {
    return Math.max(1, Number(gPlusMatch[1]) + 1);
  }

  const storeyMatch = prompt.match(/\b(\d+)\s*(?:storey|story|floor|floors)\b/i);
  if (storeyMatch) {
    return Math.max(1, Number(storeyMatch[1]));
  }

  if (/\bduplex\b/i.test(prompt)) {
    return 2;
  }

  if (/\bbungalow\b/i.test(prompt)) {
    return 1;
  }

  if (/\bstudio\b|\b1\s*rk\b/i.test(prompt)) {
    return 1;
  }

  if (/\bfarmhouse\b|\ba[-\s]?frame\b/i.test(prompt)) {
    return 1;
  }

  if (/\btownhouse\b|\brow[-\s]?house\b/i.test(prompt)) {
    return Math.max(2, preferredStoreys || 2);
  }

  if (/\bvilla\b/i.test(prompt)) {
    return Math.max(3, preferredStoreys || 3);
  }

  if (/\bapartment\b/i.test(prompt)) {
    return Math.max(3, preferredStoreys || 4);
  }

  if (/\bmixed[-\s]?use\b/i.test(prompt)) {
    return Math.max(3, preferredStoreys || 3);
  }

  return previousSpec?.building?.totalStoreys || preferredStoreys || 2;
}

function inferLocalStyle(prompt: string, previousSpec: HouseSpec | null, preferredStyle = "") {
  const styleRules: Array<[RegExp, string]> = [
    [/\bcontemporary\b/i, "contemporary"],
    [/\bmodern\b/i, "modern"],
    [/\bminimal\b/i, "minimal"],
    [/\bluxury\b/i, "luxury"],
    [/\btraditional\b/i, "traditional"],
    [/\bheritage\b/i, "heritage"],
    [/\bindian\b/i, "indian"],
    [/\ba[-\s]?frame\b/i, "a-frame"],
    [/\bfarmhouse\b/i, "farmhouse"],
    [/\bbungalow\b/i, "bungalow"],
    [/\btownhouse\b/i, "townhouse"],
    [/\brow[-\s]?house\b/i, "row-house"],
    [/\bduplex\b/i, "duplex"],
    [/\bstudio\b/i, "studio"],
    [/\b1\s*rk\b/i, "studio"],
    [/\bvilla\b/i, "villa"],
  ];

  for (const [pattern, style] of styleRules) {
    if (pattern.test(prompt)) {
      return style;
    }
  }

  if (preferredStyle) {
    return preferredStyle;
  }

  return previousSpec?.building?.style || "contemporary";
}

function inferLocalFacing(prompt: string, previousSpec: HouseSpec | null) {
  const facingRules = ["north", "south", "east", "west"];
  for (const facing of facingRules) {
    if (new RegExp(`\\b${facing}\\b`, "i").test(prompt)) {
      return facing;
    }
  }

  return previousSpec?.site?.roadFacing || "north";
}

function inferLocalParkingCars(prompt: string) {
  const parkingMatch = prompt.match(/parking\s*(?:for)?\s*(\d+)\s*cars?/i);
  if (parkingMatch) {
    return Math.max(1, Number(parkingMatch[1]));
  }

  if (/\btwo\s*cars?\b/i.test(prompt) || /\b2\s*cars?\b/i.test(prompt)) {
    return 2;
  }

  if (/\bone\s*car\b/i.test(prompt) || /\b1\s*car\b/i.test(prompt)) {
    return 1;
  }

  return 1;
}

function inferLocalBedroomCount(prompt: string) {
  const bhkMatch = prompt.match(/\b(\d+)\s*bhk\b/i);
  if (bhkMatch) {
    return Math.max(1, Number(bhkMatch[1]));
  }

  const bedroomMatch = prompt.match(/\b(\d+)\s*bedroom\b/i);
  if (bedroomMatch) {
    return Math.max(1, Number(bedroomMatch[1]));
  }

  return 3;
}

function inferLocalFeatures(prompt: string): StructureFeatures {
  return {
    hasLift: requestHasFeature(prompt, /\blift\b|\belevator\b/i, [/\bno\s+lift\b/i, /\bwithout\s+lift\b/i, /\blift[-\s]?free\b/i]),
    hasBasement: requestHasFeature(prompt, /\bbasement\b/i, [/\bno\s+basement\b/i, /\bwithout\s+basement\b/i, /\bbasement[-\s]?free\b/i, /\bexclude\s+basement\b/i]),
    hasCourtyard: requestHasFeature(prompt, /\bcourtyard\b/i, [/\bno\s+courtyard\b/i, /\bwithout\s+courtyard\b/i]),
    hasDoubleHeight: requestHasFeature(prompt, /\bdouble[-\s]?height\b/i, [/\bno\s+double[-\s]?height\b/i, /\bwithout\s+double[-\s]?height\b/i]),
    hasCoveredParking: requestHasFeature(prompt, /\bcovered\s+parking\b|\bstilt\s+parking\b/i, [/\bopen\s+parking\b/i, /\bno\s+parking\b/i]),
    hasTerrace: requestHasFeature(prompt, /\bterrace\b|\broof\s*deck\b|\brooftop\b/i, [/\bno\s+terrace\b/i, /\bwithout\s+terrace\b/i]),
    hasVerandah: requestHasFeature(prompt, /\bverandah\b|\bveranda\b|\bporch\b/i, [/\bno\s+verandah\b/i, /\bwithout\s+verandah\b/i]),
    hasPool: requestHasFeature(prompt, /\bpool\b/i, [/\bno\s+pool\b/i, /\bwithout\s+pool\b/i]),
    hasHomeOffice: requestHasFeature(prompt, /\bhome\s+office\b|\bworkspace\b|\bstudy\b/i, [/\bno\s+office\b/i, /\bwithout\s+office\b/i]),
    hasArcadeRoom: requestHasFeature(prompt, /\barcade\b|\bgame\s+room\b|\bgame\s+zone\b|\brecreation\s+room\b|\bentertainment\s+room\b|\bmedia\s+room\b/i, [/\bno\s+arcade\b/i, /\bwithout\s+arcade\b/i]),
  };
}

function inferStructureProgram(prompt: string, style: string, previousProgram: StructureProgram | null = null, preferredProgram: StructureProgram | null = null): StructureProgram {
  const normalizedPrompt = String(prompt || "");
  const matchedProgram: Array<[RegExp, StructureProgram]> = [
    [/\bmixed[-\s]?use\b/i, "mixed-use"],
    [/\bapartment\b|\bflat\b|\bcondo\b|\bcondominium\b/i, "apartment"],
    [/\boffice\b|\bworkspace\b|\bcommercial\b|\bhead\s*office\b/i, "office"],
    [/\bclinic\b|\bhospital\b|\bmedical\b|\bdental\b|\bhealth\b/i, "clinic"],
    [/\bschool\b|\bcollege\b|\binstitute\b|\bclassroom\b|\blab\b/i, "school"],
    [/\bwarehouse\b|\bgodown\b|\bstorage\b|\bindustrial\b|\bfactory\b/i, "warehouse"],
    [/\bretail\b|\bshop\b|\bshowroom\b|\bstore\b|\bmercantile\b/i, "retail"],
    [/\brestaurant\b|\bcafe\b|\bdiner\b|\bbanquet\b|\bkitchen\b/i, "restaurant"],
    [/\btemple\b|\bmandir\b|\bshrine\b/i, "temple"],
    [/\bstudio\b|\bworkshop\b|\bart\s*studio\b/i, "studio"],
    [/\bvilla\b/i, "villa"],
    [/\bbungalow\b/i, "house"],
    [/\bhouse\b|\bhome\b|\bresidence\b/i, "house"],
  ];

  for (const [pattern, program] of matchedProgram) {
    if (pattern.test(normalizedPrompt)) {
      return program;
    }
  }

  const normalizedStyle = String(style || "").toLowerCase();
  if (normalizedStyle === "villa" || normalizedStyle === "luxury") {
    return "villa";
  }

  return preferredProgram || previousProgram || "house";
}

function getStructureProgramLabel(program: StructureProgram) {
  switch (program) {
    case "mixed-use":
      return "Mixed use";
    case "retail":
      return "Retail";
    case "warehouse":
      return "Warehouse";
    case "restaurant":
      return "Restaurant";
    case "apartment":
      return "Apartment";
    case "office":
      return "Office";
    case "clinic":
      return "Clinic";
    case "school":
      return "School";
    case "temple":
      return "Temple";
    case "studio":
      return "Studio";
    case "villa":
      return "Villa";
    default:
      return "House";
  }
}

function formatFloorLevel(levelIndex: number) {
  if (levelIndex === 0) {
    return "Ground floor";
  }

  if (levelIndex === 1) {
    return "First floor";
  }

  if (levelIndex === 2) {
    return "Second floor";
  }

  return `${levelIndex + 1}th floor`;
}

function cloneFloors(floors: FloorPlan[]) {
  return floors.map((floor) => ({
    ...floor,
    spaces: [...floor.spaces],
    core: floor.core ? [...floor.core] : undefined,
  }));
}

function getFirstUnusedRoom(program: StructureProgram, floorLevel: string, existingSpaces: string[], bedroomCount: number) {
  const candidateRooms: Record<StructureProgram, string[]> = {
    house: ["guest room", "study / home office", "courtyard", "utility court", "puja room", "family lounge"],
    villa: ["courtyard", "double-height lounge", "study / library", "garden sit-out", "guest suite", "family lounge"],
    apartment: ["utility room", "balcony", "laundry", "store room", "guest bedroom", "home office"],
    office: ["meeting room", "open office", "conference room", "pantry", "records room", "focus pod"],
    clinic: ["consultation room", "waiting area", "pharmacy", "lab", "staff room", "recovery room"],
    school: ["classroom", "lab", "library", "staff room", "activity room", "computer lab"],
    retail: ["display zone", "cash counter", "stock room", "office", "trial room", "storage"],
    restaurant: ["dining", "prep kitchen", "pantry", "waiting lounge", "private dining", "wash area"],
    warehouse: ["packing zone", "dispatch bay", "inventory aisle", "office", "security room", "loading dock"],
    "mixed-use": ["retail bay", "office suite", "apartment unit", "services room", "storage", "terrace"],
    studio: ["workbench", "display wall", "meeting nook", "material library", "archive", "editing bay"],
    temple: ["mandap", "pradakshina", "prayer hall", "service room", "shoe rack", "store room"],
  };

  const rooms = [...(candidateRooms[program] || candidateRooms.house)];
  const existing = existingSpaces.map((space) => space.toLowerCase());

  if (/ground/i.test(floorLevel) && bedroomCount > 3) {
    rooms.unshift(`bedroom ${bedroomCount}`);
  }

  const nextRoom = rooms.find((room) => !existing.some((space) => space.includes(room.toLowerCase())));
  return nextRoom || `${getStructureProgramLabel(program).toLowerCase()} room`;
}

function buildLocalFloors(storeys: number, parkingCars: number, features: StructureFeatures, style: string, program: StructureProgram, bedroomCount: number) {
  const core = features.hasLift ? ["stair core", "lift core"] : ["stair core"];
  const floors: FloorPlan[] = [];
  const isResidential = program === "house" || program === "villa" || program === "apartment" || program === "mixed-use";
  const isVillaStyle = program === "villa" || style === "villa" || style === "luxury";
  const isCountryStyle = style === "farmhouse" || style === "bungalow" || style === "a-frame";
  const bedroomRooms = Array.from({ length: Math.max(1, bedroomCount) }, (_, index) => (index === 0 ? "master bedroom" : `bedroom ${index + 1}`));
  const bedroomSlot = (index: number, fallback: string) => bedroomRooms[index] || fallback;
  const parkingLabel = features.hasCoveredParking ? `covered parking for ${parkingCars > 1 ? `${parkingCars} cars` : "1 car"}` : parkingCars > 1 ? `parking for ${parkingCars} cars` : "parking for 1 car";

  const basementSpacesByProgram: Record<StructureProgram, string[]> = {
    house: ["overflow parking", "storage", "utility", "pump room", "lift lobby"],
    villa: ["overflow parking", "storage", "utility", "home theatre", "lift lobby"],
    apartment: ["resident parking", "bike parking", "services", "trash room", "lift lobby"],
    office: ["archive", "server room", "services room", "pump room", "lift lobby"],
    clinic: ["diagnostic storage", "records archive", "services room", "lift lobby", "staff lounge"],
    school: ["stores", "archive", "services room", "lift lobby", "equipment room"],
    retail: ["stock room", "loading bay", "services room", "lift lobby", "secure storage"],
    restaurant: ["cold store", "dry store", "services room", "lift lobby", "prep storage"],
    warehouse: ["inventory aisles", "loading bay", "dispatch", "services room", "security room"],
    "mixed-use": ["parking", "storage", "services room", "lift lobby", "utility"],
    studio: ["material library", "archive", "services room", "display storage", "workroom"],
    temple: ["shoe storage", "offerings store", "services room", "lift lobby", "archive"],
  };

  const residentialGroundSpaces = [
    parkingLabel,
    features.hasCourtyard ? "entry courtyard" : "foyer / entry",
    features.hasDoubleHeight ? "double-height living" : "living room",
    isVillaStyle ? "family lounge" : "dining",
    bedroomSlot(3, "guest room"),
    "kitchen",
    "utility",
    "common powder room",
  ];

  const residentialFirstSpaces = [
    bedroomSlot(0, "master bedroom"),
    bedroomSlot(1, "bedroom 2"),
    bedroomSlot(2, "bedroom 3"),
    "family lounge",
    features.hasTerrace ? "terrace" : "balcony",
    "shared bath",
  ];

  const residentialSecondBaseSpaces = [
    bedroomSlot(3, "guest suite"),
    bedroomSlot(4, "bedroom 5"),
    "study / home office",
    features.hasTerrace ? "open terrace" : "balcony",
    "store room",
    "service wash area",
  ];
  const residentialSecondFlexRoom = getFirstUnusedRoom(program, "Second floor", residentialSecondBaseSpaces, bedroomCount);
  const residentialSecondSpaces = [
    residentialSecondBaseSpaces[0],
    residentialSecondBaseSpaces[1],
    residentialSecondFlexRoom,
    residentialSecondBaseSpaces[2],
    residentialSecondBaseSpaces[3],
    residentialSecondBaseSpaces[4],
    residentialSecondBaseSpaces[5],
  ];

  const programFloorSpaces: Record<StructureProgram, (floorIndex: number) => string[]> = {
    house: (floorIndex) => {
      if (floorIndex === 0) return residentialGroundSpaces;
      if (floorIndex === 1) return residentialFirstSpaces;
      if (floorIndex === 2) return residentialSecondSpaces;
      return ["multi-purpose room", "terrace garden", "solar zone", "services deck"];
    },
    villa: (floorIndex) => {
      if (floorIndex === 0) return [parkingLabel, "front veranda", features.hasCourtyard ? "courtyard" : "double-height lounge", "formal dining", "kitchen", "utility", "powder room"];
      if (floorIndex === 1) return [bedroomRooms[0], bedroomRooms[1] || "bedroom 2", "family lounge", features.hasArcadeRoom ? "arcade room" : "study / library", features.hasTerrace ? "terrace" : "balcony", "shared bath"];
      if (floorIndex === 2) return [bedroomRooms[2] || "guest suite", "study / library", features.hasTerrace ? "open terrace" : "balcony", "store room", "service wash area"];
      return ["multi-purpose room", "terrace garden", "sky deck", "services deck"];
    },
    apartment: (floorIndex) => {
      if (floorIndex === 0) return [parkingLabel, "entry lobby", "security desk", "mail room", "lift lobby", "stair lobby"];
      if (floorIndex === 1) return ["unit living", "unit kitchen", "unit bedroom", "shared bath", "utility", features.hasTerrace ? "balcony" : "light well"];
      if (floorIndex === 2) return ["second unit living", "second unit kitchen", "second unit bedroom", "shared bath", "utility", features.hasTerrace ? "balcony" : "light well"];
      return ["repeat unit", "family lounge", "balcony", "store room", "services deck"];
    },
    office: (floorIndex) => {
      if (floorIndex === 0) return ["reception", "waiting lounge", "meeting room", "open office", "pantry", "restrooms"];
      if (floorIndex === 1) return ["open office", "private cabin", "conference room", "print room", "pantry", "restrooms"];
      if (floorIndex === 2) return ["board room", "focus room", "training room", "records room", "pantry", "restrooms"];
      return ["project room", "terrace break-out", "services deck", "server room"];
    },
    clinic: (floorIndex) => {
      if (floorIndex === 0) return ["reception", "waiting", "consultation", "pharmacy", "nurse station", "accessible toilet"];
      if (floorIndex === 1) return ["consultation room", "procedure room", "lab", "doctor room", "staff room", "restroom"];
      if (floorIndex === 2) return ["observation", "recovery", "records", "staff lounge", "balcony", "restroom"];
      return ["services room", "storage", "terrace", "mechanical"];
    },
    school: (floorIndex) => {
      if (floorIndex === 0) return ["admin lobby", "classroom", "activity room", "toilets", "staff room", "library"];
      if (floorIndex === 1) return ["classroom", "lab", "library", "computer lab", "toilets", "project room"];
      if (floorIndex === 2) return ["classroom", "seminar room", "store room", "activity terrace", "toilets", "staff room"];
      return ["assembly hall", "services deck", "terrace", "equipment room"];
    },
    retail: (floorIndex) => {
      if (floorIndex === 0) return ["display floor", "cash counter", "trial room", "stock room", "office", "wash room"];
      if (floorIndex === 1) return ["display mezzanine", "support office", "storage", "trial room", "wash room"];
      if (floorIndex === 2) return ["studio", "stock room", "balcony", "services room", "office"];
      return ["multi-purpose room", "terrace garden", "services deck"];
    },
    restaurant: (floorIndex) => {
      if (floorIndex === 0) return ["dining", "kitchen", "prep kitchen", "cashier", "wash area", "store room"];
      if (floorIndex === 1) return ["private dining", "banquet room", "pantry", "staff room", "wash area"];
      if (floorIndex === 2) return ["terrace dining", "open kitchen", "store room", "services deck", "wash area"];
      return ["multi-purpose room", "terrace garden", "services deck"];
    },
    warehouse: (floorIndex) => {
      if (floorIndex === 0) return ["loading bay", "storage aisles", "packing", "dispatch", "security", "office"];
      if (floorIndex === 1) return ["storage aisles", "packing", "inspection", "services room", "staff room"];
      if (floorIndex === 2) return ["mezzanine office", "services room", "archive", "balcony", "staff room"];
      return ["services deck", "storage", "maintenance"];
    },
    "mixed-use": (floorIndex) => {
      if (floorIndex === 0) return ["retail bay", "security", "parking", "lobby", "services room", "office"];
      if (floorIndex === 1) return ["office suite", "meeting room", "pantry", "restrooms", "balcony"];
      if (floorIndex === 2) return ["apartment living", "apartment kitchen", "bedroom", "bath", features.hasTerrace ? "terrace" : "balcony"];
      return ["multi-purpose room", "terrace garden", "services deck"];
    },
    studio: (floorIndex) => {
      if (floorIndex === 0) return ["workbench", "display wall", "meeting nook", "material library", "archive", "wash room"];
      if (floorIndex === 1) return ["editing bay", "meeting room", "store room", "balcony", "services room"];
      if (floorIndex === 2) return ["studio loft", "terrace", "services deck", "archive"];
      return ["multi-purpose room", "terrace garden", "services deck"];
    },
    temple: (floorIndex) => {
      if (floorIndex === 0) return ["mandap", "prayer hall", "shoe rack", "offerings counter", "services room", "wash area"];
      if (floorIndex === 1) return ["prayer gallery", "pradakshina", "storage", "staff room", "balcony"];
      if (floorIndex === 2) return ["quiet prayer room", "terrace", "services deck", "archive"];
      return ["multi-purpose room", "terrace garden", "services deck"];
    },
  };

  if (features.hasBasement) {
    floors.push({
      level: "Basement",
      spaces: basementSpacesByProgram[program],
      core,
    });
  }

  for (let level = 0; level < storeys; level += 1) {
    floors.push({
      level: formatFloorLevel(level),
      spaces: programFloorSpaces[program](level),
      core,
    });
  }

  if (isResidential && style === "villa" && floors.length > 0) {
    const groundFloor = floors.find((floor) => /ground/i.test(floor.level));
    if (groundFloor && !groundFloor.spaces.some((space) => /courtyard/i.test(space)) && features.hasCourtyard) {
      groundFloor.spaces.splice(2, 0, "courtyard");
    }
  }

  if (isResidential && isCountryStyle && floors.length > 0) {
    const groundFloor = floors.find((floor) => /ground/i.test(floor.level));
    if (groundFloor && !groundFloor.spaces.some((space) => /verandah|porch/i.test(space))) {
      groundFloor.spaces.splice(1, 0, style === "bungalow" ? "front porch" : style === "a-frame" ? "covered deck" : "front verandah");
    }
  }

  return floors;
}

function buildFloorsFromBlueprint(bp: ArchetypeBlueprint): FloorPlan[] {
  return bp.floors.map((floor) => ({
    level: floor.level,
    spaces: floor.rooms.map((r) => r.name),
    core: floor.core.length > 0 ? [...floor.core] : undefined,
  }));
}

function buildLocalPlannerResult(prompt: string, intent: PromptIntent, previousSpec: HouseSpec | null): PlannerResult {
  // Ensure blueprints are registered
  initBlueprints();

  const houseConcept = classifyHouseConcept(prompt, previousSpec);
  const storeys = inferLocalStoreys(prompt, previousSpec, houseConcept.defaultStoreys);
  const style = inferLocalStyle(prompt, previousSpec, houseConcept.style);
  const plot = inferLocalPlotDimensions(prompt, previousSpec);
  const roadFacing = inferLocalFacing(prompt, previousSpec);
  const parkingCars = inferLocalParkingCars(prompt);
  const bedroomCount = inferLocalBedroomCount(prompt);
  const features = inferLocalFeatures(prompt);
  const program = inferStructureProgram(prompt, style, previousSpec?.program || null, houseConcept.program);
  const plotSpecified = Boolean(plot);
  const structureType = getStructureProgramLabel(program);
  const questionFlow = buildHouseQuestionFlow(houseConcept, {
    plotSpecified,
    hasLift: features.hasLift,
    hasBasement: features.hasBasement,
    hasCourtyard: features.hasCourtyard,
    hasDoubleHeight: features.hasDoubleHeight,
    hasCoveredParking: features.hasCoveredParking,
    hasTerrace: features.hasTerrace,
    hasVerandah: features.hasVerandah,
    hasPool: features.hasPool,
    hasHomeOffice: features.hasHomeOffice,
    bedroomCount,
    parkingCars,
  });

  // ── Blueprint path: use premade blueprint when available ──────
  let blueprintFloors: FloorPlan[] | null = null;
  let blueprintSource = "";
  let blueprintStoreys = storeys;
  let blueprintHasBasement = features.hasBasement;
  let blueprintHasLift = features.hasLift;
  if (hasBlueprint(houseConcept.archetype)) {
    let bp = getBlueprint(houseConcept.archetype)!;
    // Apply modifiers (lift, basement, courtyard, etc.)
    bp = applyModifiers(bp, houseConcept.modifiers);
    // Fit to user-provided plot dimensions
    if (plot) {
      bp = fitToPlot(bp, plot.plotWidthFt, plot.plotDepthFt);
    }
    blueprintFloors = buildFloorsFromBlueprint(bp);
    blueprintSource = `Premade ${bp.label} blueprint with ${bp.floors.length} floors, ${bp.floors.reduce((n, f) => n + f.rooms.length, 0)} rooms.`;
    // Override storeys/features from the blueprint
    const hasBasementFloor = bp.floors.some((f) => /basement/i.test(f.level));
    const aboveGroundFloors = bp.floors.filter((f) => !/basement/i.test(f.level)).length;
    blueprintStoreys = Math.max(storeys, aboveGroundFloors);
    blueprintHasBasement = blueprintHasBasement || hasBasementFloor;
    blueprintHasLift = blueprintHasLift || bp.floors.some((f) => f.core.includes("lift core"));
  }

  const spec: HouseSpec = {
    status: "editable plan + 3D model",
    request: prompt,
    source: "local",
    program,
    structureType,
    houseConcept,
    site: {
      roadFacing,
      mainEntranceFacing: roadFacing,
      ...(plot
        ? {
            plotWidthFt: plot.plotWidthFt,
            plotDepthFt: plot.plotDepthFt,
          }
        : {}),
    },
    building: {
      totalStoreys: blueprintStoreys,
      style,
    },
    facade: {
      mainEntranceFacing: roadFacing,
    },
    floors: blueprintFloors ?? buildLocalFloors(storeys, parkingCars, features, style, program, bedroomCount),
    notes: [
      `House decision tree branch: ${formatHouseConcept(houseConcept)}.`,
      houseConcept.summary,
      `Structure program inferred from the prompt: ${structureType}.`,
      "DSL is generated directly in the popup and rendered as an editable plan plus 3D model.",
      blueprintSource || "No premade blueprint available for this archetype; using generic floor generation.",
      plotSpecified
        ? `Plot size taken from your request: ${plot?.plotWidthFt} ft x ${plot?.plotDepthFt} ft.`
        : "Plot size was not provided, so the DSL-driven model keeps the footprint open.",
      features.hasBasement ? "Basement level is represented in the DSL and 3D model." : "No basement requested in the prompt.",
      program === "villa" ? "Villa massing uses stepped floors, a front portico, and lighter materials." : program === "apartment" ? "Apartment massing keeps stacked residential levels and a clear service core." : "Model keeps the local DSL simple and prompt-driven.",
      features.hasLift ? "Lift core runs through the stack in 3D." : "No lift requested in the prompt.",
      features.hasCourtyard ? "Courtyard is represented in the floor map." : "No courtyard requested in the prompt.",
      features.hasArcadeRoom ? "Arcade room is represented on the villa upper floor." : "No arcade room requested.",
      features.hasVerandah ? "Verandah or porch space is represented in the tree." : "No verandah or porch requested.",
      features.hasPool ? "Pool or water-court intent is tracked in the tree." : "No pool requested.",
      features.hasDoubleHeight ? "Double-height space is carried into the plan and 3D preview." : "No double-height space requested.",
      features.hasCoveredParking ? "Covered parking is shown on the ground level." : "Parking remains open/unspecified in the plan.",
      `Requested as a ${intent} prompt with an estimated ${bedroomCount} BHK layout.`,
    ],
    questions: questionFlow,
  };

  return {
    spec,
    lawReview: null,
    lawReviewError: "",
    dsl: buildHouseDsl(spec, spec.floors || []),
  };
}

type FloorRoomPlacement = {
  roomIndex: number;
  space: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: string;
};

function getRoomCategory(space: string) {
  const lower = String(space || "").toLowerCase();

  if (/arcade|game|recreation|entertainment|media/.test(lower)) {
    return "ENTERTAINMENT";
  }
  if (/parking|garage/.test(lower)) {
    return "PARKING";
  }
  if (/living|lounge|family/.test(lower)) {
    return "LIVING";
  }
  if (/kitchen/.test(lower)) {
    return "KITCHEN";
  }
  if (/dining/.test(lower)) {
    return "DINING";
  }
  if (/bedroom|suite/.test(lower)) {
    return "BEDROOM";
  }
  if (/bath|powder|wash/.test(lower)) {
    return "WET AREA";
  }
  if (/balcony|terrace|open/.test(lower)) {
    return "OPEN TO SKY";
  }
  if (/utility|storage|service|pump|lobby|foyer|entry|study|office/.test(lower)) {
    return "SERVICE";
  }
  if (/courtyard|veranda|porch/.test(lower)) {
    return "SIT OUT";
  }

  return "SPACE";
}

function buildRoomPlacements(
  floor: FloorPlan,
  aboveGroundIndex: number,
  planLeft: number,
  planTop: number,
  planWidth: number,
  planHeight: number,
  isVillaLike: boolean,
): FloorRoomPlacement[] {
  const spaces = floor.spaces.length > 0 ? floor.spaces : ["open space"];
  const frameLeft = planLeft + 10;
  const frameTop = planTop + 10;
  const frameWidth = planWidth - 20;
  const frameHeight = planHeight - 20;

  const toPlacement = (roomIndex: number, space: string, template: { left: number; top: number; width: number; height: number }): FloorRoomPlacement => ({
    roomIndex,
    space,
    x: frameLeft + template.left * frameWidth,
    y: frameTop + template.top * frameHeight,
    width: template.width * frameWidth,
    height: template.height * frameHeight,
    category: getRoomCategory(space),
  });

  if (isVillaLike && aboveGroundIndex >= 0) {
    const villaTemplates: Array<Array<{ left: number; top: number; width: number; height: number }>> = [
      [
        { left: 0.00, top: 0.00, width: 0.22, height: 0.28 },
        { left: 0.22, top: 0.00, width: 0.16, height: 0.20 },
        { left: 0.38, top: 0.00, width: 0.34, height: 0.34 },
        { left: 0.72, top: 0.00, width: 0.28, height: 0.20 },
        { left: 0.22, top: 0.20, width: 0.30, height: 0.22 },
        { left: 0.52, top: 0.20, width: 0.22, height: 0.18 },
        { left: 0.74, top: 0.20, width: 0.14, height: 0.16 },
        { left: 0.88, top: 0.20, width: 0.12, height: 0.16 },
      ],
      [
        { left: 0.00, top: 0.00, width: 0.30, height: 0.30 },
        { left: 0.30, top: 0.00, width: 0.30, height: 0.30 },
        { left: 0.60, top: 0.00, width: 0.40, height: 0.30 },
        { left: 0.00, top: 0.32, width: 0.64, height: 0.24 },
        { left: 0.64, top: 0.32, width: 0.36, height: 0.24 },
      ],
      [
        { left: 0.00, top: 0.00, width: 0.34, height: 0.30 },
        { left: 0.34, top: 0.00, width: 0.28, height: 0.30 },
        { left: 0.62, top: 0.00, width: 0.38, height: 0.30 },
        { left: 0.00, top: 0.30, width: 0.50, height: 0.22 },
        { left: 0.50, top: 0.30, width: 0.50, height: 0.22 },
      ],
    ];

    const selectedTemplates = villaTemplates[Math.min(aboveGroundIndex, villaTemplates.length - 1)];
    return spaces.map((space, roomIndex) => {
      const template = selectedTemplates[roomIndex];
      if (template) {
        return toPlacement(roomIndex, space, template);
      }

      const fallbackColumns = Math.max(2, Math.min(3, spaces.length));
      const fallbackRows = Math.max(1, Math.ceil(spaces.length / fallbackColumns));
      const fallbackGap = Math.max(6, Math.min(10, Math.round(frameWidth * 0.016)));
      const fallbackWidth = (frameWidth - fallbackGap * (fallbackColumns - 1)) / fallbackColumns;
      const fallbackHeight = (frameHeight - fallbackGap * (fallbackRows - 1)) / fallbackRows;
      const column = roomIndex % fallbackColumns;
      const row = Math.floor(roomIndex / fallbackColumns);

      return {
        roomIndex,
        space,
        x: frameLeft + column * (fallbackWidth + fallbackGap),
        y: frameTop + row * (fallbackHeight + fallbackGap),
        width: fallbackWidth,
        height: fallbackHeight,
        category: getRoomCategory(space),
      };
    });
  }

  const columns = spaces.length > 4 ? 3 : spaces.length > 2 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(spaces.length / columns));
  const gap = Math.max(6, Math.min(10, Math.round(frameWidth * 0.016)));
  const tileWidth = (frameWidth - gap * (columns - 1)) / columns;
  const tileHeight = (frameHeight - gap * (rows - 1)) / rows;

  return spaces.map((space, roomIndex) => {
    const column = roomIndex % columns;
    const row = Math.floor(roomIndex / columns);

    return {
      roomIndex,
      space,
      x: frameLeft + column * (tileWidth + gap),
      y: frameTop + row * (tileHeight + gap),
      width: tileWidth,
      height: tileHeight,
      category: getRoomCategory(space),
    };
  });
}

function buildEmergencyPlannerResult(prompt: string, error: unknown): PlannerResult {
  const message = error instanceof Error ? error.message : String(error || "Draft generation unavailable");
  const houseConcept = classifyHouseConcept(prompt, null);
  const spec: HouseSpec = {
    status: "editable plan + 3D model",
    request: prompt,
    source: "local",
    program: "house",
    structureType: "house",
    houseConcept,
    site: {},
    building: {
      totalStoreys: 1,
      style: "modern",
    },
    facade: {},
    floors: [],
    notes: ["The local draft generator hit an error, so a minimal fallback preview was used."],
    questions: ["Please refine the prompt and try again."],
  };

  return {
    spec,
    lawReview: null,
    lawReviewError: message,
    dsl: "",
  };
}

function formatHouseSummary(spec: HouseSpec, lawReview: LawReview | null, lawReviewError: string) {
  const plotWidth = spec?.site?.plotWidthFt;
  const plotDepth = spec?.site?.plotDepthFt;
  const structureLabel = spec?.structureType || spec?.program || spec?.building?.style || "unknown";
  const conceptLabel = spec?.houseConcept ? formatHouseConcept(spec.houseConcept) : "not classified";
  const plotLabel =
    typeof plotWidth === "number" && plotWidth > 0 && typeof plotDepth === "number" && plotDepth > 0
      ? `${plotWidth} ft x ${plotDepth} ft`
      : "not specified";
  const professionalGuidance = buildProfessionalGuidance(spec, lawReview, lawReviewError);
  const lines = [
    `Status: ${spec?.status || "unknown"}`,
    `Request: ${spec?.request || "unknown"}`,
    `Structure: ${structureLabel}`,
    `Concept: ${conceptLabel}`,
    `Plot: ${plotLabel}`,
    `Storeys: ${spec?.building?.totalStoreys ?? "unknown"}`,
    `Style: ${spec?.building?.style || "unknown"}`,
    `Road facing: ${spec?.site?.roadFacing || "unknown"}`,
    `Main entrance: ${spec?.facade?.mainEntranceFacing || "unknown"}`,
    `Render path: DSL -> editable plan -> 3D`,
  ];

  const hasLift = /\blift\b|\belevator\b/i.test(String(spec?.request || ""));
  const hasBasement = hasBasementFloor(Array.isArray(spec?.floors) ? spec.floors : [], String(spec?.request || ""));

  if (hasLift) {
    lines.push(`Vertical core: lift + stair`);
  }

  if (hasBasement) {
    lines.push(`Basement: yes`);
  }

  if (spec?.source) {
    lines.push(`Source: ${spec.source}`);
  }

  if (Array.isArray(spec?.floors) && spec.floors.length > 0) {
    lines.push("", "Structure:");
    spec.floors.slice(0, 4).forEach((floor) => {
      lines.push(`- ${floor.level}: ${floor.spaces.join(", ")}`);
    });
  }

  if (Array.isArray(spec?.notes) && spec.notes.length > 0) {
    lines.push("", "Notes:");
    spec.notes.slice(0, 3).forEach((note: string) => {
      lines.push(`- ${note}`);
    });
  }

  if (Array.isArray(spec?.questions) && spec.questions.length > 0) {
    lines.push("", "Questions:");
    spec.questions.slice(0, 3).forEach((question: string) => {
      lines.push(`- ${question}`);
    });
  }

  if (professionalGuidance.requested.length > 0 || professionalGuidance.recommended.length > 0) {
    lines.push("", "Professional guidance:");
    if (professionalGuidance.requested.length > 0) {
      lines.push(`- Requested: ${formatProfessionalList(professionalGuidance.requested)}`);
    }
    lines.push(`- Suggested: ${formatProfessionalList(professionalGuidance.recommended)}`);
    lines.push(`- ${professionalGuidance.note}`);
  }

  return lines.join("\n");
}

function formatLawReviewSummary(lawReview: LawReview | null, lawReviewError: string) {
  if (lawReviewError) {
    return `Law review unavailable:\n${lawReviewError}`;
  }

  if (!lawReview) {
    return "Legal review will appear after generation.";
  }

  const lines = [
    `Status: ${lawReview.status || "unknown"}`,
    `Risk: ${lawReview.riskLevel || "unknown"}`,
    `Safe to proceed: ${lawReview.safeToProceed ? "yes" : "no"}`,
    `Summary: ${lawReview.summary || "No summary provided"}`,
  ];

  if (Array.isArray(lawReview.issues) && lawReview.issues.length > 0) {
    lines.push("", "Issues:");
    lawReview.issues.slice(0, 5).forEach((issue: string) => {
      lines.push(`- ${issue}`);
    });
  }

  if (Array.isArray(lawReview.recommendations) && lawReview.recommendations.length > 0) {
    lines.push("", "Recommendations:");
    lawReview.recommendations.slice(0, 5).forEach((recommendation: string) => {
      lines.push(`- ${recommendation}`);
    });
  }

  return lines.join("\n");
}

function normalizeProfessionalLabel(label: string) {
  return String(label || "").trim().toLowerCase();
}

function formatProfessionalList(items: string[]) {
  const labels = Array.from(new Set((Array.isArray(items) ? items : []).map(normalizeProfessionalLabel).filter(Boolean)));
  if (labels.length === 0) {
    return "architect and lawyer";
  }

  return labels.join(" and ");
}

function buildProfessionalGuidance(spec: HouseSpec, lawReview: LawReview | null, lawReviewError: string): ProfessionalGuidance {
  const requestText = String(spec?.request || "");
  const lowerRequest = requestText.toLowerCase();
  const requested: string[] = [];

  if (/\blawyer\b|\battorney\b|\blegal\b/i.test(lowerRequest)) {
    requested.push("lawyer");
  }

  if (/\barchitect(?:er)?\b|\barchitecture\b|\barchitectural\b/i.test(lowerRequest)) {
    requested.push("architect");
  }

  const recommended = new Set(["architect", "lawyer"]);
  if (spec?.status === "needs_clarification") {
    recommended.add("architect");
  }

  if (lawReviewError || lawReview?.safeToProceed === false) {
    recommended.add("lawyer");
  }

  const requestedLabel = requested.length > 0 ? formatProfessionalList(requested) : "";
  const note = requestedLabel
    ? `Requested professional support: ${requestedLabel}.`
    : lawReviewError
      ? "A local lawyer should review zoning and permit questions before final issue."
      : lawReview?.safeToProceed === false
        ? "A lawyer should review the flagged compliance items before final issue."
        : "For final issue, talk to a licensed architect for design review and a local lawyer for zoning and permit checks.";

  return {
    requested,
    recommended: Array.from(recommended),
    note,
  };
}

function buildBotReply(spec: HouseSpec, lawReview: LawReview | null, lawReviewError: string) {
  const structureLabel = spec?.structureType || spec?.program || "house";
  const reply = [`${spec?.source === "local" ? "DSL-driven structure model" : "Structure plan"} for a ${spec?.building?.totalStoreys ?? "?"}-storey ${structureLabel}.`];
  const professionalGuidance = buildProfessionalGuidance(spec, lawReview, lawReviewError);

  if (spec?.source === "local") {
    reply.push("The popup generates DSL first, then renders a live floor map and 3D model.");
  } else {
    reply.push("The backend spec is converted into DSL and rendered as an editable plan inside the workspace.");
  }

  if (spec?.houseConcept) {
    reply.push(`House concept: ${formatHouseConcept(spec.houseConcept)}.`);
    reply.push(`Decision tree: ${spec.houseConcept.summary}`);
  }

  reply.push(`Professional guidance: ${professionalGuidance.note}`);

  if (lawReviewError) {
    reply.push(`Law review note: ${lawReviewError}`);
  } else if (lawReview) {
    reply.push(`Law review ${lawReview.status || "completed"} with ${lawReview.riskLevel || "unknown"} risk.`);
  } else {
    reply.push("Legal review will run after the house spec is ready.");
  }

  return reply.join("\n");
}

async function requestHousePlan(requestText: string, intent: PromptIntent, previousSpec: HouseSpec | null) {
  console.log("[ArchGPT] Requesting house plan...", { intent });
  const response = await fetchWithTimeout(`${ARCHGPT_API_BASE}/api/house-spec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request: requestText,
      intent,
      previousSpec,
    }),
    timeout: 20000,
  });

  const payload = (await response.json().catch(() => ({}))) as HouseSpecResponse;

  if (!response.ok) {
    const errorMessage = payload.error || payload.message || `House spec request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload;
}

function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`code-${match.index}`} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.95em] text-purple-100">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderChatMessageContent(content: string) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let listIndex = 0;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`list-${listIndex++}`} className="list-disc space-y-1 pl-5">
        {listItems}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushList();
      return;
    }

    const bulletMatch = trimmedLine.match(/^(?:[*-]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${lineIndex}`} className="leading-6">
          {renderInlineMarkdown(bulletMatch[1])}
        </li>,
      );
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${lineIndex}`} className="leading-6">
        {renderInlineMarkdown(trimmedLine)}
      </p>,
    );
  });

  flushList();
  return blocks;
}

async function requestLawChat(question: string) {
  const response = await fetch("/api/law-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: question.trim(),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as LawChatResponse;

  if (!response.ok) {
    const errorMessage = payload.error || payload.message || `Law chat request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  const answer = typeof payload.answer === "string" ? payload.answer.trim() : "";
  if (!answer) {
    throw new Error("Law chat response was empty");
  }

  return answer;
}

function isBasementLevel(level: string) {
  return /basement/i.test(level);
}

function getFloorBadge(level: string, index: number) {
  const normalizedLevel = level.toLowerCase();

  if (normalizedLevel.includes("basement")) return "B1";
  if (normalizedLevel.includes("ground")) return "G";
  if (normalizedLevel.includes("first")) return "1";
  if (normalizedLevel.includes("second")) return "2";

  const match = level.match(/\b(\d+)\b/);
  return match ? match[1] : String(index + 1);
}

function summarizeFloorSpaces(floor: FloorPlan) {
  const summary = floor.spaces.slice(0, 3).join(" · ");
  return summary.length > 56 ? `${summary.slice(0, 53)}...` : summary;
}

function hasLiftCore(floors: FloorPlan[], requestText: string) {
  return floors.some((floor) => Array.isArray(floor.core) && floor.core.some((entry) => /lift/i.test(entry))) || /\blift\b|\belevator\b/i.test(requestText);
}

function hasBasementFloor(floors: FloorPlan[], requestText: string) {
  return floors.some((floor) => isBasementLevel(floor.level)) || requestHasFeature(requestText, /\bbasement\b/i, [/\bno\s+basement\b/i, /\bwithout\s+basement\b/i, /\bbasement[-\s]?free\b/i, /\bexclude\s+basement\b/i]);
}

function sortModelFloors(floors: FloorPlan[]) {
  return [...floors].sort((left, right) => {
    const leftBasement = isBasementLevel(left.level);
    const rightBasement = isBasementLevel(right.level);
    if (leftBasement !== rightBasement) {
      return leftBasement ? -1 : 1;
    }
    return 0;
  });
}

function getStructureFloors(spec: HouseSpec) {
  const requestText = String(spec?.request || "");
  const style = (spec?.building?.style || "").toLowerCase();
  const program = inferStructureProgram(requestText, style, spec?.program || null);
  const features = inferLocalFeatures(requestText);
  const parkingCars = inferLocalParkingCars(requestText);
  const bedroomCount = inferLocalBedroomCount(requestText);
  const core = features.hasLift ? ["stair core", "lift core"] : ["stair core"];

  const sourceFloors = Array.isArray(spec?.floors) && spec.floors.length > 0
    ? cloneFloors(spec.floors).map((floor) => ({
        ...floor,
        core: floor.core && floor.core.length > 0 ? floor.core : core,
      }))
    : [];

  if (sourceFloors.length > 0) {
    const hasSourceBasement = sourceFloors.some((floor) => /basement/i.test(floor.level));
    if (features.hasBasement && !hasSourceBasement) {
      sourceFloors.unshift({
        level: "Basement",
        spaces: ["overflow parking", "storage", "utility", "pump room", "lift lobby"],
        core,
      });
    }
    return sortModelFloors(sourceFloors);
  }

  const storeys = Math.max(1, spec?.building?.totalStoreys || 1);
  return buildLocalFloors(storeys, parkingCars, features, style, program, bedroomCount);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StructureModelViewport({ spec, floors, embedded = false }: { spec: HouseSpec; floors: FloorPlan[]; embedded?: boolean }) {
  const requestText = String(spec?.request || "");
  const hasLift = hasLiftCore(floors, requestText);
  const hasBasement = hasBasementFloor(floors, requestText);
  const plotWidth = spec?.site?.plotWidthFt;
  const plotDepth = spec?.site?.plotDepthFt;
  const plotSpecified = typeof plotWidth === "number" && plotWidth > 0 && typeof plotDepth === "number" && plotDepth > 0;
  const aboveGroundFloors = floors.filter((floor) => !isBasementLevel(floor.level));
  const basementFloor = floors.find((floor) => isBasementLevel(floor.level)) || null;
  const floorHeight = embedded ? 46 : 52;
  const bodyWidth = embedded ? 252 : 290;
  const bodyDepth = embedded ? 82 : 96;
  const depthRise = embedded ? 22 : 26;
  const baseX = embedded ? 168 : 182;
  const groundY = embedded ? 314 : 350;
  const totalHeight = Math.max(aboveGroundFloors.length, 1) * floorHeight;
  const topY = groundY - totalHeight;
  const liftX = baseX + bodyWidth - 78;
  const liftWidth = hasLift ? 44 : 0;
  const modelTitle = spec?.source === "local" ? "DSL-driven 3D model" : "Architectural model";
  const modelSubtitle = `G+${Math.max(0, aboveGroundFloors.length - 1)} ${spec?.building?.style || "house"}`;

  return (
    <div className={`relative overflow-hidden rounded-[26px] border border-purple-400/15 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),rgba(6,8,12,0.98)_56%)] ${embedded ? "min-h-[290px]" : "min-h-[390px]"}`}>
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.09) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Model</p>
          <h4 className="mt-1 text-sm font-semibold text-white">{modelTitle}</h4>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-300">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-purple-100">{modelSubtitle}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{plotSpecified ? `${plotWidth} × ${plotDepth} ft site` : "No plot size entered"}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-2 pb-2 pt-1">
        <svg className="block h-full w-full" viewBox="0 0 760 520" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="modelSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#17131f" />
              <stop offset="55%" stopColor="#0a0c11" />
              <stop offset="100%" stopColor="#07080c" />
            </linearGradient>
            <linearGradient id="floorFrontFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b2a63" />
              <stop offset="100%" stopColor="#17101f" />
            </linearGradient>
            <linearGradient id="floorSideFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#241837" />
              <stop offset="100%" stopColor="#0f0b15" />
            </linearGradient>
            <linearGradient id="floorTopFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            <linearGradient id="basementFrontFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1226" />
              <stop offset="100%" stopColor="#0a0710" />
            </linearGradient>
            <linearGradient id="basementTopFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1f1530" />
              <stop offset="100%" stopColor="#120c1d" />
            </linearGradient>
            <linearGradient id="liftCoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.92" />
            </linearGradient>
            <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.22" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          <rect width="760" height="520" fill="url(#modelSky)" />

          <ellipse cx="372" cy="430" rx="250" ry="60" fill="rgba(168,85,247,0.14)" />
          <polygon points="96,418 548,418 676,486 222,486" fill="rgba(168,85,247,0.08)" />
          <line x1="88" y1={groundY} x2="650" y2={groundY} stroke="rgba(236,72,153,0.4)" strokeDasharray="7 8" />

          {basementFloor && (
            <g filter="url(#softShadow)">
              {(() => {
                const basementTop = groundY + 16;
                const basementHeight = floorHeight;
                const basementFrontPoints = `${baseX},${basementTop} ${baseX + bodyWidth},${basementTop} ${baseX + bodyWidth},${basementTop + basementHeight} ${baseX},${basementTop + basementHeight}`;
                const basementSidePoints = `${baseX + bodyWidth},${basementTop} ${baseX + bodyWidth + bodyDepth},${basementTop - depthRise} ${baseX + bodyWidth + bodyDepth},${basementTop + basementHeight - depthRise} ${baseX + bodyWidth},${basementTop + basementHeight}`;
                const basementTopPoints = `${baseX},${basementTop} ${baseX + bodyDepth},${basementTop - depthRise} ${baseX + bodyWidth + bodyDepth},${basementTop - depthRise} ${baseX + bodyWidth},${basementTop}`;
                const summary = summarizeFloorSpaces(basementFloor);
                return (
                  <g>
                    <polygon points={basementTopPoints} fill="url(#basementTopFill)" stroke="rgba(244,231,255,0.12)" />
                    <polygon points={basementSidePoints} fill="url(#floorSideFill)" stroke="rgba(244,231,255,0.12)" />
                    <polygon points={basementFrontPoints} fill="url(#basementFrontFill)" stroke="rgba(244,231,255,0.12)" />

                    <rect x={baseX + 18} y={basementTop + 14} width={54} height={16} rx={8} fill="rgba(168,85,247,0.16)" />
                    <text x={baseX + 24} y={basementTop + 26} fill="#f5d0fe" fontSize="11" fontWeight="700">B1</text>
                    <text x={baseX + 82} y={basementTop + 26} fill="#e9d5ff" fontSize="10">Basement</text>
                    <text x={baseX + 18} y={basementTop + 44} fill="#c4b5fd" fontSize="10">{summary}</text>

                    {Array.from({ length: 3 }).map((_, column) => (
                      <rect
                        key={`basement-window-${column}`}
                        x={baseX + 34 + column * 72}
                        y={basementTop + 30}
                        width="28"
                        height="12"
                        rx="4"
                        fill="url(#windowGlow)"
                        opacity="0.75"
                      />
                    ))}
                  </g>
                );
              })()}
            </g>
          )}

          <g filter="url(#softShadow)">
            {aboveGroundFloors.map((floor, index) => {
              const y = groundY - (index + 1) * floorHeight;
              const frontPoints = `${baseX},${y} ${baseX + bodyWidth},${y} ${baseX + bodyWidth},${y + floorHeight} ${baseX},${y + floorHeight}`;
              const sidePoints = `${baseX + bodyWidth},${y} ${baseX + bodyWidth + bodyDepth},${y - depthRise} ${baseX + bodyWidth + bodyDepth},${y + floorHeight - depthRise} ${baseX + bodyWidth},${y + floorHeight}`;
              const topPoints = `${baseX},${y} ${baseX + bodyDepth},${y - depthRise} ${baseX + bodyWidth + bodyDepth},${y - depthRise} ${baseX + bodyWidth},${y}`;
              const badge = getFloorBadge(floor.level, index);
              const summary = summarizeFloorSpaces(floor);
              const hasBalcony = floor.spaces.some((space) => /balcony/i.test(space));

              return (
                <g key={floor.level}>
                  <polygon points={topPoints} fill="url(#floorTopFill)" stroke="rgba(244,231,255,0.12)" />
                  <polygon points={sidePoints} fill="url(#floorSideFill)" stroke="rgba(244,231,255,0.12)" />
                  <polygon points={frontPoints} fill="url(#floorFrontFill)" stroke="rgba(244,231,255,0.12)" />

                  <rect x={baseX + 18} y={y + 12} width={56} height={16} rx={8} fill="rgba(168,85,247,0.18)" />
                  <text x={baseX + 24} y={y + 24} fill="#f5d0fe" fontSize="11" fontWeight="700">{badge}</text>
                  <text x={baseX + 84} y={y + 24} fill="#ffffff" fontSize="10" fontWeight="600">{floor.level}</text>
                  <text x={baseX + 18} y={y + 44} fill="#ddd6fe" fontSize="10">{summary}</text>

                  <rect x={baseX + 20} y={y + 18} width="38" height="8" rx="4" fill="rgba(255,255,255,0.08)" />

                  {Array.from({ length: 4 }).map((_, column) => (
                    <rect
                      key={`${floor.level}-window-${column}`}
                      x={baseX + 26 + column * 58}
                      y={y + 28}
                      width="22"
                      height="12"
                      rx="4"
                      fill="url(#windowGlow)"
                      opacity={index === 0 ? "0.82" : "0.72"}
                    />
                  ))}

                  {hasBalcony && (
                    <rect
                      x={baseX + bodyWidth - 76}
                      y={y + 28}
                      width="54"
                      height="8"
                      rx="4"
                      fill="rgba(244,114,182,0.4)"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {hasLift && (
            <g>
              <rect
                x={liftX}
                y={hasBasement ? groundY + 2 - floorHeight : topY + 4}
                width={liftWidth}
                height={totalHeight + (hasBasement ? floorHeight + 8 : 0)}
                rx="10"
                fill="url(#liftCoreFill)"
                opacity="0.9"
              />
              <text
                x={liftX + liftWidth / 2}
                y={hasBasement ? groundY + 8 : topY + 18}
                textAnchor="middle"
                fill="#2e1065"
                fontSize="10"
                fontWeight="800"
              >
                LIFT
              </text>
              <text
                x={liftX + liftWidth / 2}
                y={hasBasement ? groundY + 22 : topY + 32}
                textAnchor="middle"
                fill="#4c1d95"
                fontSize="8"
                fontWeight="700"
              >
                CORE
              </text>
            </g>
          )}

          <g>
            <rect x="76" y={groundY - 12} width="122" height="22" rx="11" fill="rgba(168,85,247,0.18)" />
            <text x="88" y={groundY + 3} fill="#f5d0fe" fontSize="10" fontWeight="700">North</text>
            <text x="128" y={groundY + 3} fill="#ddd6fe" fontSize="10">Road facing</text>

            <rect x="530" y="84" width="156" height="24" rx="12" fill="rgba(17,24,39,0.76)" stroke="rgba(168,85,247,0.2)" />
            <text x="544" y="100" fill="#ffffff" fontSize="10" fontWeight="700">{hasBasement ? "Basement + G+2" : "G+2 3D model"}</text>
          </g>

          {!plotSpecified && (
            <g>
              <rect x="74" y="74" width="250" height="24" rx="12" fill="rgba(17,24,39,0.76)" stroke="rgba(168,85,247,0.2)" />
              <text x="88" y="90" fill="#ddd6fe" fontSize="10">Plot size not entered, so the model keeps the footprint open.</text>
            </g>
          )}
        </svg>

        <div className="absolute left-4 bottom-4 right-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{hasLift ? "Lift core" : "Stair core"}</span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{hasBasement ? "Basement included" : "No basement level"}</span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{aboveGroundFloors.length} visible levels</span>
          {plotSpecified ? (
            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{plotWidth} × {plotDepth} ft plot</span>
          ) : (
            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">No guessed plot size</span>
          )}
        </div>
      </div>
    </div>
  );
}

function HouseDwgViewport({
  spec,
  floors,
  embedded = false,
  activeTool = "select",
  activeFloorIndex = 0,
  showDimensions = true,
  selectedRoom = null,
  cadMarks = [],
  onRoomClick,
  onBlankClick,
}: { spec: HouseSpec; floors: FloorPlan[]; embedded?: boolean; activeTool?: CadTool; activeFloorIndex?: number; showDimensions?: boolean; selectedRoom?: CadSelection; cadMarks?: CadAnnotation[]; onRoomClick?: (floorIndex: number, roomIndex: number) => void; onBlankClick?: (floorIndex: number) => void; }) {
  const plotWidth = spec?.site?.plotWidthFt;
  const plotDepth = spec?.site?.plotDepthFt;
  const plotSpecified = typeof plotWidth === "number" && plotWidth > 0 && typeof plotDepth === "number" && plotDepth > 0;
  const requestText = String(spec?.request || "");
  const style = String(spec?.building?.style || "").toLowerCase();
  const program = spec?.program || inferStructureProgram(requestText, style, spec?.program || null);
  const isVillaLike = program === "villa" || style === "villa" || style === "luxury";
  const hasLift = hasLiftCore(floors, requestText);
  const hasBasement = hasBasementFloor(floors, requestText);
  const showMeasurementOverlay = showDimensions || activeTool === "measure" || activeTool === "dimension";
  const visibleFloors = floors.length > 0
    ? floors
    : [{ level: "Ground floor", spaces: ["open plan"], core: ["stair core"] }];
  const showGuideGrid = !isVillaLike;
  const planTheme = isVillaLike
    ? {
        skyStart: "#f6efd9",
        skyEnd: "#e9dcc3",
        outerFill: "rgba(251, 246, 235, 0.96)",
        outerStroke: "rgba(90, 73, 56, 0.18)",
        gridStrong: "rgba(99, 81, 63, 0.10)",
        gridWeak: "rgba(99, 81, 63, 0.05)",
        planFill: "rgba(255, 252, 245, 0.98)",
        planStroke: "rgba(86, 68, 52, 0.72)",
        innerStroke: "rgba(86, 68, 52, 0.18)",
        headerText: "#3f2f22",
        subText: "#7a6550",
        coreFill: "rgba(135, 111, 86, 0.08)",
        coreStroke: "rgba(86, 68, 52, 0.22)",
        coreText: "#594636",
        footerFill: "rgba(248, 242, 231, 0.96)",
        footerStroke: "rgba(86, 68, 52, 0.18)",
        footerText: "#423427",
      }
    : {
        skyStart: "#111827",
        skyEnd: "#06070b",
        outerFill: "rgba(5, 8, 14, 0.55)",
        outerStroke: "rgba(168, 85, 247, 0.14)",
        gridStrong: "rgba(196, 181, 253, 0.12)",
        gridWeak: "rgba(255, 255, 255, 0.04)",
        planFill: "rgba(15, 23, 42, 0.62)",
        planStroke: "rgba(255, 255, 255, 0.2)",
        innerStroke: "rgba(255, 255, 255, 0.08)",
        headerText: "#f5d0fe",
        subText: "#94a3b8",
        coreFill: "rgba(168, 85, 247, 0.08)",
        coreStroke: "rgba(168, 85, 247, 0.25)",
        coreText: "#f5d0fe",
        footerFill: "rgba(6, 8, 12, 0.84)",
        footerStroke: "rgba(168, 85, 247, 0.16)",
        footerText: "#f5d0fe",
      };

  const getRoomTone = (space: string) => {
    const lower = space.toLowerCase();
    if (/arcade|game|recreation|entertainment|media/.test(lower)) {
      return isVillaLike
        ? { fill: "rgba(255, 247, 214, 0.98)", stroke: "rgba(135, 94, 46, 0.9)", text: "#613f22" }
        : { fill: "rgba(251, 191, 36, 0.12)", stroke: "rgba(245, 158, 11, 0.84)", text: "#fef3c7" };
    }
    if (isVillaLike) {
      if (/parking|garage/.test(lower)) {
        return { fill: "rgba(226, 214, 194, 0.92)", stroke: "rgba(108, 89, 70, 0.84)", text: "#4a3c2d" };
      }
      if (/living|lounge|family/.test(lower)) {
        return { fill: "rgba(250, 245, 236, 0.98)", stroke: "rgba(81, 63, 48, 0.84)", text: "#31271e" };
      }
      if (/kitchen|dining/.test(lower)) {
        return { fill: "rgba(245, 236, 219, 0.97)", stroke: "rgba(130, 96, 56, 0.82)", text: "#53361f" };
      }
      if (/bedroom|suite/.test(lower)) {
        return { fill: "rgba(250, 246, 240, 0.98)", stroke: "rgba(112, 90, 74, 0.82)", text: "#402e23" };
      }
      if (/bath|powder|wash/.test(lower)) {
        return { fill: "rgba(241, 248, 250, 0.98)", stroke: "rgba(90, 130, 147, 0.82)", text: "#355563" };
      }
      if (/balcony|terrace|open/.test(lower)) {
        return { fill: "rgba(246, 240, 220, 0.96)", stroke: "rgba(161, 118, 43, 0.78)", text: "#70521f" };
      }
      if (/utility|storage|service|pump|lobby|foyer|entry|study|office/.test(lower)) {
        return { fill: "rgba(241, 238, 232, 0.98)", stroke: "rgba(118, 103, 93, 0.75)", text: "#4d4238" };
      }
      return { fill: "rgba(248, 244, 236, 0.98)", stroke: "rgba(90, 75, 60, 0.72)", text: "#31261b" };
    }
    if (/parking|garage/.test(lower)) {
      return { fill: "rgba(148, 163, 184, 0.07)", stroke: "rgba(191, 219, 254, 0.78)", text: "#e5e7eb" };
    }
    if (/living|lounge|family/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.05)", stroke: "rgba(255, 255, 255, 0.72)", text: "#ffffff" };
    }
    if (/kitchen|dining/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.04)", stroke: "rgba(167, 243, 208, 0.72)", text: "#d1fae5" };
    }
    if (/bedroom|suite/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.045)", stroke: "rgba(216, 180, 254, 0.78)", text: "#f5d0fe" };
    }
    if (/bath|powder|wash/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.03)", stroke: "rgba(125, 211, 252, 0.75)", text: "#cffafe" };
    }
    if (/balcony|terrace|open/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.025)", stroke: "rgba(251, 191, 36, 0.62)", text: "#fef3c7" };
    }
    if (/utility|storage|service|pump|lobby|foyer|entry|study|office/.test(lower)) {
      return { fill: "rgba(255, 255, 255, 0.025)", stroke: "rgba(148, 163, 184, 0.7)", text: "#e2e8f0" };
    }
    return { fill: "rgba(255, 255, 255, 0.03)", stroke: "rgba(255, 255, 255, 0.55)", text: "#f8fafc" };
  };

  const sheetWidth = 760;
  const sheetHeight = embedded ? 212 : 228;
  const contentTop = 14;
  const contentBottom = sheetHeight - 44;
  const footerTop = sheetHeight - 32;
  const gridSpacing = 24;
  const gridXs = Array.from({ length: Math.floor((sheetWidth - contentTop * 2) / gridSpacing) + 1 }, (_, index) => contentTop + index * gridSpacing);
  const gridYs = Array.from({ length: Math.floor((contentBottom - contentTop) / gridSpacing) + 1 }, (_, index) => contentTop + index * gridSpacing);
  const selectedRoomLabel = selectedRoom ? floors[selectedRoom.floorIndex]?.spaces[selectedRoom.roomIndex] || "selected room" : "All rooms";
  const footerSelectionLabel = selectedRoomLabel.length > 22 ? `${selectedRoomLabel.slice(0, 21)}…` : selectedRoomLabel;

  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-[26px] border border-purple-400/15 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),rgba(6,8,12,0.98)_56%)] ${embedded ? "min-h-[290px]" : "min-h-[390px]"}`}>
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.09) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      {(() => {
        const activeToolLabel = activeTool.charAt(0).toUpperCase() + activeTool.slice(1);

        return (
          <>

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">DWG / floor plan</p>
          <h4 className="mt-1 text-sm font-semibold text-white">Top-down plan drawing</h4>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-300">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-purple-100">{visibleFloors.length} floor sheets</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{hasLift ? "Lift core" : "Stair core"}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{hasBasement ? "Basement included" : "No basement"}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{plotSpecified ? `${plotWidth} × ${plotDepth} ft plot` : "Open footprint"}</span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-purple-100">{activeToolLabel}</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-2 pb-2 pt-2">
        <div className="space-y-3">
          {visibleFloors.map((floor, floorIndex) => {
            const spaces = floor.spaces.length > 0 ? floor.spaces : ["open space"];
            const aboveGroundIndex = visibleFloors.slice(0, floorIndex + 1).filter((entry) => !isBasementLevel(entry.level)).length - 1;
            const planLeft = isVillaLike ? 110 : 126;
            const planTop = isVillaLike ? 46 : 54;
            const planWidth = isVillaLike ? 480 : 430;
            const planHeight = isVillaLike ? 130 : 108;
            const placements = buildRoomPlacements(floor, aboveGroundIndex, planLeft, planTop, planWidth, planHeight, isVillaLike);
            const coreLabel = floor.core && floor.core.length > 0 ? floor.core.join(" • ") : "stair core";
            const northFacing = spec?.site?.roadFacing || spec?.facade?.mainEntranceFacing || "north";

            return (
              <section key={floor.level} className={`overflow-hidden rounded-[22px] border bg-[#0d1017] shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${floorIndex === activeFloorIndex ? "border-purple-300/40 ring-1 ring-purple-400/20" : "border-white/10"}`}>
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">{getFloorBadge(floor.level, floorIndex)} sheet</p>
                    <h5 className="mt-1 text-sm font-semibold text-white">{floor.level}</h5>
                  </div>
                  <div className="flex max-w-[60%] flex-wrap items-center justify-end gap-2">
                    <div className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100/90">
                      {coreLabel}
                    </div>
                    {floorIndex === activeFloorIndex && (
                      <div className="rounded-full border border-purple-300/30 bg-purple-400/15 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-50">
                        Active floor
                      </div>
                    )}
                  </div>
                </div>

                <svg className={`block w-full ${embedded ? "h-[212px]" : "h-[228px]"}`} viewBox={`0 0 ${sheetWidth} ${sheetHeight}`} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id={`dwgSky-${floorIndex}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={planTheme.skyStart} />
                      <stop offset="100%" stopColor={planTheme.skyEnd} />
                    </linearGradient>
                    <filter id={`dwgShadow-${floorIndex}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000000" floodOpacity={isVillaLike ? 0.24 : 0.42} />
                    </filter>
                  </defs>

                  <rect width={sheetWidth} height={sheetHeight} fill={`url(#dwgSky-${floorIndex})`} />
                  <rect x="14" y="14" width="732" height={contentBottom - contentTop} rx="18" fill={planTheme.outerFill} stroke={planTheme.outerStroke} />

                  {showGuideGrid && (
                    <g opacity="0.7" pointerEvents="none">
                      {gridYs.map((y, gridIndex) => (
                        <line
                          key={`grid-y-${floorIndex}-${gridIndex}`}
                          x1="16"
                          y1={y}
                          x2="744"
                          y2={y}
                          stroke={gridIndex % 4 === 0 ? planTheme.gridStrong : planTheme.gridWeak}
                          strokeWidth={gridIndex % 4 === 0 ? 0.7 : 0.45}
                        />
                      ))}
                      {gridXs.map((x, gridIndex) => (
                        <line
                          key={`grid-x-${floorIndex}-${gridIndex}`}
                          x1={x}
                          y1="16"
                          x2={x}
                          y2={contentBottom}
                          stroke={gridIndex % 4 === 0 ? planTheme.gridStrong : planTheme.gridWeak}
                          strokeWidth={gridIndex % 4 === 0 ? 0.7 : 0.45}
                        />
                      ))}
                    </g>
                  )}

                  <rect x="16" y="16" width="728" height={contentBottom - 16} rx="16" fill="none" stroke={planTheme.innerStroke} strokeWidth="0.8" />

                  <text x="34" y="40" fill={planTheme.headerText} fontSize="11" fontWeight="700">
                    {floor.level}
                  </text>
                  <text x="34" y="58" fill={planTheme.subText} fontSize="9">
                    {spaces.length} rooms • {northFacing} facing • {plotSpecified ? `${plotWidth} × ${plotDepth} ft plot` : "open plot"}
                  </text>

                  <rect x={planLeft - 14} y={planTop - 12} width={planWidth + 28} height={planHeight + 24} rx={isVillaLike ? 8 : 16} fill={planTheme.outerFill} stroke={planTheme.outerStroke} strokeDasharray="6 8" filter={`url(#dwgShadow-${floorIndex})`} />
                  <rect
                    x={planLeft}
                    y={planTop}
                    width={planWidth}
                    height={planHeight}
                    rx={isVillaLike ? 0 : 6}
                    fill={planTheme.planFill}
                    stroke={planTheme.planStroke}
                    strokeWidth="1.2"
                    strokeLinejoin="miter"
                    className={onBlankClick ? "cursor-crosshair" : undefined}
                    onClick={() => onBlankClick?.(floorIndex)}
                  />
                  <rect x={planLeft + 8} y={planTop + 8} width={planWidth - 16} height={planHeight - 16} rx={isVillaLike ? 0 : 4} fill="none" stroke={planTheme.innerStroke} strokeDasharray={isVillaLike ? "4 6" : "5 7"} />

                  {placements.map((placement) => {
                    const tone = getRoomTone(placement.space);
                    const label = placement.space.length > 19 ? `${placement.space.slice(0, 18)}…` : placement.space;
                    const fontSize = placement.width < 110 || placement.space.length > 20 ? 7.8 : 9;
                    const isSelected = selectedRoom?.floorIndex === floorIndex && selectedRoom.roomIndex === placement.roomIndex;
                    const relatedMarks = cadMarks.filter((mark) => mark.floorIndex === floorIndex && mark.roomIndex === placement.roomIndex);
                    const category = placement.category;

                    return (
                      <g
                        key={`${floor.level}-${placement.space}-${placement.roomIndex}`}
                        className={onRoomClick ? "cursor-pointer" : undefined}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRoomClick?.(floorIndex, placement.roomIndex);
                        }}
                      >
                        <rect x={placement.x} y={placement.y} width={placement.width} height={placement.height} rx={0} fill={tone.fill} stroke={isSelected ? (isVillaLike ? "rgba(124, 81, 41, 0.92)" : "rgba(196,181,253,0.95)") : tone.stroke} strokeWidth={isSelected ? 1.8 : 1.15} strokeLinejoin="miter" />
                        <rect x={placement.x + 2.5} y={placement.y + 2.5} width={placement.width - 5} height={placement.height - 5} rx={0} fill="none" stroke={isSelected ? (isVillaLike ? "rgba(124, 81, 41, 0.72)" : "rgba(232,121,249,0.9)") : tone.stroke} strokeWidth="0.9" />
                        {isSelected && (
                          <rect x={placement.x - 1.5} y={placement.y - 1.5} width={placement.width + 3} height={placement.height + 3} rx={0} fill="none" stroke={isVillaLike ? "rgba(130, 92, 51, 0.34)" : "rgba(196,181,253,0.45)"} strokeWidth="1.2" strokeDasharray="5 5" />
                        )}
                        <line x1={placement.x + placement.width / 2 - 10} y1={placement.y + placement.height} x2={placement.x + placement.width / 2 + 10} y2={placement.y + placement.height} stroke={isVillaLike ? "rgba(82, 66, 52, 0.86)" : "rgba(6,8,12,0.98)"} strokeWidth="3" />
                        <line x1={placement.x + placement.width / 2} y1={placement.y + placement.height} x2={placement.x + placement.width / 2} y2={placement.y + placement.height - 8} stroke={tone.stroke} strokeWidth="1.1" />
                        <text x={placement.x + 8} y={placement.y + 16} textAnchor="start" fill={tone.text} fontSize={fontSize} fontWeight="700" letterSpacing="0.02em">
                          {label}
                        </text>
                        <text x={placement.x + 8} y={placement.y + placement.height - 8} textAnchor="start" fill={isVillaLike ? planTheme.subText : "rgba(226,232,240,0.65)"} fontSize="6.5" fontWeight="700" letterSpacing="0.08em">
                          {category}
                        </text>
                        {relatedMarks.slice(0, 2).map((mark, markIndex) => (
                          <g key={mark.id}>
                            <rect x={placement.x + 6 + markIndex * 40} y={placement.y + 6} width="34" height="12" rx="6" fill={isVillaLike ? "rgba(255, 250, 242, 0.88)" : "rgba(6,8,12,0.74)"} stroke={isVillaLike ? "rgba(82, 66, 52, 0.24)" : "rgba(196,181,253,0.35)"} />
                            <text x={placement.x + 23 + markIndex * 40} y={placement.y + 15} textAnchor="middle" fill={isVillaLike ? planTheme.footerText : "#f5d0fe"} fontSize="6.5" fontWeight="700">
                              {mark.tool.slice(0, 5)}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })}

                  <rect x={planLeft + planWidth + 20} y={planTop} width="88" height={planHeight} rx="12" fill={planTheme.coreFill} stroke={planTheme.coreStroke} />
                  <text x={planLeft + planWidth + 64} y={planTop + 22} textAnchor="middle" fill={planTheme.coreText} fontSize="10" fontWeight="800">
                    CORE
                  </text>
                  <text x={planLeft + planWidth + 64} y={planTop + 40} textAnchor="middle" fill={planTheme.coreText} fontSize="8">
                    {coreLabel}
                  </text>
                  <text x={planLeft + planWidth + 64} y={planTop + 58} textAnchor="middle" fill={isVillaLike ? planTheme.subText : "#c4b5fd"} fontSize="8">
                    lift / stair
                  </text>
                  <text x={planLeft + planWidth + 64} y={planTop + 80} textAnchor="middle" fill={isVillaLike ? planTheme.subText : "#d8b4fe"} fontSize="8">
                    {hasLift ? "vertical core" : "stair only"}
                  </text>

                  <g transform={`translate(${sheetWidth - 90}, ${contentTop + 18})`}>
                    <line x1="18" y1="30" x2="18" y2="8" stroke={isVillaLike ? planTheme.footerText : "#f5d0fe"} strokeWidth="1.4" />
                    <polygon points="18,2 11,12 25,12" fill={isVillaLike ? planTheme.footerText : "#f5d0fe"} />
                    <text x="18" y="44" textAnchor="middle" fill={isVillaLike ? planTheme.subText : "#c4b5fd"} fontSize="9" fontWeight="800" letterSpacing="0.16em">
                      N
                    </text>
                  </g>

                  {showMeasurementOverlay && (
                    <g>
                      <line x1={planLeft} y1={planTop - 20} x2={planLeft + planWidth} y2={planTop - 20} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" strokeDasharray="6 6" />
                      <line x1={planLeft} y1={planTop - 26} x2={planLeft} y2={planTop - 14} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" />
                      <line x1={planLeft + planWidth} y1={planTop - 26} x2={planLeft + planWidth} y2={planTop - 14} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" />
                      <text x={planLeft + planWidth / 2} y={planTop - 28} textAnchor="middle" fill="#f5d0fe" fontSize="9" fontWeight="700">
                        {plotSpecified ? `${plotWidth} ft width` : `${spaces.length} rooms across`}
                      </text>

                      <line x1={planLeft - 20} y1={planTop} x2={planLeft - 20} y2={planTop + planHeight} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" strokeDasharray="6 6" />
                      <line x1={planLeft - 26} y1={planTop} x2={planLeft - 14} y2={planTop} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" />
                      <line x1={planLeft - 26} y1={planTop + planHeight} x2={planLeft - 14} y2={planTop + planHeight} stroke="rgba(196,181,253,0.55)" strokeWidth="1.2" />
                      <text x={planLeft - 32} y={planTop + planHeight / 2} textAnchor="middle" fill="#e9d5ff" fontSize="9" fontWeight="700" transform={`rotate(-90 ${planLeft - 32} ${planTop + planHeight / 2})`}>
                        {plotSpecified ? `${plotDepth} ft depth` : `${spaces.length} rooms deep`}
                      </text>
                    </g>
                  )}

                  <rect x="18" y={footerTop} width="724" height="24" rx="10" fill={planTheme.footerFill} stroke={planTheme.footerStroke} />
                  <text x="32" y={footerTop + 15} fill={planTheme.footerText} fontSize="10" fontWeight="700" letterSpacing="0.08em">
                    ORTHOGRAPHIC FLOOR PLAN
                  </text>
                  <text x="244" y={footerTop + 15} fill={planTheme.footerText} fontSize="9" fontWeight="700" letterSpacing="0.06em">
                    SCALE 1:100
                  </text>
                  <text x="340" y={footerTop + 15} fill={planTheme.subText} fontSize="9" letterSpacing="0.04em">
                    {floor.spaces.length} ROOMS • {(floor.core?.length || 0) || 1} CORE ELEMENTS
                  </text>
                  <text x="552" y={footerTop + 15} fill={planTheme.footerText} fontSize="9" letterSpacing="0.04em">
                    {footerSelectionLabel}
                  </text>
                  <text x="32" y={footerTop + 28} fill={planTheme.subText} fontSize="8">
                    CUT AT 4&apos;-0&quot; | NORTH UP | Preview only, not a native DWG file.
                  </text>
                  {floorIndex === 0 && (
                    <text x="552" y={footerTop + 28} fill={isVillaLike ? planTheme.footerText : "#d8b4fe"} fontSize="8" fontWeight="700">
                      Road facing: {northFacing}
                    </text>
                  )}

                  <g transform={`translate(${sheetWidth - 176}, ${footerTop + 8})`}>
                    <rect x="0" y="4" width="18" height="4" fill={isVillaLike ? planTheme.footerText : "#c4b5fd"} opacity="0.88" />
                    <rect x="18" y="4" width="18" height="4" fill={isVillaLike ? "rgba(82, 66, 52, 0.75)" : "rgba(196,181,253,0.55)"} />
                    <rect x="36" y="4" width="18" height="4" fill={isVillaLike ? planTheme.footerText : "#c4b5fd"} opacity="0.88" />
                    <rect x="54" y="4" width="18" height="4" fill={isVillaLike ? "rgba(82, 66, 52, 0.75)" : "rgba(196,181,253,0.55)"} />
                    <text x="0" y="18" fill={planTheme.subText} fontSize="7" letterSpacing="0.1em">0</text>
                    <text x="18" y="18" fill={planTheme.subText} fontSize="7" letterSpacing="0.1em">5</text>
                    <text x="36" y="18" fill={planTheme.subText} fontSize="7" letterSpacing="0.1em">10</text>
                    <text x="54" y="18" fill={planTheme.subText} fontSize="7" letterSpacing="0.1em">15 FT</text>
                  </g>
                </svg>
              </section>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/8 bg-black/20 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-purple-100">Floor plan</span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-purple-100">Wall linework</span>
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-purple-100">Dimensions</span>
        </div>
      </div>
          </>
        );
      })()}
    </div>
  );
}

function PlannerResultPanel({
  result,
  embedded = false,
  onOpenProfessionals,
}: {
  result: PlannerResult;
  embedded?: boolean;
  onOpenProfessionals?: (context: ProfessionalsDrawerContext) => void;
}) {
  const spec = result.spec;
  const lawReview = result.lawReview;
  const lawReviewError = result.lawReviewError;
  const floors = useMemo(() => getStructureFloors(spec), [spec]);
  const requestText = String(spec?.request || "");
  const plotWidth = spec?.site?.plotWidthFt;
  const plotDepth = spec?.site?.plotDepthFt;
  const plotSpecified = typeof plotWidth === "number" && plotWidth > 0 && typeof plotDepth === "number" && plotDepth > 0;
  const professionalGuidance = buildProfessionalGuidance(spec, lawReview, lawReviewError);
  const [activeView, setActiveView] = useState<"3d" | "dwg" | "cad">(() => (embedded ? "dwg" : "3d"));
  const [cadFloorIndex, setCadFloorIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<CadTool>("select");
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [editableFloors, setEditableFloors] = useState<FloorPlan[]>(() => cloneFloors(floors));
  const [selectedRoom, setSelectedRoom] = useState<CadSelection>(null);
  const [cadMarks, setCadMarks] = useState<CadAnnotation[]>([]);
  const [cadStatus, setCadStatus] = useState("Select a room to edit");
  const [manualFloorDraft, setManualFloorDraft] = useState("");
  const [manualRoomDraft, setManualRoomDraft] = useState("room");

  const activeFloors = editableFloors.length > 0 ? editableFloors : floors;
  const hasLift = hasLiftCore(activeFloors, requestText);
  const hasBasement = hasBasementFloor(activeFloors, requestText);
  const dslSource = buildHouseDsl({ ...spec, floors: activeFloors }, activeFloors);
  const houseSummary = formatHouseSummary(spec, lawReview, lawReviewError);

  useEffect(() => {
    setEditableFloors(cloneFloors(floors));
    setSelectedRoom(null);
    setCadMarks([]);
    setActiveFloorIndex(0);
    setCadStatus("Loaded editable floor plan");
  }, [floors]);

  useEffect(() => {
    const floor = activeFloors[activeFloorIndex] || activeFloors[0] || null;
    setManualFloorDraft(floor?.level || "");
  }, [activeFloorIndex, activeFloors]);

  useEffect(() => {
    const selectedLabel = selectedRoom ? activeFloors[selectedRoom.floorIndex]?.spaces[selectedRoom.roomIndex] || "" : "";
    setManualRoomDraft(selectedLabel || "room");
  }, [selectedRoom, activeFloors]);

  useEffect(() => {
    setActiveFloorIndex((current) => {
      if (activeFloors.length === 0) {
        return 0;
      }

      return Math.min(current, activeFloors.length - 1);
    });
  }, [activeFloors.length]);

  const isDrawCommand = (tool: string) => CAD_TOOL_GROUPS[0].tools.includes(tool);
  const isAnnotationCommand = CAD_TOOL_GROUPS[2].tools.includes(activeTool);
  const isModifyCommand = CAD_TOOL_GROUPS[1].tools.includes(activeTool);
  const isLayerCommand = CAD_TOOL_GROUPS[3].tools.includes(activeTool);

  const getSelectedFloorRoom = () => {
    if (!selectedRoom) {
      return null;
    }

    const floor = activeFloors[selectedRoom.floorIndex];
    const roomLabel = floor?.spaces[selectedRoom.roomIndex] || null;
    return roomLabel ? { floorIndex: selectedRoom.floorIndex, roomIndex: selectedRoom.roomIndex, floor, roomLabel } : null;
  };

  const updateFloorAt = (floorIndex: number, updater: (floor: FloorPlan) => FloorPlan) => {
    setEditableFloors((current) => current.map((floor, index) => (index === floorIndex ? updater(cloneFloors([floor])[0]) : floor)));
  };

  const updateSelectedRoom = (nextSelection: CadSelection) => {
    setSelectedRoom(nextSelection);
    if (nextSelection) {
      setActiveFloorIndex(nextSelection.floorIndex);
    }
  };

  const renameFloor = (floorIndex: number, nextLevel: string) => {
    const trimmedLevel = nextLevel.trim();
    if (!trimmedLevel) {
      return;
    }

    updateFloorAt(floorIndex, (floor) => ({
      ...floor,
      level: trimmedLevel,
    }));
    setCadStatus(`Renamed floor to ${trimmedLevel}`);
  };

  const commitSelectedRoomLabel = () => {
    const selectedFloorRoom = getSelectedFloorRoom();
    const nextLabel = manualRoomDraft.trim();
    if (!selectedFloorRoom || !nextLabel) {
      return;
    }

    updateFloorAt(selectedRoom!.floorIndex, (floor) => {
      const spaces = [...floor.spaces];
      spaces[selectedRoom!.roomIndex] = nextLabel;
      return { ...floor, spaces };
    });
    setCadStatus(`Renamed room to ${nextLabel}`);
  };

  const addManualRoom = () => {
    const nextLabel = manualRoomDraft.trim();
    if (!nextLabel) {
      return;
    }

    addRoomToFloor(activeFloorIndex, nextLabel);
  };

  const addFloorCopy = () => {
    const floor = activeFloors[activeFloorIndex] || activeFloors[0] || null;
    if (!floor) {
      return;
    }

    const copiedFloor: FloorPlan = {
      ...floor,
      level: `${floor.level} copy`,
      spaces: [...floor.spaces],
      core: floor.core ? [...floor.core] : undefined,
    };

    setEditableFloors((current) => [...current, copiedFloor]);
    setActiveFloorIndex(activeFloors.length);
    setSelectedRoom(null);
    setCadStatus(`Added ${copiedFloor.level}`);
  };

  const removeActiveFloor = () => {
    if (activeFloors.length <= 1) {
      setCadStatus("Need at least one floor");
      return;
    }

    const removedFloor = activeFloors[activeFloorIndex] || activeFloors[0] || null;
    const nextIndex = Math.max(0, Math.min(activeFloorIndex, activeFloors.length - 2));

    setEditableFloors((current) => current.filter((_, index) => index !== activeFloorIndex));
    setSelectedRoom(null);
    setActiveFloorIndex(nextIndex);
    setCadStatus(`Removed ${removedFloor?.level || "floor"}`);
  };

  const addRoomToFloor = (floorIndex: number, label: string) => {
    updateFloorAt(floorIndex, (floor) => ({
      ...floor,
      spaces: [...floor.spaces, `${label} ${floor.spaces.length + 1}`],
    }));
    setCadStatus(`Added ${label} to ${activeFloors[floorIndex]?.level || "floor"}`);
  };

  const duplicateSelectedRoom = (floorIndex: number, roomIndex: number) => {
    const floor = activeFloors[floorIndex];
    const roomLabel = floor?.spaces[roomIndex];
    if (!floor || !roomLabel) {
      return;
    }

    updateFloorAt(floorIndex, (nextFloor) => {
      const spaces = [...nextFloor.spaces];
      spaces.splice(roomIndex + 1, 0, `${roomLabel} copy`);
      return { ...nextFloor, spaces };
    });
    setCadStatus(`Duplicated ${roomLabel}`);
  };

  const moveSelectedRoomToEnd = (floorIndex: number, roomIndex: number) => {
    updateFloorAt(floorIndex, (floor) => {
      if (roomIndex < 0 || roomIndex >= floor.spaces.length) {
        return floor;
      }
      const spaces = [...floor.spaces];
      const [roomLabel] = spaces.splice(roomIndex, 1);
      spaces.push(roomLabel);
      return { ...floor, spaces };
    });
    setCadStatus("Moved room to the end of the floor plan");
  };

  const rotateSelectedFloor = (floorIndex: number) => {
    updateFloorAt(floorIndex, (floor) => ({
      ...floor,
      spaces: [...floor.spaces.slice(1), floor.spaces[0]].filter(Boolean),
    }));
    setCadStatus("Rotated room order on the floor");
  };

  const reverseSelectedFloor = (floorIndex: number) => {
    updateFloorAt(floorIndex, (floor) => ({
      ...floor,
      spaces: [...floor.spaces].reverse(),
    }));
    setCadStatus("Mirrored room order on the floor");
  };

  const removeSelectedRoom = (floorIndex: number, roomIndex: number) => {
    updateFloorAt(floorIndex, (floor) => {
      if (floor.spaces.length <= 1) {
        return floor;
      }

      const spaces = [...floor.spaces];
      spaces.splice(roomIndex, 1);
      return { ...floor, spaces };
    });
    setSelectedRoom(null);
    setCadStatus("Removed selected room");
  };

  const renameSelectedRoom = (floorIndex: number, roomIndex: number) => {
    const floor = activeFloors[floorIndex];
    const roomLabel = floor?.spaces[roomIndex];
    if (!floor || !roomLabel || typeof window === "undefined") {
      return;
    }

    const nextLabel = window.prompt("Room label", roomLabel)?.trim();
    if (!nextLabel) {
      return;
    }

    updateFloorAt(floorIndex, (nextFloor) => {
      const spaces = [...nextFloor.spaces];
      spaces[roomIndex] = nextLabel;
      return { ...nextFloor, spaces };
    });
    setCadStatus(`Renamed room to ${nextLabel}`);
  };

  const addCadAnnotation = (floorIndex: number, roomIndex: number, tool: string, roomLabel: string) => {
    setCadMarks((current) => [
      ...current,
      {
        id: `${tool}-${floorIndex}-${roomIndex}-${Date.now()}`,
        floorIndex,
        roomIndex,
        tool,
        label: `${tool.toUpperCase()} ${roomLabel}`,
      },
    ]);
    setCadStatus(`${tool.toUpperCase()} added to ${roomLabel}`);
  };

  const handleFloorRoomClick = (floorIndex: number, roomIndex: number) => {
    const floor = activeFloors[floorIndex];
    const roomLabel = floor?.spaces[roomIndex];
    if (!floor || !roomLabel) {
      return;
    }

    updateSelectedRoom({ floorIndex, roomIndex });

    if (activeTool === "select") {
      setCadStatus(`Selected ${roomLabel}`);
      return;
    }

    if (activeTool === "erase") {
      removeSelectedRoom(floorIndex, roomIndex);
      return;
    }

    if (activeTool === "copy") {
      duplicateSelectedRoom(floorIndex, roomIndex);
      return;
    }

    if (activeTool === "move") {
      moveSelectedRoomToEnd(floorIndex, roomIndex);
      return;
    }

    if (activeTool === "rotate") {
      rotateSelectedFloor(floorIndex);
      return;
    }

    if (activeTool === "mirror") {
      reverseSelectedFloor(floorIndex);
      return;
    }

    if (activeTool === "text" || activeTool === "mtext" || activeTool === "annotate") {
      renameSelectedRoom(floorIndex, roomIndex);
      return;
    }

    if (isAnnotationCommand) {
      addCadAnnotation(floorIndex, roomIndex, activeTool, roomLabel);
      return;
    }

    if (isDrawCommand(activeTool)) {
      addRoomToFloor(floorIndex, activeTool);
      return;
    }

    if (isLayerCommand) {
      setActiveFloorIndex(floorIndex);
      setCadStatus(`Focused ${floor.level}`);
      return;
    }

    if (isModifyCommand) {
      setCadStatus(`${activeTool.toUpperCase()} ready for ${roomLabel}`);
    }
  };

  const handleBlankPlanClick = (floorIndex: number) => {
    const floor = activeFloors[floorIndex];
    if (!floor) {
      return;
    }

    if (activeTool === "room" || activeTool === "rectangle" || activeTool === "polygon" || activeTool === "pline" || activeTool === "line") {
      addRoomToFloor(floorIndex, activeTool);
      return;
    }

    if (activeTool === "text" || activeTool === "mtext") {
      addCadAnnotation(floorIndex, 0, activeTool, floor.level);
      return;
    }

    setCadStatus(`Focused ${floor.level}`);
    setActiveFloorIndex(floorIndex);
  };

  const activeFloor = activeFloors[activeFloorIndex] || activeFloors[0] || null;
  const activeFloorLabel = activeFloor?.level || "No floor selected";
  const selectedRoomSummary = getSelectedFloorRoom();
  const summaryTags = [
    plotSpecified ? `${plotWidth} × ${plotDepth} ft plot` : "Plot not specified",
    `${spec?.building?.totalStoreys ?? "?"} levels`,
    spec?.building?.style || "contemporary",
    hasLift ? "lift core" : "stair core",
    hasBasement ? "basement" : "no basement",
    activeView === "dwg" ? "DWG view" : "3D view",
    activeFloorLabel,
    `${activeTool} tool`,
    selectedRoomSummary ? `${selectedRoomSummary.floor.level}: ${selectedRoomSummary.roomLabel}` : "no selection",
    cadStatus,
  ];
  const sourceLabel = spec?.source === "local" ? "Local DSL model" : "Backend DSL model";
  const viewportTitle = activeView === "dwg" ? "DWG-style 2D plan" : activeView === "cad" ? "Fusion CAD workspace" : "DSL-driven 3D model";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`${embedded ? "" : "mx-4 mb-4"} overflow-hidden rounded-[30px] border border-purple-500/20 bg-[linear-gradient(180deg,rgba(18,20,27,0.96),rgba(9,11,15,0.98))] text-gray-100 shadow-[0_22px_80px_rgba(0,0,0,0.42)]`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-purple-200/70">Model workspace</p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {activeView === "dwg" ? "DWG-style floor map" : "DSL-driven 3D model"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs text-purple-100">
            {spec?.status || "unknown"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            {sourceLabel}
          </span>
        </div>
      </div>

      {spec?.source === "local" && (
        <div className="border-b border-purple-400/10 bg-purple-400/5 px-5 py-3 text-xs leading-5 text-purple-100/80">
          {activeView === "dwg"
            ? "The popup now renders an orthographic floor sheet with CAD-style selection, grid lines, and live edits."
            : "The popup now converts DSL into a real 3D model instead of only a flat spec sheet."}
        </div>
      )}

      <div className="px-5 pt-5">
        <div className="rounded-[22px] border border-purple-400/20 bg-[#0f1320] p-4 text-xs leading-5 text-gray-200 shadow-[0_0_0_1px_rgba(168,85,247,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-purple-200/70">Manual changes</p>
              <p className="mt-1 text-sm font-semibold text-white">Edit the generated building</p>
            </div>
            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100/80">Live edit</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-gray-400">
            Use these controls to rename floors, add rooms, duplicate selections, or remove parts of the generated plan. Changes update the DSL and 3D preview immediately.
          </p>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-3 rounded-[18px] border border-white/8 bg-black/20 p-3">
              <label className="block text-[10px] uppercase tracking-[0.22em] text-gray-400">Floor name</label>
              <input
                value={manualFloorDraft}
                onChange={(event) => setManualFloorDraft(event.target.value)}
                placeholder="Ground floor"
                className="w-full rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 focus:border-purple-300/50 focus:ring-2 focus:ring-purple-400/20"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => renameFloor(activeFloorIndex, manualFloorDraft)}
                  className="rounded-full border border-purple-400/25 bg-purple-400/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-purple-100 transition hover:bg-purple-400/20"
                >
                  Rename floor
                </button>
                <button
                  type="button"
                  onClick={addFloorCopy}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gray-200 transition hover:bg-white/10"
                >
                  Duplicate floor
                </button>
                <button
                  type="button"
                  onClick={removeActiveFloor}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={activeFloors.length <= 1}
                >
                  Remove floor
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-[18px] border border-white/8 bg-black/20 p-3">
              <label className="block text-[10px] uppercase tracking-[0.22em] text-gray-400">Room name</label>
              <input
                value={manualRoomDraft}
                onChange={(event) => setManualRoomDraft(event.target.value)}
                placeholder="living room"
                className="w-full rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 focus:border-purple-300/50 focus:ring-2 focus:ring-purple-400/20"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "living room",
                  "bedroom",
                  "kitchen",
                  "dining",
                  "bathroom",
                  "study",
                  "utility",
                  "balcony",
                ].map((roomType) => (
                  <button
                    key={roomType}
                    type="button"
                    onClick={() => setManualRoomDraft(roomType)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-200 transition hover:bg-white/10"
                  >
                    {roomType}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addManualRoom}
                  className="rounded-full border border-purple-400/25 bg-purple-400/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-purple-100 transition hover:bg-purple-400/20"
                >
                  Add room
                </button>
                <button
                  type="button"
                  onClick={commitSelectedRoomLabel}
                  disabled={!selectedRoomSummary}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Rename selected room
                </button>
                <button
                  type="button"
                  onClick={() => selectedRoomSummary && duplicateSelectedRoom(selectedRoomSummary.floorIndex, selectedRoomSummary.roomIndex)}
                  disabled={!selectedRoomSummary}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duplicate selected
                </button>
                <button
                  type="button"
                  onClick={() => selectedRoomSummary && removeSelectedRoom(selectedRoomSummary.floorIndex, selectedRoomSummary.roomIndex)}
                  disabled={!selectedRoomSummary}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove selected
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid gap-4 p-5 xl:grid-cols-[170px_minmax(0,1fr)_260px] ${embedded ? "xl:gap-3" : ""}`}>
        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-[#0d1017] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">CAD tools</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                aria-pressed={activeTool === "select"}
                onClick={() => {
                  setActiveTool("select");
                  setCadStatus("Selection mode active");
                }}
                className={`w-full rounded-[14px] border px-3 py-2 text-left transition ${activeTool === "select" ? "border-purple-300/40 bg-purple-400/15 text-purple-50 shadow-[0_0_0_1px_rgba(196,181,253,0.16)]" : "border-white/10 bg-black/20 text-gray-300 hover:border-purple-400/20 hover:bg-white/5"}`}
              >
                <span className="block text-[10px] uppercase tracking-[0.22em]">select</span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.18em] text-gray-400">inspect and edit rooms</span>
              </button>

              {CAD_TOOL_GROUPS.map((group) => (
                <details key={group.title} open={group.title === "Draw" || group.title === "Modify"} className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2">
                  <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.24em] text-purple-200/80">
                    {group.title}
                  </summary>
                  <p className="mt-1 text-[10px] leading-5 text-gray-400">{group.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {group.tools.map((tool) => {
                      const isActive = activeTool === tool;

                      return (
                        <button
                          key={`${group.title}-${tool}`}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => {
                            setActiveTool(tool);
                            setCadStatus(`${tool.toUpperCase()} tool active`);
                          }}
                          className={`rounded-[14px] border px-3 py-2 text-left transition ${isActive ? "border-purple-300/40 bg-purple-400/15 text-purple-50 shadow-[0_0_0_1px_rgba(196,181,253,0.16)]" : "border-white/10 bg-black/20 text-gray-300 hover:border-purple-400/20 hover:bg-white/5"}`}
                        >
                          <span className="block text-[10px] uppercase tracking-[0.22em]">{tool}</span>
                        </button>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0d1017] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Layers</p>
            <div className="mt-3 space-y-2">
              {floors.map((floor, index) => {
                const isActive = activeFloorIndex === index;

                return (
                  <button
                    key={floor.level}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveFloorIndex(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[16px] border px-3 py-2 text-left text-xs transition ${isActive ? "border-purple-300/40 bg-purple-400/12 text-gray-100" : "border-white/8 bg-black/20 text-gray-300 hover:border-purple-400/20 hover:bg-white/5"}`}
                  >
                    <span className="truncate text-gray-200">{floor.level}</span>
                    <span className="flex items-center gap-2">
                      {isActive && (
                        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-purple-100">
                          Active
                        </span>
                      )}
                      <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-purple-100">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[#0d1017] px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Viewport</p>
              <h3 className="mt-1 text-sm font-semibold text-white">{viewportTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("3d")}
                className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition ${activeView === "3d" ? "border-purple-300/40 bg-purple-400/20 text-purple-50" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => setActiveView("dwg")}
                className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition ${activeView === "dwg" ? "border-purple-300/40 bg-purple-400/20 text-purple-50" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
              >
                DWG
              </button>
              <button
                type="button"
                onClick={() => setActiveView("cad")}
                className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition ${activeView === "cad" ? "border-purple-300/40 bg-purple-400/20 text-purple-50" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
              >
                CAD
              </button>
              <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-purple-100">
                {activeFloorLabel}
              </span>
            </div>
          </div>

          {activeView === "cad" ? (
            <div className="min-h-[500px]">
              <CadWorkspace
                archetype={spec?.houseConcept?.archetype || "house"}
                modifiers={spec?.houseConcept?.modifiers || []}
                plotWidthFt={plotWidth}
                plotDepthFt={plotDepth}
                floorIndex={cadFloorIndex}
                onFloorChange={setCadFloorIndex}
              />
            </div>
          ) : activeView === "dwg" ? (
            <HouseDwgViewport
              spec={spec}
              floors={floors}
              embedded={embedded}
              activeTool={activeTool}
              activeFloorIndex={activeFloorIndex}
              selectedRoom={selectedRoom}
              cadMarks={cadMarks}
              onRoomClick={handleFloorRoomClick}
              onBlankClick={handleBlankPlanClick}
              showDimensions={activeTool === "measure" || activeTool === "dimension"}
            />
          ) : (
            <HouseModelViewport dslSource={dslSource} semanticIR={result.semanticIR} embedded={embedded} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-[#0d1017] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Inspector</p>
            <div className="mt-3 space-y-3 text-sm text-gray-200">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Status</span>
                <span>{spec?.status || "unknown"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Style</span>
                <span>{spec?.building?.style || "unknown"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Entrance</span>
                <span>{spec?.site?.roadFacing || "unknown"}</span>
              </div>

              <div className="rounded-[18px] border border-purple-400/15 bg-purple-400/5 p-3 text-xs leading-5 text-purple-100/85">
                {spec?.source === "local"
                  ? "DSL generated locally in the popup and rendered as a 3D model."
                  : "Backend-generated DSL rendered inside the workspace."}
              </div>

              <div className="rounded-[18px] border border-white/8 bg-black/20 p-3 text-xs leading-5 text-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Selected room</span>
                  <span>{selectedRoomSummary ? selectedRoomSummary.roomLabel : "none"}</span>
                </div>
                {selectedRoomSummary && (
                  <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-purple-200/70">
                    {selectedRoomSummary.floor.level}
                  </div>
                )}
                {selectedRoomSummary && activeTool !== "select" && (
                  <button
                    type="button"
                    onClick={() => handleFloorRoomClick(selectedRoomSummary.floorIndex, selectedRoomSummary.roomIndex)}
                    className="mt-3 w-full rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-purple-100 transition hover:bg-purple-400/20"
                  >
                    Apply {activeTool} to selected room
                  </button>
                )}
              </div>

              <div className="rounded-[18px] border border-purple-400/15 bg-purple-400/5 p-3 text-xs leading-6 text-gray-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-purple-200/70">Professional support</span>
                    <p className="mt-1 text-sm font-semibold text-white">Find nearby lawyers & architects</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProfessionals?.({ requestSummary: requestText, guidanceNote: professionalGuidance.note })}
                    className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-purple-100 transition hover:bg-purple-400/20"
                  >
                    Open list
                  </button>
                </div>
                <p className="mt-2 text-gray-300">{professionalGuidance.note}</p>
              </div>

              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-[18px] border border-white/8 bg-black/20 p-3 text-xs leading-5 text-gray-300">
                {houseSummary}
              </pre>

              <details className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2 text-xs text-gray-300">
                <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.24em] text-purple-200/70">
                  DSL source
                </summary>
                <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap break-words leading-5 text-gray-300">
                  {dslSource}
                </pre>
              </details>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0d1017] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">Law review</p>
            <pre className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">
              {formatLawReviewSummary(lawReview, result.lawReviewError)}
            </pre>
          </div>
        </aside>
      </div>

      <div className="border-t border-white/8 bg-black/20 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {summaryTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-purple-100"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [generatorPreviewResult, setGeneratorPreviewResult] = useState<PlannerResult | null>(null);
  const [plannerResult, setPlannerResult] = useState<PlannerResult | null>(null);
  const [professionalsDrawerOpen, setProfessionalsDrawerOpen] = useState(false);
  const [professionalsDrawerContext, setProfessionalsDrawerContext] = useState<ProfessionalsDrawerContext | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const landingComposerRef = useRef<HTMLTextAreaElement>(null);
  const chatComposerRef = useRef<HTMLTextAreaElement>(null);
  const generatorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const popupResult = generatorOpen ? (plannerResult ?? generatorPreviewResult) : plannerResult;

  useLayoutEffect(() => {
    resizeTextarea(landingComposerRef.current, 52, 180);
  }, [input, started]);

  useLayoutEffect(() => {
    resizeTextarea(chatComposerRef.current, 52, 160);
  }, [input, started]);

  useLayoutEffect(() => {
    resizeTextarea(generatorTextareaRef.current, 56, 320);
  }, [generatorPrompt, generatorOpen]);

  const scrollByWheel = (element: HTMLElement, deltaY: number) => {
    if (element.scrollHeight <= element.clientHeight + 1) {
      return false;
    }

    const maxScrollTop = element.scrollHeight - element.clientHeight;
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, element.scrollTop + deltaY));
    if (nextScrollTop === element.scrollTop) {
      return false;
    }

    element.scrollTop = nextScrollTop;
    return true;
  };

  const handlePopupWheel = (event: React.WheelEvent<HTMLElement>) => {
    const target = event.currentTarget;
    if (scrollByWheel(target, event.deltaY)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleOverlayWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (scrollByWheel(event.currentTarget, event.deltaY)) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (!generatorOpen || typeof window === "undefined") {
      return;
    }

    const hasScrollableContent = (element: HTMLElement | null) => {
      return Boolean(element && element.scrollHeight > element.clientHeight + 1);
    };

    const canElementScroll = (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      return ["auto", "scroll", "overlay"].includes(style.overflowY);
    };

    const findScrollableAncestor = (startNode: EventTarget | null) => {
      let current = startNode instanceof HTMLElement ? startNode : null;
      while (current) {
        if (canElementScroll(current) && hasScrollableContent(current)) {
          return current;
        }

        current = current.parentElement;
      }

      return null;
    };

    const getActiveScrollTarget = (event: WheelEvent) => {
      const eventPath = typeof event.composedPath === "function" ? event.composedPath() : [];
      const pathElements = eventPath.filter((node): node is HTMLElement => node instanceof HTMLElement);

      const paneTarget = pathElements.find((element) =>
        (element.classList.contains("generator-controls-pane") ||
          element.classList.contains("generator-preview-pane") ||
          element.classList.contains("generator-dialog")) &&
        hasScrollableContent(element)
      );

      if (paneTarget) {
        return paneTarget;
      }

      const ancestorTarget = findScrollableAncestor(event.target);
      if (ancestorTarget) {
        return ancestorTarget;
      }

      const popupSelectors = [
        ".generator-controls-pane",
        ".generator-preview-pane",
        ".generator-dialog",
        ".fixed.inset-0.z-50.flex > :not(.absolute)",
        ".fixed.inset-0.z-50.flex.items-center.justify-center.px-4.py-6 > :not(:first-child)",
      ];

      for (const selector of popupSelectors) {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (hasScrollableContent(element)) {
          return element;
        }
      }

      const legacyDialog = document.querySelector(".fixed.inset-0.z-50.flex > :not(.absolute)") as HTMLElement | null;
      if (hasScrollableContent(legacyDialog)) {
        return legacyDialog;
      }

      return null;
    };

    const handleDocumentWheel = (event: WheelEvent) => {
      const target = getActiveScrollTarget(event);
      if (!target) {
        return;
      }

      if (scrollByWheel(target, event.deltaY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("wheel", handleDocumentWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleDocumentWheel);
    };
  }, [generatorOpen]);

  useEffect(() => {
    if (!generatorOpen || !generatorPrompt.trim() || plannerResult) {
      setGeneratorPreviewResult(null);
      return;
    }

    let cancelled = false;
    setGeneratorPreviewResult(null);

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        setGeneratorPreviewResult(buildLocalPlannerResult(generatorPrompt.trim(), "create", null));
      } catch {
        setGeneratorPreviewResult(null);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [generatorOpen, generatorPrompt, plannerResult]);

  const submitPrompt = async (prompt: string, intent: PromptIntent) => {
    console.log("[ArchGPT v3.2] submitPrompt initiated", { intent });
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return false;

    const userMessage: Message = { role: "user", content: trimmedPrompt };
    setMessages((current) => [...current, userMessage]);
    setStarted(true);
    setInput("");
    setIsSubmitting(true);

    const previousSpec = intent === "modify" ? plannerResult?.spec || null : null;
    let localFallback: PlannerResult | null = null;

    try {
      console.log("[ArchGPT] Building local fallback...");
      localFallback = buildLocalPlannerResult(trimmedPrompt, intent, previousSpec);
      
      console.log("[ArchGPT] Calling house-spec API...");
      const payload = await requestHousePlan(trimmedPrompt, intent, previousSpec);
      
      const spec = payload.spec || ({} as HouseSpec);
      const lawReview = payload.lawReview || null;
      const lawReviewError = payload.lawReviewError || "";
      const dsl = payload.dsl || buildHouseDsl(spec, getStructureFloors(spec));

      let semanticIR: ArchitecturalIR | undefined;
      if (intent === "create") {
        try {
          console.log("[ArchGPT] Generating Semantic IR...");
          const irResponse = await fetchWithTimeout("/api/generate-3d", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmedPrompt }),
            timeout: 25000,
          });
          if (irResponse.ok) {
            semanticIR = await irResponse.json();
            console.log("[ArchGPT] Semantic IR received.");
          }
        } catch (irError) {
          console.warn("[ArchGPT] Semantic IR failed, falling back to DSL", irError);
        }
      }

      const nextResult: PlannerResult = { spec, lawReview, lawReviewError, dsl, semanticIR };
      console.log("[ArchGPT] Updating results.");

      setPlannerResult(nextResult);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          content: buildBotReply(spec, lawReview, lawReviewError),
        },
      ]);

      return true;
    } catch (error) {
      console.error("[ArchGPT] submitPrompt error:", error);
      const nextResult: PlannerResult = localFallback || buildEmergencyPlannerResult(trimmedPrompt, error);

      setPlannerResult(nextResult);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          content: buildBotReply(nextResult.spec, nextResult.lawReview, nextResult.lawReviewError),
        },
      ]);
      return true;
    } finally {
      setIsSubmitting(false);
      console.log("[ArchGPT] submitPrompt completed.");
    }
  };

  const submitLawPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return false;

    const userMessage: Message = { role: "user", content: trimmedPrompt };
    setMessages((current) => [...current, userMessage]);
    setStarted(true);
    setInput("");
    setPlannerResult(null);
    setIsSubmitting(true);

    try {
      const answer = await requestLawChat(trimmedPrompt);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          content: answer,
        },
      ]);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          content: `Law chat unavailable: ${message}`,
        },
      ]);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGenerator = (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setGeneratorPrompt(trimmedPrompt);
    setPlannerResult(null);
    setStarted(true);
    setInput("");
    setGeneratorOpen(true);
  };

  const closeGenerator = () => {
    setGeneratorOpen(false);
  };

  const handleSend = (overridePrompt?: string) => {
    const submittedPrompt = (overridePrompt ?? input).trim();
    if (!submittedPrompt) return;

    const intent = classifyPromptIntent(submittedPrompt);
    if (shouldOpenGenerator(submittedPrompt, intent)) {
      openGenerator(submittedPrompt);
      return;
    }

    if (isLawPrompt(submittedPrompt)) {
      void submitLawPrompt(submittedPrompt);
      return;
    }

    void submitPrompt(submittedPrompt, intent);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleGeneratorConfirm = async () => {
    const submittedPrompt = generatorPrompt.trim();
    if (!submittedPrompt) return;

    await submitPrompt(submittedPrompt, "create");
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0]?.content.slice(0, 25) || "New Chat";
      setChatHistory((current) => [
        { id: Date.now(), title, messages, plannerResult },
        ...current,
      ]);
    }
    setMessages([]);
    setInput("");
    setStarted(false);
    setGeneratorOpen(false);
    setGeneratorPrompt("");
    setPlannerResult(null);
  };

  const openProfessionalsDrawer = (context: ProfessionalsDrawerContext) => {
    setProfessionalsDrawerContext(context);
    setProfessionalsDrawerOpen(true);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-widest">
        ENGINE v3.2 ACTIVE - CACHE PURGE TEST
      </div>
      <AnimatePresence mode="wait">
      {!started ? (
        // --- LANDING SCREEN ---
        <motion.main
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] text-gray-100"
        >
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-5xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            ArchGPT
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full max-w-2xl px-4"
          >
            <div className="flex gap-4 mb-6 justify-center">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold transition shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="w-5 h-5" />
                Start Guided Design
              </button>
            </div>
            <div className="relative">
              
              <textarea
                ref={landingComposerRef}
                rows={1}
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                className="w-full min-h-[52px] resize-none overflow-hidden rounded-[30px] border border-purple-400/60 bg-[#161616] px-6 py-3.5 pr-16 text-lg leading-7 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 placeholder-gray-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
              />
              <button
                onClick={() => handleSend()}
                className="absolute bottom-4 right-4 rounded-full bg-purple-500 p-3 transition duration-200 hover:bg-purple-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12h15m0 0l-6-6m6 6l-6 6"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              Create-style prompts like make me, generate, create, build, or design open a focused popup first. Press Enter to send and Shift+Enter for a new line.
            </p>
          </motion.div>
        </motion.main>
      ) : (
        // --- CHAT SCREEN ---
        <motion.main
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex h-screen bg-gradient-to-br from-[#0e0e0e] to-[#1a1a1a] text-gray-100"
        >
          {/* Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: -250, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -250, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-64 bg-[#111111] border-r border-gray-800 flex flex-col p-4"
              >
                <div className="flex-1 overflow-y-auto space-y-2">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center">
                      No previous chats
                    </p>
                  ) : (
                    chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        className="w-full text-left text-gray-300 hover:bg-gray-800 p-3 rounded-lg text-sm transition"
                        onClick={() => {
                          setMessages(chat.messages);
                          setPlannerResult(chat.plannerResult || null);
                          setStarted(true);
                          setGeneratorOpen(false);
                          setGeneratorPrompt("");
                        }}
                      >
                        {chat.title}
                      </button>
                    ))
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="py-4 px-6 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-800 transition"
                >
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  ArchGPT
                </h1>
              </div>

              <button
                onClick={handleNewChat}
                className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-500/40 hover:border-purple-400 rounded-full px-4 py-2 transition duration-200"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </header>

            {/* Chat Window */}
            <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {plannerResult && <PlannerResultPanel result={plannerResult} onOpenProfessionals={openProfessionalsDrawer} />}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white rounded-br-none whitespace-pre-wrap"
                        : "bg-gray-800 text-gray-100 rounded-bl-none whitespace-normal"
                    }`}
                  >
                    {msg.role === "bot" ? (
                      <div className="space-y-2 text-gray-100">
                        {renderChatMessageContent(msg.content)}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
            </section>

            {/* Input Bar */}
            <footer className="border-t border-gray-800 p-4">
              <div className="max-w-3xl mx-auto flex items-end space-x-3">
                <textarea
                  ref={chatComposerRef}
                  rows={1}
                  placeholder="Ask ArchGPT..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  className="flex-1 min-h-[52px] max-h-40 resize-none overflow-hidden rounded-[28px] border border-purple-500/30 bg-[#161616] px-5 py-2.5 text-sm leading-6 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isSubmitting}
                  className="self-end rounded-full bg-purple-500 p-3 transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12h15m0 0l-6-6m6 6l-6 6"
                    />
                  </svg>
                </button>
              </div>
            </footer>
          </div>
        </motion.main>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {generatorOpen && (
          <motion.div
            key="generator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="generator-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-3 py-3 sm:px-6 sm:py-5"
            onWheelCapture={handleOverlayWheel}
          >
            <div className="generator-backdrop pointer-events-none absolute inset-0 bg-[#050608]/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: 28, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="generator-dialog relative flex min-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col overflow-y-auto rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,20,27,0.98),rgba(9,11,15,0.98))] text-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.72)] sm:min-h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)]"
              onWheelCapture={handlePopupWheel}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/80 to-transparent" />
              <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-purple-200/70">
                    Generator popup
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Generate the 3D model here
                  </h2>
                </div>
                <button
                  onClick={closeGenerator}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-200 transition hover:bg-white/10"
                  aria-label="Close generator"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="generator-content-grid grid flex-1 min-h-0 gap-0 overflow-hidden grid-cols-[minmax(0,1.8fr)_minmax(320px,420px)]">
                <div className="generator-preview-pane min-h-0 overflow-y-scroll border-r border-white/8" onWheelCapture={handlePopupWheel}>
                  <div className="p-4 sm:p-5">
                    {popupResult ? (
                      <PlannerResultPanel result={popupResult} embedded onOpenProfessionals={openProfessionalsDrawer} />
                    ) : generatorPrompt.trim() && !isSubmitting ? (
                      <div className="rounded-[22px] border border-purple-400/15 bg-[#0e1118] px-4 py-4 text-sm leading-6 text-gray-300">
                        Preparing the popup preview.
                      </div>
                    ) : isSubmitting ? (
                      <div className="rounded-[22px] border border-purple-400/15 bg-[#0e1118] px-4 py-4 text-sm leading-6 text-gray-300">
                        Generating the 3D model now.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="generator-controls-pane min-h-0 overflow-y-scroll px-5 py-5 sm:px-6" onWheelCapture={handlePopupWheel}>
                  <div className="flex h-full min-h-0 flex-col gap-5">
                    <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.32em] text-purple-200/70">
                          Prompt and controls
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-300">
                          Create-style prompts like make me, generate, create, build, or design open this popup. The preview stays on the left so you can use the CAD tools while editing.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          "make me",
                          "generate",
                          "create",
                          "build",
                          "design",
                        ].map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full border border-purple-400/25 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-purple-100/80"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          House Request
                        </label>
                        <textarea
                          value={generatorPrompt}
                          onChange={(event) => setGeneratorPrompt(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              if (!isSubmitting) {
                                void handleGeneratorConfirm();
                              }
                            }
                          }}
                          placeholder="Make me a G+3 street-facing modern house with parking for 2 cars"
                          ref={generatorTextareaRef}
                          rows={1}
                          className="min-h-[56px] w-full resize-none overflow-hidden rounded-[18px] border border-purple-400/20 bg-[#10131a] px-4 py-3 text-sm text-gray-100 outline-none transition placeholder:text-gray-500 focus:border-purple-300/50 focus:ring-2 focus:ring-purple-400/20"
                        />
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-white/8 pt-4">
                      <div className="grid gap-3">
                        <button
                          onClick={() => void handleGeneratorConfirm()}
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isSubmitting ? "Generating..." : plannerResult ? "Regenerate model" : "Generate 3D model"}
                        </button>
                        <button
                          onClick={closeGenerator}
                          disabled={isSubmitting}
                          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfessionalsDrawer
        open={professionalsDrawerOpen}
        onClose={() => setProfessionalsDrawerOpen(false)}
        requestSummary={professionalsDrawerContext?.requestSummary || plannerResult?.spec?.request || generatorPrompt || input || "Nearby professional support"}
        guidanceNote={professionalsDrawerContext?.guidanceNote}
      />

      <DecisionTreeWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onComplete={(aiSpec) => {
          setIsWizardOpen(false);
          if (aiSpec) {
            setPlannerResult({
              spec: aiSpec,
              lawReview: null,
              lawReviewError: "",
              dsl: buildHouseDsl(aiSpec, aiSpec.floors || [])
            });
            setStarted(true);
          }
        }}
        initialPrompt={input}
      />
    </>
  );
}
