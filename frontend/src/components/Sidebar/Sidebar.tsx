import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { SwitchType, KeyboardType, ControllerType } from '../../types';
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
    updateMetadata, 
    updateKeyboardType, 
    updateCaseConfig,
    updatePcbConfig,
    selectedKeyId, 
    updateKey, 
    removeKey,
    selectedTrackballId,
    updateTrackball,
    removeTrackball,
    selectedControllerId,
    updateController,
    removeController,
    selectController,
    addController,
    showKeycaps,
    showPlate,
    showCaseBase,
    showCaseWalls,
    showPCB,
    showSwitches,
    showTrackballs,
    showControllers,
    showSockets,
    showDiodes,
    toggleKeycapsVisible,
    togglePlateVisible,
    toggleCaseBaseVisible,
    toggleCaseWallsVisible,
    togglePCBVisible,
    toggleSwitchesVisible,
    toggleTrackballsVisible,
    toggleControllersVisible,
    toggleSocketsVisible,
    toggleDiodesVisible,
    showMatrix,
    toggleMatrixVisible,
    autoAssignMatrix,
    updateKeyMatrix,
    selectedBatteryId,
    selectBattery,
    addBattery,
    updateBattery,
    removeBattery,
    selectedDiodeId,
    updateDiode,
    removeDiode,
    autoPlaceDiodes,
    selectedMountingHoleId,
    addMountingHole,
    updateMountingHole,
    removeMountingHole,
    selectMountingHole,
  } = useKeyboardStore();

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    project: true,
    display: true,
    case: true,
    pcb: true,
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
  const { typingAngle, tentingAngle, splitRotation } = data.case_config;

  return (
    <div className={`${styles.sidebar} glass`}>
      <CollapsibleSection 
        id="project" 
        title="プロジェクト情報" 
        isExpanded={expandedSections.project} 
        onToggle={toggleSection}
      >
        <div className={styles.group}>
          <label className={styles.label}>キーボード名</label>
          <input
            className={styles.input}
            value={data.metadata.name}
            onChange={(e) => updateMetadata({ name: e.target.value })}
          />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>タイプ</label>
          <select
            className={styles.input}
            value={data.type}
            onChange={(e) => updateKeyboardType(e.target.value as KeyboardType)}
          >
            <option value="integrated">一体型 (Integrated)</option>
            <option value="split">分割型 (Split)</option>
          </select>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection 
        id="display" 
        title="表示設定" 
        isExpanded={expandedSections.display} 
        onToggle={toggleSection}
      >
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showKeycaps} 
              onChange={toggleKeycapsVisible} 
            />
            キーキャップ
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showPlate} 
              onChange={togglePlateVisible} 
            />
            プレート (Plate)
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showPCB} 
              onChange={togglePCBVisible} 
            />
            基板 (PCB)
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showCaseBase} 
              onChange={toggleCaseBaseVisible} 
            />
            ベース (Base)
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showCaseWalls} 
              onChange={toggleCaseWallsVisible} 
            />
            カバー (Cover)
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showSwitches} 
              onChange={toggleSwitchesVisible} 
            />
            キースイッチ
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showTrackballs} 
              onChange={toggleTrackballsVisible} 
            />
            トラックボール
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showControllers} 
              onChange={toggleControllersVisible} 
            />
            マイコン (MCU)
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showSockets} 
              onChange={toggleSocketsVisible} 
            />
            ホットスワップソケット
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showDiodes} 
              onChange={toggleDiodesVisible} 
            />
            ダイオード
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkbox} 
              checked={showMatrix} 
              onChange={toggleMatrixVisible} 
            />
            マトリックス配線
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="case" 
        title="ケース設定" 
        isExpanded={expandedSections.case} 
        onToggle={toggleSection}
      >
        <div className={styles.group}>
          <label className={styles.label}>ベース角度 (タイピング角): {typingAngle}°</label>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            className={styles.input}
            value={typingAngle}
            onChange={(e) => updateCaseConfig({ typingAngle: parseFloat(e.target.value) })}
          />
        </div>
        {data.type === 'split' && (
          <>
            <div className={styles.group}>
              <label className={styles.label}>テント角: {tentingAngle}°</label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                className={styles.input}
                value={tentingAngle}
                onChange={(e) => updateCaseConfig({ tentingAngle: parseFloat(e.target.value) })}
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>分割回転角: {splitRotation}°</label>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                className={styles.input}
                value={splitRotation}
                onChange={(e) => updateCaseConfig({ splitRotation: parseFloat(e.target.value) })}
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>分割幅 (Gap): {data.case_config.splitGap}mm</label>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                className={styles.input}
                value={data.case_config.splitGap}
                onChange={(e) => updateCaseConfig({ splitGap: parseFloat(e.target.value) })}
              />
            </div>
          </>
        )}
        <div className={styles.group}>
          <label className={styles.label}>キーピッチ: {data.case_config.keyPitch}mm</label>
          <input
            type="number"
            min="15"
            max="20"
            step="0.01"
            className={styles.input}
            value={data.case_config.keyPitch}
            onChange={(e) => updateCaseConfig({ keyPitch: parseFloat(e.target.value) || 19.05 })}
          />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>キーキャップのプロファイル (全体)</label>
          <select
            className={styles.input}
            value={data.case_config.defaultKeycapProfile}
            onChange={(e) => updateCaseConfig({ defaultKeycapProfile: e.target.value as any })}
          >
            <option value="cherry">Cherry</option>
            <option value="oem">OEM</option>
            <option value="dsa">DSA</option>
            <option value="xda">XDA</option>
            <option value="choc">Choc</option>
            <option value="mbk">MBK</option>
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>PCB マージン (外形余裕): {data.case_config.pcbMargin}mm</label>
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            className={styles.input}
            value={data.case_config.pcbMargin}
            onChange={(e) => updateCaseConfig({ pcbMargin: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>プレート オフセット (PCB基準): {data.case_config.plateOffset}mm</label>
          <input
            type="number"
            min="-10"
            max="10"
            step="0.1"
            className={styles.input}
            value={data.case_config.plateOffset}
            onChange={(e) => updateCaseConfig({ plateOffset: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        id="pcb" 
        title="PCB/コントローラー設定" 
        isExpanded={expandedSections.pcb} 
        onToggle={toggleSection}
      >
        <div className={styles.group}>
          <label className={styles.label}>マイクロコントローラー</label>
          <select
            className={styles.input}
            value={data.pcb_config.controllerType}
            onChange={(e) => updatePcbConfig({ controllerType: e.target.value as ControllerType })}
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
          <label className={styles.label}>ダイオード方向</label>
          <select
            className={styles.input}
            value={data.pcb_config.diodeDirection}
            onChange={(e) => updatePcbConfig({ diodeDirection: e.target.value as 'col2row' | 'row2col' })}
          >
            <option value="col2row">Col to Row</option>
            <option value="row2col">Row to Col</option>
          </select>
        </div>

        <div className={styles.divider} />
        <div className={styles.group}>
          <label className={styles.label}>ダイオード自動配置オフセット (X, Y, Rotation)</label>
          <div className={styles.row}>
            <input
              className={styles.input}
              type="number"
              step="0.5"
              value={data.pcb_config.autoDiodeOffset?.x ?? 0}
              onChange={(e) => updatePcbConfig({ autoDiodeOffset: { ...(data.pcb_config.autoDiodeOffset || { x: 0, y: 8, rotation: 0 }), x: parseFloat(e.target.value) || 0 } })}
              placeholder="X"
            />
            <input
              className={styles.input}
              type="number"
              step="0.5"
              value={data.pcb_config.autoDiodeOffset?.y ?? 8}
              onChange={(e) => updatePcbConfig({ autoDiodeOffset: { ...(data.pcb_config.autoDiodeOffset || { x: 0, y: 8, rotation: 0 }), y: parseFloat(e.target.value) || 0 } })}
              placeholder="Y"
            />
            <input
              className={styles.input}
              type="number"
              step="1"
              value={data.pcb_config.autoDiodeOffset?.rotation ?? 0}
              onChange={(e) => updatePcbConfig({ autoDiodeOffset: { ...(data.pcb_config.autoDiodeOffset || { x: 0, y: 8, rotation: 0 }), rotation: parseFloat(e.target.value) || 0 } })}
              placeholder="Rot"
            />
          </div>
          <button 
            className={`${styles.input} ${styles.primaryButton}`}
            style={{ marginTop: '8px' }}
            onClick={autoPlaceDiodes}
          >
            ダイオードを自動配置
          </button>
        </div>

        <div className={styles.divider} />
        <div className={styles.group}>
          <label className={styles.label}>マトリックス設定</label>
          <button 
            className={`${styles.input} ${styles.primaryButton}`}
            onClick={autoAssignMatrix}
          >
            マトリックスを自動推論
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.group}>
          <button 
            className={styles.input}
            onClick={() => {
              const id = `mcu-${Date.now()}`;
              let side: 'left' | 'right' = 'left';
              
              if (data.type === 'split') {
                const hasLeft = (data.controllers || []).some(c => c.side === 'left');
                const hasRight = (data.controllers || []).some(c => c.side === 'right');
                if (hasLeft && !hasRight) side = 'right';
                else if (!hasLeft) side = 'left';
              }

              addController({
                id,
                type: 'pro_micro',
                x: 0,
                y: -60,
                rotation: 0,
                side,
                mountingSide: 'top'
              });
              selectController(id);
            }}
          >
            MCUを追加
          </button>
        </div>
        <div className={styles.group}>
          <button 
            className={styles.input}
            onClick={() => {
              const id = `battery-${Date.now()}`;
              let side: 'left' | 'right' = 'left';
              
              if (data.type === 'split') {
                const hasLeft = (data.batteries || []).some(b => b.side === 'left');
                const hasRight = (data.batteries || []).some(b => b.side === 'right');
                if (hasLeft && !hasRight) side = 'right';
                else if (!hasLeft) side = 'left';
              }

              addBattery({
                id,
                x: 0,
                y: 60,
                width: 30,
                height: 50,
                thickness: 4,
                rotation: 0,
                side,
                mountingSide: 'bottom'
              });
              selectBattery(id);
            }}
          >
            バッテリーを追加
          </button>
        </div>
        <div className={styles.group}>
          <button 
            className={styles.input}
            onClick={() => {
              const id = `hole-${Date.now()}`;
              let side: 'left' | 'right' = 'left';
              
              if (data.type === 'split') {
                const hasLeft = (data.mountingHoles || []).some(h => h.side === 'left');
                const hasRight = (data.mountingHoles || []).some(h => h.side === 'right');
                if (hasLeft && !hasRight) side = 'right';
                else if (!hasLeft) side = 'left';
              }

              addMountingHole({
                id,
                x: 0,
                y: 0,
                diameter: 3.2, // Default M3 screw hole
                side,
              });
              selectMountingHole(id);
            }}
          >
            マウント穴を追加
          </button>
        </div>
      </CollapsibleSection>

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
