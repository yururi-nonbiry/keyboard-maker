import { useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Toolbar from './components/Toolbar/Toolbar';
import KeyboardCanvas from './components/EditorCanvas/KeyboardCanvas';
import Keyboard2D from './components/EditorCanvas/Keyboard2D';
import { useKeyboardStore } from './store/useKeyboardStore';
import Modal from './components/Modal/Modal';
import SettingsModalContent from './components/Modal/SettingsModalContent';
import ExportModal from './components/Modal/ExportModal';
import styles from './App.module.css';

function App() {
  const { viewMode, settingsModalOpen, toggleSettingsModal, undo, redo } = useKeyboardStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger undo/redo if the user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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

      <ExportModal />
    </div>
  );
}

export default App;
