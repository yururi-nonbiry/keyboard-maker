import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Grid } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';
import Case from './Case';
import PCB from './PCB';
import MicroController from './MicroController';
import Trackball from './Trackball';
import Battery from './Battery';
import Diode from './Diode';
import { Lighting } from './Lighting';

import { calculateFullBoundingBox3D, calculateLift } from '../../utils/geometry';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId, selectTrackball, selectedTrackballId, selectController, selectedControllerId, selectBattery, selectedBatteryId, selectDiode, selectedDiodeId, gridVisible, gridSize, showTrackballs, showControllers, showDiodes } = useKeyboardStore();

  const groundY = -12;
  const { typingAngle, tentingAngle, splitRotation, splitGap } = data.case_config;
  const keyPitch = data.case_config.keyPitch;
  
  const isEditing = selectedKeyId !== null || selectedTrackballId !== null || selectedControllerId !== null || selectedBatteryId !== null || selectedDiodeId !== null;

  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  const leftTrackballs = (data.trackballs || []).filter(t => t.side === 'left' || !t.side);
  const rightTrackballs = (data.trackballs || []).filter(t => t.side === 'right');

  const leftBatteries = (data.batteries || []).filter(b => b.side === 'left' || !b.side);
  const rightBatteries = (data.batteries || []).filter(b => b.side === 'right');

  const leftDiodes = (data.diodes || []).filter(d => d.side === 'left' || !d.side);
  const rightDiodes = (data.diodes || []).filter(d => d.side === 'right');

  const leftMountingHoles = (data.mountingHoles || []).filter(m => m.side === 'left' || !m.side);
  const rightMountingHoles = (data.mountingHoles || []).filter(m => m.side === 'right');

  const integratedBbox = calculateFullBoundingBox3D(data.layout, data.trackballs || [], data.controllers || [], data.batteries || [], data.mountingHoles || [], keyPitch);
  const integratedLift = calculateLift(integratedBbox, groundY, 0, 0, typingAngle);
  
  const centerOffset = integratedBbox ? [-integratedBbox.centerX, 0, -integratedBbox.centerY] : [0, 0, 0];

  const leftFullBbox = calculateFullBoundingBox3D(leftKeys, leftTrackballs, (data.controllers || []).filter(c => c.side === 'left' || !c.side), leftBatteries, leftMountingHoles, keyPitch);
  const rightFullBbox = calculateFullBoundingBox3D(rightKeys, rightTrackballs, (data.controllers || []).filter(c => c.side === 'right'), rightBatteries, rightMountingHoles, keyPitch);
  
  const leftLift = calculateLift(leftFullBbox, groundY, tentingAngle, splitRotation, typingAngle);
  const rightLift = calculateLift(rightFullBbox, groundY, -tentingAngle, -splitRotation, typingAngle);
  

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [150, 200, 250], fov: 45, up: [0, 1, 0], near: 0.1, far: 2000 }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={[data.lighting_config?.backgroundColor || '#0a0a0c']} />
      <fog attach="fog" args={[data.lighting_config?.backgroundColor || '#0a0a0c', 200, 1000]} />
      
      <Suspense fallback={null}>
        <ambientLight color={data.lighting_config?.ambientLightColor || '#ffffff'} intensity={0.5} />
        <spotLight 
          position={[100, 200, 100]} 
          angle={0.15} 
          penumbra={1} 
          intensity={1} 
          castShadow 
          color={data.lighting_config?.sceneLightColor || '#ffffff'}
        />
        <pointLight position={[-100, -100, -100]} intensity={0.5} color={data.lighting_config?.sceneLightColor || '#ffffff'} />
        
        <Environment preset="city" />
 
        <Float 
          speed={isEditing ? 0 : 1.5} 
          rotationIntensity={isEditing ? 0 : 0.2} 
          floatIntensity={isEditing ? 0 : 0.5}
        >
          <group 
            rotation={[typingAngle * (Math.PI / 180), 0, 0]}
            position={[0, 0, 0]}
          >
            {data.type === 'integrated' ? (
              <group position={[centerOffset[0], integratedLift, centerOffset[2]]}>
                {data.layout.map((key) => (
                  <KeySwitch key={key.id} config={key} />
                ))}
                <Plate />
                <PCB />
                <Case 
                  groundY={groundY}
                  lift={integratedLift}
                  tentingAngle={0}
                  splitRotation={0}
                  typingAngle={typingAngle}
                  centerX={integratedBbox?.centerX || 0}
                  centerY={integratedBbox?.centerY || 0}
                />
                {showTrackballs && (data.trackballs || []).map((t) => (
                  <Trackball key={t.id} config={t} />
                ))}
                {showControllers && (data.controllers || []).map((c) => (
                  <MicroController 
                    key={c.id}
                    type={c.type}
                    position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                    rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                    mountingSide={c.mountingSide}
                  />
                ))}
                {(data.batteries || []).map((b) => (
                  <Battery 
                    key={b.id}
                    id={b.id}
                    width={b.width}
                    height={b.height}
                    thickness={b.thickness}
                    position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                    rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                    mountingSide={b.mountingSide}
                    connectorEnabled={b.connectorEnabled}
                    connectorX={b.connectorX}
                    connectorY={b.connectorY}
                    connectorMountingSide={b.connectorMountingSide}
                  />
                ))}
                {showDiodes && (data.diodes || []).map((d) => (
                  <Diode key={d.id} config={d} />
                ))}
                <Lighting />
              </group>
            ) : (
              <>
                {/* Left Side */}
                <group 
                  rotation={[0, splitRotation * (Math.PI / 180), tentingAngle * (Math.PI / 180)]}
                  position={[-splitGap / 2, leftLift, 0]}
                >
                  {leftFullBbox && (
                    <group position={[-leftFullBbox.centerX, 0, -leftFullBbox.centerY]}>
                      {leftKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="left" />
                      <PCB side="left" />
                      <Case 
                        side="left"
                        groundY={groundY}
                        lift={leftLift}
                        tentingAngle={tentingAngle}
                        splitRotation={splitRotation}
                        typingAngle={typingAngle}
                        centerX={leftFullBbox.centerX}
                        centerY={leftFullBbox.centerY}
                      />
                      {showTrackballs && leftTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      {showControllers && (data.controllers || []).filter(c => c.side === 'left' || !c.side).map((c) => (
                        <MicroController 
                          key={c.id}
                          type={c.type}
                          position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                          rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                          mountingSide={c.mountingSide}
                          side="left"
                        />
                      ))}
                      {leftBatteries.map((b) => (
                        <Battery 
                          key={b.id}
                          id={b.id}
                          width={b.width}
                          height={b.height}
                          thickness={b.thickness}
                          position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                          rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                          mountingSide={b.mountingSide}
                          side="left"
                          connectorEnabled={b.connectorEnabled}
                          connectorX={b.connectorX}
                          connectorY={b.connectorY}
                          connectorMountingSide={b.connectorMountingSide}
                        />
                      ))}
                      {showDiodes && leftDiodes.map((d) => (
                        <Diode key={d.id} config={d} />
                      ))}
                      <Lighting />
                    </group>
                  )}
                </group>
 
                {/* Right Side */}
                <group 
                  rotation={[0, -splitRotation * (Math.PI / 180), -tentingAngle * (Math.PI / 180)]}
                  position={[splitGap / 2, rightLift, 0]}
                >
                  {rightFullBbox && (
                    <group position={[-rightFullBbox.centerX, 0, -rightFullBbox.centerY]}>
                      {rightKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="right" />
                      <PCB side="right" />
                      <Case 
                        side="right"
                        groundY={groundY}
                        lift={rightLift}
                        tentingAngle={-tentingAngle}
                        splitRotation={-splitRotation}
                        typingAngle={typingAngle}
                        centerX={rightFullBbox.centerX}
                        centerY={rightFullBbox.centerY}
                      />
                      {showTrackballs && rightTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      {showControllers && (data.controllers || []).filter(c => c.side === 'right').map((c) => (
                        <MicroController 
                          key={c.id}
                          type={c.type}
                          position={[c.x, c.mountingSide === 'bottom' ? -4 : -2, c.y]}
                          rotation={[c.mountingSide === 'bottom' ? Math.PI : 0, 0, (c.rotation * Math.PI) / 180]}
                          mountingSide={c.mountingSide}
                          side="right"
                        />
                      ))}
                      {rightBatteries.map((b) => (
                        <Battery 
                          key={b.id}
                          id={b.id}
                          width={b.width}
                          height={b.height}
                          thickness={b.thickness}
                          position={[b.x, b.mountingSide === 'bottom' ? -4 : -2, b.y]}
                          rotation={[b.mountingSide === 'bottom' ? Math.PI : 0, 0, (b.rotation * Math.PI) / 180]}
                          mountingSide={b.mountingSide}
                          side="right"
                          connectorEnabled={b.connectorEnabled}
                          connectorX={b.connectorX}
                          connectorY={b.connectorY}
                          connectorMountingSide={b.connectorMountingSide}
                        />
                      ))}
                      {showDiodes && rightDiodes.map((d) => (
                        <Diode key={d.id} config={d} />
                      ))}
                      <Lighting />
                    </group>
                  )}
                </group>
              </>
            )}
 
            {gridVisible && (
              <Grid
                infiniteGrid
                fadeDistance={1000}
                fadeStrength={5}
                cellSize={gridSize / 4}
                sectionSize={gridSize}
                sectionColor="#4f46e5"
                cellColor="#2e2e3a"
                position={[0, groundY + 0.1, 0]} 
              />
            )}
          </group>
        </Float>
 
        <ContactShadows 
          opacity={0.4} 
          scale={400} 
          blur={2} 
          far={20} 
          resolution={256} 
          color="#000000" 
          position={[0, groundY, 0]}
        />
      </Suspense>
 
      <OrbitControls 
        target={[0, 0, 0]} 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        makeDefault 
      />
 
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]} 
        onClick={() => {
          selectKey(null);
          selectTrackball(null);
          selectController(null);
          selectBattery(null);
          selectDiode(null);
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </Canvas>
  );
};

export default KeyboardCanvas;
