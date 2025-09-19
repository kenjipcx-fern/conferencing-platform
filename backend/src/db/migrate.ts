import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, checkDatabaseConnection } from './connection';

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    // Run migrations
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
