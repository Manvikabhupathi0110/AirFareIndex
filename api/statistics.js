import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const [metadata, source, monthly, dimensions] = await Promise.all([
    db.query("SELECT * FROM dataset_metadata WHERE dataset_code='SYNTHETIC_AIRFARE_V1'"),
    db.query("SELECT * FROM data_sources WHERE source_code='MOSPI_ESANKHYIKI'"),
    db.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', observed_at),'YYYY-MM') AS reference_month,
             ROUND(AVG(fare_inr)::numeric,2) AS average_fare,
             COUNT(*)::int AS observations,
             COUNT(DISTINCT route_id)::int AS routes
      FROM fare_observations
      WHERE source='synthetic_v1' AND is_valid=true
      GROUP BY DATE_TRUNC('month', observed_at)
      ORDER BY DATE_TRUNC('month', observed_at)
    `),
    db.query(`
      SELECT
        COUNT(DISTINCT route_id)::int AS routes,
        COUNT(DISTINCT airline_id)::int AS airlines,
        COUNT(DISTINCT booking_window_id)::int AS booking_windows,
        COUNT(DISTINCT departure_date)::int AS departure_dates,
        COUNT(*)::int AS observations
      FROM fare_observations
      WHERE source='synthetic_v1'
    `)
  ]);
  res.json({
    dataset: metadata.rows[0] || null,
    reference_source: source.rows[0] || null,
    monthly_series: monthly.rows,
    dimensions: dimensions.rows[0] || null
  });
}