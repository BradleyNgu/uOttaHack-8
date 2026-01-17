import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Fuel, 
  Target,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { NODES } from '../data/arcticData';

export default function Dashboard() {
  const {
    stats,
    assets,
    threats,
    totalFuelUsed,
    currentDay,
    budget,
    history,
    activeScenario,
  } = useGameStore();

  const avgResponseTime =
    stats.responseTime.length > 0
      ? stats.responseTime.reduce((a, b) => a + b, 0) / stats.responseTime.length
      : 0;

  const activeThreats = threats.filter((t) => !t.neutralized);
  const detectedThreats = threats.filter((t) => t.detected);

  // Calculate coverage
  const coveredNodes = new Set();
  assets.forEach((asset) => {
    coveredNodes.add(asset.position);
    asset.path?.forEach((nodeId) => coveredNodes.add(nodeId));
  });
  const coveragePercent = (coveredNodes.size / Object.keys(NODES).length) * 100;

  // Calculate efficiency score
  const efficiencyScore = Math.max(
    0,
    Math.min(
      100,
      (stats.threatsNeutralized * 20) +
        (coveragePercent * 0.5) -
        (totalFuelUsed / 10000) -
        (activeThreats.length * 10)
    )
  );

  const metrics = [
    {
      icon: Shield,
      label: 'Coverage',
      value: `${Math.round(coveragePercent)}%`,
      color: coveragePercent > 60 ? '#00ff88' : coveragePercent > 30 ? '#ffaa00' : '#ff3333',
    },
    {
      icon: AlertTriangle,
      label: 'Active Threats',
      value: activeThreats.length,
      color: activeThreats.length === 0 ? '#00ff88' : activeThreats.length < 3 ? '#ffaa00' : '#ff3333',
    },
    {
      icon: Target,
      label: 'Neutralized',
      value: stats.threatsNeutralized,
      color: '#00d4ff',
    },
    {
      icon: Clock,
      label: 'Avg Response',
      value: `${avgResponseTime.toFixed(1)}h`,
      color: avgResponseTime < 2 ? '#00ff88' : avgResponseTime < 5 ? '#ffaa00' : '#ff3333',
    },
    {
      icon: Fuel,
      label: 'Fuel Used',
      value: `${Math.round(totalFuelUsed / 1000)}K`,
      color: '#ffd700',
    },
    {
      icon: TrendingUp,
      label: 'Efficiency',
      value: `${Math.round(efficiencyScore)}`,
      color: efficiencyScore > 70 ? '#00ff88' : efficiencyScore > 40 ? '#ffaa00' : '#ff3333',
    },
  ];

  return (
    <div className="dashboard">
      <div className="panel-header">
        <h2>📊 STRATEGIC OVERVIEW</h2>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="metric-card"
          >
            <metric.icon size={20} style={{ color: metric.color }} />
            <span className="value" style={{ color: metric.color }}>
              {metric.value}
            </span>
            <span className="label">{metric.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="status-summary">
        <h3>Mission Status</h3>
        <div className="status-items">
          <div className="status-item">
            <span className="label">Day</span>
            <span className="value">{currentDay}</span>
          </div>
          <div className="status-item">
            <span className="label">Assets</span>
            <span className="value">{assets.length}</span>
          </div>
          <div className="status-item">
            <span className="label">Budget</span>
            <span className="value">${budget}M</span>
          </div>
          <div className="status-item">
            <span className="label">Scenario</span>
            <span className="value">{activeScenario.name}</span>
          </div>
        </div>
      </div>

      {/* Threat Log */}
      <div className="threat-log">
        <h3>⚠️ Threat Activity</h3>
        <div className="threat-list">
          {threats.length === 0 ? (
            <div className="no-threats">
              <Shield size={24} />
              <p>No threats detected</p>
            </div>
          ) : (
            threats.slice(-5).reverse().map((threat) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`threat-item ${threat.detected ? 'detected' : 'undetected'} ${threat.neutralized ? 'neutralized' : ''}`}
              >
                <span className="icon">{threat.type.icon}</span>
                <div className="info">
                  <span className="type">{threat.type.name}</span>
                  <span className="location">
                    <MapPin size={10} /> {NODES[threat.position]?.name}
                  </span>
                </div>
                <span className={`status ${threat.neutralized ? 'success' : threat.detected ? 'warning' : 'danger'}`}>
                  {threat.neutralized ? '✓ Neutralized' : threat.detected ? '👁️ Detected' : '❓ Unknown'}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Coverage Map Mini */}
      <div className="coverage-indicator">
        <h3>🗺️ Coverage Analysis</h3>
        <div className="coverage-bar">
          <div
            className="coverage-fill"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        <div className="coverage-details">
          <span>{coveredNodes.size} / {Object.keys(NODES).length} nodes covered</span>
          <span className="percent">{Math.round(coveragePercent)}%</span>
        </div>
        <div className="coverage-breakdown">
          {['port', 'resource', 'patrol'].map((type) => {
            const typeNodes = Object.entries(NODES).filter(([, n]) => n.type === type);
            const covered = typeNodes.filter(([id]) => coveredNodes.has(id)).length;
            return (
              <div key={type} className="breakdown-item">
                <span className="type">{type}s</span>
                <span className="ratio">{covered}/{typeNodes.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Efficiency */}
      <div className="efficiency-panel">
        <h3>⚡ Resource Efficiency</h3>
        <div className="efficiency-score">
          <svg viewBox="0 0 100 100" className="score-ring">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1a2744"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={efficiencyScore > 70 ? '#00ff88' : efficiencyScore > 40 ? '#ffaa00' : '#ff3333'}
              strokeWidth="8"
              strokeDasharray={`${(efficiencyScore / 100) * 283} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="55" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">
              {Math.round(efficiencyScore)}
            </text>
          </svg>
        </div>
        <div className="efficiency-tips">
          {coveragePercent < 50 && (
            <p className="tip">📍 Deploy more assets to increase coverage</p>
          )}
          {totalFuelUsed > 50000 && (
            <p className="tip">⛽ Consider shorter patrol routes to save fuel</p>
          )}
          {activeThreats.length > 2 && (
            <p className="tip">🚨 Multiple threats require immediate response</p>
          )}
          {assets.length === 0 && (
            <p className="tip">🚢 Deploy your first asset to begin operations</p>
          )}
        </div>
      </div>
    </div>
  );
}
