export type HouseFamily = "detached" | "compact" | "vertical" | "shared-wall" | "multifamily" | "mixed-use";

export type HouseArchetype =
  | "villa"
  | "bungalow"
  | "ranch"
  | "farmhouse"
  | "a-frame"
  | "studio-1rk"
  | "tiny-home"
  | "condo"
  | "co-op"
  | "chawl"
  | "duplex"
  | "row-house"
  | "townhouse"
  | "cottage"
  | "cape-cod"
  | "colonial"
  | "federal"
  | "craftsman"
  | "mediterranean"
  | "midcentury-modern"
  | "contemporary"
  | "stilt-house"
  | "courtyard-house"
  | "haveli"
  | "ladakhi-house"
  | "eco-friendly-home"
  | "palace"
  | "single-family-home"
  | "apartment"
  | "house"
  | "mixed-use";

export type HouseModifier =
  | "lift"
  | "basement"
  | "courtyard"
  | "double-height"
  | "terrace"
  | "covered-parking"
  | "pool"
  | "home-office"
  | "guest-suite"
  | "verandah"
  | "sloped-roof";

export type HouseDecision = {
  family: HouseFamily;
  familyLabel: string;
  archetype: HouseArchetype;
  label: string;
  program: "house" | "villa" | "apartment" | "studio" | "mixed-use";
  style: string;
  defaultStoreys: number;
  modifiers: HouseModifier[];
  summary: string;
  constraints?: {
    minPlotArea?: number;
    maxStoreys?: number;
    suggestedRooms?: string[];
  };
};

export type PreviousHouseState = {
  program?: string | null;
  building?: {
    style?: string | null;
    totalStoreys?: number | null;
  } | null;
  houseConcept?: {
    family?: HouseFamily | null;
    archetype?: HouseArchetype | null;
    style?: string | null;
  } | null;
};

export type HouseQuestionContext = {
  plotSpecified: boolean;
  hasLift: boolean;
  hasBasement: boolean;
  hasCourtyard: boolean;
  hasDoubleHeight: boolean;
  hasCoveredParking: boolean;
  hasTerrace: boolean;
  hasVerandah: boolean;
  hasPool: boolean;
  hasHomeOffice: boolean;
  bedroomCount: number;
  parkingCars: number;
};

type ArchetypeConfig = {
  family: HouseFamily;
  familyLabel: string;
  archetype: HouseArchetype;
  label: string;
  program: HouseDecision["program"];
  style: string;
  defaultStoreys: number;
  patterns: RegExp[];
  summary: string;
  constraints?: {
    minPlotArea?: number; // in sq ft
    maxStoreys?: number;
    suggestedRooms?: string[];
  };
};

