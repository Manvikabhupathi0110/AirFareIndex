INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'MAA', 'Chennai International Airport', 'Chennai', 'Tamil Nadu', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='MAA')