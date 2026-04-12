/**
 * Client Example: How to make authenticated requests to the API
 * 
 * This example shows how to:
 * 1. Generate request signatures
 * 2. Include API key
 * 3. Make secure requests
 */

const crypto = require('crypto');

// Configuration
const API_URL = 'http://localhost:3000/api';
const API_KEY = 'test-api-key-12345'; // Get from your API provider
const SIGNATURE_SECRET = 'dev-signature-secret-key-67890'; // Get from your API provider

/**
 * Generate request signature
 */
function generateSignature(timestamp, nonce, body, secret) {
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Make a signed request
 */
async function makeSignedRequest(endpoint, body) {
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const signature = generateSignature(timestamp, nonce, body, SIGNATURE_SECRET);

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Example 1: Activate a license
 */
async function activateLicense(licenseKey, deviceId) {
  try {
    const result = await makeSignedRequest('/activate', {
      key: licenseKey,
      device_id: deviceId,
    });

    console.log('Activation result:', result);
    return result;
  } catch (error) {
    console.error('Activation failed:', error);
    throw error;
  }
}

/**
 * Example 2: Validate a license
 */
async function validateLicense(licenseKey, deviceId) {
  try {
    const result = await makeSignedRequest('/validate', {
      key: licenseKey,
      device_id: deviceId,
    });

    console.log('Validation result:', result);
    return result;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}

/**
 * Example 3: Deactivate a device
 */
async function deactivateDevice(licenseKey, deviceId) {
  try {
    const result = await makeSignedRequest('/deactivate', {
      key: licenseKey,
      device_id: deviceId,
    });

    console.log('Deactivation result:', result);
    return result;
  } catch (error) {
    console.error('Deactivation failed:', error);
    throw error;
  }
}

// Run examples
async function main() {
  console.log('=== License Key Validation API Client Example ===\n');

  // Replace with actual license key from seed
  const licenseKey = 'YOUR_LICENSE_KEY_HERE';
  const deviceId = 'my-device-' + Date.now();

  try {
    // Example 1: Activate
    console.log('1. Activating license...');
    await activateLicense(licenseKey, deviceId);
    console.log('');

    // Example 2: Validate
    console.log('2. Validating license...');
    await validateLicense(licenseKey, deviceId);
    console.log('');

    // Example 3: Deactivate
    console.log('3. Deactivating device...');
    await deactivateDevice(licenseKey, deviceId);
    console.log('');

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Uncomment to run
// main();

module.exports = {
  makeSignedRequest,
  activateLicense,
  validateLicense,
  deactivateDevice,
};
