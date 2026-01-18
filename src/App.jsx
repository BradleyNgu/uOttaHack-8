import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ArcticMap from './components/ArcticMap';
import ControlPanel from './components/ControlPanel';
import AssetPanel from './components/AssetPanel';
import Dashboard from './components/Dashboard';
import GameOver from './components/GameOver';
import { useGameStore } from './store/gameStore';
import './App.css';
import logoImage from './assets/logo.png';

function App() {
  const { tick, isRunning, isPaused, gameSpeed, updateWeather, spawnThreat, currentDay } = useGameStore();

  // Game loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      tick();
    }, 100 / gameSpeed);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, gameSpeed, tick]);

  // Weather updates every game day
  useEffect(() => {
    if (isRunning && !isPaused) {
      updateWeather();
    }
  }, [currentDay, isRunning, isPaused, updateWeather]);

  // Spawn threats periodically
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      spawnThreat();
    }, 5000 / gameSpeed);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, gameSpeed, spawnThreat]);

  return (
    <div className="app">
      {/* Game Over Overlay */}
      <GameOver />

      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="logo">
          <span className="icon"><img src={logoImage} alt="Arctic Argus Logo" /></span>
          <div className="title">
            <h1>ARCTIC ARGUS</h1>
            <span className="subtitle">Canadian Arctic Patrol Simulator</span>
          </div>
        </div>
        <div className="header-info">
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Controls */}
        <motion.aside
          className="left-panel"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ControlPanel />
        </motion.aside>

        {/* Center - Map */}
        <motion.main
          className="center-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ArcticMap />
        </motion.main>

        {/* Right Panel - Assets & Dashboard */}
        <motion.aside
          className="right-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="right-panel-content">
            <AssetPanel />
            <Dashboard />
          </div>
        </motion.aside>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <span>uOttaHack 8</span>
        <span className={`status ${!isRunning ? 'stopped' : isPaused ? 'paused' : 'active'}`}>
          {!isRunning ? '⏹ SIMULATION STOPPED' : isPaused ? '⏸ SIMULATION PAUSED' : '▶ SIMULATION ACTIVE'}
        </span>
      </footer>
    </div>
  );
}

export default App;
