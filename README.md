# Weather Dashboard: A Real-Time Weather Information System Using Web API

A clean, responsive, human-designed web application developed as an engineering college mini-project for B.Tech Computer Science and Engineering (CSE) students.

The application allows users to search for any city worldwide, receive dynamic geocoding autocomplete suggestions, or detect their current geographic location using the browser Geolocation API to view authentic, real-time weather metrics backed by the OpenWeather RESTful Web API.

---

## 1. Project Introduction

Weather significantly affects daily commute, agriculture, flight schedules, and emergency alerts. **Weather Dashboard** is a focused single-page application (SPA) engineered to provide instant meteorological information through an intuitive, light-neutral visual interface.

Unlike generic dark dashboards with excessive neon styling, this system uses a restrained, human-designed aesthetic inspired by modern editorial weather tools—combining high typography hierarchy, clean card layouts, and responsive components built strictly with foundational web technologies.

---

## 2. Problem Statement

Many web-based weather applications suffer from one or more structural issues:
1. **Security Vulnerabilities:** Direct client-side calls expose confidential API tokens, making them vulnerable to key theft, rate-limit exhaustion, and unauthorized usage.
2. **Misleading Data Representation:** Fabricating daily high/low temperatures from instantaneous weather endpoints where such data does not exist.
3. **Bloated Frontend Frameworks:** Using heavy single-page application frameworks (such as React or Next.js) for simple informational dashboards where Vanilla JavaScript, HTML5, and CSS3 offer faster rendering and simpler maintenance.
4. **Poor Accessibility & Autocomplete:** Limiting users to hardcoded city lists or failing to provide real-time suggestions and geolocation capabilities.

This mini-project demonstrates how to overcome these hurdles with a lightweight, secure Node.js proxy, the browser Geolocation API, and OpenWeather's direct and reverse geocoding endpoints.

---

## 3. Project Objectives

