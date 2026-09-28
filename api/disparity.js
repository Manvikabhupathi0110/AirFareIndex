import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const route = req.query?.route || null;
  const airline = req.query?.airline || null;
  const window = req.query?.window || null;

  const filters = ["fo.source = 'synthetic_v1'", "fo.is_valid = TRUE"];
  const params = [];

  if (route) { params.push(route); filters.push(`r.route_code = $${params.length}`); }
  if (airline) { params.push(airline); filters.push(`a.iata_code = $${params.length}`); }
  if (window) { params.push(window); filters.push(`bw.code = $${params.length}`); }

  const where = filters.join(" AND ");

  const routeQ = await db.query(`
    SELECT r.route_code,
           ROUND(AVG(fo.fare_inr),2) AS avg_fare,
           ROUND(MIN(fo.fare_inr),2) AS min_fare,
           ROUND(MAX(fo.fare_inr),2) AS max_fare,
           COUNT(*)::int AS observations,
           ROUND(((MAX(fo.fare_inr)-MIN(fo.fare_inr))/NULLIF(AVG(fo.fare_inr),0))*100,2) AS spread_pct
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE ${where}
    GROUP BY r.route_code
    ORDER BY spread_pct DESC, r.route_code
  `, params);

  const airlineQ = await db.query(`
    SELECT a.iata_code, a.name,
           ROUND(AVG(fo.fare_inr),2) AS avg_fare,
           ROUND(MIN(fo.fare_inr),2) AS min_fare,
           ROUND(MAX(fo.fare_inr),2) AS max_fare,
           COUNT(*)::int AS observations,
           ROUND(((MAX(fo.fare_inr)-MIN(fo.fare_inr))/NULLIF(AVG(fo.fare_inr),0))*100,2) AS spread_pct
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE ${where}
    GROUP BY a.iata_code, a.name
    ORDER BY avg_fare DESC
  `, params);

  const windowQ = await db.query(`
    SELECT bw.code, bw.label,
           ROUND(AVG(fo.fare_inr),2) AS avg_fare,
           ROUND(MIN(fo.fare_inr),2) AS min_fare,
           ROUND(MAX(fo.fare_inr),2) AS max_fare,
           COUNT(*)::int AS observations,
           ROUND(((MAX(fo.fare_inr)-MIN(fo.fare_inr))/NULLIF(AVG(fo.fare_inr),0))*100,2) AS spread_pct
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE ${where}
    GROUP BY bw.code, bw.label
    ORDER BY MIN(bw.min_days_before_departure)
  `, params);

  const heatQ = await db.query(`
    SELECT r.route_code, bw.code AS booking_window,
           ROUND(AVG(fo.fare_inr),2) AS avg_fare
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE ${where}
    GROUP BY r.route_code, bw.code
    ORDER BY r.route_code, MIN(bw.min_days_before_departure)
  `, params);

  const overallQ = await db.query(`
    SELECT ROUND(AVG(fo.fare_inr),2) AS avg_fare,
           ROUND(MIN(fo.fare_inr),2) AS min_fare,
           ROUND(MAX(fo.fare_inr),2) AS max_fare,
           COUNT(*)::int AS observations
    FROM fare_observations fo
    JOIN routes r ON r.id=fo.route_id
    JOIN airlines a ON a.id=fo.airline_id
    JOIN booking_windows bw ON bw.id=fo.booking_window_id
    WHERE ${where}
  `, params);

  res.json({
    methodology: "Cross-sectional fare disparity on the clean synthetic_v1 feed. Spread = (maximum fare - minimum fare) / average fare × 100 within each dimension.",
    filters: { route, airline, window },
    overall: overallQ.rows[0],
    routeAnalysis: routeQ.rows,
    airlineAnalysis: airlineQ.rows,
    windowAnalysis: windowQ.rows,
    heatmap: heatQ.rows
  });
}