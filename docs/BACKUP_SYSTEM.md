# Database Backup System

This system provides automated daily database backups with email notifications for the Sajag Backend application.

## Features

- 🕐 **Automated Daily Backups**: Runs every day at 2:00 AM IST
- 📧 **Email Notifications**: Sends backup files via email
- 🗑️ **Automatic Cleanup**: Removes backups older than 7 days
- 🔧 **Manual Backup**: Run backups manually anytime
- ⚙️ **Environment Configuration**: Fully configurable via environment variables

## Setup

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Database Backup Configuration
DATABASE_USER=postgres
DATABASE_HOST=your_host
DATABASE_NAME=your_database
DATABASE_PASSWORD=your_password
DATABASE_PORT=5432
BACKUP_EMAIL_USER=your-email@gmail.com
BACKUP_EMAIL_PASSWORD=your-app-password
BACKUP_RECEIVER_EMAIL=receiver@email.com
```

### 2. Prerequisites

Make sure you have:
- PostgreSQL client tools installed (`pg_dump` command)
- Gmail App Password for email authentication
- Node.js with required dependencies

### 3. Dependencies

The backup system uses:
- `node-cron` - Task scheduling
- `nodemailer` - Email functionality
- `child_process` - Running pg_dump commands

## Usage

### Automatic Backups

The system automatically starts when your application runs and schedules:
- **Daily Backup**: Every day at 2:00 AM IST
- **Weekly Cleanup**: Every Sunday at 3:00 AM IST

### Manual Backup

Run a backup manually anytime:

```bash
npm run backup
```

### Backup Files

- Stored in: `./backups/` directory
- Format: `sajag_backup_YYYY-MM-DDTHH-mm-ss-sssZ.sql`
- Retention: 7 days (automatically cleaned up)

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
3. Use the generated password in `BACKUP_EMAIL_PASSWORD`

## Monitoring

The system provides comprehensive logging:
- ✅ Successful operations
- ❌ Error messages
- 🗑️ Cleanup activities
- ⏰ Scheduled task executions

## Troubleshooting

### Common Issues

1. **pg_dump command not found**
   - Install PostgreSQL client tools
   - Ensure pg_dump is in your PATH

2. **Email authentication failed**
   - Use Gmail App Password (not regular password)
   - Check email credentials in .env file

3. **Database connection failed**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is running

### Log Messages

- `✅` = Success
- `❌` = Error
- `🗑️` = File cleanup
- `⏰` = Scheduled execution
- `🚀` = Process start

## File Structure

```
src/
├── scheduler/
│   ├── index.ts           # Main scheduler initialization
│   └── backup.scheduler.ts # Backup functionality
scripts/
└── manual-backup.ts       # Manual backup script
backups/                   # Generated backup files
```

## Security Notes

- Database passwords are read from environment variables
- Email credentials use App Passwords
- Backup files are automatically cleaned up
- No sensitive data is logged

## Support

For issues or questions, check the application logs for detailed error messages.