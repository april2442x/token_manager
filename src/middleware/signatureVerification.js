const crypto = require('crypto');

/**
 * Request Signature Verification Middleware
 * 
 * Clients must sign requests with HMAC-SHA256
 * 
 * Required headers:
 * - X-Signature: HMAC-SHA256 signature of request body
 * - X-Timestamp: Unix timestamp (prevents replay attacks)
 * - X-Nonce: Unique request identifier (prevents replay attacks)
 * 
 * Signature format: HMAC-SHA256(timestamp + nonce + body, secret)
 */

// Store used nonces to prevent replay attacks (in production, use Redis)
const usedNonces = new Map();

// Clean up old nonces every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (timestamp < fiveMinutesAgo) {
      usedNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate signature for a request (client-side helper)
 */
function generateSignature(timestamp, nonce, body, secret) {
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify request signature
 */
function verifySignature(options = {}) {
  const {
    secret = process.env.SIGNATURE_SECRET || process.env.JWT_SECRET,
    maxAge = 5 * 60 * 1000, // 5 minutes
    required = true,
  } = options;

  return (req, res, next) => {
    // Skip verification for health check
    if (req.path === '/health') {
      return next();
    }

    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'];

    // Check if signature verification is required
    if (!signature && !required) {
      return next();
    }

    // Validate required headers
    if (!signature || !timestamp || !nonce) {
      return res.status(401).json({
        error: 'Missing signature headers',
        message: 'X-Signature, X-Timestamp, and X-Nonce headers are required',
        required_headers: {
          'X-Signature': 'HMAC-SHA256 signature',
          'X-Timestamp': 'Unix timestamp in milliseconds',
          'X-Nonce': 'Unique request identifier (UUID recommended)',
        },
      });
    }

    // Validate timestamp format
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime)) {
      return res.status(400).json({
        error: 'Invalid timestamp',
        message: 'X-Timestamp must be a valid Unix timestamp in milliseconds',
      });
    }

    // Check timestamp freshness (prevent replay attacks)
    const now = Date.now();
    const age = now - requestTime;

    if (age > maxAge) {
      return res.status(401).json({
        error: 'Request expired',
        message: `Request timestamp is too old (max age: ${maxAge / 1000}s)`,
        timestamp: requestTime,
        server_time: now,
        age_seconds: Math.floor(age / 1000),
      });
    }

    if (age < -60000) {
      // Allow 1 minute clock skew
      return res.status(401).json({
        error: 'Invalid timestamp',
        message: 'Request timestamp is in the future',
      });
    }

    // Check nonce uniqueness (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      return res.status(401).json({
        error: 'Duplicate request',
        message: 'This nonce has already been used (replay attack detected)',
      });
    }

    // Generate expected signature
    const body = req.body ? JSON.stringify(req.body) : '';
    const payload = `${timestamp}${nonce}${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Compare signatures (constant-time comparison)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Request signature verification failed',
      });
    }

    // Mark nonce as used
    usedNonces.set(nonce, requestTime);

    // Attach signature data to request
    req.signatureVerified = true;
    req.signatureTimestamp = requestTime;

    next();
  };
}

/**
 * Optional signature verification (doesn't fail if missing)
 */
function optionalSignature(options = {}) {
  return verifySignature({ ...options, required: false });
}

module.exports = {
  verifySignature,
  optionalSignature,
  generateSignature, // Export for client-side use
};
