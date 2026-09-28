-- Rebuild traceability contributions so each route's contribution reflects
-- its fare level and observation share instead of only observation count.
-- Contributions are normalized to reconstruct the published daily index.

DELETE FROM index_contributions;

WITH daily_groups AS (
  SELECT
    i.id AS index_id,
    i.index_date,
    g.route_id,
    g.airline_id,
    g.booking_window_id,
    g.observation_count,
    g.average_fare,
    COALESCE(rw.weight, 1.0) AS route_weight
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
),
base AS (
  SELECT AVG(fare_inr) AS base_avg_fare
  FROM fare_observations
  WHERE is_valid = true
    AND source = 'synthetic_v1'
    AND observed_at::date = (SELECT MIN(index_date) FROM airfare_indices)
),
weighted_totals AS (
  SELECT
    index_id,
    SUM(average_fare / base.base_avg_fare * observation_count * route_weight) AS weighted_total
  FROM daily_groups CROSS JOIN base
  GROUP BY index_id
)
INSERT INTO index_contributions (
  index_id, route_id, airline_id, booking_window_id,
  observation_count, route_weight, average_fare, normalized_fare, contribution_value
)
SELECT
  g.index_id,
  g.route_id,
  g.airline_id,
  g.booking_window_id,
  g.observation_count,
  g.route_weight,
  g.average_fare,
  g.average_fare / b.base_avg_fare,
  i.index_value
    * (g.average_fare / b.base_avg_fare * g.observation_count * g.route_weight)
    / NULLIF(w.weighted_total, 0)
FROM daily_groups g
JOIN airfare_indices i ON i.id = g.index_id
JOIN weighted_totals w ON w.index_id = g.index_id
CROSS JOIN base b;