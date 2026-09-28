import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const d=await db.query('SELECT dataset_code,dataset_name,frequency,reference_period_start,reference_period_end,base_period,base_value,geography,currency,observation_unit,source_classification,methodology_version,source_note FROM dataset_metadata ORDER BY created_at DESC LIMIT 1');
  if(!d.rows.length)return res.status(404).json({error:'Dataset metadata not found.'});
  return res.json({api_version:'v1',resource:'dataset_metadata',data:d.rows[0]});
}