INSERT INTO airlines (iata_code, name, icao_code)
SELECT '6E', 'IndiGo', 'IGO'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='6E')