INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'IX', 'Air India Express', 'AXB'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='IX')