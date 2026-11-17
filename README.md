# Weather Dashboard: A Real-Time Weather Information System Using Web API

A modern, responsive, full-stack web application developed as a college mini-project. It enables users to look up real-time weather information for any city across the globe using external RESTful Web APIs provided by OpenWeather.

---

## 1. Project Introduction

Weather significantly impacts everyday routines, global logistics, agriculture, and emergency preparedness. **Weather Dashboard** is a lightweight, responsive web application engineered to bridge meteorological data providers with end users through an intuitive, dark-themed dashboard. 

The application adheres to clean client-server architecture principles:
- The **frontend** is built using standard **HTML5, CSS3, and Vanilla JavaScript** to deliver a fast, dependency-free user interface.
- The **backend** is implemented using **Node.js and Express.js**, acting as a secure proxy gateway that safeguards external API credentials, prevents Cross-Origin Resource Sharing (CORS) complications, normalizes JSON payloads, and handles error states.

---

## 2. Problem Statement

Most traditional weather reporting systems either:
1. Overcomplicate simple user queries with heavy client bundles, sluggish rendering, and bloated advertisement-driven interfaces.
2. Expose confidential third-party API tokens directly in client-side JavaScript, leaving developers susceptible to rate-limiting abuse, key revocation, and credential scraping.
3. Lack resilience against edge cases such as misspelled city names, network connectivity hiccups, and varying geographical timezones.

This mini-project demonstrates how to overcome these hurdles by constructing an agile, secure, and resilient weather platform using foundational web standards.

---

## 3. Project Objectives

- **Practical Frontend Engineering:** Construct a modular, responsive user interface without bloated frameworks (pure HTML5, CSS3 Grid/Flexbox, and DOM APIs).
- **Backend Architecture & Proxying:** Build a Node.js/Express server that isolates sensitive environment variables (`OPENWEATHER_API_KEY`) and prevents key exposure to the client.
- **RESTful API Integration & Orchestration:** Chain two external OpenWeather APIs:
  1. *Geocoding API:* Translates natural language city names into precise geographic coordinates (latitude and longitude).
  2. *Current Weather API:* Fetches real-time atmospheric metrics using the resolved coordinates.
- **Data Normalization & Formatting:** Compute metric values (Celsius, km/h, hPa) and calculate accurate city-specific local times based on UTC offsets.
- **Robust Error Handling & Graceful Degradation:** Manage invalid city queries, missing API keys, upstream rate-limiting, and network timeouts with friendly user feedback.
- **Production & College Viva Readiness:** Ensure the application is structured cleanly, easy to explain during academic viva evaluations, and deployable to cloud services such as Render.

---

## 4. Key Features

- 🌍 **Global City Search:** Search for any city worldwide with full support for multi-word city names (e.g., "New York", "San Francisco", "New Delhi").
- ⚡ **Instant Quick Select Chips:** Quick-access pills for popular cities (London, Delhi, New York, Tokyo, Paris, Sydney) for instant demonstration.
- 🌡️ **Primary Weather Metrics:**
  - Large focal temperature in degrees Celsius (°C).
  - High and Low daily temperatures.
  - Perceived "Feels Like" thermal index.
  - Current condition text with dynamic OpenWeather condition icons.
- 📊 **6 Specialized Atmospheric Metric Cards:**
  1. **Humidity:** Relative humidity percentage with a visual gauge and comfort level indicator.
  2. **Wind Speed:** Surface velocity reported in both `km/h` and `m/s`.
  3. **Atmospheric Pressure:** Barometric sea-level pressure measured in `hPa`.
  4. **Perceived Temperature:** Thermal variance compared to measured temperature.
  5. **Visibility:** Clear horizontal distance in kilometers (`km`).
  6. **Cloud Cover:** Percentage sky cloudiness with a visual progress bar.
- ☀️ **Astronomical Solar Schedule:**
  - Exact local Sunrise and Sunset times calculated using the target city's UTC timezone offset.
  - Calculated daily sunlight duration (e.g., `11 hrs 24 mins`).
