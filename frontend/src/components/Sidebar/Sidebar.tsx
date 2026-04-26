import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { SwitchType } from '../../types';
import { Plus, Circle, Cpu, Battery, Target } from 'lucide-react';
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
    toolboxVisibleItems,
    addKey,
    addTrackball,
    addController,
    addBattery,
    addMountingHole,
    updateCaseConfig,
    updatePcbConfig,
    updateLightingConfig,
  } = useKeyboardStore();

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    selection: true,
    toolbox: true,
    appearance: false,
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
      <CollapsibleSection 
        id="toolbox" 
        title="ツールボックス" 
        isExpanded={expandedSections.toolbox} 
        onToggle={toggleSection}
      >
        <div className={styles.toolboxGrid}>
          {(toolboxVisibleItems?.key ?? true) && (
            <button 
              className={styles.toolboxButton} 
              onClick={() => {
                const id = `key-${Date.now()}`;
                addKey({
                  id,
                  x: 0,
                  y: 0,
                  rotation: 0,
                  switchType: 'mx' as const,
                  keycapSize: { width: 1, height: 1 },
                });
              }}
              title="キーを追加"
            >
              <Plus size={18} />
              <span>キー</span>
            </button>
          )}
          {(toolboxVisibleItems?.trackball ?? true) && (
            <button 
              className={styles.toolboxButton} 
              onClick={() => {
                const id = `trackball-${Date.now()}`;
                addTrackball({
                  id,
                  x: 0,
                  y: 0,
                  z: -6.5,
                  diameter: 34,
                  sensorType: 'pmw3360' as const,
                  sensorAngle: 0,
                  sensorRotation: 0,
                  rotation: 0,
                  mountingSide: 'bottom' as const,
                });
              }}
              title="トラックボールを追加"
            >
              <Circle size={18} />
              <span>TB</span>
            </button>
          )}
          {(toolboxVisibleItems?.mcu ?? true) && (
            <button 
              className={styles.toolboxButton} 
              onClick={() => {
                const id = `mcu-${Date.now()}`;
                addController({ id, type: 'pro_micro', x: 0, y: -60, rotation: 0, side: 'left', mountingSide: 'top' });
              }}
              title="MCUを追加"
            >
              <Cpu size={18} />
              <span>MCU</span>
            </button>
          )}
          {(toolboxVisibleItems?.battery ?? true) && (
            <button 
              className={styles.toolboxButton} 
              onClick={() => {
                const id = `battery-${Date.now()}`;
                addBattery({ id, x: 0, y: 60, width: 30, height: 50, thickness: 4, rotation: 0, side: 'left', mountingSide: 'bottom' });
              }}
              title="バッテリーを追加"
            >
              <Battery size={18} />
              <span>電池</span>
            </button>
          )}
          {(toolboxVisibleItems?.hole ?? true) && (
            <button 
              className={styles.toolboxButton} 
              onClick={() => {
                const id = `hole-${Date.now()}`;
                addMountingHole({ id, x: 0, y: 0, diameter: 3.2, side: 'left' });
              }}
              title="マウント穴を追加"
            >
              <Target size={18} />
              <span>穴</span>
            </button>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="appearance" 
        title="外観・ライティング" 
        isExpanded={expandedSections.appearance} 
        onToggle={toggleSection}
      >
        <div className={styles.group}>
          <label className={styles.label}>背景色 (Background)</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.lighting_config?.backgroundColor || '#0a0a0c'} 
              onChange={(e) => updateLightingConfig({ backgroundColor: e.target.value })}
            />
            <span className={styles.label}>{data.lighting_config?.backgroundColor || '#0a0a0c'}</span>
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>環境光 (Ambient Light)</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.lighting_config?.ambientLightColor || '#ffffff'} 
              onChange={(e) => updateLightingConfig({ ambientLightColor: e.target.value })}
            />
            <span className={styles.label}>{data.lighting_config?.ambientLightColor || '#ffffff'}</span>
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>シーン照明 (Scene Light)</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.lighting_config?.sceneLightColor || '#ffffff'} 
              onChange={(e) => updateLightingConfig({ sceneLightColor: e.target.value })}
            />
            <span className={styles.label}>{data.lighting_config?.sceneLightColor || '#ffffff'}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <label className={styles.label}>ケースカラー</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.case_config.caseColor || '#1e1e2e'} 
              onChange={(e) => updateCaseConfig({ caseColor: e.target.value })}
            />
            <span className={styles.label}>{data.case_config.caseColor || '#1e1e2e'}</span>
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>プレートカラー</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.case_config.plateColor || '#313244'} 
              onChange={(e) => updateCaseConfig({ plateColor: e.target.value })}
            />
            <span className={styles.label}>{data.case_config.plateColor || '#313244'}</span>
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>PCBカラー</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.pcb_config.pcbColor || '#166534'} 
              onChange={(e) => updatePcbConfig({ pcbColor: e.target.value })}
            />
            <span className={styles.label}>{data.pcb_config.pcbColor || '#166534'}</span>
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>デフォルトキーキャップ</label>
          <div className={styles.colorPickerRow}>
            <input 
              type="color" 
              className={styles.colorInput} 
              value={data.case_config.defaultKeycapColor || '#cdd6f4'} 
              onChange={(e) => updateCaseConfig({ defaultKeycapColor: e.target.value })}
            />
            <span className={styles.label}>{data.case_config.defaultKeycapColor || '#cdd6f4'}</span>
          </div>
        </div>

        <div className={styles.divider} />
        
        <div className={styles.group}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={data.lighting_config?.underglowEnabled || false} 
              onChange={(e) => updateLightingConfig({ underglowEnabled: e.target.checked })}
            />
            アンダーグロウ (Underglow)
          </label>
          {data.lighting_config?.underglowEnabled && (
            <div className={styles.colorPickerRow}>
              <input 
                type="color" 
                className={styles.colorInput} 
                value={data.lighting_config.underglowColor || '#ffffff'} 
                onChange={(e) => updateLightingConfig({ underglowColor: e.target.value })}
              />
              <span className={styles.label}>{data.lighting_config.underglowColor || '#ffffff'}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <div className={styles.divider} />

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
          <div className={styles.group}>
            <label className={styles.label}>キーキャップカラー</label>
            <div className={styles.colorPickerRow}>
              <input 
                type="color" 
                className={styles.colorInput} 
                value={selectedKey.keycapColor || data.case_config.defaultKeycapColor || '#cdd6f4'} 
                onChange={(e) => updateKey(selectedKey.id, { keycapColor: e.target.value })}
              />
              <button 
                className={styles.presetButton} 
                onClick={() => updateKey(selectedKey.id, { keycapColor: undefined })}
                style={{ flex: 1 }}
              >
                デフォルトに戻す
              </button>
            </div>
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
            <label className={styles.label}>ボールカラー</label>
            <div className={styles.colorPickerRow}>
              <input 
                type="color" 
                className={styles.colorInput} 
                value={selectedTrackball.ballColor || '#ef4444'} 
                onChange={(e) => updateTrackball(selectedTrackball.id, { ballColor: e.target.value })}
              />
              <span className={styles.label}>{selectedTrackball.ballColor || '#ef4444'}</span>
            </div>
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
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeMountingHole(selectedMountingHole.id)}
            >
              穴を削除
            </button>
          </div>
        </CollapsibleSection>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>
          <p style={{ fontSize: '0.875rem' }}>項目を選択して詳細設定を表示</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
