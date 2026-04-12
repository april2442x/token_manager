# API Documentation

## Base URL
```
Production: https://your-app.railway.app/api
Development: http://localhost:3000/api
```

## Authentication
All responses include a JWT-signed token for verification. The token contains the response payload and is signed with the server's `JWT_SECRET`.

## Rate Limits
- `/activate`: 10 requests per 15 minutes per IP
- `/validate`: 60 requests per minute per IP
- `/deactivate`: 100 requests per 15 minutes per IP

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T10:30:00.000Z"
}
```

---

### 2. Activate License

Activate a license key for a specific device. If the device is already registered, returns success. If device limit is reached, returns error.

**Endpoint:** `POST /activate`

**Request Body:**
```json
{
  "key": "string (required) - The license key",
  "device_id": "string (required) - Unique device identifier"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/activate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
    "device_id": "my-laptop-001"
  }'
```

**Success Response:** `200 OK`
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "max_devices": 3,
  "device_count": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

`400 Bad Request` - Missing parameters
```json
{
  "valid": false,
  "error": "Missing required fields: key and device_id"
}
```

`404 Not Found` - Invalid license key
```json
{
  "valid": false,
  "error": "Invalid license key"
}
```

`403 Forbidden` - License expired
```json
{
  "valid": false,
  "error": "License has expired",
  "expires_at": "2025-01-01T00:00:00.000Z"
}
```

`403 Forbidden` - Device limit reached
```json
{
  "valid": false,
  "error": "Device limit reached",
  "max_devices": 3
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "message": "Too many activation attempts, please try again later."
}
```

---

### 3. Validate License

Validate that a license key is active for a specific device. The device must have been previously activated.

**Endpoint:** `POST /validate`

**Request Body:**
```json
{
  "key": "string (required) - The license key",
  "device_id": "string (required) - Unique device identifier"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
    "device_id": "my-laptop-001"
  }'
```

**Success Response:** `200 OK`
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

`400 Bad Request` - Missing parameters
```json
{
  "valid": false,
  "error": "Missing required fields: key and device_id"
}
```

`404 Not Found` - Invalid license key
```json
{
  "valid": false,
  "error": "Invalid license key"
}
```

`403 Forbidden` - License expired
```json
{
  "valid": false,
  "error": "License has expired",
  "expires_at": "2025-01-01T00:00:00.000Z"
}
```

`403 Forbidden` - Device not registered
```json
{
  "valid": false,
  "error": "Device not registered for this license"
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "message": "Too many validation requests, please try again later."
}
```

---

### 4. Deactivate Device

Remove a device from a license, freeing up a device slot.

**Endpoint:** `POST /deactivate`

**Request Body:**
```json
{
  "key": "string (required) - The license key",
  "device_id": "string (required) - Unique device identifier"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "key": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
    "device_id": "my-laptop-001"
  }'
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Device deactivated successfully"
}
```

**Error Responses:**

`400 Bad Request` - Missing parameters
```json
{
  "success": false,
  "error": "Missing required fields: key and device_id"
}
```

`404 Not Found` - Invalid license key
```json
{
  "success": false,
  "error": "Invalid license key"
}
```

`404 Not Found` - Device not found
```json
{
  "success": false,
  "error": "Device not found for this license"
}
```

`429 Too Many Requests` - Rate limit exceeded
```json
{
  "message": "Too many requests, please try again later."
}
```

---

## JWT Token Verification

All successful responses include a `token` field containing a JWT-signed version of the response data.

**Token Structure:**
```javascript
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  // ... other response fields
  "iat": 1712923800,  // Issued at timestamp
  "exp": 1712927400   // Expiration timestamp (1 hour)
}
```

**Verify Token (Node.js Example):**
```javascript
const jwt = require('jsonwebtoken');

const token = response.token;
const JWT_SECRET = 'your-jwt-secret';

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

---

## Usage Logging

Every request to `/activate`, `/validate`, and `/deactivate` is logged in the database with:
- License ID
- Device ID (hashed)
- IP address
- Timestamp

This allows you to:
- Track license usage patterns
- Detect suspicious activity
- Generate usage reports
- Monitor API health

---

## Security Considerations

### License Keys
- Never stored in plain text
- Hashed using bcrypt with 10 salt rounds
- Comparison is done securely using bcrypt.compare()

### Device IDs
- Hashed using SHA256 before storage
- Original device IDs are never stored

### Rate Limiting
- Protects against brute force attacks
- Different limits for different endpoints
- Based on IP address

### JWT Signing
- All responses are signed with server secret
- Tokens expire after 1 hour
- Prevents response tampering

### Best Practices for Clients
1. Store license keys securely (encrypted storage)
2. Generate unique device IDs (hardware-based)
3. Validate JWT tokens on client side
4. Handle rate limit errors gracefully
5. Implement retry logic with exponential backoff
6. Cache validation results (with expiration)

---

## Error Handling

All errors follow this structure:
```json
{
  "valid": false,  // or "success": false for deactivate
  "error": "Human-readable error message"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `403` - Forbidden (expired license, device limit, etc.)
- `404` - Not Found (invalid license key, device not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function activateLicense(licenseKey, deviceId) {
  try {
    const response = await axios.post('http://localhost:3000/api/activate', {
      key: licenseKey,
      device_id: deviceId
    });
    
    if (response.data.valid) {
      console.log('License activated successfully');
      console.log('Expires:', response.data.expires_at);
      return response.data;
    }
  } catch (error) {
    console.error('Activation failed:', error.response.data.error);
    throw error;
  }
}
```

### Python
```python
import requests

def activate_license(license_key, device_id):
    url = 'http://localhost:3000/api/activate'
    payload = {
        'key': license_key,
        'device_id': device_id
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        if data['valid']:
            print('License activated successfully')
            print(f"Expires: {data['expires_at']}")
            return data
    else:
        print(f"Activation failed: {response.json()['error']}")
        return None
```

### cURL
```bash
# Activate
curl -X POST http://localhost:3000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_KEY","device_id":"device-123"}'

# Validate
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_KEY","device_id":"device-123"}'

# Deactivate
curl -X POST http://localhost:3000/api/deactivate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_KEY","device_id":"device-123"}'
```

---

## Monitoring & Debugging

### Check Database
```bash
# Open Prisma Studio
npm run prisma:studio
```

### View Logs
```bash
# Development
npm run dev

# Production (Docker)
docker-compose logs -f api

# Production (Railway)
railway logs
```

### Query Usage Logs
```sql
-- Most active licenses
SELECT license_id, COUNT(*) as usage_count
FROM usage_logs
GROUP BY license_id
ORDER BY usage_count DESC
LIMIT 10;

-- Recent activity
SELECT * FROM usage_logs
ORDER BY created_at DESC
LIMIT 50;
```
