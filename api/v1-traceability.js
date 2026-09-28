import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const date = req.query.date;
  if (!date) return res.status(400).json({error:'date is required in YYYY-MM-DD format.'});
  const index = await db.query('SELECT id,index_date,index_value,base_period,base_value FROM airfare_indices WHERE index_date=$1 LIMIT 1',[date]);
  if(!index.rows.length) return res.status(404).json({error:'No published index found for the requested date.'});
  const rows=await db.query(`SELECT r.route_code,a.iata_code AS airline_code,a.name AS airline_name,bw.code AS booking_window,bw.label AS booking_window_label,c.observation_count,ROUND(c.average_fare,2) AS average_fare,ROUND(c.normalized_fare,4) AS normalized_fare,ROUND(c.contribution_value,4) AS contribution_value,ROUND(c.contribution_value*100/NULLIF(i.index_value,0),2) AS contribution_share_pct FROM index_contributions c JOIN routes r ON r.id=c.route_id JOIN airlines a ON a.id=c.airline_id JOIN booking_windows bw ON bw.id=c.booking_window_id JOIN airfare_indices i ON i.id=c.index_id WHERE c.index_id=$1 ORDER BY c.contribution_value DESC`,[index.rows[0].id]);
  const sum=rows.rows.reduce((s,r)=>s+Number(r.contribution_value),0);
  return res.json({api_version:'v1',resource:'index_traceability',date:index.rows[0].index_date,index:index.rows[0],trace_count:rows.rows.length,contribution_sum:Number(sum.toFixed(4)),contribution_gap:Number((Number(index.rows[0].index_value)-sum).toFixed(4)),data:rows.rows});
}