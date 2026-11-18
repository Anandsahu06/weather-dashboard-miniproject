/**
 * Weather Service
 * 
 * Handles all external interactions with the OpenWeather API:
 * 1. Geocoding API (Direct): converts city query to coordinates and autocomplete suggestions.
 * 2. Geocoding API (Reverse): resolves coordinates to city, state, and country.
 * 3. Current Weather API: fetches real-time meteorological metrics.
 * 4. 5-Day / 3-Hour Forecast API: retrieves upcoming forecast intervals and precipitation probability.
 * 
 * College Mini Project - Weather Dashboard with Smart Recommendations
 */

const OPENWEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const OPENWEATHER_REVERSE_GEO_URL = 'https://api.openweathermap.org/geo/1.0/reverse';
const OPENWEATHER_DATA_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Validates whether the API key is configured.
 * @returns {string} The active OpenWeather API key.
 */
function getApiKey() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_api_key_here') {
    const error = new Error(
      'OpenWeather API key is not configured on the server. Please add your OPENWEATHER_API_KEY in the .env file.'
    );
    error.code = 'API_KEY_MISSING';
    error.status = 500;
    throw error;
  }
  return apiKey.trim();
}

/**
 * Helper to fetch with timeout and standard error mapping.
 * @param {string} url - API URL to call.
 * @returns {Promise<any>} Parsed JSON response.
 */
async function fetchWithTimeout(url) {
  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'Accept': 'application/json'
      }
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.code === 'ABORT_ERR') {
      const error = new Error('Weather service request timed out. Please check your internet connection.');
      error.code = 'TIMEOUT';
      error.status = 504;
      throw error;
    }
    const error = new Error('Network failure: Unable to reach OpenWeather servers. Please check your internet connection.');
    error.code = 'NETWORK_ERROR';
    error.status = 503;
    throw error;
  }

  // Handle HTTP status codes
  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error('The OpenWeather API key is unauthorized or pending activation. (Note: Newly created OpenWeather keys usually take 10 to 30 minutes to activate across OpenWeather servers).');
      error.code = 'INVALID_API_KEY';
      error.status = 401;
      throw error;
    }
    if (response.status === 429) {
      const error = new Error('OpenWeather API rate limit reached. Please wait a moment and try again.');
      error.code = 'RATE_LIMITED';
      error.status = 429;
      throw error;
    }
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || '';
    } catch (_) {
      // Ignore JSON parse error on non-OK body
    }
    const error = new Error(
      `OpenWeather API error (${response.status}): ${errorDetail || response.statusText}`
    );
    error.code = 'UPSTREAM_API_ERROR';
    error.status = response.status >= 500 ? 502 : response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch (err) {
    const error = new Error('Received malformed response from OpenWeather API.');
    error.code = 'MALFORMED_RESPONSE';
    error.status = 502;
    throw error;
  }
}

/**
 * Normalizes raw forecast list into the next 8 available forecast periods (24 hours).
 * Formats time in the target city's local timezone.
 */
