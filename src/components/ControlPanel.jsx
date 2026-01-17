import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Zap } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SCENARIOS, WEATHER_CONDITIONS } from '../data/arcticData';

export default function ControlPanel() {
  const {
    isRunning,
    isPaused,
    gameSpeed,
    currentTime,
    currentDay,
    budget,
    globalWeather,
    activeScenario,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    resetGame,
    setGameSpeed,
    setScenario,
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
        <span className="label">SPEED</span>
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

      <div className="scenario-select">
        <span className="label">SCENARIO</span>
        <div className="scenarios">
          {Object.values(SCENARIOS).map((scenario) => (
            <motion.button
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`scenario-btn ${activeScenario.id === scenario.id ? 'active' : ''}`}
              onClick={() => setScenario(scenario.id)}
              disabled={isRunning}
            >
              <span className="name">{scenario.name}</span>
              <span className="threat">
                Threat: {'🔴'.repeat(Math.ceil(scenario.threatFrequency * 5))}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="scenario-info">
        <h4>{activeScenario.name}</h4>
        <p>{activeScenario.description}</p>
        <div className="stats">
          <span>Initial Budget: ${activeScenario.initialBudget}M</span>
          <span>Weather: {Math.round(activeScenario.weatherSeverity * 100)}% severity</span>
        </div>
      </div>
    </div>
  );
}
