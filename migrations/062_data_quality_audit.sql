INSERT INTO data_quality_flags
  (fare_observation_id, rule_code, severity, reason, detected_value, threshold_value)
SELECT f.id, 'EXTREME_ROUTE_FARE', 'warning',
       'Fare is more than 2.5 times the route and booking-window median.',
       f.fare_inr, x.median_fare * 2.5
FROM fare_observations f
JOIN (
  SELECT route_id, booking_window_id,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY fare_inr) AS median_fare
  FROM fare_observations
  WHERE is_valid=true AND source LIKE 'synthetic%'
  GROUP BY route_id, booking_window_id
) x ON x.route_id=f.route_id AND x.booking_window_id=f.booking_window_id
WHERE f.is_valid=true
  AND f.source LIKE 'synthetic%'
  AND f.fare_inr > x.median_fare * 2.5
  AND NOT EXISTS (
    SELECT 1 FROM data_quality_flags q
    WHERE q.fare_observation_id=f.id AND q.rule_code='EXTREME_ROUTE_FARE'
  )