import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getComponentCorners, calculatePointsBoundingBox } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface CaseProps {
  side?: 'left' | 'right';
}

/**
 * Renders a 3D case for the keyboard.
 * The case is modeled as a tray with a base and four walls surrounding the keys and other components.
 */
const Case: React.FC<CaseProps> = ({ side }) => {
  const { data } = useKeyboardStore();
  const { wallThickness, keyPitch } = data.case_config;

  const renderCase = (keys: KeyConfig[], id: string) => {
    // Collect corners from all components on this side
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
      // For trackballs, we use the diameter as both width and height
      allCorners.push(...getComponentCorners(
        t.x,
        t.y,
        t.diameter,
        t.diameter,
        0
      ));
    });

    // Controllers
    const sideControllers = (data.controllers || []).filter(c => {
      if (!side) return true; // integrated
      return c.side === side;
    });

    sideControllers.forEach(c => {
      let dimensions = { width: 18, length: 33 };
      switch (c.type) {
        case 'xiao_rp2040': dimensions = { width: 18, length: 21 }; break;
        case 'pico': dimensions = { width: 21, length: 51 }; break;
        case 'bluepill': dimensions = { width: 23, length: 53 }; break;
      }
      
      allCorners.push(...getComponentCorners(
        c.x,
        c.y,
        dimensions.width,
        dimensions.length,
        c.rotation
      ));
    });

    const bbox = calculatePointsBoundingBox(allCorners, wallThickness);
    if (!bbox) return null;

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
      <group key={id}>
        {/* Base Plate */}
        <mesh position={[bbox.centerX, baseCenterY, bbox.centerY]}>
          <boxGeometry args={[bbox.width, baseThickness, bbox.height]} />
          <meshStandardMaterial 
            color="#1a1a24" 
            metalness={0.4} 
            roughness={0.6} 
          />
        </mesh>

        {/* Walls */}
        {/* Front Wall */}
        <mesh position={[bbox.centerX, wallCenterY, bbox.maxY - wallThickness / 2]}>
          <boxGeometry args={[bbox.width, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Back Wall */}
        <mesh position={[bbox.centerX, wallCenterY, bbox.minY + wallThickness / 2]}>
          <boxGeometry args={[bbox.width, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Left Wall */}
        <mesh position={[bbox.minX + wallThickness / 2, wallCenterY, bbox.centerY]}>
          <boxGeometry args={[wallThickness, wallHeight, bbox.height]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Right Wall */}
        <mesh position={[bbox.maxX - wallThickness / 2, wallCenterY, bbox.centerY]}>
          <boxGeometry args={[wallThickness, wallHeight, bbox.height]} />
          <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
    );
  };

  if (data.type === 'integrated') {
    return renderCase(data.layout, 'main-case');
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderCase(leftKeys, 'left-case');
  if (side === 'right') return renderCase(rightKeys, 'right-case');

  return (
    <>
      {renderCase(leftKeys, 'left-case')}
      {renderCase(rightKeys, 'right-case')}
    </>
  );
};

export default Case;
