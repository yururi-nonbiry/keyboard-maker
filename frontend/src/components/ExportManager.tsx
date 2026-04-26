import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { exportToSTL, exportToGLB, downloadBlob } from '../utils/export3D';

interface ExportManagerProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
}

const ExportManager: React.FC<ExportManagerProps> = ({ targetRef }) => {
  const { scene } = useThree();
  const { exportTrigger, clearExportTrigger, data } = useKeyboardStore();

  useEffect(() => {
    if (!exportTrigger) return;

    const performExport = async () => {
      const { format } = exportTrigger;
      const projectName = data.metadata.name.toLowerCase().replace(/ /g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${projectName}_${timestamp}.${format}`;

      try {
        const target = targetRef.current || scene;
        let blob: Blob;
        if (format === 'stl') {
          blob = exportToSTL(target, true);
        } else {
          blob = await exportToGLB(target);
        }

        downloadBlob(blob, filename);
      } catch (err) {
        console.error('Export failed:', err);
        alert('エクスポートに失敗しました。');
      } finally {
        clearExportTrigger();
      }
    };

    performExport();
  }, [exportTrigger, scene, data, clearExportTrigger]);

  return null;
};

export default ExportManager;
