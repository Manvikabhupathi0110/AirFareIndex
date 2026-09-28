import { db } from 'hatchable';

export const access = 'public';
export const methods = ['GET'];

export default async function (req, res) {
  const from = req.query.from || null;
  const to = req.query.to || null;
  const date = req.query.date || null;
  const limit = Math.min(Math.max(Number(req.query.limit || 366), 1), 366);
  let result;
  if (date) {
    result = await db.query(`SELECT index_date,index_value,base_period,base_value,observation_count,route_count,methodology_version FROM airfare_indices WHERE index_date=$1 LIMIT 1`, [date]);
  } else {
    const params=[]; const filters=[];
    if(from){params.push(from);filters.push('index_date >= $'+params.length);}
    if(to){params.push(to);filters.push('index_date <= $'+params.length);}
    result=await db.query(`SELECT index_date,index_value,base_period,base_value,observation_count,route_count,methodology_version FROM airfare_indices ${filters.length?'WHERE '+filters.join(' AND '):''} ORDER BY index_date DESC LIMIT ${limit}`,params);
  }
  if (!result.rows.length) return res.status(404).json({error:'No published index data found for the requested period.'});
  return res.json({
    api_version:'v1',
    index_name:'Indian Airfare Price Index',
    frequency:'daily',
    source_classification:'synthetic_prototype',
    data_status:'published_index',
    count:result.rows.length,
    data:result.rows
  });
}