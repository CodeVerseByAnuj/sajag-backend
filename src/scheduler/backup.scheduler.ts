import { exec } from "child_process";
import cron from "node-cron";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// ==== CONFIG ====
// Parse DATABASE_URL or use individual environment variables
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    // Parse DATABASE_URL: postgresql://user:password@host:port/database
    const url = new URL(databaseUrl);
    return {
      user: url.username || "postgres",
      host: url.hostname || "localhost",
      database: url.pathname.slice(1) || "postgres", // Remove leading slash
      password: decodeURIComponent(url.password || "your_password"),
      port: parseInt(url.port) || 5432,
    };
  }
  
  // Fallback to individual environment variables
  return {
    user: process.env.DATABASE_USER || "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    database: process.env.DATABASE_NAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "your_password",
    port: process.env.DATABASE_PORT || 5432,
  };
};

const DB_CONFIG = getDatabaseConfig();

const BACKUP_DIR = path.join(process.cwd(), "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const EMAIL_CONFIG = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || process.env.BACKUP_EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || process.env.BACKUP_EMAIL_PASSWORD || "your-app-password",
  },
};

const RECEIVER_EMAIL = process.env.BACKUP_RECEIVER_EMAIL || process.env.EMAIL_USER || "receiver@example.com";

// ==== FUNCTION: Create Database Backup ====
async function createDatabaseBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `sajag_backup_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  // PostgreSQL dump command (Windows PowerShell compatible)
  const isWindows = process.platform === 'win32';
  let dumpCmd;
  
  if (isWindows) {
    // For Windows, set PGPASSWORD as environment variable in the same command
    dumpCmd = `$env:PGPASSWORD="${DB_CONFIG.password}"; pg_dump -h ${DB_CONFIG.host} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -F p -f "${filePath}"`;
  } else {
    // For Unix-like systems
    dumpCmd = `PGPASSWORD=${DB_CONFIG.password} pg_dump -h ${DB_CONFIG.host} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -F p -f "${filePath}"`;
  }

  try {
    // Execute command with appropriate shell
    const execOptions = isWindows ? { shell: 'powershell.exe' } : {};
    const { stdout, stderr } = await execAsync(dumpCmd, execOptions);
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn("Backup warnings:", stderr);
    }
    
    console.log(`✅ Backup created successfully: ${fileName}`);
    return filePath;
  } catch (error) {
    console.error("❌ Backup creation failed:", error);
    throw error;
  }
}

// ==== FUNCTION: Send Email with Backup ====
async function sendBackupEmail(filePath: string): Promise<void> {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  const fileName = path.basename(filePath);
  
  const mailOptions = {
    from: EMAIL_CONFIG.auth.user,
    to: RECEIVER_EMAIL,
    subject: `📧 Daily PostgreSQL Backup - ${new Date().toLocaleDateString()}`,
    html: `
      <h2>Daily Database Backup</h2>
      <p>Hello,</p>
      <p>Please find attached the daily PostgreSQL backup for Sajag Backend.</p>
      <p><strong>Backup Details:</strong></p>
      <ul>
        <li>Database: ${DB_CONFIG.database}</li>
        <li>Created: ${new Date().toLocaleString()}</li>
        <li>File: ${fileName}</li>
      </ul>
      <p>Best regards,<br>Sajag Backend System</p>
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
    console.log(`✅ Backup email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
}

// ==== FUNCTION: Clean Old Backups ====
function cleanOldBackups(daysToKeep: number = 7): void {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    });
  } catch (error) {
    console.error("❌ Error cleaning old backups:", error);
  }
}

// ==== MAIN BACKUP FUNCTION ====
export async function performBackup(): Promise<void> {
  console.log("🚀 Starting backup process...");
  
  try {
    // Create database backup
    const backupPath = await createDatabaseBackup();
    
    // Send email with backup
    await sendBackupEmail(backupPath);
    
    // Clean old backups (keep last 7 days)
    cleanOldBackups(7);
    
    console.log("✅ Backup process completed successfully!");
  } catch (error) {
    console.error("❌ Backup process failed:", error);
  }
}

// ==== CRON SCHEDULE ====
export function initializeBackupScheduler(): void {
  console.log("📅 Initializing backup scheduler...");
  
  // Schedule backup daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("⏰ Running scheduled backup at", new Date().toLocaleString());
    await performBackup();
  }, {
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });

  // Schedule cleanup weekly (Sunday at 3:00 AM)
  cron.schedule("0 3 * * 0", () => {
    console.log("🧹 Running weekly cleanup...");
    cleanOldBackups(7);
  }, {
    timezone: "Asia/Kolkata"
  });

  console.log("✅ Backup scheduler initialized!");
  console.log("📋 Scheduled tasks:");
  console.log("  - Daily backup: Every day at 2:00 AM");
  console.log("  - Weekly cleanup: Every Sunday at 3:00 AM");
}

// Manual backup function for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  performBackup();
}