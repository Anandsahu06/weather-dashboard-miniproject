/**
 * Weather Dashboard - Client-Side JavaScript
 * 
 * Features:
 * - Smart City Autocomplete with debounced geocoding API queries
 * - Full keyboard accessibility (Arrow Up, Arrow Down, Enter, Escape)
 * - Real Current Location Weather using Browser Geolocation API
 * - Clean asynchronous client-server communication using Fetch API
 * - Local city time & astronomical day-length calculations
 * - Clean UI state transitions (Default, Loading, Results, Error Banners)
 * 
 * College Mini Project - Weather Dashboard
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

  // 6 Metric Cards
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
    // Search input typing
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

    // Debounce geocoding query by 300ms to avoid flooding the API
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

    // Directly fetch using precise latitude and longitude
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

    // Verify browser Geolocation API support
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

    setLoadingState(true, 'Fetching live meteorological data...');
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

      // Render valid weather payload
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
    const { location, temperature, condition, metrics, astronomy, timestamp } = weather;

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

    // 1. Humidity
    if (metrics.humidity !== null) {
      valHumidity.textContent = metrics.humidity;
      humidityDescription.textContent = getHumidityDescription(metrics.humidity);
    } else {
      valHumidity.textContent = '--';
      humidityDescription.textContent = 'Not available';
    }

    // 2. Wind Speed
    if (metrics.windSpeed !== null) {
      valWindSpeed.textContent = metrics.windSpeed;
      valWindMs.textContent = `${metrics.windSpeedMs} m/s`;
    } else {
      valWindSpeed.textContent = '--';
      valWindMs.textContent = '-- m/s';
    }

    // 3. Pressure
    if (metrics.pressure !== null) {
      valPressure.textContent = metrics.pressure;
      pressureStatus.textContent = getPressureDescription(metrics.pressure);
    } else {
      valPressure.textContent = '--';
      pressureStatus.textContent = 'Not available';
    }

    // 4. Feels Like
    valFeelsLike.textContent = temperature.feels_like;
    const diff = temperature.feels_like - temperature.current;
    if (diff === 0) {
      feelsLikeSummary.textContent = 'Equal to air temp';
    } else if (diff > 0) {
      feelsLikeSummary.textContent = `+${diff}°C warmer`;
    } else {
      feelsLikeSummary.textContent = `${diff}°C cooler`;
    }

    // 5. Visibility
    if (metrics.visibilityKm !== null) {
      valVisibility.textContent = metrics.visibilityKm;
      visibilityStatus.textContent = getVisibilityDescription(metrics.visibilityKm);
    } else {
      valVisibility.textContent = '--';
      visibilityStatus.textContent = 'Not available';
    }

    // 6. Cloudiness
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
  // 8. Helper Functions
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

  // View State Management
  function setLoadingState(isLoading, message = 'Fetching live weather data...') {
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
