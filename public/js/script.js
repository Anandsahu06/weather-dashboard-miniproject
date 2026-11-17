/**
 * Weather Dashboard - Client-Side JavaScript
 * 
 * Demonstrates:
 * - DOM manipulation & event handling
 * - Fetch API integration with backend REST endpoints
 * - Asynchronous JavaScript (Async/Await)
 * - Safe data binding (preventing XSS)
 * - Timezone conversions for city astronomical data
 * - Responsive UI state transitions (Default, Loading, Results, Errors)
 * 
 * College Mini Project - Weather Dashboard
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DOM Element References
  // ==========================================================================

  // Forms and Search Controls
  const searchForm = document.getElementById('weatherSearchForm');
  const cityInput = document.getElementById('cityInput');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const searchBtn = document.getElementById('searchBtn');
  const quickCitiesContainer = document.getElementById('quickCities');

  // UI View States
  const defaultState = document.getElementById('defaultState');
  const loadingState = document.getElementById('loadingState');
  const weatherResults = document.getElementById('weatherResults');

  // Alert Banner
  const errorAlert = document.getElementById('errorAlert');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');
  const closeAlertBtn = document.getElementById('closeAlertBtn');

  // Header Elements
  const apiStatusText = document.getElementById('apiStatusText');
  const apiStatusChip = document.getElementById('apiStatusChip');
  const currentDateDisplay = document.getElementById('currentDateDisplay');

  // Hero Card Elements
  const displayCity = document.getElementById('displayCity');
  const displayCountry = document.getElementById('displayCountry');
  const displayCoordinates = document.getElementById('displayCoordinates');
  const displayLocalTime = document.getElementById('displayLocalTime');
  const displayLastUpdated = document.getElementById('displayLastUpdated');
  const displayTemp = document.getElementById('displayTemp');
  const displayFeelsLikeHero = document.getElementById('displayFeelsLikeHero');
  const valHigh = document.getElementById('valHigh');
  const valLow = document.getElementById('valLow');
  const weatherIconImg = document.getElementById('weatherIconImg');
  const displayCondition = document.getElementById('displayCondition');

  // 6 Metric Cards Elements
  const valHumidity = document.getElementById('valHumidity');
  const humidityBar = document.getElementById('humidityBar');
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
  const cloudinessBar = document.getElementById('cloudinessBar');
  const cloudsStatus = document.getElementById('cloudsStatus');

  // Solar Schedule Elements
  const valSunrise = document.getElementById('valSunrise');
  const valSunset = document.getElementById('valSunset');
  const valDayLength = document.getElementById('valDayLength');

  // State variable to avoid duplicate concurrent calls
  let activeAbortController = null;
  let isFetching = false;

  // ==========================================================================
  // 2. Initialization & Setup
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    initCurrentDate();
    checkServerHealth();
    bindEvents();

    // Check if user previously looked up a city in current session
    const lastCity = sessionStorage.getItem('weather_last_searched');
    if (lastCity) {
      cityInput.value = lastCity;
      clearInputBtn.classList.remove('hidden');
    }
  });

  /**
   * Formats and sets today's date in header.
   */
  function initCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    currentDateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }

  /**
   * Performs initial health ping to verify server connectivity.
   */
  async function checkServerHealth() {
    const statusDot = apiStatusChip.querySelector('.status-dot');
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        statusDot.className = 'status-dot online';
        apiStatusText.textContent = 'Server Online';
      } else {
        statusDot.className = 'status-dot error';
        apiStatusText.textContent = 'API Error';
      }
    } catch (_) {
      statusDot.className = 'status-dot error';
      apiStatusText.textContent = 'Server Offline';
    }
  }

  // ==========================================================================
  // 3. Event Listeners
  // ==========================================================================

  function bindEvents() {
    // Form submit
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSearch();
    });

    // Input changes (show/hide clear button)
    cityInput.addEventListener('input', () => {
      if (cityInput.value.trim().length > 0) {
        clearInputBtn.classList.remove('hidden');
      } else {
        clearInputBtn.classList.add('hidden');
      }
    });

    // Clear input button
    clearInputBtn.addEventListener('click', () => {
      cityInput.value = '';
      clearInputBtn.classList.add('hidden');
      cityInput.focus();
    });

    // Close alert banner button
    closeAlertBtn.addEventListener('click', () => {
      hideAlert();
    });

    // Quick select city chips
    if (quickCitiesContainer) {
      quickCitiesContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.city-chip');
        if (chip && chip.dataset.city) {
          cityInput.value = chip.dataset.city;
          clearInputBtn.classList.remove('hidden');
          executeSearch();
        }
      });
    }

    // Weather icon fallback handler
    weatherIconImg.addEventListener('error', () => {
      weatherIconImg.src = 'assets/favicon.svg';
    });
  }

  // ==========================================================================
  // 4. Core Search Execution
  // ==========================================================================

  async function executeSearch() {
    const rawCity = cityInput.value;
    const trimmedCity = rawCity.trim();

    // 1. Validate empty submission
    if (!trimmedCity) {
      showAlert('Empty Search', 'Please enter a city name to search (e.g., London, Tokyo, Delhi).');
      cityInput.focus();
      return;
    }

    // 2. Prevent duplicate submissions while in-flight
    if (isFetching) {
      if (activeAbortController) {
        activeAbortController.abort();
      }
    }

    activeAbortController = new AbortController();
    setLoadingState(true);
    hideAlert();

    try {
      isFetching = true;
      const endpoint = `/api/weather?city=${encodeURIComponent(trimmedCity)}`;

      const response = await fetch(endpoint, {
        signal: activeAbortController.signal,
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Unable to retrieve weather data.';
        const errCode = result.code || 'UNKNOWN_ERROR';
        
        let customTitle = 'Search Error';
        if (response.status === 404) customTitle = 'City Not Found';
        else if (response.status === 401) customTitle = 'API Authentication Failed';
        else if (response.status === 429) customTitle = 'Rate Limit Reached';
        else if (errCode === 'API_KEY_MISSING') customTitle = 'Server Configuration Required';

        showAlert(customTitle, errorMsg);
        showDefaultState();
        return;
      }

      // Successful data retrieval
      renderWeatherData(result.data);
      sessionStorage.setItem('weather_last_searched', trimmedCity);

    } catch (err) {
      if (err.name === 'AbortError') {
        // Request cancelled by another user action
        return;
      }
      showAlert(
        'Connection Failed',
        'Could not communicate with the weather server. Please check your internet connection and verify the backend is running.'
      );
      showDefaultState();
    } finally {
      isFetching = false;
      setLoadingState(false);
    }
  }

  // ==========================================================================
  // 5. Data Rendering & Formatting
  // ==========================================================================

  /**
   * Safely updates all DOM elements with live weather response data.
   * @param {object} weather - Processed weather object from backend.
   */
  function renderWeatherData(weather) {
    const { location, temperature, condition, metrics, astronomy, timestamp } = weather;

    // Location & Coordinates
    displayCity.textContent = location.city;
    displayCountry.textContent = location.country || '--';
    
    const latFormatted = `${Math.abs(location.coordinates.latitude)}° ${location.coordinates.latitude >= 0 ? 'N' : 'S'}`;
    const lonFormatted = `${Math.abs(location.coordinates.longitude)}° ${location.coordinates.longitude >= 0 ? 'E' : 'W'}`;
    displayCoordinates.textContent = `${latFormatted}, ${lonFormatted}`;

    // Target City Local Time
    const cityLocalTime = calculateLocalTimeString(Date.now() / 1000, astronomy.timezoneOffset);
    const tzHours = astronomy.timezoneOffset / 3600;
    const tzString = `GMT${tzHours >= 0 ? '+' : ''}${tzHours}`;
    displayLocalTime.textContent = `Local: ${cityLocalTime} (${tzString})`;

    // Timestamp
    const updateTime = new Date(timestamp);
    displayLastUpdated.textContent = `Updated ${updateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Main Temperatures
    displayTemp.textContent = temperature.current;
    displayFeelsLikeHero.textContent = `${temperature.feels_like}°C`;
    valHigh.textContent = temperature.temp_max !== null ? `${temperature.temp_max}°C` : '--';
    valLow.textContent = temperature.temp_min !== null ? `${temperature.temp_min}°C` : '--';

    // Condition & Icon
    displayCondition.textContent = condition.description || condition.main;
    weatherIconImg.src = condition.iconUrl;
    weatherIconImg.alt = condition.description || 'Weather condition';

    // 1. Humidity
    if (metrics.humidity !== null) {
      valHumidity.textContent = metrics.humidity;
      humidityBar.style.width = `${Math.min(100, Math.max(0, metrics.humidity))}%`;
      humidityDescription.textContent = getHumidityDescription(metrics.humidity);
    } else {
      valHumidity.textContent = '--';
      humidityBar.style.width = '0%';
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
      pressureStatus.textContent = 'Barometric pressure';
    }

    // 4. Feels Like Card
    valFeelsLike.textContent = temperature.feels_like;
    const diff = temperature.feels_like - temperature.current;
    if (diff === 0) {
      feelsLikeSummary.textContent = 'Matches actual temperature';
    } else if (diff > 0) {
      feelsLikeSummary.textContent = `Feels +${diff}°C warmer`;
    } else {
      feelsLikeSummary.textContent = `Feels ${diff}°C cooler`;
    }

    // 5. Visibility
    if (metrics.visibilityKm !== null) {
      valVisibility.textContent = metrics.visibilityKm;
      visibilityStatus.textContent = getVisibilityDescription(metrics.visibilityKm);
    } else {
      valVisibility.textContent = '--';
      visibilityStatus.textContent = 'Horizontal range';
    }

    // 6. Cloudiness
    if (metrics.cloudiness !== null) {
      valCloudiness.textContent = metrics.cloudiness;
      cloudinessBar.style.width = `${Math.min(100, Math.max(0, metrics.cloudiness))}%`;
      cloudsStatus.textContent = getCloudinessDescription(metrics.cloudiness);
    } else {
      valCloudiness.textContent = '--';
      cloudinessBar.style.width = '0%';
    }

    // Solar Schedule (Formatted to City's Local Time!)
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

    // Show Results
    showResultsView();
  }

  // ==========================================================================
  // 6. Helper Functions (Timezone, Descriptions, UI States)
  // ==========================================================================

  /**
   * Calculates the exact local 12-hour formatted time in a target city
   * using UTC timestamp in seconds and city's timezone offset in seconds.
   */
  function calculateLocalTimeString(unixSec, offsetSec) {
    if (!unixSec) return '--:-- --';
    // Shift time by timezone offset
    const shiftedDate = new Date((unixSec + offsetSec) * 1000);
    let hours = shiftedDate.getUTCHours();
    const minutes = String(shiftedDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  function getHumidityDescription(humidity) {
    if (humidity < 30) return 'Dry air condition';
    if (humidity <= 60) return 'Comfortable humidity level';
    if (humidity <= 80) return 'Humid environment';
    return 'Very humid / muggy';
  }

  function getPressureDescription(pressure) {
    if (pressure < 1000) return 'Low pressure system';
    if (pressure <= 1020) return 'Normal barometric pressure';
    return 'High pressure system';
  }

  function getVisibilityDescription(km) {
    const num = parseFloat(km);
    if (num >= 10) return 'Maximum clear visibility';
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

  // UI State toggles
  function setLoadingState(isLoading) {
    if (isLoading) {
      loadingState.classList.remove('hidden');
      defaultState.classList.add('hidden');
      weatherResults.classList.add('hidden');
      searchBtn.disabled = true;
      cityInput.disabled = true;
    } else {
      loadingState.classList.add('hidden');
      searchBtn.disabled = false;
      cityInput.disabled = false;
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
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    errorAlert.classList.add('hidden');
  }

})();
