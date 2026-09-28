CREATE TABLE IF NOT EXISTS benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_code VARCHAR(60) NOT NULL,
  metric_code VARCHAR(60) NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  unit VARCHAR(40),
  interpretation TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (benchmark_code, metric_code)
);

INSERT INTO benchmark_results
  (benchmark_code, metric_code, metric_name, metric_value, unit, interpretation)
VALUES
  ('DGCA_AIR_TRAFFIC_REFERENCE','TRACE_RECON_ERROR','Maximum absolute reconstruction error from contribution rows',0,'index points','A zero value means the stored national index is fully reproducible from its traceability contributions.'),
  ('DGCA_AIR_TRAFFIC_REFERENCE','TRACE_COVERAGE','Index days with contribution records',181,'days','Every published index day has contribution records in the current prototype dataset.')
ON CONFLICT (benchmark_code, metric_code) DO NOTHING;