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
  budget: 800,
  threatFrequency: 0.3, // 0-1
  weatherSeverity: 0.3, // 0-1
  fuelCostPerUnit: 0.0005, // cost per fuel unit (in millions) - so 1000 fuel = $0.5M
  movementCostEnabled: false, // movement is FREE by default, only refueling costs
  threatDamageEnabled: true,
};

// Get all ports for tracking
const ALL_PORTS = Object.keys(NODES).filter((id) => NODES[id].type === 'port');
// Get all resource nodes
const ALL_RESOURCES = Object.keys(NODES).filter((id) => NODES[id].type === 'resource');

// Store original ice risk values for reformation
const ORIGINAL_ICE_RISK = {};
EDGES.forEach((edge, index) => {
  const edgeKey = `${edge.from}-${edge.to}`;
  ORIGINAL_ICE_RISK[edgeKey] = edge.iceRisk;
});

// Helper to get edge key (normalized so both directions match)
const getEdgeKey = (from, to) => {
  return from < to ? `${from}-${to}` : `${to}-${from}`;
};

const initialState = {
  // Game state
  isRunning: false,
  isPaused: false,
  isGameOver: false,
  gameSpeed: 1,
  currentTime: 0, // in hours
  currentDay: 1,
  
  // Adjustable Settings
  settings: { ...DEFAULT_SETTINGS },
  
  // Resources
  budget: DEFAULT_SETTINGS.budget,
  totalFuelUsed: 0,
  threatDamage: 0, // total damage from unhandled threats
  
  // Mining & Trade tracking
  resourcesMined: {
    oil: 0,
    gas: 0,
    minerals: 0,
  },
  portsVisited: [], // array of port IDs visited by civilian ships
  allPorts: ALL_PORTS,
  
  // Ice clearing tracking - { edgeKey: { clearedOnDay: number, originalIceRisk: number } }
  clearedIce: {},
  
  // Assets
  assets: [],
  selectedAssetId: null,
  
  // Map state
  nodes: NODES,
  edges: EDGES,
  // Dynamic ice risk (modified by icebreakers)
  currentIceRisk: EDGES.reduce((acc, edge) => {
    const key = getEdgeKey(edge.from, edge.to);
    acc[key] = edge.iceRisk;
    return acc;
  }, {}),
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
    set({ 
      isRunning: true, 
      isPaused: false,
      // Don't reset budget - keep current budget (which may have had assets deployed)
    });
  },
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  stopGame: () => set({ isRunning: false, isPaused: false }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  
  resetGame: () => {
    const state = get();
    // Reset ice risk to original values
    const resetIceRisk = EDGES.reduce((acc, edge) => {
      const key = getEdgeKey(edge.from, edge.to);
      acc[key] = edge.iceRisk;
      return acc;
    }, {});
    
    set({
      ...initialState,
      settings: state.settings,
      budget: state.settings.budget,
      isGameOver: false,
      clearedIce: {},
      currentIceRisk: resetIceRisk,
    });
  },
  
  // Asset management
  addAsset: (assetTypeId, nodeId) => {
    const assetType = ASSET_TYPES[assetTypeId];
    const state = get();
    
    if (!assetType || state.budget < assetType.cost) return false;
    
    // Check if this asset type is already deployed (only one of each type allowed)
    const alreadyDeployed = state.assets.some((a) => a.typeId === assetTypeId);
    if (alreadyDeployed) return false;
    
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
      status: 'idle', // idle, moving,  refueling, intercepting
      progress: 0, // 0-1 progress between nodes
      interceptingThreat: null,
    };
    
    // If civilian ship is deployed at a port, track that port as visited
    let newPortsVisited = [...state.portsVisited];
    if (assetTypeId === 'civilianShip' && NODES[nodeId]?.type === 'port') {
      if (!newPortsVisited.includes(nodeId)) {
        newPortsVisited.push(nodeId);
      }
    }
    
    set({
      assets: [...state.assets, newAsset],
      budget: state.budget - assetType.cost,
      portsVisited: newPortsVisited,
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
  
  // setPatrolRoute: (assetId, routeNodeIds) => {
  //   const state = get();
  //   set({
  //     assets: state.assets.map((a) =>
  //       a.id === assetId
  //         ? {
  //             ...a,
  //             patrolRoute: routeNodeIds,
  //             status: 'patrolling',
  //             path: routeNodeIds,
  //             pathIndex: 0,
  //           }
  //         : a
  //     ),
  //   });
  // },
  
  // Refueling costs per unit of fuel needed
  refuelAsset: (assetId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    const node = NODES[asset?.position];
    
    if (!asset || !node?.canRefuel) return false;
    
    // Check if already full
    const maxFuel = ASSET_TYPES[asset.typeId].maxFuel;
    const fuelNeeded = maxFuel - asset.currentFuel;
    
    if (fuelNeeded <= 0) return false; // Already full
    
    // Calculate cost based on fuel needed
    const refuelCost = Math.ceil(fuelNeeded * state.settings.fuelCostPerUnit);
    
    if (state.budget < refuelCost) return false; // Can't afford
    
    set({
      assets: state.assets.map((a) =>
        a.id === assetId
          ? { ...a, currentFuel: maxFuel, status: 'refueling' }
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
    
    return true;
  },
  
  // Helper to calculate refuel cost for an asset
  getRefuelCost: (assetId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    if (!asset) return 0;
    
    const maxFuel = ASSET_TYPES[asset.typeId].maxFuel;
    const fuelNeeded = maxFuel - asset.currentFuel;
    
    if (fuelNeeded <= 0) return 0;
    
    return Math.ceil(fuelNeeded * state.settings.fuelCostPerUnit);
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
    //const nodeIds = Object.keys(NODES).filter((id) => NODES[id].type === 'patrol');
    
    if (Math.random() > state.settings.threatFrequency) return;
    
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    
    const threat = {
      id: generateId(),
      type: threatType,
      position: nodeIds[Math.floor(Math.random() * nodeIds.length)],
      spawnTime: state.currentTime + (state.currentDay - 1) * 24,
      detected: false,
      neutralized: false,
      timeLimit: threatType.timeLimit || 24, // hours until it causes damage
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
    if (!state.isRunning || state.isPaused || state.isGameOver) return;
    
    const deltaTime = 0.1 * state.gameSpeed; // hours
    let newTime = state.currentTime + deltaTime;
    let newDay = state.currentDay;
    
    if (newTime >= 24) {
      newTime = 0;
      newDay += 1;
    }
    
    const currentTotalTime = newTime + (newDay - 1) * 24;
    
    // Update assets and track fuel consumed this tick
    let totalFuelConsumedThisTick = 0;
    
    // Track newly mined resources this tick
    let newResourcesMined = { oil: 0, gas: 0, minerals: 0 };
    let newPortsVisited = [...state.portsVisited];
    
    // Track ice cleared this tick
    let newClearedIce = { ...state.clearedIce };
    let newIceRisk = { ...state.currentIceRisk };
    
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
        
        // Get current ice risk (may have been cleared by icebreaker)
        const edgeKey = getEdgeKey(currentNode, nextNode);
        const currentEdgeIceRisk = newIceRisk[edgeKey] ?? edge.iceRisk;
        
        // Calculate speed with weather modifier
        const weatherCondition = WEATHER_CONDITIONS[state.weather[currentNode]];
        const effectiveSpeed = asset.speed * weatherCondition.speedModifier;
        
        // Check ice capability (use dynamic ice risk)
        if (currentEdgeIceRisk > asset.iceCapability && asset.typeId !== 'aircraft') {
          return asset; // Can't traverse this edge
        }
        
        // Calculate progress
        const distancePerTick = (effectiveSpeed * deltaTime) / edge.distance;
        let newProgress = asset.progress + distancePerTick;
        
        // Fuel consumption
        const fuelUsed = asset.fuelConsumption * distancePerTick * edge.distance;
        const newFuel = Math.max(0, asset.currentFuel - fuelUsed);
        
        // Track fuel consumed for budget deduction
        totalFuelConsumedThisTick += fuelUsed;
        
        if (newFuel <= 0) {
          return { ...asset, status: 'stranded', currentFuel: 0 };
        }
        
        if (newProgress >= 1) {
          // Arrived at next node
          const arrivedNode = NODES[nextNode];
          
          // Icebreaker clears ice on the edge it just traversed!
          if (asset.typeId === 'icebreaker' || ASSET_TYPES[asset.typeId]?.clearsIce) {
            const traversedEdgeKey = getEdgeKey(currentNode, nextNode);
            if (newIceRisk[traversedEdgeKey] > 0) {
              newIceRisk[traversedEdgeKey] = 0;
              newClearedIce[traversedEdgeKey] = {
                clearedOnDay: newDay,
                originalIceRisk: edge.iceRisk,
              };
            }
          }
          
          // Mining ship at resource node - mine resources!
          if (asset.typeId === 'mining' && arrivedNode?.type === 'resource') {
            const resourceType = arrivedNode.resourceType;
            const production = arrivedNode.production || 1000;
            newResourcesMined[resourceType] = (newResourcesMined[resourceType] || 0) + production;
          }
          
          // Civilian ship at port - track the visit!
          if (asset.typeId === 'civilianShip' && arrivedNode?.type === 'port') {
            if (!newPortsVisited.includes(nextNode)) {
              newPortsVisited.push(nextNode);
            }
          }
          
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
      
      // Mining ships that are idle at resource nodes also mine
      if (asset.typeId === 'mining' && asset.status === 'idle') {
        const currentNodeData = NODES[asset.position];
        if (currentNodeData?.type === 'resource') {
          const resourceType = currentNodeData.resourceType;
          const production = (currentNodeData.production || 1000) * deltaTime * 0.1; // Slower when idle
          newResourcesMined[resourceType] = (newResourcesMined[resourceType] || 0) + production;
        }
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
    
    // Calculate movement cost (fuel consumed costs budget)
    const movementCost = state.settings.movementCostEnabled 
      ? totalFuelConsumedThisTick * state.settings.fuelCostPerUnit 
      : 0;
    
    // Apply threat damage and movement cost to budget (rounded to avoid decimals)
    const newBudget = Math.round((state.budget - newThreatDamage - movementCost) * 100) / 100;
    
    // Check for game over (budget depleted)
    const isGameOver = newBudget <= 0;
    
    // Update resources mined
    const updatedResourcesMined = {
      oil: Math.round(state.resourcesMined.oil + newResourcesMined.oil),
      gas: Math.round(state.resourcesMined.gas + newResourcesMined.gas),
      minerals: Math.round(state.resourcesMined.minerals + newResourcesMined.minerals),
    };
    
    // Ice reformation - check for edges that were cleared 7+ days ago
    const ICE_REFORM_DAYS = 7;
    Object.entries(newClearedIce).forEach(([edgeKey, data]) => {
      const daysSinceCleared = newDay - data.clearedOnDay;
      if (daysSinceCleared >= ICE_REFORM_DAYS) {
        // Ice reforms back to original value
        newIceRisk[edgeKey] = data.originalIceRisk;
        delete newClearedIce[edgeKey];
      }
    });
    
    set({
      currentTime: newTime,
      currentDay: newDay,
      assets: finalAssets,
      threats: remainingThreats,
      isPaused: shouldPause ? true : state.isPaused,
      isGameOver,
      isRunning: isGameOver ? false : state.isRunning,
      budget: Math.max(0, newBudget),
      threatDamage: state.threatDamage + newThreatDamage,
      totalFuelUsed: state.totalFuelUsed + totalFuelConsumedThisTick,
      resourcesMined: updatedResourcesMined,
      portsVisited: newPortsVisited,
      clearedIce: newClearedIce,
      currentIceRisk: newIceRisk,
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
