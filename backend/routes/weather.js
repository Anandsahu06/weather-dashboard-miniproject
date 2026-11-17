/**
 * Weather & Health Routes
 * 
 * Handles incoming HTTP requests for:
 * - GET /api/health  -> Health check status
 * - GET /api/weather -> Fetch weather by city query parameter
 * 
 * College Mini Project - Weather Dashboard
 */

const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

/**
 * Health Check Endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Weather Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Weather Query Endpoint
 * GET /api/weather?city=London
 */
router.get('/weather', async (req, res) => {
  try {
    const rawCity = req.query.city;

    // Validate query parameter existence
    if (!rawCity || typeof rawCity !== 'string' || rawCity.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'City name is required. Please enter a city name to search.',
        code: 'MISSING_CITY_PARAMETER'
      });
    }

    const city = rawCity.trim();

    // Validate string length to prevent abuse
    if (city.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'City name is too long. Please enter a valid city name under 100 characters.',
        code: 'CITY_NAME_TOO_LONG'
      });
    }

    // Call service layer to fetch validated weather data
    const weatherData = await weatherService.fetchWeatherByCity(city);

    return res.status(200).json(weatherData);
  } catch (error) {
    // Map status code or default to 500
    const statusCode = error.status || 500;

    // Return safe, user-friendly JSON error without exposing backend secrets or stack traces
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An unexpected error occurred while fetching weather data.',
      code: error.code || 'INTERNAL_ERROR'
    });
  }
});

/**
 * 404 handler for unrecognized /api routes
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.originalUrl}' not found.`,
    code: 'NOT_FOUND'
  });
});

module.exports = router;
