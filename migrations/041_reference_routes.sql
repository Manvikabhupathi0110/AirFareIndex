INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'BOM-MAA',1033 FROM airports a,airports b WHERE a.iata_code='BOM' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-MAA')