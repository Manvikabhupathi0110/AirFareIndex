CREATE TABLE index_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_id UUID NOT NULL REFERENCES airfare_indices(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id),
  airline_id UUID REFERENCES airlines(id),
  booking_window_id UUID REFERENCES booking_windows(id),
  observation_count INTEGER NOT NULL DEFAULT 0,
  route_weight NUMERIC(12,8),
  average_fare NUMERIC(12,2),
  normalized_fare NUMERIC(14,6),
  contribution_value NUMERIC(14,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contribution_count_nonnegative CHECK (observation_count >= 0)
)