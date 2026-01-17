// Arctic Map Data - Nodes and Edges representing the Canadian Arctic

export const NODES = {
  // Major Ports
  tuktoyaktuk: {
    id: 'tuktoyaktuk',
    name: 'Tuktoyaktuk',
    type: 'port',
    x: 180,
    y: 320,
    description: 'Major Arctic port, fuel depot',
    fuelCapacity: 100000,
    canRefuel: true,
    strategicValue: 8,
  },
  resolute: {
    id: 'resolute',
    name: 'Resolute Bay',
    type: 'port',
    x: 480,
    y: 180,
    description: 'Northern logistics hub',
    fuelCapacity: 80000,
    canRefuel: true,
    strategicValue: 9,
  },
  iqaluit: {
    id: 'iqaluit',
    name: 'Iqaluit',
    type: 'port',
    x: 680,
    y: 380,
    description: 'Capital of Nunavut, major base',
    fuelCapacity: 120000,
    canRefuel: true,
    strategicValue: 10,
  },
  churchill: {
    id: 'churchill',
    name: 'Churchill',
    type: 'port',
    x: 520,
    y: 480,
    description: 'Hudson Bay port',
    fuelCapacity: 90000,
    canRefuel: true,
    strategicValue: 7,
  },

  // Resource Sites
  prudhoe: {
    id: 'prudhoe',
    name: 'Prudhoe Bay',
    type: 'resource',
    x: 80,
    y: 280,
    description: 'Oil extraction site',
    resourceType: 'oil',
    production: 5000,
    strategicValue: 9,
  },
  melville: {
    id: 'melville',
    name: 'Melville Island',
    type: 'resource',
    x: 320,
    y: 140,
    description: 'Natural gas reserves',
    resourceType: 'gas',
    production: 3000,
    strategicValue: 7,
  },
  baffin: {
    id: 'baffin',
    name: 'Baffin Island Mining',
    type: 'resource',
    x: 620,
    y: 280,
    description: 'Iron ore mining',
    resourceType: 'minerals',
    production: 2000,
    strategicValue: 6,
  },

  // Patrol Points
  nwPassageWest: {
    id: 'nwPassageWest',
    name: 'NW Passage West',
    type: 'patrol',
    x: 220,
    y: 200,
    description: 'Western entry to Northwest Passage',
    strategicValue: 10,
  },
  nwPassageCenter: {
    id: 'nwPassageCenter',
    name: 'NW Passage Center',
    type: 'patrol',
    x: 400,
    y: 160,
    description: 'Central Northwest Passage',
    strategicValue: 10,
  },
  nwPassageEast: {
    id: 'nwPassageEast',
    name: 'NW Passage East',
    type: 'patrol',
    x: 560,
    y: 200,
    description: 'Eastern exit of Northwest Passage',
    strategicValue: 10,
  },
  hudsonStrait: {
    id: 'hudsonStrait',
    name: 'Hudson Strait',
    type: 'patrol',
    x: 700,
    y: 440,
    description: 'Entry to Hudson Bay',
    strategicValue: 8,
  },
  lancasterSound: {
    id: 'lancasterSound',
    name: 'Lancaster Sound',
    type: 'patrol',
    x: 520,
    y: 120,
    description: 'Critical chokepoint',
    strategicValue: 9,
  },
  beaufortSea: {
    id: 'beaufortSea',
    name: 'Beaufort Sea',
    type: 'patrol',
    x: 140,
    y: 180,
    description: 'Western Arctic waters',
    strategicValue: 7,
  },
};

export const EDGES = [
  // Main Northwest Passage route
  { from: 'tuktoyaktuk', to: 'beaufortSea', distance: 150, iceRisk: 0.3 },
  { from: 'beaufortSea', to: 'nwPassageWest', distance: 200, iceRisk: 0.5 },
  { from: 'nwPassageWest', to: 'melville', distance: 180, iceRisk: 0.6 },
  { from: 'melville', to: 'nwPassageCenter', distance: 160, iceRisk: 0.7 },
  { from: 'nwPassageCenter', to: 'resolute', distance: 140, iceRisk: 0.5 },
  { from: 'resolute', to: 'lancasterSound', distance: 120, iceRisk: 0.4 },
  { from: 'lancasterSound', to: 'nwPassageEast', distance: 130, iceRisk: 0.5 },
  { from: 'nwPassageEast', to: 'baffin', distance: 170, iceRisk: 0.4 },
  { from: 'baffin', to: 'iqaluit', distance: 200, iceRisk: 0.3 },

  // Hudson Bay routes
  { from: 'iqaluit', to: 'hudsonStrait', distance: 180, iceRisk: 0.4 },
  { from: 'hudsonStrait', to: 'churchill', distance: 350, iceRisk: 0.3 },

  // Cross connections
  { from: 'prudhoe', to: 'tuktoyaktuk', distance: 100, iceRisk: 0.2 },
  { from: 'prudhoe', to: 'beaufortSea', distance: 180, iceRisk: 0.4 },
  { from: 'resolute', to: 'nwPassageEast', distance: 200, iceRisk: 0.6 },
  { from: 'nwPassageCenter', to: 'lancasterSound', distance: 150, iceRisk: 0.6 },
  { from: 'churchill', to: 'iqaluit', distance: 400, iceRisk: 0.35 },
];

