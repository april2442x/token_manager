# Railway Deployment Guide

Complete guide to deploy the License Key Validation API on Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Git repository (GitHub, GitLab, or Bitbucket)
- Railway CLI (optional but recommended)

## Method 1: Deploy via Railway Dashboard (Easiest)

### Step 1: Push to Git Repository

```bash
git init
git add .
git commit -m "Initial commit: License Key Validation API"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL Database

1. In your project dashboard, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. The `DATABASE_URL` environment variable is automatically set

### Step 4: Configure Environment Variables

1. Click on your service (not the database)
2. Go to "Variables" tab
3. Add the following variables:

```
JWT_SECRET=your-super-secret-production-key-change-this
NODE_ENV=production
```

Note: `DATABASE_URL` and `PORT` are automatically set by Railway.

### Step 5: Deploy

Railway will automatically deploy your application. Watch the build logs in the "Deployments" tab.

### Step 6: Run Database Migrations

1. Go to your service settings
2. Click "Settings" → "Deploy"
3. Under "Build Command", it should be: `npm install && npx prisma generate`
4. Under "Start Command", it should be: `npx prisma migrate deploy && npm start`

Or manually run migrations:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Run migrations: `railway run npx prisma migrate deploy`

### Step 7: Seed Database (Optional)

```bash
railway run npm run prisma:seed
```

Save the license keys output for testing!

### Step 8: Get Your URL

1. Go to "Settings" tab
2. Click "Generate Domain" under "Networking"
3. Your API will be available at: `https://your-app.railway.app`

### Step 9: Test Your Deployment

```bash
# Health check
curl https://your-app.railway.app/api/health

# Activate license (use key from seed)
curl -X POST https://your-app.railway.app/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_LICENSE_KEY","device_id":"test-device"}'
```

---

## Method 2: Deploy via Railway CLI

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

This will open your browser for authentication.

### Step 3: Initialize Project

```bash
railway init
```

Follow the prompts to create a new project or link to an existing one.

### Step 4: Add PostgreSQL

```bash
railway add
```

Select "PostgreSQL" from the list.

### Step 5: Set Environment Variables

```bash
railway variables set JWT_SECRET="your-production-secret-key"
railway variables set NODE_ENV="production"
```

### Step 6: Deploy

```bash
railway up
```

This will:
- Upload your code
- Install dependencies
- Build the application
- Start the server

### Step 7: Run Migrations

```bash
railway run npx prisma migrate deploy
```

### Step 8: Seed Database (Optional)

```bash
railway run npm run prisma:seed
```

### Step 9: Get Domain

```bash
railway domain
```

Or create one:
```bash
railway domain create
```

---

## Method 3: Deploy via GitHub Actions (CI/CD)

### Step 1: Get Railway Token

1. Go to https://railway.app/account/tokens
2. Create a new token
3. Copy the token

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add new secret: `RAILWAY_TOKEN` with your token value

### Step 3: Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add Railway deployment workflow"
git push
```

Now every push to `main` will automatically deploy to Railway!

---

## Configuration Files

Railway automatically detects Node.js projects, but you can customize with these files:

### Procfile (Optional)
```
web: npx prisma migrate deploy && npm start
```

### nixpacks.toml (Optional)
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm install", "npx prisma generate"]

[phases.build]
cmds = []

[start]
cmd = "npx prisma migrate deploy && npm start"
```

---

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Auto-set by Railway |
| `JWT_SECRET` | Secret key for JWT signing | Yes | None |
| `PORT` | Server port | No | Auto-set by Railway |
| `NODE_ENV` | Environment mode | No | production |

---

## Monitoring & Logs

### View Logs
```bash
railway logs
```

Or in the dashboard:
1. Go to your service
2. Click "Deployments"
3. Click on a deployment
4. View logs in real-time

### View Metrics
1. Go to your service
2. Click "Metrics" tab
3. View CPU, Memory, Network usage

