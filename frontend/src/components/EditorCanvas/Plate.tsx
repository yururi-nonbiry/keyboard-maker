import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { KeyConfig } from '../../types';

interface BoundingBox {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

const calculateBoundingBox = (keys: KeyConfig[]): BoundingBox | null => {
  if (keys.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const padding = 10;

  keys.forEach(key => {
    const halfW = (key.keycapSize.width * 19.05) / 2;
    const halfH = (key.keycapSize.height * 19.05) / 2;
    minX = Math.min(minX, key.x - halfW);
    maxX = Math.max(maxX, key.x + halfW);
    minY = Math.min(minY, key.y - halfH);
    maxY = Math.max(maxY, key.y + halfH);
  });

  return {
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2,
    centerX: (maxX + minX) / 2,
    centerY: (maxY + minY) / 2,
  };
};

const Plate: React.FC = () => {
  const { data } = useKeyboardStore();
  const { plateThickness } = data.case_config;

  const renderPlate = (keys: KeyConfig[], id: string) => {
    const bbox = calculateBoundingBox(keys);
    if (!bbox) return null;

    return (
      <mesh key={id} position={[bbox.centerX, -1, bbox.centerY]}>
        <boxGeometry args={[bbox.width, plateThickness, bbox.height]} />
        <meshStandardMaterial 
          color="#2d2d35" 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
    );
  };

  if (data.type === 'integrated') {
    return renderPlate(data.layout, 'main-plate');
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  return (
    <>
      {renderPlate(leftKeys, 'left-plate')}
      {renderPlate(rightKeys, 'right-plate')}
    </>
  );
};

export default Plate;
