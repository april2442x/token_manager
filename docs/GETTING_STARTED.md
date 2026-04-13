# Getting Started - License Key Validation API

## Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Update .env with your PostgreSQL credentials
npm run prisma:migrate
npm run prisma:seed
```

Save the license keys from seed output!

### 3. Generate Security Credentials
```bash
npm run admin generate-secrets
npm run admin generate-api-key "My App" user-123
```

Add to `.env`:
```env
JWT_SECRET="generated-jwt-secret"
SIGNATURE_SECRET="generated-signature-secret"
```

### 4. Start Server
```bash
npm run dev
```

### 5. Test API
```bash
npm run test:security
```

## Making Your First Request

### JavaScript Example
```javascript
const crypto = require('crypto');

const API_KEY = 'your-api-key';
const SECRET = 'your-signature-secret';

async function activateLicense(licenseKey, deviceId) {
  const body = { key: licenseKey, device_id: deviceId };
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  const response = await fetch('http://localhost:3000/api/activate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}
```

### Python Example
```python
import requests, hmac, hashlib, json, time, uuid

API_KEY = 'your-api-key'
SECRET = 'your-signature-secret'

def activate_license(license_key, device_id):
    body = {'key': license_key, 'device_id': device_id}
    timestamp = int(time.time() * 1000)
    nonce = str(uuid.uuid4())
    payload = f"{timestamp}{nonce}{json.dumps(body, separators=(',', ':'))}"
    signature = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    
    response = requests.post('http://localhost:3000/api/activate',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'X-Signature': signature,
            'X-Timestamp': str(timestamp),
            'X-Nonce': nonce,
        },
        json=body
    )
    return response.json()
```

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run prisma:studio          # Open database GUI

# Security
npm run admin generate-api-key "Name" user-id
npm run admin generate-secrets
npm run admin whitelist-ip 192.168.1.100
npm run test:security

# Database
npm run prisma:migrate         # Run migrations
npm run prisma:seed            # Seed test data

# Production
npm start                      # Start production server
npm run prisma:deploy          # Deploy migrations
```

## Deploy to Railway

```bash
npx @railway/cli login
npx @railway/cli init
npx @railway/cli add           # Select PostgreSQL
npx @railway/cli variables set JWT_SECRET="your-secret"
npx @railway/cli variables set SIGNATURE_SECRET="your-secret"
npx @railway/cli up
```

## Documentation

- **README.md** - Complete documentation
- **SECURITY.md** - Security guide
- **API_DOCUMENTATION.md** - API reference
- **RAILWAY_DEPLOYMENT.md** - Deployment guide

## Need Help?

Check `examples/` folder for complete client implementations in JavaScript and Python.
