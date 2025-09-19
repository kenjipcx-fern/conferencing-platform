import { Router } from 'express';
import { checkDatabaseConnection } from '../db/connection';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: dbConnected ? 'connected' : 'disconnected',
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Return 503 if database is not connected
    const statusCode = dbConnected ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbConnected ? 'healthy' : 'unhealthy',
          responseTime: Date.now(), // This would be measured in a real implementation
        },
        memory: {
          status: 'healthy',
          usage: process.memoryUsage(),
          limit: '1GB', // Would be configurable
        },
        uptime: {
          status: 'healthy',
          seconds: Math.floor(process.uptime()),
          started: new Date(Date.now() - process.uptime() * 1000).toISOString(),
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Detailed health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
