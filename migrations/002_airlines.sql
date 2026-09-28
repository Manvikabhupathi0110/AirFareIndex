CREATE TABLE airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code VARCHAR(3) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icao_code VARCHAR(4),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)