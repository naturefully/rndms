import React from 'react';
import { Platform } from '../types';

interface UIProps {
  platforms: Platform[];
  enabledPlatforms: Set<string>;
  setEnabledPlatforms: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const UI: React.FC<UIProps> = ({ platforms, enabledPlatforms, setEnabledPlatforms }) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const platformId = e.target.getAttribute('data-id');
    if (!platformId) return;
    
    setEnabledPlatforms(prev => {
      const newSet = new Set(prev);
      if (e.target.checked) {
        newSet.add(platformId);
      } else {
        newSet.delete(platformId);
      }
      return newSet;
    });
  };

  return (
    <div className="absolute top-10 left-10 z-10 bg-opacity-70 bg-black p-8 rounded-lg">
      <strong className="text-white mr-2">Platforms:</strong>
      {platforms.map(platform => (
        <label key={platform.id} className="mr-10 text-white inline-flex items-center">
          <input 
            type="checkbox" 
            className="platformCheckbox mr-2" 
            data-id={platform.id} 
            checked={enabledPlatforms.has(platform.id)}
            onChange={handleCheckboxChange}
          /> 
          {platform.name}
        </label>
      ))}
    </div>
  );
};

export default UI;