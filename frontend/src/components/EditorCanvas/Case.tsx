import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { 
  getComponentCorners, 
  calculatePointsBoundingBox, 
  getControllerDimensions,
  calculateGroundedY 
} from '../../utils/geometry';
import type { KeyConfig } from '../../types';

interface CaseProps {
  side?: 'left' | 'right';
  groundY: number;
  lift: number;
  tentingAngle: number;
  splitRotation: number;
  typingAngle: number;
}

/**
 * A component that renders a box whose bottom face is grounded.
 */
const GroundedBox: React.FC<{
  width: number;
  depth: number;
  centerX: number;
  centerY: number;
  topY: number;
  groundY: number;
  lift: number;
  tentingAngle: number;
  splitRotation: number;
  typingAngle: number;
  color?: string;
}> = ({ width, depth, centerX, centerY, topY, groundY, lift, tentingAngle, splitRotation, typingAngle, color = "#1a1a24" }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    const hw = width / 2;
    const hd = depth / 2;
    
    // 8 vertices
    // Top face
    const v1 = [centerX - hw, topY, centerY - hd];
    const v2 = [centerX + hw, topY, centerY - hd];
    const v3 = [centerX + hw, topY, centerY + hd];
    const v4 = [centerX - hw, topY, centerY + hd];
    
    // Bottom face (grounded)
    const v5 = [centerX - hw, calculateGroundedY(centerX - hw, centerY - hd, groundY, lift, tentingAngle, splitRotation, typingAngle), centerY - hd];
    const v6 = [centerX + hw, calculateGroundedY(centerX + hw, centerY - hd, groundY, lift, tentingAngle, splitRotation, typingAngle), centerY - hd];
    const v7 = [centerX + hw, calculateGroundedY(centerX + hw, centerY + hd, groundY, lift, tentingAngle, splitRotation, typingAngle), centerY + hd];
    const v8 = [centerX - hw, calculateGroundedY(centerX - hw, centerY + hd, groundY, lift, tentingAngle, splitRotation, typingAngle), centerY + hd];
    
    const vertices = new Float32Array([
      ...v1, ...v2, ...v3, ...v4, // top
      ...v5, ...v6, ...v7, ...v8  // bottom
    ]);
    
    // Indices (12 triangles, 36 indices)
    const indices = [
      // Top
      0, 1, 2, 0, 2, 3,
      // Bottom
      4, 6, 5, 4, 7, 6,
      // Front (Z+)
      3, 2, 6, 3, 6, 7,
      // Back (Z-)
      0, 5, 1, 0, 4, 5,
      // Left (X-)
      0, 3, 7, 0, 7, 4,
      // Right (X+)
      1, 6, 2, 1, 5, 6
    ];
    
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [width, depth, centerX, centerY, topY, groundY, lift, tentingAngle, splitRotation, typingAngle]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.4} 
        roughness={0.6} 
      />
    </mesh>
  );
};

/**
 * A component that renders a grounded box with holes.
 */
const GroundedHoleyBox: React.FC<{
  width: number;
  depth: number;
  centerX: number;
  centerY: number;
  topY: number;
  groundY: number;
  lift: number;
  tentingAngle: number;
  splitRotation: number;
  typingAngle: number;
  mountingHoles: any[];
  color?: string;
}> = ({ width, depth, centerX, centerY, topY, groundY, lift, tentingAngle, splitRotation, typingAngle, mountingHoles, color = "#1a1a24" }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;

    shape.moveTo(-hw, -hd);
    shape.lineTo(hw, -hd);
    shape.lineTo(hw, hd);
    shape.lineTo(-hw, hd);
    shape.closePath();

    mountingHoles.forEach(hole => {
      const relX = hole.x - centerX;
      const relY = hole.y - centerY;
      // Only add hole if it's within the box area
      if (Math.abs(relX) < hw && Math.abs(relY) < hd) {
        const path = new THREE.Path();
        path.absarc(relX, relY, hole.diameter / 2, 0, Math.PI * 2, true);
        shape.holes.push(path);
      }
    });

    const thickness = 2; // Nominal thickness for extrusion before vertex adjustment
    const extrudeSettings = { depth: thickness, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // ExtrudeGeometry extrudes along Z. We want it on the X-Z plane.
    geo.rotateX(Math.PI / 2);
    
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) + centerX;
      const vz = pos.getZ(i) + centerY;
      const vy = pos.getY(i);
      
      if (vy > -0.01) { // "Top" face of the extrusion (which is at Y=0 after rotateX)
        pos.setY(i, topY);
      } else { // "Bottom" face
        const groundedY = calculateGroundedY(vx, vz, groundY, lift, tentingAngle, splitRotation, typingAngle);
        pos.setY(i, groundedY);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [width, depth, centerX, centerY, topY, groundY, lift, tentingAngle, splitRotation, typingAngle, mountingHoles]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.4} 
        roughness={0.6} 
      />
    </mesh>
  );
};