const HOUSE_ARCHETYPE_RULES: ArchetypeConfig[] = [
  {
    family: "mixed-use",
    familyLabel: "Mixed use",
    archetype: "mixed-use",
    label: "Mixed use",
    program: "mixed-use",
    style: "contemporary",
    defaultStoreys: 3,
    patterns: [/\bmixed[-\s]?use\b/i],
    summary: "Retail or office at the base with residential use above.",
    constraints: {
      minPlotArea: 1200,
      maxStoreys: 5,
      suggestedRooms: ["retail bay", "office suite", "apartment unit", "services room"],
    },
  },
  {
    family: "compact",
    familyLabel: "Compact",
    archetype: "tiny-home",
    label: "Tiny home",
    program: "studio",
    style: "studio",
    defaultStoreys: 1,
    patterns: [/\btiny\s+homes?\b/i, /\btinyhouse(?:s)?\b/i, /\bmicro\s+homes?\b/i],
    summary: "Ultra-compact living branch tuned for minimal footprint and built-in storage.",
    constraints: {
      minPlotArea: 200,
      maxStoreys: 2,
      suggestedRooms: ["multi-purpose room", "kitchenette", "lofted bed", "compact bath"],
    },
  },
  {
    family: "compact",
    familyLabel: "Compact",
    archetype: "studio-1rk",
    label: "Studio / 1RK",
    program: "studio",
    style: "studio",
    defaultStoreys: 1,
    patterns: [/\bstudios?\b/i, /\b1\s*rk\b/i, /\bone\s*room\s*kit(?:chen)?\b/i],
    summary: "Compact plan tuned for efficient living or live-work use.",
    constraints: {
      minPlotArea: 300,
      maxStoreys: 1,
      suggestedRooms: ["living/bedroom", "kitchenette", "bath"],
    },
  },
  {
    family: "multifamily",
    familyLabel: "Multifamily",
    archetype: "condo",
    label: "Condo",
    program: "apartment",
    style: "apartment",
    defaultStoreys: 4,
    patterns: [/\bcondo(?:minium)?s?\b/i],
    summary: "Owner-occupied multifamily branch with shared circulation and services.",
    constraints: {
      minPlotArea: 2400,
      maxStoreys: 10,
      suggestedRooms: ["unit living", "unit kitchen", "master bedroom", "balcony"],
    },
  },
  {
    family: "detached",
    familyLabel: "Detached",
    archetype: "villa",
    label: "Villa",
    program: "villa",
    style: "villa",
    defaultStoreys: 3,
    patterns: [/\bvillas?\b/i, /\bluxury\s+homes?\b/i],
    summary: "Standalone premium home with room for lift, courtyard, and terrace choices.",
    constraints: {
      minPlotArea: 2400,
      maxStoreys: 4,
      suggestedRooms: ["double-height living", "formal dining", "home theatre", "master suite", "guest wing", "private pool"],
    },
  },
  {
    family: "detached",
    familyLabel: "Detached",
    archetype: "farmhouse",
    label: "Farmhouse",
    program: "house",
    style: "farmhouse",
    defaultStoreys: 1,
    patterns: [/\bfarmhouses?\b/i, /\bcountry\s+homes?\b/i, /\brural\s+homes?\b/i],
    summary: "Two-storey farmhouse with wide front verandah, garage, pitched roof, and earthy material palette.",
    constraints: {
      minPlotArea: 5000,
      maxStoreys: 2,
      suggestedRooms: ["verandah", "large kitchen", "mudroom", "outdoor deck", "loft"],
    },
  },
  {
    family: "detached",
    familyLabel: "Detached",
    archetype: "bungalow",
    label: "Bungalow",
    program: "house",
    style: "bungalow",
    defaultStoreys: 1,
    patterns: [/\bbungalows?\b/i],
    summary: "Single-storey detached home with an easy ground-floor flow.",
    constraints: {
      minPlotArea: 1500,
      maxStoreys: 2,
      suggestedRooms: ["front porch", "living room", "dining", "kitchen", "2-3 bedrooms"],
    },
  },
  {
    family: "vertical",
    familyLabel: "Vertical",
    archetype: "duplex",
    label: "Duplex",
    program: "house",
    style: "duplex",
    defaultStoreys: 2,
    patterns: [/\bduplex(?:es)?\b/i],
    summary: "Two primary living levels tied together by a stair core.",
    constraints: {
      minPlotArea: 800,
      maxStoreys: 3,
      suggestedRooms: ["ground floor living", "first floor bedrooms", "internal staircase", "double-height void"],
    },
  },
  {
    family: "shared-wall",
    familyLabel: "Shared-wall",
    archetype: "townhouse",
    label: "Townhouse",
    program: "house",
    style: "townhouse",
    defaultStoreys: 2,
    patterns: [/\btown(?:house|home)s?\b/i, /\btown\s?hous(?:e|es)\b/i],
    summary: "Urban narrow-front home with party walls or a tight footprint.",
    constraints: {
      minPlotArea: 600,
      maxStoreys: 4,
      suggestedRooms: ["stilt parking", "linear living", "stacked bedrooms", "roof terrace"],
    },
  },
  {
    family: "detached",
    familyLabel: "Detached",
    archetype: "house",
    label: "House",
    program: "house",
    style: "contemporary",
    defaultStoreys: 2,
    patterns: [/\bhouses?\b/i, /\bhomes?\b/i, /\bresidences?\b/i],
    summary: "General detached home when the prompt does not fit a more specific branch.",
    constraints: {
      minPlotArea: 1200,
      maxStoreys: 4,
      suggestedRooms: ["living", "kitchen", "dining", "3 bedrooms", "parking"],
    },
  },
];

