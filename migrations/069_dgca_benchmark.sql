CREATE TABLE IF NOT EXISTS benchmark_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_code VARCHAR(60) UNIQUE NOT NULL,
  benchmark_name TEXT NOT NULL,
  benchmark_type VARCHAR(30) NOT NULL,
  reference_source TEXT NOT NULL,
  source_url TEXT,
  methodology TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'reference_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO benchmark_runs
  (benchmark_code, benchmark_name, benchmark_type, reference_source, source_url, methodology, status)
VALUES
  ('DGCA_AIR_TRAFFIC_REFERENCE',
   'DGCA Domestic Air Traffic Benchmark Framework',
   'external_reference',
   'Directorate General of Civil Aviation (DGCA)',
   'https://www.dgca.gov.in/',
   'Use monthly domestic aviation activity fields such as flights operated, passengers carried, seats available and sector distance as external context for airfare-index validation. No DGCA fare series is assumed.',
   'reference_only')
ON CONFLICT (benchmark_code) DO NOTHING;