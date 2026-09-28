INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '61_90', 61, 90, '61-90 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='61_90')