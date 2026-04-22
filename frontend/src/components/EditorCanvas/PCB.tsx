import React, { useMemo } from 'react';
import * as THREE from 'three';
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
    const pcbY = -4.0;

    // Use useMemo to avoid regenerating geometry on every render
    const geometry = useMemo(() => {
      const shape = new THREE.Shape();
      const hw = bbox.width / 2;
      const hh = bbox.height / 2;

      // Outer boundary
      shape.moveTo(-hw, -hh);
      shape.lineTo(hw, -hh);
      shape.lineTo(hw, hh);
      shape.lineTo(-hw, hh);
      shape.closePath();

      // Holes for keys
      keys.forEach(key => {
        const relX = key.x - bbox.centerX;
        const relY = key.y - bbox.centerY;
        const rot = -key.rotation * (Math.PI / 180);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        // Standard MX PCB footprint holes
        const holePositions = [
          { x: 0, y: 0, r: 2.0 },        // Center post (4mm dia)
          { x: 5.08, y: 0, r: 0.85 },    // PCB mount pin 1 (1.7mm dia)
          { x: -5.08, y: 0, r: 0.85 },   // PCB mount pin 2 (1.7mm dia)
          { x: -3.81, y: -2.54, r: 0.75 }, // Metal pin 1 (1.5mm dia)
          { x: 2.54, y: -5.08, r: 0.75 }   // Metal pin 2 (1.5mm dia)
        ];

        holePositions.forEach(pos => {
          const path = new THREE.Path();
          const rotatedX = relX + pos.x * cos - pos.y * sin;
          const rotatedY = relY + pos.x * sin + pos.y * cos;
          path.absarc(rotatedX, rotatedY, pos.r, 0, Math.PI * 2, true);
          shape.holes.push(path);
        });
      });

      const extrudeSettings = {
        depth: pcbThickness,
        bevelEnabled: false,
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Center the geometry relative to its thickness
      geo.translate(0, 0, -pcbThickness / 2);
      return geo;
    }, [keys, bbox, pcbThickness]);

    return (
      <mesh 
        key={id} 
        position={[bbox.centerX, pcbY, bbox.centerY]}
        rotation={[Math.PI / 2, 0, 0]} // Rotate to lay flat in XZ plane
        geometry={geometry}
      >
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
