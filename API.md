# YATRA — Backend API Documentation 🗺️🚀

Welcome to the YATRA Production REST API reference. All requests and responses follow standard JSON serialization and consistent envelope wrappers.

## Base URL
```
http://localhost:3000/api
```

## Standard Response Format

### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable explanation of error.",
    "details": [ ... ]
  }
}
```

## Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failed (Zod error details included).
- `401 Unauthorized`: Missing or invalid Bearer JWT token.
- `404 Not Found`: Resource does not exist or access denied.
- `409 Conflict`: Unique constraint violation (e.g., user email already registered).
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Server failure with sanitized error message.

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: Public (Rate Limited)
- **Request Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-123",
        "name": "Aarav Sharma",
        "email": "aarav@example.com",
        "createdAt": "2026-09-10T11:00:00.000Z",
        "updatedAt": "2026-09-10T11:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```

### Login User
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: Public (Rate Limited)
- **Request Body**:
  ```json
  {
    "email": "aarav@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
  ```

### Logout User
- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Auth**: Optional
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { "message": "Logged out successfully" }
  }
  ```

### Get Current User
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth**: `Bearer <token>` required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": { "user": { ... } }
  }
  ```

---

## 2. User & Preferences Endpoints

### Get Current User Profile
- **Method**: `GET`
- **URL**: `/api/users/me`
- **Auth**: `Bearer <token>` required

### Update User Profile
- **Method**: `PUT`
- **URL**: `/api/users/me`
- **Auth**: `Bearer <token>` required
- **Request Body**:
  ```json
  {
    "name": "Aarav Sharma",
    "image": "https://example.com/avatar.jpg"
  }
  ```

### Get User Preferences
- **Method**: `GET`
- **URL**: `/api/users/me/preferences`
- **Auth**: `Bearer <token>` required
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "preferences": {
        "userId": "uuid-123",
        "interests": ["history", "culture"],
        "budgetPreference": "₹₹",
        "travelStyle": "balanced",
        "transportPreference": "walking",
        "favoriteCategories": ["history", "nature"]
      }
    }
  }
  ```

### Update User Preferences
- **Method**: `PUT`
- **URL**: `/api/users/me/preferences`
- **Auth**: `Bearer <token>` required
- **Request Body**:
  ```json
  {
    "interests": ["history", "culture", "food"],
    "travelStyle": "fast",
    "transportPreference": "auto"
  }
  ```

---

## 3. Location & Geocoding

### Search Locations
- **Method**: `GET`
- **URL**: `/api/location/search?query=Patna`
- **Auth**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "results": [
        {
          "latitude": 25.5941,
          "longitude": 85.1376,
          "formattedAddress": "Patna, Bihar, India",
          "city": "Patna",
          "state": "Bihar",
          "country": "India"
        }
      ]
    }
  }
  ```

---

## 4. Places & Destinations

### Nearby Places
- **Method**: `GET`
- **URL**: `/api/places/nearby?latitude=25.5941&longitude=85.1376&radius=10000&category=history`
- **Parameters**:
  - `latitude`: number (-90 to 90)
  - `longitude`: number (-180 to 180)
  - `radius`: meters (e.g. 5000, 10000, 20000)
  - `category`: optional category filter
  - `page`: optional page number (default 1)
  - `limit`: optional limit (default 20, max 50)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "count": 4,
      "radiusMeters": 10000,
      "places": [
        {
          "id": "patna-golghar",
          "name": "Golghar",
          "category": "history",
          "latitude": 25.619,
          "longitude": 85.1438,
          "rating": 4.4,
          "reviewCount": 2540,
          "entryFee": 15,
          "recommendedDuration": 45,
          "address": "Opposite Gandhi Maidan, Patna, Bihar 800001",
          "photos": ["https://..."]
        }
      ]
    }
  }
  ```

### Place Details
- **Method**: `GET`
- **URL**: `/api/places/:id`
- **Auth**: Public
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "place": {
        "id": "patna-golghar",
        "name": "Golghar",
        "description": "Iconic beehive-shaped granary engineered in 1786...",
        "category": "history",
        "latitude": 25.619,
        "longitude": 85.1438,
        "address": "Opposite Gandhi Maidan, Patna, Bihar 800001",
        "rating": 4.4,
        "reviewCount": 2540,
        "phoneNumber": "+91 612 222 5555",
        "website": "https://tourism.bihar.gov.in/golghar",
        "openingHours": "Open Today (6:00 AM - 6:00 PM)",
        "entryFee": 15,
        "recommendedDuration": 45,
        "photos": ["https://..."],
        "source": "SEED"
      }
    }
  }
  ```

