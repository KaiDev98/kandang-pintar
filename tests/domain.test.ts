/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateFlockPopulation,
  calculateMortalityRate,
  calculateHatchRate,
  batchCost,
  hppPerBird,
  provisionalProfit,
  finalProfit,
  isSellable,
  priceCalculator,
  allocateGeneralExpenses,
} from '../src/domain/calculations.ts';

import { checkNestBoxConflict, checkCoopCapacity, evaluateAlerts } from '../src/domain/rules.ts';
import { HatchBatch, FlockMovement } from '../src/domain/types.ts';

test('calculateFlockPopulation correctly computes alive and movement sums', () => {
  const movements: FlockMovement[] = [
    { id: '1', flockId: 'f1', kind: 'dead', qty: 2, occurredOn: '2026-10-01' },
    { id: '2', flockId: 'f1', kind: 'lost', qty: 1, occurredOn: '2026-10-05' },
    { id: '3', flockId: 'f1', kind: 'sold', qty: 4, occurredOn: '2026-10-10' },
    { id: '4', flockId: 'f1', kind: 'adjust', qty: -1, occurredOn: '2026-10-12' },
  ];

  const result = calculateFlockPopulation(20, movements);
  // 20 - (2 dead + 0 culled + 1 lost + 4 sold) + (-1 adjust) = 20 - 7 - 1 = 12
  assert.equal(result.alive, 12);
  assert.equal(result.dead, 2);
  assert.equal(result.lost, 1);
  assert.equal(result.sold, 4);
});

test('calculateMortalityRate computes accurate percentages', () => {
  assert.equal(calculateMortalityRate(1, 20), 5.0);
  assert.equal(calculateMortalityRate(2, 20), 10.0);
  assert.equal(calculateMortalityRate(0, 15), 0.0);
});

test('calculateHatchRate computes correct hatch rate', () => {
  assert.equal(calculateHatchRate(12, 14), 85.7);
  assert.equal(calculateHatchRate(10, 10), 100.0);
  assert.equal(calculateHatchRate(0, 12), 0.0);
});

test('batchCost, hppPerBird, and profit calculations match design specification', () => {
  const cost = batchCost({
    motherAllocationIdr: 45000,
    feedCostIdr: 320000,
    medicineIdr: 25000,
    allocatedGeneralIdr: 60000,
    otherIdr: 10000,
  });
  assert.equal(cost, 460000);

  // If 5 sold and 10 still alive = 15 total chickens accounted
  const hpp = hppPerBird(cost, 5, 10);
  // 460000 / 15 = 30666.66... => 30667
  assert.equal(hpp, 30667);

  // Revenue for 5 sold at Rp 70.000 = 350.000
  const provProfit = provisionalProfit(350000, hpp, 5);
  // 350000 - (30667 * 5) = 350000 - 153335 = 196665
  assert.equal(provProfit, 196665);

  // Final profit when all 15 chickens are sold at Rp 70.000 (total revenue 1.050.000)
  const finProfit = finalProfit(1050000, cost);
  assert.equal(finProfit, 590000);
});

test('isSellable checks age >= 90 days, weight > 1000g, and health', () => {
  const cfg = { minAgeDays: 90, minWeightG: 1000 };

  // Chicken meeting all criteria
  const ok = isSellable({ ageDays: 92, weightG: 1100, healthy: true }, cfg);
  assert.equal(ok.sellable, true);
  assert.equal(ok.reasons.length, 0);

  // Chicken too young
  const young = isSellable({ ageDays: 70, weightG: 1100, healthy: true }, cfg);
  assert.equal(young.sellable, false);
  assert.match(young.reasons[0], /kurang dari syarat/);

  // Chicken underweight
  const light = isSellable({ ageDays: 95, weightG: 950, healthy: true }, cfg);
  assert.equal(light.sellable, false);
  assert.match(light.reasons[0], /belum melewati/);

  // Chicken sick
  const sick = isSellable({ ageDays: 95, weightG: 1200, healthy: false }, cfg);
  assert.equal(sick.sellable, false);
  assert.match(sick.reasons[0], /sehat/);
});

test('priceCalculator yields correct break even and suggested price for target margin', () => {
  const hpp = 40000;
  const { breakEvenPrice, suggestedPrice } = priceCalculator(hpp, 25);
  assert.equal(breakEvenPrice, 40000);
  // 40000 / 0.75 = 53333.33 => 53333
  assert.equal(suggestedPrice, 53333);
});

test('allocateGeneralExpenses distributes costs proportional to ekor-hari', () => {
  const allocations = allocateGeneralExpenses(100000, [
    { id: 'batch-1', birdDays: 600 },
    { id: 'batch-2', birdDays: 400 },
  ]);
  assert.equal(allocations['batch-1'], 60000);
  assert.equal(allocations['batch-2'], 40000);
});

test('checkNestBoxConflict enforces BR-01: one hen per nest box', () => {
  const existing: HatchBatch[] = [
    {
      id: 'hb-1',
      birdId: 'hen-1',
      nestBoxId: 'box-1',
      coopTargetId: 'coop-1',
      startedOn: '2026-10-01',
      expectedHatchOn: '2026-10-22',
      eggsSet: 12,
      status: 'mengeram',
    },
  ];

  // Conflicting date on same box
  const conflictBox = checkNestBoxConflict(
    existing,
    'box-1',
    'hen-2',
    '2026-10-10',
    '2026-10-31'
  );
  assert.equal(conflictBox.hasConflict, true);
  assert.match(conflictBox.reason!, /sedang dipakai/);

  // Conflicting date for same hen on different box
  const conflictHen = checkNestBoxConflict(
    existing,
    'box-2',
    'hen-1',
    '2026-10-15',
    '2026-11-05'
  );
  assert.equal(conflictHen.hasConflict, true);
  assert.match(conflictHen.reason!, /sedang mengeram/);

  // Non-conflicting date on box-1 after first hatch completes
  const okTime = checkNestBoxConflict(
    existing,
    'box-1',
    'hen-2',
    '2026-10-25',
    '2026-11-15'
  );
  assert.equal(okTime.hasConflict, false);
});

test('checkCoopCapacity checks 25 bird limit and 2 batch limit', () => {
  const capacityCheck = checkCoopCapacity('coop-1', [
    { id: 'f1', alive: 12 },
    { id: 'f2', alive: 11 },
  ], 25);

  assert.equal(capacityCheck.totalBirds, 23);
  assert.equal(capacityCheck.isNearCapacity, true); // >= 23
  assert.equal(capacityCheck.isOverCapacity, false);
  assert.equal(capacityCheck.exceedsBatchLimit, false);
});
