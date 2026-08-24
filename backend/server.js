require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { Message } = require('./models');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Connect to Cloud Database
connectDB();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Default Route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Exchange API is running!' });
});

// Configure Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User joins a private chat room
  socket.on('joinRoom', ({ chatId }) => {
    socket.join(chatId);
    console.log(`👤 User joined room: ${chatId}`);
  });

  // User sends a message
  socket.on('sendMessage', async ({ chatId, sender, recipient, text }) => {
    try {
      if (!chatId || !sender || !recipient || !text) {
        return;
      }

      // Save message in database
      const msg = await Message.create({
        chatId,
        sender,
        recipient,
        text,
        timestamp: new Date()
      });

      // Emit message to everyone in the room
      io.to(chatId).emit('message', msg);
      
      // Also emit a general notification for conversational triggers
      io.emit(`unreadNotify_${recipient}`, {
        chatId,
        sender,
        text
      });

      console.log(`💬 Message sent in room ${chatId}: ${text.substring(0, 30)}...`);
    } catch (err) {
      console.error('Socket sendMessage error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server listening on port ${PORT}`);
  console.log(`📍 REST endpoint: http://localhost:${PORT}`);
  console.log(`📍 WebSockets: ws://localhost:${PORT}\n`);
});
