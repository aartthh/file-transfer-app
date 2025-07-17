import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socketManager from '../socket';
import { generateTransferId } from '../utils/crypto';
import { useSession } from '../context/SessionContext';

export default function Dashboard() {
  const { user, logout } = useSession();
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [transfers, setTransfers] = useState([]); // both incoming & outgoing
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Load persisted data on component mount
  useEffect(() => {
    if (!user) return;
    
    // Load transfers from memory storage
    const savedTransfers = getStoredTransfers(user.username);
    setTransfers(savedTransfers);
  }, [user]);

  // Save transfers whenever they change
  useEffect(() => {
    if (user && transfers.length > 0) {
      saveTransfers(user.username, transfers);
    }
  }, [transfers, user]);

  useEffect(() => {
    if (!user) return;

    const sock = socketManager.connect(user.username);
    setSocket(sock);

    sock.on('users-update', users =>
      setActiveUsers(users.filter(u => u.username !== user.username))
    );

    sock.on('transfer-request', data =>
      addNotification(
        `${data.senderUsername} wants to send you "${data.filename}"`,
        'transfer-request',
        data
      )
    );

    sock.on('transfer-accepted', data => {
      setTransfers(t =>
        t.map(x => x.id === data.transferId ? { ...x, status: 'accepted' } : x)
      );
      addNotification('Transfer accepted! Sending file...', 'success');
    });

    sock.on('transfer-rejected', data => {
      setTransfers(t => 
        t.map(x => x.id === data.transferId ? { ...x, status: 'rejected' } : x)
      );
      addNotification('Transfer was rejected.', 'warning');
    });

    sock.on('transfer-progress', data => {
      setTransfers(t =>
        t.map(x =>
          x.id === data.transferId
            ? { ...x, progress: data.progress }
            : x
        )
      );
    });

    sock.on('transfer-complete', data => {
      setTransfers(t =>
        t.map(x =>
          x.id === data.transferId
            ? { ...x, status: 'completed', progress: 100 }
            : x
        )
      );
      addNotification(`File "${data.filename}" sent!`, 'success');
    });

    // Incoming file
    sock.on('file-complete', data => {
      // download
      const bin = atob(data.fileData);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);

      // record incoming transfer
      setTransfers(t => [
        ...t,
        {
          id: data.transferId,
          filename: data.filename,
          fileSize: data.fileSize,
          sender: data.senderUsername,
          status: 'completed',
          progress: 100,
          type: 'incoming',
          timestamp: new Date().toISOString()
        }
      ]);
      addNotification(`Received "${data.filename}" from ${data.senderUsername}`, 'success');
    });

    sock.on('transfer-cancelled', data => {
      setTransfers(t => 
        t.map(x => x.id === data.transferId ? { ...x, status: 'cancelled' } : x)
      );
      addNotification('Transfer cancelled.', 'warning');
    });

    // Enhanced error handling
    sock.on('transfer-error', data => {
      setTransfers(t => 
        t.map(x => x.id === data.transferId ? { ...x, status: 'failed' } : x)
      );
      addNotification(`Transfer failed: ${data.message}`, 'error');
    });

    // Handle connection errors
    sock.on('connect_error', () => {
      addNotification('Connection error. Please check your internet.', 'error');
    });

    sock.on('disconnect', () => {
      addNotification('Disconnected from server.', 'warning');
    });

    return () => socketManager.disconnect();
  }, [user]);

  // Memory storage functions (since localStorage is not available)
  const getStoredTransfers = (username) => {
    try {
      // Use a global variable to store transfers in memory
      if (!window.fileTransferStorage) {
        window.fileTransferStorage = {};
      }
      return window.fileTransferStorage[username] || [];
    } catch (error) {
      console.error('Error loading transfers:', error);
      return [];
    }
  };

  const saveTransfers = (username, transfers) => {
    try {
      if (!window.fileTransferStorage) {
        window.fileTransferStorage = {};
      }
      window.fileTransferStorage[username] = transfers;
    } catch (error) {
      console.error('Error saving transfers:', error);
    }
  };

  const addNotification = (msg, type='info', data=null) => {
    const id = Date.now();
    const notification = { id, message: msg, type, data };
    setNotifications(n => [...n, notification]);
    
    // Different timeouts for different notification types
    const timeout = type === 'transfer-request' ? 15000 : // 15 seconds for transfer requests
                   type === 'error' ? 10000 : // 10 seconds for errors
                   type === 'warning' ? 8000 : // 8 seconds for warnings
                   5000; // 5 seconds for success/info
    
    setTimeout(() => {
      setNotifications(n => n.filter(x => x.id !== id));
    }, timeout);
  };

  const handleLogout = () => {
    logout();
    socketManager.disconnect();
    navigate('/login');
  };

  const handleFileSelect = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10*1024*1024) {
      return addNotification('Max size is 10 MB','error');
    }
    setSelectedFile(f);
  };

  const sendFile = async () => {
    if (!selectedFile || !selectedRecipient || !socket) {
      return addNotification('Select file & recipient first','error');
    }
    
    const id = generateTransferId();
    const newTransfer = {
      id,
      filename: selectedFile.name,
      fileSize: selectedFile.size,
      recipient: selectedRecipient,
      status: 'pending',
      progress: 0,
      type: 'outgoing',
      timestamp: new Date().toISOString()
    };

    setTransfers(t => [...t, newTransfer]);

    // Set a timeout to mark as failed if no response
    const transferTimeout = setTimeout(() => {
      setTransfers(t => 
        t.map(x => x.id === id && x.status === 'pending' ? 
          { ...x, status: 'failed' } : x)
      );
      addNotification('Transfer failed: No response from recipient', 'error');
    }, 30000); // 30 seconds timeout

    socket.emit('initiate-transfer', {
      transferId: id,
      filename: selectedFile.name,
      fileSize: selectedFile.size,
      recipientUsername: selectedRecipient
    });

    socket.once('transfer-accepted', async () => {
      clearTimeout(transferTimeout);
      try {
        const buf = await selectedFile.arrayBuffer();
        const chunkSize = 64*1024;
        const total = Math.ceil(buf.byteLength/chunkSize);
        
        for (let i=0; i<total; i++){
          const chunk = buf.slice(i*chunkSize, (i+1)*chunkSize);
          socket.emit('file-chunk', {
            transferId: id,
            chunk: Array.from(new Uint8Array(chunk)),
            chunkIndex: i,
            isLastChunk: i===total-1
          });
          await new Promise(r=>setTimeout(r,10));
        }
      } catch (error) {
        setTransfers(t => 
          t.map(x => x.id === id ? { ...x, status: 'failed' } : x)
        );
        addNotification('Transfer failed: Error sending file', 'error');
      }
    });

    socket.once('transfer-rejected', () => {
      clearTimeout(transferTimeout);
    });

    setSelectedFile(null);
    setSelectedRecipient('');
    fileInputRef.current.value = '';
  };

  const clearTransferHistory = () => {
    setTransfers([]);
    if (user) {
      saveTransfers(user.username, []);
    }
    addNotification('Transfer history cleared', 'success');
  };

  const retryTransfer = (transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    setTransfers(t => 
      t.map(x => x.id === transferId ? { ...x, status: 'pending', progress: 0 } : x)
    );

    socket.emit('initiate-transfer', {
      transferId: transferId,
      filename: transfer.filename,
      fileSize: transfer.fileSize,
      recipientUsername: transfer.recipient
    });
  };

  const formatSize = b => {
    if (b===0) return '0 Bytes';
    const k=1024, sizes=['Bytes','KB','MB','GB'],
      i=Math.floor(Math.log(b)/Math.log(k));
    return `${(b/Math.pow(k,i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getNotifColor = t => ({
    success:'bg-green-100 border-green-400 text-green-700',
    warning:'bg-yellow-100 border-yellow-400 text-yellow-700',
    error:'bg-red-100 border-red-400 text-red-700'
  }[t]||'bg-blue-100 border-blue-400 text-blue-700');

  const getStatusColor = status => ({
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800'
  }[status] || 'bg-gray-100 text-gray-800');

  // split
  const outgoing = transfers.filter(x=>x.type==='outgoing');
  const incoming = transfers.filter(x=>x.type==='incoming');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white shadow-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">📁 FileXpress Dashboard</h1>
            <p className="text-sm text-gray-600">Hello, {user?.username}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={clearTransferHistory}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              Clear History
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(n=>(
          <div key={n.id} className={`p-3 rounded-md border ${getNotifColor(n.type)} max-w-sm shadow-lg`}>
            <div className="flex justify-between items-start">
              <p className="text-sm pr-2">{n.message}</p>
              <button 
                onClick={()=>setNotifications(ns=>ns.filter(x=>x.id!==n.id))}
                className="text-lg font-bold hover:bg-black hover:bg-opacity-10 rounded px-1"
              >
                ×
              </button>
            </div>
            {n.type==='transfer-request' && (
              <div className="mt-2 space-x-2">
                <button 
                  onClick={()=>{
                    socket.emit('accept-transfer',{transferId:n.data.transferId});
                    setNotifications(ns=>ns.filter(x=>x.id!==n.id));
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                >
                  Accept
                </button>
                <button 
                  onClick={()=>{
                    socket.emit('reject-transfer',{transferId:n.data.transferId});
                    setNotifications(ns=>ns.filter(x=>x.id!==n.id));
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Send File */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Share a File</h2>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="mb-3 w-full text-sm text-gray-600 border border-gray-300 rounded-lg p-2"
          />
          {selectedFile && (
            <p className="text-sm text-gray-500 mb-3">
              {selectedFile.name} ({formatSize(selectedFile.size)})
            </p>
          )}
          <select
            value={selectedRecipient}
            onChange={e=>setSelectedRecipient(e.target.value)}
            className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Choose recipient</option>
            {activeUsers.map(u=>(
              <option key={u.socketId} value={u.username}>{u.username}</option>
            ))}
          </select>
          <button
            onClick={sendFile}
            disabled={!selectedFile||!selectedRecipient}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send File
          </button>
        </section>
          
        {/* Outgoing */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Shared by You ({outgoing.length})</h2>
          {outgoing.length===0 ? (
            <p className="text-gray-500">You haven't shared any files yet.</p>
          ) : (
            <ul className="space-y-4">
              {outgoing.map(t=>(
                <li key={t.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{t.filename}</p>
                      <p className="text-sm text-gray-500">To: {t.recipient}</p>
                      <p className="text-sm text-gray-500">Size: {formatSize(t.fileSize)}</p>
                      {t.timestamp && (
                        <p className="text-xs text-gray-400">{formatTimestamp(t.timestamp)}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                      {t.status === 'failed' && (
                        <button
                          onClick={() => retryTransfer(t.id)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  {t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled' && t.status !== 'rejected' && (
                    <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                           style={{width:`${t.progress}%`}}/>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Incoming */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Shared to You ({incoming.length})</h2>
          {incoming.length===0 ? (
            <p className="text-gray-500">No files have been shared with you yet.</p>
          ) : (
            <ul className="space-y-4">
              {incoming.map(t=>(
                <li key={t.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.filename}</p>
                      <p className="text-sm text-gray-500">From: {t.sender}</p>
                      <p className="text-sm text-gray-500">Size: {formatSize(t.fileSize)}</p>
                      {t.timestamp && (
                        <p className="text-xs text-gray-400">{formatTimestamp(t.timestamp)}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}