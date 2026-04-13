#!/usr/bin/env node

/**
 * Test API Call with Proper Signature
 * 
 * Usage:
 *   node test-api-call.js activate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001
 *   node test-api-call.js validate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001
 *   node test-api-call.js deactivate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001
 */

const crypto = require('crypto');
const https = require('https');

// Configuration
const API_URL = 'tokenmanager-production.up.railway.app';
const API_KEY = 'test-api-key-12345';
const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'dev-signature-secret-key-67890';

// Generate signature
function generateSignature(timestamp, nonce, body, secret) {
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Make API call
async function callAPI(endpoint, licenseKey, deviceId) {
  return new Promise((resolve, reject) => {
    const body = {
      key: licenseKey,
      device_id: deviceId,
    };

    const timestamp = Date.now().toString();
    const nonce = generateUUID();
    const signature = generateSignature(timestamp, nonce, body, SIGNATURE_SECRET);

    const bodyString = JSON.stringify(body);

    const options = {
      hostname: API_URL,
      port: 443,
      path: `/api/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString),
        'X-API-Key': API_KEY,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
      },
    };

    console.log('\n📡 Making API Request...');
    console.log(`Endpoint: POST https://${API_URL}/api/${endpoint}`);
    console.log(`License Key: ${licenseKey}`);
    console.log(`Device ID: ${deviceId}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Nonce: ${nonce}`);
    console.log(`Signature: ${signature.substring(0, 16)}...`);
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('');

        try {
          const response = JSON.parse(data);
          console.log('Response:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('Raw Response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(bodyString);
    req.end();
  });
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('\n❌ Missing arguments\n');
    console.log('Usage:');
    console.log('  node test-api-call.js <endpoint> <license_key> <device_id>');
    console.log('');
    console.log('Examples:');
    console.log('  node test-api-call.js activate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001');
    console.log('  node test-api-call.js validate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001');
    console.log('  node test-api-call.js deactivate A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 test-device-001');
    console.log('');
    process.exit(1);
  }

  const [endpoint, licenseKey, deviceId] = args;

  if (!['activate', 'validate', 'deactivate'].includes(endpoint)) {
    console.error('❌ Invalid endpoint. Must be: activate, validate, or deactivate');
    process.exit(1);
  }

  try {
    await callAPI(endpoint, licenseKey, deviceId);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
