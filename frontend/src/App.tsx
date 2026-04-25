import Sidebar from './components/Sidebar/Sidebar';
import Toolbar from './components/Toolbar/Toolbar';
import KeyboardCanvas from './components/EditorCanvas/KeyboardCanvas';
import Keyboard2D from './components/EditorCanvas/Keyboard2D';
import { useKeyboardStore } from './store/useKeyboardStore';
import Modal from './components/Modal/Modal';
import SettingsModalContent from './components/Modal/SettingsModalContent';
import styles from './App.module.css';

function App() {
  const { viewMode, settingsModalOpen, toggleSettingsModal } = useKeyboardStore();

  return (
    <div className={styles.container}>
      <header className={styles.toolbar}>
        <Toolbar />
      </header>
      
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      
      <main className={styles.canvas}>
        {viewMode === '3D' ? <KeyboardCanvas /> : <Keyboard2D />}
        <div className={styles.overlay}>
          <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {viewMode === '3D' ? 'パースビュー' : '2Dブループリント'}
            </span>
          </div>
        </div>
      </main>

      <Modal 
        isOpen={settingsModalOpen} 
        onClose={() => toggleSettingsModal(false)} 
        title="詳細設定"
      >
        <SettingsModalContent />
      </Modal>
    </div>
  );
}

export default App;
