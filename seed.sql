INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '0_3', 0, 3, '0-3 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='0_3');

INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '4_7', 4, 7, '4-7 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='4_7');

INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '8_15', 8, 15, '8-15 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='8_15');

INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '16_30', 16, 30, '16-30 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='16_30');

INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '31_60', 31, 60, '31-60 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='31_60');

INSERT INTO booking_windows (code, min_days_before_departure, max_days_before_departure, label)
SELECT '61_90', 61, 90, '61-90 days'
WHERE NOT EXISTS (SELECT 1 FROM booking_windows WHERE code='61_90');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT '6E', 'IndiGo', 'IGO'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='6E');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'AI', 'Air India', 'AIC'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='AI');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'IX', 'Air India Express', 'AXB'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='IX');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'SG', 'SpiceJet', 'SEJ'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='SG');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'UK', 'Vistara', 'VTI'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='UK');

INSERT INTO airlines (iata_code, name, icao_code)
SELECT 'QP', 'Akasa Air', 'AKJ'
WHERE NOT EXISTS (SELECT 1 FROM airlines WHERE iata_code='QP');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'DEL', 'Indira Gandhi International Airport', 'Delhi', 'Delhi', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='DEL');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'Maharashtra', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='BOM');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'BLR', 'Kempegowda International Airport', 'Bengaluru', 'Karnataka', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='BLR');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'HYD', 'Rajiv Gandhi International Airport', 'Hyderabad', 'Telangana', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='HYD');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'MAA', 'Chennai International Airport', 'Chennai', 'Tamil Nadu', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='MAA');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'West Bengal', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='CCU');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'PNQ', 'Pune Airport', 'Pune', 'Maharashtra', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='PNQ');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'GOI', 'Manohar International Airport', 'Goa', 'Goa', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='GOI');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'AMD', 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'Gujarat', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='AMD');

INSERT INTO airports (iata_code, name, city, state, timezone)
SELECT 'COK', 'Cochin International Airport', 'Kochi', 'Kerala', 'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM airports WHERE iata_code='COK');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-BOM', 1148
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='BOM'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-BOM');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-BLR', 1740
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='BLR'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-BLR');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-HYD', 1255
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-HYD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-MAA', 1760
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-MAA');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-CCU', 1315
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='CCU'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-CCU');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BOM-BLR', 842
FROM airports a, airports b
WHERE a.iata_code='BOM' AND b.iata_code='BLR'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-BLR');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BOM-HYD', 620
FROM airports a, airports b
WHERE a.iata_code='BOM' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-HYD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BOM-MAA', 1033
FROM airports a, airports b
WHERE a.iata_code='BOM' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-MAA');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BLR-HYD', 458
FROM airports a, airports b
WHERE a.iata_code='BLR' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-HYD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BLR-MAA', 290
FROM airports a, airports b
WHERE a.iata_code='BLR' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-MAA');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BLR-CCU', 1560
FROM airports a, airports b
WHERE a.iata_code='BLR' AND b.iata_code='CCU'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-CCU');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'HYD-MAA', 515
FROM airports a, airports b
WHERE a.iata_code='HYD' AND b.iata_code='MAA'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='HYD-MAA');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'HYD-CCU', 1180
FROM airports a, airports b
WHERE a.iata_code='HYD' AND b.iata_code='CCU'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='HYD-CCU');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'MAA-COK', 515
FROM airports a, airports b
WHERE a.iata_code='MAA' AND b.iata_code='COK'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='MAA-COK');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'PNQ-BLR', 725
FROM airports a, airports b
WHERE a.iata_code='PNQ' AND b.iata_code='BLR'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='PNQ-BLR');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BOM-GOI', 435
FROM airports a, airports b
WHERE a.iata_code='BOM' AND b.iata_code='GOI'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-GOI');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'DEL-AMD', 775
FROM airports a, airports b
WHERE a.iata_code='DEL' AND b.iata_code='AMD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='DEL-AMD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BOM-AMD', 440
FROM airports a, airports b
WHERE a.iata_code='BOM' AND b.iata_code='AMD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BOM-AMD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BLR-COK', 365
FROM airports a, airports b
WHERE a.iata_code='BLR' AND b.iata_code='COK'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-COK');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'HYD-BLR', 458
FROM airports a, airports b
WHERE a.iata_code='HYD' AND b.iata_code='BLR'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='HYD-BLR');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'MAA-HYD', 515
FROM airports a, airports b
WHERE a.iata_code='MAA' AND b.iata_code='HYD'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='MAA-HYD');

INSERT INTO routes (origin_airport_id, destination_airport_id, route_code, distance_km)
SELECT a.id, b.id, 'BLR-DEL', 1740
FROM airports a, airports b
WHERE a.iata_code='BLR' AND b.iata_code='DEL'
AND NOT EXISTS (SELECT 1 FROM routes WHERE route_code='BLR-DEL');

INSERT INTO route_weights (route_id, effective_from, weight, methodology)
SELECT id, '2026-01-01', 1.0, 'synthetic_equal_route_weight'
FROM routes r
WHERE NOT EXISTS (
  SELECT 1 FROM route_weights rw
  WHERE rw.route_id=r.id AND rw.effective_from='2026-01-01'
);