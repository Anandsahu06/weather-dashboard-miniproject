/**
 * Weather Service
 * 
 * Handles all external interactions with the OpenWeather API:
 * 1. Geocoding API (Direct): converts city name to lat & lon coordinates.
 * 2. Current Weather API: fetches real-time meteorological metrics for the coordinates.
 * 
 * College Mini Project - Weather Dashboard
 */

const OPENWEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const OPENWEATHER_DATA_URL = 'https://api.openweathermap.org/data/2.5/weather';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Validates whether the API key is configured and not a placeholder.
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
 * Fetches data with timeout and error mapping.
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
      const error = new Error('The OpenWeather API key is invalid or unauthorized. Please verify your key.');
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
 * Fetches current weather for a city name.
 * 
 * Step 1: Geocode city name to lat & lon.
 * Step 2: Fetch current weather for coordinates.
 * Step 3: Format and validate returned payload.
 * 
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

  // 2. Current Weather API call using lat and lon
  const weatherUrl = `${OPENWEATHER_DATA_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const weatherData = await fetchWithTimeout(weatherUrl);

  // 3. Validate weather data
  if (!weatherData || !weatherData.main || !Array.isArray(weatherData.weather) || weatherData.weather.length === 0) {
    const error = new Error('Incomplete weather records received from OpenWeather API.');
    error.code = 'INCOMPLETE_DATA';
    error.status = 502;
    throw error;
  }

  const primaryWeather = weatherData.weather[0];

  // 4. Return clean, normalized payload
  return {
    success: true,
    data: {
      location: {
        city: name || trimmedCity,
        country: country || (weatherData.sys && weatherData.sys.country) || '',
        state: state || null,
        coordinates: {
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4))
        }
      },
      temperature: {
        current: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        temp_min: weatherData.main.temp_min !== undefined ? Math.round(weatherData.main.temp_min) : null,
        temp_max: weatherData.main.temp_max !== undefined ? Math.round(weatherData.main.temp_max) : null,
        unit: '°C'
      },
      condition: {
        main: primaryWeather.main || 'Clear',
        description: primaryWeather.description || 'Clear skies',
        icon: primaryWeather.icon || '01d',
        iconUrl: `https://openweathermap.org/img/wn/${primaryWeather.icon || '01d'}@2x.png`
      },
      metrics: {
        humidity: weatherData.main.humidity !== undefined ? weatherData.main.humidity : null,
        humidityUnit: '%',
        windSpeed: weatherData.wind && weatherData.wind.speed !== undefined 
          ? Math.round(weatherData.wind.speed * 3.6 * 10) / 10 
          : null, // Converted to km/h for standard readability
        windSpeedMs: weatherData.wind && weatherData.wind.speed !== undefined ? weatherData.wind.speed : null,
        windUnit: 'km/h',
        pressure: weatherData.main.pressure !== undefined ? weatherData.main.pressure : null,
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
        timezoneOffset: weatherData.timezone !== undefined ? weatherData.timezone : 0
      },
      timestamp: Date.now()
    }
  };
}

module.exports = {
  fetchWeatherByCity
};
