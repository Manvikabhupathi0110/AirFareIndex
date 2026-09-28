CREATE TABLE route_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  effective_from DATE NOT NULL,
  effective_to DATE,
  weight NUMERIC(12,8) NOT NULL,
  methodology TEXT NOT NULL DEFAULT 'synthetic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT route_weight_positive CHECK (weight > 0),
  CONSTRAINT route_weight_dates_valid CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  UNIQUE (route_id, effective_from)
)