import { useEffect, useState, useRef } from 'react';
import { SerialConnection, ARDUINO_ASSET_MAP, ARDUINO_GAME_CONTROLS } from '../utils/serialConnection';
import { useGameStore } from '../store/gameStore';

export function useArduino() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const serialRef = useRef(null);
  
  const { 
    selectedNodeId, 
    addAsset, 
    startGame, 
    stopGame, 
    resetGame,
    pauseGame,
    resumeGame,
    isRunning,
    isPaused,
  } = useGameStore();

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

  // Update handler when selectedNodeId changes
  useEffect(() => {
    if (serialRef.current) {
      serialRef.current.onDataReceived = (data) => {
        handleArduinoData(data);
      };
    }
  }, [selectedNodeId, isRunning, isPaused]);

  const handleArduinoData = (data) => {
    const message = data.toUpperCase().trim();
    
    // Check for game controls first
    if (ARDUINO_GAME_CONTROLS[message]) {
      const control = ARDUINO_GAME_CONTROLS[message];
      
      switch (control) {
        case 'start':
          if (!isRunning) {
            startGame();
          } else if (isPaused) {
            resumeGame();
          }
          break;
        case 'stop':
          if (isRunning) {
            stopGame();
          }
          break;
        case 'reset':
          resetGame();
          break;
      }
      return;
    }
    
    // Check for asset deployment
    if (ARDUINO_ASSET_MAP[message]) {
      const assetId = ARDUINO_ASSET_MAP[message];
      
      // Deploy asset if node is selected
      if (selectedNodeId) {
        addAsset(assetId, selectedNodeId);
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
      } else {
        setIsConnected(false);
        setConnectionStatus('Connection Failed');
      }
      
      return connected;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionStatus('Connection Failed');
      if (error.message.includes('No port selected')) {
        setConnectionStatus('No Port Selected');
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
