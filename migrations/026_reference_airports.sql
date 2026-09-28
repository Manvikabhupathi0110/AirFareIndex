INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'BLR', 'Kempegowda International Airport', 'Bengaluru', 'Karnataka', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='BLR')