- **Frontend Development:** Build an accessible, responsive, single-page application using pure HTML5 semantic markup, CSS3 (Flexbox/Grid), and ES6+ Vanilla JavaScript.
- **Backend Architecture & Proxying:** Implement a secure Node.js and Express.js backend that protects external API credentials (`process.env.OPENWEATHER_API_KEY`) and prevents CORS issues.
- **Dynamic Autocomplete Integration:** Provide real-time city suggestions using OpenWeather Geocoding API with client-side debouncing and keyboard navigation (Arrow Up, Arrow Down, Enter, Escape).
- **Geolocation Integration:** Implement the browser Geolocation API with user permission controls, error handling, and reverse geocoding coordinates to city names.
- **Authentic Meteorological Data:** Normalize and display verified API metrics (Celsius temperature, humidity, wind velocity in km/h and m/s, barometric pressure in hPa, visibility in km, cloud cover, and sunrise/sunset formatted to the city's local timezone).
- **Viva Readiness:** Maintain clean, readable, modular code that a second-year B.Tech CSE student can easily explain during a project evaluation.

---

## 4. Implemented Features

### A. Minimalist Header
- Simple, clean branding with a weather cloud SVG icon.
- Subtitle: *Real-time weather information*.
- Live backend server connectivity indicator (`Online` / `Offline`).
- Formatted local date display (e.g., `Wed, 18 Nov 2026`).

### B. Smart City Autocomplete Search
- Real-time search with multi-word city support (e.g., *"Kanpur"*, *"New Delhi"*, *"New York"*).
- Debounced input (300 ms) to prevent excessive API calls.
- Dynamic dropdown displaying city name, state/region, and country code.
- Full keyboard accessibility: **Arrow Down** and **Arrow Up** to navigate, **Enter** to select, and **Escape** to dismiss.
- Click-outside detection to automatically close the dropdown.

### C. Real Current Location Weather (Browser Geolocation API)
- Dedicated **"Use My Location"** button.
- Asks for user permission explicitly before accessing coordinates.
- Reverse-geocodes coordinates into city, state, and country name.
- Robust error handling for permission denial, timeout, and device unavailability.

### D. Single-Page Main Weather View
- **Location Meta:** City name, country pill, geographical coordinates (`lat`, `lon`), and the target city's exact local time (calculated using UTC timezone offset).
- **Primary Weather Focus:** Large temperature display in Celsius (°C), feels-like perceived temperature, condition description, and official OpenWeather icon.
- **Truthful Data Representation:** Misleading daily High/Low extremes have been removed because instantaneous API endpoints do not provide authentic forecast extremes.

### E. Consolidated Atmospheric Metrics Grid (6 Parameters)
1. **Humidity:** Relative humidity percentage with qualitative comfort assessment (*Comfortable*, *Humid*, *Dry*).
2. **Wind Speed:** Surface velocity reported in both `km/h` and `m/s`.
3. **Atmospheric Pressure:** Barometric pressure measured in `hPa`.
4. **Feels Like:** Perceived temperature with difference from actual air temperature.
5. **Visibility:** Clear horizontal distance in kilometers (`km`).
6. **Cloudiness:** Sky cloud cover percentage (`%`).

### F. Solar & Astronomical Schedule
- **Sunrise:** Formatted to the target city's local time.
- **Sunset:** Formatted to the target city's local time.
- **Day Length:** Calculated accurately from `sunset - sunrise` timestamps (e.g., `10 hrs 53 mins`).

### G. Minimal Footer
- Clean single-line attribution: `Weather data provided by OpenWeather API`.
- No clutter, no technology badges, and no unnecessary decorations.

---

## 5. Technology Stack & Roles

| Technology | Role in Project |
| :--- | :--- |
| **HTML5** | Semantic structure (`<header>`, `<main>`, `<section>`, `<article>`, `<ul>`, `<li>`, `<footer>`). |
| **CSS3** | Modern light-neutral styling, responsive Grid & Flexbox layouts, subtle shadows, and media queries. |
| **Vanilla JavaScript (ES6+)** | DOM manipulation, Fetch API calls, Geolocation API, debounce timer, and keyboard event handling. |
| **Node.js** | Asynchronous JavaScript runtime environment executing the backend server. |
| **Express.js** | Lightweight HTTP server hosting static files from `/public` and handling REST API routes. |
| **dotenv** | Loads environment variables (`OPENWEATHER_API_KEY`, `PORT`) safely from `.env`. |
| **cors** | Middleware enabling Cross-Origin Resource Sharing. |
| **OpenWeather API** | External provider for Geocoding (Direct & Reverse) and Current Weather data. |

---

## 6. What Node.js and Express.js Do

### What Node.js Does:
- Executes JavaScript outside the browser directly on the host operating system.
- Manages asynchronous network I/O, file reading, and environment variable resolution.
- Serves as the runtime for running our web server without needing Apache or Nginx during development.

### What Express.js Does:
1. **Static File Serving:** Delivers the HTML, CSS, JavaScript, and SVG assets in the `public/` directory via `express.static('public')`.
2. **REST API Routing:** Defines clear endpoints (`/api/health`, `/api/weather`, `/api/suggestions`).
3. **Security Proxy:** Reads `process.env.OPENWEATHER_API_KEY` on the server and attaches it to OpenWeather requests, ensuring the key is never sent to the browser.
4. **Data Normalization:** Validates query inputs, calculates wind speed conversions (`m/s` to `km/h`), checks for API error codes, and returns safe, standardized JSON.

---

## 7. API Architecture & Workflows

### 1. City Weather Workflow
```
[User types city name] 
        │
        ▼
[Frontend: GET /api/weather?city=Kanpur]
        │
        ▼
[Backend: weatherService.js]
        │
        ├─► 1. Call Geocoding API: geo/1.0/direct?q=Kanpur&limit=1
        │       └─► Receives: lat: 26.4609, lon: 80.3218, State: Uttar Pradesh, Country: IN
        │
        └─► 2. Call Current Weather API: data/2.5/weather?lat=26.4609&lon=80.3218&units=metric
                └─► Receives live temperature, humidity, wind, pressure, sunrise, sunset
        │
        ▼
[Backend normalizes payload and strips sensitive keys]
        │
        ▼
[Frontend receives clean JSON and updates DOM]
```

### 2. Autocomplete Suggestions Workflow
```
[User types "Kan"] ──► Debounce 300ms ──► [Frontend: GET /api/suggestions?q=Kan]
                                                    │
                                                    ▼
[Backend calls Geocoding API: geo/1.0/direct?q=Kan&limit=5]
                                                    │
                                                    ▼
[Returns deduplicated array of city suggestions with state & country]
                                                    │
                                                    ▼
[Frontend renders accessible dropdown with Arrow navigation & click listeners]
```

### 3. Geolocation Workflow
```
[User clicks "Use My Location"]
        │
        ▼
[Browser prompts: "Allow location access?"]
        │
        ├─► If Denied: Show friendly notice; manual search remains available.
        │
        └─► If Granted: navigator.geolocation returns { latitude, longitude }
                │
                ▼
[Frontend: GET /api/weather?lat=26.46&lon=80.32]
        │
        ▼
[Backend queries OpenWeather Current Weather + Reverse Geocoding]
        │
        ▼
[Frontend displays exact local weather and city name]
```

---

## 8. Project Folder Structure

```
weatherdashboardminiproject/
│
├── backend/
│   ├── routes/
│   │   └── weather.js          # REST endpoints (/api/health, /api/weather, /api/suggestions)
│   └── services/
│       └── weatherService.js   # OpenWeather Geocoding, Reverse Geocoding & Weather fetching
│
├── public/                     # Static frontend files served by Express
│   ├── assets/
│   │   └── favicon.svg         # Clean weather SVG tab icon
│   ├── css/
│   │   └── style.css           # Clean light-neutral stylesheet with responsive Grid/Flexbox
│   ├── js/
│   │   └── script.js           # Client-side autocomplete, geolocation, and DOM controller
│   └── index.html              # Accessible single-page markup
│
├── .env                        # Local environment variables (IGNORED by Git)
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git ignore rules (node_modules/, .env)
├── package.json                # Project dependencies and startup scripts
├── server.js                   # Express application entry point (binds to 0.0.0.0)
└── README.md                   # Comprehensive project documentation
```

---

## 9. Installation & Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x or 20.x recommended)
- npm (Node Package Manager)

### Step 1: Open Terminal in Project Directory
```bash
cd c:\Users\anand\weatherdashboardminiproject
```

### Step 2: Install Project Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS:
cp .env.example .env
```

Open `.env` and configure your API key:
```ini
OPENWEATHER_API_KEY=your_actual_api_key_here
PORT=3000
```

---

## 10. How to Run the Application

### Production / Standard Mode:
```bash
npm start
```

### Development Mode (Node 20 Watch Mode):
```bash
npm run dev
```

The Express server will start:
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

## 11. Testing & Verification Summary

All core test cases have been tested and verified:

| Test # | Test Scenario | Verified Result | Status |
| :---: | :--- | :--- | :---: |
| **TEST 1** | Server Health Check (`GET /api/health`) | Returns HTTP 200 with `{ status: "ok" }`. | **PASSED** |
| **TEST 2** | Search City (Kanpur) | Returns live temperature (23°C), humidity, wind, and coordinates. | **PASSED** |
| **TEST 3** | Search City (Delhi) | Returns New Delhi, Delhi, IN with live meteorological data. | **PASSED** |
| **TEST 4** | Search International City (London) | Returns London, England, GB with live meteorological data. | **PASSED** |
| **TEST 5** | Autocomplete Suggestions (`GET /api/suggestions?q=Kan`) | Returns geocoding suggestions with city, state, country, lat, lon. | **PASSED** |
| **TEST 6** | Coordinates Weather (`GET /api/weather?lat=...&lon=...`) | Reverse-geocodes coordinates and returns live weather metrics. | **PASSED** |
| **TEST 7** | Invalid City Search (`InvalidCityXYZ98765`) | Returns HTTP 404 with clean `CITY_NOT_FOUND` error message. | **PASSED** |
| **TEST 8** | Empty Search Submission | Returns HTTP 400 with `MISSING_PARAMETERS` error message. | **PASSED** |
| **TEST 9** | Browser Geolocation Integration | Explicit button invokes `navigator.geolocation` with permission handling. | **PASSED** |
| **TEST 10** | Accurate Meteorological Data | Wind speed properly converted to km/h; fake High/Low pills removed. | **PASSED** |
| **TEST 11** | Clean UI & Mobile Responsiveness | Clean light-neutral aesthetic; zero horizontal scroll on mobile (360px+). | **PASSED** |
| **TEST 12** | API Key Security | Verified zero API key or token exposure in frontend HTML, CSS, or JS. | **PASSED** |

---

## 12. College Viva Q&A Guide

Here are common questions asked during mini-project viva evaluations:

**Q1: Why did you use Node.js and Express instead of fetching OpenWeather directly from the frontend?**
> *Answer:* Direct frontend calls expose the secret OpenWeather API key in browser network tabs and source code, allowing unauthorized users to steal the key and exhaust quota limits. A Node.js/Express backend acts as a secure proxy gateway, hides the API key in server-side environment variables, prevents Cross-Origin Resource Sharing (CORS) errors, and normalizes the JSON data before sending it to the client.

**Q2: What is debouncing, and why is it used in the autocomplete feature?**
> *Answer:* Debouncing is a programming pattern that delays executing a function until a certain amount of time has elapsed since the last time the event was triggered. In the search input, if the user types quickly ("K-a-n-p-u-r"), sending an API request on every keystroke would fire 6 HTTP calls in milliseconds. By applying a 300 ms debounce, only one request is sent after the user pauses, saving bandwidth and preventing rate-limit violations.

**Q3: How does the "Use My Location" feature work?**
> *Answer:* The browser exposes `navigator.geolocation.getCurrentPosition()`. When the user clicks the button, the browser prompts for permission. If granted, the browser provides the device's latitude and longitude. The client sends these coordinates to `/api/weather?lat=...&lon=...`. The backend calls OpenWeather Current Weather and Reverse Geocoding to determine the city name and atmospheric metrics.

**Q4: How do you format sunrise and sunset times to the target city's local time?**
> *Answer:* OpenWeather returns Unix epoch timestamps in UTC seconds for sunrise and sunset, along with a `timezone` offset (in seconds from UTC). The application calculates `(unixTimestamp + timezoneOffset) * 1000` to create a date shifted to the city's local time, and formats it using UTC methods (`getUTCHours()`, `getUTCMinutes()`), ensuring the user sees the city's actual dawn and dusk times regardless of where the browser is located.

---

## 13. Future Scope

1. **5-Day Weather Forecast:** Integrating OpenWeather's 5-day / 3-hour forecast API with interactive temperature trend charts using Canvas or Chart.js.
2. **Interactive Weather Radar Maps:** Integrating Leaflet.js with OpenWeather precipitation and temperature map tile layers.
3. **Unit Toggle:** Adding a switch between Metric (°C, km/h) and Imperial (°F, mph) systems.
4. **Air Quality Index (AQI):** Integrating the OpenWeather Air Pollution API to provide real-time PM2.5, PM10, and Ozone readings.

---

## 14. References

1. OpenWeather API Documentation: [https://openweathermap.org/api](https://openweathermap.org/api)
2. MDN Web Docs - Geolocation API: [https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
3. MDN Web Docs - Fetch API: [https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
4. Express.js Official Documentation: [https://expressjs.com/](https://expressjs.com/)
