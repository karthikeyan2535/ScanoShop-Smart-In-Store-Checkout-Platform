const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

// Helper events
const emitInventoryUpdate = (productId, availableStock, reservedStock) => {
  if (io) {
    io.emit('inventoryUpdated', { productId, availableStock, reservedStock });
  }
};

const emitOrderCreated = (orderId, total) => {
  if (io) {
    io.emit('orderCreated', { orderId, total });
  }
};

const emitAdminUpdate = () => {
  if (io) {
    io.emit('adminUpdate'); // Simple ping to tell admin dashboard to refresh stats
  }
};

module.exports = { initSocket, getIo, emitInventoryUpdate, emitOrderCreated, emitAdminUpdate };
