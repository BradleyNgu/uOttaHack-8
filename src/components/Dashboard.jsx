import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Fuel, 
  Target,
  TrendingUp,
  MapPin,
  Pickaxe,
  Ship,
  Anchor,
  Snowflake
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { NODES, EDGES } from '../data/arcticData';

export default function Dashboard() {
  const {
    stats,
    assets,
    threats,
    totalFuelUsed,
    currentDay,
    currentTime,
    budget,
    threatDamage,
    settings,
    isRunning,
    isPaused,
    resourcesMined,
    portsVisited,
    allPorts,
    clearedIce,
  } = useGameStore();
  
  // Check if all assets are idle (movement complete)
  const allMovementComplete = assets.length > 0 && assets.every(
    (asset) => asset.status === 'idle' || asset.status === 'stranded' || asset.status === 'refueling'
  );

  const avgResponseTime =
    stats.responseTime.length > 0
      ? stats.responseTime.reduce((a, b) => a + b, 0) / stats.responseTime.length
      : 0;

  const activeThreats = threats.filter((t) => !t.neutralized);
  const detectedThreats = threats.filter((t) => t.detected);
  
  // Calculate time remaining for threats
  const currentTotalTime = currentTime + (currentDay - 1) * 24;
  const getThreatTimeRemaining = (threat) => {
    const elapsed = currentTotalTime - threat.spawnTime;
    return Math.max(0, threat.timeLimit - elapsed);
  };

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
        <h2>STRATEGIC OVERVIEW</h2>
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
            <span className="value">${Math.round(budget)}M</span>
          </div>
          <div className="status-item">
            <span className="label">Damage</span>
            <span className="value" style={{ color: threatDamage > 0 ? '#ff3b3b' : 'inherit' }}>
              ${Math.round(threatDamage)}M
            </span>
          </div>
        </div>
      </div>

      {/* Threat Log */}
      <div className="threat-log">
        <h3>⚠️ Active Threats ({activeThreats.length})</h3>
        <div className="threat-list">
          {threats.length === 0 ? (
            <div className="no-threats">
              <Shield size={24} />
              <p>No threats detected</p>
              <p className="hint">Threats spawn randomly at patrol points</p>
            </div>
          ) : (
            threats.slice(-5).reverse().map((threat) => {
              const timeRemaining = getThreatTimeRemaining(threat);
              const isUrgent = timeRemaining < 3 && !threat.neutralized;
              
              return (
                <motion.div
                  key={threat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`threat-item ${threat.detected ? 'detected' : 'undetected'} ${threat.neutralized ? 'neutralized' : ''} ${isUrgent ? 'urgent' : ''}`}
                >
                  <span className="icon">{threat.type.icon}</span>
                  <div className="info">
                    <span className="type">{threat.type.name}</span>
                    <span className="location">
                      <MapPin size={10} /> {NODES[threat.position]?.name}
                    </span>
                  </div>
                  <div className="threat-meta">
                    {!threat.neutralized && threat.detected && (
                      <span className={`timer ${isUrgent ? 'urgent' : ''}`}>
                        ⏱️ {timeRemaining.toFixed(1)}h
                      </span>
                    )}
                    <span className={`status ${threat.neutralized ? 'success' : threat.detected ? 'warning' : 'danger'}`}>
                      {threat.neutralized ? '✓ Done' : threat.detected ? '👁️ Found' : '❓ Hidden'}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        {stats.threatsExpired > 0 && (
          <div className="threat-stats">
            <span className="expired">💀 {stats.threatsExpired} expired (-${Math.round(threatDamage)}M)</span>
            <span className="neutralized">✅ {stats.threatsNeutralized} neutralized</span>
          </div>
        )}
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

      {/* Mining Progress */}
      <div className="mining-progress">
        <h3><Pickaxe size={16} /> Resources Mined</h3>
        <div className="mining-resources">
          <div className="resource-row">
            <span className="icon">🛢️</span>
            <span className="name">Oil</span>
            <span className="amount">{resourcesMined.oil.toLocaleString()}</span>
          </div>
          <div className="resource-row">
            <span className="icon">💨</span>
            <span className="name">Gas</span>
            <span className="amount">{resourcesMined.gas.toLocaleString()}</span>
          </div>
          <div className="resource-row">
            <span className="icon">💎</span>
            <span className="name">Minerals</span>
            <span className="amount">{resourcesMined.minerals.toLocaleString()}</span>
          </div>
        </div>
        <p className="mining-tip">
          <Ship size={12} /> Deploy Mining Vessel to resource nodes
        </p>
      </div>

      {/* Trade Route Progress */}
      <div className="trade-progress">
        <h3><Anchor size={16} /> Trade Route ({portsVisited.length}/{allPorts.length})</h3>
        <div className="ports-progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(portsVisited.length / allPorts.length) * 100}%` }}
          />
        </div>
        <div className="ports-list">
          {allPorts.map((portId) => {
            const visited = portsVisited.includes(portId);
            return (
              <span 
                key={portId} 
                className={`port-badge ${visited ? 'visited' : ''}`}
                title={NODES[portId]?.name}
              >
                {visited ? '✓' : '○'} {NODES[portId]?.name}
              </span>
            );
          })}
        </div>
        {portsVisited.length === allPorts.length && (
          <div className="all-visited">🏆 All ports visited!</div>
        )}
        <p className="trade-tip">
          <Ship size={12} /> Deploy Civilian Cargo Ship to visit ports
        </p>
      </div>

      {/* Ice Clearing Status */}
      <div className="ice-status">
        <h3><Snowflake size={16} /> Ice Cleared Routes ({Object.keys(clearedIce || {}).length})</h3>
        {Object.keys(clearedIce || {}).length === 0 ? (
          <p className="no-ice-cleared">No routes cleared yet</p>
        ) : (
          <div className="cleared-routes">
            {Object.entries(clearedIce || {}).map(([edgeKey, data]) => {
              const [from, to] = edgeKey.split('-');
              const fromName = NODES[from]?.name || from;
              const toName = NODES[to]?.name || to;
              const daysRemaining = 7 - (currentDay - data.clearedOnDay);
              
              return (
                <div key={edgeKey} className="cleared-route">
                  <span className="route-name">
                    {fromName.substring(0, 10)} ↔ {toName.substring(0, 10)}
                  </span>
                  <span className="reform-timer">
                    🧊 {daysRemaining}d until reform
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="ice-tip">
          <Snowflake size={12} /> Deploy Icebreaker to clear frozen routes
        </p>
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
          {isPaused && allMovementComplete && assets.length > 0 && (
            <p className="tip success">✅ All assets arrived - simulation paused</p>
          )}
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
