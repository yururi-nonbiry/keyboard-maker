import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { SwitchType } from '../../types';
import styles from './Sidebar.module.css';

const CollapsibleSection: React.FC<{
  title: string;
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, id, isExpanded, onToggle, children, badge }) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => onToggle(id)}>
        <div className={styles.sectionHeaderMain}>
          <svg 
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>
        {badge}
      </div>
      <div className={`${styles.sectionContent} ${!isExpanded ? styles.sectionContentCollapsed : ''}`}>
        {children}
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { 
    data,
    selectedKeyId, 
    updateKey, 
    removeKey,
    selectedTrackballId,
    updateTrackball,
    removeTrackball,
    selectedControllerId,
    updateController,
    removeController,
    updateKeyMatrix,
    selectedBatteryId,
    updateBattery,
    removeBattery,
    selectedDiodeId,
    updateDiode,
    removeDiode,
    selectedMountingHoleId,
    updateMountingHole,
    removeMountingHole,
  } = useKeyboardStore();

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    selection: true,
  });

  // Auto-expand selection section when a new item is selected
  React.useEffect(() => {
    if (selectedKeyId || selectedTrackballId || selectedControllerId || selectedBatteryId || selectedDiodeId || selectedMountingHoleId) {
      setExpandedSections(prev => ({ ...prev, selection: true }));
    }
  }, [selectedKeyId, selectedTrackballId, selectedControllerId, selectedBatteryId, selectedDiodeId, selectedMountingHoleId]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectedKey = data.layout.find(k => k.id === selectedKeyId);
  const selectedTrackball = (data.trackballs || []).find(t => t.id === selectedTrackballId);
  const selectedController = (data.controllers || []).find(c => c.id === selectedControllerId);
  const selectedBattery = (data.batteries || []).find(b => b.id === selectedBatteryId);
  const selectedDiode = (data.diodes || []).find(d => d.id === selectedDiodeId);
  const selectedMountingHole = (data.mountingHoles || []).find(h => h.id === selectedMountingHoleId);

  return (
    <div className={`${styles.sidebar} glass`}>
      {!(selectedKey || selectedTrackball || selectedController || selectedBattery || selectedDiode || selectedMountingHole) && (
        <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>
          <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>アイテムを選択して設定を表示</p>
          <div style={{ borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />
          <p style={{ fontSize: '0.75rem' }}>
            キーボード全体の詳細設定は<br/>
            上部ツールバーの ⚙️ アイコンから<br/>
            開くことができます。
          </p>
        </div>
      )}

      {selectedKey ? (
        <CollapsibleSection 
          id="selection" 
          title="キー設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
        >
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedKey.x}
                  onChange={(e) => updateKey(selectedKey.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedKey.y}
                  onChange={(e) => updateKey(selectedKey.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
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
            <label className={styles.label}>マトリックス (Row, Col)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>R</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedKey.matrixRow ?? ''}
                  onChange={(e) => updateKeyMatrix(selectedKey.id, parseInt(e.target.value) || 0, selectedKey.matrixCol || 0)}
                  placeholder="Row"
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>C</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedKey.matrixCol ?? ''}
                  onChange={(e) => updateKeyMatrix(selectedKey.id, selectedKey.matrixRow || 0, parseInt(e.target.value) || 0)}
                  placeholder="Col"
                />
              </div>
            </div>
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
          <div className={styles.group}>
            <label className={styles.label}>キーキャップのプロファイル</label>
            <select
              className={styles.input}
              value={selectedKey.keycapProfile || ''}
              onChange={(e) => updateKey(selectedKey.id, { keycapProfile: (e.target.value || undefined) as any })}
            >
              <option value="">デフォルト (Default)</option>
              <option value="cherry">Cherry</option>
              <option value="oem">OEM</option>
              <option value="dsa">DSA</option>
              <option value="xda">XDA</option>
              <option value="choc">Choc</option>
              <option value="mbk">MBK</option>
            </select>
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedKey.side || 'left'}
                onChange={(e) => updateKey(selectedKey.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}
          <div className={styles.group}>
            <label className={styles.label}>キーサイズ (幅, 高さ)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>W</span>
                <input
                  className={styles.input}
                  type="number"
                  step="0.05"
                  value={selectedKey.keycapSize.width}
                  onChange={(e) => updateKey(selectedKey.id, { keycapSize: { ...selectedKey.keycapSize, width: parseFloat(e.target.value) || 1 } })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>H</span>
                <input
                  className={styles.input}
                  type="number"
                  step="0.05"
                  value={selectedKey.keycapSize.height}
                  onChange={(e) => updateKey(selectedKey.id, { keycapSize: { ...selectedKey.keycapSize, height: parseFloat(e.target.value) || 1 } })}
                />
              </div>
            </div>
            <div className={styles.presetGrid}>
              {[1, 1.25, 1.5, 1.75, 2, 2.25, 2.75, 6.25].map(w => (
                <button
                  key={w}
                  className={`${styles.presetButton} ${selectedKey.keycapSize.width === w ? styles.presetButtonActive : ''}`}
                  onClick={() => updateKey(selectedKey.id, { keycapSize: { ...selectedKey.keycapSize, width: w } })}
                >
                  {w}u
                </button>
              ))}
            </div>
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
        </CollapsibleSection>
      ) : selectedTrackball ? (
        <CollapsibleSection 
          id="selection" 
          title="トラックボール設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
        >
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedTrackball.x}
                  onChange={(e) => updateTrackball(selectedTrackball.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedTrackball.y}
                  onChange={(e) => updateTrackball(selectedTrackball.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>回転 (Rotation)</label>
            <input
              className={styles.input}
              type="number"
              value={selectedTrackball.rotation || 0}
              onChange={(e) => updateTrackball(selectedTrackball.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>直径 (Diameter): {selectedTrackball.diameter}mm</label>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              className={styles.input}
              value={selectedTrackball.diameter}
              onChange={(e) => updateTrackball(selectedTrackball.id, { diameter: parseFloat(e.target.value) || 34 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>高さ (Z): {selectedTrackball.z ?? -5}mm</label>
            <div className={styles.row}>
              <input
                type="number"
                step="0.5"
                className={styles.input}
                value={selectedTrackball.z ?? -5}
                onChange={(e) => updateTrackball(selectedTrackball.id, { z: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              step="0.5"
              className={styles.input}
              value={selectedTrackball.z ?? -5}
              onChange={(e) => updateTrackball(selectedTrackball.id, { z: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>センサーの種類</label>
            <select
              className={styles.input}
              value={selectedTrackball.sensorType}
              onChange={(e) => updateTrackball(selectedTrackball.id, { sensorType: e.target.value as any })}
            >
              <option value="pmw3360">PMW3360</option>
              <option value="pmw3389">PMW3389</option>
              <option value="adns9800">ADNS9800</option>
            </select>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>センサーの配置角度: {selectedTrackball.sensorAngle || 0}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              className={styles.input}
              value={selectedTrackball.sensorAngle || 0}
              onChange={(e) => updateTrackball(selectedTrackball.id, { sensorAngle: parseFloat(e.target.value) })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>センサーの回転: {selectedTrackball.sensorRotation || 0}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              className={styles.input}
              value={selectedTrackball.sensorRotation || 0}
              onChange={(e) => updateTrackball(selectedTrackball.id, { sensorRotation: parseFloat(e.target.value) })}
            />
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedTrackball.side || 'left'}
                onChange={(e) => updateTrackball(selectedTrackball.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}
          <div className={styles.group}>
            <label className={styles.label}>マウント面 (Mounting Side)</label>
            <select
              className={styles.input}
              value={selectedTrackball.mountingSide || 'bottom'}
              onChange={(e) => updateTrackball(selectedTrackball.id, { mountingSide: e.target.value as 'top' | 'bottom' })}
            >
              <option value="top">表面 (Top)</option>
              <option value="bottom">裏面 (Bottom)</option>
            </select>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeTrackball(selectedTrackball.id)}
            >
              トラックボールを削除
            </button>
          </div>
        </CollapsibleSection>
      ) : selectedController ? (
        <CollapsibleSection 
          id="selection" 
          title="MCU設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
          badge={
            data.type === 'split' && (
              <span className={`${styles.badge} ${selectedController.side === 'left' ? styles.badgeLeft : styles.badgeRight}`}>
                {selectedController.side === 'left' ? 'LEFT' : 'RIGHT'}
              </span>
            )
          }
        >
          <div className={styles.group}>
            <label className={styles.label}>種類</label>
            <select
              className={styles.input}
              value={selectedController.type}
              onChange={(e) => updateController(selectedController.id, { type: e.target.value as any })}
            >
              <option value="pro_micro">Pro Micro</option>
              <option value="elite_c">Elite-C</option>
              <option value="xiao_rp2040">XIAO RP2040</option>
              <option value="xiao_ble">XIAO nRF52840 (BLE)</option>
              <option value="pico">Raspberry Pi Pico</option>
              <option value="bluepill">Bluepill (STM32)</option>
            </select>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedController.x}
                  onChange={(e) => updateController(selectedController.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedController.y}
                  onChange={(e) => updateController(selectedController.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>回転</label>
            <input
              className={styles.input}
              type="number"
              value={selectedController.rotation}
              onChange={(e) => updateController(selectedController.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>マウント面</label>
            <select
              className={styles.input}
              value={selectedController.mountingSide}
              onChange={(e) => updateController(selectedController.id, { mountingSide: e.target.value as 'top' | 'bottom' })}
            >
              <option value="top">表面 (Top)</option>
              <option value="bottom">裏面 (Bottom)</option>
            </select>
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedController.side || 'left'}
                onChange={(e) => updateController(selectedController.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeController(selectedController.id)}
            >
              MCUを削除
            </button>
          </div>
        </CollapsibleSection>
      ) : selectedBattery ? (
        <CollapsibleSection 
          id="selection" 
          title="バッテリー設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
          badge={
            data.type === 'split' && (
              <span className={`${styles.badge} ${selectedBattery.side === 'left' ? styles.badgeLeft : styles.badgeRight}`}>
                {selectedBattery.side === 'left' ? 'LEFT' : 'RIGHT'}
              </span>
            )
          }
        >
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedBattery.x}
                  onChange={(e) => updateBattery(selectedBattery.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedBattery.y}
                  onChange={(e) => updateBattery(selectedBattery.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>サイズ (幅 x 高さ x 厚み)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedBattery.width}
                  onChange={(e) => updateBattery(selectedBattery.id, { width: parseFloat(e.target.value) || 0 })}
                  placeholder="幅"
                />
              </div>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedBattery.height}
                  onChange={(e) => updateBattery(selectedBattery.id, { height: parseFloat(e.target.value) || 0 })}
                  placeholder="高さ"
                />
              </div>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedBattery.thickness}
                  onChange={(e) => updateBattery(selectedBattery.id, { thickness: parseFloat(e.target.value) || 0 })}
                  placeholder="厚み"
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>回転</label>
            <input
              className={styles.input}
              type="number"
              value={selectedBattery.rotation}
              onChange={(e) => updateBattery(selectedBattery.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>マウント面</label>
            <select
              className={styles.input}
              value={selectedBattery.mountingSide}
              onChange={(e) => updateBattery(selectedBattery.id, { mountingSide: e.target.value as 'top' | 'bottom' })}
            >
              <option value="top">表面 (Top)</option>
              <option value="bottom">裏面 (Bottom)</option>
            </select>
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedBattery.side || 'left'}
                onChange={(e) => updateBattery(selectedBattery.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}

          <div className={styles.divider} />
          
          <div className={styles.group}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox} 
                checked={selectedBattery.connectorEnabled || false} 
                onChange={(e) => updateBattery(selectedBattery.id, { connectorEnabled: e.target.checked })} 
              />
              コネクタを有効化
            </label>
          </div>

          {selectedBattery.connectorEnabled && (
            <>
              <div className={styles.group}>
                <label className={styles.label}>コネクタ座標 (X, Y)</label>
                <div className={styles.row}>
                  <div className={styles.inputWrapper}>
                    <span className={styles.coordLabel}>X</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={selectedBattery.connectorX ?? selectedBattery.x}
                      onChange={(e) => updateBattery(selectedBattery.id, { connectorX: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.inputWrapper}>
                    <span className={styles.coordLabel}>Y</span>
                    <input
                      className={styles.input}
                      type="number"
                      value={selectedBattery.connectorY ?? (selectedBattery.y + 10)}
                      onChange={(e) => updateBattery(selectedBattery.id, { connectorY: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>コネクタ マウント面</label>
                <select
                  className={styles.input}
                  value={selectedBattery.connectorMountingSide || selectedBattery.mountingSide}
                  onChange={(e) => updateBattery(selectedBattery.id, { connectorMountingSide: e.target.value as 'top' | 'bottom' })}
                >
                  <option value="top">表面 (Top)</option>
                  <option value="bottom">裏面 (Bottom)</option>
                </select>
              </div>
            </>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeBattery(selectedBattery.id)}
            >
              バッテリーを削除
            </button>
          </div>
        </CollapsibleSection>
      ) : selectedDiode ? (
        <CollapsibleSection 
          id="selection" 
          title="ダイオード設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
          badge={
            data.type === 'split' && (
              <span className={`${styles.badge} ${selectedDiode.side === 'left' ? styles.badgeLeft : styles.badgeRight}`}>
                {selectedDiode.side === 'left' ? 'LEFT' : 'RIGHT'}
              </span>
            )
          }
        >
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedDiode.x}
                  onChange={(e) => updateDiode(selectedDiode.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedDiode.y}
                  onChange={(e) => updateDiode(selectedDiode.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>回転</label>
            <input
              className={styles.input}
              type="number"
              value={selectedDiode.rotation}
              onChange={(e) => updateDiode(selectedDiode.id, { rotation: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>マウント面</label>
            <select
              className={styles.input}
              value={selectedDiode.mountingSide}
              onChange={(e) => updateDiode(selectedDiode.id, { mountingSide: e.target.value as 'top' | 'bottom' })}
            >
              <option value="top">表面 (Top)</option>
              <option value="bottom">裏面 (Bottom)</option>
            </select>
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedDiode.side || 'left'}
                onChange={(e) => updateDiode(selectedDiode.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeDiode(selectedDiode.id)}
            >
              ダイオードを削除
            </button>
          </div>
        </CollapsibleSection>
      ) : selectedMountingHole ? (
        <CollapsibleSection 
          id="selection" 
          title="マウント穴設定" 
          isExpanded={expandedSections.selection} 
          onToggle={toggleSection}
          badge={
            data.type === 'split' && (
              <span className={`${styles.badge} ${selectedMountingHole.side === 'left' ? styles.badgeLeft : styles.badgeRight}`}>
                {selectedMountingHole.side === 'left' ? 'LEFT' : 'RIGHT'}
              </span>
            )
          }
        >
          <div className={styles.group}>
            <label className={styles.label}>座標 (X, Y)</label>
            <div className={styles.row}>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>X</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedMountingHole.x}
                  onChange={(e) => updateMountingHole(selectedMountingHole.id, { x: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className={styles.inputWrapper}>
                <span className={styles.coordLabel}>Y</span>
                <input
                  className={styles.input}
                  type="number"
                  value={selectedMountingHole.y}
                  onChange={(e) => updateMountingHole(selectedMountingHole.id, { y: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>直径 (Diameter): {selectedMountingHole.diameter}mm</label>
            <input
              className={styles.input}
              type="number"
              step="0.1"
              value={selectedMountingHole.diameter}
              onChange={(e) => updateMountingHole(selectedMountingHole.id, { diameter: parseFloat(e.target.value) || 3.2 })}
            />
            <div className={styles.presetGrid} style={{ marginTop: '8px' }}>
              {[2.2, 3.2, 4.2].map(d => (
                <button
                  key={d}
                  className={`${styles.presetButton} ${selectedMountingHole.diameter === d ? styles.presetButtonActive : ''}`}
                  onClick={() => updateMountingHole(selectedMountingHole.id, { diameter: d })}
                >
                  M{Math.floor(d)} ({d}mm)
                </button>
              ))}
            </div>
          </div>
          {data.type === 'split' && (
            <div className={styles.group}>
              <label className={styles.label}>配置サイド</label>
              <select
                className={styles.input}
                value={selectedMountingHole.side || 'left'}
                onChange={(e) => updateMountingHole(selectedMountingHole.id, { side: e.target.value as 'left' | 'right' })}
              >
                <option value="left">左手 (Left)</option>
                <option value="right">右手 (Right)</option>
              </select>
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeMountingHole(selectedMountingHole.id)}
            >
              マウント穴を削除
            </button>
          </div>
        </CollapsibleSection>
      ) : (
        <div className={styles.section}>
          <p className={styles.label}>編集する項目を選択してください。</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
