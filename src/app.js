const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const { blockBlacklistedIPs } = require('./middleware/ipRateLimiter');

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for rate limiting behind reverse proxy (must be before other middleware)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Signature', 'X-Timestamp', 'X-Nonce'],
}));

// Block blacklisted IPs
app.use(blockBlacklistedIPs);

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

module.exports = app;
