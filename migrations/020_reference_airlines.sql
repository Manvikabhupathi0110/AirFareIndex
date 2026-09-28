INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'AI', 'Air India', 'AIC'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='AI')