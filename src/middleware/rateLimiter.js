const rateLimit = require('express-rate-limit');

// Rate limiter for activation endpoint
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many activation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for validation endpoint
const validationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'Too many validation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  activationLimiter,
  validationLimiter,
  generalLimiter,
};
