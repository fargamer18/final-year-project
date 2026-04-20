/**
 * Material Library for ArchGPT - Comprehensive building materials system
 */

export interface MaterialDefinition {
    name: string;
    color: [number, number, number];        // RGB 0-1
    emissiveColor?: [number, number, number];
    specularColor?: [number, number, number];
    roughness?: number;                      // 0-1, higher = less glossy
    metallic?: number;                       // 0-1
    reflectionIntensity?: number;            // 0-1
    transparency?: number;                   // 0-1, 0 = opaque
    description: string;
}

export const MATERIAL_LIBRARY: Record<string, MaterialDefinition> = {
    // --- Wood Materials ---
    oak: {
        name: "Oak",
        color: [0.65, 0.48, 0.30],
        roughness: 0.6,
        metallic: 0,
        description: "Light natural oak wood"
    },
    walnut: {
        name: "Walnut",
        color: [0.45, 0.30, 0.15],
        roughness: 0.65,
        metallic: 0,
        description: "Dark rich walnut wood"
    },
    pine: {
        name: "Pine",
        color: [0.75, 0.64, 0.45],
        roughness: 0.7,
        metallic: 0,
        description: "Light pine wood"
    },
    mahogany: {
        name: "Mahogany",
        color: [0.58, 0.30, 0.18],
        roughness: 0.55,
        metallic: 0,
        description: "Red-brown mahogany wood"
    },

    // --- Brick & Stone Materials ---
    redBrick: {
        name: "Red Brick",
        color: [0.80, 0.35, 0.25],
        roughness: 0.85,
        metallic: 0,
        description: "Traditional red clay brick"
    },
    whiteBrick: {
        name: "White Brick",
        color: [0.95, 0.93, 0.90],
        roughness: 0.80,
        metallic: 0,
        description: "White painted brick"
    },
    brownBrick: {
        name: "Brown Brick",
        color: [0.60, 0.42, 0.28],
        roughness: 0.82,
        metallic: 0,
        description: "Brown load-bearing brick"
    },
    marble: {
        name: "Marble",
        color: [0.92, 0.92, 0.92],
        emissiveColor: [0.05, 0.05, 0.05],
        roughness: 0.3,
        metallic: 0,
        reflectionIntensity: 0.4,
        description: "Polished white marble"
    },
    granite: {
        name: "Granite",
        color: [0.50, 0.50, 0.52],
        roughness: 0.5,
        metallic: 0,
        reflectionIntensity: 0.2,
        description: "Gray polished granite"
    },
    limestone: {
        name: "Limestone",
        color: [0.85, 0.83, 0.78],
        roughness: 0.75,
        metallic: 0,
        description: "Cream-colored limestone"
    },
    slate: {
        name: "Slate",
        color: [0.30, 0.30, 0.35],
        roughness: 0.9,
        metallic: 0,
        description: "Dark gray slate stone"
    },

    // --- Concrete Materials ---
    concrete: {
        name: "Concrete",
        color: [0.60, 0.60, 0.60],
        roughness: 0.9,
        metallic: 0,
        description: "Standard gray concrete"
    },
    lightConcrete: {
        name: "Light Concrete",
        color: [0.75, 0.75, 0.75],
        roughness: 0.85,
        metallic: 0,
        description: "Light gray concrete"
    },
    polishedConcrete: {
        name: "Polished Concrete",
        color: [0.65, 0.65, 0.65],
        roughness: 0.4,
        metallic: 0,
        reflectionIntensity: 0.2,
        description: "Polished concrete floor"
    },

    // --- Metal Materials ---
    steel: {
        name: "Steel",
        color: [0.50, 0.50, 0.55],
        roughness: 0.3,
        metallic: 1,
        reflectionIntensity: 0.6,
        description: "Brushed steel"
    },
    stainlessSteel: {
        name: "Stainless Steel",
        color: [0.75, 0.75, 0.78],
        roughness: 0.2,
        metallic: 1,
        reflectionIntensity: 0.8,
        description: "Polished stainless steel"
    },
    copper: {
        name: "Copper",
        color: [0.95, 0.64, 0.54],
        roughness: 0.4,
        metallic: 1,
        reflectionIntensity: 0.7,
        description: "Brushed copper"
    },
    aluminum: {
        name: "Aluminum",
        color: [0.90, 0.90, 0.92],
        roughness: 0.35,
        metallic: 1,
        reflectionIntensity: 0.65,
        description: "Anodized aluminum"
    },
    brass: {
        name: "Brass",
        color: [0.88, 0.78, 0.50],
        roughness: 0.45,
        metallic: 1,
        reflectionIntensity: 0.6,
        description: "Brushed brass"
    },

    // --- Glass Materials ---
    clearGlass: {
        name: "Clear Glass",
        color: [0.95, 0.95, 0.98],
        transparency: 0.8,
        roughness: 0.1,
        metallic: 0,
        reflectionIntensity: 0.5,
        description: "Clear transparent glass"
    },
    frostedGlass: {
        name: "Frosted Glass",
        color: [0.85, 0.85, 0.88],
        transparency: 0.6,
        roughness: 0.6,
        metallic: 0,
        description: "Frosted/translucent glass"
    },
    tintedGlass: {
        name: "Tinted Glass",
        color: [0.40, 0.70, 0.90],
        transparency: 0.5,
        roughness: 0.15,
        metallic: 0,
        reflectionIntensity: 0.4,
        description: "Blue-tinted glass"
    },

    // --- Paint & Plaster ---
    whitePaint: {
        name: "White Paint",
        color: [0.98, 0.98, 0.98],
        roughness: 0.8,
        metallic: 0,
        description: "Matte white paint"
    },
    grayPaint: {
        name: "Gray Paint",
        color: [0.70, 0.70, 0.70],
        roughness: 0.8,
        metallic: 0,
        description: "Medium gray paint"
    },
    beigePaint: {
        name: "Beige Paint",
        color: [0.90, 0.88, 0.82],
        roughness: 0.8,
        metallic: 0,
        description: "Warm beige paint"
    },
    blackPaint: {
        name: "Black Paint",
        color: [0.10, 0.10, 0.10],
        roughness: 0.7,
        metallic: 0,
        description: "Matte black paint"
    },
    redPaint: {
        name: "Red Paint",
        color: [0.85, 0.15, 0.15],
        roughness: 0.75,
        metallic: 0,
        description: "Bright red paint"
    },
    bluePaint: {
        name: "Blue Paint",
        color: [0.15, 0.35, 0.85],
        roughness: 0.75,
        metallic: 0,
        description: "Medium blue paint"
    },
    plaster: {
        name: "Plaster",
        color: [0.92, 0.92, 0.90],
        roughness: 0.9,
        metallic: 0,
        description: "White plaster finish"
    },
    cement: {
        name: "Cement",
        color: [0.68, 0.68, 0.65],
        roughness: 0.95,
        metallic: 0,
        description: "Raw cement finish"
    },

    // --- Ceramic Materials ---
    tile: {
        name: "Ceramic Tile",
        color: [0.60, 0.60, 0.60],
        roughness: 0.4,
        metallic: 0,
        reflectionIntensity: 0.1,
        description: "Glazed ceramic tile"
    },
    whiteTile: {
        name: "White Tile",
        color: [0.95, 0.95, 0.95],
        roughness: 0.35,
        metallic: 0,
        reflectionIntensity: 0.15,
        description: "White glazed tile"
    },
    terracotta: {
        name: "Terracotta",
        color: [0.85, 0.60, 0.45],
        roughness: 0.75,
        metallic: 0,
        description: "Natural terracotta"
    },

    // --- Roofing Materials ---
    asphaltShingles: {
        name: "Asphalt Shingles",
        color: [0.25, 0.25, 0.25],
        roughness: 0.95,
        metallic: 0,
        description: "Dark asphalt roof shingles"
    },
    metalRoof: {
        name: "Metal Roof",
        color: [0.60, 0.60, 0.62],
        roughness: 0.4,
        metallic: 0.8,
        reflectionIntensity: 0.5,
        description: "Standing seam metal roof"
    },
    tileRoof: {
        name: "Tile Roof",
        color: [0.85, 0.55, 0.30],
        roughness: 0.7,
        metallic: 0,
        description: "Red clay tile roof"
    },

    // --- Default ---
    default: {
        name: "Default",
        color: [0.80, 0.80, 0.80],
        roughness: 0.8,
        metallic: 0,
        description: "Default gray material"
    }
};

export function getMaterial(name: string): MaterialDefinition {
    const lower = name.toLowerCase();
    return MATERIAL_LIBRARY[lower] || MATERIAL_LIBRARY.default;
}

export function listMaterials(): string[] {
    return Object.keys(MATERIAL_LIBRARY).sort();
}
