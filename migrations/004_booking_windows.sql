CREATE TABLE booking_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  min_days_before_departure INTEGER NOT NULL,
  max_days_before_departure INTEGER,
  label TEXT NOT NULL,
  CONSTRAINT booking_window_min_nonnegative CHECK (min_days_before_departure >= 0),
  CONSTRAINT booking_window_range_valid CHECK (
    max_days_before_departure IS NULL OR max_days_before_departure >= min_days_before_departure
  )
)