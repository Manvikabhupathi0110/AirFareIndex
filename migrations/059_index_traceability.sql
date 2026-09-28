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
    observed_at::date AS index_date,
    route_id,
    airline_id,
    booking_window_id,
    COUNT(*) AS observation_count,
    AVG(fare_inr) AS average_fare
  FROM fare_observations
  WHERE is_valid = true AND source = 'synthetic_v1'
  GROUP BY observed_at::date, route_id, airline_id, booking_window_id
) g ON g.index_date = i.index_date
LEFT JOIN route_weights rw
  ON rw.route_id = g.route_id
  AND rw.effective_from <= i.index_date
  AND (rw.effective_to IS NULL OR rw.effective_to >= i.index_date)
CROSS JOIN (
  SELECT AVG(fare_inr) AS base_avg_fare
  FROM fare_observations
  WHERE is_valid = true
    AND source = 'synthetic_v1'
    AND observed_at::date = (SELECT MIN(index_date) FROM airfare_indices)
) b
JOIN (
  SELECT observed_at::date AS index_date, COUNT(*) AS total_observations
  FROM fare_observations
  WHERE is_valid = true AND source = 'synthetic_v1'
  GROUP BY observed_at::date
) totals ON totals.index_date = i.index_date
WHERE NOT EXISTS (
  SELECT 1 FROM index_contributions c
  WHERE c.index_id = i.id
);