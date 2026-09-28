INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '31_60', 31, 60, '31-60 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='31_60')