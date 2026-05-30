require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

// Check if clustering is enabled
const enableCluster = process.env.ENABLE_CLUSTER === 'true';
const isPrimary = cluster.isPrimary || cluster.isMaster;

if (enableCluster && isPrimary) {
  const { setupMaster } = require('@socket.io/sticky');
  const { setupPrimary } = require('@socket.io/cluster-adapter');

  const httpServer = http.createServer();
  const PORT = process.env.PORT || 5000;

  // Setup sticky sessions on the master process
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection', // Options: 'round-robin', 'least-connection'
  });

  // Setup communication channel between master and workers for Socket.io
  setupPrimary();

  // Configure advanced serialization to handle Socket.io binary buffers safely in Node.js 16+
  const setupPrimaryFn = cluster.setupPrimary || cluster.setupMaster;
  if (typeof setupPrimaryFn === 'function') {
    setupPrimaryFn({
      serialization: 'advanced',
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 DevCollab Load Balancer running on port ${PORT}`);
    console.log(`🔥 Clustering enabled: Scaling across ${numCPUs} CPU worker processes`);
  });

  // Fork worker processes
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker process ${worker.process.pid} died (code: ${code}, signal: ${signal}). Forking a new one...`);
    cluster.fork();
  });
} else {
  // Worker process or Single-Instance mode
  const connectDB = require('./src/config/db');
  const { setupSocket } = require('./src/socket');
  const errorHandler = require('./src/middleware/errorHandler');

  const authRoutes = require('./src/routes/authRoutes');
  const workspaceRoutes = require('./src/routes/workspaceRoutes');
  const projectRoutes = require('./src/routes/projectRoutes');
  const notificationRoutes = require('./src/routes/notificationRoutes');
  const snippetRoutes = require('./src/routes/snippetRoutes');
  const aiRoutes = require('./src/routes/aiRoutes');
  const analyticsRoutes = require('./src/routes/analyticsRoutes');
  const meetingRoutes = require('./src/routes/meetingRoutes');

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  connectDB();

  // If clustering is enabled, attach the cluster adapter and sticky worker
  if (enableCluster) {
    const { createAdapter } = require('@socket.io/cluster-adapter');
    const { setupWorker } = require('@socket.io/sticky');
    
    // Connect worker adapter to handle cross-worker messaging/room broadcasts
    io.adapter(createAdapter());
    
    // Wire up connection forwarding from primary process
    setupWorker(io);
  }

  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : 500,
  });
  app.use('/api', limiter);

  app.set('io', io);

  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/workspaces/:workspaceId/projects', projectRoutes);
  app.use('/api/workspaces/:workspaceId/snippets', snippetRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/workspaces/:workspaceId/meetings', meetingRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      version: '1.0.1-fix-missing-schemas',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      cluster: enableCluster ? { workerId: cluster.worker.id, pid: process.pid } : 'disabled',
    });
  });

  app.use(errorHandler);

  setupSocket(io);

  // If clustering is NOT enabled, the server listens directly on the PORT.
  // If clustering IS enabled, setupWorker(io) handles connection receiving automatically.
  if (!enableCluster) {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n🚀 DevCollab Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
    });
  } else {
    console.log(`👷 Worker process ${process.pid} started and listening via IPC load balancer`);
  }

  module.exports = app;
}

