import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { DiodeConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface DiodeProps {
  config: DiodeConfig;
}

const Diode: React.FC<DiodeProps> = ({ config }) => {
  const { selectedDiodeId, selectDiode, updateDiode, gridSnapping, gridSize } = useKeyboardStore();
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedDiodeId === config.id;

  const handleDragEnd = () => {
    if (groupRef.current && meshGroupRef.current) {
      const worldPos = new THREE.Vector3();
      meshGroupRef.current.getWorldPosition(worldPos);
      
      const worldQuat = new THREE.Quaternion();
      meshGroupRef.current.getWorldQuaternion(worldQuat);
      
      const container = groupRef.current.parent;
      if (!container) return;

      const containerWorldMatrixInverse = container.matrixWorld.clone().invert();
      const localPos = worldPos.applyMatrix4(containerWorldMatrixInverse);
      
      const containerWorldQuat = new THREE.Quaternion();
      container.getWorldQuaternion(containerWorldQuat);
      const localQuat = worldQuat.clone().premultiply(containerWorldQuat.invert());
      
      const euler = new THREE.Euler().setFromQuaternion(localQuat);
      
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snapVal = (val: number) => Math.round(val / snapIncrement) * snapIncrement;
      
      const rotationDeg = -euler.y * (180 / Math.PI);

      updateDiode(config.id, {
        x: snapVal(localPos.x),
        y: snapVal(localPos.z),
        rotation: Math.round(rotationDeg),
      });
    }
  };

  // Diode dimensions (SOD-123)
  const bodyWidth = 2.7;
  const bodyHeight = 1.0;
  const bodyDepth = 1.6;
  
  // PCB Position
  const pcbY = -4.0;
  const pcbThickness = 1.6;
  const diodeY = config.mountingSide === 'top' ? pcbY + pcbThickness/2 + bodyHeight/2 : pcbY - pcbThickness/2 - bodyHeight/2;

  return (
    <group 
      ref={groupRef}
      position={[config.x, diodeY, config.y]} 
      rotation={[0, -config.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectDiode(config.id);
      }}
    >
      <PivotControls
        key={isSelected ? 'active' : 'inactive'}
        visible={isSelected}
        activeAxes={[true, false, true]}
        depthTest={false}
        anchor={[0, 0, 0]}
        scale={isSelected ? 10 : 0}
        lineWidth={2}
        onDragEnd={handleDragEnd}
        disableScaling
      >
        <group ref={meshGroupRef}>
          {/* Main Body */}
          <mesh>
            <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
            <meshStandardMaterial color="#111" metalness={0.2} roughness={0.8} />
          </mesh>
          
          {/* Polarity Mark (White line) */}
          <mesh position={[-(bodyWidth/2 - 0.4), bodyHeight/2 + 0.01, 0]}>
            <boxGeometry args={[0.3, 0.02, bodyDepth]} />
            <meshStandardMaterial color="#eee" />
          </mesh>
          
          {/* Leads */}
          <mesh position={[-(bodyWidth/2 + 0.5), 0, 0]}>
            <boxGeometry args={[1.0, 0.2, 1.2]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[bodyWidth/2 + 0.5, 0, 0]}>
            <boxGeometry args={[1.0, 0.2, 1.2]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Pads */}
          <mesh position={[0, -bodyHeight/2 - 0.05, 0]}>
            <boxGeometry args={[bodyWidth + 2, 0.1, bodyDepth + 0.4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Selection Glow */}
          {isSelected && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[bodyWidth + 1, bodyHeight + 1, bodyDepth + 1]} />
              <meshStandardMaterial 
                color="#6366f1" 
                emissive="#6366f1" 
                emissiveIntensity={2} 
                transparent 
                opacity={0.3} 
              />
            </mesh>
          )}
        </group>
      </PivotControls>
    </group>
  );
};

export default Diode;
