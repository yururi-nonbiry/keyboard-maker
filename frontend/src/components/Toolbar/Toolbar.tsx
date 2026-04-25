import { Save, FolderOpen, Download, Plus, Grid, Magnet, Box, Square, Scissors, Circle, Settings } from 'lucide-react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { saveProjectFile, loadProjectFile, downloadTextFile } from '../../utils/fileSystem';
import { generateKicadPcb } from '../../utils/kicadExport';
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
    toggleSplitMode,
    addTrackball,
    toggleSettingsModal
  } = useKeyboardStore();

  const handleSave = async () => {
    await saveProjectFile(data);
  };

  const handleLoad = async () => {
    const loadedData = await loadProjectFile();
    if (loadedData) setKeyboardData(loadedData);
  };

  const handleExportKicad = () => {
    const kicadSExp = generateKicadPcb(data);
    const filename = `${data.metadata.name.toLowerCase().replace(/ /g, '_')}.kicad_pcb`;
    downloadTextFile(filename, kicadSExp);
  };

  const handleAddKey = (side?: 'left' | 'right') => {
    const newKey = {
      id: `key-${Date.now()}`,
      x: 0,
      y: 0,
      rotation: 0,
      switchType: 'mx' as const,
      keycapSize: { width: 1, height: 1 },
      side: side,
    };
    addKey(newKey);
  };

  const handleAddTrackball = (side?: 'left' | 'right') => {
    const newTrackball = {
      id: `trackball-${Date.now()}`,
      x: 0,
      y: 0,
      z: -6.5,
      diameter: 34,
      sensorType: 'pmw3360' as const,
      sensorAngle: 0,
      sensorRotation: 0,
      rotation: 0,
      side: side,
      mountingSide: 'bottom' as const,
    };
    addTrackball(newTrackball);
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
        <button className={styles.button} onClick={handleLoad} title="プロジェクトを開く (.json)">
          <FolderOpen size={18} />
          <span>開く</span>
        </button>
        <button className={styles.button} onClick={handleSave} title="プロジェクトを保存 (.json)">
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
        {data.type === 'split' ? (
          <div className={`${styles.buttonGroup} ${styles.primaryButtonGroup}`}>
            <button 
              className={`${styles.button} ${styles.primaryButton}`} 
              onClick={() => handleAddKey('left')}
              title="左手側にキーを追加"
            >
              <Plus size={16} />
              <span>左手キー</span>
            </button>
            <button 
              className={`${styles.button} ${styles.primaryButton}`} 
              onClick={() => handleAddTrackball('left')}
              title="左手側にトラックボールを追加"
            >
              <Circle size={16} />
              <span>左手TB</span>
            </button>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 0' }} />
            <button 
              className={`${styles.button} ${styles.primaryButton}`} 
              onClick={() => handleAddKey('right')}
              title="右手側にキーを追加"
            >
              <Plus size={16} />
              <span>右手キー</span>
            </button>
            <button 
              className={`${styles.button} ${styles.primaryButton}`} 
              onClick={() => handleAddTrackball('right')}
              title="右手側にトラックボールを追加"
            >
              <Circle size={16} />
              <span>右手TB</span>
            </button>
          </div>
        ) : (
          <div className={`${styles.buttonGroup} ${styles.primaryButtonGroup}`}>
            <button className={`${styles.button} ${styles.primaryButton}`} onClick={() => handleAddKey()}>
              <Plus size={18} />
              <span>キー追加</span>
            </button>
            <button className={`${styles.button} ${styles.primaryButton}`} onClick={() => handleAddTrackball()}>
              <Circle size={18} />
              <span>TB追加</span>
            </button>
          </div>
        )}
        <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }} />
        <button 
          className={styles.button} 
          onClick={handleExportKicad}
          title="KiCad基板ファイルとしてエクスポート (.kicad_pcb)"
        >
          <Download size={18} />
          <span>KiCad</span>
        </button>
        <button 
          className={styles.button} 
          onClick={() => toggleSettingsModal(true)}
          title="詳細設定を開く"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
