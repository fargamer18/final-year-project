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
};

const DEFAULT_STOREY_HEIGHTS: Record<string, number> = {
  minimal: 9.2,
  modern: 9.6,
  contemporary: 9.6,
  traditional: 10,
  luxury: 10.2,
  indian: 9.8,
  villa: 8.85,
};

function isBasementLevel(level: string) {
  return /basement/i.test(String(level || ''));
}

function normalizeStyle(style?: string, requestText = '') {
  const normalized = String(style || '').trim().toLowerCase();
  if (normalized) {
    return normalized;
  }

  const lowerRequest = String(requestText || '').toLowerCase();
  if (/\btraditional\b/.test(lowerRequest)) return 'traditional';
  if (/\bminimal\b/.test(lowerRequest)) return 'minimal';
  if (/\bluxury\b/.test(lowerRequest)) return 'luxury';
  if (/\bindian\b/.test(lowerRequest)) return 'indian';
  if (/\bvilla\b/.test(lowerRequest)) return 'villa';
  if (/\bmodern\b/.test(lowerRequest) || /\bmordern\b/.test(lowerRequest)) return 'modern';
  return 'contemporary';
}

function normalizeFacing(facing?: string) {
  const normalized = String(facing || '').trim().toLowerCase();
  if (['north', 'east', 'south', 'west'].includes(normalized)) {
    return normalized;
  }
  return 'north';
}

function facingToRotation(facing?: string) {
  switch (normalizeFacing(facing)) {
    case 'east':
      return Math.PI / 2;
    case 'south':
      return Math.PI;
    case 'west':
      return -Math.PI / 2;
    default:
      return 0;
  }
}

function toNumber(value: unknown): number | undefined {
  const candidate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : undefined;
}

function toVector3(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length < 3) {
    return undefined;
  }

  const coords = value.slice(0, 3).map((item) => toNumber(item));
  if (coords.some((coord) => coord === undefined)) {
    return undefined;
  }

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
  let current = '';
  let quote: '"' | '\'' | null = null;
  let escape = false;
  let depth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      current += char;
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      current += char;
      continue;
    }

    if (char === '[' || char === '{' || char === '(') {
      depth += 1;
    }

    if (char === ']' || char === '}' || char === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseDslValue(value: string): unknown {
  const trimmed = value.trim().replace(/,\s*$/, '');
  if (!trimmed) {
    return '';
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, '\'');
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed === 'null') {
    return null;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return splitDslParts(trimmed.slice(1, -1)).map((part) => parseDslValue(part));
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseDslProperties(trimmed.slice(1, -1));
  }

  return trimmed;
}

function parseDslProperties(block: string): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  splitDslParts(block).forEach((part) => {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) {
      return;
    }

    const key = part.slice(0, colonIndex).trim();
    const rawValue = part.slice(colonIndex + 1).trim();
    if (!key) {
      return;
    }

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

function computeFootprint(spec: HouseDslSpec, storeys: number, hasBasement: boolean, hasLift: boolean) {
  const requestText = String(spec.request || '');
  const style = normalizeStyle(spec.building?.style, requestText);
  const baseline = STYLE_DIMENSIONS[style] || STYLE_DIMENSIONS.contemporary;
  const plotWidthFt = toNumber(spec.site?.plotWidthFt);
  const plotDepthFt = toNumber(spec.site?.plotDepthFt);
  const plotSpecified = Boolean(plotWidthFt && plotWidthFt > 0 && plotDepthFt && plotDepthFt > 0);

  let width = baseline.width + (hasLift ? 3 : 0) + (storeys > 3 ? 2 : 0);
  let depth = baseline.depth + (hasBasement ? 2 : 0);

  if (plotSpecified && plotWidthFt && plotDepthFt) {
    width = Math.max(24, Math.min(width, plotWidthFt - 6));
    depth = Math.max(18, Math.min(depth, plotDepthFt - 8));
  }

  return {
    style,
    width: roundDimension(width),
    depth: roundDimension(depth),
    plotSpecified,
    plotWidthFt: plotSpecified ? plotWidthFt : undefined,
    plotDepthFt: plotSpecified ? plotDepthFt : undefined,
    roadFacing: normalizeFacing(spec.site?.roadFacing || spec.facade?.mainEntranceFacing),
    mainEntranceFacing: normalizeFacing(spec.facade?.mainEntranceFacing || spec.site?.mainEntranceFacing || spec.site?.roadFacing),
  };
}

function emitDslBlock(keyword: string, properties: Record<string, unknown>) {
  const lines = [`${keyword} {`];
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    lines.push(`  ${key}: ${serializeDslValue(value)},`);
  }
  lines.push('}');
  return lines.join('\n');
}

function serializeDslValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => serializeDslValue(entry)).join(', ')}]`;
  }

  if (typeof value === 'number') {
    return formatNumber(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (value === null) {
    return 'null';
  }

  return JSON.stringify(String(value));
}

function requestHasFeature(requestText: string, featurePattern: RegExp, negatedPatterns: RegExp[] = []) {
  const normalizedRequest = String(requestText || '');
  if (negatedPatterns.some((pattern) => pattern.test(normalizedRequest))) {
    return false;
  }

  return featurePattern.test(normalizedRequest);
}

function hasLiftCore(floors: HouseDslFloor[], requestText: string) {
  return floors.some((floor) => Array.isArray(floor.core) && floor.core.some((entry) => /lift/i.test(String(entry)))) || requestHasFeature(requestText, /\blift\b|\belevator\b/i, [/\bno\s+lift\b/i, /\bwithout\s+lift\b/i, /\blift[-\s]?free\b/i]);
}

function hasBasementFloor(floors: HouseDslFloor[], requestText: string) {
  return floors.some((floor) => isBasementLevel(floor.level)) || requestHasFeature(requestText, /\bbasement\b/i, [/\bno\s+basement\b/i, /\bwithout\s+basement\b/i, /\bbasement[-\s]?free\b/i, /\bexclude\s+basement\b/i]);
}

export function buildHouseDsl(spec: HouseDslSpec, floorsInput: HouseDslFloor[] = []) {
  const floors = Array.isArray(floorsInput) && floorsInput.length > 0
    ? floorsInput
    : (Array.isArray(spec.floors) ? spec.floors : []);
  const requestText = String(spec.request || '');
  const aboveGroundFloors = floors.filter((floor) => !isBasementLevel(floor.level));
  const storeys = Math.max(1, aboveGroundFloors.length || Math.trunc(toNumber(spec.building?.totalStoreys) || 0) || 1);
  const hasBasement = hasBasementFloor(floors, requestText);
  const hasLift = hasLiftCore(floors, requestText);
  const footprint = computeFootprint(spec, storeys, hasBasement, hasLift);
  const storeyHeight = DEFAULT_STOREY_HEIGHTS[footprint.style] || DEFAULT_STOREY_HEIGHTS.contemporary;
  const foundationHeight = 1.1;
  const basementHeight = hasBasement ? 8.2 : 0;
  const slabThickness = 0.45;
  const wallThickness = 0.32;
  const roofHeight = 0.85;
  const totalHeight = foundationHeight + basementHeight + storeys * storeyHeight + roofHeight;
  const mainFacing = footprint.mainEntranceFacing || footprint.roadFacing;
  const requestLabel = spec.source || 'generated';
  const isVillaStyle = footprint.style === 'villa' || footprint.style === 'luxury';
  const stylePalette = isVillaStyle
    ? {
        foundation: '#211428',
        basement: '#120d1a',
        floorGround: '#e8dccb',
        floorUpper: '#ddcfbe',
        wallFront: '#f7f2ea',
        wallRear: '#e8dccb',
        wallSide: '#d9c8b2',
        accent: '#c7a77f',
        door: '#8a5a33',
        window: '#a8c7d8',
        balcony: '#c8b08b',
        core: '#b87fa2',
        roof: '#5d5248',
      }
    : null;

  const blocks: string[] = [
    '// Auto-generated from the house spec for DSL-driven 3D rendering',
    emitDslBlock('House', {
      width: footprint.width,
      height: totalHeight,
      depth: footprint.depth,
      style: footprint.style,
      roadFacing: footprint.roadFacing,
      mainEntranceFacing: mainFacing,
      storeys,
      plotSpecified: footprint.plotSpecified,
      ...(footprint.plotWidthFt ? { plotWidthFt: footprint.plotWidthFt } : {}),
      ...(footprint.plotDepthFt ? { plotDepthFt: footprint.plotDepthFt } : {}),
      hasBasement,
      hasLift,
      source: requestLabel,
    }),
  ];

  blocks.push('', emitDslBlock('create foundation', {
    name: 'Plinth',
    width: roundDimension(footprint.width + 1.2),
    height: foundationHeight,
    depth: roundDimension(footprint.depth + 1.2),
    position: [0, -foundationHeight / 2, 0],
    color: stylePalette?.foundation || '#251a37',
    roughness: 0.96,
  }));

  if (hasBasement) {
    blocks.push('', emitDslBlock('create basement', {
      name: 'Basement shell',
      width: roundDimension(footprint.width * 0.98),
      height: basementHeight,
      depth: roundDimension(footprint.depth * 0.98),
      position: [0, -(foundationHeight + basementHeight / 2), 0],
      color: stylePalette?.basement || '#120d1a',
      opacity: 0.98,
      roughness: 0.98,
    }));
  }

  const villaProfiles = isVillaStyle
    ? [
        { widthFactor: 1, depthFactor: 1, shiftX: 0, shiftZ: 0 },
        { widthFactor: 0.84, depthFactor: 0.76, shiftX: roundDimension(footprint.width * 0.04), shiftZ: roundDimension(-footprint.depth * 0.1) },
        { widthFactor: 0.68, depthFactor: 0.58, shiftX: roundDimension(-footprint.width * 0.05), shiftZ: roundDimension(-footprint.depth * 0.2) },
      ]
    : [];

  aboveGroundFloors.forEach((floor, index) => {
    const floorLabel = floor.level || (index === 0 ? 'Ground floor' : `${index}th floor`);
    const floorBottom = foundationHeight + index * storeyHeight;
    const wallHeight = storeyHeight - slabThickness;
    const floorProfile = isVillaStyle ? villaProfiles[Math.min(index, villaProfiles.length - 1)] : { widthFactor: 1, depthFactor: 1, shiftX: 0, shiftZ: 0 };
    const floorWidth = roundDimension(footprint.width * floorProfile.widthFactor);
    const floorDepth = roundDimension(footprint.depth * floorProfile.depthFactor);
    const floorCenterX = roundDimension(floorProfile.shiftX || 0);
    const floorCenterZ = roundDimension(floorProfile.shiftZ || 0);
    const slabCenterY = floorBottom + slabThickness / 2;
    const wallCenterY = floorBottom + slabThickness + wallHeight / 2;
    const frontFacadeZ = roundDimension(floorCenterZ + floorDepth / 2 - wallThickness / 2);
    const rearFacadeZ = roundDimension(floorCenterZ - floorDepth / 2 + wallThickness / 2);
    const leftFacadeX = roundDimension(floorCenterX - floorWidth / 2 + wallThickness / 2);
    const rightFacadeX = roundDimension(floorCenterX + floorWidth / 2 - wallThickness / 2);
    const windowCount = Math.max(isVillaStyle ? 3 : 2, Math.min(isVillaStyle ? 5 : 4, Math.round(floorWidth / 9)));
    const windowSpan = floorWidth * (isVillaStyle ? 0.66 : 0.58);
    const windowStep = windowCount > 1 ? windowSpan / (windowCount - 1) : 0;
    const windowStartX = floorCenterX - windowSpan / 2;
    const hasBalcony = floor.spaces.some((space) => /balcony|terrace/i.test(String(space)));

    blocks.push('', emitDslBlock('create floor', {
      name: `${floorLabel} slab`,
      width: floorWidth,
      height: slabThickness,
      depth: floorDepth,
      position: [floorCenterX, slabCenterY, floorCenterZ],
      color: isVillaStyle ? (index === 0 ? stylePalette?.floorGround : stylePalette?.floorUpper) : (index === 0 ? '#6d28d9' : '#452c79'),
      roughness: 0.92,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: `${floorLabel} front facade`,
      width: floorWidth,
      height: wallHeight,
      depth: wallThickness,
      position: [floorCenterX, wallCenterY, frontFacadeZ],
      color: isVillaStyle ? (stylePalette?.wallFront || '#2a1d45') : '#2a1d45',
      opacity: isVillaStyle ? 0.84 : 0.62,
      roughness: 0.86,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: `${floorLabel} rear facade`,
      width: floorWidth,
      height: wallHeight,
      depth: wallThickness,
      position: [floorCenterX, wallCenterY, rearFacadeZ],
      color: isVillaStyle ? (stylePalette?.wallRear || '#22192f') : '#22192f',
      opacity: isVillaStyle ? 0.82 : 0.72,
      roughness: 0.9,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: `${floorLabel} left facade`,
      width: wallThickness,
      height: wallHeight,
      depth: floorDepth,
      position: [leftFacadeX, wallCenterY, floorCenterZ],
      color: isVillaStyle ? (stylePalette?.wallSide || '#1f172c') : '#1f172c',
      opacity: isVillaStyle ? 0.84 : 0.78,
      roughness: 0.94,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: `${floorLabel} right facade`,
      width: wallThickness,
      height: wallHeight,
      depth: floorDepth,
      position: [rightFacadeX, wallCenterY, floorCenterZ],
      color: isVillaStyle ? (stylePalette?.wallSide || '#1f172c') : '#1f172c',
      opacity: isVillaStyle ? 0.84 : 0.78,
      roughness: 0.94,
    }));

    if (isVillaStyle && index === 0) {
      const porticoWidth = roundDimension(Math.max(floorWidth * 0.34, 11));
      const porticoDepth = roundDimension(Math.max(4.8, footprint.depth * 0.16));
      const porticoCenterX = roundDimension(floorCenterX + floorWidth * 0.18);
      const porticoCenterZ = roundDimension(floorCenterZ + floorDepth / 2 + porticoDepth / 2 - 0.15);

      blocks.push('', emitDslBlock('create floor', {
        name: 'Entry portico',
        width: porticoWidth,
        height: 0.3,
        depth: porticoDepth,
        position: [porticoCenterX, floorBottom + 0.15, porticoCenterZ],
        color: stylePalette?.accent || '#9f7aea',
        roughness: 0.72,
      }));

      blocks.push('', emitDslBlock('create wall', {
        name: 'Entry column left',
        width: 0.32,
        height: 7.4,
        depth: 0.32,
        position: [roundDimension(porticoCenterX - porticoWidth * 0.22), floorBottom + 3.7, roundDimension(porticoCenterZ - porticoDepth * 0.22)],
        color: stylePalette?.accent || '#9f7aea',
        roughness: 0.72,
      }));

      blocks.push('', emitDslBlock('create wall', {
        name: 'Entry column right',
        width: 0.32,
        height: 7.4,
        depth: 0.32,
        position: [roundDimension(porticoCenterX + porticoWidth * 0.22), floorBottom + 3.7, roundDimension(porticoCenterZ - porticoDepth * 0.22)],
        color: stylePalette?.accent || '#9f7aea',
        roughness: 0.72,
      }));
    }

    if (index === 0) {
      blocks.push('', emitDslBlock('create door', {
        name: 'Main entry door',
        width: isVillaStyle ? 3.6 : 3.2,
        height: isVillaStyle ? 5 : 4.6,
        depth: 0.22,
        position: [floorCenterX, floorBottom + (isVillaStyle ? 2.55 : 2.35), roundDimension(floorCenterZ + floorDepth / 2 + 0.15)],
        color: isVillaStyle ? (stylePalette?.door || '#7c4a21') : '#7c4a21',
        roughness: 0.58,
      }));
    }

    for (let column = 0; column < windowCount; column += 1) {
      const windowX = windowStartX + column * windowStep;
      blocks.push('', emitDslBlock('create window', {
        name: `${floorLabel} front window ${column + 1}`,
        width: roundDimension(Math.min(isVillaStyle ? 3.4 : 2.8, Math.max(2.1, floorWidth * 0.08))),
        height: isVillaStyle ? 3.1 : 2.9,
        depth: 0.18,
        position: [roundDimension(windowX), roundDimension(wallCenterY + 0.7), roundDimension(frontFacadeZ + 0.12)],
        color: isVillaStyle ? (stylePalette?.window || '#d8b4fe') : '#d8b4fe',
        opacity: isVillaStyle ? 0.64 : 0.72,
        emissive: isVillaStyle ? '#94b8c9' : '#8b5cf6',
      }));
    }

    if (hasBalcony) {
      const balconyWidth = roundDimension(Math.min(isVillaStyle ? 12.4 : 9, floorWidth * (isVillaStyle ? 0.36 : 0.28)));
      const balconyDepth = isVillaStyle ? 3.1 : 2.4;
      const balconyCenterX = roundDimension(floorCenterX + floorWidth * (isVillaStyle ? 0.14 : 0.24));
      const balconyCenterZ = roundDimension(floorCenterZ + floorDepth / 2 + balconyDepth / 2 - (isVillaStyle ? 0.1 : 0));

      blocks.push('', emitDslBlock('create balcony', {
        name: `${floorLabel} balcony`,
        width: balconyWidth,
        height: 0.4,
        depth: balconyDepth,
        position: [balconyCenterX, roundDimension(wallCenterY - wallHeight * 0.08), balconyCenterZ],
        color: stylePalette?.balcony || '#9f7aea',
        opacity: 0.92,
        roughness: 0.66,
      }));
    }
  });

  if (hasLift) {
    blocks.push('', emitDslBlock('create core', {
      name: 'Lift core',
      width: 4.4,
      height: storeys * storeyHeight + roofHeight,
      depth: 4.4,
      position: [roundDimension(footprint.width / 2 - 6.4), foundationHeight + (storeys * storeyHeight + roofHeight) / 2, roundDimension(-footprint.depth / 2 + 6.4)],
      color: stylePalette?.core || '#f472b6',
      opacity: 0.92,
      emissive: isVillaStyle ? '#8b5cf6' : '#7e22ce',
      roughness: 0.42,
    }));
  }

  const roofCenterY = foundationHeight + storeys * storeyHeight + roofHeight / 2;
  const roofWidth = roundDimension(isVillaStyle ? Math.max(footprint.width * 0.78, 18) : footprint.width + 0.8);
  const roofDepth = roundDimension(isVillaStyle ? Math.max(footprint.depth * 0.66, 16) : footprint.depth + 0.8);

  blocks.push('', emitDslBlock('create roof', {
    name: 'Terrace roof',
    width: roofWidth,
    height: roofHeight,
    depth: roofDepth,
    position: [0, roofCenterY, 0],
    color: stylePalette?.roof || '#1b1326',
    opacity: 0.98,
    roughness: 0.94,
  }));

  if (isVillaStyle) {
    blocks.push('', emitDslBlock('create wall', {
      name: 'Roof parapet front',
      width: roofWidth,
      height: 1.2,
      depth: 0.18,
      position: [0, roofCenterY + 0.62, roundDimension(roofDepth / 2 - 0.09)],
      color: stylePalette?.accent || '#c8b08b',
      opacity: 0.88,
      roughness: 0.74,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: 'Roof parapet back',
      width: roofWidth,
      height: 1.2,
      depth: 0.18,
      position: [0, roofCenterY + 0.62, roundDimension(-(roofDepth / 2 - 0.09))],
      color: stylePalette?.accent || '#c8b08b',
      opacity: 0.88,
      roughness: 0.74,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: 'Roof parapet left',
      width: 0.18,
      height: 1.2,
      depth: roofDepth,
      position: [roundDimension(-roofWidth / 2 + 0.09), roofCenterY + 0.62, 0],
      color: stylePalette?.accent || '#c8b08b',
      opacity: 0.88,
      roughness: 0.74,
    }));

    blocks.push('', emitDslBlock('create wall', {
      name: 'Roof parapet right',
      width: 0.18,
      height: 1.2,
      depth: roofDepth,
      position: [roundDimension(roofWidth / 2 - 0.09), roofCenterY + 0.62, 0],
      color: stylePalette?.accent || '#c8b08b',
      opacity: 0.88,
      roughness: 0.74,
    }));
  }

  return blocks.join('\n');
}

export function parseHouseDsl(dslSource: string): HouseDslModel {
  const source = String(dslSource || '').replace(/\/\/.*$/gm, '').trim();
  const requestText = '';
  const defaultHouse: HouseDslModel['house'] = {
    width: 0,
    height: 0,
    depth: 0,
    style: 'contemporary',
    roadFacing: 'north',
    mainEntranceFacing: 'north',
    storeys: 1,
    plotSpecified: false,
    hasBasement: false,
    hasLift: false,
    source: 'generated',
  };

  if (!source) {
    return { house: defaultHouse, shapes: [] };
  }

  const houseMatch = source.match(/(?:^|\n)\s*House\s*\{([\s\S]*?)\}/i);
  const house = houseMatch ? parseHouseBlock(houseMatch[1], requestText) : defaultHouse;
  const shapes: HouseDslShape[] = [];
  const createRegex = /(?:^|\n)\s*create\s+([A-Za-z][\w-]*)\s*\{([\s\S]*?)\}/gi;
  let match: RegExpExecArray | null;

  while ((match = createRegex.exec(source))) {
    shapes.push(parseShape(match[1], match[2]));
  }

  return {
    house: {
      ...defaultHouse,
      ...house,
    },
    shapes,
  };
}

export { facingToRotation };