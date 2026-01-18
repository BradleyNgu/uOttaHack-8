import { useEffect, useState, useRef } from 'react';
import { SerialConnection, ARDUINO_ASSET_MAP, ARDUINO_GAME_CONTROLS } from '../utils/serialConnection';
import { useGameStore } from '../store/gameStore';

export function useArduino() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const serialRef = useRef(null);
  
  useEffect(() => {
    // Initialize serial connection
    serialRef.current = new SerialConnection();
    
    // Set up data handler
    serialRef.current.onDataReceived = (data) => {
      handleArduinoData(data);
    };

    return () => {
      // Cleanup on unmount
      if (serialRef.current) {
        serialRef.current.disconnect();
      }
    };
  }, []);

  const handleArduinoData = (data) => {
    // Normalize message: trim, uppercase, and handle parentheses
    const message = data.trim().toUpperCase();
    console.log('Arduino message received:', message); // Debug log
    
    // Get fresh state from store
    const state = useGameStore.getState();
    
    // Check for game controls first (try exact match, then partial match)
    let control = ARDUINO_GAME_CONTROLS[message];
    
    // If exact match not found, try to match by checking if message contains key parts
    if (!control) {
      if (message.includes('YES') && message.includes('START')) {
        control = 'start';
      } else if (message.includes('RED') && message.includes('STOP')) {
        control = 'stop';
      } else if ((message.includes('BBLEK') || message.includes('BLUE')) && message.includes('RESET')) {
        control = 'reset';
      }
    }
    
    if (control) {
      
      switch (control) {
        case 'start':
          if (!state.isRunning) {
            state.startGame();
          } else if (state.isPaused) {
            state.resumeGame();
          }
          break;
        case 'stop':
          if (state.isRunning) {
            state.stopGame();
          }
          break;
        case 'reset':
          state.resetGame();
          break;
      }
      return;
    }
    
    // Check for asset deployment
    if (ARDUINO_ASSET_MAP[message]) {
      const assetId = ARDUINO_ASSET_MAP[message];
      
      // Deploy asset if node is selected
      if (state.selectedNodeId) {
        const success = state.addAsset(assetId, state.selectedNodeId);
        console.log('Asset deployment:', assetId, 'at', state.selectedNodeId, 'success:', success);
      } else {
        console.log('No port selected - cannot deploy asset');
      }
    }
  };

  const connect = async () => {
    if (!navigator.serial) {
      alert('Web Serial API not supported. Please use Chrome or Edge browser.');
      setConnectionStatus('Not Supported');
      return false;
    }

    try {
      setConnectionStatus('Connecting...');
      const connected = await serialRef.current.connect();
      
      if (connected) {
        setIsConnected(true);
        setConnectionStatus('Connected');
        console.log('Arduino connected successfully');
        
        // Send a test message to confirm connection
        setTimeout(() => {
          serialRef.current.send('TEST');
        }, 500);
      } else {
        setIsConnected(false);
        setConnectionStatus('Connection Failed');
      }
      
      return connected;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      if (error.message && error.message.includes('No port selected')) {
        setConnectionStatus('No Port Selected');
      } else if (error.message && error.message.includes('not supported')) {
        setConnectionStatus('Not Supported');
      } else {
        setConnectionStatus('Connection Failed');
      }
      return false;
    }
  };

  const disconnect = async () => {
    await serialRef.current.disconnect();
    setIsConnected(false);
    setConnectionStatus('Disconnected');
  };

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
  };
}
