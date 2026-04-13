# Security Documentation

## Overview

This API implements multiple layers of security to protect against unauthorized access, replay attacks, and abuse.

## Security Layers

### 1. API Key Authentication

All API requests (except `/health`) require a valid API key.

**Implementation:**
- API keys are hashed with SHA256 before storage
- Keys are passed via `X-API-Key` header
- Each key has associated permissions (activate, validate, deactivate)
- Keys can be revoked at any time

**Usage:**
```bash
curl -X POST http://localhost:3000/api/activate \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"key":"LICENSE_KEY","device_id":"device-123"}'
```

**Getting an API Key:**
```javascript
// In production, implement an admin endpoint
const { addApiKey } = require('./src/middleware/apiKeyAuth');

const apiKey = addApiKey('My App', 'user-id-123', ['activate', 'validate', 'deactivate']);
console.log('Your API Key:', apiKey); // Save this securely!
```

### 2. Request Signature Verification

All requests must be signed with HMAC-SHA256 to prevent tampering and replay attacks.

**Required Headers:**
- `X-Signature`: HMAC-SHA256 signature
- `X-Timestamp`: Unix timestamp in milliseconds
- `X-Nonce`: Unique request identifier (UUID recommended)

**Signature Algorithm:**
```
signature = HMAC-SHA256(timestamp + nonce + JSON.stringify(body), secret)
```

**Example (JavaScript):**
```javascript
const crypto = require('crypto');

const timestamp = Date.now();
const nonce = crypto.randomUUID();
const body = { key: 'LICENSE_KEY', device_id: 'device-123' };
const secret = 'your-signature-secret';

const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

// Include in headers
headers = {
  'X-API-Key': 'your-api-key',
  'X-Signature': signature,
  'X-Timestamp': timestamp.toString(),
  'X-Nonce': nonce,
};
```

**Example (Python):**
```python
import hmac
import hashlib
import json
import time
import uuid

timestamp = int(time.time() * 1000)
nonce = str(uuid.uuid4())
body = {'key': 'LICENSE_KEY', 'device_id': 'device-123'}
secret = 'your-signature-secret'

payload = f"{timestamp}{nonce}{json.dumps(body, separators=(',', ':'))}"
signature = hmac.new(
    secret.encode('utf-8'),
    payload.encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Include in headers
headers = {
    'X-API-Key': 'your-api-key',
    'X-Signature': signature,
    'X-Timestamp': str(timestamp),
    'X-Nonce': nonce,
}
```

**Security Features:**
- **Timestamp validation**: Requests older than 5 minutes are rejected
- **Nonce tracking**: Each nonce can only be used once (prevents replay attacks)
- **Constant-time comparison**: Prevents timing attacks

### 3. IP-Based Rate Limiting

Multiple rate limiters protect against abuse:

**Rate Limits:**
- **Activation**: 10 requests per 15 minutes per IP+API key
- **Validation**: 60 requests per minute per IP+API key
- **General**: 100 requests per 15 minutes per IP
- **Aggressive**: 5 requests per 5 minutes (for suspicious activity)

**IP Whitelist:**
```javascript
const { addToWhitelist } = require('./src/middleware/ipRateLimiter');
addToWhitelist('192.168.1.100'); // Trusted IP
```

**IP Blacklist:**
```javascript
const { addToBlacklist } = require('./src/middleware/ipRateLimiter');
addToBlacklist('1.2.3.4'); // Malicious IP
```

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait before retrying

### 4. Additional Security Measures

**Helmet.js:**
- Sets secure HTTP headers
- Prevents clickjacking
- XSS protection
- Content Security Policy

**CORS:**
- Configurable allowed origins
- Restricts cross-origin requests
- Whitelisted headers only

**Request Size Limits:**
- Body size limited to 10KB
- Prevents DoS attacks

**License Key Security:**
- Keys hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Secure comparison with bcrypt.compare()

**Device ID Security:**
- Hashed with SHA256
- Original IDs never stored
- Prevents device enumeration

## Complete Request Example

### JavaScript/Node.js

```javascript
const crypto = require('crypto');

async function makeSecureRequest(endpoint, body) {
  const API_URL = 'http://localhost:3000/api';
  const API_KEY = 'your-api-key';
  const SECRET = 'your-signature-secret';

  // Generate signature
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  // Make request
  const response = await fetch(`${API_URL}${endpoint}`, {
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

// Usage
const result = await makeSecureRequest('/activate', {
  key: 'LICENSE_KEY',
  device_id: 'device-123',
});
```

### Python

