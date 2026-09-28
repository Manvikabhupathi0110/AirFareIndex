INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '0_3', 0, 3, '0-3 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='0_3')