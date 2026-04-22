import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getComponentCorners, calculatePointsBoundingBox, getControllerDimensions } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PlateProps {
  side?: 'left' | 'right';
}

interface PlateMeshProps {
  keys: KeyConfig[];
  plateThickness: number;
  bbox: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

const PlateMesh: React.FC<PlateMeshProps> = ({ keys, plateThickness, bbox }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const hw_plate = bbox.width / 2;
    const hh_plate = bbox.height / 2;

    // Outer boundary
    shape.moveTo(-hw_plate, -hh_plate);
    shape.lineTo(hw_plate, -hh_plate);
    shape.lineTo(hw_plate, hh_plate);
    shape.lineTo(-hw_plate, hh_plate);
    shape.closePath();

    // Holes for keys
    keys.forEach(key => {
      const relX = key.x - bbox.centerX;
      const relY = key.y - bbox.centerY;
      const rot = -key.rotation * (Math.PI / 180);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      // Standard MX plate cutout (14x14mm)
      const holeSize = 14;
      const hw = holeSize / 2;
      
      const path = new THREE.Path();
      const corners = [
        { x: -hw, y: -hw },
        { x: hw, y: -hw },
        { x: hw, y: hw },
        { x: -hw, y: hw }
      ];
      
      const rotatedCorners = corners.map(p => ({
        x: relX + p.x * cos - p.y * sin,
        y: relY + p.x * sin + p.y * cos
      }));
      
      path.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      path.lineTo(rotatedCorners[1].x, rotatedCorners[1].y);
      path.lineTo(rotatedCorners[2].x, rotatedCorners[2].y);
      path.lineTo(rotatedCorners[3].x, rotatedCorners[3].y);
      path.closePath();
      shape.holes.push(path);
    });

    const extrudeSettings = {
      depth: plateThickness,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -plateThickness / 2);
    return geo;
  }, [keys, bbox, plateThickness]);

  return (
    <mesh 
      position={[bbox.centerX, -1, bbox.centerY]}
      rotation={[Math.PI / 2, 0, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial 
        color="#2d2d35" 
        metalness={0.8} 
        roughness={0.2} 
      />
    </mesh>
  );
};

const Plate: React.FC<PlateProps> = ({ side }) => {
  const { data, showPlate } = useKeyboardStore();
  const { plateThickness, keyPitch } = data.case_config;

  const renderPlateComponent = (keys: KeyConfig[]) => {
    if (!showPlate || keys.length === 0) return null;

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

    const bbox = calculatePointsBoundingBox(allCorners, 2); // Small padding for the plate
    if (!bbox) return null;

    return <PlateMesh keys={keys} plateThickness={plateThickness} bbox={bbox} />;
  };

  if (data.type === 'integrated') {
    return renderPlateComponent(data.layout);
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderPlateComponent(leftKeys);
  if (side === 'right') return renderPlateComponent(rightKeys);

  return (
    <>
      {renderPlateComponent(leftKeys)}
      {renderPlateComponent(rightKeys)}
    </>
  );
};

export default Plate;
