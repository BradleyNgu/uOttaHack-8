import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { NODES, EDGES, WEATHER_CONDITIONS } from '../data/arcticData';

const NODE_COLORS = {
  port: '#00d4ff',
  resource: '#ffd700',
  patrol: '#ff6b6b',
};

const NODE_SIZES = {
  port: 16,
  resource: 14,
  patrol: 12,
};

export default function ArcticMap() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const {
    assets,
    selectedAssetId,
    selectedNodeId,
    selectNode,
    selectAsset,
    moveAsset,
    weather,
    threats,
    isRunning,
  } = useGameStore();

  // Convert screen coordinates to SVG viewBox coordinates
  const screenToSVG = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;  // viewBox width / actual width
    const scaleY = 550 / rect.height; // viewBox height / actual height
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (selectedAssetId) {
      moveAsset(selectedAssetId, nodeId);
      // Deselect asset after giving move command so user can select another
      selectAsset(null);
    } else {
      selectNode(nodeId);
    }
  };

  const handleAssetClick = (e, assetId) => {
    e.stopPropagation();
    selectAsset(assetId);
  };

  const handleBackgroundClick = (e) => {
    // Only deselect if clicking on background, not on nodes/assets
    if (e.target.tagName === 'rect' || e.target.tagName === 'svg') {
      selectNode(null);
      selectAsset(null);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = screenToSVG(e);
    
    // Get position relative to container for tooltip
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setMousePos({ 
        x: e.clientX - containerRect.left, 
        y: e.clientY - containerRect.top 
      });
    }

    // Check for hovered node
    for (const [nodeId, node] of Object.entries(NODES)) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist < NODE_SIZES[node.type] + 15) {
        setHoveredNode(nodeId);
        return;
      }
    }
    setHoveredNode(null);
  };

  return (
    <div className="arctic-map-container" ref={containerRef}>
      <svg
        ref={svgRef}
        className="arctic-map"
        viewBox="0 0 800 550"
        onClick={handleBackgroundClick}
        onMouseMove={handleMouseMove}
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="50%" stopColor="#0d2847" />
            <stop offset="100%" stopColor="#1a4a6e" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean background */}
        <rect width="800" height="550" fill="url(#oceanGradient)" />

        {/* Ice/land masses (decorative) */}
        <ellipse cx="150" cy="100" rx="120" ry="60" fill="#1e3a5f" opacity="0.5" />
        <ellipse cx="450" cy="80" rx="180" ry="50" fill="#1e3a5f" opacity="0.5" />
        <ellipse cx="700" cy="150" rx="100" ry="80" fill="#1e3a5f" opacity="0.5" />
        <ellipse cx="600" cy="350" rx="150" ry="100" fill="#1e3a5f" opacity="0.4" />

        {/* Grid lines */}
        {[100, 200, 300, 400, 500].map((y) => (
          <line
            key={`h-${y}`}
            x1="0"
            y1={y}
            x2="800"
            y2={y}
            stroke="#1e4a6e"
            strokeWidth="0.5"
            strokeDasharray="5,5"
            opacity="0.3"
          />
        ))}
        {[100, 200, 300, 400, 500, 600, 700].map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="550"
            stroke="#1e4a6e"
            strokeWidth="0.5"
            strokeDasharray="5,5"
            opacity="0.3"
          />
        ))}

        {/* Edges (routes) */}
        {EDGES.map((edge, i) => {
          const fromNode = NODES[edge.from];
          const toNode = NODES[edge.to];
          if (!fromNode || !toNode) return null;

          const iceColor = `rgba(100, 200, 255, ${edge.iceRisk * 0.5})`;

          return (
            <g key={i}>
              {/* Ice risk indicator */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={iceColor}
                strokeWidth="8"
                opacity="0.3"
              />
              {/* Route line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#3a7ca5"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.7"
              />
              {/* Distance label */}
              <text
                x={(fromNode.x + toNode.x) / 2}
                y={(fromNode.y + toNode.y) / 2 - 5}
                fill="#6bb8d9"
                fontSize="9"
                textAnchor="middle"
                opacity="0.7"
              >
                {edge.distance}nm
              </text>
            </g>
          );
        })}

        {/* Asset paths */}
        {assets.map((asset) => {
          if (!asset.path || asset.path.length < 2) return null;

          const pathD = asset.path
            .map((nodeId, i) => {
              const node = NODES[nodeId];
              return `${i === 0 ? 'M' : 'L'} ${node.x} ${node.y}`;
            })
            .join(' ');

          return (
            <path
              key={`path-${asset.id}`}
              d={pathD}
              fill="none"
              stroke="#00ff88"
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.6"
              filter="url(#glow)"
            />
          );
        })}

        {/* Nodes */}
        {Object.entries(NODES).map(([nodeId, node]) => {
          const isSelected = selectedNodeId === nodeId;
          const isHovered = hoveredNode === nodeId;
          const size = NODE_SIZES[node.type];
          const color = NODE_COLORS[node.type];
          const weatherIcon = WEATHER_CONDITIONS[weather[nodeId]]?.icon || '☀️';

          return (
            <g 
              key={nodeId} 
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleNodeClick(e, nodeId)}
            >
              {/* Larger invisible hitbox for easier clicking */}
              <circle
                cx={node.x}
                cy={node.y}
                r={size + 15}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />

              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 8}
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="3"
                  className="pulse-ring"
                  pointerEvents="none"
                />
              )}

              {/* Hover ring */}
              {isHovered && !isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.7"
                  pointerEvents="none"
                />
              )}

              {/* Node glow */}
              <circle
                cx={node.x}
                cy={node.y}
                r={size + 4}
                fill={color}
                opacity="0.2"
                filter="url(#glow)"
                pointerEvents="none"
              />

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={size}
                fill={color}
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#glow)"
                pointerEvents="none"
              />

              {/* Node icon based on type */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize="12"
                fill="#000"
                pointerEvents="none"
              >
                {node.type === 'port' ? '⚓' : node.type === 'resource' ? '⛏️' : '📡'}
              </text>

              {/* Node label */}
              <text
                x={node.x}
                y={node.y + size + 16}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                className="node-label"
                pointerEvents="none"
              >
                {node.name}
              </text>

              {/* Weather indicator */}
              <text
                x={node.x - size - 8}
                y={node.y - size - 4}
                fontSize="14"
                pointerEvents="none"
              >
                {weatherIcon}
              </text>
            </g>
          );
        })}

        {/* Threats */}
        {threats
          .filter((t) => t.detected)
          .map((threat) => {
            const node = NODES[threat.position];
            if (!node) return null;

            return (
              <g key={threat.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="25"
                  fill="none"
                  stroke="#ff0000"
                  strokeWidth="3"
                  className="threat-pulse"
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize="20"
                >
                  {threat.type.icon}
                </text>
              </g>
            );
          })}

        {/* Assets */}
        {assets.map((asset, index) => {
          const node = NODES[asset.position];
          if (!node) return null;

          // Calculate interpolated position if moving
          let assetX = node.x;
          let assetY = node.y;

          if (asset.status === 'moving' || asset.status === 'patrolling' || asset.status === 'intercepting') {
            const nextNodeId = asset.path[asset.pathIndex + 1];
            if (nextNodeId) {
              const nextNode = NODES[nextNodeId];
              assetX = node.x + (nextNode.x - node.x) * asset.progress;
              assetY = node.y + (nextNode.y - node.y) * asset.progress;
            }
          } else {
            // Offset idle assets at the same node so they don't overlap
            const assetsAtSameNode = assets.filter(a => 
              a.position === asset.position && 
              (a.status === 'idle' || a.status === 'stranded' || a.status === 'refueling')
            );
            const assetIndexAtNode = assetsAtSameNode.findIndex(a => a.id === asset.id);
            
            if (assetsAtSameNode.length > 1 && assetIndexAtNode >= 0) {
              // Spread assets in a circle around the node
              const angle = (assetIndexAtNode / assetsAtSameNode.length) * 2 * Math.PI - Math.PI / 2;
              const offsetRadius = 25 + (assetsAtSameNode.length > 3 ? 10 : 0);
              assetX = node.x + Math.cos(angle) * offsetRadius;
              assetY = node.y + Math.sin(angle) * offsetRadius;
            }
          }

          const isSelected = selectedAssetId === asset.id;
          const fuelPercent = (asset.currentFuel / asset.maxFuel) * 100;

          return (
            <g 
              key={asset.id} 
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleAssetClick(e, asset.id)}
            >
              {/* Larger invisible hitbox for easier clicking */}
              <circle
                cx={assetX}
                cy={assetY}
                r="18"
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />

              {/* Selection indicator */}
              {isSelected && (
                <circle
                  cx={assetX}
                  cy={assetY}
                  r="22"
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="3"
                  className="pulse-ring"
                  pointerEvents="none"
                />
              )}

              {/* Asset circle */}
              <circle
                cx={assetX}
                cy={assetY}
                r="15"
                fill="#1a1a2e"
                stroke={isSelected ? '#00ff88' : '#4a9eff'}
                strokeWidth="2"
                pointerEvents="none"
              />

              {/* Asset icon */}
              <text
                x={assetX}
                y={assetY + 5}
                textAnchor="middle"
                fontSize="16"
                pointerEvents="none"
              >
                {asset.icon}
              </text>

              {/* Fuel bar */}
              <rect
                x={assetX - 12}
                y={assetY + 18}
                width="24"
                height="4"
                fill="#333"
                rx="2"
                pointerEvents="none"
              />
              <rect
                x={assetX - 12}
                y={assetY + 18}
                width={(24 * fuelPercent) / 100}
                height="4"
                fill={fuelPercent > 30 ? '#00ff88' : fuelPercent > 15 ? '#ffaa00' : '#ff3333'}
                rx="2"
                pointerEvents="none"
              />

              {/* Status indicator */}
              {asset.status !== 'idle' && (
                <text
                  x={assetX}
                  y={assetY - 18}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#aaa"
                  className="status-text"
                  pointerEvents="none"
                >
                  {asset.status.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Map title */}
        <text x="400" y="30" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
          CANADIAN ARCTIC OPERATIONS
        </text>
        <text x="400" y="48" textAnchor="middle" fill="#6bb8d9" fontSize="11">
          Northwest Passage Strategic Overview
        </text>
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            className="map-tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              left: mousePos.x + 15,
              top: mousePos.y + 15,
            }}
          >
            <h4>{NODES[hoveredNode].name}</h4>
            <p className="type">{NODES[hoveredNode].type.toUpperCase()}</p>
            <p>{NODES[hoveredNode].description}</p>
            <p className="strategic">
              Strategic Value: {'★'.repeat(Math.floor(NODES[hoveredNode].strategicValue / 2))}
            </p>
            {NODES[hoveredNode].canRefuel && (
              <p className="refuel">⛽ Refueling Available</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="map-legend">
        <h4>LEGEND</h4>
        <div className="legend-item">
          <span className="dot" style={{ background: NODE_COLORS.port }} />
          <span>Ports</span>
        </div>
        <div className="legend-item">
          <span className="dot" style={{ background: NODE_COLORS.resource }} />
          <span>Resources</span>
        </div>
        <div className="legend-item">
          <span className="dot" style={{ background: NODE_COLORS.patrol }} />
          <span>Patrol Points</span>
        </div>
        <div className="legend-item">
          <span className="ice-line" />
          <span>Ice Risk</span>
        </div>
      </div>
    </div>
  );
}
