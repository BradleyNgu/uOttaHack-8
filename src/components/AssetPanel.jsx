import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Navigation, Fuel, Anchor } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ASSET_TYPES, NODES } from '../data/arcticData';

export default function AssetPanel() {
  const {
    assets,
    selectedAssetId,
    selectedNodeId,
    budget,
    addAsset,
    removeAsset,
    selectAsset,
    refuelAsset,
    setPatrolRoute,
  } = useGameStore();

  const handleAddAsset = (assetTypeId) => {
    if (selectedNodeId && NODES[selectedNodeId]?.canRefuel) {
      addAsset(assetTypeId, selectedNodeId);
    }
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <div className="asset-panel">
      <div className="panel-header">
        <h2>🚢 FLEET COMMAND</h2>
      </div>

      {/* Add Assets Section */}
      <div className="add-assets">
        <h3>Deploy Assets</h3>
        <p className="hint">
          {selectedNodeId && NODES[selectedNodeId]?.canRefuel
            ? `Deploy to: ${NODES[selectedNodeId].name}`
            : 'Select a port to deploy assets'}
        </p>
        <div className="asset-types">
          {Object.values(ASSET_TYPES).map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`asset-type-btn ${budget < type.cost ? 'disabled' : ''}`}
              onClick={() => handleAddAsset(type.id)}
              disabled={!selectedNodeId || !NODES[selectedNodeId]?.canRefuel || budget < type.cost}
            >
              <span className="icon">{type.icon}</span>
              <div className="info">
                <span className="name">{type.name}</span>
                <span className="cost">${type.cost}M</span>
              </div>
              <div className="stats">
                <span>⚡ {type.speed}kn</span>
                <span>👁️ {type.detectionRange}nm</span>
                <span>❄️ {Math.round(type.iceCapability * 100)}%</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active Assets */}
      <div className="active-assets">
        <h3>Active Fleet ({assets.length})</h3>
        <div className="asset-list">
          <AnimatePresence>
            {assets.map((asset) => {
              const fuelPercent = (asset.currentFuel / asset.maxFuel) * 100;
              const isSelected = selectedAssetId === asset.id;

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`asset-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectAsset(asset.id)}
                >
                  <div className="asset-header">
                    <span className="icon">{asset.icon}</span>
                    <span className="name">{asset.name}</span>
                    <span className={`status ${asset.status}`}>{asset.status}</span>
                  </div>

                  <div className="asset-location">
                    <Navigation size={12} />
                    <span>{NODES[asset.position]?.name || 'Unknown'}</span>
                  </div>

                  <div className="asset-fuel">
                    <Fuel size={12} />
                    <div className="fuel-bar">
                      <div
                        className="fuel-fill"
                        style={{
                          width: `${fuelPercent}%`,
                          background:
                            fuelPercent > 30
                              ? '#00ff88'
                              : fuelPercent > 15
                              ? '#ffaa00'
                              : '#ff3333',
                        }}
                      />
                    </div>
                    <span>{Math.round(fuelPercent)}%</span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="asset-actions"
                    >
                      <button
                        className="action-btn refuel"
                        onClick={(e) => {
                          e.stopPropagation();
                          refuelAsset(asset.id);
                        }}
                        disabled={!NODES[asset.position]?.canRefuel}
                      >
                        <Fuel size={14} /> Refuel
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAsset(asset.id);
                        }}
                      >
                        <Trash2 size={14} /> Decommission
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {assets.length === 0 && (
            <div className="no-assets">
              <Anchor size={32} />
              <p>No assets deployed</p>
              <p className="hint">Select a port and deploy your fleet</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="asset-details"
        >
          <h3>Asset Details</h3>
          <div className="detail-grid">
            <div className="detail">
              <span className="label">Type</span>
              <span className="value">{selectedAsset.name}</span>
            </div>
            <div className="detail">
              <span className="label">Speed</span>
              <span className="value">{selectedAsset.speed} knots</span>
            </div>
            <div className="detail">
              <span className="label">Detection</span>
              <span className="value">{selectedAsset.detectionRange} nm</span>
            </div>
            <div className="detail">
              <span className="label">Ice Rating</span>
              <span className="value">{Math.round(selectedAsset.iceCapability * 100)}%</span>
            </div>
            <div className="detail">
              <span className="label">Fuel</span>
              <span className="value">
                {Math.round(selectedAsset.currentFuel)} / {selectedAsset.maxFuel}
              </span>
            </div>
            <div className="detail">
              <span className="label">Consumption</span>
              <span className="value">{selectedAsset.fuelConsumption}/nm</span>
            </div>
          </div>
          <p className="hint">Click on map nodes to set destinations</p>
        </motion.div>
      )}
    </div>
  );
}
