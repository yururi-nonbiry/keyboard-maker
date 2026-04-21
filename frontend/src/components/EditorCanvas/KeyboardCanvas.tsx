import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Grid } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';
import Case from './Case';
import MicroController from './MicroController';
import Trackball from './Trackball';

import { calculateBoundingBox } from '../../utils/geometry';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId, selectTrackball, selectedTrackballId, gridVisible, gridSize } = useKeyboardStore();

  const { typingAngle } = data.case_config;
  const isEditing = selectedKeyId !== null || selectedTrackballId !== null;

  const { tentingAngle, splitRotation, splitGap } = data.case_config;
  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  const leftTrackballs = (data.trackballs || []).filter(t => t.side === 'left' || !t.side);
  const rightTrackballs = (data.trackballs || []).filter(t => t.side === 'right');

  const bbox = calculateBoundingBox(data.layout, data.case_config.keyPitch);
  const centerOffset = bbox ? [-bbox.centerX, 0, -bbox.centerY] : [0, 0, 0];

  const leftBbox = calculateBoundingBox(leftKeys, data.case_config.keyPitch);
  const rightBbox = calculateBoundingBox(rightKeys, data.case_config.keyPitch);

  return (
    <Canvas
      shadows
      camera={{ position: [150, 200, 250], fov: 45, up: [0, 1, 0], near: 0.1, far: 2000 }}
      style={{ height: '100%', width: '100%' }}
    >
      <color attach="background" args={['#0a0a0c']} />
      <fog attach="fog" args={['#0a0a0c', 200, 1000]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <spotLight position={[100, 200, 100]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        
        <Environment preset="city" />

        <Float 
          speed={isEditing ? 0 : 1.5} 
          rotationIntensity={isEditing ? 0 : 0.2} 
          floatIntensity={isEditing ? 0 : 0.5}
        >
          {/* Apply typing angle tilt and centering offset */}
          <group 
            rotation={[typingAngle * (Math.PI / 180), 0, 0]}
            position={[0, 0, 0]}
          >
            {data.type === 'integrated' ? (
              <group position={centerOffset as [number, number, number]}>
                {data.layout.map((key) => (
                  <KeySwitch key={key.id} config={key} />
                ))}
                <Plate />
                <Case />
                {(data.trackballs || []).map((t) => (
                  <Trackball key={t.id} config={t} />
                ))}
                <MicroController 
                  type={data.pcb_config.controllerType}
                  position={[0, -2, -60]} // Positioned behind the keys
                  rotation={[0, 0, 0]}
                />
              </group>
            ) : (
              <>
                {/* Left Side */}
                <group 
                  rotation={[0, splitRotation * (Math.PI / 180), tentingAngle * (Math.PI / 180)]}
                  position={[-splitGap / 2, 0, 0]}
                >
                  {leftBbox && (
                    <group position={[-leftBbox.centerX, 0, -leftBbox.centerY]}>
                      {leftKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="left" />
                      <Case side="left" />
                      {leftTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      <MicroController 
                        type={data.pcb_config.controllerType}
                        position={[0, -2, -60]} 
                        rotation={[0, 0, 0]}
                      />
                    </group>
                  )}
                </group>

                {/* Right Side */}
                <group 
                  rotation={[0, -splitRotation * (Math.PI / 180), -tentingAngle * (Math.PI / 180)]}
                  position={[splitGap / 2, 0, 0]}
                >
                  {rightBbox && (
                    <group position={[-rightBbox.centerX, 0, -rightBbox.centerY]}>
                      {rightKeys.map((key) => (
                        <KeySwitch key={key.id} config={key} />
                      ))}
                      <Plate side="right" />
                      <Case side="right" />
                      {rightTrackballs.map((t) => (
                        <Trackball key={t.id} config={t} />
                      ))}
                      <MicroController 
                        type={data.pcb_config.controllerType}
                        position={[0, -2, -60]} 
                        rotation={[0, 0, 0]}
                      />
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
                position={[0, -4.5, 0]} // Grid plane parallel to the keyboard base
              />
            )}
          </group>
        </Float>

        <ContactShadows 
          opacity={0.4} 
          scale={400} 
          blur={2} 
          far={10} 
          resolution={256} 
          color="#000000" 
          position={[0, -4.9, 0]}
        />
      </Suspense>

      <OrbitControls 
        target={[0, 0, 0]} // Always orbit around the centered keyboard
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        makeDefault 
      />

      {/* Background plane for deselection */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]} 
        onClick={() => {
          selectKey(null);
          selectTrackball(null);
        }}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </Canvas>
  );
};

export default KeyboardCanvas;

