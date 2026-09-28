INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'Telangana', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='HYD')