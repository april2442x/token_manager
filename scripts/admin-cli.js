#!/usr/bin/env node

/**
 * Admin CLI Tool
 * Manage API keys, IP whitelist/blacklist, and other security settings
 * 
 * Usage:
 *   node scripts/admin-cli.js generate-api-key "My App" user-123
 *   node scripts/admin-cli.js whitelist-ip 192.168.1.100
 *   node scripts/admin-cli.js blacklist-ip 1.2.3.4
 */

const crypto = require('crypto');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function generateSignatureSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function generateJwtSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Commands

function cmdGenerateApiKey(name, userId, permissions = 'activate,validate,deactivate') {
  log('\n=== Generate API Key ===\n', 'bright');

  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  const permArray = permissions.split(',').map((p) => p.trim());

  log('API Key Details:', 'blue');
  log(`  Name: ${name}`);
  log(`  User ID: ${userId}`);
  log(`  Permissions: ${permArray.join(', ')}`);
  log(`  Created: ${new Date().toISOString()}`);
  log('');

  log('⚠️  SAVE THIS API KEY - IT WILL NOT BE SHOWN AGAIN!', 'yellow');
  log('');
  log(`API Key: ${apiKey}`, 'green');
  log('');

  log('Hashed Key (for storage):', 'blue');
  log(hashedKey);
  log('');

  log('Add this to your apiKeyAuth.js VALID_API_KEYS Map:', 'blue');
  log(`[
  '${hashedKey}',
  {
    name: '${name}',
    userId: '${userId}',
    permissions: ${JSON.stringify(permArray)},
    createdAt: new Date('${new Date().toISOString()}'),
  },
],`);
  log('');
}

function cmdRevokeApiKey(apiKey) {
  log('\n=== Revoke API Key ===\n', 'bright');

  const hashedKey = hashApiKey(apiKey);

  log('Hashed Key:', 'blue');
  log(hashedKey);
  log('');

  log('Remove this entry from VALID_API_KEYS Map in apiKeyAuth.js', 'yellow');
  log('');
}

function cmdGenerateSecrets() {
  log('\n=== Generate Secrets ===\n', 'bright');

  const jwtSecret = generateJwtSecret();
  const signatureSecret = generateSignatureSecret();

  log('⚠️  SAVE THESE SECRETS SECURELY!', 'yellow');
  log('');

  log('JWT Secret:', 'blue');
  log(jwtSecret, 'green');
  log('');

  log('Signature Secret:', 'blue');
  log(signatureSecret, 'green');
  log('');

  log('Add to your .env file:', 'blue');
  log(`JWT_SECRET="${jwtSecret}"`);
  log(`SIGNATURE_SECRET="${signatureSecret}"`);
  log('');
}

function cmdWhitelistIp(ip) {
  log('\n=== Whitelist IP ===\n', 'bright');

  log(`IP Address: ${ip}`, 'blue');
  log('');

  log('Add this IP to IP_WHITELIST in ipRateLimiter.js:', 'yellow');
  log(`'${ip}',`);
  log('');

  log('Or use the API:', 'blue');
  log(`const { addToWhitelist } = require('./src/middleware/ipRateLimiter');`);
  log(`addToWhitelist('${ip}');`);
  log('');
}

function cmdBlacklistIp(ip) {
  log('\n=== Blacklist IP ===\n', 'bright');

  log(`IP Address: ${ip}`, 'red');
  log('');

  log('Add this IP to IP_BLACKLIST in ipRateLimiter.js:', 'yellow');
  log(`'${ip}',`);
  log('');

  log('Or use the API:', 'blue');
  log(`const { addToBlacklist } = require('./src/middleware/ipRateLimiter');`);
  log(`addToBlacklist('${ip}');`);
  log('');
}

function cmdTestSignature(timestamp, nonce, body, secret) {
  log('\n=== Test Signature Generation ===\n', 'bright');

  const payload = `${timestamp}${nonce}${body}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  log('Input:', 'blue');
  log(`  Timestamp: ${timestamp}`);
  log(`  Nonce: ${nonce}`);
  log(`  Body: ${body}`);
  log(`  Secret: ${secret}`);
  log('');

  log('Payload:', 'blue');
  log(payload);
  log('');

  log('Signature:', 'green');
  log(signature);
  log('');
}

function cmdHelp() {
  log('\n=== Admin CLI Tool ===\n', 'bright');

  log('Available Commands:', 'blue');
  log('');

  log('  generate-api-key <name> <userId> [permissions]', 'green');
  log('    Generate a new API key');
  log('    Example: node scripts/admin-cli.js generate-api-key "My App" user-123');
  log('');

  log('  revoke-api-key <apiKey>', 'green');
  log('    Revoke an existing API key');
  log('    Example: node scripts/admin-cli.js revoke-api-key abc123...');
  log('');

  log('  generate-secrets', 'green');
  log('    Generate new JWT and Signature secrets');
  log('    Example: node scripts/admin-cli.js generate-secrets');
  log('');

  log('  whitelist-ip <ip>', 'green');
  log('    Add IP to whitelist (bypass rate limits)');
  log('    Example: node scripts/admin-cli.js whitelist-ip 192.168.1.100');
  log('');

  log('  blacklist-ip <ip>', 'green');
  log('    Add IP to blacklist (block access)');
  log('    Example: node scripts/admin-cli.js blacklist-ip 1.2.3.4');
  log('');

  log('  test-signature <timestamp> <nonce> <body> <secret>', 'green');
  log('    Test signature generation');
  log('    Example: node scripts/admin-cli.js test-signature 1234567890 uuid-here \'{"key":"test"}\' secret');
  log('');

  log('  help', 'green');
  log('    Show this help message');
  log('');
}

// Main
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    cmdHelp();
    return;
  }

  switch (command) {
    case 'generate-api-key':
      if (args.length < 3) {
        log('Error: Missing arguments', 'red');
        log('Usage: generate-api-key <name> <userId> [permissions]');
        process.exit(1);
      }
      cmdGenerateApiKey(args[1], args[2], args[3]);
      break;

    case 'revoke-api-key':
      if (args.length < 2) {
        log('Error: Missing API key', 'red');
        log('Usage: revoke-api-key <apiKey>');
        process.exit(1);
      }
      cmdRevokeApiKey(args[1]);
      break;

    case 'generate-secrets':
      cmdGenerateSecrets();
      break;

    case 'whitelist-ip':
      if (args.length < 2) {
        log('Error: Missing IP address', 'red');
        log('Usage: whitelist-ip <ip>');
        process.exit(1);
      }
      cmdWhitelistIp(args[1]);
      break;

    case 'blacklist-ip':
      if (args.length < 2) {
        log('Error: Missing IP address', 'red');
        log('Usage: blacklist-ip <ip>');
        process.exit(1);
      }
      cmdBlacklistIp(args[1]);
      break;

    case 'test-signature':
      if (args.length < 5) {
        log('Error: Missing arguments', 'red');
        log('Usage: test-signature <timestamp> <nonce> <body> <secret>');
        process.exit(1);
      }
      cmdTestSignature(args[1], args[2], args[3], args[4]);
      break;

    default:
      log(`Error: Unknown command '${command}'`, 'red');
      log('Run "node scripts/admin-cli.js help" for available commands');
      process.exit(1);
  }
}

main();
