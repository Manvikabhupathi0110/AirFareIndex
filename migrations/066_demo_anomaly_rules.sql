INSERT INTO data_quality_flags
  (fare_observation_id, rule_code, severity, reason, detected_value, threshold_value)
SELECT f.id, 'EXTREME_ROUTE_FARE', 'warning',
       'Demo feed fare is more than 2.5 times the route and booking-window median.',
       f.fare_inr, x.median_fare * 2.5
FROM fare_observations f
JOIN (
  SELECT route_id, booking_window_id,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY fare_inr) AS median_fare
  FROM fare_observations
  WHERE is_valid=true AND source='synthetic_v1'
  GROUP BY route_id, booking_window_id
) x ON x.route_id=f.route_id AND x.booking_window_id=f.booking_window_id
WHERE f.source='synthetic_anomaly_v1'
  AND f.fare_inr > x.median_fare * 2.5
  AND NOT EXISTS (
    SELECT 1 FROM data_quality_flags q
    WHERE q.fare_observation_id=f.id AND q.rule_code='EXTREME_ROUTE_FARE'
  );

INSERT INTO data_quality_flags
  (fare_observation_id, rule_code, severity, reason, detected_value, threshold_value)
SELECT f.id, 'DUPLICATE_OBSERVATION', 'warning',
       'Observation duplicates another fare feed record for the same route, airline, booking window, departure date and fare.',
       f.fare_inr, NULL
FROM fare_observations f
WHERE f.source='synthetic_anomaly_v1'
  AND EXISTS (
    SELECT 1
    FROM fare_observations d
    WHERE d.id <> f.id
      AND d.route_id=f.route_id
      AND d.airline_id=f.airline_id
      AND d.booking_window_id=f.booking_window_id
      AND d.departure_date=f.departure_date
      AND d.observed_at=f.observed_at
      AND d.fare_inr=f.fare_inr
  )
  AND NOT EXISTS (
    SELECT 1 FROM data_quality_flags q
    WHERE q.fare_observation_id=f.id AND q.rule_code='DUPLICATE_OBSERVATION'
  );