### Database Management

Access your database:
```bash
railway connect postgres
```

Or use Prisma Studio:
```bash
railway run npx prisma studio
```

---

## Troubleshooting

### Build Fails

Check build logs:
```bash
railway logs --deployment
```

Common issues:
- Missing dependencies: Run `npm install` locally first
- Prisma Client not generated: Add `npx prisma generate` to build command

### Database Connection Issues

Verify DATABASE_URL:
```bash
railway variables
```

Test connection:
```bash
railway run npx prisma db pull
```

### Migration Fails

Reset and re-run:
```bash
railway run npx prisma migrate reset
railway run npx prisma migrate deploy
```

### Application Crashes

Check logs:
```bash
railway logs --tail
```

Common issues:
- Missing JWT_SECRET
- Database not ready (add retry logic)
- Port binding (Railway sets PORT automatically)

---

## Scaling & Performance

### Vertical Scaling
1. Go to service settings
2. Click "Resources"
3. Upgrade to a higher plan for more CPU/RAM

### Horizontal Scaling
Railway supports horizontal scaling on Pro plans:
1. Go to service settings
2. Enable "Replicas"
3. Set number of instances

### Database Optimization

1. Add indexes for frequently queried fields
2. Use connection pooling (Prisma handles this)
3. Monitor slow queries in Railway metrics

---

## Cost Optimization

### Free Tier Limits
- $5 free credit per month
- Shared CPU/RAM
- 1GB storage per database

### Tips to Stay in Free Tier
1. Use sleep mode for dev environments
2. Delete unused deployments
3. Optimize database queries
4. Use caching where possible

### Upgrade When Needed
- Pro plan: $20/month
- Dedicated resources
- Better performance
- Priority support

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` to Git
- Use strong JWT_SECRET (32+ characters)
- Rotate secrets regularly

### 2. Database Security
- Railway PostgreSQL is private by default
- Use SSL connections (enabled by default)
- Regular backups (automatic on Railway)

### 3. API Security
- Rate limiting is already implemented
- Monitor usage logs for suspicious activity
- Consider adding API key authentication

### 4. HTTPS
- Railway provides HTTPS automatically
- All traffic is encrypted
- Free SSL certificates

---

## Backup & Recovery

### Database Backups

Railway automatically backs up PostgreSQL databases.

Manual backup:
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

Restore:
```bash
railway run psql $DATABASE_URL < backup.sql
```

### Code Backups

Use Git for version control:
```bash
git tag v1.0.0
git push --tags
```

---

## Custom Domain

### Add Custom Domain

1. Go to service settings
2. Click "Networking"
3. Add custom domain
4. Update DNS records:

```
Type: CNAME
Name: api (or @)
Value: your-app.railway.app
```

5. Wait for DNS propagation (5-30 minutes)

### SSL Certificate

Railway automatically provisions SSL certificates for custom domains.

---

## Monitoring & Alerts

### Set Up Alerts

1. Go to project settings
2. Click "Integrations"
3. Add webhook for deployment notifications
4. Configure Slack/Discord/Email alerts

### Health Checks

Railway automatically monitors your service. Add custom health checks:

```javascript
// In your app
app.get('/health', (req, res) => {
  // Check database connection
  // Check external services
  res.json({ status: 'healthy' });
});
```

---

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Run migrations
3. ✅ Seed test data
4. ✅ Test API endpoints
5. 🔄 Set up custom domain
6. 🔄 Configure monitoring
7. 🔄 Add admin endpoints
8. 🔄 Implement analytics
9. 🔄 Set up CI/CD
10. 🔄 Add documentation site

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- API Issues: Check your repository issues

## Useful Commands

```bash
# View all variables
railway variables

# Open service in browser
railway open

# Connect to database
railway connect postgres

# View service status
railway status

# Restart service
railway restart

# Delete service
railway delete
```

---

Happy deploying! 🚀
