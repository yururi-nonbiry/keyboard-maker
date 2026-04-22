import React, { useRef } from 'react';
import { PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import type { KeyConfig } from '../../types';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface KeySwitchProps {
  config: KeyConfig;
}

const RealisticKeycap: React.FC<{
  width: number;
  height: number;
  profile: string;
  isSelected: boolean;
  hasCollision: boolean;
}> = ({ width, height, profile, isSelected, hasCollision }) => {
  const color = hasCollision ? "#ef4444" : (isSelected ? "#6366f1" : "#1c1c21");
  
  let capHeight = 8;
  let topScale = 0.75;
  
  if (profile === 'choc' || profile === 'mbk') {
    capHeight = 3.5;
    topScale = 0.9;
  } else if (profile === 'dsa' || profile === 'xda') {
    capHeight = 7.5;
    topScale = 0.7;
  }

  return (
    <group position={[0, capHeight / 2, 0]}>
      {/* Main tapered body */}
      <mesh>
        <boxGeometry args={[width, capHeight, height]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.1} 
          roughness={0.3}
          onBeforeCompile={(shader) => {
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              vec3 transformed = vec3( position );
              if (position.y > 0.0) {
                transformed.x *= ${topScale.toFixed(2)};
                transformed.z *= ${topScale.toFixed(2)};
              }
              `
            );
          }}
        />
      </mesh>
      
    </group>
  );
};

const KeySwitch: React.FC<KeySwitchProps> = ({ config }) => {
  const { data, selectedKeyId, selectKey, collisions, updateKey, gridSnapping, gridSize, showKeycaps, showSwitches, showSockets } = useKeyboardStore();
  const { keyPitch, defaultKeycapProfile } = data.case_config;
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);
  const isSelected = selectedKeyId === config.id;
  const hasCollision = collisions[config.id];
  const profile = config.keycapProfile || defaultKeycapProfile;
  const isLowProfile = config.switchType.startsWith('choc') || profile === 'choc' || profile === 'mbk';

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

      updateKey(config.id, {
        x: snapVal(localPos.x),
        y: snapVal(localPos.z),
        rotation: Math.round(rotationDeg),
      });
    }
  };

  const keycapW = (keyPitch - 1.05) * config.keycapSize.width;
  const keycapH = (keyPitch - 1.05) * config.keycapSize.height;

  // Vertical positions (matching Plate.tsx and PCB.tsx)
  const plateY = -1;
  const plateThickness = data.case_config.plateThickness || 1.5;
  const plateTop = plateY + (plateThickness / 2);
  const pcbY = -4.0;
  const pcbThickness = 1.6;
  const pcbTop = pcbY + (pcbThickness / 2);
  const pcbBottom = pcbY - (pcbThickness / 2);
  const socketY = pcbBottom - 1.5;

  return (
    <group 
      ref={groupRef}
      position={[config.x, 0, config.y]} 
      rotation={[0, -config.rotation * (Math.PI / 180), 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectKey(config.id);
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
      >
        <group ref={meshGroupRef}>
          {showSwitches && (
            <group position={[0, plateTop, 0]}>
              {isLowProfile ? (
                // Choc Switch
                <>
                  {/* Housing Above Plate */}
                  <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[14, 3, 14]} />
                    <meshStandardMaterial color={isSelected ? "#4f46e5" : "#111"} metalness={0.4} roughness={0.6} />
                  </mesh>
                  {/* Housing Through Plate and down to PCB */}
                  <mesh position={[0, (pcbTop - plateTop) / 2, 0]}>
                    <boxGeometry args={[14, plateTop - pcbTop, 14]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  {/* Stem (Choc style) */}
                  <mesh position={[0, 3.5, 0]}>
                    <boxGeometry args={[10, 2, 3]} />
                    <meshStandardMaterial color="#fff" />
                  </mesh>
                </>
              ) : (
                // MX Switch
                <>
                  {/* Switch Bottom Housing (Above Plate part) */}
                  <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[15, 3, 15]} />
                    <meshStandardMaterial color={isSelected ? "#4f46e5" : "#222"} metalness={0.6} roughness={0.4} />
                  </mesh>
                  {/* Part through plate and down to PCB */}
                  <mesh position={[0, (pcbTop - plateTop) / 2, 0]}>
                    <boxGeometry args={[14, plateTop - pcbTop, 14]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  {/* Switch Top Housing */}
                  <mesh position={[0, 4.5, 0]}>
                    <boxGeometry args={[14, 3, 14]} />
                    <meshStandardMaterial color="#fff" transparent opacity={0.4} metalness={0.1} roughness={0.1} />
                  </mesh>
                  {/* Stem */}
                  <mesh position={[0, 6, 0]}>
                    <boxGeometry args={[4, 5, 4]} />
                    <meshStandardMaterial color="#ef4444" />
                  </mesh>
                </>
              )}

              {/* Metal Pins */}
              <mesh position={[-3.81, (pcbBottom - plateTop) / 2 - 0.5, -2.54]}>
                <cylinderGeometry args={[0.4, 0.4, plateTop - pcbBottom + 1]} />
                <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[2.54, (pcbBottom - plateTop) / 2 - 0.5, -5.08]}>
                <cylinderGeometry args={[0.4, 0.4, plateTop - pcbBottom + 1]} />
                <meshStandardMaterial color="#a1a1aa" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* PCB Mounting Pins */}
              <mesh position={[-5.08, (pcbBottom - plateTop) / 2 - 0.2, 0]}>
                <cylinderGeometry args={[0.8, 0.8, plateTop - pcbBottom + 0.4]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh position={[5.08, (pcbBottom - plateTop) / 2 - 0.2, 0]}>
                <cylinderGeometry args={[0.8, 0.8, plateTop - pcbBottom + 0.4]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh position={[0, (pcbBottom - plateTop) / 2 - 0.2, 0]}>
                <cylinderGeometry args={[1.9, 1.9, plateTop - pcbBottom + 0.4]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </group>
          )}

          {/* Hot-swap Socket */}
          {showSockets && (
            <group position={[0, socketY, 0]} rotation={[0, Math.PI, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[15, 3, 10]} />
                <meshStandardMaterial color="#111" metalness={0.2} roughness={0.8} />
              </mesh>
              <mesh position={[3.81, 0, 2.54]}>
                <boxGeometry args={[3, 1, 3]} />
                <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[-2.54, 0, 5.08]}>
                <boxGeometry args={[3, 1, 3]} />
                <meshStandardMaterial color="#d4d4d8" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          )}

          {/* Keycap */}
          {showKeycaps && (
            <group position={[0, isLowProfile ? 4 : 9, 0]}>
              <RealisticKeycap 
                width={keycapW} 
                height={keycapH} 
                profile={profile} 
                isSelected={isSelected}
                hasCollision={hasCollision}
              />
            </group>
          )}

          {/* Selection Glow */}
          {isSelected && (
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[keyPitch, 0.05, keyPitch]} />
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
