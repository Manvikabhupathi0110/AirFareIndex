# AirFare Intelligence Platform

SIH26056 — Indian Airfare Price Index & Intelligence Platform

This project already includes the dashboard, public API, synthetic fare dataset, and the PostgreSQL schema used to calculate the Indian Airfare Price Index. The new Google Flights integration extends the existing backend while preserving the current architecture.

## SerpApi / Google Flights integration

### 1. Obtain a SerpApi key

1. Sign up at https://serpapi.com/
2. Create a new API key in your SerpApi dashboard
3. Keep that key private and never commit it to the repository

### 2. Where to place the key

Create a local environment file in the project root:

- .env

Add:

SERPAPI_KEY=your_serpapi_key_here

The app reads this only on the backend and never exposes the value to the frontend.

### 3. Start the backend

Use the Hatchable project environment or your local backend runtime. For a local shell, ensure the environment file is loaded before starting the service.

### 4. Start the frontend

Open the static dashboard from the Hatchable app or your local frontend host. The app uses the current HTML pages under the public directory.

### 5. Test a flight search

Example request:

GET /api/flights/search?origin=HYD&destination=DEL&outbound_date=2026-10-15&trip_type=one_way&travel_class=economy

The API validates the route and date, calls SerpApi, parses the Google Flights response, stores normalized fare observations, and returns clean JSON.

### 6. Database tables affected

The integration reuses the existing schema and extends the live search flow without creating duplicate database structures:

- airports
- airlines
- routes
- booking_windows
- fare_observations

The source field is stored as "Google Flights via SerpApi".

### 7. API endpoint

- GET /api/flights/search

Supported parameters:

- origin
- destination
- outbound_date
- return_date
- trip_type (one_way or round_trip)
- travel_class
- adults
- currency
- fresh

### 8. Data flow

Frontend -> Existing backend API -> SerpApi Google Flights -> Structured JSON -> Flight parser -> PostgreSQL fare_observations -> Analytics / Prediction layer -> Dashboard

### 9. Limitations

- Google Flights/SerpApi can return missing optional fields such as baggage, aircraft, or fare breakdowns.
- Not every flight includes a separate base fare, taxes, or convenience fee; only valid values are stored.
- The live search endpoint avoids unnecessary repeated requests by checking recent database observations before calling SerpApi.
- Historical collection is allowed, but the implementation keeps it controlled and does not run continuous background scraping.

### 10. Historical fare collection

The normalized data is emitted to the same fare_observations structure used by the index pipeline, which allows future scheduled collection jobs to gather price points over advance windows such as 7, 15, 30, 45, and 60 days before departure.

## Implementation notes

- The integration is backend-only: the SerpApi key never reaches the browser.
- The response is normalized before insertion into PostgreSQL.
- Duplicate observations are filtered before insert based on route, airline, departure date, flight number, source, and observed date.
- The project preserves the existing synthetic dataset and dashboard flow while adding the live search capability.

## About Hatchable

Hatchable is where AI-built apps go live. Connect the AI you already use and it can build, deploy, and run apps like this one for you.

Built on Hatchable. https://hatchable.com
