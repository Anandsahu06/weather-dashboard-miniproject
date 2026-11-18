/**
 * Weather Dashboard - Client-Side JavaScript
 * 
 * Features:
 * - Smart City Autocomplete with debounced geocoding API queries
 * - Full keyboard accessibility (Arrow Up, Arrow Down, Enter, Escape)
 * - Real Current Location Weather using Browser Geolocation API
 * - Rule-Based Weather Recommendations Engine
 * - Weighted Weather Comfort Score (0-100) Algorithm
 * - Hourly Weather Forecast (Next 24 hours at 3-hour intervals)
 * - Smart Weather Alerts & Condition Notifications
 * - "Plan Your Day" Outdoor Activity Scheduler
 * 
 * College Mini Project - Location-Aware Weather Dashboard
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DOM Element References
  // ==========================================================================

  // Search Controls
  const cityInput = document.getElementById('cityInput');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const searchBtn = document.getElementById('searchBtn');
  const locationBtn = document.getElementById('locationBtn');
  const autocompleteList = document.getElementById('autocompleteList');
  const quickCitiesContainer = document.getElementById('quickCities');

  // UI View Panels
  const defaultState = document.getElementById('defaultState');
  const loadingState = document.getElementById('loadingState');
  const loadingMessage = document.getElementById('loadingMessage');
  const weatherResults = document.getElementById('weatherResults');

  // Alert Banner
  const errorAlert = document.getElementById('errorAlert');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');
  const closeAlertBtn = document.getElementById('closeAlertBtn');

  // Header Elements
  const serverStatus = document.getElementById('serverStatus');
  const serverStatusText = document.getElementById('serverStatusText');
  const currentDateDisplay = document.getElementById('currentDateDisplay');

  // Main Weather Hero Elements
  const displayCity = document.getElementById('displayCity');
  const displayCountry = document.getElementById('displayCountry');
  const displayCoordinates = document.getElementById('displayCoordinates');
  const displayLocalTime = document.getElementById('displayLocalTime');
  const displayLastUpdated = document.getElementById('displayLastUpdated');
  const displayTemp = document.getElementById('displayTemp');
  const weatherIconImg = document.getElementById('weatherIconImg');
  const displayCondition = document.getElementById('displayCondition');
  const displayFeelsLikeHero = document.getElementById('displayFeelsLikeHero');

  // Weather Comfort Score Elements
  const valComfortScore = document.getElementById('valComfortScore');
  const comfortBadge = document.getElementById('comfortBadge');
  const comfortTempFactor = document.getElementById('comfortTempFactor');
  const comfortHumidFactor = document.getElementById('comfortHumidFactor');
  const comfortWindFactor = document.getElementById('comfortWindFactor');
  const comfortSummary = document.getElementById('comfortSummary');

  // Smart Recommendations & Planner
  const recommendationsList = document.getElementById('recommendationsList');
  const plannerHeadline = document.getElementById('plannerHeadline');
  const plannerAdvice = document.getElementById('plannerAdvice');
  const weatherAlertsContainer = document.getElementById('weatherAlertsContainer');

  // Hourly Forecast Timeline
  const hourlyForecastTimeline = document.getElementById('hourlyForecastTimeline');

  // 6 Metric Cells
  const valHumidity = document.getElementById('valHumidity');
  const humidityDescription = document.getElementById('humidityDescription');

  const valWindSpeed = document.getElementById('valWindSpeed');
  const valWindMs = document.getElementById('valWindMs');

  const valPressure = document.getElementById('valPressure');
  const pressureStatus = document.getElementById('pressureStatus');

  const valFeelsLike = document.getElementById('valFeelsLike');
  const feelsLikeSummary = document.getElementById('feelsLikeSummary');

  const valVisibility = document.getElementById('valVisibility');
  const visibilityStatus = document.getElementById('visibilityStatus');

  const valCloudiness = document.getElementById('valCloudiness');
  const cloudsStatus = document.getElementById('cloudsStatus');

  // Solar Schedule Elements
  const valSunrise = document.getElementById('valSunrise');
  const valSunset = document.getElementById('valSunset');
  const valDayLength = document.getElementById('valDayLength');

  // Runtime State
  let autocompleteDebounceTimer = null;
  let activeAutocompleteController = null;
  let activeWeatherFetchController = null;
  let currentActiveIndex = -1;
  let currentSuggestions = [];

  // ==========================================================================
  // 2. Initialization
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    initDateDisplay();
    checkServerHealth();
    bindEvents();
  });

  function initDateDisplay() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }

  async function checkServerHealth() {
    const dot = serverStatus.querySelector('.status-dot');
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        dot.className = 'status-dot online';
        serverStatusText.textContent = 'Online';
      } else {
        dot.className = 'status-dot error';
        serverStatusText.textContent = 'API Error';
      }
    } catch (_) {
      dot.className = 'status-dot error';
      serverStatusText.textContent = 'Offline';
    }
  }

  // ==========================================================================
  // 3. Event Listeners & Binding
  // ==========================================================================

  function bindEvents() {
    // Search input typing with autocomplete
    cityInput.addEventListener('input', handleInputChange);

    // Keyboard navigation in search input (ArrowUp, ArrowDown, Enter, Escape)
    cityInput.addEventListener('keydown', handleInputKeyDown);

    // Search button click
    searchBtn.addEventListener('click', () => {
      closeAutocomplete();
      executeCitySearch(cityInput.value);
    });

    // Clear input button
    clearInputBtn.addEventListener('click', () => {
      cityInput.value = '';
      clearInputBtn.classList.add('hidden');
      closeAutocomplete();
      cityInput.focus();
    });

    // Use My Location button
    locationBtn.addEventListener('click', handleCurrentLocationRequest);

    // Quick select city chips
    if (quickCitiesContainer) {
      quickCitiesContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.quick-chip');
        if (chip && chip.dataset.city) {
          cityInput.value = chip.dataset.city;
          clearInputBtn.classList.remove('hidden');
          closeAutocomplete();
          executeCitySearch(chip.dataset.city);
        }
      });
    }

    // Dismiss alert button
    closeAlertBtn.addEventListener('click', hideAlert);

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-field-container')) {
        closeAutocomplete();
      }
    });

    // Weather icon fallback
    weatherIconImg.addEventListener('error', () => {
      weatherIconImg.src = 'assets/favicon.svg';
    });
  }

  // ==========================================================================
  // 4. Smart City Autocomplete Search
  // ==========================================================================

  function handleInputChange() {
    const rawVal = cityInput.value;
    const trimmed = rawVal.trim();

    if (trimmed.length > 0) {
      clearInputBtn.classList.remove('hidden');
    } else {
      clearInputBtn.classList.add('hidden');
      closeAutocomplete();
      return;
    }

    clearTimeout(autocompleteDebounceTimer);
    autocompleteDebounceTimer = setTimeout(() => {
      fetchCitySuggestions(trimmed);
    }, 300);
  }

  async function fetchCitySuggestions(query) {
    if (activeAutocompleteController) {
      activeAutocompleteController.abort();
    }
    activeAutocompleteController = new AbortController();

    try {
      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`, {
        signal: activeAutocompleteController.signal
      });

      if (!response.ok) {
        closeAutocomplete();
        return;
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
        currentSuggestions = result.suggestions;
        renderAutocompleteList(result.suggestions);
      } else {
        closeAutocomplete();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        closeAutocomplete();
      }
    }
  }

  function renderAutocompleteList(suggestions) {
    autocompleteList.innerHTML = '';
    currentActiveIndex = -1;

    suggestions.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item';
      li.setAttribute('role', 'option');
      li.setAttribute('data-index', index);

      const cityNameSpan = document.createElement('span');
      cityNameSpan.className = 'autocomplete-city-name';
      cityNameSpan.textContent = item.name;

      const regionSpan = document.createElement('span');
      regionSpan.className = 'autocomplete-region';
      const parts = [item.state, item.country].filter(Boolean);
      regionSpan.textContent = parts.length > 0 ? `(${parts.join(', ')})` : '';

      li.appendChild(cityNameSpan);
      li.appendChild(regionSpan);

      li.addEventListener('click', () => {
        selectSuggestion(item);
      });

      autocompleteList.appendChild(li);
    });

    autocompleteList.classList.remove('hidden');
  }

  function selectSuggestion(item) {
    const displayName = item.name + (item.country ? `, ${item.country}` : '');
    cityInput.value = displayName;
    clearInputBtn.classList.remove('hidden');
    closeAutocomplete();

    if (typeof item.lat === 'number' && typeof item.lon === 'number') {
      fetchWeatherByCoordinates(item.lat, item.lon);
    } else {
      executeCitySearch(item.name);
    }
  }

  function handleInputKeyDown(e) {
    const isDropdownVisible = !autocompleteList.classList.contains('hidden');

    if (e.key === 'ArrowDown') {
      if (isDropdownVisible && currentSuggestions.length > 0) {
        e.preventDefault();
        currentActiveIndex = (currentActiveIndex + 1) % currentSuggestions.length;
        updateActiveSuggestionItem();
      }
    } else if (e.key === 'ArrowUp') {
      if (isDropdownVisible && currentSuggestions.length > 0) {
        e.preventDefault();
        currentActiveIndex = (currentActiveIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
        updateActiveSuggestionItem();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownVisible && currentActiveIndex >= 0 && currentSuggestions[currentActiveIndex]) {
        selectSuggestion(currentSuggestions[currentActiveIndex]);
      } else {
        closeAutocomplete();
        executeCitySearch(cityInput.value);
      }
    } else if (e.key === 'Escape') {
      closeAutocomplete();
    }
  }

  function updateActiveSuggestionItem() {
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    items.forEach((el, idx) => {
      if (idx === currentActiveIndex) {
        el.classList.add('active');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('active');
      }
    });
  }

  function closeAutocomplete() {
    autocompleteList.classList.add('hidden');
    autocompleteList.innerHTML = '';
    currentActiveIndex = -1;
    currentSuggestions = [];
  }

  // ==========================================================================
  // 5. Real Current Location Weather (Browser Geolocation API)
  // ==========================================================================

  function handleCurrentLocationRequest() {
    closeAutocomplete();
    hideAlert();

    if (!('geolocation' in navigator)) {
      showAlert(
        'Geolocation Unsupported',
        'Your browser does not support geolocation detection. Please search for your city manually above.'
      );
      return;
    }

    setLoadingState(true, 'Detecting your current location...');
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationBtn.disabled = false;
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLoadingState(true, 'Retrieving live weather for your location...');
        fetchWeatherByCoordinates(lat, lon);
      },
      (error) => {
        locationBtn.disabled = false;
        setLoadingState(false);
        showDefaultState();

        switch (error.code) {
          case error.PERMISSION_DENIED:
            showAlert(
              'Location Access Denied',
              'You denied the request for current location. You can search for your city name manually in the search bar.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            showAlert(
              'Location Unavailable',
              'Location information is unavailable on your device or network. Please search by city name.'
            );
            break;
          case error.TIMEOUT:
            showAlert(
              'Location Timed Out',
              'The request to determine your location timed out. Please try again or search manually.'
            );
            break;
          default:
            showAlert(
              'Location Error',
              'An unexpected error occurred while detecting your location. Please enter your city name.'
            );
            break;
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // ==========================================================================
  // 6. Weather API Execution & Response Handling
  // ==========================================================================

  async function executeCitySearch(cityName) {
    const trimmed = cityName ? cityName.trim() : '';

    if (!trimmed) {
      showAlert('Empty Search', 'Please enter a city name to search (e.g. Kanpur, Delhi, London).');
      cityInput.focus();
      return;
    }

    fetchWeatherFromEndpoint(`/api/weather?city=${encodeURIComponent(trimmed)}`);
  }

  async function fetchWeatherByCoordinates(lat, lon) {
    fetchWeatherFromEndpoint(`/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
  }

  async function fetchWeatherFromEndpoint(endpoint) {
    if (activeWeatherFetchController) {
      activeWeatherFetchController.abort();
    }
    activeWeatherFetchController = new AbortController();

    setLoadingState(true, 'Fetching live meteorological data & forecast...');
    hideAlert();

    try {
      const response = await fetch(endpoint, {
        signal: activeWeatherFetchController.signal,
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Failed to retrieve weather data.';
        let title = 'Weather Search Error';

        if (response.status === 404) title = 'City Not Found';
        else if (response.status === 401) title = 'API Authentication Required';
        else if (response.status === 429) title = 'Rate Limit Reached';
        else if (result.code === 'API_KEY_MISSING') title = 'Configuration Required';

        showAlert(title, errorMsg);
        showDefaultState();
        return;
      }

      renderWeatherData(result.data);

    } catch (err) {
      if (err.name === 'AbortError') return;

      showAlert(
        'Connection Error',
        'Unable to communicate with the weather server. Please check your internet connection and verify the backend is running.'
      );
      showDefaultState();
    } finally {
      setLoadingState(false);
    }
  }

  // ==========================================================================
  // 7. Data Rendering & Normalization
  // ==========================================================================

  function renderWeatherData(weather) {
    const { location, temperature, condition, metrics, astronomy, forecast, timestamp } = weather;

    // Location
    displayCity.textContent = location.city;
    const regionParts = [location.state, location.country].filter(Boolean);
    displayCountry.textContent = regionParts.length > 0 ? regionParts.join(', ') : '';

    // Coordinates
    const latFormatted = `${Math.abs(location.coordinates.latitude)}° ${location.coordinates.latitude >= 0 ? 'N' : 'S'}`;
    const lonFormatted = `${Math.abs(location.coordinates.longitude)}° ${location.coordinates.longitude >= 0 ? 'E' : 'W'}`;
    displayCoordinates.textContent = `${latFormatted}, ${lonFormatted}`;

    // Target City Local Time
    const cityLocalTime = calculateLocalTimeString(Date.now() / 1000, astronomy.timezoneOffset);
    const tzHours = astronomy.timezoneOffset / 3600;
    const tzLabel = `GMT${tzHours >= 0 ? '+' : ''}${tzHours}`;
    displayLocalTime.textContent = `Local: ${cityLocalTime} (${tzLabel})`;

    // Updated Time
    const updateTime = new Date(timestamp);
    displayLastUpdated.textContent = `Updated ${updateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Main Temperatures
    displayTemp.textContent = temperature.current;
    displayFeelsLikeHero.textContent = `${temperature.feels_like}°C`;

    // Condition & Icon
    displayCondition.textContent = condition.description || condition.main;
    weatherIconImg.src = condition.iconUrl;
    weatherIconImg.alt = condition.description || 'Current weather condition';

    // 1. Weather Comfort Score (Feature 3)
    renderComfortScore(temperature.current, metrics.humidity, metrics.windSpeed);

    // 2. Smart Weather Recommendations (Feature 2)
    renderRecommendations(weather, forecast);

    // 3. Daily Planner & Smart Alerts (Features 5 & 6)
    renderDailyPlanAndAlerts(weather, forecast);

    // 4. Hourly Forecast Timeline (Feature 4)
    renderHourlyForecast(forecast);

    // 5. Atmospheric Metrics Grid
    // Humidity
    if (metrics.humidity !== null) {
      valHumidity.textContent = metrics.humidity;
      humidityDescription.textContent = getHumidityDescription(metrics.humidity);
    } else {
      valHumidity.textContent = '--';
      humidityDescription.textContent = 'Not available';
    }

    // Wind Speed
    if (metrics.windSpeed !== null) {
      valWindSpeed.textContent = metrics.windSpeed;
      valWindMs.textContent = `${metrics.windSpeedMs} m/s`;
    } else {
      valWindSpeed.textContent = '--';
      valWindMs.textContent = '-- m/s';
    }

    // Pressure
    if (metrics.pressure !== null) {
      valPressure.textContent = metrics.pressure;
      pressureStatus.textContent = getPressureDescription(metrics.pressure);
    } else {
      valPressure.textContent = '--';
      pressureStatus.textContent = 'Not available';
    }

    // Feels Like
    valFeelsLike.textContent = temperature.feels_like;
    const diff = temperature.feels_like - temperature.current;
    if (diff === 0) {
      feelsLikeSummary.textContent = 'Equal to air temp';
    } else if (diff > 0) {
      feelsLikeSummary.textContent = `+${diff}°C warmer`;
    } else {
      feelsLikeSummary.textContent = `${diff}°C cooler`;
    }

    // Visibility
    if (metrics.visibilityKm !== null) {
      valVisibility.textContent = metrics.visibilityKm;
      visibilityStatus.textContent = getVisibilityDescription(metrics.visibilityKm);
    } else {
      valVisibility.textContent = '--';
      visibilityStatus.textContent = 'Not available';
    }

    // Cloudiness
    if (metrics.cloudiness !== null) {
      valCloudiness.textContent = metrics.cloudiness;
      cloudsStatus.textContent = getCloudinessDescription(metrics.cloudiness);
    } else {
      valCloudiness.textContent = '--';
      cloudsStatus.textContent = 'Not available';
    }

    // Solar Schedule (Formatted to target city's local time)
    if (astronomy.sunrise) {
      valSunrise.textContent = calculateLocalTimeString(astronomy.sunrise, astronomy.timezoneOffset);
    } else {
      valSunrise.textContent = '--:-- --';
    }

    if (astronomy.sunset) {
      valSunset.textContent = calculateLocalTimeString(astronomy.sunset, astronomy.timezoneOffset);
    } else {
      valSunset.textContent = '--:-- --';
    }

    // Daylight Duration
    if (astronomy.sunrise && astronomy.sunset) {
      const daylightSeconds = Math.max(0, astronomy.sunset - astronomy.sunrise);
      const hours = Math.floor(daylightSeconds / 3600);
      const mins = Math.floor((daylightSeconds % 3600) / 60);
      valDayLength.textContent = `${hours} hrs ${mins} mins`;
    } else {
      valDayLength.textContent = '-- hrs -- mins';
    }

    // Show Results Panel
    showResultsView();
  }

  // ==========================================================================
  // 8. Smart Feature Engines
  // ==========================================================================

  /**
   * Feature 3: Weather Comfort Score Calculation (0-100)
   * Formula: Comfort Score = (Temperature Score × 0.40) + (Humidity Score × 0.30) + (Wind Score × 0.30)
   */
  function calculateComfortScore(temp, humidity, windSpeedKmH) {
    if (temp === null || humidity === null || windSpeedKmH === null ||
        temp === undefined || humidity === undefined || windSpeedKmH === undefined) {
      return null;
    }

    // 1. Temperature Score (40% Weight) - Ideal: 20°C - 25°C
    let tempScore = 100;
    if (temp < 20) {
      tempScore = Math.max(0, 100 - (20 - temp) * 3.8);
    } else if (temp > 25) {
      tempScore = Math.max(0, 100 - (temp - 25) * 4.5);
    }

    // 2. Humidity Score (30% Weight) - Ideal: 40% - 55%
    let humidScore = 100;
    if (humidity < 40) {
      humidScore = Math.max(0, 100 - (40 - humidity) * 2.8);
    } else if (humidity > 55) {
      humidScore = Math.max(0, 100 - (humidity - 55) * 2.2);
    }

    // 3. Wind Score (30% Weight) - Ideal: 0 - 12 km/h
    let windScore = 100;
    if (windSpeedKmH > 12) {
      windScore = Math.max(0, 100 - (windSpeedKmH - 12) * 3.2);
    }

    const finalScore = Math.round((tempScore * 0.40) + (humidScore * 0.30) + (windScore * 0.30));
    const score = Math.min(100, Math.max(0, finalScore));

    let label = 'Moderate';
    let tagClass = 'moderate';
    let summary = 'Moderate atmospheric conditions for everyday activities.';

    if (score >= 80) {
      label = 'Very Comfortable';
      tagClass = 'very-comfortable';
      summary = 'Optimal temperature, gentle breeze, and comfortable humidity level.';
    } else if (score >= 60) {
      label = 'Comfortable';
      tagClass = 'comfortable';
      summary = 'Pleasant weather conditions suitable for outdoor routines and walks.';
    } else if (score >= 40) {
      label = 'Moderate';
      tagClass = 'moderate';
      summary = 'Acceptable outdoor comfort; consider temperature when dressing.';
    } else if (score >= 20) {
      label = 'Uncomfortable';
      tagClass = 'uncomfortable';
      summary = 'Elevated heat, high humidity, or brisk winds reduce outdoor comfort.';
    } else {
      label = 'Poor Conditions';
      tagClass = 'poor';
      summary = 'Adverse meteorological conditions; stay indoors if possible.';
    }

    return {
      score,
      label,
      tagClass,
      summary,
      tempScore: Math.round(tempScore),
      humidScore: Math.round(humidScore),
      windScore: Math.round(windScore)
    };
  }

  function renderComfortScore(temp, humidity, windSpeed) {
    const result = calculateComfortScore(temp, humidity, windSpeed);

    if (!result) {
      valComfortScore.textContent = '--';
      comfortBadge.className = 'comfort-tag';
      comfortBadge.textContent = 'Unavailable';
      comfortTempFactor.textContent = '--';
      comfortHumidFactor.textContent = '--';
      comfortWindFactor.textContent = '--';
      comfortSummary.textContent = 'Insufficient meteorological metrics to calculate comfort index.';
      return;
    }

    valComfortScore.textContent = result.score;
    comfortBadge.className = `comfort-tag ${result.tagClass}`;
    comfortBadge.textContent = result.label;
    comfortTempFactor.textContent = `${result.tempScore}%`;
    comfortHumidFactor.textContent = `${result.humidScore}%`;
    comfortWindFactor.textContent = `${result.windScore}%`;
    comfortSummary.textContent = result.summary;
  }

  /**
   * Feature 2: Rule-Based Weather Recommendations Engine
   */
  function generateSmartRecommendations(currentWeather, forecastList) {
    const recs = [];
    const temp = currentWeather.temperature?.current;
    const feels = currentWeather.temperature?.feels_like;
    const wind = currentWeather.metrics?.windSpeed;
    const visibility = currentWeather.metrics?.visibilityKm;
    const condition = currentWeather.condition?.main?.toLowerCase() || '';

    // Analyze upcoming precipitation in forecast
    let maxPop = 0;
    let rainTime = '';
    let hasUpcomingRain = false;
    let isHeavyRain = false;

    if (Array.isArray(forecastList)) {
      for (const slot of forecastList) {
        if (slot.pop > maxPop) {
          maxPop = slot.pop;
          rainTime = slot.timeFormatted;
        }
        if (slot.pop >= 40 || slot.condition.toLowerCase().includes('rain')) {
          hasUpcomingRain = true;
        }
        if (slot.rainMm >= 4 || slot.description.toLowerCase().includes('heavy') || slot.condition === 'Thunderstorm') {
          isHeavyRain = true;
        }
      }
    }

    // Rule 1: Active or Upcoming Rain
    if (condition.includes('rain') || condition.includes('drizzle')) {
      recs.push({
        title: 'Carry an umbrella before heading outside.',
        reason: 'Active rainfall or drizzle currently detected in the area.'
      });
    } else if (hasUpcomingRain && maxPop >= 40) {
      recs.push({
        title: 'Keep an umbrella or raincoat handy today.',
        reason: `Upcoming rain probability reaches ${maxPop}% around ${rainTime}.`
      });
    }

    // Rule 2: Heavy Rainfall or Thunderstorm
    if (isHeavyRain || condition === 'thunderstorm') {
      recs.push({
        title: 'Heavy rain or storm may impact outdoor plans.',
        reason: 'Significant precipitation or storm activity identified in upcoming intervals.'
      });
    }

    // Rule 3: High Temperature & Heat
    if (temp !== undefined && temp >= 34) {
      recs.push({
        title: 'Stay well-hydrated and avoid prolonged direct sun.',
        reason: `High heat index with ambient temperature at ${temp}°C (feels like ${feels}°C).`
      });
    }

    // Rule 4: Low Temperature & Cold
    if (temp !== undefined && temp <= 12) {
      recs.push({
        title: 'Consider wearing warm layered clothing.',
        reason: `Chilly ambient conditions with current temperature at ${temp}°C.`
      });
    } else if (temp !== undefined && temp <= 4) {
      recs.push({
        title: 'Risk of frost; dress in heavy thermal wear.',
        reason: `Near-freezing temperatures currently at ${temp}°C.`
      });
    }

    // Rule 5: High Wind Speed
    if (wind !== null && wind >= 28) {
      recs.push({
        title: 'Strong winds may make outdoor activities uncomfortable.',
        reason: `Surface gusts reaching ${wind} km/h.`
      });
    }

    // Rule 6: Poor Visibility / Fog
    if (visibility !== null && visibility <= 2.5) {
      recs.push({
        title: 'Drive carefully and maintain safe braking distance.',
        reason: `Horizontal visibility reduced to ${visibility} km due to haze/fog.`
      });
    }

    // Baseline: Comfortable Weather
    if (recs.length === 0) {
      recs.push({
        title: 'Weather conditions look suitable for outdoor activities.',
        reason: `Mild temperature (${temp}°C), calm winds, and 0% rain probability predicted.`
      });
    }

    return recs.slice(0, 3);
  }

  function renderRecommendations(weather, forecast) {
    const recs = generateSmartRecommendations(weather, forecast);
    recommendationsList.innerHTML = '';

    recs.forEach(rec => {
      const li = document.createElement('li');
      li.className = 'rec-item';

      li.innerHTML = `
        <div class="rec-header">
          <svg class="rec-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="rec-text">${escapeHtml(rec.title)}</span>
        </div>
        <p class="rec-reason"><strong>Reason:</strong> ${escapeHtml(rec.reason)}</p>
      `;

      recommendationsList.appendChild(li);
    });
  }

  /**
   * Features 5 & 6: Daily Planner & Weather Condition Notifications
   */
  function renderDailyPlanAndAlerts(weather, forecast) {
    // 1. Plan Your Day
    const plan = generateDailyPlan(weather, forecast);
    plannerHeadline.textContent = plan.headline;
    plannerAdvice.textContent = plan.advice;

    // 2. Weather Alerts
    const alerts = generateSmartAlerts(weather, forecast);
    weatherAlertsContainer.innerHTML = '';

    if (alerts.length === 0) {
      const stableAlert = document.createElement('div');
      stableAlert.className = 'alert-item severity-low';
      stableAlert.innerHTML = `
        <div class="alert-item-header">
          <span class="alert-item-title">Stable Conditions</span>
          <span class="alert-badge">Notice</span>
        </div>
        <p class="alert-item-reason">No adverse weather alerts identified. Atmospheric readings remain normal.</p>
      `;
      weatherAlertsContainer.appendChild(stableAlert);
    } else {
      alerts.forEach(alt => {
        const div = document.createElement('div');
        div.className = `alert-item severity-${alt.severity}`;
        div.innerHTML = `
          <div class="alert-item-header">
            <span class="alert-item-title">${escapeHtml(alt.title)}</span>
            <span class="alert-badge">${escapeHtml(alt.severity)}</span>
          </div>
          <p class="alert-item-reason">${escapeHtml(alt.reason)}</p>
        `;
        weatherAlertsContainer.appendChild(div);
      });
    }
  }

  function generateDailyPlan(currentWeather, forecastList) {
    if (!Array.isArray(forecastList) || forecastList.length === 0) {
      return {
        headline: 'Outdoor Planning Guidance',
        advice: 'Current conditions are stable. Check periodic updates before scheduling long outdoor activities.'
      };
    }

    // Find the most optimal slot for outdoor activities
    let bestSlot = null;
    let bestScore = -Infinity;

    forecastList.forEach(slot => {
      let score = 100;
      score -= (slot.pop || 0) * 0.8; // Heavy penalty for rain
      score -= Math.abs((slot.temp || 22) - 22) * 3; // Penalty for extreme deviation from 22°C
      if (slot.windSpeed > 20) score -= (slot.windSpeed - 20) * 2;

      if (score > bestScore) {
        bestScore = score;
        bestSlot = slot;
      }
    });

    if (bestSlot) {
      const rainContext = bestSlot.pop > 0 ? `(${bestSlot.pop}% rain chance)` : '(0% rain chance)';
      return {
        headline: `Best outdoor window: ${bestSlot.timeFormatted} (${bestSlot.temp}°C, ${bestSlot.condition})`,
        advice: `Atmospheric metrics around ${bestSlot.timeFormatted} look most favorable with ${bestSlot.description} and ${rainContext}.`
      };
    }

    return {
      headline: 'Plan Your Day',
      advice: 'Meteorological conditions appear uniform across upcoming forecast hours.'
    };
  }

  function generateSmartAlerts(currentWeather, forecastList) {
    const alerts = [];
    const temp = currentWeather.temperature?.current;
    const wind = currentWeather.metrics?.windSpeed;
    const visibility = currentWeather.metrics?.visibilityKm;
    const mainCond = currentWeather.condition?.main || '';

    // Severe: Thunderstorm
    if (mainCond === 'Thunderstorm') {
      alerts.push({
        title: 'Thunderstorm Advisory',
        severity: 'high',
        reason: 'Active lightning and electrical storm recorded in the area.'
      });
    }

    // Severe: Extreme Heat
    if (temp !== undefined && temp >= 40) {
      alerts.push({
        title: 'Excessive Heat Advisory',
        severity: 'high',
        reason: `Temperatures exceed 40°C (${temp}°C). Heat exhaustion risk for outdoor workers.`
      });
    }

    // Moderate: Heavy Rain Forecast
    let maxPop = 0;
    let rainTime = '';
    if (Array.isArray(forecastList)) {
      forecastList.forEach(slot => {
        if (slot.pop > maxPop) {
          maxPop = slot.pop;
          rainTime = slot.timeFormatted;
        }
      });
    }

    if (maxPop >= 70) {
      alerts.push({
        title: 'Heavy Rain Watch',
        severity: 'moderate',
        reason: `High rain chance (${maxPop}%) forecast around ${rainTime}.`
      });
    } else if (maxPop >= 40) {
      alerts.push({
        title: 'Precipitation Notice',
        severity: 'low',
        reason: `${maxPop}% probability of precipitation around ${rainTime}.`
      });
    }

    // Moderate: High Wind
    if (wind !== null && wind >= 35) {
      alerts.push({
        title: 'High Wind Notification',
        severity: 'moderate',
        reason: `Strong winds exceeding 35 km/h (${wind} km/h).`
      });
    }

    // Moderate: Dense Fog
    if (visibility !== null && visibility <= 1.5) {
      alerts.push({
        title: 'Reduced Visibility Warning',
        severity: 'moderate',
        reason: `Dense fog/haze reducing horizontal visibility below 1.5 km (${visibility} km).`
      });
    }

    return alerts.slice(0, 2);
  }

  /**
   * Feature 4: Hourly Weather Forecast Timeline (Next 24 Hours)
   */
  function renderHourlyForecast(forecastList) {
    hourlyForecastTimeline.innerHTML = '';

    if (!Array.isArray(forecastList) || forecastList.length === 0) {
      hourlyForecastTimeline.innerHTML = '<p class="forecast-subtitle" style="padding: 1rem;">Hourly forecast data is currently unavailable.</p>';
      return;
    }

    forecastList.forEach((slot, index) => {
      const card = document.createElement('div');
      card.className = `hourly-card ${index === 0 ? 'active-slot' : ''}`;

      const popDisplay = slot.pop > 0 
        ? `<span class="hourly-pop">💧 ${slot.pop}%</span>` 
        : '<span class="hourly-pop" style="opacity: 0.6;">0%</span>';

      card.innerHTML = `
        <span class="hourly-time">${escapeHtml(slot.timeFormatted)}</span>
        <img class="hourly-icon" src="${escapeHtml(slot.iconUrl)}" alt="${escapeHtml(slot.description)}" onerror="this.src='assets/favicon.svg'"/>
        <span class="hourly-temp">${slot.temp}°C</span>
        ${popDisplay}
      `;

      hourlyForecastTimeline.appendChild(card);
    });
  }

  // ==========================================================================
  // 9. Helper Functions
  // ==========================================================================

  function calculateLocalTimeString(unixSec, offsetSec) {
    if (!unixSec) return '--:-- --';
    const shiftedDate = new Date((unixSec + offsetSec) * 1000);
    let hours = shiftedDate.getUTCHours();
    const minutes = String(shiftedDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function getHumidityDescription(humidity) {
    if (humidity < 30) return 'Dry air condition';
    if (humidity <= 60) return 'Comfortable level';
    if (humidity <= 80) return 'Humid environment';
    return 'Very humid / muggy';
  }

  function getPressureDescription(pressure) {
    if (pressure < 1000) return 'Low pressure';
    if (pressure <= 1020) return 'Normal barometric';
    return 'High pressure';
  }

  function getVisibilityDescription(km) {
    const num = parseFloat(km);
    if (num >= 10) return 'Maximum clear';
    if (num >= 5) return 'Good visibility';
    if (num >= 2) return 'Moderate haze';
    return 'Poor visibility / fog';
  }

  function getCloudinessDescription(clouds) {
    if (clouds <= 15) return 'Clear skies';
    if (clouds <= 50) return 'Partly cloudy';
    if (clouds <= 85) return 'Broken clouds';
    return 'Overcast sky';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // View State Management
  function setLoadingState(isLoading, message = 'Fetching live meteorological data...') {
    if (isLoading) {
      loadingMessage.textContent = message;
      loadingState.classList.remove('hidden');
      defaultState.classList.add('hidden');
      weatherResults.classList.add('hidden');
      searchBtn.disabled = true;
    } else {
      loadingState.classList.add('hidden');
      searchBtn.disabled = false;
    }
  }

  function showResultsView() {
    defaultState.classList.add('hidden');
    weatherResults.classList.remove('hidden');
  }

  function showDefaultState() {
    weatherResults.classList.add('hidden');
    defaultState.classList.remove('hidden');
  }

  function showAlert(title, message) {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    errorAlert.classList.remove('hidden');
  }

  function hideAlert() {
    errorAlert.classList.add('hidden');
  }

})();
