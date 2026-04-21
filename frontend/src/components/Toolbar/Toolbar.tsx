import { Save, FolderOpen, Download, Plus, Grid, Magnet, Box, Square, Scissors } from 'lucide-react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { saveProjectFile, loadProjectFile } from '../../utils/fileSystem';
import styles from './Toolbar.module.css';

const Toolbar: React.FC = () => {
  const { 
    data, 
    setKeyboardData, 
    addKey, 
    gridVisible, 
    gridSnapping, 
    toggleGridVisible, 
    toggleGridSnapping,
    viewMode,
    setViewMode,
    splitMode,
    toggleSplitMode
  } = useKeyboardStore();

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
        <button 
          className={`${styles.button} ${viewMode === '3D' ? styles.activeButton : ''}`} 
          onClick={() => setViewMode('3D')}
          title="3D表示モード"
        >
          <Box size={18} />
          <span>3D</span>
        </button>
        <button 
          className={`${styles.button} ${viewMode === '2D' ? styles.activeButton : ''}`} 
          onClick={() => setViewMode('2D')}
          title="2D表示モード (俯瞰)"
        >
          <Square size={18} />
          <span>2D</span>
        </button>
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />
        <button 
          className={`${styles.button} ${gridVisible ? styles.activeButton : ''}`} 
          onClick={toggleGridVisible}
          title="グリッドの表示/非表示"
        >
          <Grid size={18} />
          <span>グリッド</span>
        </button>
        <button 
          className={`${styles.button} ${gridSnapping ? styles.activeButton : ''}`} 
          onClick={toggleGridSnapping}
          title="グリッドスナップの有効/無効"
        >
          <Magnet size={18} />
          <span>スナップ</span>
        </button>
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />
        <button className={styles.button} onClick={handleLoad}>
          <FolderOpen size={18} />
          <span>開く</span>
        </button>
        <button className={styles.button} onClick={handleSave}>
          <Save size={18} />
        </button>
        {data.type === 'integrated' && (
          <button 
            className={`${styles.button} ${splitMode ? styles.activeButton : ''}`} 
            onClick={toggleSplitMode}
            title="分割レイアウトに変換"
          >
            <Scissors size={18} />
            <span>分割</span>
          </button>
        )}
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleAddKey}>
          <Plus size={18} />
          <span>キーを追加</span>
        </button>
        <button className={styles.button}>
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
