import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { getControllerDimensions } from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface PCBProps {
  side?: 'left' | 'right';
}

const getGridBoundary = (rects: any[], resolution: number = 1.0) => {
  if (rects.length === 0) return [];

  // 1. Calculate Bounding Box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rects.forEach(r => {
    const diag = Math.sqrt(r.width * r.width + r.height * r.height) / 2;
    minX = Math.min(minX, r.centerX - diag);
    maxX = Math.max(maxX, r.centerX + diag);
    minY = Math.min(minY, r.centerY - diag);
    maxY = Math.max(maxY, r.centerY + diag);
  });

  minX -= resolution * 2;
  minY -= resolution * 2;
  maxX += resolution * 2;
  maxY += resolution * 2;

  const width = Math.ceil((maxX - minX) / resolution);
  const height = Math.ceil((maxY - minY) / resolution);

  // 2. Fill Grid
  const grid = new Uint8Array(width * height);
  const isPointInRect = (px: number, py: number, r: any) => {
    const dx = px - r.centerX;
    const dy = py - r.centerY;
    const cos = Math.cos(-r.angle);
    const sin = Math.sin(-r.angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return Math.abs(rx) <= r.width / 2 && Math.abs(ry) <= r.height / 2;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = minX + x * resolution;
      const py = minY + y * resolution;
      for (const r of rects) {
        if (isPointInRect(px, py, r)) {
          grid[y * width + x] = 1;
          break;
        }
      }
    }
  }

  // 3. Boundary Tracing (Moore Neighborhood)
  const get = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return grid[y * width + x];
  };

  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (get(x, y)) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return [];

  const boundary: {x: number, y: number}[] = [];
  let currX = startX, currY = startY;
  let prevX = startX - 1, prevY = startY; // Start from the left

  const dxs = [0, 1, 1, 1, 0, -1, -1, -1];
  const dys = [-1, -1, 0, 1, 1, 1, 0, -1];

  let limit = 2000; // Safety break
  do {
    boundary.push({ x: minX + currX * resolution, y: minY + currY * resolution });
    
    let dir = 0;
    for (let d = 0; d < 8; d++) {
      if (currX + dxs[d] === prevX && currY + dys[d] === prevY) {
        dir = d;
        break;
      }
    }

    let found = false;
    for (let i = 1; i <= 8; i++) {
      const nextDir = (dir + i) % 8;
      const nx = currX + dxs[nextDir];
      const ny = currY + dys[nextDir];
      if (get(nx, ny)) {
        prevX = currX + dxs[(nextDir + 7) % 8]; 
        prevY = currY + dys[(nextDir + 7) % 8];
        currX = nx;
        currY = ny;
        found = true;
        break;
      }
    }
    if (!found || --limit < 0) break;
  } while (currX !== startX || currY !== startY);

  // 4. Simplify Path
  if (boundary.length < 3) return boundary;
  const simplified: {x: number, y: number}[] = [boundary[0]];
  for (let i = 1; i < boundary.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = boundary[i];
    const next = boundary[(i + 1) % boundary.length];
    
    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
    if (Math.abs(cross) > 0.001) {
      simplified.push(curr);
    }
  }

  return simplified;
};

const PCB: React.FC<PCBProps> = ({ side }) => {
  const { data, showPCB } = useKeyboardStore();
  const { keyPitch } = data.case_config;

  if (!showPCB) return null;

  const renderPCB = (keys: KeyConfig[], id: string) => {
    // Margin around components for the PCB edge
    const margin = 3.0;

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
      return t.side === side;
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

    // Calculate bbox for centering the shape
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

    // Standard PCB thickness is 1.6mm
    const pcbThickness = 1.6;
    // Position it below the plate (which is at y=-1)
    const pcbY = -4.0;

    // Use useMemo to avoid regenerating geometry on every render
    const geometry = useMemo(() => {
      const shape = new THREE.Shape();
      
      const first = boundaryPoints[0];
      shape.moveTo(first.x - bbox.centerX, first.y - bbox.centerY);
      for (let i = 1; i < boundaryPoints.length; i++) {
        shape.lineTo(boundaryPoints[i].x - bbox.centerX, boundaryPoints[i].y - bbox.centerY);
      }
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

      // Holes for Trackballs
      sideTrackballs.forEach(t => {
        const relX = t.x - bbox.centerX;
        const relY = t.y - bbox.centerY;
        
        // Sensor aperture
        const aperturePath = new THREE.Path();
        aperturePath.absarc(relX, relY, 5, 0, Math.PI * 2, true);
        shape.holes.push(aperturePath);

        // Mounting holes
        const mountingHoles = [
          { x: -10, y: -10, r: 1.5 },
          { x: 10, y: -10, r: 1.5 },
          { x: -10, y: 10, r: 1.5 },
          { x: 10, y: 10, r: 1.5 }
        ];

        mountingHoles.forEach(pos => {
          const path = new THREE.Path();
          path.absarc(relX + pos.x, relY + pos.y, pos.r, 0, Math.PI * 2, true);
          shape.holes.push(path);
        });
      });

      // Holes for Controllers
      sideControllers.forEach(c => {
        const relX = c.x - bbox.centerX;
        const relY = c.y - bbox.centerY;
        const rot = -c.rotation * (Math.PI / 180);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        let pinsPerSide = 12;
        let rowSpacing = 15.24;
        const pinPitch = 2.54;

        switch (c.type) {
          case 'xiao_rp2040':
          case 'xiao_ble':
            pinsPerSide = 7;
            rowSpacing = 15.24;
            break;
          case 'pico':
            pinsPerSide = 20;
            rowSpacing = 17.78;
            break;
          case 'bluepill':
            pinsPerSide = 20;
            rowSpacing = 15.24;
            break;
          case 'pro_micro':
          case 'elite_c':
          default:
            pinsPerSide = 12;
            rowSpacing = 15.24;
            break;
        }

        for (let i = 0; i < pinsPerSide; i++) {
          const pinY = (i - (pinsPerSide - 1) / 2) * pinPitch;
          
          // Left row
          const posL = { x: -rowSpacing / 2, y: pinY, r: 0.5 };
          const pathL = new THREE.Path();
          const rotatedXL = relX + posL.x * cos - posL.y * sin;
          const rotatedYL = relY + posL.x * sin + posL.y * cos;
          pathL.absarc(rotatedXL, rotatedYL, posL.r, 0, Math.PI * 2, true);
          shape.holes.push(pathL);

          // Right row
          const posR = { x: rowSpacing / 2, y: pinY, r: 0.5 };
          const pathR = new THREE.Path();
          const rotatedXR = relX + posR.x * cos - posR.y * sin;
          const rotatedYR = relY + posR.x * sin + posR.y * cos;
          pathR.absarc(rotatedXR, rotatedYR, posR.r, 0, Math.PI * 2, true);
          shape.holes.push(pathR);
        }
      });

      const extrudeSettings = {
        depth: pcbThickness,
        bevelEnabled: false,
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Center the geometry relative to its thickness
      geo.translate(0, 0, -pcbThickness / 2);
      return geo;
    }, [keys, sideTrackballs, sideControllers, bbox, pcbThickness, boundaryPoints]);

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