```python
import requests
import hmac
import hashlib
import json
import time
import uuid

def make_secure_request(endpoint, body):
    API_URL = 'http://localhost:3000/api'
    API_KEY = 'your-api-key'
    SECRET = 'your-signature-secret'
    
    # Generate signature
    timestamp = int(time.time() * 1000)
    nonce = str(uuid.uuid4())
    payload = f"{timestamp}{nonce}{json.dumps(body, separators=(',', ':'))}"
    signature = hmac.new(
        SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Make request
    response = requests.post(
        f"{API_URL}{endpoint}",
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

# Usage
result = make_secure_request('/activate', {
    'key': 'LICENSE_KEY',
    'device_id': 'device-123',
})
```

### cURL

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
API_KEY="your-api-key"
SECRET="your-signature-secret"
ENDPOINT="/activate"
BODY='{"key":"LICENSE_KEY","device_id":"device-123"}'

# Generate signature
TIMESTAMP=$(date +%s%3N)
NONCE=$(uuidgen)
PAYLOAD="${TIMESTAMP}${NONCE}${BODY}"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Make request
curl -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -H "X-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Nonce: ${NONCE}" \
  -d "${BODY}"
```

## Error Responses

### Missing API Key
```json
{
  "error": "Missing API key",
  "message": "X-API-Key header is required"
}
```

### Invalid API Key
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### Missing Signature Headers
```json
{
  "error": "Missing signature headers",
  "message": "X-Signature, X-Timestamp, and X-Nonce headers are required",
  "required_headers": {
    "X-Signature": "HMAC-SHA256 signature",
    "X-Timestamp": "Unix timestamp in milliseconds",
    "X-Nonce": "Unique request identifier (UUID recommended)"
  }
}
```

### Invalid Signature
```json
{
  "error": "Invalid signature",
  "message": "Request signature verification failed"
}
```

### Request Expired
```json
{
  "error": "Request expired",
  "message": "Request timestamp is too old (max age: 300s)",
  "timestamp": 1712923800000,
  "server_time": 1712924100000,
  "age_seconds": 300
}
```

### Replay Attack Detected
```json
{
  "error": "Duplicate request",
  "message": "This nonce has already been used (replay attack detected)"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "ip": "192.168.1.100",
  "retry_after_seconds": 900,
  "limit_info": {
    "message": "You have exceeded the allowed number of requests",
    "suggestion": "Please wait before making more requests"
  }
}
```

### IP Blacklisted
```json
{
  "error": "Forbidden",
  "message": "Your IP address has been blocked"
}
```

### Insufficient Permissions
```json
{
  "error": "Forbidden",
  "message": "This API key does not have 'activate' permission"
}
```

## Best Practices

### For API Consumers

1. **Store Secrets Securely**
   - Never commit API keys or secrets to version control
   - Use environment variables
   - Rotate keys regularly

2. **Implement Retry Logic**
   - Respect rate limits
   - Use exponential backoff
   - Check `Retry-After` header

3. **Cache Validation Results**
   - Reduce API calls
   - Set appropriate TTL
   - Invalidate on deactivation

4. **Handle Errors Gracefully**
   - Check response status codes
   - Parse error messages
   - Log failures for debugging

5. **Use HTTPS in Production**
   - Never send API keys over HTTP
   - Validate SSL certificates
   - Use certificate pinning if possible

### For API Administrators

1. **Monitor Usage**
   - Track API key usage
   - Identify suspicious patterns
   - Set up alerts for anomalies

2. **Rotate Secrets**
   - Change JWT_SECRET regularly
   - Update SIGNATURE_SECRET periodically
   - Notify clients before rotation

3. **Manage IP Lists**
   - Keep whitelist updated
   - Review blacklist regularly
   - Document IP changes

4. **Review Logs**
   - Check usage logs daily
   - Investigate failed requests
   - Monitor rate limit hits

5. **Update Dependencies**
   - Keep packages up to date
   - Apply security patches
   - Run `npm audit` regularly

## Security Checklist

- [ ] API keys stored securely (hashed)
- [ ] Signature secret different from JWT secret
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] IP whitelist/blacklist maintained
- [ ] CORS origins restricted
- [ ] Request size limits enforced
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain secrets
- [ ] Dependencies up to date
- [ ] Database credentials secured
- [ ] Environment variables protected
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourcompany.com. Do not create public GitHub issues for security vulnerabilities.

## Compliance

This API implements security measures aligned with:
- OWASP API Security Top 10
- NIST Cybersecurity Framework
- PCI DSS (where applicable)
- GDPR (data protection)

## Additional Resources

- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
