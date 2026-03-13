const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { authenticateSocket } = require('../middleware/auth');

let io;

const initSocket = (server) => {
  const rawOrigins = String(process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || '').trim();
  const allowedOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!allowedOrigins.includes('https://animex-psi.vercel.app')) {
    allowedOrigins.push('https://animex-psi.vercel.app');
  }

  io = new Server(server, {
    // Allow both transports — WebSocket preferred, polling as fallback
    transports: ['websocket', 'polling'],
    // Increase ping timeout to handle slow connections
    pingTimeout: 20000,
    pingInterval: 25000,
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (!allowedOrigins.length) return callback(null, true); // dev: allow all
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware — non-fatal: unauthenticated sockets get no user room but don't crash
  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticateSocket(socket.handshake);
    } catch {
      // Allow the connection but mark as unauthenticated
      socket.data.user = null;
    }
    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data?.user?.id;

    // Only join a user room if authenticated
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket connected: ${socket.id}`, { userId });
    } else {
      logger.info(`Socket connected (unauthenticated): ${socket.id}`);
    }

    socket.on('subscribe', () => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info('User joined notification room', { userId });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`, { userId });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
