import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Settings, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { WEATHER_CONDITIONS } from '../data/arcticData';

export default function ControlPanel() {
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  
  const {
    isRunning,
    isPaused,
    gameSpeed,
    currentTime,
    currentDay,
    budget,
    globalWeather,
    settings,
    threatDamage,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    resetGame,
    setGameSpeed,
    updateSettings,
  } = useGameStore();

  const formatTime = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2>🎮 COMMAND CENTER</h2>
      </div>

      {/* Instructions Section */}
      <div className="collapsible-section">
        <button 
          className="section-toggle"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <HelpCircle size={16} />
          <span>HOW TO PLAY</span>
          {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="instructions"
            >
              <div className="instruction-step">
                <span className="step-num">1</span>
                <span>Click a <strong>cyan port</strong> on the map</span>
              </div>
              <div className="instruction-step">
                <span className="step-num">2</span>
                <span>Deploy ships from Fleet Command (right panel)</span>
              </div>
              <div className="instruction-step">
                <span className="step-num">3</span>
                <span>Click <strong>START</strong> to begin simulation</span>
              </div>
              <div className="instruction-step">
                <span className="step-num">4</span>
                <span>Select an asset, then click a node to move it</span>
              </div>
              <div className="instruction-step">
                <span className="step-num">5</span>
                <span>Intercept <strong>⚠️ threats</strong> before they expire!</span>
              </div>
              <div className="instruction-tip">
                💡 <strong>Tip:</strong> Threats cost budget if not neutralized in time. Move assets to threat locations to neutralize them.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="time-display">
        <div className="day">DAY {currentDay}</div>
        <div className="time">{formatTime(currentTime)}</div>
        <div className="weather">
          {WEATHER_CONDITIONS[globalWeather]?.icon} {WEATHER_CONDITIONS[globalWeather]?.name}
        </div>
      </div>

      <div className="budget-display">
        <span className="label">BUDGET</span>
        <span className="value">${budget}M</span>
        {threatDamage > 0 && (
          <span className="damage">-${threatDamage}M lost</span>
        )}
      </div>

      <div className="game-controls">
        {!isRunning ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="control-btn start"
            onClick={startGame}
          >
            <Play size={20} /> START
          </motion.button>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
              onClick={isPaused ? resumeGame : pauseGame}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? 'RESUME' : 'PAUSE'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="control-btn stop"
              onClick={stopGame}
            >
              <Square size={18} /> STOP
            </motion.button>
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="control-btn reset"
          onClick={resetGame}
        >
          <RotateCcw size={18} /> RESET
        </motion.button>
      </div>

      <div className="speed-controls">
        <span className="label">SIMULATION SPEED</span>
        <div className="speed-buttons">
          {[0.5, 1, 2, 4].map((speed) => (
            <motion.button
              key={speed}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`speed-btn ${gameSpeed === speed ? 'active' : ''}`}
              onClick={() => setGameSpeed(speed)}
            >
              {speed}x
            </motion.button>
          ))}
        </div>
      </div>

      {/* Adjustable Settings */}
      <div className="collapsible-section">
        <button 
          className="section-toggle"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={16} />
          <span>SETTINGS</span>
          {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="settings-panel"
            >
              <div className="setting-item">
                <label>
                  <span>Starting Budget</span>
                  <span className="setting-value">${settings.budget}M</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={settings.budget}
                  onChange={(e) => updateSettings({ budget: parseInt(e.target.value) })}
                  disabled={isRunning}
                />
              </div>

              <div className="setting-item">
                <label>
                  <span>Threat Frequency</span>
                  <span className="setting-value">{Math.round(settings.threatFrequency * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.threatFrequency * 100}
                  onChange={(e) => updateSettings({ threatFrequency: parseInt(e.target.value) / 100 })}
                  disabled={isRunning}
                />
              </div>

              <div className="setting-item">
                <label>
                  <span>Weather Severity</span>
                  <span className="setting-value">{Math.round(settings.weatherSeverity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.weatherSeverity * 100}
                  onChange={(e) => updateSettings({ weatherSeverity: parseInt(e.target.value) / 100 })}
                  disabled={isRunning}
                />
              </div>

              <div className="setting-item">
                <label>
                  <span>Fuel Cost (per 1000 units)</span>
                  <span className="setting-value">${(settings.fuelCostPerUnit * 1000).toFixed(1)}M</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={settings.fuelCostPerUnit * 1000}
                  onChange={(e) => updateSettings({ fuelCostPerUnit: parseFloat(e.target.value) / 1000 })}
                  disabled={isRunning}
                />
                <span className="setting-hint">Cost scales with fuel needed</span>
              </div>

              <div className="setting-item checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.threatDamageEnabled}
                    onChange={(e) => updateSettings({ threatDamageEnabled: e.target.checked })}
                    disabled={isRunning}
                  />
                  <span>Threats damage budget when expired</span>
                </label>
              </div>

              {isRunning && (
                <p className="settings-note">⚠️ Stop simulation to change settings</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