const STYLE_RULES: Array<[RegExp, string]> = [
  [/\bmodern\b/i, "modern"],
  [/\bcontemporary\b/i, "contemporary"],
  [/\bminimal\b/i, "minimal"],
  [/\bluxury\b/i, "luxury"],
  [/\btraditional\b/i, "traditional"],
  [/\bheritage\b/i, "heritage"],
  [/\bindian\b/i, "indian"],
  [/\ba[-\s]?frame\b/i, "a-frame"],
  [/\bfarmhouse\b/i, "farmhouse"],
  [/\bbungalow\b/i, "bungalow"],
  [/\bduplex\b/i, "duplex"],
  [/\btown\s?house\b/i, "townhouse"],
  [/\brow\s?house\b/i, "row-house"],
  [/\bstudio\b/i, "studio"],
  [/\b1\s*rk\b/i, "studio"],
  [/\bvilla\b/i, "villa"],
  [/\bmediterranean\b|\btuscan\b|\bspanish\s?hacienda\b/i, "mediterranean"],
  [/\bpalladian\b|\bneoclassical\b/i, "palladian"],
  [/\btropical\b|\bbalinese\b/i, "tropical"],
  [/\bindian[-\s]?duplex\b|\bindian[-\s]?vertical\b/i, "indian-duplex"],
  [/\bstilt[-\s]?plus[-\s]?four\b|\bs\+4\b/i, "stilt-plus-four"],
  [/\bindependent[-\s]?floor\b/i, "independent-floor"],
  [/\bskinny[-\s]?house\b|\btokyo[-\s]?style\b/i, "skinny-house"],
  [/\bstacked[-\s]?duplex\b|\bmontreal[-\s]?style\b/i, "stacked-duplex"],
  [/\bterrace[-\s]?house\b|\brow[-\s]?house\b|\blondon[-\s]?style\b/i, "terrace-house"],
];

const MODIFIER_RULES: Array<{
  modifier: HouseModifier;
  pattern: RegExp;
  negated?: RegExp[];
}> = [
  { modifier: "lift", pattern: /\blift\b|\belevator\b/i, negated: [/\bno\s+lift\b/i, /\bwithout\s+lift\b/i, /\blift[-\s]?free\b/i] },
  { modifier: "basement", pattern: /\bbasement\b/i, negated: [/\bno\s+basement\b/i, /\bwithout\s+basement\b/i, /\bbasement[-\s]?free\b/i, /\bexclude\s+basement\b/i] },
  { modifier: "courtyard", pattern: /\bcourtyard\b/i, negated: [/\bno\s+courtyard\b/i, /\bwithout\s+courtyard\b/i] },
  { modifier: "double-height", pattern: /\bdouble[-\s]?height\b/i, negated: [/\bno\s+double[-\s]?height\b/i, /\bwithout\s+double[-\s]?height\b/i] },
  { modifier: "terrace", pattern: /\bterrace\b|\broof\s*deck\b|\brooftop\b/i, negated: [/\bno\s+terrace\b/i, /\bwithout\s+terrace\b/i] },
  { modifier: "covered-parking", pattern: /\bcovered\s+parking\b|\bstilt\s+parking\b/i, negated: [/\bopen\s+parking\b/i, /\bno\s+parking\b/i] },
  { modifier: "pool", pattern: /\bpool\b/i, negated: [/\bno\s+pool\b/i, /\bwithout\s+pool\b/i] },
  { modifier: "home-office", pattern: /\bhome\s+office\b|\bworkspace\b|\bstudy\b/i, negated: [/\bno\s+office\b/i, /\bwithout\s+office\b/i] },
  { modifier: "guest-suite", pattern: /\bguest\s+suite\b|\bguest\s+room\b/i, negated: [/\bno\s+guest\b/i, /\bwithout\s+guest\b/i] },
  { modifier: "verandah", pattern: /\bverandah\b|\bveranda\b|\bporch\b/i, negated: [/\bno\s+verandah\b/i, /\bwithout\s+verandah\b/i] },
  { modifier: "sloped-roof", pattern: /\bsloped\s+roof\b|\bpitched\s+roof\b|\bgabled\b|\ba[-\s]?frame\b/i, negated: [/\bno\s+sloped\s+roof\b/i] },
];

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase();
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function findStyleOverride(promptText: string) {
  for (const [pattern, style] of STYLE_RULES) {
    if (pattern.test(promptText)) {
      return style;
    }
  }

  return null;
}

