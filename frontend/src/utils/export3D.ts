import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

export const exportToSTL = (scene: THREE.Object3D, binary: boolean = true) => {
  const exporter = new STLExporter();
  const options = { binary };
  const result = exporter.parse(scene, options);
  
  const blob = new Blob([result], { type: binary ? 'application/octet-stream' : 'text/plain' });
  return blob;
};

export const exportToGLB = async (scene: THREE.Object3D): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(new Blob([gltf], { type: 'model/gltf-binary' }));
        } else {
          const json = JSON.stringify(gltf);
          resolve(new Blob([json], { type: 'model/gltf+json' }));
        }
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
