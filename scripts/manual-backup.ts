#!/usr/bin/env tsx

/**
 * Manual Database Backup Script
 * Run this script manually to create and send a database backup
 * Usage: npm run backup
 */

import { performPrismaBackup } from '../src/scheduler/prisma-backup.scheduler.js';

console.log('🚀 Manual Prisma Database Backup Started');
console.log('=========================================');

performPrismaBackup()
  .then(() => {
    console.log('=====================================');
    console.log('✅ Manual backup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('=====================================');
    console.error('❌ Manual backup failed:', error);
    process.exit(1);
  });