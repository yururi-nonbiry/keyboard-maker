import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TrackballConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface TrackballProps {
  config: TrackballConfig;
}

const TrackballPCB: React.FC<{ config: TrackballConfig }> = ({ config }) => {
  const { showPCB } = useKeyboardStore();
  if (!showPCB) return null;

  // Typical sensor PCB size for PMW3360 breakout
  const pcbWidth = 28;
  const pcbHeight = 1.6;
  const pcbLength = 28;
  const isTop = config.mountingSide === 'top';
  const yOffset = isTop ? (config.diameter / 2 + 3) : -(config.diameter / 2 + 3);

  return (
    <group 
      rotation={[0, 0, THREE.MathUtils.degToRad(config.sensorAngle || 0)]}
    >
      <group 
        position={[0, yOffset, 0]} 
        rotation={[isTop ? Math.PI : 0, THREE.MathUtils.degToRad(config.sensorRotation || 0), 0]}
      >
        {/* PCB Board */}
        <mesh position={[0, -pcbHeight / 2, 0]}>
          <boxGeometry args={[pcbWidth, pcbHeight, pcbLength]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
        </mesh>
        
        {/* Sensor Chip (e.g. PMW3360) */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[12, 4, 12]} />
          <meshStandardMaterial color="#222" metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Lens / Aperture */}
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[2, 2, 1, 16]} />
          <meshStandardMaterial color="#444" transparent opacity={0.6} />
        </mesh>

        {/* Mounting Holes visual */}
        {[[-10, -10], [10, -10], [-10, 10], [10, 10]].map(([x, z], i) => (
          <mesh key={i} position={[x, -pcbHeight, z]}>
            <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const TrackballHolder: React.FC<{ config: TrackballConfig }> = ({ config }) => {
  const { showCaseBase, showCaseWalls } = useKeyboardStore();
  if (!showCaseBase && !showCaseWalls) return null;

  const holderRadius = config.diameter / 2 + 4;
  const holderHeight = config.diameter / 2 + 2;

  return (
    <group>
      {/* Main Socket / Cup */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[holderRadius, holderRadius - 2, holderHeight, 32, 1, true]} />
        <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Bottom Plate of the holder */}
      <mesh position={[0, -holderHeight / 2, 0]}>
        <cylinderGeometry args={[holderRadius - 2, holderRadius - 2, 2, 32]} />
        <meshStandardMaterial color="#1a1a24" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Bearings (Typically 3 zirconium or ceramic bearings) */}
      {[0, 120, 240].map((angle, i) => {
        const rad = THREE.MathUtils.degToRad(angle);
        const dist = config.diameter / 2 - 1;
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(rad) * dist, 
              0, 
              Math.sin(rad) * dist
            ]}
          >
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color="#fff" metalness={0.9} roughness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};

const Trackball: React.FC<TrackballProps> = ({ config }) => {
  const { selectedTrackballId, selectTrackball, updateTrackball, gridSnapping, gridSize } = useKeyboardStore();
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedTrackballId === config.id;

  const isTop = config.mountingSide === 'top';
  // Ball is at y = 15 + diameter/2 - 5 in original, let's simplify to centered at y=0 
  // and offset the group in KeyboardCanvas if needed. 
  // Actually, let's keep the baseline at y=0 for the holder base.
  const ballY = isTop ? -(config.diameter / 2 - 2) : (config.diameter / 2 - 2);

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

      updateTrackball(config.id, {
        x: snapVal(localPos.x),
        y: snapVal(localPos.z),
        rotation: Math.round(rotationDeg),
      });
    }
  };

  return (
    <group 
      ref={groupRef}
      position={[config.x, config.z ?? -5, config.y]} 
      rotation={[0, -(config.rotation || 0) * (Math.PI / 180), 0]}
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
        disableRotations={false}
      >
        <group ref={meshGroupRef}>
          {/* Internal components are relative to the center of the ball/socket */}
          <group position={[0, ballY, 0]}>
            {/* Ball */}
            <mesh>
              <sphereGeometry args={[config.diameter / 2, 32, 32]} />
              <meshStandardMaterial 
                color="#ef4444" 
                metalness={0.8} 
                roughness={0.2} 
              />
            </mesh>

            {/* Holder Case */}
            <TrackballHolder config={config} />

            {/* Sensor PCB */}
            <TrackballPCB config={config} />
          </group>

          {/* Selection Glow */}
          {isSelected && (
            <mesh position={[0, -8, 0]}>
              <cylinderGeometry args={[config.diameter / 2 + 10, config.diameter / 2 + 10, 0.5, 32]} />
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

export default Trackball;
