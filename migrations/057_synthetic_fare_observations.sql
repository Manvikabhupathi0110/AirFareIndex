INSERT INTO fare_observations (route_id, airline_id, booking_window_id, observed_at, departure_date, days_before_departure, fare_inr, currency, source, flight_number, cabin_class, stops, is_valid)
SELECT r.id, a.id, bw.id, (d.departure_date - (bw.min_days_before_departure * interval '1 day'))::timestamp + interval '10 hours', d.departure_date, bw.min_days_before_departure,
ROUND(((900 + r.distance_km * 2.05)
* CASE bw.code WHEN '0_3' THEN 1.45 WHEN '4_7' THEN 1.25 WHEN '8_15' THEN 1.10 WHEN '16_30' THEN 1.00 WHEN '31_60' THEN 0.92 WHEN '61_90' THEN 0.85 END
* CASE a.iata_code WHEN 'AI' THEN 1.08 WHEN '6E' THEN 1.00 WHEN 'IX' THEN 0.95 WHEN 'SG' THEN 0.97 WHEN 'QP' THEN 0.98 END
* (1 + 0.035 * SIN(EXTRACT(DOY FROM d.departure_date) * 0.11) + 0.025 * COS(EXTRACT(DOW FROM d.departure_date) * 1.7) + ((ABS(HASHTEXT(r.route_code || '|' || a.iata_code || '|' || d.departure_date::text || '|' || bw.code)) % 2001) - 1000) / 10000.0))::numeric, 2),
'INR', 'synthetic_v1',
a.iata_code || '-' || LPAD(((ABS(HASHTEXT(r.route_code || '|' || a.iata_code || '|' || d.departure_date::text)) % 9000) + 1000)::text, 4, '0'),
'economy', 0, true
FROM routes r
CROSS JOIN airlines a
CROSS JOIN booking_windows bw
CROSS JOIN generate_series(DATE '2026-04-01', DATE '2026-07-29', INTERVAL '1 day') AS d(departure_date)
WHERE r.is_active = true AND a.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM fare_observations f
  WHERE f.route_id = r.id AND f.airline_id = a.id AND f.booking_window_id = bw.id AND f.departure_date = d.departure_date
);