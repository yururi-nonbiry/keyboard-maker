import React from 'react';
import type { KeyConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface KeySwitchProps {
  config: KeyConfig;
}

const KeySwitch: React.FC<KeySwitchProps> = ({ config }) => {
  const { selectedKeyId, selectKey, collisions } = useKeyboardStore();
  const isSelected = selectedKeyId === config.id;
  const hasCollision = collisions[config.id];

  // Standard spacing: 19.05mm
  // We'll treat 1 unit in Three.js as 1mm for simplicity.
  // Standard switch cutout is roughly 14mm square.
  // Keycap is roughly 18mm square.
  
  return (
    <group 
      position={[config.x, 0, config.y]} 
      rotation={[0, -config.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectKey(config.id);
      }}
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
    </group>
  );
};

export default KeySwitch;
