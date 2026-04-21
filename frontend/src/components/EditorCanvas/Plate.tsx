import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { calculateBoundingBox } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PlateProps {
  side?: 'left' | 'right';
}

const Plate: React.FC<PlateProps> = ({ side }) => {
  const { data } = useKeyboardStore();
  const { plateThickness } = data.case_config;

  const renderPlate = (keys: KeyConfig[], id: string) => {
    const bbox = calculateBoundingBox(keys);
    if (!bbox) return null;

    return (
      <mesh key={id} position={[bbox.centerX, -1, bbox.minY + bbox.height / 2]}>
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
    const mainBbox = calculateBoundingBox(data.layout);
    if (!mainBbox) return null;

    return (
      <mesh key="main-plate" position={[mainBbox.centerX, -1, mainBbox.minY + mainBbox.height / 2]}>
        <boxGeometry args={[mainBbox.width, plateThickness, mainBbox.height]} />
        <meshStandardMaterial 
          color="#2d2d35" 
          metalness={0.8} 
          roughness={0.2} 
        />
      </mesh>
    );
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderPlate(leftKeys, 'left-plate');
  if (side === 'right') return renderPlate(rightKeys, 'right-plate');

  return (
    <>
      {renderPlate(leftKeys, 'left-plate')}
      {renderPlate(rightKeys, 'right-plate')}
    </>
  );
};

export default Plate;
