import { io } from 'socket.io-client';

// Use import.meta.env for Vite
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:5000'; // Fallback URL

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(username) {
    if (this.isConnected && this.socket?.connected) {
      return this.socket; // already connected
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.socket.emit('join', username);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

const socketManager = new SocketManager();
export default socketManager;
