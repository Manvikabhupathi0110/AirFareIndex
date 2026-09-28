CREATE TABLE IF NOT EXISTS data_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fare_observation_id UUID REFERENCES fare_observations(id) ON DELETE CASCADE,
  rule_code VARCHAR(40) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',
  status VARCHAR(20) NOT NULL DEFAULT 'flagged',
  reason TEXT NOT NULL,
  detected_value NUMERIC,
  threshold_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dq_severity_check CHECK (severity IN ('warning','critical')),
  CONSTRAINT dq_status_check CHECK (status IN ('flagged','reviewed','accepted')),
  UNIQUE (fare_observation_id, rule_code)
)