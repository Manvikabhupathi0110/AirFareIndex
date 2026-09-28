INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'PNQ-BLR',725 FROM airports a,airports b WHERE a.iata_code='PNQ' AND b.iata_code='BLR'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='PNQ-BLR')