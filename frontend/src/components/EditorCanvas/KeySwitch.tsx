import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { KeyConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface KeySwitchProps {
  config: KeyConfig;
}

const KeySwitch: React.FC<KeySwitchProps> = ({ config }) => {
  const { selectedKeyId, selectKey, collisions, updateKey, gridSnapping, gridSize } = useKeyboardStore();
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedKeyId === config.id;
  const hasCollision = collisions[config.id];

  const handleDragEnd = () => {
    if (groupRef.current && meshGroupRef.current) {
      // 1. Get world position and rotation of the meshes (after drag)
      const worldPos = new THREE.Vector3();
      meshGroupRef.current.getWorldPosition(worldPos);
      
      const worldQuat = new THREE.Quaternion();
      meshGroupRef.current.getWorldQuaternion(worldQuat);
      
      // 2. Get the keyboard container (parent of groupRef)
      const container = groupRef.current.parent;
      if (!container) return;

      // 3. Convert world coordinates to local coordinates relative to the container
      // This bypasses any animation/rotation from parent components like <Float />
      const containerWorldMatrixInverse = container.matrixWorld.clone().invert();
      const localPos = worldPos.applyMatrix4(containerWorldMatrixInverse);
      
      const containerWorldQuat = new THREE.Quaternion();
      container.getWorldQuaternion(containerWorldQuat);
      const localQuat = worldQuat.clone().premultiply(containerWorldQuat.invert());
      
      const euler = new THREE.Euler().setFromQuaternion(localQuat);
      
      // 4. Determine snap increment
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snapVal = (val: number) => Math.round(val / snapIncrement) * snapIncrement;
      
      const rotationDeg = -euler.y * (180 / Math.PI);

      updateKey(config.id, {
        x: snapVal(localPos.x),
        y: snapVal(localPos.z),
        rotation: Math.round(rotationDeg),
      });
    }
  };

  return (
    <group 
      ref={groupRef}
      position={[config.x, 0, config.y]} 
      rotation={[0, -config.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectKey(config.id);
      }}
    >
      <PivotControls
        key={isSelected ? 'active' : 'inactive'} // Force reset matrix when selection changes
        visible={isSelected}
        activeAxes={[true, false, true]} // X and Z for horizontal movement
        depthTest={false}
        anchor={[0, 0, 0]}
        scale={isSelected ? 30 : 0}
        lineWidth={2}
        onDragEnd={handleDragEnd}
        disableScaling
      >
        <group ref={meshGroupRef}>
          {/* Switch Base */}
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[14, 4, 14]} />
            <meshStandardMaterial color={isSelected ? "#4f46e5" : "#333"} metalness={0.5} roughness={0.5} />
          </mesh>

          {/* Stem */}
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[4, 6, 4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>

          {/* Keycap */}
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[18 * config.keycapSize.width - 1, 8, 18 * config.keycapSize.height - 1]} />
            <meshStandardMaterial 
              color={hasCollision ? "#ef4444" : (isSelected ? "#6366f1" : "#1c1c21")} 
              metalness={0.1} 
              roughness={0.3} 
              transparent 
              opacity={0.9} 
            />
          </mesh>

          {/* Selection Glow */}
          {isSelected && (
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[19, 0.5, 19]} />
              <meshStandardMaterial 
                color="#6366f1" 
                emissive="#6366f1" 
                emissiveIntensity={2} 
                transparent 
                opacity={0.5} 
              />
            </mesh>
          )}
        </group>
      </PivotControls>
    </group>
  );
};

export default KeySwitch;
