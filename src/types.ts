export interface TileType {
  w: number;
  h: number;
  weight: number;
}

export interface Platform {
  id: string;
  name: string;
  color: string;
}

export interface Tile {
  id: number;
  gx: number;
  gy: number;
  w: number;
  h: number;
  platform: Platform;
  timestamp: number;
  lastVisibleTimestamp: number | null;
}

export interface Config {
  gridSize: number;
  MAX_TILES: number;
  viewMargin: number;
  generationMarginFactor: number;
  generationMarginMinCells: number;
  placementAttemptsPerAreaUnit: number;
  minPlacementAttempts: number;
  maxPlacementAttempts: number;
  visibleLockDuration: number;
}