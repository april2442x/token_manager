const rateLimit = require('express-rate-limit');

/**
 * IP-based Rate Limiting with Advanced Features
 * 
 * Features:
 * - Per-IP rate limiting
 * - Different limits for different endpoints
 * - Whitelist/blacklist support
 * - Custom key generators
 * - Detailed error messages
 */

// Helper to normalize IP addresses (IPv4 and IPv6)
function normalizeIp(ip) {
  if (!ip) return 'unknown';
  
  // For IPv6, take first 64 bits (4 segments)
  if (ip.includes(':')) {
    const segments = ip.split(':');
    return segments.slice(0, 4).join(':');
  }
  
  // For IPv4, return as-is
  return ip;
}

// IP Whitelist (trusted IPs with no rate limits)
const IP_WHITELIST = new Set([
  '127.0.0.1',
  '::1',
  // Add your trusted IPs here
  // '192.168.1.100',
]);

// IP Blacklist (blocked IPs)
const IP_BLACKLIST = new Set([
  // Add malicious IPs here
  // '1.2.3.4',
]);

/**
 * Check if IP is whitelisted
 */
function isWhitelisted(ip) {
  return IP_WHITELIST.has(ip);
}

/**
 * Check if IP is blacklisted
 */
function isBlacklisted(ip) {
  return IP_BLACKLIST.has(ip);
}

/**
 * Middleware to block blacklisted IPs
 */
function blockBlacklistedIPs(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;

  if (isBlacklisted(ip)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP address has been blocked',
    });
  }

  next();
}

/**
 * Custom key generator that includes API key
 * Uses proper IPv6 normalization to satisfy express-rate-limit requirements
 */
function generateRateLimitKey(req) {
  const ip = normalizeIp(req.ip || req.connection.remoteAddress);
  const apiKey = req.headers['x-api-key'] || 'anonymous';
  return `${ip}|${apiKey}`;
}

/**
 * Skip rate limiting for whitelisted IPs
 */
function skipWhitelisted(req) {
  const ip = req.ip || req.connection.remoteAddress;
  return isWhitelisted(ip);
}

/**
 * Custom handler for rate limit exceeded
 */
function rateLimitHandler(req, res) {
  const ip = req.ip || req.connection.remoteAddress;
  const retryAfter = res.getHeader('Retry-After');

  console.warn(`Rate limit exceeded for IP: ${ip}`);

  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    ip: ip,
    retry_after_seconds: retryAfter,
    limit_info: {
      message: 'You have exceeded the allowed number of requests',
      suggestion: 'Please wait before making more requests',
    },
  });
}

/**
 * Strict rate limiter for activation (per IP + API key)
 */
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP+API key
  message: 'Too many activation attempts from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  handler: rateLimitHandler,
});

/**
 * Moderate rate limiter for validation (per IP + API key)
 */
const validationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP+API key
  message: 'Too many validation requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  handler: rateLimitHandler,
});

/**
 * General rate limiter for other endpoints (per IP)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  handler: rateLimitHandler,
});

/**
 * Aggressive rate limiter for suspicious activity
 */
const aggressiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Only 5 requests per 5 minutes
  message: 'Suspicious activity detected',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  handler: rateLimitHandler,
});

/**
 * Per-IP rate limiter (strict)
 */
const strictIpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many requests from your IP address',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelisted,
  handler: rateLimitHandler,
});

/**
 * Add IP to whitelist
 */
function addToWhitelist(ip) {
  IP_WHITELIST.add(ip);
  console.log(`IP ${ip} added to whitelist`);
}

/**
 * Remove IP from whitelist
 */
function removeFromWhitelist(ip) {
  IP_WHITELIST.delete(ip);
  console.log(`IP ${ip} removed from whitelist`);
}

/**
 * Add IP to blacklist
 */
function addToBlacklist(ip) {
  IP_BLACKLIST.add(ip);
  console.log(`IP ${ip} added to blacklist`);
}

/**
 * Remove IP from blacklist
 */
function removeFromBlacklist(ip) {
  IP_BLACKLIST.delete(ip);
  console.log(`IP ${ip} removed from blacklist`);
}

module.exports = {
  activationLimiter,
  validationLimiter,
  generalLimiter,
  aggressiveLimiter,
  strictIpLimiter,
  blockBlacklistedIPs,
  isWhitelisted,
  isBlacklisted,
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
};
