# License Key Validation API

A production-ready License Key Validation API built with Node.js, Express, PostgreSQL, and Prisma ORM.

## Features

- ✅ License key management with secure hashing (bcrypt)
- ✅ Device binding with configurable limits
- ✅ License expiration handling
- ✅ JWT-signed API responses
- ✅ Rate limiting protection
- ✅ Usage logging
- ✅ PostgreSQL database with Prisma ORM
- ✅ Docker support
- ✅ Railway deployment ready

## Tech Stack

- Node.js (LTS)
- Express.js
- PostgreSQL
- Prisma ORM
- JWT (jsonwebtoken)
- bcrypt for hashing
- express-rate-limit

## Project Structure

```
├── src/
│   ├── controllers/
│   │   └── licenseController.js
│   ├── services/
│   │   └── licenseService.js
│   ├── middleware/
│   │   └── rateLimiter.js
│   ├── routes/
│   │   └── index.js
│   ├── utils/
│   │   ├── crypto.js
│   │   └── jwt.js
│   ├── app.js
│   └── server.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── Dockerfile
├── .env.example
└── package.json
```

## Database Schema

### User
- `id` (UUID, primary key)
- `email` (unique)
- `created_at` (timestamp)

### License
- `id` (UUID, primary key)
- `key` (unique, hashed with bcrypt)
- `user_id` (foreign key)
- `max_devices` (integer, default: 3)
- `expires_at` (timestamp, nullable)
- `created_at` (timestamp)

### Device
- `id` (UUID, primary key)
- `license_id` (foreign key)
- `device_id` (hashed with SHA256)
- `created_at` (timestamp)

### UsageLog
- `id` (UUID, primary key)
- `license_id` (foreign key)
- `device_id` (string)
- `ip` (string)
- `created_at` (timestamp)

## API Endpoints

### POST /api/activate
Activate a license for a device.

**Required Headers:**
- `Content-Type: application/json`
- `X-API-Key: your-api-key`
- `X-Signature: hmac-sha256-signature`
- `X-Timestamp: unix-timestamp-ms`
- `X-Nonce: unique-uuid`

**Request:**
```json
{
  "key": "YOUR_LICENSE_KEY",
  "device_id": "unique-device-identifier"
}
```

**Example with Signature:**
```javascript
const crypto = require('crypto');

const timestamp = Date.now();
const nonce = crypto.randomUUID();
const body = { key: 'LICENSE_KEY', device_id: 'device-123' };
const secret = 'your-signature-secret';

const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

fetch('http://localhost:3000/api/activate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
  },
  body: JSON.stringify(body),
});
```

**Response (Success):**
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "max_devices": 3,
  "device_count": 1,
  "token": "jwt-signed-token"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Device limit reached",
  "max_devices": 3
}
```

### POST /api/validate
Validate an existing license and device.

**Request:**
```json
{
  "key": "YOUR_LICENSE_KEY",
  "device_id": "unique-device-identifier"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "token": "jwt-signed-token"
}
```

### POST /api/deactivate
Remove a device from a license.

**Request:**
```json
{
  "key": "YOUR_LICENSE_KEY",
  "device_id": "unique-device-identifier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device deactivated successfully"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T10:30:00.000Z"
}
```

## Local Development

### Prerequisites
- Node.js 20+ (LTS)
- PostgreSQL 14+
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd license-key-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/license_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
NODE_ENV=development
```

4. Run database migrations
```bash
npx prisma migrate dev --name init
```

5. Seed the database (optional)
```bash
npx prisma db seed
```

This will create test licenses and display the keys in the console.

6. Start the development server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Production Deployment

### Deploy to Railway

1. Install Railway CLI
```bash
npm install -g @railway/cli
```

2. Login to Railway
```bash
railway login
```

3. Create a new project
```bash
railway init
```

4. Add PostgreSQL database
```bash
railway add
# Select PostgreSQL
```

5. Set environment variables
```bash
railway variables set JWT_SECRET="your-production-secret-key"
```

6. Deploy
```bash
railway up
```

Railway will automatically:
- Detect your Node.js app
- Install dependencies
- Run Prisma migrations
- Start your application

### Environment Variables for Railway

Set these in your Railway project:
- `DATABASE_URL` - Automatically set by Railway PostgreSQL
- `JWT_SECRET` - Your secret key for JWT signing
- `NODE_ENV` - Set to `production`

### Run Migrations on Railway

```bash
railway run npx prisma migrate deploy
```

### Seed Database on Railway (Optional)

```bash
railway run npx prisma db seed
```

## Docker Deployment

### Build the image
```bash
docker build -t license-key-api .
```

### Run with Docker Compose
Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: license_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/license_db?schema=public
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

## Security Features

### Multi-Layer Security
- **API Key Authentication**: All requests require valid API key with permissions
- **Request Signature Verification**: HMAC-SHA256 signatures prevent tampering and replay attacks
- **IP-Based Rate Limiting**: Advanced rate limiting with whitelist/blacklist support
- **License Key Hashing**: bcrypt with 10 salt rounds (never stored in plain text)
- **Device ID Hashing**: SHA256 hashing prevents device enumeration
- **JWT-Signed Responses**: All responses signed for verification
- **Helmet.js**: Secure HTTP headers (XSS, clickjacking protection)
- **CORS**: Configurable origin restrictions
- **Request Size Limits**: 10KB body limit prevents DoS
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Nonce Tracking**: Prevents replay attacks
- **Timestamp Validation**: Requests expire after 5 minutes

### Rate Limits
- **Activation**: 10 requests per 15 minutes per IP+API key
- **Validation**: 60 requests per minute per IP+API key
- **General**: 100 requests per 15 minutes per IP
- **Aggressive**: 5 requests per 5 minutes (suspicious activity)

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/health

# Activate license
curl -X POST http://localhost:3000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_LICENSE_KEY","device_id":"device-123"}'

# Validate license
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_LICENSE_KEY","device_id":"device-123"}'

# Deactivate device
curl -X POST http://localhost:3000/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_LICENSE_KEY","device_id":"device-123"}'
```

## Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:deploy": "prisma migrate deploy",
  "prisma:seed": "node prisma/seed.js",
  "prisma:studio": "prisma studio"
}
```

## License

MIT
