import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import type { SwitchType, KeyboardType, ControllerType } from '../../types';
import styles from './Sidebar.module.css';

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
    addController
  } = useKeyboardStore();
  const selectedKey = data.layout.find(k => k.id === selectedKeyId);
  const selectedTrackball = (data.trackballs || []).find(t => t.id === selectedTrackballId);
  const selectedController = (data.controllers || []).find(c => c.id === selectedControllerId);
  const { typingAngle, tentingAngle, splitRotation } = data.case_config;

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
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>ケース設定</h3>
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
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>PCB/コントローラー設定</h3>
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
        <div className={styles.group}>
          <button 
            className={styles.input}
            onClick={() => {
              const id = `mcu-${Date.now()}`;
              addController({
                id,
                type: 'pro_micro',
                x: 0,
                y: -60,
                rotation: 0,
                side: 'left',
                mountingSide: 'top'
              });
              selectController(id);
            }}
          >
            MCUを追加
          </button>
        </div>
      </div>

      {selectedKey ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>キー設定</h3>
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
      ) : selectedTrackball ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>トラックボール設定</h3>
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
          <div style={{ marginTop: 'auto' }}>
            <button 
              className={styles.input} 
              style={{ width: '100%', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
              onClick={() => removeTrackball(selectedTrackball.id)}
            >
              トラックボールを削除
            </button>
          </div>
        </div>
      ) : selectedController ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>MCU設定</h3>
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
        </div>
      ) : (
        <div className={styles.section}>
          <p className={styles.label}>編集する項目を選択してください。</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
