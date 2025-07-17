const express = require('express'); // Import express
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express(); // Create an instance of express

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://file-transfer-app-1.onrender.com', 'https://file-transfer-app-1.onrender.com/register'], // Allow both origins
  credentials: true
}));
// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', require('./routes/auth'));
// Local upload route
app.use('/api/files', require('./routes/fileRoutes'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/filetransfer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
app.get('/', (req, res) => {
  res.send('Backend is live!');
});


// Create server (HTTP for development, HTTPS for production)
let server;
if (process.env.NODE_ENV === 'production') {
  // HTTPS server for production
  const options = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'fullchain.pem'))
  };
  server = https.createServer(options, app);
} else {
  // HTTP server for development
  server = http.createServer(app);
}

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',   // React dev
      'http://localhost:5173' , 
        // Vite dev
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
// Store active users and their socket connections
const activeUsers = new Map();
const fileTransfers = new Map();

io.on('connection', (socket) => {
  console.log('User  connected:', socket.id);

  // User joins with their username
  socket.on('join', (username) => {
    activeUsers.set(socket.id, { username, socketId: socket.id });
    socket.username = username;

    // Send updated user list to all clients
    io.emit('users-update', Array.from(activeUsers.values()));
    console.log(`${username} joined`);
  });

  // Handle file transfer initiation
  socket.on('initiate-transfer', (data) => {
    const { filename, fileSize, recipientUsername, transferId } = data;

    // Find recipient socket
    const recipientSocket = Array.from(activeUsers.entries())
      .find(([, user]) => user.username === recipientUsername);

    if (recipientSocket) {
      const [recipientSocketId] = recipientSocket;

      // Store transfer info
      fileTransfers.set(transferId, {
        senderId: socket.id,
        senderUsername: socket.username,
        recipientId: recipientSocketId,
        recipientUsername,
        filename,
        fileSize,
        transferId,
        chunks: [],
        receivedSize: 0
      });

      // Notify recipient
      io.to(recipientSocketId).emit('transfer-request', {
        senderUsername: socket.username,
        filename,
        fileSize,
        transferId
      });

      socket.emit('transfer-initiated', { transferId });
    } else {
      socket.emit('transfer-error', { message: 'Recipient not found' });
    }
  });

  socket.on('file-complete', ({ transferId, filename, fileData, fileSize }) => {
    console.log(`Received file ${filename} (${fileSize} bytes)`);

    // Convert base64 back to binary
    const byteArray = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Create a Blob from the byteArray
    const blob = new Blob([byteArray]);

    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  });

  // Handle transfer acceptance
  socket.on('accept-transfer', (data) => {
    const { transferId } = data;
    const transfer = fileTransfers.get(transferId);

    if (transfer) {
      io.to(transfer.senderId).emit('transfer-accepted', { transferId });
      transfer.accepted = true;
    }
  });


  // Handle transfer rejection
  socket.on('reject-transfer', (data) => {
    const { transferId } = data;
    const transfer = fileTransfers.get(transferId);

    if (transfer) {
      io.to(transfer.senderId).emit('transfer-rejected', { transferId });
      fileTransfers.delete(transferId);
    }
  });

  socket.on('file-chunk', (data) => {
    const { transferId, chunk, chunkIndex, isLastChunk } = data;
    const transfer = fileTransfers.get(transferId);

    if (transfer && transfer.accepted) {
      // ✅ Convert to Buffer before storing
      transfer.chunks[chunkIndex] = Buffer.from(chunk);
      transfer.receivedSize += chunk.length;

      const progress = (transfer.receivedSize / transfer.fileSize) * 100;

      io.to(transfer.senderId).emit('transfer-progress', {
        transferId,
        progress: Math.round(progress),
        receivedSize: transfer.receivedSize,
        totalSize: transfer.fileSize
      });

      io.to(transfer.recipientId).emit('transfer-progress', {
        transferId,
        progress: Math.round(progress),
        receivedSize: transfer.receivedSize,
        totalSize: transfer.fileSize
      });

      if (isLastChunk) {
        const fileBuffer = Buffer.concat(transfer.chunks); // ✅ will work now
        io.to(transfer.recipientId).emit('file-complete', {
          transferId,
          filename: transfer.filename,
          fileData: fileBuffer.toString('base64'),
          fileSize: transfer.fileSize
        });

        io.to(transfer.senderId).emit('transfer-complete', {
          transferId,
          filename: transfer.filename
        });

        fileTransfers.delete(transferId);
      }
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`${socket.username} disconnected`);
    }

    activeUsers.delete(socket.id);

    // Clean up any pending transfers
    for (const [transferId, transfer] of fileTransfers.entries()) {
      if (transfer.senderId === socket.id || transfer.recipientId === socket.id) {
        fileTransfers.delete(transferId);
        // Notify the other party
        const otherId = transfer.senderId === socket.id ? transfer.recipientId : transfer.senderId;
        io.to(otherId).emit('transfer-cancelled', { transferId });
      }
    }

    // Send updated user list to all clients
    io.emit('users-update', Array.from(activeUsers.values()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
