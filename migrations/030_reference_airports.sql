INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'PNQ', 'Pune Airport', 'Pune', 'Maharashtra', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='PNQ')