function getArchetypeConfig(archetype: HouseArchetype) {
  return HOUSE_ARCHETYPE_RULES.find((rule) => rule.archetype === archetype) || HOUSE_ARCHETYPE_RULES[HOUSE_ARCHETYPE_RULES.length - 1];
}

function formatModifierLabel(modifiers: HouseModifier[]) {
  if (modifiers.length === 0) {
    return "no extra modifiers";
  }

  return modifiers.join(", ");
}

function getFallbackArchetype(previousState?: PreviousHouseState | null): HouseArchetype {
  const previousArchetype = previousState?.houseConcept?.archetype;
  if (previousArchetype && HOUSE_ARCHETYPE_RULES.some((rule) => rule.archetype === previousArchetype)) {
    return previousArchetype;
  }

  return "house";
}

function getFallbackStyle(previousState?: PreviousHouseState | null) {
  const previousStyle = normalizeText(previousState?.houseConcept?.style || previousState?.building?.style || "");
  if (previousStyle) {
    return previousStyle;
  }

  return "contemporary";
}

function isRuleMatched(promptText: string, pattern: RegExp, negated: RegExp[] = []) {
  if (!pattern.test(promptText)) {
    return false;
  }

  return !negated.some((rule) => rule.test(promptText));
}

function determineDefaultStoreys(config: ArchetypeConfig, previousState?: PreviousHouseState | null) {
  const previousStoreys = previousState?.building?.totalStoreys;
  if (typeof previousStoreys === "number" && Number.isFinite(previousStoreys) && previousStoreys > 0) {
    return Math.max(1, Math.trunc(previousStoreys));
  }

  return config.defaultStoreys;
}

export function classifyHouseConcept(prompt: string, previousState?: PreviousHouseState | null): HouseDecision {
  const promptText = normalizeText(prompt);
  const matchedConfig = HOUSE_ARCHETYPE_RULES.find((config) => matchesAny(promptText, config.patterns));
  const config = matchedConfig || getArchetypeConfig(getFallbackArchetype(previousState));
  const styleOverride = findStyleOverride(promptText);
  const style = styleOverride || config.style || getFallbackStyle(previousState);
  const modifiers = MODIFIER_RULES.filter((rule) => isRuleMatched(promptText, rule.pattern, rule.negated || [])).map((rule) => rule.modifier);
  const summary = `${config.familyLabel} branch: ${config.label}${modifiers.length > 0 ? ` with ${formatModifierLabel(modifiers)}` : ""}.`;

  return {
    family: config.family,
    familyLabel: config.familyLabel,
    archetype: config.archetype,
    label: config.label,
    program: config.program,
    style,
    defaultStoreys: determineDefaultStoreys(config, previousState),
    modifiers,
    summary,
  };
}

export function formatHouseConcept(concept: HouseDecision) {
  return `${concept.familyLabel} / ${concept.label}${concept.modifiers.length > 0 ? ` (${formatModifierLabel(concept.modifiers)})` : ""}`;
}

