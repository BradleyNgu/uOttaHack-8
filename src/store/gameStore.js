import { create } from 'zustand';
import { NODES, EDGES, ASSET_TYPES, WEATHER_CONDITIONS, THREAT_TYPES } from '../data/arcticData';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Find path between nodes (simple BFS)
const findPath = (fromId, toId) => {
  if (fromId === toId) return [fromId];
  
  const visited = new Set();
  const queue = [[fromId]];
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    if (current === toId) return path;
    
    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = EDGES
        .filter((e) => e.from === current || e.to === current)
        .map((e) => (e.from === current ? e.to : e.from));
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([...path, neighbor]);
        }
      }
    }
  }
  
  return null;
};

// Default settings
const DEFAULT_SETTINGS = {
  budget: 400,
  threatFrequency: 0.3, // 0-1
  weatherSeverity: 0.3, // 0-1
  refuelCost: 5, // cost per refuel
  threatDamageEnabled: true,
};

const initialState = {
  // Game state
  isRunning: false,
  isPaused: false,
  gameSpeed: 1,
  currentTime: 0, // in hours
  currentDay: 1,
  
  // Adjustable Settings
  settings: { ...DEFAULT_SETTINGS },
  
  // Resources
  budget: DEFAULT_SETTINGS.budget,
  totalFuelUsed: 0,
  threatDamage: 0, // total damage from unhandled threats
  
  // Assets
  assets: [],
  selectedAssetId: null,
  
  // Map state
  nodes: NODES,
  edges: EDGES,
  selectedNodeId: null,
  
  // Weather (per region/node)
  weather: Object.keys(NODES).reduce((acc, nodeId) => {
    acc[nodeId] = 'clear';
    return acc;
  }, {}),
  globalWeather: 'clear',
  
  // Threats
  threats: [],
  detectedThreats: [],
  
  // Patrol routes
  patrolRoutes: [],
  
  // Statistics
  stats: {
    threatsDetected: 0,
    threatsNeutralized: 0,
    threatsExpired: 0,
    totalDistance: 0,
    coverage: 0,
    responseTime: [],
    missionSuccess: 0,
  },
  
  // History for analytics
  history: [],
};

