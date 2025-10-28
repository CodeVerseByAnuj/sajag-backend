// import { initializeBackupScheduler, performBackup } from './backup.scheduler.js';
import { initializePrismaBackupScheduler, performPrismaBackup } from './prisma-backup.scheduler.js';

// Initialize all schedulers
export function initializeSchedulers(): void {
  console.log('🎯 Starting Sajag Backend Schedulers...');
  
  try {
    // Initialize Prisma backup scheduler (recommended)
    initializePrismaBackupScheduler();
    
    // Note: pg_dump backup scheduler commented out due to missing PostgreSQL tools
    // initializeBackupScheduler();
    
    console.log('✅ All schedulers initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing schedulers:', error);
  }
}

// Export individual scheduler functions
export {
  // performBackup,
  // initializeBackupScheduler,
  performPrismaBackup,
  initializePrismaBackupScheduler
};