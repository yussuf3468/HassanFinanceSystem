# 🔐 Supabase Database Backup System

## Overview

Automated nightly backups of your Supabase database using GitHub Actions. Backups run every night at 2:00 AM UTC and are stored as GitHub artifacts for 30 days.

---

## 🚀 Setup Instructions

### Step 1: Get Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Select **Access Tokens**
4. Click **Generate New Token**
5. Give it a name (e.g., "GitHub Backup")
6. Copy the token (you won't see it again!)

### Step 2: Get Supabase Project Details

1. Go to your project in Supabase Dashboard
2. Click on **Settings** → **General**
3. Copy your **Project ID** (also called Reference ID)
4. Go to **Settings** → **Database**
5. Copy or reset your **Database Password**

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these three secrets:

| Secret Name             | Description                | Example            |
| ----------------------- | -------------------------- | ------------------ |
| `SUPABASE_ACCESS_TOKEN` | Your Supabase access token | `sbp_abc123...`    |
| `SUPABASE_PROJECT_ID`   | Your project reference ID  | `abcdefghijklmnop` |
| `SUPABASE_DB_PASSWORD`  | Your database password     | `your-db-password` |

---

## ⚙️ Configuration

### Change Backup Schedule

Edit `.github/workflows/database-backup.yml`:

```yaml
schedule:
  - cron: "0 2 * * *" # Default: 2:00 AM UTC daily
```

Common schedules:

- `'0 2 * * *'` - Every day at 2:00 AM UTC
- `'0 */6 * * *'` - Every 6 hours
- `'0 2 * * 0'` - Every Sunday at 2:00 AM UTC
- `'0 2 1 * *'` - First day of each month at 2:00 AM UTC

### Adjust Retention Period

Change `retention-days` in the workflow:

```yaml
retention-days: 30 # Default: 30 days
# Options: 1-90 days (GitHub Free)
#         1-400 days (GitHub Pro/Team/Enterprise)
```

---

## 📦 What Gets Backed Up

The backup system creates three files:

1. **Schema Backup** (`schema_*.sql`)

   - Database structure
   - Tables, views, functions
   - Indexes and constraints
   - RLS policies

2. **Data Backup** (`data_*.sql`)

   - All table data
   - No schema definitions

3. **Full Backup** (`full_backup_*.sql`)
   - Schema + Data combined
   - Complete database dump

All files are compressed into a single `.tar.gz` archive.

---

## 🔍 Accessing Backups

### Via GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Nightly Database Backup** workflow
4. Click on the latest run
5. Scroll down to **Artifacts**
6. Download `database-backup-YYYY-MM-DD_HH-MM-SS.tar.gz`

### Via GitHub CLI

```bash
# List recent backups
gh run list --workflow=database-backup.yml

# Download latest backup
gh run download --name database-backup-2025-10-14_02-00-00
```

---

## 🔄 Manual Backup

You can trigger a backup manually at any time:

### Via GitHub Web Interface

1. Go to **Actions** tab
2. Click **Nightly Database Backup**
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

### Via GitHub CLI

```bash
gh workflow run database-backup.yml
```

---

## 📊 Backup Report

Each backup includes a detailed report showing:

- Backup timestamp
- Status (success/failure)
- File sizes
- List of backed up components

Download the report artifact: `backup-report-YYYY-MM-DD_HH-MM-SS.md`

---

## 🔧 Restore Database from Backup

### Option 1: Via Supabase Dashboard

1. Download and extract backup file
2. Go to Supabase Dashboard → SQL Editor
3. Copy contents of `full_backup_*.sql`
4. Paste and run the SQL

### Option 2: Via Supabase CLI

```bash
# Extract backup
tar -xzf backup_2025-10-14_02-00-00.tar.gz

# Restore to Supabase
supabase db push --project-id YOUR_PROJECT_ID --password YOUR_PASSWORD < full_backup_2025-10-14_02-00-00.sql
```

### Option 3: Via psql

```bash
# Get connection string from Supabase Dashboard
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres" < full_backup_2025-10-14_02-00-00.sql
```

---

## 🌐 Optional: External Storage

For longer retention or compliance, you can upload backups to cloud storage.

### AWS S3

Uncomment the S3 section in the workflow and add these secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- Update bucket name: `s3://your-backup-bucket/`

### Google Cloud Storage

```yaml
- name: Upload to GCS
  env:
    GCS_BUCKET: ${{ secrets.GCS_BUCKET }}
  run: |
    echo "${{ secrets.GCS_SERVICE_ACCOUNT_KEY }}" > gcs-key.json
    gcloud auth activate-service-account --key-file=gcs-key.json
    gsutil cp backups/backup_${{ env.BACKUP_DATE }}.tar.gz gs://$GCS_BUCKET/
```

### Azure Blob Storage

```yaml
- name: Upload to Azure
  env:
    AZURE_STORAGE_CONNECTION_STRING: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
  run: |
    az storage blob upload --file backups/backup_${{ env.BACKUP_DATE }}.tar.gz \
      --container-name backups --name hassan-bookshop/backup_${{ env.BACKUP_DATE }}.tar.gz
```

---

## 🔔 Optional: Notifications

### Email Notification (via SendGrid)

```yaml
- name: Send email notification
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.sendgrid.net
    server_port: 587
    username: apikey
    password: ${{ secrets.SENDGRID_API_KEY }}
    subject: ❌ Database Backup Failed
    to: yussufhassan3468@gmail.com
    from: backups@hassanbookshop.com
    body: The nightly database backup failed. Check GitHub Actions for details.
```

### Slack Notification

```yaml
- name: Send Slack notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ Database backup failed for Hassan Financial System"
      }
```

### Discord Notification

```yaml
- name: Send Discord notification
  if: failure()
  run: |
    curl -H "Content-Type: application/json" \
      -d '{"content": "❌ Database backup failed! Check GitHub Actions."}' \
      ${{ secrets.DISCORD_WEBHOOK_URL }}
```

---

## 🧪 Testing the Backup

1. **Trigger a manual backup** (see Manual Backup section)
2. **Wait for completion** (~2-5 minutes)
3. **Download the artifact**
4. **Extract and verify**:
   ```bash
   tar -xzf backup_*.tar.gz
   head -n 20 full_backup_*.sql  # Check file contents
   ```
5. **Test restore in a test project** (recommended)

---

## 📋 Backup Checklist

Before relying on automated backups:

- [ ] All GitHub secrets configured correctly
- [ ] Manual backup test successful
- [ ] Backup artifact downloadable
- [ ] Restore test completed successfully
- [ ] Retention period set appropriately
- [ ] Notification system configured (optional)
- [ ] External storage configured (optional)
- [ ] Team members know how to restore from backup

---

## 🚨 Troubleshooting

### Error: "Invalid access token"

- Verify `SUPABASE_ACCESS_TOKEN` is correct
- Token may have expired - generate a new one

### Error: "Project not found"

- Check `SUPABASE_PROJECT_ID` matches your project
- Ensure you're using the Reference ID, not the project name

### Error: "Authentication failed"

- Verify `SUPABASE_DB_PASSWORD` is correct
- Try resetting password in Supabase Dashboard

### Backup file is empty

- Check workflow logs for errors
- Ensure database has data to backup
- Verify Supabase CLI version is compatible

### Artifact not found

- Check workflow run completed successfully
- Artifacts expire after retention period
- Verify artifact name matches date format

---

## 📈 Best Practices

1. **Test Restores Regularly**

   - Monthly restore tests to a development environment
   - Verify data integrity after restore

2. **Monitor Backup Size**

   - Large databases may hit GitHub's limits
   - Consider external storage for large backups

3. **Secure Your Secrets**

   - Never commit secrets to Git
   - Rotate access tokens periodically
   - Use least-privilege access

4. **Document Recovery Procedures**

   - Keep restore instructions accessible
   - Train team members on recovery process

5. **Multiple Backup Locations**
   - GitHub artifacts (short-term)
   - Cloud storage (long-term)
   - Local copies (critical backups)

---

## 📞 Support

**Issues with this backup system?**

- Check workflow logs in GitHub Actions
- Review Supabase CLI documentation
- Contact: yussufhassan3468@gmail.com

**Supabase Support:**

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

---

## 📚 Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated:** October 14, 2025  
**Version:** 1.0.0
