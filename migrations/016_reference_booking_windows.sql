INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '16_30', 16, 30, '16-30 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='16_30')