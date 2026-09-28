CREATE TABLE airports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code VARCHAR(3) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country VARCHAR(2) NOT NULL DEFAULT 'IN',
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)