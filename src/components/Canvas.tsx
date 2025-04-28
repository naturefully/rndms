import React, { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { selectWeightedRandomTileType, canPlaceTile, getRandomEnabledPlatform, isOccupied, generationMarginCells } from '../utils/canvasUtils';

interface CanvasProps {
  enabledPlatforms: Set<string>;
  setGlobalTiles: React.Dispatch<React.SetStateAction<Map<number, any>>>;
  globalTiles: Map<number, any>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  offsetX: number;
  setOffsetX: React.Dispatch<React.SetStateAction<number>>;
  offsetY: number;
  setOffsetY: React.Dispatch<React.SetStateAction<number>>;
}

const Canvas: React.FC<CanvasProps> = ({ 
  enabledPlatforms, 
  setGlobalTiles, 
  globalTiles,
  scale,
  setScale,
  offsetX,
  setOffsetX,
  offsetY,
  setOffsetY
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameId = useRef<number>();
  
  // State refs for high-frequency updates
  const viewStateRef = useRef({
    scale,
    offsetX,
    offsetY,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartOffsetX: 0,
    dragStartOffsetY: 0
  });

  const tilesStateRef = useRef({
    tileIdCounter: 0,
    occupancy: new Set<string>(),
    tileOrder: [] as number[],
    globalTiles: new Map(globalTiles)
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctxRef.current = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const view = viewStateRef.current;
      view.isDragging = true;
      view.dragStartX = e.clientX;
      view.dragStartY = e.clientY;
      view.dragStartOffsetX = view.offsetX;
      view.dragStartOffsetY = view.offsetY;
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      const view = viewStateRef.current;
      if (view.isDragging) {
        view.offsetX = view.dragStartOffsetX + (e.clientX - view.dragStartX);
        view.offsetY = view.dragStartOffsetY + (e.clientY - view.dragStartY);
        setOffsetX(view.offsetX);
        setOffsetY(view.offsetY);
      }
    };

    const handleMouseUp = () => {
      const view = viewStateRef.current;
      if (view.isDragging) {
        view.isDragging = false;
        canvas.style.cursor = 'grab';
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const view = viewStateRef.current;
      const zoomIntensity = 0.001;
      const delta = e.deltaY;
      const mouseX = e.clientX - canvas.getBoundingClientRect().left;
      const mouseY = e.clientY - canvas.getBoundingClientRect().top;
      const worldXBefore = (mouseX - view.offsetX) / view.scale;
      const worldYBefore = (mouseY - view.offsetY) / view.scale;
      const newScale = view.scale * (1 - delta * zoomIntensity);
      view.scale = Math.max(0.1, Math.min(newScale, 10));
      view.offsetX = mouseX - worldXBefore * view.scale;
      view.offsetY = mouseY - worldYBefore * view.scale;
      setScale(view.scale);
      setOffsetX(view.offsetX);
      setOffsetY(view.offsetY);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.style.cursor = 'grab';

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const placeTile = (gx: number, gy: number, tileType: any, platform: any) => {
    if (!platform) return null;
    const tiles = tilesStateRef.current;
    const tile = {
      id: tiles.tileIdCounter++,
      gx, gy,
      w: tileType.w, h: tileType.h,
      platform,
      timestamp: Date.now(),
      lastVisibleTimestamp: null
    };
    
    tiles.globalTiles.set(tile.id, tile);
    tiles.tileOrder.push(tile.id);
    
    for (let dy = 0; dy < tileType.h; dy++) {
      for (let dx = 0; dx < tileType.w; dx++) {
        tiles.occupancy.add((gx + dx) + "," + (gy + dy));
      }
    }
    
    setGlobalTiles(new Map(tiles.globalTiles));
    return tile;
  };

  const isTileVisible = (tile: any) => {
    if (!tile || !canvasRef.current) return false;
    const view = viewStateRef.current;
    const screenX = tile.gx * CONFIG.gridSize * view.scale + view.offsetX;
    const screenY = tile.gy * CONFIG.gridSize * view.scale + view.offsetY;
    const sizeX = tile.w * CONFIG.gridSize * view.scale;
    const sizeY = tile.h * CONFIG.gridSize * view.scale;
    const viewMarginWorld = CONFIG.viewMargin * CONFIG.gridSize * view.scale;

    return !(screenX + sizeX < -viewMarginWorld ||
             screenY + sizeY < -viewMarginWorld ||
             screenX > canvasRef.current.width + viewMarginWorld ||
             screenY > canvasRef.current.height + viewMarginWorld);
  };

  const generateTiles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const view = viewStateRef.current;
    const tiles = tilesStateRef.current;
    
    const invScale = 1 / view.scale;
    const generationMarginWorld = generationMarginCells * CONFIG.gridSize;
    const worldLeft = (0 - view.offsetX) * invScale - generationMarginWorld;
    const worldTop = (0 - view.offsetY) * invScale - generationMarginWorld;
    const worldRight = (canvas.width - view.offsetX) * invScale + generationMarginWorld;
    const worldBottom = (canvas.height - view.offsetY) * invScale + generationMarginWorld;

    const genGxMin = Math.floor(worldLeft / CONFIG.gridSize);
    const genGxMax = Math.ceil(worldRight / CONFIG.gridSize);
    const genGyMin = Math.floor(worldTop / CONFIG.gridSize);
    const genGyMax = Math.ceil(worldBottom / CONFIG.gridSize);

    const genWidth = genGxMax - genGxMin;
    const genHeight = genGyMax - genGyMin;

    if (genWidth <= 0 || genHeight <= 0) return;

    const genArea = genWidth * genHeight;
    let numAttempts = Math.floor(genArea * CONFIG.placementAttemptsPerAreaUnit);
    numAttempts = Math.max(CONFIG.minPlacementAttempts, numAttempts);
    numAttempts = Math.min(CONFIG.maxPlacementAttempts, numAttempts);

    for (let i = 0; i < numAttempts; i++) {
      const randGx = Math.floor(Math.random() * genWidth) + genGxMin;
      const randGy = Math.floor(Math.random() * genHeight) + genGyMin;
      if (isOccupied(randGx, randGy, tiles.occupancy)) continue;
      const chosenTileType = selectWeightedRandomTileType();
      const platform = getRandomEnabledPlatform(enabledPlatforms);
      if (!platform) continue;
      if (canPlaceTile(randGx, randGy, chosenTileType, tiles.occupancy)) {
        placeTile(randGx, randGy, chosenTileType, platform);
      }
    }

    const now = Date.now();
    while (tiles.globalTiles.size > CONFIG.MAX_TILES) {
      let candidateIndexToRemove = -1;

      for (let i = 0; i < tiles.tileOrder.length; i++) {
        const tileIdToCheck = tiles.tileOrder[i];
        const tile = tiles.globalTiles.get(tileIdToCheck);

        if (!tile) {
          console.warn(`Stale tile ID ${tileIdToCheck} found in tileOrder during removal.`);
          tiles.tileOrder.splice(i, 1);
          i--;
          continue;
        }

        const visible = isTileVisible(tile);
        const visibleDuration = (tile.lastVisibleTimestamp && visible) ? (now - tile.lastVisibleTimestamp) : 0;
        const canRemovePreferentially = !visible || (visible && visibleDuration < CONFIG.visibleLockDuration);

        if (canRemovePreferentially) {
          candidateIndexToRemove = i;
          break;
        }
      }

      if (candidateIndexToRemove === -1 && tiles.tileOrder.length > 0) {
        candidateIndexToRemove = 0;
      }

      if (candidateIndexToRemove !== -1) {
        const tileIdToRemove = tiles.tileOrder[candidateIndexToRemove];
        const tile = tiles.globalTiles.get(tileIdToRemove);

        if (tile) {
          for (let dy = 0; dy < tile.h; dy++) {
            for (let dx = 0; dx < tile.w; dx++) {
              tiles.occupancy.delete((tile.gx + dx) + "," + (tile.gy + dy));
            }
          }
          tiles.globalTiles.delete(tileIdToRemove);
          setGlobalTiles(new Map(tiles.globalTiles));
        } else {
          console.warn(`Attempted to remove tile ID ${tileIdToRemove} which was not found in globalTiles map.`);
        }
        tiles.tileOrder.splice(candidateIndexToRemove, 1);
      } else {
        console.warn(`Tile removal loop couldn't identify a candidate. Breaking removal loop.`);
        break;
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    generateTiles();
    
    const view = viewStateRef.current;
    const tiles = tilesStateRef.current;
    const now = Date.now();

    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;

    tiles.globalTiles.forEach(tile => {
      const screenX = tile.gx * CONFIG.gridSize * view.scale + view.offsetX;
      const screenY = tile.gy * CONFIG.gridSize * view.scale + view.offsetY;
      const sizeX = tile.w * CONFIG.gridSize * view.scale;
      const sizeY = tile.h * CONFIG.gridSize * view.scale;
      const viewMarginWorld = CONFIG.viewMargin * CONFIG.gridSize * view.scale;

      const currentlyVisible = !(
        screenX + sizeX < -viewMarginWorld ||
        screenY + sizeY < -viewMarginWorld ||
        screenX > canvas.width + viewMarginWorld ||
        screenY > canvas.height + viewMarginWorld
      );

      if (currentlyVisible) {
        if (tile.lastVisibleTimestamp === null) {
          tile.lastVisibleTimestamp = now;
        }

        ctx.fillStyle = tile.platform.color;
        ctx.fillRect(screenX, screenY, sizeX, sizeY);
        ctx.strokeRect(screenX, screenY, sizeX, sizeY);

        const minSizeForLabel = 30;
        if (view.scale > 0.4 && sizeX > minSizeForLabel && sizeY > minSizeForLabel) {
          ctx.fillStyle = "#fff";
          const fontSize = Math.min(24, Math.max(10, 14 * view.scale));
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tile.platform.name, screenX + sizeX / 2, screenY + sizeY / 2, sizeX * 0.9);
        }
      } else {
        tile.lastVisibleTimestamp = null;
      }
    });

    animationFrameId.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="bg-gray-800 block"
    />
  );
};

export default Canvas;