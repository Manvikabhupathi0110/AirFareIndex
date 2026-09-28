INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'SG', 'SpiceJet', 'SEJ'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='SG')