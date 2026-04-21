import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { SwitchType } from '../../types';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const { data, updateMetadata, selectedKeyId, updateKey, removeKey } = useKeyboardStore();
  const selectedKey = data.layout.find(k => k.id === selectedKeyId);

  return (
    <div className={`${styles.sidebar} glass`}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>プロジェクト情報</h3>
        <div className={styles.group}>
          <label className={styles.label}>キーボード名</label>
          <input
            className={styles.input}
            value={data.metadata.name}
            onChange={(e) => updateMetadata({ name: e.target.value })}
          />
        </div>
      </div>

      {selectedKey ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>キー設定</h3>
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <input
                className={styles.input}
                type="number"
                value={selectedKey.x}
                onChange={(e) => updateKey(selectedKey.id, { x: parseFloat(e.target.value) || 0 })}
              />
              <input
                className={styles.input}
                type="number"
                value={selectedKey.y}
                onChange={(e) => updateKey(selectedKey.id, { y: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>回転</label>
            <input
              className={styles.input}
              type="number"
              value={selectedKey.rotation}
              onChange={(e) => updateKey(selectedKey.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>スイッチの種類</label>
            <select
              className={styles.input}
              value={selectedKey.switchType}
              onChange={(e) => updateKey(selectedKey.id, { switchType: e.target.value as SwitchType })}
            >
              <option value="mx">MX互換</option>
              <option value="choc">Choc V1</option>
              <option value="choc_v2">Choc V2</option>
              <option value="x_switch">X Switch</option>
              <option value="ec">静電容量無接点方式 (Topre)</option>
            </select>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeKey(selectedKey.id)}
            >
              キーを削除
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.label}>編集するキーを選択してください。</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
