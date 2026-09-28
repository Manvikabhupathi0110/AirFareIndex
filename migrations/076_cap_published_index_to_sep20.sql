-- Keep future synthetic fare observations for long booking-window calculations,
-- but publish the airfare index only through the current prototype as-of date.

DELETE FROM index_contributions
WHERE index_id IN (
  SELECT id FROM airfare_indices WHERE index_date > '2026-09-20'
);

DELETE FROM airfare_indices
WHERE index_date > '2026-09-20';

UPDATE dataset_metadata
SET reference_period_end = '2026-09-20',
    source_note = 'Synthetic SIH26056 prototype data. Published index reference period covers 2026-01-30 to 2026-09-20; underlying fare observations extend further to support long booking windows and controlled prototype testing. Not official MoSPI data.'
WHERE dataset_code = 'SYNTHETIC_AIRFARE_V1';

UPDATE benchmark_results
SET metric_value = 234,
    interpretation = 'Every published index day has contribution records in the current prototype dataset.'
WHERE benchmark_code = 'DGCA_AIR_TRAFFIC_REFERENCE'
  AND metric_code = 'TRACE_COVERAGE';