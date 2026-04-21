import React from 'react';
import { Save, FolderOpen, Download, Plus } from 'lucide-react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { saveProjectFile, loadProjectFile } from '../../utils/fileSystem';
import styles from './Toolbar.module.css';

const Toolbar: React.FC = () => {
  const { data, setKeyboardData, addKey } = useKeyboardStore();

  const handleSave = async () => {
    await saveProjectFile(data);
  };

  const handleLoad = async () => {
    const loadedData = await loadProjectFile();
    if (loadedData) setKeyboardData(loadedData);
  };

  const handleAddKey = () => {
    const newKey = {
      id: `key-${Date.now()}`,
      x: 0,
      y: 0,
      rotation: 0,
      switchType: 'mx' as const,
      keycapSize: { width: 1, height: 1 },
    };
    addKey(newKey);
  };

  return (
    <div className={`${styles.toolbar} glass`}>
      <div className={styles.logo}>Keyboard Maker</div>
      <div className={styles.actions}>
        <button className={styles.button} onClick={handleLoad}>
          <FolderOpen size={18} />
          <span>Open</span>
        </button>
        <button className={styles.button} onClick={handleSave}>
          <Save size={18} />
          <span>Save</span>
        </button>
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleAddKey}>
          <Plus size={18} />
          <span>Add Key</span>
        </button>
        <button className={styles.button}>
          <Download size={18} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
