const crypto = require('crypto');

/**
 * API Key Authentication Middleware
 * Validates API key from X-API-Key header
 */

// In production, store these in database with user associations
const VALID_API_KEYS = new Map([
  // Format: [hashedKey, { name, userId, permissions, createdAt }]
  // Example: API key "test-api-key-12345" hashed
  [
    hashApiKey('test-api-key-12345'),
    {
      name: 'Test API Key',
      userId: 'test-user',
      permissions: ['activate', 'validate', 'deactivate'],
      createdAt: new Date(),
    },
  ],
]);

/**
 * Hash API key using SHA256
 */
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate a new API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware to verify API key
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      message: 'X-API-Key header is required',
    });
  }

  const hashedKey = hashApiKey(apiKey);
  const keyData = VALID_API_KEYS.get(hashedKey);

  if (!keyData) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid',
    });
  }

  // Attach key data to request for later use
  req.apiKeyData = keyData;

  next();
}

/**
 * Middleware to check specific permissions
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKeyData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key authentication required',
      });
    }

    if (!req.apiKeyData.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This API key does not have '${permission}' permission`,
      });
    }

    next();
  };
}

/**
 * Add a new API key (for admin use)
 */
function addApiKey(name, userId, permissions = ['activate', 'validate']) {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);

  VALID_API_KEYS.set(hashedKey, {
    name,
    userId,
    permissions,
    createdAt: new Date(),
  });

  return apiKey; // Return plain key only once
}

/**
 * Revoke an API key
 */
function revokeApiKey(apiKey) {
  const hashedKey = hashApiKey(apiKey);
  return VALID_API_KEYS.delete(hashedKey);
}

module.exports = {
  verifyApiKey,
  requirePermission,
  generateApiKey,
  addApiKey,
  revokeApiKey,
  hashApiKey,
};
