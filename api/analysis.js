import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const route = req.query.route || null;
  const airline = req.query.airline || null;
  const window = req.query.window || null;
  const filters = [];
  const params = [];
  if (route) { params.push(route); filters.push('r.route_code = $' + params.length); }
  if (airline) { params.push(airline); filters.push('a.iata_code = $' + params.length); }
  if (window) { params.push(window); filters.push('bw.code = $' + params.length); }
  const where = filters.length ? ' AND ' + filters.join(' AND ') : '';

  const routeAnalysis = await db.query(
    `SELECT r.route_code, ROUND(AVG(f.fare_inr),2) AS avg_fare,
            ROUND(MIN(f.fare_inr),2) AS min_fare, ROUND(MAX(f.fare_inr),2) AS max_fare,
            COUNT(*) AS observations
     FROM fare_observations f
     JOIN routes r ON r.id=f.route_id
     JOIN airlines a ON a.id=f.airline_id
     JOIN booking_windows bw ON bw.id=f.booking_window_id
     WHERE f.is_valid=true AND f.source='synthetic_v1'${where}
     GROUP BY r.route_code ORDER BY avg_fare DESC`, params);

  const airlineAnalysis = await db.query(
    `SELECT a.iata_code, a.name, ROUND(AVG(f.fare_inr),2) AS avg_fare,
            COUNT(*) AS observations
     FROM fare_observations f
     JOIN airlines a ON a.id=f.airline_id
     JOIN routes r ON r.id=f.route_id
     JOIN booking_windows bw ON bw.id=f.booking_window_id
     WHERE f.is_valid=true AND f.source='synthetic_v1'${where}
     GROUP BY a.iata_code,a.name ORDER BY avg_fare DESC`, params);

  const windowAnalysis = await db.query(
    `SELECT bw.code, bw.label, bw.min_days_before_departure,
            bw.max_days_before_departure, ROUND(AVG(f.fare_inr),2) AS avg_fare,
            COUNT(*) AS observations
     FROM fare_observations f
     JOIN booking_windows bw ON bw.id=f.booking_window_id
     JOIN routes r ON r.id=f.route_id
     JOIN airlines a ON a.id=f.airline_id
     WHERE f.is_valid=true AND f.source='synthetic_v1'${where}
     GROUP BY bw.code,bw.label,bw.min_days_before_departure,bw.max_days_before_departure
     ORDER BY bw.min_days_before_departure`, params);

  const filtersData = await db.query('SELECT DISTINCT r.route_code FROM routes r JOIN fare_observations f ON f.route_id=r.id WHERE f.source=\'synthetic_v1\' ORDER BY r.route_code');
  const airlinesData = await db.query('SELECT DISTINCT a.iata_code,a.name FROM airlines a JOIN fare_observations f ON f.airline_id=a.id WHERE f.source=\'synthetic_v1\' ORDER BY a.iata_code');
  const windowsData = await db.query('SELECT code,label FROM booking_windows ORDER BY min_days_before_departure');

  return res.json({
    filters:{routes:filtersData.rows,airlines:airlinesData.rows,windows:windowsData.rows},
    routeAnalysis:routeAnalysis.rows, airlineAnalysis:airlineAnalysis.rows, windowAnalysis:windowAnalysis.rows
  });
}