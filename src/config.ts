import { Config } from './types';

export const CONFIG: Config = {
  gridSize: 100,
  MAX_TILES: 500,
  viewMargin: 1,
  generationMarginFactor: 1.5,
  generationMarginMinCells: 6,
  placementAttemptsPerAreaUnit: 0.05,
  minPlacementAttempts: 50,
  maxPlacementAttempts: 1000,
  visibleLockDuration: 500
};

export const PLATFORMS = [
  { id: "aws", name: "AWS", color: "#FF9900" },
  { id: "gcp", name: "GCP", color: "#4285F4" },
  { id: "azure", name: "Azure", color: "#007FFF" },
  { id: "local", name: "Local", color: "#8e44ad" }
];

export const TILE_TYPES = [
  {w: 1, h: 1, weight: 15}, {w: 1, h: 2, weight: 10}, {w: 2, h: 1, weight: 10},
  {w: 2, h: 2, weight: 8}, {w: 3, h: 1, weight: 5}, {w: 1, h: 3, weight: 5},
  {w: 2, h: 3, weight: 4}, {w: 3, h: 2, weight: 4}, {w: 4, h: 1, weight: 3},
  {w: 1, h: 4, weight: 3}, {w: 3, h: 3, weight: 11}, {w: 4, h: 2, weight: 2},
  {w: 2, h: 4, weight: 8}, {w: 4, h: 4, weight: 1}
];

export const TOTAL_TILE_WEIGHT = TILE_TYPES.reduce((sum, type) => sum + type.weight, 0);