export const useGameStore = create((set, get) => ({
  ...initialState,
  
  // Settings management
  updateSettings: (newSettings) => {
    const state = get();
    const updatedSettings = { ...state.settings, ...newSettings };
    set({
      settings: updatedSettings,
      budget: state.isRunning ? state.budget : updatedSettings.budget,
    });
  },
  
  // Game controls
  startGame: () => {
    const state = get();
    set({ 
      isRunning: true, 
      isPaused: false,
      budget: state.settings.budget,
    });
  },
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  stopGame: () => set({ isRunning: false, isPaused: false }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  
  resetGame: () => {
    const state = get();
    set({
      ...initialState,
      settings: state.settings,
      budget: state.settings.budget,
    });
  },
  
  // Asset management
  addAsset: (assetTypeId, nodeId) => {
    const assetType = ASSET_TYPES[assetTypeId];
    const state = get();
    
    if (!assetType || state.budget < assetType.cost) return false;
    
    const newAsset = {
      id: generateId(),
      typeId: assetTypeId,
      ...assetType,
      currentFuel: assetType.maxFuel,
      currentPayload: assetType.payload,
      position: nodeId,
      targetPosition: null,
      path: [],
      pathIndex: 0,
      status: 'idle', // idle, moving, patrolling, refueling, intercepting
      patrolRoute: null,
      progress: 0, // 0-1 progress between nodes
      interceptingThreat: null,
    };
    
    set({
      assets: [...state.assets, newAsset],
      budget: state.budget - assetType.cost,
    });
    
    return true;
  },
  
  removeAsset: (assetId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    if (asset) {
      set({
        assets: state.assets.filter((a) => a.id !== assetId),
        budget: state.budget + Math.floor(ASSET_TYPES[asset.typeId].cost * 0.5),
      });
    }
  },
  
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  
  moveAsset: (assetId, targetNodeId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    
    if (!asset) return;
    
    const path = findPath(asset.position, targetNodeId);
    if (!path) return;
    
    set({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              targetPosition: targetNodeId,
              path: path,
              pathIndex: 0,
              status: 'moving',
              progress: 0,
              interceptingThreat: null,
            }
          : a
      ),
    });
  },
  
  // Intercept a threat - send asset to threat location
  interceptThreat: (assetId, threatId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    const threat = state.threats.find((t) => t.id === threatId);
    
    if (!asset || !threat) return;
    
    const path = findPath(asset.position, threat.position);
    if (!path) return;
    
    set({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              targetPosition: threat.position,
              path: path,
              pathIndex: 0,
              status: 'intercepting',
              progress: 0,
              interceptingThreat: threatId,
            }
          : a
      ),
    });
  },
  
  setPatrolRoute: (assetId, routeNodeIds) => {
    const state = get();
    set({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              patrolRoute: routeNodeIds,
              status: 'patrolling',
              path: routeNodeIds,
              pathIndex: 0,
            }
          : a
      ),
    });
  },
  
  // Refueling now costs budget
  refuelAsset: (assetId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    const node = NODES[asset?.position];
    
    if (!asset || !node?.canRefuel) return;
    
    // Check if can afford refuel
    const refuelCost = state.settings.refuelCost;
    if (state.budget < refuelCost) return;
    
    set({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? { ...a, currentFuel: ASSET_TYPES[a.typeId].maxFuel, status: 'refueling' }
          : a
      ),
      budget: state.budget - refuelCost,
    });
    
    setTimeout(() => {
      set({
        assets: get().assets.map((a) =>
          a.id === assetId ? { ...a, status: 'idle' } : a
        ),
      });
    }, 2000 / get().gameSpeed);
  },
  
  // Node selection
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  
  // Weather
  updateWeather: () => {
    const state = get();
    const weatherTypes = Object.keys(WEATHER_CONDITIONS);
    const severity = state.settings.weatherSeverity;
    
    const newWeather = {};
    Object.keys(NODES).forEach((nodeId) => {
      const random = Math.random();
      if (random < severity * 0.3) {
        newWeather[nodeId] = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      } else {
        newWeather[nodeId] = state.weather[nodeId];
      }
    });
    
    // Determine global weather (most common)
    const counts = {};
    Object.values(newWeather).forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });
    const globalWeather = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    
    set({ weather: newWeather, globalWeather });
  },
  
  // Threats
  spawnThreat: () => {
    const state = get();
    const threatTypes = Object.values(THREAT_TYPES);
    const nodeIds = Object.keys(NODES).filter((id) => NODES[id].type === 'patrol');
    
    if (Math.random() > state.settings.threatFrequency) return;
    
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    
    const threat = {
      id: generateId(),
      type: threatType,
      position: nodeIds[Math.floor(Math.random() * nodeIds.length)],
      spawnTime: state.currentTime + (state.currentDay - 1) * 24,
      detected: false,
      neutralized: false,
      timeLimit: threatType.timeLimit || 10, // hours until it causes damage
    };
    
    set({ threats: [...state.threats, threat] });
  },
  
  detectThreat: (threatId) => {
    const state = get();
    set({
      threats: state.threats.map((t) =>
        t.id === threatId ? { ...t, detected: true } : t
      ),
      detectedThreats: [...state.detectedThreats, threatId],
      stats: {
        ...state.stats,
        threatsDetected: state.stats.threatsDetected + 1,
      },
    });
  },
  
  neutralizeThreat: (threatId) => {
    const state = get();
    const threat = state.threats.find((t) => t.id === threatId);
    
    if (!threat) return;
    
    const currentTotalTime = state.currentTime + (state.currentDay - 1) * 24;
    const responseTime = currentTotalTime - threat.spawnTime;
    
    set({
      threats: state.threats.filter((t) => t.id !== threatId),
      stats: {
        ...state.stats,
        threatsNeutralized: state.stats.threatsNeutralized + 1,
        responseTime: [...state.stats.responseTime, responseTime],
      },
    });
  },
  
  // Game tick
  tick: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    
    const deltaTime = 0.1 * state.gameSpeed; // hours
    let newTime = state.currentTime + deltaTime;
    let newDay = state.currentDay;
    
    if (newTime >= 24) {
      newTime = 0;
      newDay += 1;
    }
    
    const currentTotalTime = newTime + (newDay - 1) * 24;
    
    // Update assets
    const updatedAssets = state.assets.map((asset) => {
      if (asset.status === 'moving' || asset.status === 'patrolling' || asset.status === 'intercepting') {
        if (asset.path.length <= 1) return { ...asset, status: 'idle' };
        
        const currentNode = asset.path[asset.pathIndex];
        const nextNode = asset.path[asset.pathIndex + 1];
        
        if (!nextNode) {
          if (asset.status === 'patrolling' && asset.patrolRoute) {
            return { ...asset, pathIndex: 0, progress: 0 };
          }
          return { ...asset, status: 'idle', path: [], pathIndex: 0, interceptingThreat: null };
        }
        
        const edge = EDGES.find(
          (e) =>
            (e.from === currentNode && e.to === nextNode) ||
            (e.from === nextNode && e.to === currentNode)
        );
        
        if (!edge) return asset;
        
        // Calculate speed with weather modifier
        const weatherCondition = WEATHER_CONDITIONS[state.weather[currentNode]];
        const effectiveSpeed = asset.speed * weatherCondition.speedModifier;
        
        // Check ice capability
        if (edge.iceRisk > asset.iceCapability && asset.typeId !== 'aircraft') {
          return asset; // Can't traverse this edge
        }
        
        // Calculate progress
        const distancePerTick = (effectiveSpeed * deltaTime) / edge.distance;
        let newProgress = asset.progress + distancePerTick;
        
        // Fuel consumption
        const fuelUsed = asset.fuelConsumption * distancePerTick * edge.distance;
        const newFuel = Math.max(0, asset.currentFuel - fuelUsed);
        
        if (newFuel <= 0) {
          return { ...asset, status: 'stranded', currentFuel: 0 };
        }
        
        if (newProgress >= 1) {
          // Arrived at next node
          return {
            ...asset,
            position: nextNode,
            pathIndex: asset.pathIndex + 1,
            progress: 0,
            currentFuel: newFuel,
          };
        }
        
        return { ...asset, progress: newProgress, currentFuel: newFuel };
      }
      return asset;
    });
    
    // Check for threat detection and neutralization
    let threatsToRemove = [];
    let newThreatDamage = 0;
    let threatsExpired = 0;
    
    const threats = state.threats.map((threat) => {
      // Check if threat expired (time limit reached)
      const timeElapsed = currentTotalTime - threat.spawnTime;
      if (timeElapsed >= threat.timeLimit && !threat.neutralized) {
        // Threat expired - causes damage!
        if (state.settings.threatDamageEnabled) {
          newThreatDamage += threat.type.damage || 5;
        }
        threatsToRemove.push(threat.id);
        threatsExpired++;
        return threat;
      }
      
      // Check if an asset is at threat location to neutralize
      for (const asset of updatedAssets) {
        if (asset.position === threat.position) {
          // Asset at threat location - neutralize it!
          if (asset.status === 'intercepting' && asset.interceptingThreat === threat.id) {
            threatsToRemove.push(threat.id);
            return { ...threat, neutralized: true };
          }
          // Any asset at location can neutralize detected threats
          if (threat.detected) {
            threatsToRemove.push(threat.id);
            return { ...threat, neutralized: true };
          }
        }
      }
      
      // Check for detection
      if (threat.detected) return threat;
      
      for (const asset of updatedAssets) {
        if (asset.position === threat.position || asset.path?.includes(threat.position)) {
          const weatherCondition = WEATHER_CONDITIONS[state.weather[threat.position]];
          const effectiveDetection = asset.detectionRange * weatherCondition.detectionModifier;
          
          if (Math.random() < effectiveDetection / 100) {
            return { ...threat, detected: true };
          }
        }
      }
      return threat;
    });
    
    // Filter out neutralized/expired threats
    const remainingThreats = threats.filter((t) => !threatsToRemove.includes(t.id));
    const neutralizedCount = threatsToRemove.length - threatsExpired;
    
    // Update assets that completed interception
    const finalAssets = updatedAssets.map((asset) => {
      if (asset.interceptingThreat && threatsToRemove.includes(asset.interceptingThreat)) {
        return { ...asset, status: 'idle', interceptingThreat: null, path: [], pathIndex: 0 };
      }
      return asset;
    });
    
    // Calculate coverage
    const coveredNodes = new Set();
    finalAssets.forEach((asset) => {
      coveredNodes.add(asset.position);
      asset.path?.forEach((nodeId) => coveredNodes.add(nodeId));
    });
    const coverage = (coveredNodes.size / Object.keys(NODES).length) * 100;
    
    // Record history
    const historyEntry = {
      time: newTime,
      day: newDay,
      assets: finalAssets.length,
      threats: remainingThreats.filter((t) => !t.neutralized).length,
      coverage,
    };
    
    // Check if all assets have finished moving
    const allAssetsIdle = finalAssets.length > 0 && finalAssets.every(
      (asset) => asset.status === 'idle' || asset.status === 'stranded' || asset.status === 'refueling'
    );
    
    // Auto-pause when all movement is complete
    const shouldPause = allAssetsIdle && state.assets.some(
      (asset) => asset.status === 'moving' || asset.status === 'patrolling' || asset.status === 'intercepting'
    );
    
    // Apply threat damage to budget
    const newBudget = Math.max(0, state.budget - newThreatDamage);
    
    set({
      currentTime: newTime,
      currentDay: newDay,
      assets: finalAssets,
      threats: remainingThreats,
      isPaused: shouldPause ? true : state.isPaused,
      budget: newBudget,
      threatDamage: state.threatDamage + newThreatDamage,
      totalFuelUsed: state.totalFuelUsed + finalAssets.reduce((sum, a) => sum + (a.currentFuel < ASSET_TYPES[a.typeId].maxFuel ? ASSET_TYPES[a.typeId].fuelConsumption * deltaTime : 0), 0),
      stats: {
        ...state.stats,
        coverage,
        threatsDetected: threats.filter((t) => t.detected).length,
        threatsNeutralized: state.stats.threatsNeutralized + neutralizedCount,
        threatsExpired: state.stats.threatsExpired + threatsExpired,
      },
      history: [...state.history.slice(-1000), historyEntry],
    });
  },
}));
