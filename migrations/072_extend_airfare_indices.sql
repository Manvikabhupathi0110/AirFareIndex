INSERT INTO airfare_indices (index_date, index_value, base_period, base_value, observation_count, route_count, methodology_version)
SELECT d.index_date, ROUND((100.0 * d.avg_fare / b.base_avg_fare)::numeric,4),
 b.base_period,100.0,d.observation_count,d.route_count,'v1_equal_route_weight'
FROM (
 SELECT observed_at::date AS index_date, AVG(fare_inr) AS avg_fare, COUNT(*) AS observation_count, COUNT(DISTINCT route_id) AS route_count
 FROM fare_observations
 WHERE is_valid=true AND source='synthetic_v1' AND observed_at::date <= DATE '2026-09-30'
 GROUP BY observed_at::date
) d
CROSS JOIN (
 SELECT MIN(observed_at::date) AS base_period, AVG(fare_inr) AS base_avg_fare
 FROM fare_observations WHERE is_valid=true AND source='synthetic_v1'
 AND observed_at::date=(SELECT MIN(observed_at::date) FROM fare_observations WHERE source='synthetic_v1')
) b
WHERE NOT EXISTS (SELECT 1 FROM airfare_indices i WHERE i.index_date=d.index_date);