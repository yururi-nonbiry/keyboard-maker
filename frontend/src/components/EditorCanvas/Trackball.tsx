import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TrackballConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface TrackballProps {
  config: TrackballConfig;
}

const Trackball: React.FC<TrackballProps> = ({ config }) => {
  const { selectedTrackballId, selectTrackball, updateTrackball, gridSnapping, gridSize } = useKeyboardStore();
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedTrackballId === config.id;

  const handleDragEnd = () => {
    if (groupRef.current && meshGroupRef.current) {
      const worldPos = new THREE.Vector3();
      meshGroupRef.current.getWorldPosition(worldPos);
      
      const container = groupRef.current.parent;
      if (!container) return;

      const containerWorldMatrixInverse = container.matrixWorld.clone().invert();
      const localPos = worldPos.applyMatrix4(containerWorldMatrixInverse);
      
      const snapIncrement = gridSnapping ? gridSize / 4 : 0.25;
      const snapVal = (val: number) => Math.round(val / snapIncrement) * snapIncrement;

      updateTrackball(config.id, {
        x: snapVal(localPos.x),
        y: snapVal(localPos.z),
      });
    }
  };

  return (
    <group 
      ref={groupRef}
      position={[config.x, 0, config.y]} 
      onClick={(e) => {
        e.stopPropagation();
        selectTrackball(config.id);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <PivotControls
        key={isSelected ? 'active' : 'inactive'}
        visible={isSelected}
        activeAxes={[true, false, true]}
        depthTest={false}
        anchor={[0, 0, 0]}
        scale={isSelected ? 30 : 0}
        lineWidth={2}
        onDragEnd={handleDragEnd}
        disableScaling
        disableRotations
      >
        <group ref={meshGroupRef}>
          {/* Trackball Sensor Housing */}
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[30, 10, 30]} />
            <meshStandardMaterial color={isSelected ? "#4f46e5" : "#222"} metalness={0.5} roughness={0.5} />
          </mesh>

          {/* Ball */}
          <mesh position={[0, 15 + config.diameter / 2 - 5, 0]}>
            <sphereGeometry args={[config.diameter / 2, 32, 32]} />
            <meshStandardMaterial 
              color="#ef4444" 
              metalness={0.8} 
              roughness={0.2} 
            />
          </mesh>

          {/* Selection Glow */}
          {isSelected && (
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[20, 20, 0.5, 32]} />
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

export default Trackball;
