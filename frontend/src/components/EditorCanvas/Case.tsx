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
  height: number;
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

    // Trackballs
    const sideTrackballs = (data.trackballs || []).filter(t => {
      if (!side) return true;
      return t.side === side || (!t.side && side === 'left');
    });
    sideTrackballs.forEach(t => {
      allCorners.push(...getComponentCorners(t.x, t.y, t.diameter, t.diameter, 0));
    });

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

    const bbox = calculatePointsBoundingBox(allCorners, wallThickness);
    if (!bbox) return null;

    const baseTopY = -5;
    const wallHeight = 12;
    const wallTopY = baseTopY + wallHeight - 4;

    return (
      <group key={id}>
        {showCaseBase && (
          <GroundedBox 
            width={bbox.width}
            depth={bbox.height}
            centerX={bbox.centerX}
            centerY={bbox.centerY}
            topY={baseTopY}
            groundY={groundY}
            lift={lift}
            tentingAngle={tentingAngle}
            splitRotation={splitRotation}
            typingAngle={typingAngle}
          />
        )}

        {showCaseWalls && (
          <>
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
            <GroundedBox 
              width={wallThickness}
              depth={bbox.height}
              centerX={bbox.minX + wallThickness / 2}
              centerY={bbox.centerY}
              topY={wallTopY}
              groundY={groundY}
              lift={lift}
              tentingAngle={tentingAngle}
              splitRotation={splitRotation}
              typingAngle={typingAngle}
            />
            <GroundedBox 
              width={wallThickness}
              depth={bbox.height}
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
