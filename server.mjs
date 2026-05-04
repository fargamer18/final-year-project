import { createServer } from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const maxBodySize = 10_000_000; // Increased to 10MB for Vision API payloads

async function loadEnvFile() {
  const envPath = path.join(rootDir, '.env');

  try {
    const envText = await readFile(envPath, 'utf8');
    for (const rawLine of envText.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const equalsIndex = line.indexOf('=');
      if (equalsIndex === -1) {
        continue;
      }

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (!key || key in process.env) {
        continue;
      }

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // No .env file present; continue with existing process environment.
  }
}

await loadEnvFile();

const port = Number(process.env.PORT || 3001);
const llmEndpoint = process.env.LLM_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const llmModel = process.env.LLM_MODEL || 'gemini-3.1-flash-lite';
const llmApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || '';
const sketchfabApiKey = process.env.SKETCHFAB_API_KEY || '';
const mistralApiKey = process.env.MISTRAL_API_KEY || '';
const llmTemperature = Number(process.env.LLM_TEMPERATURE || 0.2);
const defaultLawLlmEndpoint = 'http://36.255.14.42:7821/chat';
const lawLlmEndpoint = trimSlash(process.env.LAW_LLM_ENDPOINT || defaultLawLlmEndpoint);
const lawLlmModel = process.env.LAW_LLM_MODEL || llmModel;
const lawLlmApiKey = process.env.LAW_LLM_API_KEY || process.env.LAW_API_KEY || llmApiKey;
const lawLlmTemperature = Number(process.env.LAW_LLM_TEMPERATURE || process.env.LLM_TEMPERATURE || 0.15);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.dsl': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.dxf': 'application/dxf; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

const allowedStyles = new Set(['villa', 'modern', 'contemporary', 'traditional', 'minimal', 'indian', 'a-frame', 'farmhouse', 'bungalow', 'studio', 'townhouse', 'row-house', 'duplex', 'apartment', 'mixed-use', 'luxury']);
const allowedFacings = new Set(['north', 'east', 'south', 'west']);
const defaultMaterialsByStyle = {
  villa: {
    wall: 'limestone',
    slab: 'marble',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  modern: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  contemporary: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  traditional: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'tileRoof',
    door: 'mahogany',
    window: 'frostedGlass'
  },
  minimal: {
    wall: 'whitePaint',
    slab: 'polishedConcrete',
    roof: 'concrete',
    door: 'oak',
    window: 'clearGlass'
  },
  indian: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'tileRoof',
    door: 'mahogany',
    window: 'frostedGlass'
  },
  'a-frame': {
    wall: 'wood',
    slab: 'concrete',
    roof: 'tileRoof',
    door: 'oak',
    window: 'clearGlass'
  },
  farmhouse: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'tileRoof',
    door: 'oak',
    window: 'clearGlass'
  },
  bungalow: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'tileRoof',
    door: 'oak',
    window: 'clearGlass'
  },
  studio: {
    wall: 'whitePaint',
    slab: 'polishedConcrete',
    roof: 'concrete',
    door: 'oak',
    window: 'clearGlass'
  },
  townhouse: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  'row-house': {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  duplex: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  apartment: {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  },
  'mixed-use': {
    wall: 'whiteBrick',
    slab: 'concrete',
    roof: 'concrete',
    door: 'walnut',
    window: 'clearGlass'
  }
};

const dslParserSummary = [
  'Supported syntaxes: create Type { props }, Type { props }, move id to x, y, z, rotate id by x, y, z, scale id to x[, y, z], applyMaterial { material: "oak" }, delete id, duplicate id, mirror id x|y|z.',
  'Allowed created types: Wall, Prism, House/house, Door, Window, Roof, Foundation, Beam, Column, Floor, physics, simulate, earthquake.',
  'House and building properties: width, height, depth, wallThickness, position, name, material, and nested material objects.',
  'Use the DSL grammar to generate a new house from the request. Do not copy sample house layouts or previous rendered examples.'
].join('\n');

