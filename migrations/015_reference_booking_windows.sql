INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '8_15', 8, 15, '8-15 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='8_15')