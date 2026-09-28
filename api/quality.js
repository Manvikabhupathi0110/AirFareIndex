import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const [summary, rules, examples, impact] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*)::int AS total_observations,
        COUNT(*) FILTER (WHERE is_valid=true)::int AS valid_observations,
        COUNT(*) FILTER (WHERE is_valid=false)::int AS invalid_observations
      FROM fare_observations
      WHERE source LIKE 'synthetic%'
    `),
    db.query(`
      SELECT rule_code, severity, COUNT(*)::int AS flagged_count
      FROM data_quality_flags
      GROUP BY rule_code, severity
      ORDER BY flagged_count DESC, rule_code
    `),
    db.query(`
      SELECT q.id, q.rule_code, q.severity, q.reason, q.detected_value,
             f.fare_inr, f.source, r.route_code, a.iata_code AS airline_code,
             b.label AS booking_window
      FROM data_quality_flags q
      JOIN fare_observations f ON f.id=q.fare_observation_id
      JOIN routes r ON r.id=f.route_id
      JOIN airlines a ON a.id=f.airline_id
      JOIN booking_windows b ON b.id=f.booking_window_id
      ORDER BY CASE q.severity WHEN 'critical' THEN 1 ELSE 2 END, q.created_at DESC
      LIMIT 30
    `),
    db.query(`
      SELECT
        ROUND(AVG(f.fare_inr)::numeric,2) AS raw_average_fare,
        ROUND(AVG(f.fare_inr) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM data_quality_flags q
            WHERE q.fare_observation_id=f.id
          )
        )::numeric,2) AS cleaned_average_fare,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM data_quality_flags q
            WHERE q.fare_observation_id=f.id
          )
        )::int AS flagged_observations,
        COUNT(*) FILTER (WHERE f.source='synthetic_anomaly_v1')::int AS demo_anomalies
      FROM fare_observations f
      WHERE f.source LIKE 'synthetic%'
    `)
  ]);

  const s=summary.rows[0], i=impact.rows[0];
  const flagged=Number(i.flagged_observations||0);
  const total=Number(s.total_observations||0);
  res.json({
    summary:{
      total_observations:total,
      valid_observations:Number(s.valid_observations||0),
      invalid_observations:Number(s.invalid_observations||0),
      flagged_observations:flagged,
      clean_observations:Math.max(total-flagged,0),
      quality_score: total ? Number(((total-flagged)*100/total).toFixed(2)) : 100
    },
    rule_breakdown:rules.rows,
    examples:examples.rows,
    impact:{
      raw_average_fare:i.raw_average_fare,
      cleaned_average_fare:i.cleaned_average_fare,
      flagged_observations:flagged,
      demo_anomalies:Number(i.demo_anomalies||0),
      index_impact_prevented:true
    }
  });
}