INSERT INTO data_quality_flags
  (fare_observation_id, rule_code, severity, reason, detected_value, threshold_value)
SELECT f.id, 'BOOKING_WINDOW_MISMATCH', 'critical',
       'days_before_departure falls outside the configured booking-window range.',
       f.days_before_departure,
       bw.min_days_before_departure
FROM fare_observations f
JOIN booking_windows bw ON bw.id=f.booking_window_id
WHERE f.source='synthetic_anomaly_v1'
  AND (
    f.days_before_departure < bw.min_days_before_departure
    OR (bw.max_days_before_departure IS NOT NULL AND f.days_before_departure > bw.max_days_before_departure)
  )
  AND NOT EXISTS (
    SELECT 1 FROM data_quality_flags q
    WHERE q.fare_observation_id=f.id AND q.rule_code='BOOKING_WINDOW_MISMATCH'
  )