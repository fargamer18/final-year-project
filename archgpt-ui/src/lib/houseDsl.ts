export type HouseDslFloor = {
  level: string;
  spaces: string[];
  core?: string[];
};

export type HouseDslSpec = {
  request?: string;
  source?: string;
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
  floors?: HouseDslFloor[];
};

export interface HouseDslShape {
  type: string;
  name?: string;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
  roughness?: number;
  metallic?: number;
  emissive?: string;
}

export interface HouseDslModel {
  house: {
    width: number;
    height: number;
    depth: number;
    style: string;
    roadFacing: string;
    mainEntranceFacing: string;
    storeys: number;
    plotSpecified: boolean;
    plotWidthFt?: number;
    plotDepthFt?: number;
    hasBasement: boolean;
    hasLift: boolean;
    source: string;
  };
  shapes: HouseDslShape[];
}

const STYLE_DIMENSIONS: Record<string, { width: number; depth: number }> = {
  modern: { width: 36, depth: 24 },
  contemporary: { width: 36, depth: 24 },
  traditional: { width: 40, depth: 28 },
  minimal: { width: 32, depth: 22 },
  luxury: { width: 42, depth: 30 },
  indian: { width: 38, depth: 28 },
  villa: { width: 45, depth: 31 },
  bungalow: { width: 38, depth: 28 },
  farmhouse: { width: 44, depth: 32 },
  "a-frame": { width: 34, depth: 26 },
  studio: { width: 24, depth: 18 },
  townhouse: { width: 28, depth: 18 },
  "row-house": { width: 26, depth: 18 },
  duplex: { width: 34, depth: 24 },
  apartment: { width: 30, depth: 22 },
  "mixed-use": { width: 38, depth: 26 },
};

const DEFAULT_STOREY_HEIGHTS: Record<string, number> = {
  minimal: 9.2,
  modern: 9.6,
  contemporary: 9.6,
  traditional: 10,
  luxury: 10.2,
  indian: 9.8,
  villa: 10.5, // Increased for grander feel
  bungalow: 9.4,
  farmhouse: 10,
  "a-frame": 10.8,
  studio: 8.8,
  townhouse: 9.2,
  "row-house": 9,
  duplex: 9.7,
  apartment: 9.4,
  "mixed-use": 10,
};

function isBasementLevel(level: string) {
  return /basement/i.test(String(level || ''));
}

function normalizeStyle(style?: string, requestText = '') {
  const normalized = String(style || '').trim().toLowerCase();
  if (normalized) return normalized;
  const lowerRequest = String(requestText || '').toLowerCase();
  if (/\bmodern\b/.test(lowerRequest)) return 'modern';
  if (/\bluxury\b/.test(lowerRequest)) return 'luxury';
  if (/\bvilla\b/.test(lowerRequest)) return 'villa';
  if (/\bfarmhouse\b/.test(lowerRequest)) return 'farmhouse';
  return 'contemporary';
}

function normalizeFacing(facing?: string) {
  const normalized = String(facing || '').trim().toLowerCase();
  if (['north', 'east', 'south', 'west'].includes(normalized)) return normalized;
  return 'north';
}

function facingToRotation(facing?: string) {
  switch (normalizeFacing(facing)) {
    case 'east': return Math.PI / 2;
    case 'south': return Math.PI;
    case 'west': return -Math.PI / 2;
    default: return 0;
  }
}

function toNumber(value: unknown): number | undefined {
  const candidate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : undefined;
}

function toVector3(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const coords = value.slice(0, 3).map((item) => toNumber(item));
  if (coords.some((coord) => coord === undefined)) return undefined;
  return [coords[0] as number, coords[1] as number, coords[2] as number];
}

function roundDimension(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatNumber(value: number) {
  const rounded = roundDimension(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function splitDslParts(input: string) {
  const parts: string[] = [];
  let current = '', quote: '"' | '\'' | null = null, escape = false, depth = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      current += char;
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === quote) { quote = null; }
      continue;
    }
    if (char === '"' || char === '\'') { quote = char; current += char; continue; }
    if (char === '[' || char === '{' || char === '(') { depth += 1; }
    if (char === ']' || char === '}' || char === ')') { depth = Math.max(0, depth - 1); }
    if (char === ',' && depth === 0) { if (current.trim()) parts.push(current.trim()); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseDslValue(value: string): unknown {
  const trimmed = value.trim().replace(/,\s*$/, '');
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, '\'');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return splitDslParts(trimmed.slice(1, -1)).map((part) => parseDslValue(part));
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return parseDslProperties(trimmed.slice(1, -1));
  return trimmed;
}

function parseDslProperties(block: string): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  splitDslParts(block).forEach((part) => {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) return;
    const key = part.slice(0, colonIndex).trim();
    const rawValue = part.slice(colonIndex + 1).trim();
    if (!key) return;
    properties[key] = parseDslValue(rawValue);
  });
  return properties;
}

