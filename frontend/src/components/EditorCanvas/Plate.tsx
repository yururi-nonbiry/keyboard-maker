import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getComponentCorners, calculatePointsBoundingBox } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PlateProps {
  side?: 'left' | 'right';
}

const Plate: React.FC<PlateProps> = ({ side }) => {
  const { data } = useKeyboardStore();
  const { plateThickness, keyPitch } = data.case_config;

  const renderPlate = (keys: KeyConfig[], id: string) => {
    // Collect corners from keys and trackballs
    const allCorners: { x: number; y: number }[] = [];

    // Keys
    keys.forEach(key => {
      allCorners.push(...getComponentCorners(
        key.x,
        key.y,
        key.keycapSize.width * keyPitch,
        key.keycapSize.height * keyPitch,
        key.rotation
      ));
    });

    // Trackballs
    const sideTrackballs = (data.trackballs || []).filter(t => {
      if (!side) return true; // integrated
      return t.side === side || (!t.side && side === 'left');
    });

    sideTrackballs.forEach(t => {
      allCorners.push(...getComponentCorners(
        t.x,
        t.y,
        t.diameter,
        t.diameter,
        0
      ));
    });

    const bbox = calculatePointsBoundingBox(allCorners, 2); // Small padding for the plate
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
