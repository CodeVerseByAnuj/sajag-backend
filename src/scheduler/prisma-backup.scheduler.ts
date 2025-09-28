import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// ==== CONFIG ====
const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
};

// Support multiple receiver emails (comma-separated)
const RECEIVER_EMAIL = process.env.BACKUP_RECEIVER_EMAIL || process.env.EMAIL_USER || 'receiver@example.com';
const RECEIVER_EMAILS = RECEIVER_EMAIL.split(',').map(email => email.trim());

// ==== FUNCTION: Create Database Backup using Prisma ====
async function createPrismaBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `sajag_prisma_backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  try {
    console.log('📊 Starting Prisma-based backup...');
    
    let sqlContent = `-- Sajag Database Backup
-- Created: ${new Date().toISOString()}
-- Database: Prisma Connected Database
-- =====================================

`;

    // Get all table data using Prisma (only existing tables)
    const tables = ['users', 'customers', 'orders', 'items', 'payments', 'interest_history'];
    
    for (const tableName of tables) {
      try {
        console.log(`📋 Backing up table: ${tableName}`);
        
        // Use Prisma's raw query to get data with proper SQL syntax
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);
        
        if (Array.isArray(data) && data.length > 0) {
          sqlContent += `\n-- Table: ${tableName}\n`;
          sqlContent += `-- Records: ${data.length}\n`;
          
          // Convert each record to INSERT statement
          for (const record of data) {
            const columns = Object.keys(record).join(', ');
            const values = Object.values(record).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            }).join(', ');
            
            sqlContent += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
          }
          sqlContent += '\n';
        }
      } catch (tableError: any) {
        console.warn(`⚠️ Could not backup table ${tableName}:`, tableError?.message || tableError);
        sqlContent += `-- Error backing up table ${tableName}: ${tableError?.message || tableError}\n`;
      }
    }

    // Write backup file
    fs.writeFileSync(filePath, sqlContent, 'utf8');
    console.log(`✅ Prisma backup created successfully: ${fileName}`);
    
    return filePath;
  } catch (error) {
    console.error('❌ Prisma backup creation failed:', error);
    throw error;
  }
}

// ==== FUNCTION: Create Simple Schema Backup ====
async function createSchemaBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `sajag_schema_backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  try {
    console.log('📋 Creating schema backup...');
    
    // Read your Prisma schema file
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = '';
    
    if (fs.existsSync(schemaPath)) {
      schemaContent = fs.readFileSync(schemaPath, 'utf8');
    }

    const sqlContent = `-- Sajag Database Schema Backup
-- Created: ${new Date().toISOString()}
-- Source: Prisma Schema
-- =====================================

${schemaContent}

-- Database Connection Info (for reference):
-- URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@') : 'Not configured'}
-- Created via Prisma backup system
`;

    fs.writeFileSync(filePath, sqlContent, 'utf8');
    console.log(`✅ Schema backup created: ${fileName}`);
    
    return filePath;
  } catch (error) {
    console.error('❌ Schema backup failed:', error);
    throw error;
  }
}

// ==== FUNCTION: Send Email with Backup ====
async function sendBackupEmail(filePath: string): Promise<void> {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const fileSize = (stats.size / 1024).toFixed(2); // KB
  
  const mailOptions = {
    from: EMAIL_CONFIG.auth.user,
    to: RECEIVER_EMAILS.join(','), // Support multiple emails
    subject: `📧 Sajag Database Backup - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📊 Sajag Database Backup</h2>
        <p>Hello,</p>
        <p>Please find attached the database backup for Sajag Backend system.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #374151;">Backup Details:</h3>
          <ul style="margin-bottom: 0;">
            <li><strong>File:</strong> ${fileName}</li>
            <li><strong>Size:</strong> ${fileSize} KB</li>
            <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Type:</strong> Prisma-based backup</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This backup was automatically generated by the Sajag Backend system. 
          Please store it securely for data recovery purposes.
        </p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          Best regards,<br>
          Sajag Backend System<br>
          Generated on ${new Date().toLocaleString()}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        path: filePath,
        contentType: 'application/sql'
      }
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Backup email sent successfully!`);
    console.log(`📧 Email ID: ${info.messageId}`);
    console.log(`📮 Sent to: ${RECEIVER_EMAILS.join(', ')}`);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error?.message || error);
    throw error;
  }
}

// ==== FUNCTION: Clean Old Backups ====
function cleanOldBackups(daysToKeep: number = 7): void {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate && file.includes('backup')) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
    } else {
      console.log(`ℹ️ No old backups to clean`);
    }
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
  }
}

// ==== MAIN BACKUP FUNCTION ====
export async function performPrismaBackup(): Promise<void> {
  console.log('🚀 Starting Prisma backup process...');
  
  try {
    // Create backups
    const schemaBackupPath = await createSchemaBackup();
    
    // Try to create data backup (might fail if tables don't exist)
    let dataBackupPath: string | null = null;
    try {
      dataBackupPath = await createPrismaBackup();
    } catch (error: any) {
      console.warn('⚠️ Data backup failed, sending schema backup only:', error?.message || error);
    }

    // Send email with the most complete backup available
    const backupToSend = dataBackupPath || schemaBackupPath;
    await sendBackupEmail(backupToSend);
    
    // Clean old backups (keep last 7 days)
    cleanOldBackups(7);
    
    console.log('✅ Prisma backup process completed successfully!');
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ==== CRON SCHEDULE ====
export function initializePrismaBackupScheduler(): void {
  console.log('📅 Initializing Prisma backup scheduler...');
  
  // Schedule backup daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled Prisma backup at', new Date().toLocaleString());
    await performPrismaBackup();
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Schedule cleanup weekly (Sunday at 3:00 AM)
  cron.schedule('0 3 * * 0', () => {
    console.log('🧹 Running weekly cleanup...');
    cleanOldBackups(7);
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✅ Prisma backup scheduler initialized!');
  console.log('📋 Scheduled tasks:');
  console.log('  - Daily backup: Every day at 2:00 AM');
  console.log('  - Weekly cleanup: Every Sunday at 3:00 AM');
}

// Manual backup function for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  performPrismaBackup();
}