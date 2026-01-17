import { motion } from 'framer-motion';
import { 
  Trophy, 
  Skull, 
  Ship, 
  Pickaxe, 
  MapPin, 
  Shield, 
  Clock, 
  Fuel,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { NODES } from '../data/arcticData';

export default function GameOver() {
  const {
    isGameOver,
    stats,
    resourcesMined,
    portsVisited,
    allPorts,
    currentDay,
    totalFuelUsed,
    threatDamage,
    assets,
    resetGame,
  } = useGameStore();

  if (!isGameOver) return null;

  // Calculate final scores
  const portsVisitedCount = portsVisited.length;
  const totalPorts = allPorts.length;
  const allPortsVisited = portsVisitedCount === totalPorts;
  
  const totalResourcesMined = resourcesMined.oil + resourcesMined.gas + resourcesMined.minerals;
  
  // Calculate efficiency grade
  const calculateGrade = () => {
    let score = 0;
    
    // Threats neutralized (max 30 points)
    score += Math.min(30, stats.threatsNeutralized * 5);
    
    // Ports visited (max 25 points)
    score += (portsVisitedCount / totalPorts) * 25;
    
    // Resources mined (max 25 points)
    score += Math.min(25, totalResourcesMined / 5000);
    
    // Days survived (max 20 points)
    score += Math.min(20, currentDay * 2);
    
    // Penalties
    score -= stats.threatsExpired * 3;
    
    if (score >= 90) return { grade: 'S', color: '#ffd700' };
    if (score >= 75) return { grade: 'A', color: '#00ff88' };
    if (score >= 60) return { grade: 'B', color: '#00d4ff' };
    if (score >= 45) return { grade: 'C', color: '#ffaa00' };
    if (score >= 30) return { grade: 'D', color: '#ff9f43' };
    return { grade: 'F', color: '#ff3b3b' };
  };

  const gradeInfo = calculateGrade();

  const statItems = [
    { icon: Clock, label: 'Days Survived', value: currentDay, color: '#00d4ff' },
    { icon: Ship, label: 'Assets Deployed', value: assets.length, color: '#00ff88' },
    { icon: Shield, label: 'Threats Neutralized', value: stats.threatsNeutralized, color: '#00ff88' },
    { icon: AlertTriangle, label: 'Threats Expired', value: stats.threatsExpired, color: '#ff3b3b' },
    { icon: MapPin, label: 'Ports Visited', value: `${portsVisitedCount}/${totalPorts}`, color: allPortsVisited ? '#ffd700' : '#ffaa00' },
    { icon: Fuel, label: 'Total Fuel Used', value: `${Math.round(totalFuelUsed / 1000)}K`, color: '#ffaa00' },
  ];

  return (
    <motion.div 
      className="game-over-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="game-over-modal"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
      >
        {/* Header */}
        <div className="game-over-header">
          <Skull className="skull-icon" size={48} />
          <h1>MISSION FAILED</h1>
          <p className="subtitle">Budget Depleted - Operations Ceased</p>
        </div>

        {/* Grade */}
        <motion.div 
          className="grade-display"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <span className="grade" style={{ color: gradeInfo.color }}>
            {gradeInfo.grade}
          </span>
          <span className="grade-label">Mission Rating</span>
        </motion.div>

        {/* Stats Grid */}
        <div className="game-over-stats">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <stat.icon size={20} style={{ color: stat.color }} />
              <span className="label">{stat.label}</span>
              <span className="value" style={{ color: stat.color }}>{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Resources Mined */}
        <div className="resources-summary">
          <h3><Pickaxe size={18} /> Resources Extracted</h3>
          <div className="resource-bars">
            <div className="resource-item">
              <span className="name">🛢️ Oil</span>
              <div className="bar">
                <div className="fill oil" style={{ width: `${Math.min(100, resourcesMined.oil / 100)}%` }} />
              </div>
              <span className="amount">{resourcesMined.oil.toLocaleString()} units</span>
            </div>
            <div className="resource-item">
              <span className="name">💨 Gas</span>
              <div className="bar">
                <div className="fill gas" style={{ width: `${Math.min(100, resourcesMined.gas / 100)}%` }} />
              </div>
              <span className="amount">{resourcesMined.gas.toLocaleString()} units</span>
            </div>
            <div className="resource-item">
              <span className="name">💎 Minerals</span>
              <div className="bar">
                <div className="fill minerals" style={{ width: `${Math.min(100, resourcesMined.minerals / 100)}%` }} />
              </div>
              <span className="amount">{resourcesMined.minerals.toLocaleString()} units</span>
            </div>
          </div>
        </div>

        {/* Ports Visited */}
        <div className="ports-summary">
          <h3><MapPin size={18} /> Trade Route Coverage</h3>
          <div className="ports-grid">
            {allPorts.map((portId) => {
              const visited = portsVisited.includes(portId);
              return (
                <div 
                  key={portId} 
                  className={`port-chip ${visited ? 'visited' : 'unvisited'}`}
                >
                  {visited ? '✓' : '○'} {NODES[portId]?.name}
                </div>
              );
            })}
          </div>
          {allPortsVisited && (
            <motion.div 
              className="all-ports-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Trophy size={20} /> ALL PORTS VISITED!
            </motion.div>
          )}
        </div>

        {/* Threat Damage */}
        {threatDamage > 0 && (
          <div className="damage-summary">
            <span className="damage-icon">💀</span>
            <span className="damage-text">
              ${Math.round(threatDamage)}M lost to unhandled threats
            </span>
          </div>
        )}

        {/* Restart Button */}
        <motion.button
          className="restart-btn"
          onClick={resetGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={20} />
          NEW MISSION
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
