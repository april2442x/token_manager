const crypto = require('crypto');

/**
 * Security Helper Functions
 * Client-side utilities for generating signatures and API keys
 */

/**
 * Generate a request signature
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} nonce - Unique request identifier (UUID)
 * @param {object} body - Request body object
 * @param {string} secret - Signature secret key
 * @returns {string} HMAC-SHA256 signature
 */
function generateRequestSignature(timestamp, nonce, body, secret) {
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Generate a unique nonce (UUID v4)
 * @returns {string} UUID v4
 */
function generateNonce() {
  return crypto.randomUUID();
}

/**
 * Get current timestamp
 * @returns {number} Unix timestamp in milliseconds
 */
function getTimestamp() {
  return Date.now();
}

/**
 * Create signed request headers
 * @param {object} body - Request body
 * @param {string} secret - Signature secret
 * @param {string} apiKey - API key
 * @returns {object} Headers object
 */
function createSignedHeaders(body, secret, apiKey) {
  const timestamp = getTimestamp();
  const nonce = generateNonce();
  const signature = generateRequestSignature(timestamp, nonce, body, secret);

  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
  };
}

/**
 * Example: Make a signed request (Node.js client)
 */
async function makeSignedRequest(url, body, apiKey, secret) {
  const headers = createSignedHeaders(body, secret, apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return response.json();
}

module.exports = {
  generateRequestSignature,
  generateNonce,
  getTimestamp,
  createSignedHeaders,
  makeSignedRequest,
};
