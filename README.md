# YATRA — Intelligent Travel Discovery & Route Orchestration 🗺️✨

YATRA is an AI-powered travel discovery and route orchestration web application designed to help travelers discover places, optimize zero-backtrack travel routes, and explore real-time itinerary planning with interactive maps.

## 🚀 Features

- **Interactive Leaflet Map**: Rich interactive map view with custom markers, popups, category filters, and crowd radar indicators.
- **Smart Route Orchestration**: Zero-backtrack route calculation connecting multiple stops efficiently.
- **AI Trip Planner**: Dynamic itinerary planner with timeline visualization, pacing controls, and day-by-day schedules.
- **Curated Travel Destinations**: Heritage sites, nature escapes, spiritual retreats, and culinary hotspots with details and ratings.
- **Live Crowd Radar & Weather**: Instant crowd density alerts, best visiting windows, and live weather conditions.
- **Responsive Modern UI**: Built with Material Design 3 tokens, Tailwind CSS, custom glassmorphism, and dark mode support.

## 📂 Project Structure

```
YATRA/
├── assets/
│   ├── images/       # Brand icons, destination previews, banners
│   └── videos/       # Background video loop
├── css/
│   └── styles.css    # Custom styles, animations, Leaflet overrides
├── js/
│   ├── app.js        # Main application controller & event wiring
│   ├── data.js       # Curated destination database & mock data
│   ├── map.js        # Leaflet map manager & routing engine
│   └── planner.js    # Itinerary calculation & timeline renderer
├── index.html        # Main single-page web application
└── .gitignore
```

## 🛠️ Getting Started

No build step or dependencies required! You can run YATRA directly in any modern web browser:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/rupesh-raj-9142/MAP.git
   ```
2. Open `index.html` in your favorite browser, or serve it using any local static server:
   ```bash
   # Using Python 3
   python -m http.server 3000
   
   # Or using Node npx serve
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.

## 🧰 Tech Stack

- **HTML5 & CSS3**
- **JavaScript (Vanilla ES6+)**
- **Tailwind CSS (CDN)**
- **Leaflet.js & OpenStreetMap**
- **Google Fonts (Inter, Plus Jakarta Sans, Material Symbols)**

---
Developed with ❤️ by [rupesh-raj-9142](https://github.com/rupesh-raj-9142)
