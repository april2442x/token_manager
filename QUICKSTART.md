# Quick Start Guide

## Option 1: Local Development (Recommended for Testing)

### Prerequisites
- Node.js 20+ installed
- PostgreSQL 14+ installed and running

### Steps

1. Install dependencies:
```bash
npm install
```

2. Set up your database:
```bash
# Make sure PostgreSQL is running
# Create database (if needed)
createdb license_db

# Or using psql
psql -U postgres -c "CREATE DATABASE license_db;"
```

3. Configure environment:
```bash
# .env file is already created with default values
# Update DATABASE_URL if your PostgreSQL credentials are different
```

4. Run migrations:
```bash
npm run prisma:migrate
```

5. Seed the database (creates test licenses):
```bash
npm run prisma:seed
```

This will output test license keys like:
```
License 1 (3 devices, expires in 1 year):
  Key: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
  Expires: 2027-04-12T00:00:00.000Z
```

6. Start the server:
```bash
npm run dev
```

7. Test the API:
```bash
# Health check
curl http://localhost:3000/api/health

# Activate a license (use the key from seed output)
curl -X POST http://localhost:3000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6","device_id":"my-laptop-001"}'
```

## Option 2: Docker Compose (Easiest)

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. Start everything:
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL
- Build and start the API
- Run migrations automatically

2. Check logs:
```bash
docker-compose logs -f api
```

3. Test the API:
```bash
curl http://localhost:3000/api/health
```

4. Seed the database:
```bash
docker-compose exec api npm run prisma:seed
```

5. Stop everything:
```bash
docker-compose down
```

## Option 3: Deploy to Railway

### Prerequisites
- Railway account (free tier available)
- Railway CLI installed

### Steps

1. Login to Railway:
```bash
npx @railway/cli login
```

2. Create new project:
```bash
npx @railway/cli init
```

3. Add PostgreSQL:
```bash
npx @railway/cli add
# Select PostgreSQL from the list
```

4. Set environment variables:
```bash
npx @railway/cli variables set JWT_SECRET="your-production-secret-key-here"
```

5. Deploy:
```bash
npx @railway/cli up
```

6. Run migrations:
```bash
npx @railway/cli run npm run prisma:deploy
```

7. Seed database (optional):
```bash
npx @railway/cli run npm run prisma:seed
```

8. Get your URL:
```bash
npx @railway/cli domain
```

Your API will be available at: `https://your-app.railway.app`

## Testing the API

### 1. Health Check
```bash
curl https://your-api-url/api/health
```

### 2. Activate License
```bash
curl -X POST https://your-api-url/api/activate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "YOUR_LICENSE_KEY",
    "device_id": "device-123"
  }'
```

Expected response:
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "max_devices": 3,
  "device_count": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Validate License
```bash
curl -X POST https://your-api-url/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "YOUR_LICENSE_KEY",
    "device_id": "device-123"
  }'
```

### 4. Deactivate Device
```bash
curl -X POST https://your-api-url/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "YOUR_LICENSE_KEY",
    "device_id": "device-123"
  }'
```

## Useful Commands

```bash
# View database in browser
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:deploy

# Seed database
npm run prisma:seed

# Start development server
npm run dev

# Start production server
npm start
```

## Troubleshooting

### Database connection issues
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -U postgres -l`

### Port already in use
- Change PORT in .env file
- Or kill the process using port 3000

### Prisma Client not generated
```bash
npm run prisma:generate
```

### Migration issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Next Steps

1. Create your own license keys programmatically
2. Integrate with your application
3. Set up monitoring and logging
4. Configure backup for PostgreSQL
5. Add admin endpoints for license management
6. Implement webhook notifications
7. Add analytics dashboard

## Support

For issues or questions, check:
- README.md for detailed documentation
- Prisma docs: https://www.prisma.io/docs
- Express docs: https://expressjs.com
- Railway docs: https://docs.railway.app
