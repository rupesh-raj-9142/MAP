# YATRA — Intelligent Travel Discovery & Route Orchestration 🗺️✨

Production-ready, AI-powered travel discovery and zero-backtrack route orchestration platform for authentic Indian cultural exploration.

> **“Tell YATRA what you have. We'll tell you what to do.”**

---

## 🌟 Overview

YATRA takes a traveler's available time, budget, interests, mood, group, and transport preferences, and generates an optimized, zero-backtrack travel itinerary with real-time crowd insights, verified entrance fees, transit durations, and dynamic replanning via **YATRA LIVE**.

```text
Frontend (HTML / Vanilla JS / Tailwind / Leaflet)
   ↓
API Routes (/api/*)
   ↓
Controllers (server/controllers/*)
   ↓
Services (server/services/*)
   ↓
Repositories (server/repositories/*)
   ↓
Database (Prisma + PostgreSQL) / External Providers (Places, Maps, AI)
```

---

## 🚀 Key Features

- **Full REST API Architecture**: Layered separation between Controllers, Services, Repositories, and Providers.
- **PostgreSQL & Prisma ORM**: Complete schema for Users, Preferences, Places, Trips, TripStops, Itineraries, and Saved Places.
- **Secure Authentication**: Password hashing with bcrypt, JWT token issuance, protected routes, and user ownership isolation.
- **Provider Abstractions**: Dedicated providers for Google Places, Google Maps/Routes, Geocoding, and Gemini AI, with seamless mock fallback.
- **Anti-Hallucination AI Trip Planner**: Uses strictly verified factual attractions from the backend as grounding. AI handles personalization, ranking, and explanation; backend recalculates exact budgets and routes.
- **Route Optimization Engine**: Nearest-neighbor greedy algorithms producing 100% zero-backtrack corridors.
- **Budget Service**: Accurate source of truth for entry fees, transit costs, and food allowances.
- **YATRA LIVE Dynamic Replanning**: Recalculates remaining itineraries on the fly when places are unavailable, crowds peak, or users run late.
- **Mock Mode**: Set `USE_MOCK_DATA=true` to run offline with zero external API keys or local PostgreSQL.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v22+)
- **Language**: TypeScript (ES2022)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Validation**: Zod
- **Security**: bcryptjs, jsonwebtoken, express-rate-limit
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (CDN), Leaflet.js
- **Testing**: Vitest & Supertest

---

## 📂 Project Structure

```text
├── server/
│   ├── controllers/         # REST API Controllers (Auth, Trips, Places, AI, etc.)
│   ├── services/            # Domain logic (Budget, RouteOptimization, AI, Live)
│   ├── repositories/        # Database access (Prisma & in-memory fallback)
│   ├── validators/          # Zod validation schemas
│   ├── middleware/          # Auth, rate-limiting, error handling
│   ├── integrations/
│   │   ├── places/          # PlaceProvider (GooglePlaces, MockPlaces, Seed)
│   │   ├── maps/            # RouteProvider, GeocodingProvider
│   │   └── ai/              # AIProvider (Gemini, MockAI)
│   ├── utils/               # JWT, password, logger, response helpers
│   ├── app.ts               # Express configuration & routes
│   └── server.ts            # Server entrypoint
├── prisma/
│   ├── schema.prisma        # Complete database schema & indexes
│   └── seed.ts              # Database seeder for 6 major Indian hubs
├── tests/                   # Automated Vitest integration test suite
├── types/                   # Shared TypeScript interfaces & types
├── js/                      # Existing frontend controllers & Leaflet maps
├── css/                     # Frontend styling
├── assets/                  # Images and videos
├── API.md                   # Complete REST API reference documentation
├── .env.example             # Environment template
└── index.html               # Main frontend single-page application
```

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/rupesh-raj-9142/MAP.git
cd MAP
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yatra_db?schema=public"
AUTH_SECRET="your-super-secret-jwt-key"
GOOGLE_MAPS_API_KEY=""
GOOGLE_PLACES_API_KEY=""
AI_API_KEY=""
USE_MOCK_DATA=true
```

### 3. Database Setup (Optional if `USE_MOCK_DATA=true`)
When connecting to a live PostgreSQL instance:
```bash
# Push schema to database
npx prisma db push

# Seed 6 major Indian hubs (Patna, Delhi, Varanasi, Jaipur, Mumbai, Kolkata)
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

### 5. Run Automated Tests
```bash
npm test
```

---

## 📖 API Documentation

Detailed endpoint specifications, request payloads, and response envelopes are documented in **[API.md](API.md)**:

- `POST /api/auth/register` & `POST /api/auth/login`
- `GET /api/location/search`
- `GET /api/places/nearby` & `GET /api/places/:id` & `GET /api/search`
- `POST /api/routes`
- `POST /api/ai/plan-trip`
- `POST /api/trips` & `GET /api/trips` & `DELETE /api/trips/:id`
- `POST /api/trips/:tripId/stops/:stopId/replace`
- `POST /api/trips/:tripId/recalculate` (YATRA LIVE)
- `POST /api/saved-places` & `GET /api/saved-places`

---

Developed with ❤️ by [rupesh-raj-9142](https://github.com/rupesh-raj-9142)
