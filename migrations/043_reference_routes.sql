INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'BLR-MAA',290 FROM airports a,airports b WHERE a.iata_code='BLR' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-MAA')