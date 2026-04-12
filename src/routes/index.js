const express = require('express');
const licenseController = require('../controllers/licenseController');
const {
  activationLimiter,
  validationLimiter,
  generalLimiter,
} = require('../middleware/ipRateLimiter');
const { verifyApiKey, requirePermission } = require('../middleware/apiKeyAuth');
const { verifySignature, optionalSignature } = require('../middleware/signatureVerification');

const router = express.Router();

// Health check (no authentication required)
router.get('/health', licenseController.health.bind(licenseController));

// License endpoints with full security stack
// Order matters: API Key → Signature → Rate Limit → Permission → Controller

// Activate endpoint (requires API key, signature, and activate permission)
router.post(
  '/activate',
  verifyApiKey,
  verifySignature({ maxAge: 5 * 60 * 1000 }), // 5 minutes
  activationLimiter,
  requirePermission('activate'),
  licenseController.activate.bind(licenseController)
);

// Validate endpoint (requires API key, signature, and validate permission)
router.post(
  '/validate',
  verifyApiKey,
  verifySignature({ maxAge: 5 * 60 * 1000 }), // 5 minutes
  validationLimiter,
  requirePermission('validate'),
  licenseController.validate.bind(licenseController)
);

// Deactivate endpoint (requires API key, signature, and deactivate permission)
router.post(
  '/deactivate',
  verifyApiKey,
  verifySignature({ maxAge: 5 * 60 * 1000 }), // 5 minutes
  generalLimiter,
  requirePermission('deactivate'),
  licenseController.deactivate.bind(licenseController)
);

module.exports = router;