// Asset Types with capabilities
export const ASSET_TYPES = {
  icebreaker: {
    id: 'icebreaker',
    name: 'Icebreaker',
    icon: '🚢',
    maxFuel: 50000,
    fuelConsumption: 100, // per distance unit
    speed: 15, // knots equivalent
    detectionRange: 50,
    iceCapability: 0.9, // can traverse 90% ice
    payload: 500,
    cost: 100,
  },
  patrol: {
    id: 'patrol',
    name: 'Patrol Vessel',
    icon: '🛥️',
    maxFuel: 30000,
    fuelConsumption: 60,
    speed: 25,
    detectionRange: 40,
    iceCapability: 0.4,
    payload: 200,
    cost: 50,
  },
  drone: {
    id: 'drone',
    name: 'Maritime Drone',
    icon: '🤖',
    maxFuel: 5000,
    fuelConsumption: 10,
    speed: 40,
    detectionRange: 80,
    iceCapability: 0.2,
    payload: 50,
    cost: 20,
  },
  aircraft: {
    id: 'aircraft',
    name: 'Patrol Aircraft',
    icon: '✈️',
    maxFuel: 20000,
    fuelConsumption: 200,
    speed: 300,
    detectionRange: 150,
    iceCapability: 1.0, // flies over ice
    payload: 100,
    cost: 80,
  },
  submarine: {
    id: 'submarine',
    name: 'Submarine',
    icon: '🐋',
    maxFuel: 80000,
    fuelConsumption: 80,
    speed: 20,
    detectionRange: 60,
    iceCapability: 0.95, // can go under ice
    payload: 300,
    cost: 150,
  },
};

// Weather conditions
export const WEATHER_CONDITIONS = {
  clear: { id: 'clear', name: 'Clear', speedModifier: 1.0, detectionModifier: 1.0, icon: '☀️' },
  fog: { id: 'fog', name: 'Fog', speedModifier: 0.7, detectionModifier: 0.5, icon: '🌫️' },
  storm: { id: 'storm', name: 'Storm', speedModifier: 0.4, detectionModifier: 0.3, icon: '🌨️' },
  blizzard: { id: 'blizzard', name: 'Blizzard', speedModifier: 0.2, detectionModifier: 0.1, icon: '❄️' },
};

// Threat types (with damage/cost impact)
export const THREAT_TYPES = {
  unauthorized: { id: 'unauthorized', name: 'Unauthorized Vessel', severity: 'medium', icon: '⚠️', damage: 5, timeLimit: 10 },
  illegal_fishing: { id: 'illegal_fishing', name: 'Illegal Fishing', severity: 'low', icon: '🎣', damage: 2, timeLimit: 15 },
  smuggling: { id: 'smuggling', name: 'Smuggling', severity: 'high', icon: '📦', damage: 10, timeLimit: 8 },
  environmental: { id: 'environmental', name: 'Environmental Hazard', severity: 'high', icon: '🛢️', damage: 15, timeLimit: 5 },
};

// Initial scenarios
export const SCENARIOS = {
  lowThreat: {
    id: 'lowThreat',
    name: 'Low Threat',
    description: 'Routine patrol operations with minimal threats',
    threatFrequency: 0.1,
    weatherSeverity: 0.3,
    initialBudget: 500,
  },
  mediumThreat: {
    id: 'mediumThreat',
    name: 'Medium Threat',
    description: 'Increased maritime traffic and moderate threats',
    threatFrequency: 0.3,
    weatherSeverity: 0.5,
    initialBudget: 400,
  },
  highThreat: {
    id: 'highThreat',
    name: 'High Threat',
    description: 'Significant foreign activity and severe weather',
    threatFrequency: 0.5,
    weatherSeverity: 0.7,
    initialBudget: 350,
  },
  crisis: {
    id: 'crisis',
    name: 'Crisis Mode',
    description: 'Multiple simultaneous threats requiring rapid response',
    threatFrequency: 0.7,
    weatherSeverity: 0.8,
    initialBudget: 300,
  },
};