export function buildHouseQuestionFlow(concept: HouseDecision, context: HouseQuestionContext) {
  const questions: string[] = [];

  if (!context.plotSpecified) {
    questions.push("What is the plot width and depth in feet?");
  }

  switch (concept.archetype) {
    case "villa":
      if (!concept.modifiers.includes("lift") && !context.hasLift) {
        questions.push("Do you want a lift in the villa?");
      }
      if (!concept.modifiers.includes("courtyard") && !context.hasCourtyard) {
        questions.push("Should I add a courtyard or double-height lounge?");
      }
      if (!concept.modifiers.includes("terrace") && !context.hasTerrace) {
        questions.push("Should the top level stay as a terrace or become a roof deck?");
      }
      if (!concept.modifiers.includes("pool") && !context.hasPool) {
        questions.push("Do you want a pool or pool deck?");
      }
      break;
    case "palace":
      questions.push("Should I plan ceremonial rooms, a grand court, and separate service wings?");
      if (!context.hasCourtyard) {
        questions.push("Do you want one large central court or multiple courtyards?");
      }
      if (!context.hasDoubleHeight) {
        questions.push("Should the main arrival hall be double-height?");
      }
      if (!context.hasTerrace) {
        questions.push("Should I keep a roof terrace or viewing deck on top?");
      }
      break;
    case "haveli":
    case "courtyard-house":
      questions.push("Should I center the plan around a courtyard as the main organizing heart?");
      if (!context.hasCourtyard) {
        questions.push("Do you want one large court or a sequence of smaller courts?");
      }
      if (!context.hasDoubleHeight) {
        questions.push("Should the main hall read as a double-height space?");
      }
      if (!context.hasTerrace) {
        questions.push("Should I leave room for an open terrace or overlook?");
      }
      break;
    case "eco-friendly-home":
      questions.push("Should I prioritize solar, rainwater harvesting, and passive cooling?");
      if (!context.hasTerrace) {
        questions.push("Do you want a solar roof, green roof, or rooftop terrace?");
      }
      if (!context.hasHomeOffice) {
        questions.push("Should I carve out a quiet work nook for low-energy live-work use?");
      }
      break;
    case "stilt-house":
      questions.push("Should the house sit on open stilts for parking, flood clearance, or both?");
      if (!context.hasLift) {
        questions.push("Should I add a stair-and-lift core from the stilt level?");
      }
      if (!context.hasBasement) {
        questions.push("Do you want the lower level to stay open or partly enclosed?");
      }
      break;
    case "ladakhi-house":
      questions.push("Should I tune the Ladakhi house for cold weather, thick walls, and a flat roof?");
      if (!context.hasTerrace) {
        questions.push("Do you want a usable roof terrace or snow-safe roof deck?");
      }
      if (!context.hasCourtyard) {
        questions.push("Should I add a sheltered inner court for winter light?");
      }
      break;
    case "tiny-home":
      questions.push("Should I keep it as a lofted tiny home, or make it a pure single-room compact layout?");
      if (!context.hasHomeOffice) {
        questions.push("Do you want a fold-away work nook or storage wall?");
      }
      if (!context.hasTerrace) {
        questions.push("Should I add a tiny deck or roof terrace?");
      }
      break;
    case "condo":
    case "co-op":
    case "apartment":
      questions.push("Is this a condo, co-op, apartment block, or compact rental stack?");
      if (!context.hasLift) {
        questions.push("Do you want lift access for the multifamily stack?");
      }
      if (!context.hasCoveredParking) {
        questions.push("Should I plan covered parking or a stilt floor?");
      }
      break;
    case "chawl":
      questions.push("Should the chawl use a shared corridor, common wash area, or internal court?");
      if (!context.hasLift) {
        questions.push("Do you want a lift or stair-only access for the chawl?");
      }
      if (!context.hasBasement) {
        questions.push("Should I add shared storage or a utility basement?");
      }
      break;
    case "bungalow":
      if (!context.hasVerandah) {
        questions.push("Should I add a verandah or front porch to the bungalow?");
      }
      if (!context.hasCourtyard) {
        questions.push("Do you want an open courtyard or a compact central court?");
      }
      if (!context.hasBasement) {
        questions.push("Do you need a basement for storage or parking?");
      }
      break;
    case "farmhouse":
      if (!context.hasVerandah) {
        questions.push("Should I add a long verandah or sit-out deck?");
      }
      if (!context.hasTerrace) {
        questions.push("Should the roof stay sloped, or should I add a usable terrace?");
      }
      if (!context.hasPool) {
        questions.push("Do you want a pool, pond, or garden court on the site?");
      }
      break;
    case "a-frame":
      questions.push("Do you want a pure A-frame roof, or a loft and deck version?");
      if (!context.hasTerrace) {
        questions.push("Should I add a deck or viewing terrace around the A-frame?");
      }
      if (!context.hasDoubleHeight) {
        questions.push("Do you want the living area to read as double-height?");
      }
      break;
    case "studio-1rk":
      questions.push("Should I keep it as a compact 1RK, or expand it into a studio with a partitioned bedroom?");
      if (!context.hasHomeOffice) {
        questions.push("Do you want a work nook or home office corner?");
      }
      if (!context.hasTerrace) {
        questions.push("Should I add a balcony or tiny terrace for daylight?");
      }
      break;
    case "duplex":
      questions.push("Should I keep it as a duplex or convert it into a lift-enabled multi-storey house?");
      if (!context.hasLift) {
        questions.push("Do you want a lift along with the internal stair?");
      }
      if (!context.hasDoubleHeight) {
        questions.push("Should the living room be double-height?");
      }
      break;
    case "row-house":
    case "townhouse":
      questions.push("Should I prioritize a narrow frontage with parking, or a wider stair and family zone?");
      if (!context.hasTerrace) {
        questions.push("Do you want a front balcony, rear terrace, or both?");
      }
      if (!context.hasLift) {
        questions.push("Should the townhouse or row house include a lift core?");
      }
      break;
    case "cottage":
    case "cape-cod":
    case "craftsman":
      questions.push("Should I keep a compact porch-forward footprint with a low roof?");
      if (!context.hasVerandah) {
        questions.push("Do you want a front porch or verandah?");
      }
      if (!context.hasBasement) {
        questions.push("Do you need a basement for storage or parking?");
      }
      break;
    case "ranch":
      questions.push("Should I keep the ranch single-storey with a long horizontal plan?");
      if (!context.hasTerrace) {
        questions.push("Do you want a rear patio, deck, or covered sit-out?");
      }
      if (!context.hasHomeOffice) {
        questions.push("Should I carve out a study or den off the main hall?");
      }
      break;
    case "colonial":
    case "federal":
      questions.push("Should I keep the facade symmetrical with a central hall?");
      if (!context.hasTerrace) {
        questions.push("Should I keep room for a rear patio, deck, or terrace?");
      }
      if (concept.defaultStoreys > 1 && !context.hasLift) {
        questions.push("Should I add a lift core?");
      }
      break;
    case "single-family-home":
    case "contemporary":
    case "midcentury-modern":
      questions.push("Do you want an open family plan, or a more formal room sequence?");
      if (!context.hasTerrace) {
        questions.push("Should I keep room for a rear patio, deck, or terrace?");
      }
      if (concept.defaultStoreys > 1 && !context.hasLift) {
        questions.push("Should I add a lift core?");
      }
      break;
    case "mediterranean":
      questions.push("Should I center the house around a courtyard and shaded terrace?");
      if (!context.hasCourtyard) {
        questions.push("Do you want one large courtyard or a series of smaller courts?");
      }
      if (!context.hasTerrace) {
        questions.push("Should I add a roof terrace or loggia?");
      }
      break;
    case "house":
    default:
      if (!context.hasLift && concept.defaultStoreys > 1) {
        questions.push("Should I add a lift core?");
      }
      if (!context.hasBasement && concept.defaultStoreys > 1) {
        questions.push("Do you need a basement for parking or storage?");
      }
      if (!context.hasCourtyard) {
        questions.push("Do you want a courtyard or open-to-sky court?");
      }
      break;
  }

  if (!context.hasCoveredParking && (concept.family === "detached" || concept.family === "vertical" || concept.family === "mixed-use")) {
    questions.push(`Should I plan covered parking for ${context.parkingCars > 1 ? `${context.parkingCars} cars` : "1 car"}?`);
  }

  if (!context.hasTerrace && concept.modifiers.includes("terrace") === false && concept.family !== "compact") {
    questions.push("Should I leave room for a usable terrace or roof deck?");
  }

  questions.push("Confirm setbacks and local bye-laws before final issue.");

  return Array.from(new Set(questions)).slice(0, 5);
}
