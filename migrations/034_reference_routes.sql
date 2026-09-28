INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id,b.id,'DEL-BOM',1148 FROM airports a,airports b WHERE a.iata_code='DEL' AND b.iata_code='BOM'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-BOM')