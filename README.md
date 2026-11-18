# Weather Dashboard: A Location-Aware Weather Dashboard with Smart Recommendations

A modern, responsive, human-designed full-stack weather application developed as an engineering college mini-project for B.Tech Computer Science & Engineering (CSE) students.

The application transforms basic meteorological metrics into **actionable everyday insights**—featuring **rule-based smart weather recommendations**, an **educational weather comfort score (0–100)**, **hourly forecasts**, **condition-based weather alerts**, and an **outdoor activity daily planner**, alongside dynamic **city autocomplete** and **browser geolocation**.

---

## 1. Project Introduction

Traditional weather dashboards merely show raw numbers like temperature, pressure, and humidity without explaining what they mean for the user. **Weather Dashboard: A Location-Aware Weather Dashboard with Smart Recommendations** bridges this gap by interpreting live atmospheric conditions to help users make practical daily decisions (e.g. whether to carry an umbrella, wear warm layers, schedule outdoor runs, or stay hydrated).

The application is built strictly using core web technologies:
- **Frontend:** Semantic HTML5, CSS3 (Grid & Flexbox), and Vanilla JavaScript (ES6+).
- **Backend:** Node.js with Express.js acting as a secure proxy gateway to external OpenWeather APIs.

---

## 2. Problem Statement

Most standard weather projects either:
1. **Lack Actionable Intelligence:** Merely display raw figures without contextual guidance on comfort, attire, or daily planning.
2. **Expose Secret API Tokens:** Dispatch client-side API requests directly from the browser, exposing secret API keys in the Network tab.
3. **Fabricate Inaccurate Data:** Invent or display misleading daily High/Low extremes from instantaneous API endpoints where such data does not exist.
4. **Over-Engineer with Heavy Frameworks:** Rely on bloated single-page frameworks (React, Next.js) where pure web standards provide faster loading and easier viva explanation.

This project solves these challenges by combining a secure Node.js proxy, the browser Geolocation API, OpenWeather's Forecast and Geocoding APIs, and a transparent JavaScript rule-based decision engine.

---

## 3. Project Objectives

- **Full-Stack Web Development:** Build an end-to-end client-server application demonstrating asynchronous communication with REST APIs.
- **Rule-Based Recommendation Engine:** Develop a transparent, configurable decision engine that analyzes current conditions and precipitation probability to suggest actionable precautions.
- **Educational Weather Comfort Score:** Design an understandable weighted formula (Temperature 40%, Humidity 30%, Wind 30%) that grades outdoor comfort from 0 to 100.
- **24-Hour Forecast & Planning:** Process multi-slot forecast intervals to display the next 8 periods and identify optimal outdoor windows.
- **Geolocation & Smart Autocomplete:** Enable seamless location detection via the browser Geolocation API and debounced city suggestions via OpenWeather Geocoding.
- **Viva Readiness:** Maintain clean, self-documenting code that is easy for a second-year engineering student to explain during an evaluation.

---

## 4. Key Implemented Features

### 1. Rule-Based Smart Weather Recommendations
- Analyzes actual atmospheric parameters and generates relevant, non-duplicated advice:
  - **Rain / Precipitation:** Triggers an umbrella/raincoat reminder when rain is occurring or upcoming precipitation probability reaches $\ge 40\%$.
  - **Heavy Rain / Thunderstorm:** Alerts when heavy rainfall ($\ge 4\text{ mm}$) or storm activity is forecast.
  - **High Temperature:** Advises hydration and sun protection when ambient temperature $\ge 34^\circ\text{C}$ or heat index $\ge 38^\circ\text{C}$.
  - **Low Temperature:** Recommends warm layers when $\le 12^\circ\text{C}$ and heavy winter wear when $\le 4^\circ\text{C}$.
  - **High Wind:** Cautions against uncomfortable outdoor gusts when surface winds $\ge 28\text{ km/h}$.
  - **Poor Visibility:** Suggests cautious driving and fog lights when visibility $\le 2.5\text{ km}$.
  - **Comfortable Baseline:** Reassures users when conditions are ideal for outdoor walks and sports.
- **Transparent Reasoning:** Each recommendation displays a dedicated *"Reason:"* line citing the exact metric or forecast time.

### 2. Weather Comfort Score (0–100)
- Grades current meteorological comfort on a transparent scale:
  - **80–100:** *Very Comfortable* (Optimal temperature, light breeze, comfortable humidity)
  - **60–79:** *Comfortable* (Pleasant weather for outdoor routines)
  - **40–59:** *Moderate* (Acceptable; dress appropriately for temperature)
  - **20–39:** *Uncomfortable* (High heat, humidity, or brisk winds)
  - **0–19:** *Poor Conditions* (Adverse meteorological extremes)
