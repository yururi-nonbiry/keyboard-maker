import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getComponentCorners, calculatePointsBoundingBox, getControllerDimensions } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PCBProps {
  side?: 'left' | 'right';
}

const PCB: React.FC<PCBProps> = ({ side }) => {
  const { data, showPCB } = useKeyboardStore();
  const { keyPitch } = data.case_config;

  if (!showPCB) return null;

  const renderPCB = (keys: KeyConfig[], id: string) => {
    // Collect corners from keys, trackballs, and controllers
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
    
    // Controllers
    const sideControllers = (data.controllers || []).filter(c => {
      if (!side) return true; // integrated
      return c.side === side;
    });

    sideControllers.forEach(c => {
      const dimensions = getControllerDimensions(c.type);
      
      allCorners.push(...getComponentCorners(
        c.x,
        c.y,
        dimensions.width,
        dimensions.length,
        c.rotation
      ));
    });

    const bbox = calculatePointsBoundingBox(allCorners, 1); // Small padding for the PCB
    if (!bbox) return null;

    // Standard PCB thickness is 1.6mm
    const pcbThickness = 1.6;
    // Position it below the plate (which is at y=-1)
    // Plate is 1.5mm thick, so bottom of plate is at -2.5.
    // Let's place PCB at -4.0 (giving some space for switch pins)
    const pcbY = -4.0;

    return (
      <mesh key={id} position={[bbox.centerX, pcbY, bbox.centerY]}>
        <boxGeometry args={[bbox.width, pcbThickness, bbox.height]} />
        <meshStandardMaterial 
          color="#1b4d2e" // Classic green PCB color
          metalness={0.3} 
          roughness={0.7} 
        />
      </mesh>
    );
  };

  if (data.type === 'integrated') {
    return renderPCB(data.layout, 'main-pcb');
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderPCB(leftKeys, 'left-pcb');
  if (side === 'right') return renderPCB(rightKeys, 'right-pcb');

  return (
    <>
      {renderPCB(leftKeys, 'left-pcb')}
      {renderPCB(rightKeys, 'right-pcb')}
    </>
  );
};

export default PCB;