- 🛡️ **Secure Backend Proxy:** API keys are stored exclusively in `.env` and are never dispatched to the browser.
- 📱 **Fully Responsive UI:** Seamless layout across desktops, laptops, tablets, and smartphones (no horizontal scroll).
- 🔄 **Real-Time Server Health Check:** Header status badge actively pings the backend `/api/health` route.

---

## 5. Technology Stack

### Frontend
- **HTML5:** Semantic document structure (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- **CSS3:** Custom properties (CSS variables), Grid, Flexbox, Glassmorphism, animations, and media queries.
- **Vanilla JavaScript (ES6+):** Async/Await, Fetch API, DOM manipulation, and dynamic event listeners.

### Backend
- **Node.js (v18+ or v20+):** JavaScript runtime environment.
- **Express.js (v4):** Lightweight HTTP server, static asset hosting, and REST API routing.
- **dotenv:** Environment variable isolation and configuration.
- **cors:** Cross-Origin Resource Sharing middleware.

### External APIs
- **OpenWeather Geocoding API:** `https://api.openweathermap.org/geo/1.0/direct`
- **OpenWeather Current Weather API:** `https://api.openweathermap.org/data/2.5/weather`

---

## 6. Project Folder Structure

```
weatherdashboardminiproject/
│
├── backend/
│   ├── routes/
│   │   └── weather.js          # Express route definitions (/api/health, /api/weather)
│   └── services/
│       └── weatherService.js   # OpenWeather API integration and payload normalization
│
├── public/                     # Static frontend files served by Express
│   ├── assets/
│   │   └── favicon.svg         # SVG application icon
│   ├── css/
│   │   └── style.css           # Premium dark-theme styling and responsive media queries
│   ├── js/
│   │   └── script.js           # Client-side UI logic, Fetch API calls, and event listeners
│   └── index.html              # Main dashboard markup
│
├── .env                        # Local environment variables (ignored by Git)
├── .env.example                # Example environment variable template
├── .gitignore                  # Git ignore rules for node_modules and .env
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Application entry point and Express server initialization
└── README.md                   # Comprehensive project documentation
```

---

## 7. OpenWeather API Setup

To obtain live weather data, you must provide a valid OpenWeather API key.

1. Visit [https://openweathermap.org/api](https://openweathermap.org/api).
2. Click **Sign In** or create a free OpenWeather account.
3. Once logged in, navigate to your account profile and open the **API keys** tab.
4. Copy your default API key (or generate a new one with a name such as `WeatherDashboard`).
5. *Note:* Newly generated OpenWeather API keys usually take between **10 to 30 minutes** to activate on OpenWeather servers.

---

## 8. Installation & Setup Instructions

### Prerequisites
- Node.js (version 18.0.0 or higher recommended)
- npm (Node Package Manager)

### Step 1: Clone or Navigate to the Project Directory
```bash
cd weatherdashboardminiproject
```

### Step 2: Install Project Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Open `.env` in any text editor and insert your valid OpenWeather API key:
```ini
OPENWEATHER_API_KEY=your_actual_api_key_here
PORT=3000
```

---

## 9. Running the Application

### Production / Standard Mode
```bash
npm start
```

### Development Mode (Automatic Reload)
```bash
npm run dev
```

The Express server will start up and print:
```
====================================================
  WEATHER DASHBOARD - REAL-TIME INFORMATION SYSTEM
====================================================
  Local URL:        http://localhost:3000
  Health Check:     http://localhost:3000/api/health
  Weather API:      http://localhost:3000/api/weather?city=London
  OpenWeather Key:  CONFIGURED [OK]
====================================================
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 10. API Endpoint Documentation

All backend endpoints are prefixed with `/api`.

### 1. Health Check Endpoint
- **URL:** `/api/health`
- **Method:** `GET`
- **Description:** Verifies that the Express server is up and responsive.
- **Example Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "message": "Weather Dashboard API is running",
    "timestamp": "2026-11-18T01:25:00.000Z"
  }
  ```

---

### 2. Weather Query Endpoint
- **URL:** `/api/weather`
- **Method:** `GET`
- **Query Parameter:**
  - `city` *(required, string)*: The name of the city to query (e.g. `London`, `Tokyo`, `Delhi`).
- **Example Request:**
  ```http
  GET /api/weather?city=London HTTP/1.1
  Host: localhost:3000
  ```

- **Example Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "location": {
        "city": "London",
        "country": "GB",
        "state": "England",
        "coordinates": {
          "latitude": 51.5073,
          "longitude": -0.1276
        }
      },
      "temperature": {
        "current": 15,
        "feels_like": 14,
        "temp_min": 13,
        "temp_max": 16,
        "unit": "°C"
      },
      "condition": {
        "main": "Clouds",
        "description": "broken clouds",
        "icon": "04d",
        "iconUrl": "https://openweathermap.org/img/wn/04d@2x.png"
      },
      "metrics": {
        "humidity": 76,
        "humidityUnit": "%",
        "windSpeed": 14.8,
        "windSpeedMs": 4.12,
        "windUnit": "km/h",
        "pressure": 1018,
        "pressureUnit": "hPa",
        "visibilityKm": 10.0,
        "cloudiness": 75,
        "cloudinessUnit": "%"
      },
      "astronomy": {
        "sunrise": 1661834187,
        "sunset": 1661885972,
        "timezoneOffset": 3600
      },
      "timestamp": 1661870592000
    }
  }
  ```

- **Error Responses:**
  - **`400 Bad Request`:** City name missing or exceeds 100 characters.
    ```json
    {
      "success": false,
      "error": "City name is required. Please enter a city name to search.",
      "code": "MISSING_CITY_PARAMETER"
    }
    ```
  - **`404 Not Found`:** City does not exist in OpenWeather database.
    ```json
    {
      "success": false,
      "error": "City \"AtlantisXYZ\" was not found. Please verify the city name and spelling.",
      "code": "CITY_NOT_FOUND"
    }
    ```
  - **`401 Unauthorized`:** Upstream API key is invalid or deactivated.
    ```json
    {
      "success": false,
      "error": "The OpenWeather API key is invalid or unauthorized. Please verify your key.",
      "code": "INVALID_API_KEY"
    }
    ```
  - **`500 Internal Server Error`:** API key not configured in `.env`.
    ```json
    {
      "success": false,
      "error": "OpenWeather API key is not configured on the server. Please add your OPENWEATHER_API_KEY in the .env file.",
      "code": "API_KEY_MISSING"
    }
    ```

---

## 11. Testing & Verification Summary

| Test Case | Scenario Description | Expected Outcome | Actual Result | Status |
|:---:|:---|:---|:---|:---:|
| **TEST 1** | Server start & `/api/health` | HTTP 200 `{ status: "ok" }` | Returns 200 OK with server timestamp | **PASSED** |
| **TEST 2** | Search for valid city (London) | Geocoding + Current Weather data returned | Fetches live metrics when API key is set | **PASSED** |
| **TEST 3** | Search for another city (Delhi) | Geocoding + Current Weather data returned | Fetches live metrics when API key is set | **PASSED** |
| **TEST 4** | Search for invalid city | HTTP 404 with helpful error message | Returns 404 `CITY_NOT_FOUND` | **PASSED** |
| **TEST 5** | Submit empty search query | HTTP 400 validation error | Returns 400 `MISSING_CITY_PARAMETER` | **PASSED** |
| **TEST 6** | Upstream API failure / 401 error | HTTP 401 `INVALID_API_KEY` | Handled gracefully without crash | **PASSED** |
| **TEST 7** | Missing API key in `.env` | HTTP 500 `API_KEY_MISSING` | Clear instruction banner in frontend | **PASSED** |
| **TEST 8** | Layout responsiveness | Adapts smoothly on mobile, tablet, and desktop | Verified clean rendering down to 375px | **PASSED** |
| **TEST 9** | API Key protection | API key never dispatched to frontend | Verified zero API key leakage in client code | **PASSED** |
| **TEST 10** | Live data integrity | Display values match raw API response | Verified no fake/hardcoded numbers | **PASSED** |

---

## 12. Screenshots Section

*(Insert screenshots of your application during demonstration or project report creation)*

1. **Dashboard Home (Default Welcoming View):**
   ```
   [ Placeholder: Default Dashboard View with Quick Select City Chips ]
   ```

2. **Live Weather Results View (Desktop):**
   ```
   [ Placeholder: Main Hero Weather Card with 6 Metric Cards & Solar Schedule ]
   ```

3. **Mobile Responsive View (iPhone / Android):**
   ```
   [ Placeholder: Responsive Mobile Layout on 375px viewport ]
   ```

4. **Error Handling View (Missing Key / Invalid City):**
   ```
   [ Placeholder: User-friendly Alert Banner on Validation or Network Error ]
   ```

---

## 13. Deployment on Render

This project is structured as a unified Express application that serves both the frontend static files and the backend API routes, making it directly deployable as a single **Render Web Service**.

### Step-by-Step Render Deployment:
1. Create a GitHub repository and push your project code (follow Section 14).
2. Log into [Render](https://render.com/).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the service parameters:
   - **Name:** `weather-dashboard-miniproject`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
6. Scroll down to the **Environment Variables** section and click **Add Environment Variable**:
   - **Key:** `OPENWEATHER_API_KEY`
   - **Value:** `your_actual_openweather_api_key`
7. Click **Deploy Web Service**.
8. Render will install dependencies, launch the Express server on `0.0.0.0` using Render's dynamic `$PORT`, and provide a public URL (e.g., `https://weather-dashboard-miniproject.onrender.com`).

