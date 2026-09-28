import { setTimeout as delay } from 'node:timers/promises';
import dotenv from 'dotenv';
import { default as pg } from 'pg';

dotenv.config();

const { Client } = pg;

export function buildDailySearchTargets(startDate, count = 30) {
  const results = [];
  const end = new Date(`${startDate}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (count - 1));

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cursor.getUTCDate()).padStart(2, '0');
    results.push(`${y}-${m}-${d}`);
  }

  return results;
}

export function buildDailySearchParams({ origin, destination, date, tripType = 'one_way', travelClass = 'economy', adults = 1, currency = 'INR' }) {
  return {
    origin: String(origin || '').trim().toUpperCase(),
    destination: String(destination || '').trim().toUpperCase(),
    outbound_date: String(date || '').trim(),
    trip_type: String(tripType || 'one_way').trim().toLowerCase(),
    travel_class: String(travelClass || 'economy').trim().toLowerCase(),
    adults: Number(adults || 1),
    currency: String(currency || 'INR').trim().toUpperCase(),
    fresh: 'true'
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function rebuildAirfareIndex(startDate = null, dayCount = 30) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const endDate = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
  const rangeStart = new Date(endDate);
  rangeStart.setUTCDate(endDate.getUTCDate() - (Math.max(1, Number(dayCount) || 30) - 1));
  const startIso = rangeStart.toISOString().slice(0, 10);
  const endIso = endDate.toISOString().slice(0, 10);

  const sql = `
    DELETE FROM index_contributions
    WHERE index_id IN (
      SELECT id FROM airfare_indices
      WHERE index_date >= DATE '${startIso}'
        AND index_date <= DATE '${endIso}'
    );

    DELETE FROM airfare_indices
    WHERE index_date >= DATE '${startIso}'
      AND index_date <= DATE '${endIso}';

    INSERT INTO airfare_indices (index_date, index_value, base_period, base_value, observation_count, route_count, methodology_version)
    SELECT
      d.index_date,
      ROUND((100.0 * d.avg_fare / b.base_avg_fare)::numeric, 4) AS index_value,
      b.base_period,
      100.0,
      d.observation_count,
      d.route_count,
      'v1_equal_route_weight'
    FROM (
      SELECT
        departure_date::date AS index_date,
        AVG(fare_inr) AS avg_fare,
        COUNT(*) AS observation_count,
        COUNT(DISTINCT route_id) AS route_count
      FROM fare_observations
      WHERE is_valid = true
        AND source = 'Google Flights via SerpApi'
        AND departure_date::date >= DATE '${startIso}'
        AND departure_date::date <= DATE '${endIso}'
      GROUP BY departure_date::date
    ) d
    CROSS JOIN (
      SELECT MIN(departure_date::date) AS base_period,
             AVG(fare_inr) AS base_avg_fare
      FROM fare_observations
      WHERE is_valid = true
        AND source = 'Google Flights via SerpApi'
        AND departure_date::date >= DATE '${startIso}'
        AND departure_date::date <= DATE '${endIso}'
    ) b;

    INSERT INTO index_contributions (
      index_id, route_id, airline_id, booking_window_id,
      observation_count, route_weight, average_fare, normalized_fare, contribution_value
    )
    SELECT
      i.id,
      g.route_id,
      g.airline_id,
      g.booking_window_id,
      g.observation_count,
      COALESCE(rw.weight, 1.0),
      g.average_fare,
      g.average_fare / b.base_avg_fare,
      i.index_value * g.observation_count::numeric / totals.total_observations
    FROM airfare_indices i
    JOIN (
      SELECT
        departure_date::date AS index_date,
        route_id,
        airline_id,
        booking_window_id,
        COUNT(*) AS observation_count,
        AVG(fare_inr) AS average_fare
      FROM fare_observations
      WHERE is_valid = true
        AND source = 'Google Flights via SerpApi'
        AND departure_date::date >= DATE '${startIso}'
        AND departure_date::date <= DATE '${endIso}'
      GROUP BY departure_date::date, route_id, airline_id, booking_window_id
    ) g ON g.index_date = i.index_date
    LEFT JOIN route_weights rw
      ON rw.route_id = g.route_id
     AND rw.effective_from <= i.index_date
     AND (rw.effective_to IS NULL OR rw.effective_to >= i.index_date)
    CROSS JOIN (
      SELECT AVG(fare_inr) AS base_avg_fare
      FROM fare_observations
      WHERE is_valid = true
        AND source = 'Google Flights via SerpApi'
        AND departure_date::date >= DATE '${startIso}'
        AND departure_date::date <= DATE '${endIso}'
        AND departure_date::date = (SELECT MIN(index_date) FROM airfare_indices WHERE index_date >= DATE '${startIso}' AND index_date <= DATE '${endIso}')
    ) b
    JOIN (
      SELECT departure_date::date AS index_date, COUNT(*) AS total_observations
      FROM fare_observations
      WHERE is_valid = true
        AND source = 'Google Flights via SerpApi'
        AND departure_date::date >= DATE '${startIso}'
        AND departure_date::date <= DATE '${endIso}'
      GROUP BY departure_date::date
    ) totals ON totals.index_date = i.index_date;
  `;

  await client.query(sql);
  await client.end();
}

async function runDailyScrape({ routes = [{ origin: 'HYD', destination: 'DEL' }], daysAhead = 30, baseUrl = 'http://localhost:3000', startDate = null } = {}) {
  const targetDate = startDate || new Date().toISOString().slice(0, 10);
  const dates = buildDailySearchTargets(targetDate, Math.max(1, Number(daysAhead) || 30));
  const results = [];

  for (const route of routes) {
    for (const date of dates) {
      const params = buildDailySearchParams({ ...route, date });
      const query = new URLSearchParams(params);
      const url = `${baseUrl}/api/flights/search?${query.toString()}`;
      const response = await fetchJson(url);
      results.push({ route, date, count: response?.count || 0, source: response?.source || 'unknown' });
      await delay(1500);
    }
  }

  await rebuildAirfareIndex();
  return results;
}

export default async function main() {
  const routes = [
    { origin: 'HYD', destination: 'DEL' },
    { origin: 'DEL', destination: 'HYD' },
    { origin: 'BLR', destination: 'HYD' }
  ];

  const result = await runDailyScrape({
    routes,
    daysAhead: Number(process.env.SCRAPE_DAYS_AHEAD || 30),
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    startDate: process.env.SCRAPE_START_DATE || new Date().toISOString().slice(0, 10)
  });

  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && process.argv[1].includes('daily-flight-scrape.js')) {
  main().catch((err) => {
    console.error('Daily scrape failed:', err.message);
    process.exit(1);
  });
}
