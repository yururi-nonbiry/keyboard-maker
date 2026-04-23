import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getGridBoundary, getControllerDimensions } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PlateProps {
  side?: 'left' | 'right';
}

interface PlateMeshProps {
  keys: KeyConfig[];
  plateThickness: number;
  boundaryPoints: { x: number; y: number }[];
  center: { x: number; y: number };
}

const PlateMesh: React.FC<PlateMeshProps> = ({ keys, plateThickness, boundaryPoints, center }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Outer boundary from grid tracing
    const first = boundaryPoints[0];
    shape.moveTo(first.x - center.x, first.y - center.y);
    for (let i = 1; i < boundaryPoints.length; i++) {
      shape.lineTo(boundaryPoints[i].x - center.x, boundaryPoints[i].y - center.y);
    }
    shape.closePath();

    // Holes for keys
    keys.forEach(key => {
      const relX = key.x - center.x;
      const relY = key.y - center.y;
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
  }, [keys, boundaryPoints, center, plateThickness]);

  return (
    <mesh 
      position={[center.x, -1, center.y]}
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
  const { plateThickness, keyPitch, pcbMargin = 3.0, plateOffset = 0.0 } = data.case_config;

  const renderPlateComponent = (keys: KeyConfig[]) => {
    if (!showPlate || keys.length === 0) return null;

    // The plate margin is derived from pcbMargin + plateOffset
    const margin = pcbMargin + plateOffset;

    // Component footprints (with margin)
    const footprints: { centerX: number; centerY: number; width: number; height: number; angle: number }[] = [];

    // Keys
    keys.forEach(key => {
      footprints.push({
        centerX: key.x,
        centerY: key.y,
        width: key.keycapSize.width * keyPitch + margin * 2,
        height: key.keycapSize.height * keyPitch + margin * 2,
        angle: -key.rotation * (Math.PI / 180)
      });
    });
    
    // Trackballs
    const sideTrackballs = (data.trackballs || []).filter(t => {
      if (!side) return true; // integrated
      return t.side === side || (!t.side && side === 'left');
    });

    sideTrackballs.forEach(t => {
      footprints.push({
        centerX: t.x,
        centerY: t.y,
        width: t.diameter + margin * 2,
        height: t.diameter + margin * 2,
        angle: 0
      });
    });

    // Controllers
    const sideControllers = (data.controllers || []).filter(c => {
      if (!side) return true; // integrated
      return c.side === side;
    });

    sideControllers.forEach(c => {
      const dimensions = getControllerDimensions(c.type);
      footprints.push({
        centerX: c.x,
        centerY: c.y,
        width: dimensions.width + margin * 2,
        height: dimensions.length + margin * 2,
        angle: -c.rotation * (Math.PI / 180)
      });
    });

    const boundaryPoints = getGridBoundary(footprints, 1.0);
    if (boundaryPoints.length === 0) return null;

    // Calculate bbox for centering
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    boundaryPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };

    return <PlateMesh keys={keys} plateThickness={plateThickness} boundaryPoints={boundaryPoints} center={center} />;
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

