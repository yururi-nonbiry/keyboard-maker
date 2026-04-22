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
  connectorEnabled?: boolean;
  connectorX?: number;
  connectorY?: number;
  connectorMountingSide?: 'top' | 'bottom';
}

const Battery: React.FC<BatteryProps> = ({ 
  id, 
  width, 
  height, 
  thickness, 
  position, 
  rotation,
  mountingSide,
  connectorEnabled,
  connectorX,
  connectorY,
  connectorMountingSide
}) => {
  const { selectedBatteryId, selectBattery } = useKeyboardStore();
  const isSelected = selectedBatteryId === id;

  // The position passed in is the battery's position.
  // The connector position is independent.
  // However, they are grouped if we want them to move together, 
  // but usually they are separate components on the PCB.
  // For now, I'll render the connector in its own group if enabled.

  return (
    <>
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

        {/* Side Indicator */}
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

      {/* Battery Connector */}
      {connectorEnabled && (
        <group
          position={[
            connectorX ?? position[0], 
            (connectorMountingSide ?? mountingSide) === 'bottom' ? -4 : -2, 
            connectorY ?? position[2]
          ]}
          rotation={[
            (connectorMountingSide ?? mountingSide) === 'bottom' ? Math.PI : 0, 
            0, 
            0
          ]}
          onClick={(e) => {
            e.stopPropagation();
            selectBattery(id);
          }}
        >
          {/* Connector Base (JST style) */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 4, 5]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          {/* Pins/Internal */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[4, 2, 3]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          
          {/* Selection Highlight for Connector */}
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[7, 5, 6]} />
              <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      )}
    </>
  );
};

export default Battery;