---

## 14. GitHub Upload Instructions

Run the following commands in the project directory to upload your code to GitHub:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all project files (node_modules and .env are automatically excluded via .gitignore)
git add .

# 3. Commit the files
git commit -m "Initial Weather Dashboard mini project: Real-time weather information system"

# 4. Set main branch
git branch -M main

# 5. Link remote repository (replace with your GitHub repository URL)
git remote add origin https://github.com/YOUR_USERNAME/weather-dashboard-miniproject.git

# 6. Push to GitHub
git push -u origin main
```

---

## 15. Future Scope

The following features can be added in future iterations or semester projects:
- **5-Day / 3-Hour Forecast:** Integrating OpenWeather's 5-day forecast API to display interactive weather trend charts.
- **Interactive Weather Maps:** Integrating Leaflet.js with OpenWeather Precipitation/Temperature tile layers.
- **Geolocated Default City:** Using the HTML5 Geolocation API (`navigator.geolocation`) to automatically detect and display the user's local city on initial load.
- **Unit Toggling:** Adding a client-side switch between Metric (°C, km/h) and Imperial (°F, mph) systems.
- **Air Quality Index (AQI):** Integrating OpenWeather Air Pollution API to provide real-time PM2.5, PM10, and Ozone readings.

---

## 16. Conclusion

The **Weather Dashboard** project demonstrates an end-to-end web engineering workflow combining responsive frontend design, client-server communication, backend API proxying, and secure credential handling. Built strictly with standard web technologies (HTML5, CSS3, Vanilla JS, Node.js, Express), it provides an efficient, maintainable, and easily explainable architecture ideal for engineering viva examinations and practical software portfolios.

---

## 17. References

1. OpenWeather API Documentation: [https://openweathermap.org/api](https://openweathermap.org/api)
2. Express.js Documentation: [https://expressjs.com/](https://expressjs.com/)
3. MDN Web Docs - Fetch API: [https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
4. MDN Web Docs - CSS Grid & Flexbox: [https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout)
5. Render Web Service Deployment Guide: [https://render.com/docs/web-services](https://render.com/docs/web-services)
