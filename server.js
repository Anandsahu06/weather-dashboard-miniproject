/**
 * Weather Dashboard - Server Entry Point
 * 
 * Express application serving both:
 * - Static frontend client from /public
 * - REST API endpoints (/api/health, /api/weather)
 * 
 * College Mini Project
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const weatherRoutes = require('./backend/routes/weather');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin flexibility
app.use(cors());

// Parse incoming request payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes under /api
app.use('/api', weatherRoutes);

// Fallback: serve index.html for non-API client routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global application error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Start Express HTTP Server
// Listening on 0.0.0.0 ensures compatibility with cloud platforms like Render
const server = app.listen(PORT, '0.0.0.0', () => {
  const isKeyConfigured = process.env.OPENWEATHER_API_KEY && 
    process.env.OPENWEATHER_API_KEY.trim() !== '' && 
    process.env.OPENWEATHER_API_KEY.trim() !== 'your_api_key_here';

  console.log('====================================================');
  console.log('  WEATHER DASHBOARD - REAL-TIME INFORMATION SYSTEM');
  console.log('====================================================');
  console.log(`  Local URL:        http://localhost:${PORT}`);
  console.log(`  Health Check:     http://localhost:${PORT}/api/health`);
  console.log(`  Weather API:      http://localhost:${PORT}/api/weather?city=London`);
  console.log(`  OpenWeather Key:  ${isKeyConfigured ? 'CONFIGURED [OK]' : 'NOT CONFIGURED (Update .env)'}`);
  console.log('====================================================');
});

module.exports = app;
