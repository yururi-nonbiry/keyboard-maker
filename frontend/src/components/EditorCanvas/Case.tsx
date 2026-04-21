import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { calculateBoundingBox } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface CaseProps {
  side?: 'left' | 'right';
}

/**
 * Renders a 3D case for the keyboard.
 * The case is modeled as a tray with a base and four walls surrounding the keys.
 */
const Case: React.FC<CaseProps> = ({ side }) => {
  const { data } = useKeyboardStore();
  const { wallThickness } = data.case_config;

  const renderCase = (keys: KeyConfig[], id: string, useCenter: boolean = false) => {
    const bbox = calculateBoundingBox(keys, wallThickness);
    if (!bbox) return null;

    // Center of the case in the world (or relative to parent)
    const x = useCenter ? 0 : bbox.centerX;
    const z = useCenter ? 0 : bbox.minY + bbox.height / 2;

    // Dimensions
    const baseThickness = 4;
    const wallHeight = 12; // Height from the bottom of the case
    
    // Y-positioning:
    // Plate is at y=-1 (top) to y=-2.5 (bottom).
    // Let's place the case base top at y=-5 to allow space for switches/PCB.
    const baseTopY = -5;
    const baseCenterY = baseTopY - baseThickness / 2;
    const wallCenterY = baseTopY - baseThickness + wallHeight / 2;

    return (
      <group key={id} position={[x, 0, z]}>
        {/* Base Plate */}
        <mesh position={[0, baseCenterY, 0]}>
          <boxGeometry args={[bbox.width, baseThickness, bbox.height]} />
          <meshStandardMaterial 
            color="#1a1a24" 
            metalness={0.4} 
            roughness={0.6} 
          />
        </mesh>

        {/* Walls */}
        {/* Front Wall */}
        <mesh position={[0, wallCenterY, bbox.height / 2 - wallThickness / 2]}>
          <boxGeometry args={[bbox.width, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Back Wall */}
        <mesh position={[0, wallCenterY, -bbox.height / 2 + wallThickness / 2]}>
          <boxGeometry args={[bbox.width, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Left Wall */}
        <mesh position={[-bbox.width / 2 + wallThickness / 2, wallCenterY, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, bbox.height]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Right Wall */}
        <mesh position={[bbox.width / 2 - wallThickness / 2, wallCenterY, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, bbox.height]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
    );
  };

  if (data.type === 'integrated') {
    return renderCase(data.layout, 'main-case', false);
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderCase(leftKeys, 'left-case', true);
  if (side === 'right') return renderCase(rightKeys, 'right-case', true);

  return (
    <>
      {renderCase(leftKeys, 'left-case', true)}
      {renderCase(rightKeys, 'right-case', true)}
    </>
  );
};

export default Case;
