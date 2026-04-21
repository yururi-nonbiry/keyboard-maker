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

  const renderPlate = (keys: KeyConfig[], id: string, useCenter: boolean = false) => {
    const bbox = calculateBoundingBox(keys);
    if (!bbox) return null;

    // If useCenter is true, the parent is already centered on the keys, so plate should be at [0, -1, 0]
    const x = useCenter ? 0 : bbox.centerX;
    const z = useCenter ? 0 : bbox.minY + bbox.height / 2;

    return (
      <mesh key={id} position={[x, -1, z]}>
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

    return renderPlate(data.layout, 'main-plate', false);
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderPlate(leftKeys, 'left-plate', true);
  if (side === 'right') return renderPlate(rightKeys, 'right-plate', true);

  return (
    <>
      {renderPlate(leftKeys, 'left-plate', true)}
      {renderPlate(rightKeys, 'right-plate', true)}
    </>
  );
};

export default Plate;
