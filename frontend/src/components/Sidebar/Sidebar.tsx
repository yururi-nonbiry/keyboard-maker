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
        <h3 className={styles.sectionTitle}>Project Info</h3>
        <div className={styles.group}>
          <label className={styles.label}>Keyboard Name</label>
          <input
            className={styles.input}
            value={data.metadata.name}
            onChange={(e) => updateMetadata({ name: e.target.value })}
          />
        </div>
      </div>

      {selectedKey ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Key Configuration</h3>
          <div className={styles.group}>
            <label className={styles.label}>Position (X, Y)</label>
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
            <label className={styles.label}>Rotation</label>
            <input
              className={styles.input}
              type="number"
              value={selectedKey.rotation}
              onChange={(e) => updateKey(selectedKey.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Switch Type</label>
            <select
              className={styles.input}
              value={selectedKey.switchType}
              onChange={(e) => updateKey(selectedKey.id, { switchType: e.target.value as SwitchType })}
            >
              <option value="mx">MX Compatible</option>
              <option value="choc">Choc V1</option>
              <option value="choc_v2">Choc V2</option>
              <option value="x_switch">X Switch</option>
              <option value="ec">EC (Topre)</option>
            </select>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeKey(selectedKey.id)}
            >
              Remove Key
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.label}>Select a key to edit its properties.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
