WITH base AS (
  SELECT *
  FROM (
    SELECT f.*, ROW_NUMBER() OVER (ORDER BY f.departure_date, f.id) AS rn
    FROM fare_observations f
    WHERE f.source='synthetic_v1'
      AND f.is_valid=true
      AND f.fare_inr > 0
  ) s
  WHERE rn <= 6
)
INSERT INTO fare_observations
  (route_id, airline_id, booking_window_id, observed_at, departure_date,
   days_before_departure, fare_inr, currency, source, flight_number,
   cabin_class, stops, is_valid)
SELECT route_id, airline_id, booking_window_id, observed_at, departure_date,
       days_before_departure, fare_inr * 5, currency, 'synthetic_anomaly_v1',
       flight_number || '-ANOM1', cabin_class, stops, true
FROM base WHERE rn=1
UNION ALL
SELECT route_id, airline_id, booking_window_id, observed_at, departure_date,
       days_before_departure, fare_inr, currency, 'synthetic_anomaly_v1',
       flight_number || '-DUP1', cabin_class, stops, true
FROM base WHERE rn=2
UNION ALL
SELECT route_id, airline_id, booking_window_id, observed_at, departure_date,
       5, fare_inr, currency, 'synthetic_anomaly_v1',
       flight_number || '-TIME1', cabin_class, stops, true
FROM base WHERE rn=3
UNION ALL
SELECT route_id, airline_id, booking_window_id, departure_date::timestamptz + interval '1 day',
       departure_date, days_before_departure, fare_inr, currency, 'synthetic_anomaly_v1',
       flight_number || '-AFTER1', cabin_class, stops, true
FROM base WHERE rn=4
UNION ALL
SELECT route_id, airline_id, booking_window_id, observed_at, departure_date,
       days_before_departure, fare_inr * 4, currency, 'synthetic_anomaly_v1',
       flight_number || '-ANOM2', cabin_class, stops, true
FROM base WHERE rn=5
UNION ALL
SELECT route_id, airline_id, booking_window_id, observed_at, departure_date,
       2, fare_inr, currency, 'synthetic_anomaly_v1',
       flight_number || '-TIME2', cabin_class, stops, true
FROM base WHERE rn=6