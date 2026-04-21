import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { KeyConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface KeySwitchProps {
  config: KeyConfig;
}

const KeySwitch: React.FC<KeySwitchProps> = ({ config }) => {
  const { selectedKeyId, selectKey, collisions, updateKey } = useKeyboardStore();
  const groupRef = useRef<THREE.Group>(null);
  const isSelected = selectedKeyId === config.id;
  const hasCollision = collisions[config.id];

  const handleDragEnd = () => {
    if (groupRef.current) {
      // Get world position and rotation to update the store
      const position = new THREE.Vector3();
      groupRef.current.getWorldPosition(position);
      
      const quaternion = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(quaternion);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      
      // We snap to 0.25mm for position and 1 degree for rotation by default
      const snapVal = (val: number) => Math.round(val * 4) / 4;
      const rotationDeg = -euler.y * (180 / Math.PI);

      updateKey(config.id, {
        x: snapVal(position.x),
        y: snapVal(position.z),
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
        visible={isSelected}
        activeAxes={[true, false, true]} // X and Z for horizontal movement
        depthTest={false}
        anchor={[0, 0, 0]}
        scale={isSelected ? 30 : 0}
        lineWidth={2}
        onDragEnd={handleDragEnd}
        disableScaling
      >
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
      </PivotControls>
    </group>
  );
};

export default KeySwitch;
