INSERT INTO route_weights (route_id,effective_from,weight,methodology)
SELECT id,'2026-01-01',1.0,'synthetic_equal_route_weight'
FROM routes r
WHERE NOT EXISTS (SELECT 1 FROM route_weights rw WHERE rw.route_id=r.id AND rw.effective_from='2026-01-01')