INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'QP', 'Akasa Air', 'AKJ'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='QP')