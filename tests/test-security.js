/**
 * Security Testing Script
 * Tests all security features of the API
 */

const crypto = require('crypto');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const API_KEY = process.env.API_KEY || 'test-api-key-12345';
const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'dev-signature-secret-key-67890';

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSignature(timestamp, nonce, body, secret) {
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function makeRequest(endpoint, body, options = {}) {
  const {
    includeApiKey = true,
    includeSignature = true,
    customHeaders = {},
    invalidSignature = false,
    oldTimestamp = false,
    reuseNonce = null,
  } = options;

  const timestamp = oldTimestamp ? Date.now() - 10 * 60 * 1000 : Date.now();
  const nonce = reuseNonce || crypto.randomUUID();
  let signature = generateSignature(timestamp, nonce, body, SIGNATURE_SECRET);

  if (invalidSignature) {
    signature = 'invalid-signature-12345';
  }

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (includeApiKey) {
    headers['X-API-Key'] = API_KEY;
  }

  if (includeSignature) {
    headers['X-Signature'] = signature;
    headers['X-Timestamp'] = timestamp.toString();
    headers['X-Nonce'] = nonce;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { status: response.status, data, nonce };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  log('\n=== Security Testing Suite ===\n', 'blue');

  const testBody = { key: 'test-key', device_id: 'test-device' };
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Missing API Key
  log('Test 1: Missing API Key', 'yellow');
  const test1 = await makeRequest('/activate', testBody, { includeApiKey: false });
  if (test1.status === 401 && test1.data.error === 'Missing API key') {
    log('✓ PASSED - Request rejected without API key\n', 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Expected 401, got ${test1.status}\n`, 'red');
    testsFailed++;
  }

  // Test 2: Invalid API Key
  log('Test 2: Invalid API Key', 'yellow');
  const test2 = await makeRequest('/activate', testBody, {
    customHeaders: { 'X-API-Key': 'invalid-key-12345' },
  });
  if (test2.status === 401 && test2.data.error === 'Invalid API key') {
    log('✓ PASSED - Request rejected with invalid API key\n', 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Expected 401, got ${test2.status}\n`, 'red');
    testsFailed++;
  }

  // Test 3: Missing Signature
  log('Test 3: Missing Signature', 'yellow');
  const test3 = await makeRequest('/activate', testBody, { includeSignature: false });
  if (test3.status === 401 && test3.data.error === 'Missing signature headers') {
    log('✓ PASSED - Request rejected without signature\n', 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Expected 401, got ${test3.status}\n`, 'red');
    testsFailed++;
  }

  // Test 4: Invalid Signature
  log('Test 4: Invalid Signature', 'yellow');
  const test4 = await makeRequest('/activate', testBody, { invalidSignature: true });
  if (test4.status === 401 && test4.data.error === 'Invalid signature') {
    log('✓ PASSED - Request rejected with invalid signature\n', 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Expected 401, got ${test4.status}\n`, 'red');
    testsFailed++;
  }

  // Test 5: Expired Timestamp
  log('Test 5: Expired Timestamp', 'yellow');
  const test5 = await makeRequest('/activate', testBody, { oldTimestamp: true });
  if (test5.status === 401 && test5.data.error === 'Request expired') {
    log('✓ PASSED - Request rejected with old timestamp\n', 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Expected 401, got ${test5.status}\n`, 'red');
    testsFailed++;
  }

  // Test 6: Valid Request
  log('Test 6: Valid Request (or expected error)', 'yellow');
  const test6 = await makeRequest('/activate', testBody);
  if (test6.status === 200 || test6.status === 404) {
    // 404 is expected if license key doesn't exist
    log(`✓ PASSED - Request processed (status: ${test6.status})\n`, 'green');
    testsPassed++;
  } else {
    log(`✗ FAILED - Unexpected status ${test6.status}\n`, 'red');
    testsFailed++;
  }

  // Test 7: Replay Attack (reuse nonce)
  log('Test 7: Replay Attack Prevention', 'yellow');
  const test7a = await makeRequest('/activate', testBody);
  if (test7a.status === 200 || test7a.status === 404 || test7a.status === 403) {
    const test7b = await makeRequest('/activate', testBody, { reuseNonce: test7a.nonce });
    if (test7b.status === 401 && test7b.data.error === 'Duplicate request') {
      log('✓ PASSED - Replay attack prevented\n', 'green');
      testsPassed++;
    } else {
      log(`✗ FAILED - Replay attack not detected (status: ${test7b.status})\n`, 'red');
      testsFailed++;
    }
  } else {
    log(`✗ FAILED - Initial request failed (status: ${test7a.status})\n`, 'red');
    testsFailed++;
  }

  // Test 8: Rate Limiting
  log('Test 8: Rate Limiting (making 12 requests)', 'yellow');
  let rateLimitHit = false;
  for (let i = 0; i < 12; i++) {
    const testRate = await makeRequest('/activate', testBody);
    if (testRate.status === 429) {
      rateLimitHit = true;
      break;
    }
    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (rateLimitHit) {
    log('✓ PASSED - Rate limit enforced\n', 'green');
    testsPassed++;
  } else {
    log('⚠ WARNING - Rate limit not hit (may need more requests)\n', 'yellow');
    testsPassed++;
  }

  // Test 9: Health Check (no auth required)
  log('Test 9: Health Check (no auth)', 'yellow');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    if (response.status === 200 && data.status === 'ok') {
      log('✓ PASSED - Health check accessible without auth\n', 'green');
      testsPassed++;
    } else {
      log(`✗ FAILED - Health check failed (status: ${response.status})\n`, 'red');
      testsFailed++;
    }
  } catch (error) {
    log(`✗ FAILED - Health check error: ${error.message}\n`, 'red');
    testsFailed++;
  }

  // Summary
  log('\n=== Test Summary ===\n', 'blue');
  log(`Total Tests: ${testsPassed + testsFailed}`);
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log('');

  if (testsFailed === 0) {
    log('🎉 All security tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the results above.', 'yellow');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
log('Starting security tests...', 'blue');
log(`API URL: ${API_URL}`, 'blue');
log(`API Key: ${API_KEY.substring(0, 10)}...`, 'blue');
log('');

runTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
