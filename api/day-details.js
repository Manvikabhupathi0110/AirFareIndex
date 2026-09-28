import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const date = req.query.date;
  if (!date) return res.status(400).json({error:'date is required in YYYY-MM-DD format.'});
  const result = await db.query(`
    SELECT r.route_code, a.iata_code AS airline_code, a.name AS airline_name,
           bw.label AS booking_window, fo.departure_date,
           fo.days_before_departure, ROUND(fo.fare_inr,2) AS fare_inr
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE fo.is_valid=true
      AND fo.source='Google Flights via SerpApi'
      AND fo.departure_date::date=$1
    ORDER BY r.route_code,a.iata_code,bw.min_days_before_departure,fo.departure_date
  `, [date]);
  return res.json({date,observation_count:result.rows.length,rows:result.rows});
}