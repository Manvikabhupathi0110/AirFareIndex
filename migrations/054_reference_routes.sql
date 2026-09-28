INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'MAA-HYD',515 FROM airports a,airports b WHERE a.iata_code='MAA' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='MAA-HYD')