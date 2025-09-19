import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { checkDatabaseConnection, closeDatabaseConnection } from './db/connection';
import { SocketService } from './services/socketService';
import healthRouter from './routes/health';
import sessionsRouter from './routes/sessions';
import questionsRouter from './routes/questions';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow WebRTC connections
  contentSecurityPolicy: false, // Will configure later for production
}));

// CORS configuration for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with actual domain
    : [
        'http://localhost:3000', 
        'http://localhost:3001',
        'https://frontend-morphvm-iedjmk0z.http.cloud.morph.so',
        'https://backend-morphvm-iedjmk0z.http.cloud.morph.so'
      ],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', questionsRouter);

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Conferencing Platform API',
    version: '1.0.0',
    description: 'Backend API for WebRTC conferencing platform',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth (coming soon)',
      sessions: '/api/sessions (coming soon)',
      attendees: '/api/attendees (coming soon)',
      questions: '/api/questions (coming soon)',
    },
    websocket: 'ws://localhost:3001/socket.io (coming soon)',
    webrtc: 'WebRTC signaling server (coming soon)',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_routes: ['/api', '/api/health'],
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Server error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
async function startServer() {
  try {
    // Check database connection
    console.log('🔄 Checking database connection...');
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - server starting anyway');
    }

    server.listen(PORT, () => {
      console.log(`
🚀 Server running successfully!

🌐 API URL: http://localhost:${PORT}/api
🏥 Health: http://localhost:${PORT}/api/health
🐳 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📝 Logs: ${process.env.NODE_ENV === 'production' ? 'combined' : 'dev'}

Ready to handle requests! 🎉
      `);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
