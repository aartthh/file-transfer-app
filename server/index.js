const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://file-transfer-app.onrender.com'
  ],
  credentials: true
}));

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', require('./routes/auth'));
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

// Health check route for Render
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

// Create server (HTTP only — let Render handle HTTPS)
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://file-transfer-app-1.onrender.com/'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const activeUsers = new Map();
const fileTransfers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    activeUsers.set(socket.id, { username, socketId: socket.id });
    socket.username = username;
    io.emit('users-update', Array.from(activeUsers.values()));
    console.log(`${username} joined`);
  });

  socket.on('initiate-transfer', (data) => {
    const { filename, fileSize, recipientUsername, transferId } = data;
    const recipientSocket = Array.from(activeUsers.entries())
      .find(([, user]) => user.username === recipientUsername);

    if (recipientSocket) {
      const [recipientSocketId] = recipientSocket;
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

  socket.on('file-chunk', (data) => {
    const { transferId, chunk, chunkIndex, isLastChunk } = data;
    const transfer = fileTransfers.get(transferId);

    if (transfer && transfer.accepted) {
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
        const fileBuffer = Buffer.concat(transfer.chunks);
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

  socket.on('accept-transfer', ({ transferId }) => {
    const transfer = fileTransfers.get(transferId);
    if (transfer) {
      transfer.accepted = true;
      io.to(transfer.senderId).emit('transfer-accepted', { transferId });
    }
  });

  socket.on('reject-transfer', ({ transferId }) => {
    const transfer = fileTransfers.get(transferId);
    if (transfer) {
      io.to(transfer.senderId).emit('transfer-rejected', { transferId });
      fileTransfers.delete(transferId);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`${socket.username} disconnected`);
    }
    activeUsers.delete(socket.id);

    for (const [transferId, transfer] of fileTransfers.entries()) {
      if (transfer.senderId === socket.id || transfer.recipientId === socket.id) {
        const otherId = transfer.senderId === socket.id ? transfer.recipientId : transfer.senderId;
        io.to(otherId).emit('transfer-cancelled', { transferId });
        fileTransfers.delete(transferId);
      }
    }

    io.emit('users-update', Array.from(activeUsers.values()));
  });
});

// Use dynamic port from Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
