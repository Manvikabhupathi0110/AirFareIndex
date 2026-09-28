import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

function normalizeDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value.split('T')[0] : value;
    return normalized.slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export default async function (req, res) {
  const requestedDate = req.query.date;
  const latest = await db.query(`
    SELECT id,index_date::date AS index_date,index_value,observation_count,route_count
    FROM airfare_indices
    WHERE index_date >= CURRENT_DATE - INTERVAL '29 days'
    ORDER BY index_date DESC LIMIT 1
  `);
  const trendRows = await db.query(`
    SELECT index_date::date AS index_date,index_value,observation_count,route_count
    FROM airfare_indices
    WHERE index_date >= CURRENT_DATE - INTERVAL '29 days'
    ORDER BY index_date
  `);
  const trend = trendRows.rows.map((row) => ({
    ...row,
    index_date: normalizeDateOnly(row.index_date)
  }));
  const selected = requestedDate
    ? (trend.find((row) => normalizeDateOnly(row.index_date) === normalizeDateOnly(requestedDate)) || (trend.length ? trend[trend.length - 1] : null))
    : (latest.rows[0] ? { ...latest.rows[0], index_date: normalizeDateOnly(latest.rows[0].index_date) } : (trend.length ? trend[trend.length - 1] : null));

  if (!selected) return res.status(404).json({error:'No index data available for the last 30 days.'});

  const previous = trend.filter((row) => row.index_date < selected.index_date).slice(-1)[0] || null;
  const contributions = await db.query(`
    SELECT c.route_id,r.route_code,c.airline_id,a.iata_code AS airline_code,a.name AS airline_name,c.booking_window_id,
    bw.code AS booking_window,bw.label AS booking_window_label,c.observation_count,ROUND(c.average_fare,2) AS average_fare,
    ROUND(c.normalized_fare,4) AS normalized_fare,ROUND(c.contribution_value,4) AS contribution_value
    FROM index_contributions c
    JOIN routes r ON r.id=c.route_id
    JOIN airlines a ON a.id=c.airline_id
    JOIN booking_windows bw ON bw.id=c.booking_window_id
    WHERE c.index_id=(SELECT id FROM airfare_indices WHERE index_date::date=$1 LIMIT 1)
    ORDER BY c.contribution_value DESC
  `,[selected.index_date]);
  const routeSummary = await db.query(`SELECT r.route_code,ROUND(SUM(c.contribution_value),4) AS contribution,ROUND(SUM(c.contribution_value)*100/NULLIF((SELECT index_value FROM airfare_indices WHERE index_date::date=$1),0),2) AS contribution_share_pct FROM index_contributions c JOIN routes r ON r.id=c.route_id WHERE c.index_id=(SELECT id FROM airfare_indices WHERE index_date::date=$1 LIMIT 1) GROUP BY r.route_code ORDER BY contribution DESC LIMIT 10`,[selected.index_date]);
  const airlineSummary = await db.query(`SELECT a.iata_code,a.name,ROUND(SUM(c.contribution_value),4) AS contribution,ROUND(SUM(c.contribution_value)*100/NULLIF((SELECT index_value FROM airfare_indices WHERE index_date::date=$1),0),2) AS contribution_share_pct FROM index_contributions c JOIN airlines a ON a.id=c.airline_id WHERE c.index_id=(SELECT id FROM airfare_indices WHERE index_date::date=$1 LIMIT 1) GROUP BY a.iata_code,a.name ORDER BY contribution DESC`,[selected.index_date]);
  const windowSummary = await db.query(`SELECT bw.code,bw.label,ROUND(SUM(c.contribution_value),4) AS contribution,ROUND(SUM(c.contribution_value)*100/NULLIF((SELECT index_value FROM airfare_indices WHERE index_date::date=$1),0),2) AS contribution_share_pct FROM index_contributions c JOIN booking_windows bw ON bw.id=c.booking_window_id WHERE c.index_id=(SELECT id FROM airfare_indices WHERE index_date::date=$1 LIMIT 1) GROUP BY bw.code,bw.label ORDER BY contribution DESC`,[selected.index_date]);
  const previousIndex=previous||null;
  const indexChange=previousIndex ? Number(selected.index_value)-Number(previousIndex.index_value) : 0;
  const contributionSum=contributions.rows.reduce((s,row)=>s+Number(row.contribution_value),0);
  return res.json({
    index: selected,
    previous_index:previousIndex,
    index_change:Number(indexChange.toFixed(4)),
    contribution_sum:Number(contributionSum.toFixed(4)),
    contribution_gap:Number((Number(selected.index_value)-contributionSum).toFixed(4)),
    trace_count:contributions.rows.length,
    trend,
    contributions:contributions.rows,
    routeSummary:routeSummary.rows,
    airlineSummary:airlineSummary.rows,
    windowSummary:windowSummary.rows
  });
}