INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'BOM-HYD',620 FROM airports a,airports b WHERE a.iata_code='BOM' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-HYD')