const dslGrammarReference = {
  parserSummary: dslParserSummary
};

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function sendJson(res, statusCode, payload) {
  writeApiCorsHeaders(res);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function writeApiCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendText(res, statusCode, text) {
  writeApiCorsHeaders(res);
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function normalizeFacing(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  return allowedFacings.has(normalized) ? normalized : null;
}

function normalizeStyle(value, requestText = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (allowedStyles.has(normalized)) {
    return normalized;
  }

  const lowerRequest = String(requestText || '').toLowerCase();
  if (/\bmodern\b/.test(lowerRequest)) {
    return 'modern';
  }
  if (/\bcontemporary\b/.test(lowerRequest)) {
    return 'contemporary';
  }
  if (/\bminimal\b/.test(lowerRequest)) {
    return 'minimal';
  }
  if (/\bluxury\b/.test(lowerRequest)) {
    return 'luxury';
  }
  if (/\btraditional\b/.test(lowerRequest) || /\bheritage\b/.test(lowerRequest)) {
    return 'traditional';
  }
  if (/\bindian\b/.test(lowerRequest)) {
    return 'indian';
  }
  if (/\ba[-\s]?frame\b/.test(lowerRequest) || /\baframe\b/.test(lowerRequest)) {
    return 'a-frame';
  }
  if (/\bfarmhouse\b/.test(lowerRequest) || /\bcountry\s+home\b/.test(lowerRequest) || /\brural\s+home\b/.test(lowerRequest)) {
    return 'farmhouse';
  }
  if (/\bbungalow\b/.test(lowerRequest)) {
    return 'bungalow';
  }
  if (/\btown\s?house\b/.test(lowerRequest)) {
    return 'townhouse';
  }
  if (/\brow\s?house\b/.test(lowerRequest) || /\bterraced\s+house\b/.test(lowerRequest)) {
    return 'row-house';
  }
  if (/\bduplex\b/.test(lowerRequest)) {
    return 'duplex';
  }
  if (/\bstudio\b/.test(lowerRequest) || /\b1\s*rk\b/.test(lowerRequest)) {
    return 'studio';
  }
  if (/\bapartment\b/.test(lowerRequest) || /\bflat\b/.test(lowerRequest) || /\bcondo(?:minium)?\b/.test(lowerRequest)) {
    return 'apartment';
  }
  if (/\bmixed[-\s]?use\b/.test(lowerRequest)) {
    return 'mixed-use';
  }
  if (/\bvilla\b/.test(lowerRequest)) {
    return 'villa';
  }

  return null;
}

function parseStoreysFromRequest(requestText) {
  const text = String(requestText || '');
  const groundPlusMatch = text.match(/\b(?:g|ground)\s*(?:\+|plus)\s*(\d+)\b/i);
  if (groundPlusMatch) {
    return Math.max(1, parseInt(groundPlusMatch[1], 10) + 1);
  }

  const storeyMatch = text.match(/\b(\d+)\s*(?:storey|story|floor)s?\b/i);
  if (storeyMatch) {
    return Math.max(1, parseInt(storeyMatch[1], 10));
  }

  if (/\bduplex\b/i.test(text)) {
    return 2;
  }

  if (/\btiny\s*homes?\b|\btinyhouse(?:s)?\b/i.test(text)) {
    return 1;
  }

  if (/\bstudio\b|\b1\s*rk\b/i.test(text)) {
    return 1;
  }

  if (/\ba[-\s]?frame\b|\bcottage\b|\bcape[-\s]?cod\b|\branch(?:es)?\b/i.test(text)) {
    return 1;
  }

  if (/\bfarmhouse\b/i.test(text)) {
    return 2;
  }

  if (/\bbungalow\b/i.test(text)) {
    return 1;
  }

  if (/\btown(?:house|home)s?\b|\brow[-\s]?hous(?:e|es)\b/i.test(text)) {
    return 2;
  }

  if (/\bapartment(?:s)?\b|\bflat(?:s)?\b|\bcondo(?:minium)?s?\b|\bco[-\s]?ops?\b|\bchawls?\b/i.test(text)) {
    return 4;
  }

  if (/\bmixed[-\s]?use\b/i.test(text)) {
    return 3;
  }

  if (/\bvillas?\b|\bluxury\s+homes?\b|\bpalaces?\b|\bmahal(?:s)?\b/i.test(text)) {
    return 3;
  }

  if (/\bcolonials?\b|\bfederals?\b|\bcraftsman(?:s)?\b|\bcontemporary\b|\bmid[-\s]?century\s+modern\b|\bmidcentury\s+modern\b|\bmediterranean(?:s)?\b|\beco[-\s]?friendly\s+homes?\b|\bsustainable\s+homes?\b|\bstilt(?:ed)?\s+hous(?:e|es)\b|\bcourtyard\s+hous(?:e|es)\b|\bhavelis?\b|\bladakhi\s+hous(?:e|es)\b|\bsingle[-\s]?family\s+hous(?:e|es)\b|\bsingle[-\s]?family\s+homes?\b/i.test(text)) {
    return 2;
  }

  return 1;
}

function classifyHouseFallbackRequest(requestText, dslHints = {}) {
  const lowerRequest = String(requestText || '').toLowerCase();
  const explicitStyle = normalizeStyle(dslHints.style || null, requestText);

  if (/\bmixed[-\s]?use\b/.test(lowerRequest)) {
    return { style: 'mixed-use', use: 'mixed_use', defaultStoreys: 3, plotWidthFt: 38, plotDepthFt: 26, isVillaLike: false };
  }

  if (/\btiny\s*homes?\b|\btinyhouse(?:s)?\b/.test(lowerRequest)) {
    return { style: 'studio', use: 'single_family', defaultStoreys: 1, plotWidthFt: 22, plotDepthFt: 16, isVillaLike: false };
  }

  if (/\bstudio\b|\b1\s*rk\b/.test(lowerRequest)) {
    return { style: 'studio', use: 'single_family', defaultStoreys: 1, plotWidthFt: 24, plotDepthFt: 18, isVillaLike: false };
  }

  if (/\ba[-\s]?frame\b|\baframe\b/.test(lowerRequest)) {
    return { style: 'a-frame', use: 'single_family', defaultStoreys: 1, plotWidthFt: 34, plotDepthFt: 26, isVillaLike: false };
  }

  if (/\bfarmhouse\b/.test(lowerRequest)) {
    return { style: 'farmhouse', use: 'single_family', defaultStoreys: 2, plotWidthFt: 60, plotDepthFt: 45, isVillaLike: false };
  }

  if (/\bbungalow\b/.test(lowerRequest)) {
    return { style: 'bungalow', use: 'single_family', defaultStoreys: 1, plotWidthFt: 38, plotDepthFt: 28, isVillaLike: false };
  }

  if (/\bcottages?\b/.test(lowerRequest)) {
    return { style: 'bungalow', use: 'single_family', defaultStoreys: 1, plotWidthFt: 34, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\branch(?:es)?\b/.test(lowerRequest)) {
    return { style: 'bungalow', use: 'single_family', defaultStoreys: 1, plotWidthFt: 38, plotDepthFt: 26, isVillaLike: false };
  }

  if (/\bcape[-\s]?cod\b/.test(lowerRequest)) {
    return { style: 'bungalow', use: 'single_family', defaultStoreys: 1, plotWidthFt: 36, plotDepthFt: 26, isVillaLike: false };
  }

  if (/\bcolonials?\b/.test(lowerRequest)) {
    return { style: 'traditional', use: 'single_family', defaultStoreys: 2, plotWidthFt: 36, plotDepthFt: 26, isVillaLike: false };
  }

  if (/\bfederals?\b/.test(lowerRequest)) {
    return { style: 'traditional', use: 'single_family', defaultStoreys: 2, plotWidthFt: 34, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bcraftsman(?:s)?\b/.test(lowerRequest)) {
    return { style: 'bungalow', use: 'single_family', defaultStoreys: 1, plotWidthFt: 36, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bmediterranean(?:s)?\b/.test(lowerRequest)) {
    return { style: 'villa', use: 'single_family', defaultStoreys: 2, plotWidthFt: 42, plotDepthFt: 30, isVillaLike: true };
  }

  if (/\bmid[-\s]?century\s+modern\b|\bmidcentury\s+modern\b/.test(lowerRequest)) {
    return { style: 'modern', use: 'single_family', defaultStoreys: 1, plotWidthFt: 36, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bcontemporary\b/.test(lowerRequest)) {
    return { style: 'contemporary', use: 'single_family', defaultStoreys: 2, plotWidthFt: 34, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bstilt(?:ed)?\s+hous(?:e|es)\b|\bstilt\s+hous(?:e|es)\b/.test(lowerRequest)) {
    return { style: 'indian', use: 'single_family', defaultStoreys: 2, plotWidthFt: 30, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bcourtyard\s+hous(?:e|es)\b/.test(lowerRequest)) {
    return { style: 'villa', use: 'single_family', defaultStoreys: 2, plotWidthFt: 38, plotDepthFt: 28, isVillaLike: true };
  }

  if (/\bhavelis?\b/.test(lowerRequest)) {
    return { style: 'villa', use: 'single_family', defaultStoreys: 2, plotWidthFt: 42, plotDepthFt: 30, isVillaLike: true };
  }

  if (/\bladakhi\s+hous(?:e|es)\b|\bladakh\s+hous(?:e|es)\b/.test(lowerRequest)) {
    return { style: 'traditional', use: 'single_family', defaultStoreys: 2, plotWidthFt: 34, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\beco[-\s]?friendly\s+homes?\b|\bgreen\s+homes?\b|\bsustainable\s+homes?\b/.test(lowerRequest)) {
    return { style: 'modern', use: 'single_family', defaultStoreys: 2, plotWidthFt: 32, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\bpalaces?\b|\bmahal(?:s)?\b/.test(lowerRequest)) {
    return { style: 'luxury', use: 'villa', defaultStoreys: 3, plotWidthFt: 70, plotDepthFt: 50, isVillaLike: true };
  }

  if (/\bduplex\b/.test(lowerRequest)) {
    return { style: 'duplex', use: 'single_family', defaultStoreys: 2, plotWidthFt: 34, plotDepthFt: 24, isVillaLike: false };
  }

  if (/\btown(?:house|home)s?\b|\btown\s?hous(?:e|es)\b/.test(lowerRequest)) {
    return { style: 'townhouse', use: 'single_family', defaultStoreys: 2, plotWidthFt: 28, plotDepthFt: 18, isVillaLike: false };
  }

  if (/\brow\s?hous(?:e|es)\b/.test(lowerRequest) || /\bterraced\s+hous(?:e|es)\b/.test(lowerRequest)) {
    return { style: 'row-house', use: 'single_family', defaultStoreys: 2, plotWidthFt: 26, plotDepthFt: 18, isVillaLike: false };
  }

  if (/\bcondo(?:minium)?s?\b/.test(lowerRequest)) {
    return { style: 'apartment', use: 'apartment', defaultStoreys: 4, plotWidthFt: 30, plotDepthFt: 22, isVillaLike: false };
  }

  if (/\bco[-\s]?ops?\b|\bcooperatives?\b/.test(lowerRequest)) {
    return { style: 'apartment', use: 'apartment', defaultStoreys: 4, plotWidthFt: 30, plotDepthFt: 22, isVillaLike: false };
  }

  if (/\bchawls?\b/.test(lowerRequest)) {
    return { style: 'apartment', use: 'apartment', defaultStoreys: 3, plotWidthFt: 28, plotDepthFt: 20, isVillaLike: false };
  }

  if (/\bapartment(?:s)?\b|\bflat(?:s)?\b/.test(lowerRequest)) {
    return { style: 'apartment', use: 'apartment', defaultStoreys: 4, plotWidthFt: 30, plotDepthFt: 22, isVillaLike: false };
  }

  if (/\bluxury\b/.test(lowerRequest) || /\bvillas?\b/.test(lowerRequest)) {
    return { style: explicitStyle === 'luxury' ? 'luxury' : 'villa', use: 'villa', defaultStoreys: 3, plotWidthFt: 60, plotDepthFt: 40, isVillaLike: true };
  }

  if (/\bsingle[-\s]?family\s+hous(?:e|es)\b|\bsingle[-\s]?family\s+homes?\b|\bdetached\s+homes?\b/.test(lowerRequest)) {
    return { style: 'contemporary', use: 'single_family', defaultStoreys: 2, plotWidthFt: 30, plotDepthFt: 40, isVillaLike: false };
  }

  const style = explicitStyle || 'modern';
  return {
    style,
    use: 'single_family',
    defaultStoreys: parseStoreysFromRequest(requestText),
    plotWidthFt: 30,
    plotDepthFt: 40,
    isVillaLike: style === 'villa' || style === 'luxury'
  };
}

function parseCount(requestText, pattern, fallback) {
  const match = String(requestText || '').match(pattern);
  return match ? Math.max(0, parseInt(match[1], 10)) : fallback;
}

function extractRequestHints(requestText) {
  const lowerRequest = String(requestText || '').toLowerCase();
  return {
    totalStoreys: parseStoreysFromRequest(requestText),
    streetFacing: /street facing|road facing/i.test(lowerRequest),
    styleHint: normalizeStyle(null, requestText),
    roadFacingHint: normalizeFacing(lowerRequest.match(/\b(north|east|south|west)\b/)?.[1]),
    bedroomCount: parseCount(requestText, /(\d+)\s*bed(?:room)?s?/i, 0),
    bathroomCount: parseCount(requestText, /(\d+)\s*bath(?:room)?s?/i, 0),
    parkingCount: parseCount(requestText, /(\d+)\s*(?:car\s*)?parking/i, /parking/i.test(lowerRequest) ? 1 : 0),
    balconyRequested: /\bbalcony\b/i.test(lowerRequest),
    terraceRequested: /\bterrace\b/i.test(lowerRequest) || /\broof deck\b/i.test(lowerRequest),
    liftRequested: /\blift\b|\belevator\b/i.test(lowerRequest),
    basementRequested: /\bbasement\b|\bcellar\b/i.test(lowerRequest),
    courtyardRequested: /\bcourtyard\b/i.test(lowerRequest),
    doubleHeightRequested: /\bdouble\s*height\b/i.test(lowerRequest),
    coveredParkingRequested: /\bcovered\s+parking\b|\bstilt\s+parking\b/i.test(lowerRequest),
    cornerPlot: /corner plot/i.test(lowerRequest)
  };
}

function parsePlotDimensionsFromText(requestText) {
  const match = String(requestText || '').match(/(?:plot|site|land|house)?[^\d]*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?\s*(?:[x×*])\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')?/i);
  if (!match) {
    return null;
  }

  return {
    width: parseFloat(match[1]),
    depth: parseFloat(match[2])
  };
}

function extractDslPreviewHints(dslPreview) {
  const text = String(dslPreview || '');
  const getNumber = pattern => {
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : null;
  };

  const getText = pattern => {
    const match = text.match(pattern);
    return match ? String(match[1]).trim().toLowerCase() : null;
  };

  return {
    plotWidthFt: getNumber(/\bwidth\s*:\s*(\d+(?:\.\d+)?)/i),
    plotDepthFt: getNumber(/\bdepth\s*:\s*(\d+(?:\.\d+)?)/i),
    wallHeightFt: getNumber(/\bheight\s*:\s*(\d+(?:\.\d+)?)/i),
    totalStoreys: getNumber(/\btotalStoreys\s*:\s*(\d+)/i),
    style: getText(/\bstyle\s*:\s*["']?([a-z]+)["']?/i),
    roadFacing: getText(/\broadFacing\s*:\s*["']?([a-z]+)["']?/i),
    streetFacing: /\bstreetFacing\s*:\s*true\b/i.test(text),
    wallMaterial: getText(/\b(?:walls?|wall)\s*:\s*["']?([a-z0-9_-]+)["']?/i),
    roofMaterial: getText(/\broof\s*:\s*["']?([a-z0-9_-]+)["']?/i),
    foundationMaterial: getText(/\bfoundation\s*:\s*["']?([a-z0-9_-]+)["']?/i),
    doorMaterial: getText(/\bdoor\s*:\s*["']?([a-z0-9_-]+)["']?/i),
    windowMaterial: getText(/\bwindow\s*:\s*["']?([a-z0-9_-]+)["']?/i)
  };
}

function buildFallbackFloorPlans(totalStoreys, villaRequested, terraceRequested) {
  return Array.from({ length: totalStoreys }, (_, floorIndex) => {
    const level = floorIndex === 0 ? 'ground' : floorIndex === 1 ? 'first' : floorIndex === 2 ? 'second' : `level_${floorIndex + 1}`;
    const rooms = {};

    if (floorIndex === 0) {
      rooms.living = 1;
      rooms.kitchen = 1;
      rooms.dining = 1;
      rooms.foyer = 1;
      rooms.bathroom = 1;
      rooms.parking = villaRequested ? 2 : 1;
    } else if (floorIndex === 1) {
      rooms.bedroom = 2;
      rooms.bathroom = 2;
      rooms.family_lounge = 1;
    } else {
      rooms.bedroom = 1;
      rooms.bathroom = 1;
      if (terraceRequested || villaRequested) {
        rooms.terrace = 1;
      }
      rooms.study = 1;
    }

    return {
      level,
      rooms,
      notes: villaRequested
        ? 'Villa floor generated from the DSL-aware fallback.'
        : 'Fallback floor generated from the request heuristics.'
    };
  });
}

function buildFallbackHouseSpec(requestText, previousSpec = null, intent = '', dslPreview = '') {
  const request = String(requestText || '').trim();
  const lowerRequest = request.toLowerCase();
  const requestPlot = parsePlotDimensionsFromText(request);
  const resolvedIntent = normalizeHouseRequestIntent(intent, requestText, previousSpec);
  const dslHints = resolvedIntent === 'modify' ? extractDslPreviewHints(dslPreview) : {};
  const hints = extractRequestHints(request);
  const houseBranch = classifyHouseFallbackRequest(request, dslHints);
  const style = houseBranch.style;
  const plotWidthFt = requestPlot?.width || dslHints.plotWidthFt || houseBranch.plotWidthFt;
  const plotDepthFt = requestPlot?.depth || dslHints.plotDepthFt || houseBranch.plotDepthFt;
  const roadFacing = normalizeFacing(dslHints.roadFacing || hints.roadFacingHint || 'north') || 'north';
  const baseStoreys = Number.isFinite(dslHints.totalStoreys)
    ? Math.max(1, Math.min(10, Math.trunc(dslHints.totalStoreys)))
    : houseBranch.defaultStoreys;
  const totalStoreys = (hints.balconyRequested || hints.terraceRequested || hints.liftRequested) && baseStoreys < 2
    ? 2
    : baseStoreys;
  const materialPreset = defaultMaterialsByStyle[style] || defaultMaterialsByStyle.modern;
  const roadWidthFt = 20;
  const isVillaLike = houseBranch.isVillaLike;
  const isApartmentLike = style === 'apartment' || style === 'mixed-use';

  const rawSpec = {
    status: 'ready',
    request,
    site: {
      plotWidthFt,
      plotDepthFt,
      roadFacing,
      northDirection: 'north',
      roadWidthFt,
      cornerPlot: /corner plot/i.test(lowerRequest)
    },
    building: {
      totalStoreys,
      style,
      use: houseBranch.use,
      maxHeightFt: dslHints.wallHeightFt ? dslHints.wallHeightFt * Math.max(totalStoreys, 1) : totalStoreys * (isVillaLike ? 9.5 : isApartmentLike ? 9.2 : 10),
      hasLift: Boolean(hints.liftRequested),
      hasBasement: Boolean(hints.basementRequested),
      hasCourtyard: Boolean(hints.courtyardRequested),
      hasDoubleHeightLiving: Boolean(hints.doubleHeightRequested),
      hasCoveredParking: Boolean(hints.coveredParkingRequested)
    },
    setbacks: isVillaLike
      ? {
        frontFt: 6,
        backFt: 4,
        leftFt: 4,
        rightFt: 4
      }
      : isApartmentLike
        ? {
          frontFt: 4,
          backFt: 3,
          leftFt: 2,
          rightFt: 2
        }
        : {
          frontFt: /corner plot/i.test(lowerRequest) ? 6 : 5,
          backFt: 3,
          leftFt: /corner plot/i.test(lowerRequest) ? 3 : 2,
          rightFt: /corner plot/i.test(lowerRequest) ? 3 : 2
        },
    floors: buildFallbackFloorPlans(totalStoreys, isVillaLike, hints.terraceRequested || style === 'a-frame' || style === 'farmhouse'),
    facade: {
      streetFacing: Boolean(dslHints.streetFacing || hints.streetFacing || /street facing|road facing/i.test(lowerRequest) || isVillaLike || isApartmentLike),
      balcony: Boolean(hints.balconyRequested || isVillaLike || isApartmentLike),
      terrace: Boolean(hints.terraceRequested || isVillaLike || style === 'a-frame' || style === 'farmhouse'),
      mainEntranceFacing: roadFacing,
      windowStyle: style === 'minimal' ? 'vertical' : style === 'apartment' ? 'stacked' : 'large'
    },
    materials: {
      wall: dslHints.wallMaterial || materialPreset.wall,
      slab: materialPreset.slab,
      roof: dslHints.roofMaterial || materialPreset.roof,
      door: dslHints.doorMaterial || materialPreset.door,
      window: dslHints.windowMaterial || materialPreset.window
    },
    outputs: {
      dsl: true,
      dxf: true,
      vr: false,
      ar: false
    },
    questions: []
  };

  return normalizeHouseSpec(rawSpec, request, previousSpec, resolvedIntent);
}

function isModifyHouseRequest(requestText) {
  return /\b(change|modify|update|add|remove|replace|edit|revise|refine|adjust|expand|extend|increase|decrease|alter|renovate)\b/i.test(String(requestText || '').trim());
}

function isCreateHouseRequest(requestText) {
  return /\b(?:please\s+)?(?:make me|generate|create|build|design)\b/i.test(String(requestText || '').trim());
}

function classifyHouseRequestIntent(requestText, hasPreviousSpec = false) {
  if (isModifyHouseRequest(requestText)) {
    return 'modify';
  }

  if (isCreateHouseRequest(requestText)) {
    return 'create';
  }

  return hasPreviousSpec ? 'modify' : 'create';
}

function normalizeHouseRequestIntent(intent, requestText, previousSpec) {
  const normalizedIntent = String(intent || '').trim().toLowerCase();
  if (normalizedIntent === 'create' || normalizedIntent === 'modify') {
    return normalizedIntent;
  }

  return classifyHouseRequestIntent(requestText, Boolean(previousSpec));
}

function dedupeQuestions(questions) {
  return Array.from(new Set(questions.map(question => String(question).trim()).filter(Boolean))).slice(0, 3);
}

function defaultQuestionsForSpec(spec) {
  const questions = [];
  if (!spec?.site?.plotWidthFt || !spec?.site?.plotDepthFt) {
    questions.push('What is the plot width and depth in feet?');
  }
  if (!normalizeFacing(spec?.site?.roadFacing)) {
    questions.push('Which side faces the road?');
  }
  if (!normalizeStyle(spec?.building?.style, spec?.request)) {
    questions.push('Do you want modern, contemporary, traditional, minimal, or Indian style?');
  }
  return dedupeQuestions(questions);
}

function deepMerge(baseValue, overrideValue) {
  if (Array.isArray(baseValue) && Array.isArray(overrideValue)) {
    return overrideValue.length > 0 ? overrideValue : baseValue;
  }

  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const merged = { ...baseValue };
    for (const [key, value] of Object.entries(overrideValue)) {
      merged[key] = key in baseValue ? deepMerge(baseValue[key], value) : value;
    }
    return merged;
  }

  return overrideValue === undefined || overrideValue === null || overrideValue === ''
    ? baseValue
    : overrideValue;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHouseSpec(rawSpec, requestText, previousSpec, intent = '') {
  const resolvedIntent = normalizeHouseRequestIntent(intent, requestText, previousSpec);
  const mergedInput = resolvedIntent === 'modify' && previousSpec ? deepMerge(previousSpec, rawSpec) : rawSpec;
  const hints = extractRequestHints(requestText);
  const request = String(mergedInput?.request || requestText || '').trim();
  const siteInput = isPlainObject(mergedInput?.site) ? mergedInput.site : {};
  const buildingInput = isPlainObject(mergedInput?.building) ? mergedInput.building : {};
  const setbacksInput = isPlainObject(mergedInput?.setbacks) ? mergedInput.setbacks : {};
  const facadeInput = isPlainObject(mergedInput?.facade) ? mergedInput.facade : {};
  const materialsInput = isPlainObject(mergedInput?.materials) ? mergedInput.materials : {};
  const outputsInput = isPlainObject(mergedInput?.outputs) ? mergedInput.outputs : {};
  const floorsInput = Array.isArray(mergedInput?.floors) ? mergedInput.floors : [];

  const plotWidthFt = Number(siteInput.plotWidthFt);
  const plotDepthFt = Number(siteInput.plotDepthFt);
  const roadFacing = normalizeFacing(siteInput.roadFacing || hints.roadFacingHint);
  const style = normalizeStyle(buildingInput.style || hints.styleHint, requestText);
  const totalStoreys = Number.isFinite(Number(buildingInput.totalStoreys))
    ? Math.max(1, Math.min(10, Math.trunc(Number(buildingInput.totalStoreys))))
    : hints.totalStoreys;
  const questions = dedupeQuestions([
    ...(Array.isArray(mergedInput?.questions) ? mergedInput.questions : []),
    ...(plotWidthFt > 0 && plotDepthFt > 0 ? [] : ['What is the plot width and depth in feet?']),
    ...(roadFacing ? [] : ['Which side faces the road?']),
    ...(style ? [] : ['Do you want modern, contemporary, traditional, minimal, or Indian style?'])
  ]);

  const normalized = {
    status: mergedInput?.status === 'ready' ? 'ready' : 'needs_clarification',
    request,
    site: {
      plotWidthFt: Number.isFinite(plotWidthFt) ? plotWidthFt : 0,
      plotDepthFt: Number.isFinite(plotDepthFt) ? plotDepthFt : 0,
      roadFacing,
      northDirection: normalizeFacing(siteInput.northDirection),
      roadWidthFt: Number.isFinite(Number(siteInput.roadWidthFt)) ? Number(siteInput.roadWidthFt) : null,
      cornerPlot: Boolean(siteInput.cornerPlot || hints.cornerPlot)
    },
    building: {
      totalStoreys,
      style,
      use: ['single_family', 'duplex', 'multi_family', 'villa', 'apartment', 'mixed_use'].includes(String(buildingInput.use || '').toLowerCase())
        ? String(buildingInput.use).toLowerCase()
        : 'single_family',
      maxHeightFt: Number.isFinite(Number(buildingInput.maxHeightFt))
        ? Number(buildingInput.maxHeightFt)
        : totalStoreys * 10,
      hasLift: Boolean(buildingInput.hasLift ?? mergedInput?.building?.hasLift ?? false),
      hasBasement: Boolean(buildingInput.hasBasement ?? mergedInput?.building?.hasBasement ?? false),
      hasCourtyard: Boolean(buildingInput.hasCourtyard ?? mergedInput?.building?.hasCourtyard ?? false),
      hasDoubleHeightLiving: Boolean(buildingInput.hasDoubleHeightLiving ?? mergedInput?.building?.hasDoubleHeightLiving ?? false),
      hasCoveredParking: Boolean(buildingInput.hasCoveredParking ?? mergedInput?.building?.hasCoveredParking ?? false)
    },
    setbacks: {
      frontFt: Number.isFinite(Number(setbacksInput.frontFt)) ? Number(setbacksInput.frontFt) : (hints.cornerPlot ? 6 : 5),
      backFt: Number.isFinite(Number(setbacksInput.backFt)) ? Number(setbacksInput.backFt) : 3,
      leftFt: Number.isFinite(Number(setbacksInput.leftFt)) ? Number(setbacksInput.leftFt) : (hints.cornerPlot ? 3 : 2),
      rightFt: Number.isFinite(Number(setbacksInput.rightFt)) ? Number(setbacksInput.rightFt) : (hints.cornerPlot ? 3 : 2)
    },
    floors: floorsInput,
    facade: {
      streetFacing: Boolean(facadeInput.streetFacing ?? hints.streetFacing),
      balcony: Boolean(facadeInput.balcony ?? hints.balconyRequested),
      terrace: Boolean(facadeInput.terrace ?? hints.terraceRequested),
      mainEntranceFacing: normalizeFacing(facadeInput.mainEntranceFacing || roadFacing),
      windowStyle: ['large', 'standard', 'vertical'].includes(String(facadeInput.windowStyle || '').toLowerCase())
        ? String(facadeInput.windowStyle).toLowerCase()
        : (style === 'minimal' ? 'vertical' : 'large')
    },
    materials: {
      wall: String(materialsInput.wall || defaultMaterialsByStyle[style || 'modern'].wall),
      slab: String(materialsInput.slab || defaultMaterialsByStyle[style || 'modern'].slab),
      roof: String(materialsInput.roof || defaultMaterialsByStyle[style || 'modern'].roof),
      door: String(materialsInput.door || defaultMaterialsByStyle[style || 'modern'].door),
      window: String(materialsInput.window || defaultMaterialsByStyle[style || 'modern'].window)
    },
    outputs: {
      dsl: outputsInput.dsl !== false,
      dxf: outputsInput.dxf !== false,
      vr: Boolean(outputsInput.vr),
      ar: Boolean(outputsInput.ar)
    },
    questions
  };

  if (normalized.site.plotWidthFt > 0 && normalized.site.plotDepthFt > 0 && normalized.site.roadFacing && normalized.building.style && questions.length === 0) {
    normalized.status = 'ready';
  } else {
    normalized.status = 'needs_clarification';
  }

  return normalized;
}

function buildHouseSystemPrompt() {
  return [
    'You are the low-level house planning LLM for an architecture/CAD app.',
    'Return valid JSON only. Do not use markdown, code fences, commentary, or explanations.',
    'Your output must be a single JSON object that matches this shape:',
    '{ status, request, site, building, setbacks, floors, facade, materials, outputs, questions }',
    'Study the DSL grammar reference and the current DSL preview before answering. The DSL is the source of truth for geometry and house style.',
    'Generate a fresh house from the request. Do not copy or adapt sample house layouts or previous rendered examples.',
    'Classify the request into a base archetype plus modifiers before answering. Keep the archetype explicit when the user asks for a villa, bungalow, farmhouse, A-frame, studio/1RK, duplex, townhouse, row-house, apartment, or mixed-use plan.',
    'Do not flatten specific archetypes into a generic house when the prompt clearly names one of them.',
    'If the request is ambiguous, ask a short clarification question about the archetype, storeys, or modifiers.',
    'If reviewNotes are provided, treat them as revision constraints and resolve the listed plan issues before responding.',
    'Rules:',
    '- Use the intent field to decide whether the user wants a fresh house or a modification.',
    '- Treat "G+3" as 4 total storeys.',
    '- Treat spelling mistakes like "mordern" as modern.',
    '- Phrases like "make me", "generate", "create", "build", and "design" are create requests.',
    '- Phrases like "change", "modify", "update", "add", "remove", "replace", "edit", and "revise" are modify requests.',
    '- If intent is "create", ignore previousSpec and start a fresh design.',
    '- If intent is "modify", preserve previousSpec and only adjust what the request asks for.',
    '- If the plot width/depth, road-facing side, or style is missing, set status to "needs_clarification" and ask up to 3 concise questions.',
    '- If the request already includes enough information, set status to "ready".',
    '- If the user says street-facing but does not specify which side faces the road, ask which side faces the road.',
    '- Keep outputs.dsl and outputs.dxf true for v1; keep vr and ar false for now.',
    '- Prefer a single-family house unless the request clearly says duplex or multi-family.',
  ].join(' ');
}

function buildLawReviewSystemPrompt() {
  return [
    'You are a house plan review LLM for an architecture/CAD app.',
    'Review the provided house spec and DSL preview for layout quality, storey count, room arrangement, and obvious design mistakes.',
    'Return valid JSON only. Do not use markdown, code fences, commentary, or explanations.',
    'Your output must be a single JSON object that matches this shape:',
    '{ status, summary, riskLevel, issues, recommendations, safeToProceed }',
    'Rules:',
    '- Be practical and concise.',
    '- Focus on architectural correctness, room flow, floor count, and whether the plan actually matches the request.',
    '- If the house plan is incomplete or looks wrong, explain what should change.',
    '- If you find issues, describe them as short actionable bullets in the issues array.',
    '- Use recommendations for suggested fixes or follow-up checks.',
    '- Use status values such as approved, needs_changes, or review.',
    '- Use riskLevel values low, medium, or high.',
    '- safeToProceed should be true only when the plan is coherent and no major layout concerns are apparent.',
  ].join(' ');
}

function buildLawReviewQuestion(houseSpec, requestText, intent = '', rawRequestText = '', dslPreview = '') {
  const plotWidth = Number(houseSpec?.site?.plotWidthFt);
  const plotDepth = Number(houseSpec?.site?.plotDepthFt);
  const hasPlot = Number.isFinite(plotWidth) && plotWidth > 0 && Number.isFinite(plotDepth) && plotDepth > 0;
  const plotLabel = hasPlot ? `${plotWidth}x${plotDepth} ft` : 'the provided plot';
  const structureLabel = houseSpec?.structureType || houseSpec?.program || houseSpec?.building?.style || 'house';
  const contextText = String(rawRequestText || requestText || '').trim();
  const storeys = Number.isFinite(Number(houseSpec?.building?.totalStoreys)) ? Number(houseSpec.building.totalStoreys) : null;
  const facing = houseSpec?.site?.roadFacing || houseSpec?.facade?.mainEntranceFacing || 'unknown';
  const dslText = String(dslPreview || '').trim();

  return [
    `Please review this ${structureLabel} floor plan for layout, room flow, and storey-count issues.`,
    contextText ? `Request: ${contextText}` : null,
    `Intent: ${String(intent || '').trim() || 'general'}`,
    `Road facing: ${facing}`,
    storeys ? `Storeys: ${storeys}` : null,
    dslText ? `DSL preview: ${dslText.slice(0, 4000)}` : null,
  ].filter(Boolean).join(' ');
}

function buildReviewRevisionNotes(review) {
  const issues = Array.isArray(review?.issues) ? review.issues.map((issue) => String(issue || '').trim()).filter(Boolean) : [];
  const recommendations = Array.isArray(review?.recommendations) ? review.recommendations.map((recommendation) => String(recommendation || '').trim()).filter(Boolean) : [];
  const notes = [];

  if (issues.length > 0) {
    notes.push(`Issues to fix: ${issues.slice(0, 3).join(' ')}`);
  }

  if (recommendations.length > 0) {
    notes.push(`Recommended changes: ${recommendations.slice(0, 3).join(' ')}`);
  }

  notes.push('Revise the plan so the floor layout, room count, and key house features better match the request and read like a proper architectural floor plan.');
  return notes.join(' ');
}

function isApprovedHouseReview(review) {
  if (!review) {
    return false;
  }

  if (review.status === 'approved') {
    return true;
  }

  return review.safeToProceed === true && (!Array.isArray(review.issues) || review.issues.length === 0);
}

function extractAnswerText(payload, fallbackText = '') {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload.answer ?? 
                      payload.student_draft ?? 
                      payload.studentDraft ?? 
                      payload.data?.answer ?? 
                      payload.result ?? 
                      payload.response ?? 
                      payload.message ?? 
                      payload.text;
    if (typeof candidate === 'string') {
      return candidate.trim();
    }
    if (candidate && typeof candidate === 'object') {
      return extractAnswerText(candidate, fallbackText);
    }
  }

  return String(fallbackText || '').trim();
}

function extractJsonContent(text) {
  if (text && typeof text === 'object') {
    return text;
  }

  const rawText = String(text || '').trim();
  if (!rawText) {
    throw new Error('LLM response was empty');
  }

  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i) || rawText.match(/```\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : rawText;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('LLM did not return valid JSON');
  }
}

async function readRequestBody(req) {
  return await new Promise((resolve, reject) => {
    let body = '';
    let rejected = false;
    req.on('data', chunk => {
      if (rejected) return;
      body += chunk;
      if (body.length > maxBodySize) {
        rejected = true;
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!rejected) resolve(body);
    });
    req.on('error', (err) => {
      if (!rejected) reject(err);
    });
  });
}

async function callHousePlannerLLM(requestText, previousSpec, intent = '', rawRequestText = '', dslPreview = '', reviewNotes = '', model = llmModel) {
  const hints = extractRequestHints(requestText);
  const resolvedIntent = normalizeHouseRequestIntent(intent, requestText, previousSpec);
  const effectivePreviousSpec = resolvedIntent === 'modify' ? previousSpec : null;
  const effectiveDslPreview = resolvedIntent === 'modify' ? dslPreview : '';
  const messages = [
    {
      role: 'system',
      content: buildHouseSystemPrompt()
    },
    {
      role: 'system',
      content: `DSL grammar reference:\n${JSON.stringify(dslGrammarReference, null, 2)}`
    },
    {
      role: 'user',
      content: JSON.stringify({
        request: requestText,
        rawRequest: rawRequestText || requestText,
        intent: resolvedIntent,
        hints,
        previousSpec: effectivePreviousSpec || null,
        currentDslPreview: effectiveDslPreview,
        reviewNotes: String(reviewNotes || '')
      })
    }
  ];

  const payload = {
    model: model,
    messages,
    temperature: llmTemperature
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (llmApiKey) {
    headers.Authorization = `Bearer ${llmApiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(llmEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`LLM request failed (${response.status}): ${responseText.slice(0, 500)}`);
    }

    const json = JSON.parse(responseText);
    const content = json?.choices?.[0]?.message?.content ?? json?.message?.content ?? json?.response ?? '';
    const parsed = extractJsonContent(content);
    return normalizeHouseSpec(parsed, requestText, effectivePreviousSpec, resolvedIntent);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLawReview(rawReview, requestText, houseSpec, intent = '') {
  const reviewInput = isPlainObject(rawReview) ? rawReview : {};
  const normalizeArray = value => Array.from(new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean))).slice(0, 5);
  const normalizedStatus = String(reviewInput.status || '').trim().toLowerCase();
  const status = ['approved', 'needs_changes', 'review', 'blocked'].includes(normalizedStatus)
    ? normalizedStatus
    : (normalizeArray(reviewInput.issues).length > 0 ? 'needs_changes' : 'approved');
  const riskLevel = ['low', 'medium', 'high'].includes(String(reviewInput.riskLevel || '').trim().toLowerCase())
    ? String(reviewInput.riskLevel).trim().toLowerCase()
    : (normalizeArray(reviewInput.issues).length > 2 ? 'high' : normalizeArray(reviewInput.issues).length > 0 ? 'medium' : 'low');

  return {
    status,
    summary: String(reviewInput.summary || reviewInput.overview || '').trim() || (status === 'approved'
      ? 'No obvious high-level legal or compliance concerns were flagged.'
      : 'Review completed with follow-up notes.'),
    riskLevel,
    issues: normalizeArray(reviewInput.issues),
    recommendations: normalizeArray(reviewInput.recommendations),
    safeToProceed: typeof reviewInput.safeToProceed === 'boolean' ? reviewInput.safeToProceed : status === 'approved',
    request: String(requestText || '').trim(),
    intent: String(intent || '').trim().toLowerCase(),
    houseStyle: houseSpec?.building?.style || null,
    houseStoreys: Number.isFinite(Number(houseSpec?.building?.totalStoreys)) ? Number(houseSpec.building.totalStoreys) : null
  };
}

async function callLawReviewLLM(houseSpec, requestText, intent = '', rawRequestText = '', dslPreview = '') {
  const useDirectQuestionEndpoint = trimSlash(lawLlmEndpoint) === trimSlash(defaultLawLlmEndpoint);
  const payload = useDirectQuestionEndpoint
    ? {
        question: buildLawReviewQuestion(houseSpec, requestText, intent, rawRequestText, dslPreview)
      }
    : {
        model: lawLlmModel,
        messages: [
          {
            role: 'system',
            content: buildLawReviewSystemPrompt()
          },
          {
            role: 'user',
            content: JSON.stringify({
              request: requestText,
              rawRequest: rawRequestText || requestText,
              intent,
              dslPreview,
              houseSpec
            })
          }
        ],
        temperature: lawLlmTemperature
      };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (lawLlmApiKey && !useDirectQuestionEndpoint) {
    headers.Authorization = `Bearer ${lawLlmApiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(lawLlmEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Law review request failed (${response.status}): ${responseText.slice(0, 500)}`);
    }

    const json = JSON.parse(responseText);

    if (useDirectQuestionEndpoint) {
      const answer = extractAnswerText(json, responseText);
      if (!answer) {
        throw new Error('Law review response was missing an answer');
      }

      const normalizedAnswer = answer.replace(/\s+/g, ' ').trim();
      const loweredAnswer = normalizedAnswer.toLowerCase();
      const issues = /not allowed|prohibited|violation|non[-\s]?compliant|insufficient|exceeds|too close/i.test(loweredAnswer)
        ? [normalizedAnswer]
        : [];
      const recommendations = /check|confirm|verify|consult|obtain|adjust|revise/i.test(loweredAnswer)
        ? [normalizedAnswer]
        : [];
      const status = issues.length > 0
        ? 'needs_changes'
        : /approved|compliant|permitted|safe to proceed|acceptable/i.test(loweredAnswer)
          ? 'approved'
          : 'review';
      const riskLevel = issues.length > 0
        ? 'high'
        : /approved|compliant|permitted|safe to proceed|acceptable/i.test(loweredAnswer)
          ? 'low'
          : 'medium';

      return normalizeLawReview({
        status,
        summary: normalizedAnswer,
        riskLevel,
        issues,
        recommendations,
        safeToProceed: status === 'approved'
      }, requestText, houseSpec, intent);
    }

    const content = json?.choices?.[0]?.message?.content ?? json?.message?.content ?? json?.response ?? '';
    const parsed = extractJsonContent(content);
    return normalizeLawReview(parsed, requestText, houseSpec, intent);
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveStaticFile(requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const safePath = path.resolve(rootDir, `.${normalizedPath}`);
  const rootResolved = path.resolve(rootDir);
  if (!safePath.startsWith(rootResolved)) {
    return null;
  }

  try {
    const fileStats = await stat(safePath);
    if (fileStats.isFile()) {
      return safePath;
    }
    if (fileStats.isDirectory()) {
      const indexPath = path.join(safePath, 'index.html');
      const indexStats = await stat(indexPath).catch(() => null);
      if (indexStats?.isFile()) {
        return indexPath;
      }
    }
  } catch {
    const indexPath = path.join(safePath, 'index.html');
    const indexStats = await stat(indexPath).catch(() => null);
    if (indexStats?.isFile()) {
      return indexPath;
    }
  }

  return null;
}

const styleToFolderMap = {
  'contemporary': 'modern',
  'luxury': 'villa',
  'traditional': 'traditional',
  'minimal': 'minimal',
  'indian': 'indian',
  'bungalow': 'bungalow',
  'farmhouse': 'farmhouse',
  'apartment': 'apartment',
  'studio': 'apartment',
  'mixed-use': 'apartment'
};

async function getLibraryModels(style) {
  const libraryPath = path.join(rootDir, '..', 'archgpt-ui', 'public', 'library');
  const folderName = styleToFolderMap[style?.toLowerCase()] || style || 'villa';
  const styleFolder = path.join(libraryPath, folderName);
  const models = [];

  console.log(`[Library] Scanning folder: ${styleFolder}`);
  try {
    const files = await readdir(styleFolder);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.obj') || file.toLowerCase().endsWith('.glb') || file.toLowerCase().endsWith('.gltf') || file.toLowerCase().endsWith('.fbx')) {
        const filePath = path.join(styleFolder, file);
        const stats = await stat(filePath);
        
        // Skip files > 100MB for the demo to prevent browser memory crashes
        if (stats.size > 100 * 1024 * 1024) {
          console.warn(`[Library] Skipping ${file} - too large (${Math.round(stats.size/1024/1024)}MB)`);
          continue;
        }

        models.push({
          id: `local-${folderName}-${file}`,
          title: file.replace(/_/g, ' ').replace(/\.[a-z0-9]+$/i, ''),
          source: 'Curated Library',
          url: `/library/${folderName}/${file}`,
          thumbnail: 'https://via.placeholder.com/300x200.png?text=' + encodeURIComponent(file)
        });
      }
    }
  } catch (err) {
    console.error(`Could not read library folder for style ${style}:`, err);
  }

  console.log(`[Library] Found ${models.length} models for style ${style}`);
  // RNG: Shuffle the models so the user sees different ones
  return models.sort(() => Math.random() - 0.5).slice(0, 6);
}

async function handleApiRoute(req, res, pathname) {
  if ((pathname === '/api/health' || pathname === '/api/house-spec' || pathname === '/api/get-model-download' || pathname === '/api/analyze-model') && req.method === 'OPTIONS') {
    writeApiCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return true;
  }

  if (pathname === '/api/get-model-download' && req.method === 'GET') {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const uid = requestUrl.searchParams.get('uid');
      if (!uid) {
        sendJson(res, 400, { ok: false, error: 'Missing uid' });
        return true;
      }

      // Handle local curated library models
      if (uid.startsWith('local-')) {
        const parts = uid.split('-');
        const style = parts[1];
        const filename = parts.slice(2).join('-');
        
        sendJson(res, 200, { 
          ok: true, 
          download: { 
            // Return encoded URL for the browser
            gltf: { url: `/library/${style}/${encodeURIComponent(filename)}` } 
          } 
        });
        return true;
      }

      if (!sketchfabApiKey) {
        sendJson(res, 400, { ok: false, error: 'Sketchfab API Key not configured' });
        return true;
      }

      const response = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
        headers: {
          'Authorization': `Token ${sketchfabApiKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sketchfab Download API failed: ${errorText}`);
      }

      const downloadData = await response.json();
      sendJson(res, 200, { ok: true, download: downloadData });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { ok: false, error: message });
    }
    return true;
  }

  if (pathname === '/api/analyze-model' && req.method === 'POST') {
    try {
      const bodyText = await readRequestBody(req);
      const body = bodyText ? JSON.parse(bodyText) : {};
      const imageBase64 = body.image; // Expecting "data:image/jpeg;base64,..."
      
      if (!imageBase64) {
        sendJson(res, 400, { ok: false, error: 'Missing image data' });
        return true;
      }

      if (!mistralApiKey) {
        sendJson(res, 400, { ok: false, error: 'Mistral API Key not configured' });
        return true;
      }

      // Call NVIDIA / Mistral Large 3 API
      const nvResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-large-3-675b-instruct-2512', // Added mistralai/ prefix to user's ID
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this 3D model render. If it is empty, say so. Otherwise, describe the architectural style, layout, and any instructions on how to improve it for an Indian context (G+1 to G+5 elevation).' },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ],
          max_tokens: 1024,
          temperature: 0.2
        })
      });

      if (!nvResponse.ok) {
        const errorText = await nvResponse.text();
        throw new Error(`NVIDIA API failed: ${errorText}`);
      }

      const nvData = await nvResponse.json();
      const analysis = nvData.choices?.[0]?.message?.content || 'No analysis received';
      sendJson(res, 200, { ok: true, analysis });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { ok: false, error: message });
    }
    return true;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      service: 'house-planner',
      llmEndpoint,
      llmModel
    });
    return true;
  }

  if (pathname === '/api/house-spec' && req.method === 'POST') {
    try {
      const bodyText = await readRequestBody(req);
      const body = bodyText ? JSON.parse(bodyText) : {};
      const requestText = String(body.request || body.rawRequest || body.prompt || '').trim();
      const rawRequestText = String(body.rawRequest || requestText || '').trim();
      const intent = String(body.intent || '').trim().toLowerCase();
      const previousSpec = body.previousSpec || body.context?.previousSpec || null;
      const dslPreview = String(body.dslPreview || body.currentDslPreview || body.dsl || '').trim();
      const requestedModel = body.model || llmModel;

      if (!requestText) {
        sendJson(res, 400, { ok: false, error: 'Missing request text' });
        return true;
      }

      let spec = null;
      let generationSource = 'llm';
      let plannerError = '';
      let lawReview = null;
      let lawReviewError = null;
      let reviewNotes = '';
      let reviewIntent = intent;
      let reviewPreviousSpec = previousSpec;
      const maxReviewRounds = 2;

      for (let reviewRound = 0; reviewRound < maxReviewRounds; reviewRound += 1) {
        try {
          spec = await callHousePlannerLLM(requestText, reviewPreviousSpec, reviewIntent, rawRequestText, dslPreview, reviewNotes, requestedModel);
          plannerError = '';
        } catch (plannerErrorValue) {
          plannerError = plannerErrorValue instanceof Error ? plannerErrorValue.message : String(plannerErrorValue);
          break;
        }

        if (!spec || spec.status !== 'ready') {
          break;
        }

        try {
          lawReview = await callLawReviewLLM(spec, requestText, reviewIntent, rawRequestText, dslPreview);
          lawReviewError = null;
        } catch (reviewError) {
          lawReviewError = reviewError instanceof Error ? reviewError.message : String(reviewError);
        }

        if (lawReviewError || isApprovedHouseReview(lawReview) || reviewRound === maxReviewRounds - 1) {
          break;
        }

        reviewNotes = buildReviewRevisionNotes(lawReview);
        reviewPreviousSpec = spec;
        reviewIntent = 'modify';
      }

      if (!spec || spec.status !== 'ready') {
        // If the LLM explicitly requires clarification, do NOT guess. Return the questions to the user.
        if (spec && spec.status === 'needs_clarification' && Array.isArray(spec.questions) && spec.questions.length > 0) {
          sendJson(res, 200, { ok: true, spec, lawReview: null, lawReviewError: null, generationSource: 'llm', plannerError: '' });
          return true;
        }

        spec = buildFallbackHouseSpec(requestText, previousSpec, intent, dslPreview || rawRequestText);
        generationSource = 'dsl-fallback';
        if (spec?.status === 'ready') {
          try {
            lawReview = await callLawReviewLLM(spec, requestText, intent, rawRequestText, dslPreview);
            lawReviewError = null;
          } catch (reviewError) {
            lawReviewError = reviewError instanceof Error ? reviewError.message : String(reviewError);
          }
        }
      }

      // Hybrid Generation & Search API:
      // RNG: Automatically pick ONE random model from our local Curated Library
      let externalModels = [];
      if (spec?.status === 'ready') {
        const style = spec.building?.style || 'modern';
        
        // 1. Get models from our local Curated Library
        const localModels = await getLibraryModels(style);
        
        if (localModels.length > 0) {
          // RNG: Pick exactly one random model
          const randomIndex = Math.floor(Math.random() * localModels.length);
          const selectedModel = localModels[randomIndex];
          
          // We provide this as the primary external model
          externalModels = [selectedModel];
        }
      }

      sendJson(res, 200, { ok: true, spec, lawReview, lawReviewError, generationSource, plannerError, externalModels });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { ok: false, error: message });
    }
    return true;
  }

  return false;
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (await handleApiRoute(req, res, pathname)) {
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendText(res, 405, 'Method Not Allowed');
      return;
    }

    const filePath = await resolveStaticFile(pathname);
    if (!filePath) {
      sendText(res, 404, 'Not Found');
      return;
    }

    const fileBuffer = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    res.end(fileBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendText(res, 500, `Server error: ${message}`);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ArchGPT server listening on 0.0.0.0:${port} (accessible from LAN)`);
  console.log(`Serving static files from ${rootDir}`);
  console.log(`LLM endpoint: ${llmEndpoint}`);
  console.log(`LLM model: ${llmModel}`);
  console.log(`Law review endpoint: ${lawLlmEndpoint}`);
  console.log(`Law review model: ${lawLlmModel}`);

  if (!llmApiKey && /(generativelanguage\.googleapis\.com\/v1beta\/openai|api\.openai\.com|api\.x\.ai)/i.test(llmEndpoint)) {
    console.log('No LLM API key detected. Set GEMINI_API_KEY, XAI_API_KEY, LLM_API_KEY, or OPENAI_API_KEY before using the planner.');
  }

  const knownModelPrefixes = ['gemini-1.', 'gemini-2.', 'gpt-', 'claude-', 'grok-', 'llama', 'mistral', 'deepseek'];
  const modelLooksValid = knownModelPrefixes.some(p => llmModel.startsWith(p));
  if (!modelLooksValid) {
    console.warn(`[WARN] LLM model "${llmModel}" does not match any known model prefix. Set LLM_MODEL to a valid model (e.g. gemini-2.0-flash, gemini-1.5-pro, gpt-4o).`);
  }

  if (!lawLlmApiKey && lawLlmEndpoint !== llmEndpoint && /(generativelanguage\.googleapis\.com\/v1beta\/openai|api\.openai\.com|api\.x\.ai)/i.test(lawLlmEndpoint)) {
    console.log('No law LLM API key detected. Set LAW_LLM_API_KEY, LAW_API_KEY, GEMINI_API_KEY, LLM_API_KEY, or OPENAI_API_KEY before using the law review pass.');
  }
});

