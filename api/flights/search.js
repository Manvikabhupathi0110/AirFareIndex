import { db } from 'hatchable';
import { buildSearchParams, normalizeAirportCode, parseGoogleFlightsResponse } from '../lib/serpapi-flights.js';

const SOURCE_NAME = 'Google Flights via SerpApi';

function isValidDate(value) {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

async function findCachedFlights({ origin, destination, outboundDate, freshOnly, nowIso }) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const query = `
    SELECT fo.departure_date, fo.days_before_departure, fo.fare_inr AS price, fo.currency,
           fo.source, fo.flight_number, fo.cabin_class, fo.stops,
           o.iata_code AS origin, d.iata_code AS destination, a.iata_code AS airline,
           fo.observed_at, fo.created_at
    FROM fare_observations fo
    JOIN routes r ON r.id = fo.route_id
    JOIN airports o ON o.id = r.origin_airport_id
    JOIN airports d ON d.id = r.destination_airport_id
    JOIN airlines a ON a.id = fo.airline_id
    WHERE o.iata_code = $1
      AND d.iata_code = $2
      AND fo.departure_date >= $3
      AND fo.source = $4
    ORDER BY fo.observed_at DESC
    LIMIT 10
  `;

  const rows = await db.query(query, [origin, destination, cutoff, SOURCE_NAME]);
  return rows.rows.map((row) => ({
    origin: row.origin,
    destination: row.destination,
    departure_date: row.departure_date,
    airline: row.airline,
    flight_number: row.flight_number,
    price: Number(row.price),
    currency: row.currency,
    travel_class: row.cabin_class,
    stops: Number(row.stops || 0),
    source: row.source,
    scraped_at: row.observed_at || row.created_at || nowIso,
    fetched_from_cache: true
  }));
}

async function resolveAirportId(iataCode, fallbackName = '', fallbackCity = '') {
  const code = normalizeAirportCode(iataCode || '');
  if (!code) return null;

  const existing = await db.query('SELECT id, iata_code FROM airports WHERE iata_code = $1 LIMIT 1', [code]);
  if (existing.rows.length) return existing.rows[0].id;

  const insert = await db.query(
    `INSERT INTO airports (iata_code, name, city, state, country, timezone)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (iata_code) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city
     RETURNING id`,
    [code, fallbackName || `${code} Airport`, fallbackCity || code, null, 'IN', 'Asia/Kolkata']
  );

  return insert.rows[0].id;
}