function normalizeForecastList(rawList, timezoneOffset = 0) {
  if (!Array.isArray(rawList)) return [];

  // Take the next 8 periods (covering 24 hours at 3-hour increments)
  return rawList.slice(0, 8).map(item => {
    const primaryWeather = (item.weather && item.weather[0]) || {};
    const shiftedDate = new Date((item.dt + timezoneOffset) * 1000);
    let hours = shiftedDate.getUTCHours();
    const minutes = String(shiftedDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeFormatted = `${hour12}:${minutes} ${ampm}`;

    return {
      timestamp: item.dt,
      timeFormatted,
      temp: Math.round(item.main?.temp || 0),
      feels_like: Math.round(item.main?.feels_like || 0),
      humidity: item.main?.humidity !== undefined ? item.main.humidity : null,
      condition: primaryWeather.main || 'Clear',
      description: primaryWeather.description || 'Clear sky',
      icon: primaryWeather.icon || '01d',
      iconUrl: `https://openweathermap.org/img/wn/${primaryWeather.icon || '01d'}@2x.png`,
      pop: Math.round((item.pop || 0) * 100), // Probability of precipitation (0-100%)
      rainMm: item.rain && item.rain['3h'] !== undefined ? Number(item.rain['3h'].toFixed(1)) : 0,
      windSpeed: item.wind && item.wind.speed !== undefined
        ? Math.round(item.wind.speed * 3.6 * 10) / 10
        : null
    };
  });
}

/**
 * Normalizes OpenWeather response into a truthful, clean payload.
 */
function normalizeWeatherData(weatherData, locationOverride = {}, rawForecast = null) {
  const primaryWeather = (weatherData.weather && weatherData.weather[0]) || {};
  const tzOffset = weatherData.timezone !== undefined ? weatherData.timezone : 0;
  const forecast = rawForecast ? normalizeForecastList(rawForecast.list, tzOffset) : [];

  return {
    success: true,
    data: {
      location: {
        city: locationOverride.city || weatherData.name || 'Unknown Location',
        country: locationOverride.country || (weatherData.sys && weatherData.sys.country) || '',
        state: locationOverride.state || null,
        coordinates: {
          latitude: locationOverride.lat !== undefined ? locationOverride.lat : Number((weatherData.coord?.lat || 0).toFixed(4)),
          longitude: locationOverride.lon !== undefined ? locationOverride.lon : Number((weatherData.coord?.lon || 0).toFixed(4))
        }
      },
      temperature: {
        current: Math.round(weatherData.main?.temp || 0),
        feels_like: Math.round(weatherData.main?.feels_like || 0),
        unit: '°C'
      },
      condition: {
        main: primaryWeather.main || 'Clear',
        description: primaryWeather.description || 'Clear sky',
        icon: primaryWeather.icon || '01d',
        iconUrl: `https://openweathermap.org/img/wn/${primaryWeather.icon || '01d'}@2x.png`
      },
      metrics: {
        humidity: weatherData.main?.humidity !== undefined ? weatherData.main.humidity : null,
        humidityUnit: '%',
        windSpeed: weatherData.wind && weatherData.wind.speed !== undefined 
          ? Math.round(weatherData.wind.speed * 3.6 * 10) / 10 
          : null, // Converted accurately from m/s to km/h
        windSpeedMs: weatherData.wind && weatherData.wind.speed !== undefined ? weatherData.wind.speed : null,
        windUnit: 'km/h',
        pressure: weatherData.main?.pressure !== undefined ? weatherData.main.pressure : null,
        pressureUnit: 'hPa',
        visibilityKm: weatherData.visibility !== undefined 
          ? Number((weatherData.visibility / 1000).toFixed(1)) 
          : null,
        cloudiness: weatherData.clouds && weatherData.clouds.all !== undefined ? weatherData.clouds.all : null,
        cloudinessUnit: '%'
      },
      astronomy: {
        sunrise: weatherData.sys && weatherData.sys.sunrise ? weatherData.sys.sunrise : null,
        sunset: weatherData.sys && weatherData.sys.sunset ? weatherData.sys.sunset : null,
        timezoneOffset: tzOffset
      },
      forecast,
      timestamp: Date.now()
    }
  };
}

/**
 * Fetches current weather and forecast for a city name.
 * @param {string} cityName - Name of the city to look up.
 * @returns {Promise<object>} Clean, formatted weather data.
 */
async function fetchWeatherByCity(cityName) {
  const apiKey = getApiKey();
  const trimmedCity = cityName.trim();

  // 1. Geocoding API call
  const geoUrl = `${OPENWEATHER_GEO_URL}?q=${encodeURIComponent(trimmedCity)}&limit=1&appid=${apiKey}`;
  const geoData = await fetchWithTimeout(geoUrl);

  if (!Array.isArray(geoData) || geoData.length === 0) {
    const error = new Error(`City "${trimmedCity}" was not found. Please verify the city name and spelling.`);
    error.code = 'CITY_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const location = geoData[0];
  const { lat, lon, name, country, state } = location;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    const error = new Error('Invalid geographical coordinates received for the requested city.');
    error.code = 'INVALID_COORDINATES';
    error.status = 502;
    throw error;
  }

  // 2. Fetch Current Weather and Forecast in parallel
  const weatherUrl = `${OPENWEATHER_DATA_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const forecastUrl = `${OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const [weatherData, forecastData] = await Promise.all([
    fetchWithTimeout(weatherUrl),
    fetchWithTimeout(forecastUrl).catch(() => null) // Gracefully fallback if forecast has issues
  ]);

  if (!weatherData || !weatherData.main || !Array.isArray(weatherData.weather) || weatherData.weather.length === 0) {
    const error = new Error('Incomplete weather records received from OpenWeather API.');
    error.code = 'INCOMPLETE_DATA';
    error.status = 502;
    throw error;
  }

  return normalizeWeatherData(weatherData, {
    city: name || trimmedCity,
    state: state || null,
    country: country || '',
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4))
  }, forecastData);
}

