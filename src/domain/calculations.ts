/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlockMovement, WeightSample } from './types.ts';

/**
 * BR-10 & Section 11.4: Flock alive population calculated from append-only movement ledger.
 * Populasi aktif = initialCount - (dead + culled + lost + sold) + adjust
 */
export function calculateFlockPopulation(
  initialCount: number,
  movements: FlockMovement[]
): {
  alive: number;
  dead: number;
  culled: number;
  lost: number;
  sold: number;
  adjusted: number;
} {
  let dead = 0;
  let culled = 0;
  let lost = 0;
  let sold = 0;
  let adjusted = 0;

  for (const m of movements) {
    switch (m.kind) {
      case 'dead':
        dead += m.qty;
        break;
      case 'culled':
        culled += m.qty;
        break;
      case 'lost':
        lost += m.qty;
        break;
      case 'sold':
        sold += m.qty;
        break;
      case 'adjust':
        adjusted += m.qty;
        break;
      default:
        break;
    }
  }

  const alive = Math.max(0, initialCount - (dead + culled + lost + sold) + adjusted);

  return { alive, dead, culled, lost, sold, adjusted };
}

/**
 * Mortality rate in percent (%)
 */
export function calculateMortalityRate(deadCount: number, initialCount: number): number {
  if (initialCount <= 0) return 0;
  return Number(((deadCount / initialCount) * 100).toFixed(1));
}

/**
 * Hatch rate in percent (%)
 */
export function calculateHatchRate(hatchedCount: number, eggsSet: number): number {
  if (eggsSet <= 0) return 0;
  return Number(((hatchedCount / eggsSet) * 100).toFixed(1));
}

/**
 * Daily feed cost per bird per day (Rp/ekor/hari)
 */
export function feedCostPerBirdPerDay(feedCostDaily: number, alive: number): number {
  if (alive <= 0) return 0;
  return Math.round(feedCostDaily / alive);
}

/**
 * Total batch cost from components
 */
export function batchCost(input: {
  motherAllocationIdr: number;
  feedCostIdr: number;
  medicineIdr: number;
  allocatedGeneralIdr: number;
  otherIdr: number;
}): number {
  return (
    input.motherAllocationIdr +
    input.feedCostIdr +
    input.medicineIdr +
    input.allocatedGeneralIdr +
    input.otherIdr
  );
}

/**
 * HPP per bird (Rupiah per ekor)
 * Total cost / (sold + alive)
 */
export function hppPerBird(totalCostIdr: number, sold: number, alive: number): number {
  const totalBirds = sold + alive;
  if (totalBirds <= 0) return 0;
  return Math.round(totalCostIdr / totalBirds);
}

/**
 * HPP per kg (Rupiah per kg)
 */
export function hppPerKg(totalCostIdr: number, totalSoldWeightKg: number): number {
  if (totalSoldWeightKg <= 0) return 0;
  return Math.round(totalCostIdr / totalSoldWeightKg);
}

/**
 * Provisional profit (while batch is still active / partly sold)
 * Revenue - (HPP per bird * sold count)
 */
export function provisionalProfit(
  revenueIdr: number,
  hppPerBirdVal: number,
  soldCount: number
): number {
  return Math.round(revenueIdr - hppPerBirdVal * soldCount);
}

/**
 * Final profit once batch is completely closed
 * Revenue - Total batch cost
 */
export function finalProfit(revenueIdr: number, totalCostIdr: number): number {
  return Math.round(revenueIdr - totalCostIdr);
}

/**
 * Profit margin (%) = profit / revenue * 100
 */
export function marginPercent(profitIdr: number, revenueIdr: number): number {
  if (revenueIdr <= 0) return 0;
  return Number(((profitIdr / revenueIdr) * 100).toFixed(1));
}

/**
 * ROI (%) = profit / total cost * 100
 */
export function roiPercent(profitIdr: number, totalCostIdr: number): number {
  if (totalCostIdr <= 0) return 0;
  return Number(((profitIdr / totalCostIdr) * 100).toFixed(1));
}

/**
 * Check if chicken is ready to sell (Layak Jual)
 * BR-08: age >= 3 months (90 days) AND weight > 1000g AND healthy
 */
export function isSellable(
  bird: { ageDays: number; weightG: number; healthy: boolean },
  cfg: { minAgeDays: number; minWeightG: number }
): {
  sellable: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (bird.ageDays < cfg.minAgeDays) {
    reasons.push(`Umur ${bird.ageDays} hari (kurang dari syarat ${cfg.minAgeDays} hari)`);
  }
  if (bird.weightG <= cfg.minWeightG) {
    reasons.push(`Bobot ${bird.weightG}g (belum melewati ${cfg.minWeightG}g)`);
  }
  if (!bird.healthy) {
    reasons.push('Kondisi fisik belum lolos checklist sehat');
  }

  return {
    sellable: reasons.length === 0,
    reasons,
  };
}

/**
 * Average Daily Gain (ADG) from weight samples
 */
export function calculateADG(samples: WeightSample[]): number | null {
  if (samples.length < 2) return null;
  const sorted = [...samples].sort(
    (a, b) => new Date(a.sampledOn).getTime() - new Date(b.sampledOn).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const days = Math.max(
    1,
    Math.round(
      (new Date(last.sampledOn).getTime() - new Date(first.sampledOn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const gain = last.avgG - first.avgG;
  if (gain <= 0 || days <= 0) return null;
  return gain / days; // grams per day
}

/**
 * Estimate date or days remaining to reach 1000g (1 kg)
 */
export function estimateDaysToTarget(
  lastWeightG: number,
  adg: number | null,
  targetWeightG: number = 1000
): number | null {
  if (lastWeightG >= targetWeightG) return 0;
  if (!adg || adg <= 0) return null;
  return Math.ceil((targetWeightG - lastWeightG) / adg);
}

/**
 * Break-even price and target margin suggested price
 */
export function priceCalculator(
  hppVal: number,
  targetMarginPct: number = 25
): {
  breakEvenPrice: number;
  suggestedPrice: number;
} {
  const breakEvenPrice = hppVal;
  // Suggested price = HPP / (1 - margin/100)
  const factor = 1 - targetMarginPct / 100;
  const suggestedPrice = factor > 0 ? Math.round(hppVal / factor) : Math.round(hppVal * 1.3);
  return { breakEvenPrice, suggestedPrice };
}

/**
 * General expenses allocation based on bird-days (ekor-hari)
 */
export function allocateGeneralExpenses(
  generalExpensesIdr: number,
  flocks: Array<{ id: string; birdDays: number }>
): Record<string, number> {
  const totalBirdDays = flocks.reduce((acc, f) => acc + f.birdDays, 0);
  const allocation: Record<string, number> = {};

  if (totalBirdDays <= 0 || generalExpensesIdr <= 0) {
    flocks.forEach((f) => {
      allocation[f.id] = 0;
    });
    return allocation;
  }

  for (const f of flocks) {
    allocation[f.id] = Math.round(generalExpensesIdr * (f.birdDays / totalBirdDays));
  }

  return allocation;
}

/**
 * Mother allocation cost calculation
 * Default: per hatched chick = total mother cost during brooding / hatchedCount
 */
export function calculateMotherCostPerChick(
  totalMotherCostDuringBroodIdr: number,
  hatchedCount: number
): number {
  if (hatchedCount <= 0) return 0;
  return Math.round(totalMotherCostDuringBroodIdr / hatchedCount);
}
