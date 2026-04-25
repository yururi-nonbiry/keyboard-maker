import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { KeyboardType, ControllerType } from '../../types';
import styles from './SettingsModalContent.module.css';

const CollapsibleSection: React.FC<{
  title: string;
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ title, id, isExpanded, onToggle, children }) => {
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
      </div>
      <div className={`${styles.sectionContent} ${!isExpanded ? styles.sectionContentCollapsed : ''}`}>
        {children}
      </div>
    </div>
  );
};

const SettingsModalContent: React.FC = () => {
  const { 
    data, 
    updateMetadata, 
    updateKeyboardType, 
    updateCaseConfig,
    updatePcbConfig,
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
    autoPlaceDiodes,
    addController,
    selectController,
    addBattery,
    selectBattery,
    addMountingHole,
    selectMountingHole,
    toggleSettingsModal,
    toolboxVisibleItems,
    toggleToolboxItem
  } = useKeyboardStore();

  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    project: true,
    display: true,
    case: true,
    pcb: true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const { typingAngle, tentingAngle, splitRotation } = data.case_config;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.column}>
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
            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showKeycaps} onChange={toggleKeycapsVisible} />
                キーキャップ
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showPlate} onChange={togglePlateVisible} />
                プレート
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showPCB} onChange={togglePCBVisible} />
                基板 (PCB)
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showCaseBase} onChange={toggleCaseBaseVisible} />
                ベース (Base)
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showCaseWalls} onChange={toggleCaseWallsVisible} />
                カバー (Cover)
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showSwitches} onChange={toggleSwitchesVisible} />
                スイッチ
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showTrackballs} onChange={toggleTrackballsVisible} />
                TB
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showControllers} onChange={toggleControllersVisible} />
                MCU
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showSockets} onChange={toggleSocketsVisible} />
                ソケット
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showDiodes} onChange={toggleDiodesVisible} />
                ダイオード
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} checked={showMatrix} onChange={toggleMatrixVisible} />
                配線
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            id="toolbox" 
            title="ツールボックス表示設定" 
            isExpanded={expandedSections.toolbox || false} 
            onToggle={toggleSection}
          >
            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={toolboxVisibleItems?.key ?? true} 
                  onChange={() => toggleToolboxItem('key')} 
                />
                キー (Key)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={toolboxVisibleItems?.trackball ?? true} 
                  onChange={() => toggleToolboxItem('trackball')} 
                />
                トラックボール (Trackball)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={toolboxVisibleItems?.mcu ?? true} 
                  onChange={() => toggleToolboxItem('mcu')} 
                />
                マイコン (MCU)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={toolboxVisibleItems?.battery ?? true} 
                  onChange={() => toggleToolboxItem('battery')} 
                />
                バッテリー (Battery)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={toolboxVisibleItems?.hole ?? true} 
                  onChange={() => toggleToolboxItem('hole')} 
                />
                マウント穴 (Mounting Hole)
              </label>
            </div>
          </CollapsibleSection>
        </div>

        <div className={styles.column}>
          <CollapsibleSection 
            id="case" 
            title="ケース設定" 
            isExpanded={expandedSections.case} 
            onToggle={toggleSection}
          >
            <div className={styles.group}>
              <label className={styles.label}>タイピング角: {typingAngle}°</label>
              <input
                type="range" min="0" max="15" step="0.5" className={styles.input}
                value={typingAngle}
                onChange={(e) => updateCaseConfig({ typingAngle: parseFloat(e.target.value) })}
              />
            </div>
            {data.type === 'split' && (
              <>
                <div className={styles.group}>
                  <label className={styles.label}>テント角: {tentingAngle}°</label>
                  <input
                    type="range" min="0" max="30" step="1" className={styles.input}
                    value={tentingAngle}
                    onChange={(e) => updateCaseConfig({ tentingAngle: parseFloat(e.target.value) })}
                  />
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>分割回転角: {splitRotation}°</label>
                  <input
                    type="range" min="0" max="45" step="1" className={styles.input}
                    value={splitRotation}
                    onChange={(e) => updateCaseConfig({ splitRotation: parseFloat(e.target.value) })}
                  />
                </div>
                <div className={styles.group}>
                  <label className={styles.label}>分割幅: {data.case_config.splitGap}mm</label>
                  <input
                    type="range" min="0" max="200" step="1" className={styles.input}
                    value={data.case_config.splitGap}
                    onChange={(e) => updateCaseConfig({ splitGap: parseFloat(e.target.value) })}
                  />
                </div>
              </>
            )}
            <div className={styles.group}>
              <label className={styles.label}>キーピッチ: {data.case_config.keyPitch}mm</label>
              <input
                type="number" step="0.01" className={styles.input}
                value={data.case_config.keyPitch}
                onChange={(e) => updateCaseConfig({ keyPitch: parseFloat(e.target.value) || 19.05 })}
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>デフォルトプロファイル</label>
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
          </CollapsibleSection>

          <CollapsibleSection 
            id="pcb" 
            title="PCB/マイコン設定" 
            isExpanded={expandedSections.pcb} 
            onToggle={toggleSection}
          >
            <div className={styles.group}>
              <label className={styles.label}>MCU</label>
              <select
                className={styles.input}
                value={data.pcb_config.controllerType}
                onChange={(e) => updatePcbConfig({ controllerType: e.target.value as ControllerType })}
              >
                <option value="pro_micro">Pro Micro</option>
                <option value="elite_c">Elite-C</option>
                <option value="xiao_rp2040">XIAO RP2040</option>
                <option value="pico">Pico</option>
              </select>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>ダイオード方向</label>
              <select
                className={styles.input}
                value={data.pcb_config.diodeDirection}
                onChange={(e) => updatePcbConfig({ diodeDirection: e.target.value as any })}
              >
                <option value="col2row">Col to Row</option>
                <option value="row2col">Row to Col</option>
              </select>
            </div>
            <div className={styles.buttonRow}>
              <button className={styles.button} onClick={autoPlaceDiodes}>ダイオード自動配置</button>
              <button className={styles.button} onClick={autoAssignMatrix}>マトリックス推論</button>
            </div>
            <div className={styles.divider} />
            <div className={styles.buttonGrid}>
              <button onClick={() => {
                const id = `mcu-${Date.now()}`;
                addController({ id, type: 'pro_micro', x: 0, y: -60, rotation: 0, side: 'left', mountingSide: 'top' });
                selectController(id);
                toggleSettingsModal(false);
              }}>MCU追加</button>
              <button onClick={() => {
                const id = `battery-${Date.now()}`;
                addBattery({ id, x: 0, y: 60, width: 30, height: 50, thickness: 4, rotation: 0, side: 'left', mountingSide: 'bottom' });
                selectBattery(id);
                toggleSettingsModal(false);
              }}>バッテリー追加</button>
              <button onClick={() => {
                const id = `hole-${Date.now()}`;
                addMountingHole({ id, x: 0, y: 0, diameter: 3.2, side: 'left' });
                selectMountingHole(id);
                toggleSettingsModal(false);
              }}>マウント穴追加</button>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};

export default SettingsModalContent;