async function resolveAirlineId(airlineName, airlineIata, flightNumber) {
  const normalizedCode = normalizeAirportCode(airlineIata || '');
  const candidateName = (airlineName || '').trim();
  const candidateNumberCode = (flightNumber || '').trim().split(' ')[0] || '';
  const derivedCode = normalizedCode || candidateNumberCode.toUpperCase();

  if (derivedCode) {
    const existing = await db.query('SELECT id FROM airlines WHERE iata_code = $1 LIMIT 1', [derivedCode]);
    if (existing.rows.length) return existing.rows[0].id;
  }

  const nameForInsert = candidateName || (derivedCode ? `${derivedCode} Airline` : 'Unknown Airline');
  const insert = await db.query(
    `INSERT INTO airlines (iata_code, name, icao_code, is_active)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (iata_code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [derivedCode || 'N/A', nameForInsert, null]
  );

  return insert.rows[0].id;
}

async function resolveRouteId(originCode, destinationCode) {
  const routeCode = `${normalizeAirportCode(originCode)}-${normalizeAirportCode(destinationCode)}`;
  const existing = await db.query('SELECT id FROM routes WHERE route_code = $1 LIMIT 1', [routeCode]);
  if (existing.rows.length) return existing.rows[0].id;

  const originId = await resolveAirportId(originCode, `${originCode} Airport`, originCode);
  const destinationId = await resolveAirportId(destinationCode, `${destinationCode} Airport`, destinationCode);
  if (!originId || !destinationId) return null;

  const inserted = await db.query(
    `INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km, is_active)
     VALUES ($1, $2, $3, NULL, TRUE)
     ON CONFLICT (route_code) DO UPDATE SET destination_airport_id = EXCLUDED.destination_airport_id
     RETURNING id`,
    [originId, destinationId, routeCode]
  );

  return inserted.rows[0]?.id || null;
}

async function resolveBookingWindowId(daysBeforeDeparture) {
  const safeDays = Number(daysBeforeDeparture ?? 0);
  const result = await db.query(
    `SELECT id FROM booking_windows
     WHERE min_days_before_departure <= $1
       AND (max_days_before_departure IS NULL OR max_days_before_departure >= $1)
     ORDER BY min_days_before_departure DESC
     LIMIT 1`,
    [safeDays]
  );

  return result.rows[0]?.id || null;
}

async function persistFlights(flights, { origin, destination, returnDate, outboundDate, travelClass, adults }) {
  const saved = [];

  for (const flight of flights) {
    const routeId = await resolveRouteId(flight.origin || origin, flight.destination || destination);
    const airlineId = await resolveAirlineId(flight.airline, flight.airline_iata, flight.flight_number);
    const bookingWindowId = await resolveBookingWindowId(flight.advance_window ?? 0);
    const departureDate = flight.outbound_date || flight.departure_date || outboundDate;
    const observedAtIso = flight.scraped_at || new Date().toISOString();
    const fareInr = Number(flight.price ?? 0);
    const duplicate = await db.query(
      `SELECT id FROM fare_observations
       WHERE route_id = $1
         AND airline_id = $2
         AND departure_date = $3
         AND COALESCE(LOWER(flight_number), '') = COALESCE(LOWER($4), '')
         AND source = $5
         AND observed_at::date = $6
       LIMIT 1`,
      [routeId, airlineId, departureDate, flight.flight_number || null, SOURCE_NAME, observedAtIso.slice(0, 10)]
    );

    if (duplicate.rows.length) {
      saved.push({ skipped_duplicate: true, flight_number: flight.flight_number, departure_date: departureDate });
      continue;
    }

    const insertResult = await db.query(
      `INSERT INTO fare_observations (
         route_id, airline_id, booking_window_id, observed_at, departure_date,
         days_before_departure, fare_inr, currency, source, flight_number,
         cabin_class, stops, is_valid
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
       RETURNING id`,
      [
        routeId,
        airlineId,
        bookingWindowId,
        observedAtIso,
        departureDate,
        flight.advance_window ?? 0,
        fareInr,
        flight.currency || 'INR',
        SOURCE_NAME,
        flight.flight_number || null,
        flight.travel_class || normalizeTravelClass(travelClass || 'economy'),
        Number(flight.stops ?? 0),
      ]
    );

    saved.push({ inserted_id: insertResult.rows[0]?.id || null, flight_number: flight.flight_number, departure_date: departureDate });
  }

  return saved;
}

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const origin = String(req.query.origin || '').trim();
  const destination = String(req.query.destination || '').trim();
  const outboundDate = String(req.query.outbound_date || '').trim();
  const returnDate = String(req.query.return_date || '').trim();
  const tripType = String(req.query.trip_type || 'one_way').trim().toLowerCase();
  const travelClass = String(req.query.travel_class || 'economy').trim();
  const adults = Number(req.query.adults || 1) || 1;
  const currency = String(req.query.currency || 'INR').trim().toUpperCase();
  const fresh = String(req.query.fresh || 'false').toLowerCase() === 'true';

  if (!origin || !destination || !outboundDate) {
    return res.status(400).json({
      error: 'origin, destination, and outbound_date are required.',
      example: '/api/flights/search?origin=HYD&destination=DEL&outbound_date=2026-10-15'
    });
  }

  if (!isValidDate(outboundDate)) {
    return res.status(400).json({ error: 'outbound_date must be a valid date in YYYY-MM-DD format.' });
  }

  if (tripType === 'round_trip' && !returnDate) {
    return res.status(400).json({ error: 'return_date is required for round-trip searches.' });
  }

  if (tripType === 'round_trip' && returnDate && !isValidDate(returnDate)) {
    return res.status(400).json({ error: 'return_date must be a valid date in YYYY-MM-DD format when provided.' });
  }

  const normalizedOrigin = normalizeAirportCode(origin);
  const normalizedDestination = normalizeAirportCode(destination);
  const normalizedTripType = tripType === 'round_trip' ? 'round_trip' : 'one_way';

  if (!normalizedOrigin || !normalizedDestination || normalizedOrigin.length < 2 || normalizedDestination.length < 2) {
    return res.status(400).json({ error: 'origin and destination must be valid airport codes or city identifiers.' });
  }

  const cacheKey = { origin: normalizedOrigin, destination: normalizedDestination, outbound_date: outboundDate };
  if (!fresh) {
    const recentRows = await findCachedFlights({
      origin: normalizedOrigin,
      destination: normalizedDestination,
      outboundDate,
      freshOnly: false,
      nowIso: new Date().toISOString()
    });
    if (recentRows.length) {
      return res.json({
        source: 'database',
        cached: true,
        search: { ...cacheKey, trip_type: normalizedTripType, return_date: returnDate || null },
        flights: recentRows,
        count: recentRows.length
      });
    }
  }

  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) {
    return res.status(500).json({ error: 'SERPAPI_KEY is not configured. Add it to the backend environment before using Google Flights.' });
  }

  try {
    const params = buildSearchParams({
      origin: normalizedOrigin,
      destination: normalizedDestination,
      outbound_date: outboundDate,
      return_date: returnDate || undefined,
      trip_type: normalizedTripType,
      travel_class: travelClass,
      adults,
      currency
    });

    if (normalizedTripType === 'one_way') {
      delete params.return_date;
    }

    const apiUrl = new URL('https://serpapi.com/search');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        apiUrl.searchParams.set(key, String(value));
      }
    });
    apiUrl.searchParams.set('api_key', serpApiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let serpResponse;
    try {
      const fetched = await fetch(apiUrl.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } });
      clearTimeout(timeout);
      if (!fetched.ok) {
        const text = await fetched.text();
        throw new Error(`SerpApi request failed with HTTP ${fetched.status}: ${text.slice(0, 200)}`);
      }
      serpResponse = await fetched.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error?.name === 'AbortError') {
        return res.status(504).json({ error: 'SerpApi request timed out while querying Google Flights.' });
      }
      if (error instanceof TypeError) {
        return res.status(502).json({ error: 'Network failure while contacting SerpApi.' });
      }
      return res.status(502).json({ error: 'SerpApi request failed.', details: error.message });
    }

    if (!serpResponse || typeof serpResponse !== 'object') {
      return res.status(502).json({ error: 'Malformed SerpApi response received from Google Flights.' });
    }

    if (serpResponse.error) {
      const message = serpResponse.error || 'SerpApi returned an error.';
      return res.status(401).json({ error: 'Invalid SerpApi API key or request.', details: message });
    }

    const flights = parseGoogleFlightsResponse(serpResponse, {
      origin: normalizedOrigin,
      destination: normalizedDestination,
      outbound_date: outboundDate,
      return_date: returnDate || null,
      search_date: new Date().toISOString().slice(0, 10),
      collection_date: new Date().toISOString().slice(0, 10),
      travel_class: travelClass,
      currency
    });

    if (!flights.length) {
      return res.status(404).json({
        error: 'No Google Flights results available for the selected route and dates.',
        search: { ...cacheKey, trip_type: normalizedTripType, return_date: returnDate || null }
      });
    }

    const saved = await persistFlights(flights, {
      origin: normalizedOrigin,
      destination: normalizedDestination,
      outboundDate,
      returnDate,
      travelClass,
      adults
    });

    return res.json({
      source: SOURCE_NAME,
      cached: false,
      search: { ...cacheKey, trip_type: normalizedTripType, return_date: returnDate || null },
      count: flights.length,
      flights,
      saved
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected Google Flights error.',
      details: error?.message || 'Unknown error'
    });
  }
}
