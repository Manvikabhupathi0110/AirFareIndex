INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'GOI', 'Manohar International Airport', 'Goa', 'Goa', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='GOI')