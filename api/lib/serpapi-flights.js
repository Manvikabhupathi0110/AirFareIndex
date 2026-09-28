const DEFAULT_CURRENCY = 'INR';
const DEFAULT_TRAVEL_CLASS = 'economy';

export function normalizeAirportCode(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function normalizeFlightNumber(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeTravelClass(value) {
  const raw = String(value || DEFAULT_TRAVEL_CLASS).trim().toLowerCase();
  const map = {
    economy: 'economy',
    premium_economy: 'premium_economy',
    premiumeconomy: 'premium_economy',
    business: 'business',
    first: 'first',
    first_class: 'first',
    premium: 'premium'
  };
  return map[raw] || raw || DEFAULT_TRAVEL_CLASS;
}

export function deriveAdvanceWindow(flightDate, collectionDate) {
  if (!flightDate || !collectionDate) return null;
  const flightTs = new Date(`${flightDate}T00:00:00`);
  const collectionTs = new Date(`${collectionDate}T00:00:00`);
  if (Number.isNaN(flightTs.getTime()) || Number.isNaN(collectionTs.getTime())) return null;
  const diffMs = flightTs.getTime() - collectionTs.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function parseNumericPrice(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;
  if (typeof rawValue === 'string') {
    const cleaned = rawValue
      .replace(/[^0-9.,-]/g, '')
      .replace(/,(?=\d{3}(\D|$))/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(/,/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseCurrency(rawValue) {
  const value = String(rawValue || DEFAULT_CURRENCY).trim().toUpperCase();
  if (!value) return DEFAULT_CURRENCY;
  if (value.includes('INR')) return 'INR';
  if (value.includes('USD')) return 'USD';
  if (value.includes('EUR')) return 'EUR';
  if (value.includes('GBP')) return 'GBP';
  return value.slice(0, 3).toUpperCase() || DEFAULT_CURRENCY;
}

export function buildSearchParams({
  origin,
  destination,
  outbound_date,
  return_date,
  trip_type,
  travel_class,
  adults,
  currency,
  locale = 'en',
  country = 'IN'
}) {
  const normalizedTripType = trip_type === 'round_trip' ? 'round_trip' : 'one_way';
  const normalizedClass = normalizeTravelClass(travel_class);
  const classMap = {
    economy: 1,
    premium_economy: 2,
    business: 3,
    first: 4,
    premium: 2
  };

  const query = {
    engine: 'google_flights',
    departure_id: normalizeAirportCode(origin),
    arrival_id: normalizeAirportCode(destination),
    outbound_date,
    type: normalizedTripType === 'round_trip' ? 1 : 2,
    currency: currency || DEFAULT_CURRENCY,
    hl: locale,
    gl: country,
    travel_class: classMap[normalizedClass] ?? 1,
    adults: Number(adults || 1) || 1
  };

  if (normalizedTripType === 'round_trip' && return_date) query.return_date = return_date;
  return query;
}

export function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

export function normalizeStops(value, segments) {
  if (value !== undefined && value !== null && value !== '') {
    const text = String(value).trim().toLowerCase();
    if (text.includes('nonstop') || text.includes('direct')) return 0;
    if (text.includes('1 stop') || text.includes('1-stop') || text.includes('one stop')) return 1;
    if (text.includes('2 stops') || text.includes('2-stop')) return 2;
    const numeric = Number.parseInt(text, 10);
    if (!Number.isNaN(numeric)) return numeric;
  }
  if (Array.isArray(segments) && segments.length > 1) return Math.max(0, segments.length - 1);
  return 0;
}

export function parseGoogleFlightsResponse(payload, metadata = {}) {
  const sourceItems = Array.isArray(payload?.best_flights) ? payload.best_flights : [];
  const otherItems = Array.isArray(payload?.other_flights) ? payload.other_flights : [];
  const list = [...sourceItems, ...otherItems];

  if (!list.length && Array.isArray(payload?.flights)) {
    list.push({ flights: payload.flights, price: payload.price || null, airline: payload.airline || null });
  }

  const collectionDate = metadata.collection_date || metadata.search_date || new Date().toISOString().slice(0, 10);
  const searchDate = metadata.search_date || collectionDate;
  const outboundDate = metadata.outbound_date || null;
  const returnDate = metadata.return_date || null;

  const parsedFlights = list
    .map((entry) => {
      const segments = Array.isArray(entry?.flights) ? entry.flights : [];
      const firstSegment = segments[0] || {};
      const lastSegment = segments[segments.length - 1] || firstSegment;
      const booking = entry?.booking_info || firstSegment?.booking_info || null;
      const originCode = normalizeAirportCode(
        pickFirst(
          firstSegment?.departure_airport?.iata,
          firstSegment?.departure_airport?.code,
          firstSegment?.departure_airport,
          metadata.origin
        )
      );
      const destinationCode = normalizeAirportCode(
        pickFirst(
          lastSegment?.arrival_airport?.iata,
          lastSegment?.arrival_airport?.code,
          lastSegment?.arrival_airport,
          metadata.destination
        )
      );
      const departureTime = pickFirst(
        firstSegment?.departure_time,
        firstSegment?.departure_at,
        firstSegment?.departure,
        firstSegment?.departure_time_utc,
        entry?.departure_time
      );
      const arrivalTime = pickFirst(
        lastSegment?.arrival_time,
        lastSegment?.arrival_at,
        lastSegment?.arrival,
        lastSegment?.arrival_time_utc,
        entry?.arrival_time
      );
      const airlineName = pickFirst(
        firstSegment?.airline,
        firstSegment?.airline_name,
        firstSegment?.airline?.name,
        entry?.airline,
        metadata.airline
      );
      const flightNumber = normalizeFlightNumber(
        pickFirst(
          firstSegment?.flight_number,
          firstSegment?.flight_number_display,
          firstSegment?.flight,
          entry?.flight_number,
          firstSegment?.flight?.number
        )
      );
      const currency = parseCurrency(pickFirst(entry?.currency, payload?.currency, 'INR'));
      const priceValue = parseNumericPrice(pickFirst(entry?.price, firstSegment?.price, payload?.price));
      const routeStops = normalizeStops(pickFirst(firstSegment?.stops, entry?.stops), segments);
      const duration = pickFirst(firstSegment?.duration, entry?.duration, firstSegment?.duration_in_minutes)
      const travelClass = normalizeTravelClass(pickFirst(firstSegment?.travel_class, entry?.travel_class, metadata.travel_class));
      const advanceWindow = deriveAdvanceWindow(outboundDate || (departureTime ? new Date(departureTime).toISOString().slice(0, 10) : null), collectionDate);
      const departureDate = outboundDate || (departureTime ? new Date(departureTime).toISOString().slice(0, 10) : null);
      const outboundValue = departureDate || searchDate;

      return {
        origin: originCode || normalizeAirportCode(metadata.origin),
        destination: destinationCode || normalizeAirportCode(metadata.destination),
        departure_time: departureTime || null,
        arrival_time: arrivalTime || null,
        departure_date: outboundValue,
        airline: airlineName || null,
        airline_iata: normalizeAirportCode(pickFirst(firstSegment?.airline_iata, firstSegment?.airline_code, firstSegment?.airline?.code)),
        flight_number: flightNumber,
        aircraft: pickFirst(firstSegment?.aircraft, firstSegment?.aircraft_model, firstSegment?.aircraft_name) || null,
        duration: duration || null,
        stops: routeStops,
        layover_info: segments.length > 1
          ? segments.slice(1).map((segment) => ({
              departure_airport: normalizeAirportCode(pickFirst(segment?.departure_airport?.iata, segment?.departure_airport?.code, segment?.departure_airport)),
              arrival_airport: normalizeAirportCode(pickFirst(segment?.arrival_airport?.iata, segment?.arrival_airport?.code, segment?.arrival_airport)),
              airline: pickFirst(segment?.airline, segment?.airline_name),
              departure_time: pickFirst(segment?.departure_time, segment?.departure_at),
              arrival_time: pickFirst(segment?.arrival_time, segment?.arrival_at),
              duration: segment?.duration || null
            }))
          : [],
        price: priceValue,
        currency,
        travel_class: travelClass,
        booking_info: booking,
        source: 'Google Flights via SerpApi',
        scraped_at: new Date().toISOString(),
        search_date: searchDate,
        outbound_date: outboundValue,
        return_date: returnDate,
        collection_date: collectionDate,
        advance_window: advanceWindow,
        price_insights: payload?.price_insights || null
      };
    })
    .filter((flight) => flight.origin && flight.destination && (flight.price !== null || flight.booking_info || flight.flight_number));

  const deduped = new Map();
  for (const flight of parsedFlights) {
    const key = `${flight.origin}|${flight.destination}|${flight.departure_date}|${flight.airline || 'UNKNOWN'}|${flight.flight_number || 'NO-FLIGHT'}|${flight.price ?? 'NA'}`;
    if (!deduped.has(key)) deduped.set(key, flight);
  }

  return [...deduped.values()];
}
