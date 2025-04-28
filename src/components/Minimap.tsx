import React, { useEffect, useRef } from 'react';
import { CONFIG } from '../config';

interface MinimapProps {
  globalTiles: Map<number, any>;
  scale: number;
  offsetX: number;
  offsetY: number;
  canvasWidth: number;
  canvasHeight: number;
}

const Minimap: React.FC<MinimapProps> = ({ 
  globalTiles, 
  scale, 
  offsetX, 
  offsetY,
  canvasWidth,
  canvasHeight
}) => {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const minimapCanvas = minimapRef.current;
    if (!minimapCanvas) return;
    
    const minimapCtx = minimapCanvas.getContext('2d');
    if (!minimapCtx) return;

    minimapCtx.fillStyle = "rgba(50,50,50,0.8)";
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    if (globalTiles.size === 0) return;
    
    const tilesArray = Array.from(globalTiles.values());
    let minGX = Infinity, minGY = Infinity, maxGX = -Infinity, maxGY = -Infinity;
    
    tilesArray.forEach(tile => {
      minGX = Math.min(minGX, tile.gx);
      minGY = Math.min(minGY, tile.gy);
      maxGX = Math.max(maxGX, tile.gx + tile.w);
      maxGY = Math.max(maxGY, tile.gy + tile.h);
    });
    
    if (!isFinite(minGX)) return;
    
    const padding = 2;
    minGX -= padding;
    minGY -= padding;
    maxGX += padding;
    maxGY += padding;
    
    const gridWidth = maxGX - minGX;
    const gridHeight = maxGY - minGY;
    
    if (gridWidth <= 0 || gridHeight <= 0) return;
    
    const scaleX = minimapCanvas.width / gridWidth;
    const scaleY = minimapCanvas.height / gridHeight;
    const minimapScale = Math.min(scaleX, scaleY);
    
    const drawWidth = gridWidth * minimapScale;
    const drawHeight = gridHeight * minimapScale;
    const mapOffsetX = (minimapCanvas.width - drawWidth) / 2;
    const mapOffsetY = (minimapCanvas.height - drawHeight) / 2;
    
    tilesArray.forEach(tile => {
      const mx = mapOffsetX + (tile.gx - minGX) * minimapScale;
      const my = mapOffsetY + (tile.gy - minGY) * minimapScale;
      const mSizeX = Math.max(1, tile.w * minimapScale);
      const mSizeY = Math.max(1, tile.h * minimapScale);
      
      minimapCtx.fillStyle = tile.platform.color;
      minimapCtx.fillRect(mx, my, mSizeX, mSizeY);
    });
    
    const invMainScale = 1 / scale;
    const viewGridX1 = ((0 - offsetX) * invMainScale) / CONFIG.gridSize;
    const viewGridY1 = ((0 - offsetY) * invMainScale) / CONFIG.gridSize;
    const viewGridX2 = ((canvasWidth - offsetX) * invMainScale) / CONFIG.gridSize;
    const viewGridY2 = ((canvasHeight - offsetY) * invMainScale) / CONFIG.gridSize;
    
    const miniX = mapOffsetX + (viewGridX1 - minGX) * minimapScale;
    const miniY = mapOffsetY + (viewGridY1 - minGY) * minimapScale;
    const miniW = (viewGridX2 - viewGridX1) * minimapScale;
    const miniH = (viewGridY2 - viewGridY1) * minimapScale;
    
    minimapCtx.strokeStyle = "#fff";
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(miniX, miniY, miniW, miniH);
  }, [globalTiles, scale, offsetX, offsetY, canvasWidth, canvasHeight]);

  return (
    <canvas 
      ref={minimapRef} 
      width={200} 
      height={200} 
      className="absolute bottom-10 right-10 bg-opacity-80 bg-gray-700 border border-gray-500"
    />
  );
};

export default Minimap;