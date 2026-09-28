CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_airport_id UUID NOT NULL REFERENCES airports(id),
  destination_airport_id UUID NOT NULL REFERENCES airports(id),
  route_code VARCHAR(7) NOT NULL UNIQUE,
  distance_km NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routes_different_airports CHECK (origin_airport_id <> destination_airport_id)
)