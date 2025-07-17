import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SessionProvider } from './context/SessionContext'; // ✅ Correct import
import socketManager from './socket';

// Auto-connect if token is present
const token = localStorage.getItem('token');
if (token) {
  const username = localStorage.getItem('username') || 'user';

  const socket = socketManager.connect(username);

  socket.on('connect', () => {
    socket.emit('authenticate', { token });
  });
}

// ✅ Use SessionProvider not SessionWrapper
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SessionProvider>
  </React.StrictMode>
);
