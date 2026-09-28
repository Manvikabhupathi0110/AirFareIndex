INSERT INTO data_quality_flags
  (fare_observation_id, rule_code, severity, reason, detected_value, threshold_value)
SELECT f.id, 'OBSERVED_AFTER_DEPARTURE', 'critical',
       'Fare was observed after the flight departure date, which is temporally impossible for a booking observation.',
       EXTRACT(EPOCH FROM (f.observed_at - f.departure_date::timestamptz))/86400,
       0
FROM fare_observations f
WHERE f.source='synthetic_anomaly_v1'
  AND f.observed_at > f.departure_date::timestamptz
  AND NOT EXISTS (
    SELECT 1 FROM data_quality_flags q
    WHERE q.fare_observation_id=f.id AND q.rule_code='OBSERVED_AFTER_DEPARTURE'
  )