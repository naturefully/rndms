import React, { useState } from 'react';
import Canvas from './components/Canvas';
import Minimap from './components/Minimap';
import UI from './components/UI';
import { Tile } from './types';
import { PLATFORMS } from './config';
import './index.css';

function App() {
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(
    new Set(PLATFORMS.map(p => p.id))
  );
  const [globalTiles, setGlobalTiles] = useState<Map<number, Tile>>(new Map());
  const [scale, setScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(window.innerWidth / 2);
  const [offsetY, setOffsetY] = useState<number>(window.innerHeight / 2);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <Canvas 
        enabledPlatforms={enabledPlatforms}
        setGlobalTiles={setGlobalTiles}
        globalTiles={globalTiles}
        scale={scale}
        setScale={setScale}
        offsetX={offsetX}
        setOffsetX={setOffsetX}
        offsetY={offsetY}
        setOffsetY={setOffsetY}
      />
      <Minimap 
        globalTiles={globalTiles}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
        canvasWidth={window.innerWidth}
        canvasHeight={window.innerHeight}
      />
      <UI 
        platforms={PLATFORMS}
        enabledPlatforms={enabledPlatforms}
        setEnabledPlatforms={setEnabledPlatforms}
      />
    </div>
  );
}

export default App;