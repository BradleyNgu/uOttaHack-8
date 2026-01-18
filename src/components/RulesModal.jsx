import { motion, AnimatePresence } from 'framer-motion';
import { X, Ship, Shield, Pickaxe, MapPin, AlertTriangle, DollarSign, Clock } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="rules-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="rules-modal"
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
            }}
          >
            <div className="rules-header">
              <h2>GAME RULES</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="rules-content">
              {/* Objective */}
              <section className="rules-section">
                <h3>Objective</h3>
                <p>Manage your Arctic patrol operations efficiently while protecting trade routes, extracting resources, and neutralizing threats. Keep your budget above $0 to avoid mission failure.</p>
              </section>

              {/* Assets */}
              <section className="rules-section">
                <h3>Assets & Deployment</h3>
                <ul>
                  <li><strong>Deploy Assets:</strong> Click a port (cyan node), then deploy from Fleet Command panel</li>
                  <li><strong>One per Type:</strong> Only one of each asset type can be deployed</li>
                  <li><strong>Move Assets:</strong> Select an asset, then click a destination node</li>
                  <li><strong>Refuel:</strong> Assets can refuel at ports (cyan nodes) - costs based on fuel needed</li>
                </ul>
                <div className="asset-types">
                  <div className="asset-type-item">
                    <span>⛴️ Civilian Cargo Ship</span>
                    <span>Visit all ports to complete trade route, cannot neutralize threats</span>
                  </div>
                  <div className="asset-type-item">
                    <span>🤖 Mining Vessel</span>
                    <span>Extract resources at resource nodes, cannot neutralize threats</span>
                  </div>
                  <div className="asset-type-item">
                    <span>🧊 Icebreaker</span>
                    <span>Clears ice on routes (ice reforms after 7 days)</span>
                  </div>
                  <div className="asset-type-item">
                    <span>🛥️ Patrol Vessel</span>
                    <span>Detect and neutralize threats</span>
                  </div>
                  <div className="asset-type-item">
                    <span>✈️ Patrol Aircraft</span>
                    <span>Fast detection, flies over ice</span>
                  </div>
                </div>
              </section>

              {/* Threats */}
              <section className="rules-section">
                <h3>Threats</h3>
                <ul>
                  <li><strong>Auto-Pause:</strong> Game pauses when threats spawn</li>
                  <li><strong>Time Limit:</strong> Each threat has a time limit before causing damage</li>
                  <li><strong>Neutralize:</strong> Send assets to threat location to neutralize</li>
                  <li><strong>Damage:</strong> Expired threats deduct budget</li>
                  <li><strong>Detection:</strong> Assets near threats can detect them</li>
                </ul>
              </section>

              {/* Resources */}
              <section className="rules-section">
                <h3>Mining & Resources</h3>
                <ul>
                  <li><strong>Capacity Limits:</strong> Oil (50K), Gas (30K), Minerals (20K)</li>
                  <li><strong>Mining Costs:</strong> Base cost + inflation (5% per week)</li>
                  <li><strong>Storage Cost:</strong> $1M/day per 10,000 resources stored</li>
                  <li><strong>Auto-Stop:</strong> Mining stops when capacity is reached</li>
                </ul>
              </section>

              {/* Trade Routes */}
              <section className="rules-section">
                <h3>Trade Routes</h3>
                <ul>
                  <li><strong>Goal:</strong> Visit all 4 ports with Civilian Cargo Ship</li>
                  <li><strong>Ports:</strong> Tuktoyaktuk, Resolute Bay, Iqaluit, Churchill</li>
                  <li><strong>Tracking:</strong> Progress shown in Dashboard</li>
                </ul>
              </section>

              {/* Ice & Routes */}
              <section className="rules-section">
                <h3>Ice & Routes</h3>
                <ul>
                  <li><strong>Ice Risk:</strong> Each route has an ice risk level (0-1)</li>
                  <li><strong>Ice Capability:</strong> Ships have different ice handling abilities</li>
                  <li><strong>Icebreaker:</strong> Clears ice to 0 when traversing routes</li>
                  <li><strong>Reformation:</strong> Ice reforms to original level after 7 days</li>
                  <li><strong>Aircraft:</strong> Flies over ice (ice capability 1.0)</li>
                </ul>
              </section>

              {/* Budget & Costs */}
              <section className="rules-section">
                <h3>Budget & Costs</h3>
                <ul>
                  <li><strong>Deployment:</strong> One-time cost when deploying assets</li>
                  <li><strong>Movement:</strong> FREE (but consumes fuel)</li>
                  <li><strong>Refueling:</strong> Cost based on fuel needed to fill tank</li>
                  <li><strong>Mining:</strong> Ongoing cost while mining (increases with inflation)</li>
                  <li><strong>Storage:</strong> Daily cost for stored resources</li>
                  <li><strong>Threat Damage:</strong> Budget lost when threats expire</li>
                  <li><strong>Game Over:</strong> Budget reaches $0 or below</li>
                </ul>
              </section>

              {/* Efficiency */}
              <section className="rules-section">
                <h3>Efficiency Score</h3>
                <p>Calculated based on:</p>
                <ul>
                  <li>+20 points per threat neutralized</li>
                  <li>+0.5 points per % coverage</li>
                  <li>-1 point per 10,000 fuel used</li>
                  <li>-10 points per active threat</li>
                </ul>
              </section>

              <section className="rules-section">
                <h3>Weather</h3>
                <ul>
                  <li><strong>Extreme Weather:</strong> Breaks out in different regions every day</li>
                  <li><strong>Effects:</strong> Causes an increase in fuel consumption when entering</li>
                  <li><strong>Blizzards and Storms:</strong> Doubles consumption</li>
                  <li><strong>Fog:</strong> Increases consumption by 50%</li>
                </ul>
              </section>

              {/* Tips */}
              <section className="rules-section">
                <h3>Pro Tips</h3>
                <ul>
                  <li>Use Icebreaker to open routes for ships with low ice capability</li>
                  <li>Mine resources quickly before inflation increases costs</li>
                  <li>Neutralize threats quickly to avoid budget damage</li>
                  <li>Plan routes efficiently to minimize fuel consumption</li>
                  <li>Balance mining operations with threat response</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
