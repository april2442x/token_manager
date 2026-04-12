#!/usr/bin/env node

/**
 * Create License Key Script
 * 
 * Usage:
 *   node scripts/create-license.js
 *   node scripts/create-license.js --devices 5 --days 365
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateLicenseKey() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

async function createLicense(maxDevices = 3, daysValid = 365) {
  try {
    // Generate license key
    const licenseKey = generateLicenseKey();
    const hashedKey = await bcrypt.hash(licenseKey, 10);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    // Create in database
    const license = await prisma.license.create({
      data: {
        key: hashedKey,
        max_devices: maxDevices,
        expires_at: expiresAt,
      },
    });

    log('\n✅ License Created Successfully!\n', 'green');
    log('License Details:', 'blue');
    log(`  ID: ${license.id}`);
    log(`  Max Devices: ${license.max_devices}`);
    log(`  Expires: ${license.expires_at.toISOString()}`);
    log(`  Created: ${license.created_at.toISOString()}`);
    log('');
    log('⚠️  SAVE THIS LICENSE KEY - IT CANNOT BE RETRIEVED!', 'yellow');
    log('');
    log(`License Key: ${licenseKey}`, 'green');
    log('');

    return licenseKey;
  } catch (error) {
    console.error('Error creating license:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let maxDevices = 3;
  let daysValid = 365;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--devices' && args[i + 1]) {
      maxDevices = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--days' && args[i + 1]) {
      daysValid = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--help') {
      log('\nUsage: node scripts/create-license.js [options]\n', 'blue');
      log('Options:');
      log('  --devices <number>  Maximum number of devices (default: 3)');
      log('  --days <number>     Days until expiration (default: 365)');
      log('  --help              Show this help message');
      log('');
      log('Examples:');
      log('  node scripts/create-license.js');
      log('  node scripts/create-license.js --devices 5 --days 730');
      log('');
      process.exit(0);
    }
  }

  return { maxDevices, daysValid };
}

// Main
async function main() {
  const { maxDevices, daysValid } = parseArgs();
  await createLicense(maxDevices, daysValid);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
