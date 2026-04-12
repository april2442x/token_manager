const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash a license key using bcrypt
 */
async function hashLicenseKey(key) {
  return bcrypt.hash(key, SALT_ROUNDS);
}

/**
 * Compare plain license key with hashed version
 */
async function compareLicenseKey(plainKey, hashedKey) {
  return bcrypt.compare(plainKey, hashedKey);
}

/**
 * Hash device ID using SHA256
 */
function hashDeviceId(deviceId) {
  return crypto.createHash('sha256').update(deviceId).digest('hex');
}

/**
 * Generate a random license key
 */
function generateLicenseKey() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

module.exports = {
  hashLicenseKey,
  compareLicenseKey,
  hashDeviceId,
  generateLicenseKey,
};
