INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'West Bengal', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='CCU')