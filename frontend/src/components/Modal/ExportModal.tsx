import React from 'react';
import Modal from './Modal';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { Box, Download } from 'lucide-react';
import styles from './ExportModal.module.css';

const ExportModal: React.FC = () => {
  const { exportModalOpen, toggleExportModal, triggerExport } = useKeyboardStore();

  const handleExport = (format: 'stl' | 'glb') => {
    triggerExport(format);
  };

  return (
    <Modal
      isOpen={exportModalOpen}
      onClose={() => toggleExportModal(false)}
      title="3Dモデルのエクスポート"
    >
      <div className={styles.container}>
        <p className={styles.description}>
          キーボードの3Dモデルをエクスポートします。
          STLは3Dプリントに、GLBは汎用的な3DビューアーやCADでの利用に適しています。
        </p>

        <div className={styles.options}>
          <button className={styles.optionButton} onClick={() => handleExport('stl')}>
            <div className={styles.iconWrapper}>
              <Box size={32} />
            </div>
            <div className={styles.optionText}>
              <h3>STL (.stl)</h3>
              <p>3Dプリンタ用の標準形式</p>
            </div>
            <Download size={20} className={styles.downloadIcon} />
          </button>

          <button className={styles.optionButton} onClick={() => handleExport('glb')}>
            <div className={styles.iconWrapper}>
              <Box size={32} />
            </div>
            <div className={styles.optionText}>
              <h3>GLB (.glb)</h3>
              <p>汎用的な3D形式（テクスチャ保持）</p>
            </div>
            <Download size={20} className={styles.downloadIcon} />
          </button>
        </div>

        <div className={styles.infoBox}>
          <h4>STEP形式について</h4>
          <p>
            現在、アプリからの直接出力には対応していません。
            エクスポートしたSTLファイルをFusion 360やFreeCADなどのCADソフトに取り込み、
            「メッシュをソリッドに変換」した後にSTEPとして保存してください。
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
