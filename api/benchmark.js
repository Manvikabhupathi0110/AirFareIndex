import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const [meta, reconstruction, coverage, sensitivity, reference] = await Promise.all([
    db.query(`SELECT benchmark_code, benchmark_name, benchmark_type, reference_source, source_url, methodology, status
               FROM benchmark_runs WHERE benchmark_code='DGCA_AIR_TRAFFIC_REFERENCE'`),
    db.query(`SELECT ROUND(MAX(ABS(i.index_value-c.reconstructed))::numeric,6) AS max_reconstruction_error,
                     ROUND(AVG(ABS(i.index_value-c.reconstructed))::numeric,6) AS mean_reconstruction_error
              FROM airfare_indices i
              JOIN (
                SELECT index_id, SUM(contribution_value) AS reconstructed
                FROM index_contributions GROUP BY index_id
              ) c ON c.index_id=i.id`),
    db.query(`SELECT COUNT(*)::int AS index_days,
                     COUNT(*) FILTER (WHERE c.index_id IS NOT NULL)::int AS traced_days
              FROM airfare_indices i
              LEFT JOIN (SELECT DISTINCT index_id FROM index_contributions) c ON c.index_id=i.id`),
    db.query(`WITH daily AS (
                SELECT i.index_date, i.index_value,
                       SUM(ic.contribution_value) AS reconstructed
                FROM airfare_indices i
                JOIN index_contributions ic ON ic.index_id=i.id
                GROUP BY i.index_date, i.index_value
              ), route_share AS (
                SELECT ic.index_id, ic.route_id,
                       SUM(ic.contribution_value) AS route_contribution
                FROM index_contributions ic GROUP BY ic.index_id, ic.route_id
              )
              SELECT ROUND(MAX(route_contribution / NULLIF(d.reconstructed,0) * 100)::numeric,2) AS max_route_share_pct,
                     ROUND(AVG(route_contribution / NULLIF(d.reconstructed,0) * 100)::numeric,2) AS avg_route_share_pct
              FROM route_share rs JOIN daily d ON d.index_date=(SELECT index_date FROM airfare_indices WHERE id=rs.index_id)`),
    db.query(`SELECT metric_code, metric_name, metric_value, unit, interpretation
              FROM benchmark_results WHERE benchmark_code='DGCA_AIR_TRAFFIC_REFERENCE'
              ORDER BY metric_code`)
  ]);

  const r=reconstruction.rows[0]||{}, c=coverage.rows[0]||{}, s=sensitivity.rows[0]||{};
  res.json({
    benchmark:meta.rows[0]||null,
    backtest:{
      max_reconstruction_error:Number(r.max_reconstruction_error||0),
      mean_reconstruction_error:Number(r.mean_reconstruction_error||0),
      index_days:Number(c.index_days||0),
      traced_days:Number(c.traced_days||0),
      trace_coverage_pct:c.index_days ? Number((c.traced_days*100/c.index_days).toFixed(2)) : 0,
      max_route_share_pct:Number(s.max_route_share_pct||0),
      avg_route_share_pct:Number(s.avg_route_share_pct||0)
    },
    dgca_context:{
      fields:["flights operated","passengers carried","seats available","sector distance"],
      note:"DGCA is used here as an external aviation-activity benchmark framework. The current fare observations are synthetic and no DGCA airfare values are represented as observed fares."
    },
    validation:{
      method:"Dynamic reconstruction from stored route, airline and booking-window contribution rows",
      coverage_status:Number(c.index_days||0)===Number(c.traced_days||0) ? "complete" : "partial"
    }
  });
}