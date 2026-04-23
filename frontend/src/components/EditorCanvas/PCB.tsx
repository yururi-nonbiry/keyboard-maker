import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getControllerDimensions, getGridBoundary } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PCBProps {
  side?: 'left' | 'right';
}

interface PCBMeshProps {
  keys: KeyConfig[];
  sideControllers: any[]; // Changed from any to any for now to avoid cascading type errors if I don't have the exact type
  pcbThickness: number;
  boundaryPoints: { x: number; y: number }[];
  bbox: { centerX: number; centerY: number; width: number; height: number };
  pcbY: number;
  mountingHoles: any[];
}

const PCBMesh: React.FC<PCBMeshProps> = ({ 
  keys, 
  sideControllers, 
  pcbThickness, 
  boundaryPoints, 
  bbox, 
  pcbY,
  mountingHoles
}) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    const first = boundaryPoints[0];
    shape.moveTo(first.x - bbox.centerX, first.y - bbox.centerY);
    for (let i = 1; i < boundaryPoints.length; i++) {
      shape.lineTo(boundaryPoints[i].x - bbox.centerX, boundaryPoints[i].y - bbox.centerY);
    }
    shape.closePath();

    keys.forEach(key => {
      const relX = key.x - bbox.centerX;
      const relY = key.y - bbox.centerY;
      const rot = -key.rotation * (Math.PI / 180);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      const holePositions = [
        { x: 0, y: 0, r: 2.0 },        
        { x: 5.08, y: 0, r: 0.85 },    
        { x: -5.08, y: 0, r: 0.85 },   
        { x: -3.81, y: -2.54, r: 0.75 }, 
        { x: 2.54, y: -5.08, r: 0.75 }   
      ];

      holePositions.forEach(pos => {
        const path = new THREE.Path();
        const rotatedX = relX + pos.x * cos - pos.y * sin;
        const rotatedY = relY + pos.x * sin + pos.y * cos;
        path.absarc(rotatedX, rotatedY, pos.r, 0, Math.PI * 2, true);
        shape.holes.push(path);
      });
    });

    // Skip trackball holes as requested
    /*
    sideTrackballs.forEach(t => {
      const relX = t.x - bbox.centerX;
      const relY = t.y - bbox.centerY;
      
      const aperturePath = new THREE.Path();
      aperturePath.absarc(relX, relY, 5, 0, Math.PI * 2, true);
      shape.holes.push(aperturePath);

      const mountingHoles = [
        { x: -10, y: -10, r: 1.5 },
        { x: 10, y: -10, r: 1.5 },
        { x: 10, y: 10, r: 1.5 },
        { x: -10, y: 10, r: 1.5 }
      ];

      mountingHoles.forEach(h => {
        const path = new THREE.Path();
        path.absarc(relX + h.x, relY + h.y, h.r, 0, Math.PI * 2, true);
        shape.holes.push(path);
      });
    });
    */

    sideControllers.forEach(c => {
      const relX = c.x - bbox.centerX;
      const relY = c.y - bbox.centerY;
      const rot = -c.rotation * (Math.PI / 180);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      const pinPitch = 2.54;
      let pinsPerSide = 12;
      let rowSpacing = 15.24;

      switch (c.type) {
        case 'xiao_rp2040':
        case 'xiao_ble':
          pinsPerSide = 7;
          rowSpacing = 17.78;
          break;
        case 'pico':
          pinsPerSide = 20;
          rowSpacing = 17.78;
          break;
        case 'bluepill':
          pinsPerSide = 20;
          rowSpacing = 15.24;
          break;
        default:
          pinsPerSide = 12;
          rowSpacing = 15.24;
          break;
      }

      for (let i = 0; i < pinsPerSide; i++) {
        const pinY = (i - (pinsPerSide - 1) / 2) * pinPitch;
        
        const rotatedXL = relX + (-rowSpacing / 2) * cos - pinY * sin;
        const rotatedYL = relY + (-rowSpacing / 2) * sin + pinY * cos;
        const pathL = new THREE.Path();
        pathL.absarc(rotatedXL, rotatedYL, 0.5, 0, Math.PI * 2, true);
        shape.holes.push(pathL);

        const rotatedXR = relX + (rowSpacing / 2) * cos - pinY * sin;
        const rotatedYR = relY + (rowSpacing / 2) * sin + pinY * cos;
        const pathR = new THREE.Path();
        pathR.absarc(rotatedXR, rotatedYR, 0.5, 0, Math.PI * 2, true);
        shape.holes.push(pathR);
      }
    });

    // Custom Mounting holes
    mountingHoles.forEach(hole => {
      const relX = hole.x - bbox.centerX;
      const relY = hole.y - bbox.centerY;
      
      const path = new THREE.Path();
      path.absarc(relX, relY, hole.diameter / 2, 0, Math.PI * 2, true);
      shape.holes.push(path);
    });

    const extrudeSettings = {
      depth: pcbThickness,
      bevelEnabled: false,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -pcbThickness / 2);
    return geo;
  }, [keys, sideControllers, boundaryPoints, bbox, pcbThickness, mountingHoles]);

  return (
    <mesh 
      position={[bbox.centerX, pcbY, bbox.centerY]}
      rotation={[Math.PI / 2, 0, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial 
        color="#1b4d2e"
        metalness={0.3} 
        roughness={0.7} 
      />
    </mesh>
  );
};

const PCB: React.FC<PCBProps> = ({ side }) => {
  const { data, showPCB } = useKeyboardStore();
  const { keyPitch, pcbMargin = 3.0 } = data.case_config;

  if (!showPCB) return null;

  const renderPCBComponent = (keys: KeyConfig[]) => {
    if (keys.length === 0) return null;

    const margin = pcbMargin || 3.0;
    const footprints: { centerX: number; centerY: number; width: number; height: number; angle: number }[] = [];

    keys.forEach(key => {
      footprints.push({
        centerX: key.x,
        centerY: key.y,
        width: key.keycapSize.width * keyPitch + margin * 2,
        height: key.keycapSize.height * keyPitch + margin * 2,
        angle: -key.rotation * (Math.PI / 180)
      });
    });
    
    const cutouts: { centerX: number; centerY: number; radius: number }[] = [];
    const bridges: { centerX: number; centerY: number; width: number; height: number; angle: number }[] = [];

    /*
    sideTrackballs.forEach(t => {
      // Circle cutout for the ball assembly
      cutouts.push({
        centerX: t.x,
        centerY: t.y,
        radius: t.diameter / 2 + margin
      });

      // Find closest key to point the bridge towards
      let closestKey = keys[0];
      let minD = Infinity;
      keys.forEach(k => {
        const d = (k.x - t.x) ** 2 + (k.y - t.y) ** 2;
        if (d < minD) { minD = d; closestKey = k; }
      });

      if (closestKey) {
        const angle = Math.atan2(closestKey.y - t.y, closestKey.x - t.x);
        const dist = Math.sqrt((closestKey.x - t.x) ** 2 + (closestKey.y - t.y) ** 2);
        const bridgeLength = dist; 
        
        bridges.push({
          centerX: t.x + Math.cos(angle) * (bridgeLength / 2),
          centerY: t.y + Math.sin(angle) * (bridgeLength / 2),
          width: 16, // Slightly wider for stability
          height: bridgeLength,
          angle: angle - Math.PI / 2 // Correct rotation to point along the vector
        });
      }
    });
    */

    // Controllers
    const sideControllers = (data.controllers || []).filter(c => {
      if (!side) return true;
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

    const sideMountingHoles = (data.mountingHoles || []).filter(h => {
      if (!side) return true;
      return h.side === side;
    });

    const boundaryPoints = getGridBoundary(footprints, cutouts, bridges, 1.0);
    if (boundaryPoints.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    boundaryPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const bbox = {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };

    const pcbThickness = 1.6;
    const pcbY = -4.0;

    return (
      <PCBMesh 
        keys={keys}
        sideControllers={sideControllers}
        pcbThickness={pcbThickness}
        boundaryPoints={boundaryPoints}
        bbox={bbox}
        pcbY={pcbY}
        mountingHoles={sideMountingHoles}
      />
    );
  };

  if (data.type === 'integrated') {
    return renderPCBComponent(data.layout);
  }

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  if (side === 'left') return renderPCBComponent(leftKeys);
  if (side === 'right') return renderPCBComponent(rightKeys);

  return (
    <>
      {renderPCBComponent(leftKeys)}
      {renderPCBComponent(rightKeys)}
    </>
  );
};

export default PCB;
