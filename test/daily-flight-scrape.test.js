import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDailySearchTargets, buildDailySearchParams } from '../scripts/daily-flight-scrape.js';

test('buildDailySearchTargets includes a rolling 30-day target set ending on the selected date', () => {
  const targets = buildDailySearchTargets('2026-09-26', 5);
  assert.deepEqual(targets, [
    '2026-09-22',
    '2026-09-23',
    '2026-09-24',
    '2026-09-25',
    '2026-09-26'
  ]);
  assert.equal(targets.length, 5);
});

test('buildDailySearchParams builds a valid search query for each route', () => {
  const params = buildDailySearchParams({ origin: 'HYD', destination: 'DEL', date: '2026-09-26' });
  assert.equal(params.origin, 'HYD');
  assert.equal(params.destination, 'DEL');
  assert.equal(params.outbound_date, '2026-09-26');
  assert.equal(params.trip_type, 'one_way');
  assert.equal(params.travel_class, 'economy');
  assert.equal(params.fresh, 'true');
});
