import { CONFIG, TILE_TYPES, TOTAL_TILE_WEIGHT, PLATFORMS } from '../config';

let maxTileW = 0, maxTileH = 0;
TILE_TYPES.forEach(t => { maxTileW = Math.max(maxTileW, t.w); maxTileH = Math.max(maxTileH, t.h); });
const maxTileDim = Math.max(maxTileW, maxTileH);
export const generationMarginCells = Math.max(CONFIG.generationMarginMinCells, Math.ceil(maxTileDim * CONFIG.generationMarginFactor));
console.log("Generation Margin (cells):", generationMarginCells);
const tileType1x1 = TILE_TYPES.find(t => t.w === 1 && t.h === 1) || {w: 1, h: 1, weight: 1};

export function shuffle(array: any[]) {
   for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array;
}

export function selectWeightedRandomTileType() {
    if (TOTAL_TILE_WEIGHT <= 0) return tileType1x1;
    let randomWeight = Math.random() * TOTAL_TILE_WEIGHT;
    for (const type of TILE_TYPES) { randomWeight -= type.weight; if (randomWeight <= 0) return type; }
    return TILE_TYPES[TILE_TYPES.length - 1];
}

export function isOccupied(gx: number, gy: number, occupancy: Set<string>) { return occupancy.has(gx + "," + gy); }

export function canPlaceTile(gx: number, gy: number, tileType: any, occupancy: Set<string>) {
    for (let dy = 0; dy < tileType.h; dy++) { 
        for (let dx = 0; dx < tileType.w; dx++) { 
            if (isOccupied(gx + dx, gy + dy, occupancy)) return false; 
        } 
    } 
    return true;
}

export function getRandomEnabledPlatform(enabledPlatforms: Set<string>) {
    if (enabledPlatforms.size === 0) return null;
    const enabled = Array.from(enabledPlatforms);
    const platformId = enabled[Math.floor(Math.random() * enabled.length)];
    return PLATFORMS.find(p => p.id === platformId);
}