### Multi-Field Place Search
- **Method**: `GET`
- **URL**: `/api/search?q=Museum&city=Patna`
- **Parameters**: `q` (search string), `city` (optional), `limit` (optional)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "count": 1,
      "results": [ ... ]
    }
  }
  ```

---

## 5. Routes & Distance Calculations

### Calculate Route
- **Method**: `POST`
- **URL**: `/api/routes`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "origin": { "latitude": 25.6190, "longitude": 85.1438 },
    "destination": { "latitude": 25.6080, "longitude": 85.1220 },
    "waypoints": [{ "latitude": 25.6267, "longitude": 85.1482 }],
    "travelMode": "DRIVE"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "route": {
        "totalDistanceMeters": 4200,
        "totalDistanceKm": 4.2,
        "totalDurationMinutes": 18,
        "travelMode": "DRIVE",
        "legs": [
          {
            "origin": { "latitude": 25.6190, "longitude": 85.1438 },
            "destination": { "latitude": 25.6267, "longitude": 85.1482 },
            "distanceKm": 1.1,
            "durationMinutes": 8,
            "mode": "DRIVE",
            "modeLabel": "8m via Auto / Cab",
            "costEstimate": 40
          }
        ]
      }
    }
  }
  ```

---

## 6. AI Trip Planner

### Plan Trip with Grounded AI
- **Method**: `POST`
- **URL**: `/api/ai/plan-trip`
- **Auth**: Optional / Bearer Token
- **Rate Limit**: 40 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "location": { "city": "Patna" },
    "availableTimeMinutes": 240,
    "budget": 1000,
    "interests": ["history", "food"],
    "mood": "relaxed",
    "travelGroup": "friends",
    "transportPreference": "walking"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "trip": {
        "id": "trip-12345",
        "title": "Patna History & Food Yatra",
        "locationName": "Patna",
        "durationMinutes": 240,
        "budget": 1000,
        "stops": [
          {
            "id": "stop-1",
            "placeId": "patna-golghar",
            "order": 1,
            "durationMinutes": 45,
            "notes": "Matches user's interest in history with high rating.",
            "place": { "name": "Golghar", "entryFee": 15 }
          }
        ],
        "itinerary": {
          "totalDurationMinutes": 230,
          "totalDistanceKm": 6.8,
          "estimatedTotalCost": 580,
          "reasoningSummary": "Orchestrated 4 stops with zero back-tracking corridor."
        }
      }
    }
  }
  ```

---

## 7. Trips CRUD & Stop Management

### Create Trip
- **Method**: `POST`
- **URL**: `/api/trips`
- **Auth**: Optional / Bearer Token

### Get User Trips
- **Method**: `GET`
- **URL**: `/api/trips`
- **Auth**: Optional / Bearer Token

### Get Trip by ID
- **Method**: `GET`
- **URL**: `/api/trips/:id`
- **Auth**: Scoped to Trip Owner

### Update Trip
- **Method**: `PUT`
- **URL**: `/api/trips/:id`
- **Request Body**: `{ "title": "Updated Title", "status": "ACTIVE" }`

### Delete Trip
- **Method**: `DELETE`
- **URL**: `/api/trips/:id`

### Add Stop
- **Method**: `POST`
- **URL**: `/api/trips/:tripId/stops`
- **Request Body**: `{ "placeId": "patna-bihar-museum", "durationMinutes": 90 }`

### Update Stop
- **Method**: `PATCH`
- **URL**: `/api/trips/:tripId/stops/:stopId`
- **Request Body**: `{ "status": "COMPLETED", "durationMinutes": 60 }`

### Delete Stop
- **Method**: `DELETE`
- **URL**: `/api/trips/:tripId/stops/:stopId`

### Replace Stop
- **Method**: `POST`
- **URL**: `/api/trips/:tripId/stops/:stopId/replace`
- **Request Body**: `{ "newPlaceId": "patna-sabhyata-dwar" }`

---

## 8. YATRA LIVE (Dynamic Replanning Engine)

### Live Recalculation
- **Method**: `POST`
- **URL**: `/api/trips/:tripId/recalculate`
- **Auth**: Optional / Bearer Token
- **Request Body**:
  ```json
  {
    "reason": "PLACE_UNAVAILABLE",
    "affectedStopId": "patna-golghar",
    "currentLocation": {
      "latitude": 25.5941,
      "longitude": 85.1376
    },
    "remainingTimeMinutes": 120,
    "remainingBudget": 400
  }
  ```
- **Supported Reasons**:
  - `PLACE_UNAVAILABLE`: Finds suitable alternative destination and replaces stop.
  - `USER_RUNNING_LATE`: Compresses remaining durations to meet schedule.
  - `STOP_SKIPPED`: Marks stop as skipped and updates corridor.
  - `TRAFFIC_CHANGE`: Recalculates route legs.
  - `TIME_REDUCED`: Adapts timeline.
  - `BUDGET_CHANGED`: Adjusts spending metrics.
- **Response `200 OK`**: Returns updated `trip` with recalculated route and budget.

---

## 9. Saved Places (Favorites)

### Save Place
- **Method**: `POST`
- **URL**: `/api/saved-places`
- **Request Body**: `{ "placeId": "patna-golghar" }`

### Get Saved Places
- **Method**: `GET`
- **URL**: `/api/saved-places`

### Remove Saved Place
- **Method**: `DELETE`
- **URL**: `/api/saved-places/:placeId`
