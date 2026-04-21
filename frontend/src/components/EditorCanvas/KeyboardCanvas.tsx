import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Grid } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';

import { calculateBoundingBox } from '../../utils/geometry';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId, gridVisible, gridSize, viewMode } = useKeyboardStore();
  const { typingAngle } = data.case_config;
  const isEditing = selectedKeyId !== null;
  const is2D = viewMode === '2D';

  const bbox = calculateBoundingBox(data.layout);
  const centerOffset = bbox ? [-bbox.centerX, 0, -bbox.centerY] : [0, 0, 0];

  const { tentingAngle, splitRotation } = data.case_config;
  const leftKeys = data.layout.filter(k => k.side === 'left' || !k.side);
  const rightKeys = data.layout.filter(k => k.side === 'right');

  return (
    <Canvas
      shadows
      orthographic={is2D}
      camera={is2D 
        ? { position: [0, 500, 0], zoom: 10, up: [0, 0, -1], near: 0.1, far: 1000 }
        : { position: [150, 200, 250], fov: 45, up: [0, 1, 0], near: 0.1, far: 2000 }
      }
      style={{ height: '100%', width: '100%' }}
      onPointerMissed={() => selectKey(null)}
    >
      <color attach="background" args={['#0a0a0c']} />
      <fog attach="fog" args={['#0a0a0c', 200, 1000]} />
      
      <Suspense fallback={null}>
        <ambientLight intensity={is2D ? 0.8 : 0.5} />
        <spotLight position={[100, 200, 100]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={0.5} />
        {is2D && <directionalLight position={[0, 500, 0]} intensity={0.5} />}
        
        <Environment preset="city" />

        <Float 
          speed={isEditing || is2D ? 0 : 1.5} 
          rotationIntensity={isEditing || is2D ? 0 : 0.2} 
          floatIntensity={isEditing || is2D ? 0 : 0.5}
        >
          {/* Apply typing angle tilt and centering offset */}
          <group 
            rotation={is2D ? [0, 0, 0] : [-typingAngle * (Math.PI / 180), 0, 0]}
            position={[0, 0, 0]}
          >
            <group position={centerOffset as [number, number, number]}>
              {data.type === 'integrated' ? (
                <>
                  {data.layout.map((key) => (
                    <KeySwitch key={key.id} config={key} />
                  ))}
                  <Plate />
                </>
              ) : (
                <>
                  {/* Left Side */}
                  <group 
                    rotation={is2D ? [0, 0, 0] : [0, splitRotation * (Math.PI / 180), tentingAngle * (Math.PI / 180)]}
                  >
                    {leftKeys.map((key) => (
                      <KeySwitch key={key.id} config={key} />
                    ))}
                    <Plate side="left" />
                  </group>

                  {/* Right Side */}
                  <group 
                    rotation={is2D ? [0, 0, 0] : [0, -splitRotation * (Math.PI / 180), -tentingAngle * (Math.PI / 180)]}
                  >
                    {rightKeys.map((key) => (
                      <KeySwitch key={key.id} config={key} />
                    ))}
                    <Plate side="right" />
                  </group>
                </>
              )}
            </group>
          </group>
        </Float>

        {gridVisible && (
          <Grid
            infiniteGrid
            fadeDistance={1000}
            fadeStrength={5}
            cellSize={gridSize / 4}
            sectionSize={gridSize}
            sectionColor="#4f46e5"
            cellColor="#2e2e3a"
            position={[0, -5, 0]} // Fixed floor grid below the plate
          />
        )}

        {!is2D && (
          <ContactShadows 
            opacity={0.4} 
            scale={400} 
            blur={2} 
            far={10} 
            resolution={256} 
            color="#000000" 
            position={[0, -4.9, 0]}
          />
        )}
      </Suspense>

      <OrbitControls 
        key={viewMode}
        target={[0, 0, 0]} // Always orbit around the centered keyboard
        enablePan={true} 
        enableZoom={true} 
        enableRotate={!is2D}
        makeDefault 
      />
    </Canvas>
  );
};

export default KeyboardCanvas;
