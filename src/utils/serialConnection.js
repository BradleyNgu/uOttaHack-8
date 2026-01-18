// Web Serial API connection for Arduino
export class SerialConnection {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.onDataReceived = null;
    this.buffer = '';
  }

  async connect() {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API not supported. Please use Chrome or Edge browser.');
      }

      // Request port access
      this.port = await navigator.serial.requestPort();
      
      // Open connection with baud rate matching Arduino (115200)
      await this.port.open({ baudRate: 115200 });
      
      this.isConnected = true;
      console.log('Serial port opened successfully');
      
      // Set up reader
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      
      // Start reading data (don't await - it runs in background)
      this.readLoop().catch(err => {
        console.error('Read loop error:', err);
      });
      
      return true;
    } catch (error) {
      console.error('Serial connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async readLoop() {
    try {
      while (this.isConnected && this.reader) {
        const { value, done } = await this.reader.read();
        
        if (done) {
          break;
        }
        
        // Convert Uint8Array to string and add to buffer
        const chunk = new TextDecoder().decode(value);
        this.buffer += chunk;
        
        // Process complete lines
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        // Handle each complete line
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && this.onDataReceived) {
            console.log('Serial data received:', trimmed); // Debug log
            this.onDataReceived(trimmed);
          }
        });
      }
    } catch (error) {
      console.error('Read error:', error);
      this.disconnect();
    }
  }

  async send(data) {
    if (!this.writer || !this.isConnected) {
      console.warn('Serial port not connected');
      return false;
    }
    
    try {
      const encoder = new TextEncoder();
      await this.writer.write(encoder.encode(data + '\n'));
      return true;
    } catch (error) {
      console.error('Send error:', error);
      return false;
    }
  }

  async disconnect() {
    this.isConnected = false;
    
    if (this.reader) {
      try {
        await this.reader.cancel();
        this.reader.releaseLock();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.reader = null;
    }
    
    if (this.writer) {
      try {
        await this.writer.releaseLock();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.writer = null;
    }
    
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.port = null;
    }
  }
}

// Asset type mapping based on Arduino serial output
export const ARDUINO_ASSET_MAP = {
  'YELLOW PRESSED': 'civilianShip',
  'RED 1 PRESSED': 'patrol',
  'GREEN PRESSED': 'mining',
  'RED 2 PRESSED': 'aircraft',
  'WHITE PRESSED': 'longDistance',
  'BLUE PRESSED': 'icebreaker',
};

// Game control mapping
export const ARDUINO_GAME_CONTROLS = {
  'START': 'start',
  'STOP': 'stop',
  'RESET': 'reset',
};
