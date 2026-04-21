import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Grid } from '@react-three/drei';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import KeySwitch from './KeySwitch';
import Plate from './Plate';

const KeyboardCanvas: React.FC = () => {
  const { data, selectKey, selectedKeyId, gridVisible, gridSize, viewMode } = useKeyboardStore();
  const isEditing = selectedKeyId !== null;
  const is2D = viewMode === '2D';

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
          <group position={[0, 0, 0]}>
            {data.layout.map((key) => (
              <KeySwitch key={key.id} config={key} />
            ))}
            <Plate />
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
            position={[0, -0.1, 0]}
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
          />
        )}
      </Suspense>

      <OrbitControls 
        key={viewMode}
        enablePan={true} 
        enableZoom={true} 
        enableRotate={!is2D}
        makeDefault 
        minPolarAngle={is2D ? 0 : 0}
        maxPolarAngle={is2D ? 0 : Math.PI}
      />
    </Canvas>
  );
};

export default KeyboardCanvas;
