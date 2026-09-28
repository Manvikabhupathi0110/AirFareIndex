import assert from 'node:assert/strict';
import { parseGoogleFlightsResponse, buildSearchParams, deriveAdvanceWindow } from '../lib/serpapi-flights.js';

const sampleResponse = {
  best_flights: [
    {
      flights: [
        {
          departure_airport: { iata: 'HYD' },
          arrival_airport: { iata: 'DEL' },
          departure_time: '2026-10-15T08:45:00+05:30',
          arrival_time: '2026-10-15T10:25:00+05:30',
          airline: 'IndiGo',
          flight_number: '6E 202',
          duration: '1h 40m',
          stops: 'nonstop',
          price: '₹6,130'
        }
      ],
      price: '₹6,130',
      total_flights: 1,
      booking_info: { booking_link: 'https://example.com' }
    }
  ],
  price_insights: {
    lowest_price: 6130,
    typical_price_range: { min: 6000, max: 7000 }
  }
};

const parsed = parseGoogleFlightsResponse(sampleResponse, {
  origin: 'HYD',
  destination: 'DEL',
  outbound_date: '2026-10-15',
  collection_date: '2026-09-21'
});

assert.equal(parsed.length, 1);
assert.equal(parsed[0].origin, 'HYD');
assert.equal(parsed[0].destination, 'DEL');
assert.equal(parsed[0].currency, 'INR');
assert.equal(parsed[0].price, 6130);
assert.equal(parsed[0].advance_window, 24);
assert.ok(parsed[0].source.includes('SerpApi'));

const params = buildSearchParams({
  origin: 'HYD',
  destination: 'DEL',
  outbound_date: '2026-10-15',
  return_date: '2026-10-20',
  trip_type: 'round_trip',
  travel_class: 'economy',
  adults: 1,
  currency: 'INR'
});

assert.equal(params.departure_id, 'HYD');
assert.equal(params.arrival_id, 'DEL');
assert.equal(params.currency, 'INR');
assert.equal(params.type, 1);
assert.equal(params.travel_class, 1);
assert.equal(params.return_date, '2026-10-20');
assert.equal(deriveAdvanceWindow('2026-10-15', '2026-09-21'), 24);

console.log('SerpApi parser smoke tests passed');
