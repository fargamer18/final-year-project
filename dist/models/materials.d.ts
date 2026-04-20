/**
 * Material Library for ArchGPT - Comprehensive building materials system
 */
export interface MaterialDefinition {
    name: string;
    color: [number, number, number];
    emissiveColor?: [number, number, number];
    specularColor?: [number, number, number];
    roughness?: number;
    metallic?: number;
    reflectionIntensity?: number;
    transparency?: number;
    description: string;
}
export declare const MATERIAL_LIBRARY: Record<string, MaterialDefinition>;
export declare function getMaterial(name: string): MaterialDefinition;
export declare function listMaterials(): string[];
