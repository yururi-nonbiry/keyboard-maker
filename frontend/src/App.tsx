import Sidebar from './components/Sidebar/Sidebar';
import Toolbar from './components/Toolbar/Toolbar';
import KeyboardCanvas from './components/EditorCanvas/KeyboardCanvas';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.container}>
      <header className={styles.toolbar}>
        <Toolbar />
      </header>
      
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      
      <main className={styles.canvas}>
        <KeyboardCanvas />
        <div className={styles.overlay}>
          <div className="glass" style={{ padding: '12px 20px', borderRadius: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Perspective View
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
