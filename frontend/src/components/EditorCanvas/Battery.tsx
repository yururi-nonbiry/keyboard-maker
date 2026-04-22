import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface BatteryProps {
  id: string;
  width: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotation: [number, number, number];
  side?: 'left' | 'right';
  mountingSide: 'top' | 'bottom';
}

const Battery: React.FC<BatteryProps> = ({ 
  id, 
  width, 
  height, 
  thickness, 
  position, 
  rotation,
  mountingSide
}) => {
  const { selectedBatteryId, selectBattery } = useKeyboardStore();
  const isSelected = selectedBatteryId === id;

  return (
    <group 
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        selectBattery(id);
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, thickness, height]} />
        <meshStandardMaterial 
          color={isSelected ? "#60a5fa" : "#334155"} 
          roughness={0.5} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Label/Decoration */}
      <mesh position={[0, thickness / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.8, height * 0.8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Side Indicator Indicator (simplified) */}
      <mesh position={[width / 2 - 2, thickness / 2 + 0.15, height / 2 - 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshStandardMaterial color={mountingSide === 'top' ? "#10b981" : "#f59e0b"} />
      </mesh>

      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width + 1, thickness + 1, height + 1]} />
          <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

export default Battery;