/**
 * Fetches current weather and forecast for geographic coordinates (Browser Geolocation).
 * @param {number} lat - Latitude (-90 to 90).
 * @param {number} lon - Longitude (-180 to 180).
 * @returns {Promise<object>} Clean, formatted weather data.
 */
async function fetchWeatherByCoordinates(lat, lon) {
  const apiKey = getApiKey();

  const weatherUrl = `${OPENWEATHER_DATA_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const reverseGeoUrl = `${OPENWEATHER_REVERSE_GEO_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
  const forecastUrl = `${OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  // Execute queries in parallel
  const [weatherData, reverseData, forecastData] = await Promise.all([
    fetchWithTimeout(weatherUrl),
    fetchWithTimeout(reverseGeoUrl).catch(() => null),
    fetchWithTimeout(forecastUrl).catch(() => null)
  ]);

  if (!weatherData || !weatherData.main || !Array.isArray(weatherData.weather) || weatherData.weather.length === 0) {
    const error = new Error('Incomplete weather records received for coordinates.');
    error.code = 'INCOMPLETE_DATA';
    error.status = 502;
    throw error;
  }

  let locationInfo = {
    city: weatherData.name || 'Current Location',
    state: null,
    country: (weatherData.sys && weatherData.sys.country) || '',
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4))
  };

  if (Array.isArray(reverseData) && reverseData.length > 0) {
    const bestMatch = reverseData[0];
    locationInfo.city = bestMatch.name || locationInfo.city;
    locationInfo.state = bestMatch.state || null;
    locationInfo.country = bestMatch.country || locationInfo.country;
  }

  return normalizeWeatherData(weatherData, locationInfo, forecastData);
}

/**
 * Standalone forecast fetcher for coordinates or city.
 */
async function fetchForecast(lat, lon) {
  const apiKey = getApiKey();
  const forecastUrl = `${OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const forecastData = await fetchWithTimeout(forecastUrl);

  const tzOffset = forecastData.city?.timezone || 0;
  return {
    success: true,
    city: forecastData.city?.name || 'Unknown',
    country: forecastData.city?.country || '',
    timezoneOffset: tzOffset,
    forecast: normalizeForecastList(forecastData.list, tzOffset)
  };
}

/**
 * Fetches dynamic city autocomplete suggestions using OpenWeather Geocoding API.
 * @param {string} query - Typed prefix/search term.
 * @returns {Promise<Array<object>>} Matching city suggestions.
 */
async function getCitySuggestions(query) {
  const apiKey = getApiKey();
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 1) {
    return [];
  }

  const geoUrl = `${OPENWEATHER_GEO_URL}?q=${encodeURIComponent(trimmed)}&limit=5&appid=${apiKey}`;
  const results = await fetchWithTimeout(geoUrl);

  if (!Array.isArray(results)) {
    return [];
  }

  // Deduplicate and format suggestions
  const seen = new Set();
  const suggestions = [];

  for (const item of results) {
    const label = `${item.name}-${item.state || ''}-${item.country}`;
    if (!seen.has(label)) {
      seen.add(label);
      suggestions.push({
        name: item.name,
        state: item.state || null,
        country: item.country,
        lat: Number(item.lat.toFixed(4)),
        lon: Number(item.lon.toFixed(4))
      });
    }
  }

  return suggestions;
}

module.exports = {
  fetchWeatherByCity,
  fetchWeatherByCoordinates,
  fetchForecast,
  getCitySuggestions
};
