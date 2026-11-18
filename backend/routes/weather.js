/**
 * Weather, Forecast & Health Routes
 * 
 * Handles incoming HTTP requests for:
 * - GET /api/health       -> Health check status
 * - GET /api/weather      -> Fetch current weather + forecast by city or coordinates
 * - GET /api/forecast     -> Standalone forecast endpoint by coordinates or city
 * - GET /api/suggestions  -> Dynamic city autocomplete suggestions
 * 
 * College Mini Project - Location-Aware Weather Dashboard
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
 * City Autocomplete Suggestions Endpoint
 * GET /api/suggestions?q=Kan
 */
router.get('/suggestions', async (req, res) => {
  try {
    const rawQuery = req.query.q || req.query.query;

    if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim().length === 0) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    const query = rawQuery.trim();
    if (query.length > 80) {
      return res.status(400).json({
        success: false,
        error: 'Search query is too long.',
        code: 'QUERY_TOO_LONG'
      });
    }

    const suggestions = await weatherService.getCitySuggestions(query);
    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unable to retrieve city suggestions.',
      code: error.code || 'SUGGESTION_ERROR'
    });
  }
});

/**
 * Weather Query Endpoint
 * Supports:
 * - By City Name:    GET /api/weather?city=Kanpur
 * - By Coordinates:  GET /api/weather?lat=26.46&lon=80.32
 */
router.get('/weather', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    // 1. Check if coordinates were provided (Browser Geolocation)
    if (lat !== undefined && lon !== undefined) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates provided. Latitude must be between -90 and 90, longitude between -180 and 180.',
          code: 'INVALID_COORDINATES'
        });
      }

      const weatherData = await weatherService.fetchWeatherByCoordinates(parsedLat, parsedLon);
      return res.status(200).json(weatherData);
    }

    // 2. Check if city name was provided
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a city name or latitude and longitude coordinates.',
        code: 'MISSING_PARAMETERS'
      });
    }

    const trimmedCity = city.trim();
    if (trimmedCity.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'City name is too long. Please enter a city name under 100 characters.',
        code: 'CITY_NAME_TOO_LONG'
      });
    }

    const weatherData = await weatherService.fetchWeatherByCity(trimmedCity);
    return res.status(200).json(weatherData);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An unexpected error occurred while fetching weather data.',
      code: error.code || 'INTERNAL_ERROR'
    });
  }
});

/**
 * Standalone Forecast Endpoint
 * GET /api/forecast?lat=26.46&lon=80.32
 * or GET /api/forecast?city=Kanpur
 */
router.get('/forecast', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    if (lat !== undefined && lon !== undefined) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);

      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates provided.',
          code: 'INVALID_COORDINATES'
        });
      }

      const forecastData = await weatherService.fetchForecast(parsedLat, parsedLon);
      return res.status(200).json(forecastData);
    }

    if (city && typeof city === 'string' && city.trim().length > 0) {
      const weatherData = await weatherService.fetchWeatherByCity(city.trim());
      return res.status(200).json({
        success: true,
        city: weatherData.data.location.city,
        country: weatherData.data.location.country,
        timezoneOffset: weatherData.data.astronomy.timezoneOffset,
        forecast: weatherData.data.forecast
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Please provide either coordinates (lat and lon) or a city name.',
      code: 'MISSING_PARAMETERS'
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unable to retrieve forecast data.',
      code: error.code || 'FORECAST_ERROR'
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