/**
 * Renders a 3D case for the keyboard.
 */
const Case: React.FC<CaseProps> = ({ side, groundY, lift, tentingAngle, splitRotation, typingAngle }) => {
  const { data, showCaseBase, showCaseWalls } = useKeyboardStore();
  const { wallThickness, keyPitch } = data.case_config;

  if (!showCaseBase && !showCaseWalls) return null;

  const renderCase = (keys: KeyConfig[], id: string) => {
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

    // Trackballs - Temporarily excluded
    /*
    const sideTrackballs = (data.trackballs || []).filter(t => {
      if (!side) return true;
      return t.side === side || (!t.side && side === 'left');
    });
    sideTrackballs.forEach(t => {
      allCorners.push(...getComponentCorners(t.x, t.y, t.diameter, t.diameter, 0));
    });
    */

    // Controllers
    const sideControllers = (data.controllers || []).filter(c => {
      if (!side) return true;
      return c.side === side;
    });
    sideControllers.forEach(c => {
      const dimensions = getControllerDimensions(c.type);
      allCorners.push(...getComponentCorners(c.x, c.y, dimensions.width, dimensions.length, c.rotation));
    });

    // Batteries
    const sideBatteries = (data.batteries || []).filter(b => {
      if (!side) return true;
      return b.side === side || (!b.side && side === 'left');
    });
    sideBatteries.forEach(b => {
      allCorners.push(...getComponentCorners(b.x, b.y, b.width, b.height, b.rotation));
    });

    const sideMountingHoles = (data.mountingHoles || []).filter(h => {
      if (!side) return true;
      return h.side === side;
    });

    const bbox = calculatePointsBoundingBox(allCorners, wallThickness);
    if (!bbox) return null;

    const baseTopY = -5;
    const wallHeight = 12;
    const wallTopY = baseTopY + wallHeight - 4;

    // To prevent Z-fighting (flickering), we ensure that the base and walls do not overlap.
    // If walls are shown, the base is shrunk to the inner area.
    // Walls are also adjusted so they don't overlap at the corners.
    const innerWidth = bbox.width - wallThickness * 2;
    const innerHeight = bbox.height - wallThickness * 2;

    return (
      <group key={id}>
        {showCaseBase && (
          <GroundedHoleyBox 
            width={showCaseWalls ? innerWidth : bbox.width}
            depth={showCaseWalls ? innerHeight : bbox.height}
            centerX={bbox.centerX}
            centerY={bbox.centerY}
            topY={baseTopY}
            groundY={groundY}
            lift={lift}
            tentingAngle={tentingAngle}
            splitRotation={splitRotation}
            typingAngle={typingAngle}
            mountingHoles={sideMountingHoles}
          />
        )}

        {showCaseWalls && (
          <>
            {/* Top Wall (Full width) */}
            <GroundedBox 
              width={bbox.width}
              depth={wallThickness}
              centerX={bbox.centerX}
              centerY={bbox.maxY - wallThickness / 2}
              topY={wallTopY}
              groundY={groundY}
              lift={lift}
              tentingAngle={tentingAngle}
              splitRotation={splitRotation}
              typingAngle={typingAngle}
            />
            {/* Bottom Wall (Full width) */}
            <GroundedBox 
              width={bbox.width}
              depth={wallThickness}
              centerX={bbox.centerX}
              centerY={bbox.minY + wallThickness / 2}
              topY={wallTopY}
              groundY={groundY}
              lift={lift}
              tentingAngle={tentingAngle}
              splitRotation={splitRotation}
              typingAngle={typingAngle}
            />
            {/* Left Wall (Inner height to avoid corner overlap) */}
            <GroundedBox 
              width={wallThickness}
              depth={innerHeight}
              centerX={bbox.minX + wallThickness / 2}
              centerY={bbox.centerY}
              topY={wallTopY}
              groundY={groundY}
              lift={lift}
              tentingAngle={tentingAngle}
              splitRotation={splitRotation}
              typingAngle={typingAngle}
            />
            {/* Right Wall (Inner height to avoid corner overlap) */}
            <GroundedBox 
              width={wallThickness}
              depth={innerHeight}
              centerX={bbox.maxX - wallThickness / 2}
              centerY={bbox.centerY}
              topY={wallTopY}
              groundY={groundY}
              lift={lift}
              tentingAngle={tentingAngle}
              splitRotation={splitRotation}
              typingAngle={typingAngle}
            />
          </>
        )}
      </group>
    );
  };

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