function parseShape(type: string, block: string): HouseDslShape {
  const properties = parseDslProperties(block);
  return {
    type: type.toLowerCase(),
    name: typeof properties.name === 'string' ? properties.name : undefined,
    width: toNumber(properties.width),
    height: toNumber(properties.height),
    depth: toNumber(properties.depth),
    radius: toNumber(properties.radius),
    position: toVector3(properties.position),
    rotation: toVector3(properties.rotation),
    color: typeof properties.color === 'string' ? properties.color : undefined,
    opacity: toNumber(properties.opacity),
    roughness: toNumber(properties.roughness),
    metallic: toNumber(properties.metallic),
    emissive: typeof properties.emissive === 'string' ? properties.emissive : undefined,
  };
}

function parseHouseBlock(block: string, requestText = ''): HouseDslModel['house'] {
  const properties = parseDslProperties(block);
  const plotWidthFt = toNumber(properties.plotWidthFt);
  const plotDepthFt = toNumber(properties.plotDepthFt);
  const plotSpecified = Boolean(properties.plotSpecified) || (Boolean(plotWidthFt) && Boolean(plotDepthFt));

  return {
    width: toNumber(properties.width) || 0,
    height: toNumber(properties.height) || 0,
    depth: toNumber(properties.depth) || 0,
    style: normalizeStyle(typeof properties.style === 'string' ? properties.style : undefined, requestText),
    roadFacing: normalizeFacing(typeof properties.roadFacing === 'string' ? properties.roadFacing : undefined),
    mainEntranceFacing: normalizeFacing(typeof properties.mainEntranceFacing === 'string' ? properties.mainEntranceFacing : undefined),
    storeys: Math.max(1, Math.trunc(toNumber(properties.storeys) || 1)),
    plotSpecified,
    ...(plotWidthFt && plotWidthFt > 0 ? { plotWidthFt } : {}),
    ...(plotDepthFt && plotDepthFt > 0 ? { plotDepthFt } : {}),
    hasBasement: Boolean(properties.hasBasement),
    hasLift: Boolean(properties.hasLift),
    source: typeof properties.source === 'string' ? properties.source : 'generated',
  };
}

function emitDslBlock(keyword: string, properties: Record<string, unknown>) {
  const lines = [`${keyword} {`];
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null || value === '') continue;
    lines.push(`  ${key}: ${serializeDslValue(value)},`);
  }
  lines.push('}');
  return lines.join('\n');
}

function serializeDslValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => serializeDslValue(entry)).join(', ')}]`;
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  return JSON.stringify(String(value));
}

function requestHasFeature(requestText: string, featurePattern: RegExp, negatedPatterns: RegExp[] = []) {
  const normalizedRequest = String(requestText || '');
  if (negatedPatterns.some((pattern) => pattern.test(normalizedRequest))) return false;
  return featurePattern.test(normalizedRequest);
}

function hasLiftCore(floors: HouseDslFloor[], requestText: string) {
  return floors.some((floor) => Array.isArray(floor.core) && floor.core.some((entry) => /lift/i.test(String(entry)))) || requestHasFeature(requestText, /\blift\b|\belevator\b/i, [/\bno\s+lift\b/i, /\bwithout\s+lift\b/i]);
}

function hasBasementFloor(floors: HouseDslFloor[], requestText: string) {
  return floors.some((floor) => isBasementLevel(floor.level)) || requestHasFeature(requestText, /\bbasement\b/i, [/\bno\s+basement\b/i, /\bwithout\s+basement\b/i]);
}

/**
 * DESIGN INTENT ENGINE & CONSTRAINT SOLVER
 * Transitioning from "Block Stacking" to "Architectural Reasoning"
 */

interface SpatialConstraint {
  id: string;
  type: 'clearance' | 'alignment' | 'continuity' | 'parenting';
  target: string;
  value: number | string | [number, number, number];
}

class ConstraintSolver {
  private constraints: SpatialConstraint[] = [];

  add(c: SpatialConstraint) { this.constraints.push(c); }

  solveParking(plotWidth: number, gateWidth: number): { x: number, z: number, turningRadius: number } {
    // 5.5m (~18ft) turning radius requirement for luxury vehicles
    const minRadius = 18; 
    const entryX = plotWidth / 2 - gateWidth;
    return { x: entryX, z: 0, turningRadius: minRadius };
  }

  validateContinuity(storeys: number, height: number): number {
    // Ensures vertical shafts are exactly (Storeys * Height) + Overrun
    return (storeys * height) + 4;
  }
}

type VillaSubtype = 'generic' | 'mediterranean' | 'modernist' | 'palladian' | 'tropical' | 'indian-duplex' | 'stilt-plus-four' | 'skinny-house' | 'stacked-duplex' | 'terrace-house';

function detectVillaSubtype(request: string, spec: HouseDslSpec): VillaSubtype {
  const text = request.toLowerCase();
  if (/\bmediterranean\b|\btuscan\b|\bspanish\b/.test(text)) return 'mediterranean';
  if (/\bmodernist\b|\bmodern\b|\bcgtrader\b/.test(text)) return 'modernist';
  if (/\bpalladian\b|\bneoclassical\b/.test(text)) return 'palladian';
  if (/\btropical\b|\bbalinese\b/.test(text)) return 'tropical';
  if (/\bindian[-\s]?duplex\b|\bindian[-\s]?vertical\b/.test(text)) return 'indian-duplex';
  if (/\bstilt[-\s]?plus[-\s]?four\b|\bindependent[-\s]?floor\b/.test(text)) return 'stilt-plus-four';
  if (/\bskinny[-\s]?house\b|\btokyo[-\s]?style\b/.test(text)) return 'skinny-house';
  if (/\bstacked[-\s]?duplex\b|\bmontreal[-\s]?style\b/.test(text)) return 'stacked-duplex';
  if (/\bterrace[-\s]?house\b|\brow[-\s]?house\b|\blondon[-\s]?style\b/.test(text)) return 'terrace-house';
  return 'generic';
}

export function buildHouseDsl(spec: HouseDslSpec, floorsInput: HouseDslFloor[] = []) {
  const requestText = String(spec.request || '');
  const solver = new ConstraintSolver();
  const isVilla = requestHasFeature(requestText, /\bvilla\b|\bluxury\b|\bindian\b|\bduplex\b|\bhouse\b/i);
  const subtype = isVilla ? detectVillaSubtype(requestText, spec) : 'generic';
  
  // 1. SITE INTELLIGENCE
  const plotWidth = spec.site?.plotWidthFt || (subtype === 'skinny-house' ? 12 : (isVilla && subtype === 'generic' ? 100 : 40));
  const plotDepth = spec.site?.plotDepthFt || (subtype === 'skinny-house' ? 40 : (isVilla && subtype === 'generic' ? 80 : 60));
  
  const frontSetback = (subtype === 'terrace-house') ? 0 : 10;
  const sideSetback = (subtype === 'terrace-house' || subtype === 'skinny-house') ? 0 : 5;

  const buildableWidth = Math.max(10, plotWidth - (sideSetback * 2));
  const buildableDepth = plotDepth - (frontSetback + 10);

  // 2. PROGRAM SEMANTICS
  const hasBasement = hasBasementFloor(spec.floors || [], requestText);
  const hasLift = hasLiftCore(spec.floors || [], requestText) || (subtype === 'skinny-house' && (spec.building?.totalStoreys || 1) > 3);
  const storeys = Math.max(1, spec.building?.totalStoreys || (subtype === 'skinny-house' ? 4 : 2));
  const storeyHeight = (subtype === 'stacked-duplex') ? 10 : 11;
  
  const palettes: Record<VillaSubtype, any> = {
    generic: { structure: '#1f2937', primary: '#ffffff', accent: '#9c6644', void: '#bae6fd' },
    mediterranean: { structure: '#606c38', primary: '#f2e8cf', accent: '#bc6c25', void: '#a8dadc' },
    modernist: { structure: '#212529', primary: '#ffffff', accent: '#6c757d', void: '#caf0f8' },
    palladian: { structure: '#3e2723', primary: '#f8f9fa', accent: '#ced4da', void: '#dee2e6' },
    tropical: { structure: '#252422', primary: '#fffcf2', accent: '#eb5e28', void: '#ebf2fa' },
    'indian-duplex': { structure: '#4a3728', primary: '#fdfdfd', accent: '#8b4513', void: '#ebcf97' },
    'stilt-plus-four': { structure: '#212529', primary: '#e5e5e5', accent: '#b45309', void: '#caf0f8' },
    'skinny-house': { structure: '#343a40', primary: '#ffffff', accent: '#495057', void: '#ced4da' },
    'stacked-duplex': { structure: '#212529', primary: '#f8f9fa', accent: '#8b4513', void: '#dee2e6' },
    'terrace-house': { structure: '#3e2723', primary: '#e0dcd6', accent: '#6b4226', void: '#b4ccd8' }
  };
  const palette = palettes[subtype];

  const blocks: string[] = [
    `// ARCHGPT DESIGN INTENT ENGINE v2.3 [Subtype: ${subtype}]`,
    emitDslBlock('House', {
      width: buildableWidth,
      height: (storeys * storeyHeight) + 6,
      depth: buildableDepth,
      style: subtype,
      storeys,
      plotWidthFt: plotWidth,
      plotDepthFt: plotDepth,
      hasBasement,
      hasLift,
      designIntent: `vertical-residential-${subtype}`
    })
  ];

  // 3. CORE CIRCULATION
  const coreH = solver.validateContinuity(storeys, storeyHeight) + (hasBasement ? 10 : 0);
  const coreX = (subtype === 'skinny-house') ? -buildableWidth/2 + 2 : -buildableWidth/2 + 5;

  blocks.push('', emitDslBlock('create core', {
    name: 'Vertical Circulation',
    width: (subtype === 'skinny-house' ? 4 : 8), height: coreH, depth: (subtype === 'skinny-house' ? 6 : 10),
    position: [coreX, coreH/2 - (hasBasement ? 10 : 0), 0],
    color: palette.structure
  }));

  // 4. FLOOR GENERATION
  for (let i = 0; i < storeys; i++) {
    const floorY = 1.5 + (i * storeyHeight);
    
    // STACKED DUPLEX LOGIC: External private entrances
    if (subtype === 'stacked-duplex' && i === 2) {
      blocks.push('', emitDslBlock('create balcony', {
        name: 'Upper Unit Private Entrance',
        width: 6, height: 0.5, depth: 10,
        position: [buildableWidth/2 + 3, floorY, buildableDepth/2 - 5],
        color: palette.accent
      }));
    }

    blocks.push('', emitDslBlock('create floor', {
      name: `L${i} Slab`,
      width: buildableWidth, height: 0.8, depth: buildableDepth,
      position: [0, floorY, 0],
      color: palette.primary
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: `L${i} Facade`,
      width: buildableWidth, height: storeyHeight, depth: buildableDepth,
      position: [0, floorY + storeyHeight/2, 0],
      color: palette.primary,
      opacity: (subtype === 'skinny-house' && i > 0) ? 0.4 : 1.0 // Transparency for light wells
    }));

    // TERRACE HOUSE BALCONIES
    if (subtype === 'terrace-house' && i > 0) {
      blocks.push('', emitDslBlock('create balcony', {
        name: `L${i} Front Balcony`,
        width: buildableWidth, height: 0.4, depth: 3,
        position: [0, floorY + 0.1, buildableDepth/2 + 1.5],
        color: palette.accent
      }));
    }
  }

  return blocks.join('\n');
}

export function parseHouseDsl(dslSource: string): HouseDslModel {
  const source = String(dslSource || '').replace(/\/\/.*$/gm, '').trim();
  const requestText = '';
  const defaultHouse: HouseDslModel['house'] = {
    width: 0, height: 0, depth: 0, style: 'contemporary', roadFacing: 'north', mainEntranceFacing: 'north', storeys: 1, plotSpecified: false, hasBasement: false, hasLift: false, source: 'generated',
  };
  if (!source) { return { house: defaultHouse, shapes: [] }; }
  const houseMatch = source.match(/(?:^|\n)\s*House\s*\{([\s\S]*?)\}/i);
  const house = houseMatch ? parseHouseBlock(houseMatch[1], requestText) : defaultHouse;
  const shapes: HouseDslShape[] = [];
  const createRegex = /(?:^|\n)\s*create\s+([A-Za-z][\w-]*)\s*\{([\s\S]*?)\}/gi;
  let match: RegExpExecArray | null;
  while ((match = createRegex.exec(source))) {
    shapes.push(parseShape(match[1], match[2]));
  }
  return { house: { ...defaultHouse, ...house }, shapes };
}

export { facingToRotation };