- Displays individual score factors for Temperature, Humidity, and Wind.
- *Note:* Labeled clearly as an educational heuristic, not an official meteorological index.

### 3. Hourly Weather Forecast (Next 24 Hours)
- Retrieves 8 upcoming 3-hour intervals from the OpenWeather Forecast API.
- Horizontally scrollable timeline showing:
  - Formatted local time (adjusted to the target city's timezone).
  - Weather condition icon and title.
  - Temperature in $^\circ\text{C}$.
  - Precipitation probability pill (`💧 POP%`).

### 4. Smart Weather Condition Alerts
- Non-alarmist, condition-based notifications categorized by severity:
  - **High Severity:** Thunderstorm advisories, extreme heat ($\ge 40^\circ\text{C}$).
  - **Moderate Severity:** High rain watch ($\text{POP} \ge 70\%$), high winds ($\ge 35\text{ km/h}$), dense fog ($\le 1.5\text{ km}$).
  - **Low Severity:** Light drizzle notice ($\text{POP} \ge 40\%$).
  - **Stable Notice:** Displayed when atmospheric readings are calm.

### 5. "Plan Your Day" Activity Scheduler
- Evaluates the upcoming forecast intervals using a multi-parameter scoring formula.
- Identifies the most favorable upcoming time slot (lowest rain probability + closest temperature to $22^\circ\text{C}$ + moderate wind) and highlights it with actionable advice.

### 6. Real Current Location Weather (Browser Geolocation)
- One-click **"Use My Location"** button prompts for browser permission.
- Sends coordinates (`lat`, `lon`) to the backend, which reverse-geocodes them to city/state/country and fetches live meteorological data.
- Friendly error handling for denied permission, device unavailability, or timeouts.

### 7. Smart City Autocomplete
- 300 ms debounced input queries the OpenWeather Geocoding API.
- Dropdown displays matching cities with state/region and country.
- Full keyboard navigation: `Arrow Down`, `Arrow Up`, `Enter`, and `Escape`.

### 8. Consolidated Atmospheric Metrics & Solar Schedule
- Displays humidity (with qualitative comfort assessment), wind speed (in both $\text{km/h}$ and $\text{m/s}$), barometric pressure ($\text{hPa}$), feels-like temperature, visibility ($\text{km}$), and cloudiness ($\%$) without fabricating missing daily extremes.
- Formats local sunrise and sunset times using the city's UTC timezone offset, and computes total sunlight duration.

---

## 5. Comfort Score Formula & Algorithms

### Weighted Formula:
$$\text{Comfort Score} = (\text{Temperature Score} \times 0.40) + (\text{Humidity Score} \times 0.30) + (\text{Wind Score} \times 0.30)$$

1. **Temperature Score (40% Weight):**
   - Ideal thermal comfort: $20^\circ\text{C} \text{ to } 25^\circ\text{C} \implies \text{Score} = 100$.
   - Cold condition ($T < 20^\circ\text{C}$): $\text{Score} = \max(0, 100 - (20 - T) \times 3.8)$.
   - Hot condition ($T > 25^\circ\text{C}$): $\text{Score} = \max(0, 100 - (T - 25) \times 4.5)$.
2. **Humidity Score (30% Weight):**
   - Ideal relative humidity: $40\% \text{ to } 55\% \implies \text{Score} = 100$.
   - Dry air ($H < 40\%$): $\text{Score} = \max(0, 100 - (40 - H) \times 2.8)$.
   - Humid air ($H > 55\%$): $\text{Score} = \max(0, 100 - (H - 55) \times 2.2)$.
3. **Wind Score (30% Weight):**
   - Calm breeze: $0 \text{ to } 12\text{ km/h} \implies \text{Score} = 100$.
   - Breezy to gusty ($W > 12\text{ km/h}$): $\text{Score} = \max(0, 100 - (W - 12) \times 3.2)$.

The final score is clamped between $0$ and $100$.

---

## 6. Technology Stack

- **Frontend:** HTML5, CSS3 (Modern Light-Neutral System), Vanilla JavaScript (ES6+).
- **Backend:** Node.js (v18+/v20+), Express.js (v4), dotenv, cors.
- **External APIs:**
  - *OpenWeather Geocoding API (Direct & Reverse):* Coordinates & city matching.
  - *OpenWeather Current Weather API:* Real-time meteorological readings.
  - *OpenWeather 5-Day / 3-Hour Forecast API:* Upcoming intervals & precipitation probability (`pop`).

---

## 7. API Endpoints

All backend routes are mounted under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status health check (`200 OK`). |
| `GET` | `/api/weather?city=Kanpur` | Current weather + 8-slot forecast for a city. |
| `GET` | `/api/weather?lat=26.46&lon=80.32` | Current weather + 8-slot forecast for coordinates. |
| `GET` | `/api/forecast?lat=26.46&lon=80.32` | Standalone forecast endpoint for coordinates. |
| `GET` | `/api/forecast?city=Kanpur` | Standalone forecast endpoint for a city name. |
| `GET` | `/api/suggestions?q=Kan` | Dynamic city autocomplete suggestions. |

---

## 8. Installation & Running Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (Node Package Manager)

### Step 1: Open Terminal in Project Directory
```bash
cd c:\Users\anand\weatherdashboardminiproject
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Ensure `.env` contains your active OpenWeather API key:
```ini
OPENWEATHER_API_KEY=your_actual_api_key_here
PORT=3000
```

### Step 4: Start the Application
```bash
# Standard Production Mode
npm start

# Development Auto-Reload Mode (Node 20)
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 9. Verification & Testing Summary

| Test Scenario | Tested Case | Verified Behavior | Status |
| :--- | :--- | :--- | :---: |
| **City Weather + Forecast** | Kanpur | Verified 25°C, 29% humidity, 8 forecast slots, comfort score 91/100 | **PASSED** |
| **Precipitation Detection** | London | Detected upcoming rain slot (14% - 100% POP); triggered umbrella recommendation | **PASSED** |
| **Standalone Forecast** | `/api/forecast` | Returned 8 intervals with local time, pop, temp, and condition | **PASSED** |
| **City Autocomplete** | Query "Kan" | Returned 5 geocoding results with state and country | **PASSED** |
| **Current Location** | Coordinates | Reverse-geocoded coordinates and returned live weather | **PASSED** |
| **Comfort Score Math** | Multi-scenario | Verified weighted formula across ideal, cold, humid, and hot inputs | **PASSED** |
| **Invalid City** | InvalidXYZ999 | Returned HTTP 404 with clean `CITY_NOT_FOUND` error | **PASSED** |
| **Empty Search** | Blank query | Returned HTTP 400 with `MISSING_PARAMETERS` error | **PASSED** |
| **Security Audit** | Public directory | Confirmed zero API key leakage in frontend HTML, CSS, or JS | **PASSED** |

---

## 10. College Viva Q&A Guide

**Q1: What makes this dashboard "smart" compared to typical college weather projects?**
> *Answer:* Standard dashboards only display raw numbers. This application implements a rule-based decision engine that analyzes current conditions and multi-hour forecasts to output practical recommendations (umbrella reminders, hydration alerts, attire tips), calculates a weighted Weather Comfort Score (0–100), and identifies optimal outdoor activity hours in a daily planner.

**Q2: How does the Weather Comfort Score calculation work?**
> *Answer:* It uses a transparent, weighted heuristic algorithm where Temperature contributes 40%, Humidity 30%, and Wind Speed 30%. Each component is graded against human comfort zones (ideal: 20–25°C, 40–55% humidity, <12 km/h wind) and penalized for adverse deviations. The resulting score (0–100) provides an intuitive index ranging from "Poor" to "Very Comfortable".

**Q3: How is rain probability (`pop`) determined?**
> *Answer:* The OpenWeather 5-day / 3-hour forecast API returns a `pop` parameter (Probability of Precipitation) ranging from 0.0 to 1.0. Our backend normalizes this to a percentage (0–100%). The recommendation engine checks upcoming intervals: if `pop >= 40%`, it warns the user to carry an umbrella and specifies the forecast hour.

**Q4: Why does the project use a Node.js/Express backend instead of calling OpenWeather from client JavaScript?**
> *Answer:* Security and architecture. Direct browser requests expose the secret API key in the Network tab, allowing anyone to steal the quota. The Express backend serves as a secure proxy gateway, hides the key in server environment variables, resolves CORS restrictions, and normalizes payloads before sending them to the frontend.

---

## 11. Limitations & Future Scope

### Limitations
- The OpenWeather free-tier forecast updates every 3 hours rather than every 60 minutes.
- The Comfort Score is an educational heuristic rather than an official bioclimatic index (such as UTCI or Humidex).

### Future Scope
- **Interactive Weather Radar:** Adding Leaflet.js map layers for live cloud cover and precipitation tiles.
- **Air Quality Index (AQI):** Integrating the OpenWeather Air Pollution API to provide real-time PM2.5 and Ozone health warnings.
- **Unit Toggle:** Adding client-side switching between Metric (°C, km/h) and Imperial (°F, mph).
