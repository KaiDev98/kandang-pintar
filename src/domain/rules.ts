/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HatchBatch,
  Flock,
  AlertItem,
  FarmSettings,
  VaccinationSchedule,
  FeedLog,
  WaterLog,
  FlockMovement,
} from './types.ts';
import { calculateFlockPopulation, calculateMortalityRate } from './calculations.ts';

/**
 * BR-01: Check if a nest box or hen is already actively brooding in a conflicting date range.
 */
export function checkNestBoxConflict(
  existingBatches: HatchBatch[],
  nestBoxId: string,
  birdId: string,
  startDate: string,
  expectedEndDate: string,
  excludeBatchId?: string
): { hasConflict: boolean; reason?: string } {
  const start = new Date(startDate).getTime();
  const end = new Date(expectedEndDate).getTime();

  for (const b of existingBatches) {
    if (excludeBatchId && b.id === excludeBatchId) continue;
    if (b.status !== 'mengeram') continue; // only active brooding counts

    const bStart = new Date(b.startedOn).getTime();
    const bEnd = new Date(b.expectedHatchOn).getTime();

    // Check interval overlap
    const overlaps = start <= bEnd && end >= bStart;
    if (overlaps) {
      if (b.nestBoxId === nestBoxId) {
        return {
          hasConflict: true,
          reason: `Tempat pengeraman sedang dipakai oleh indukan lain sampai ${b.expectedHatchOn}. Pilih tempat lain atau tunggu selesai.`,
        };
      }
      if (b.birdId === birdId) {
        return {
          hasConflict: true,
          reason: `Induk ini sedang mengeram di tempat lain sampai ${b.expectedHatchOn}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * BR-02 & BR-03: Validate coop occupancy and capacity
 */
export function checkCoopCapacity(
  coopId: string,
  activeFlocksInCoop: Array<{ id: string; alive: number }>,
  capacity: number = 25
): {
  totalBirds: number;
  isOverCapacity: boolean;
  isNearCapacity: boolean; // >= 23
  batchCount: number;
  exceedsBatchLimit: boolean; // > 2 batches
} {
  const totalBirds = activeFlocksInCoop.reduce((acc, f) => acc + f.alive, 0);
  const batchCount = activeFlocksInCoop.length;

  return {
    totalBirds,
    isOverCapacity: totalBirds > capacity,
    isNearCapacity: totalBirds >= Math.max(1, capacity - 2),
    batchCount,
    exceedsBatchLimit: batchCount > 2,
  };
}

/**
 * Alert evaluation engine based on Section 8.10 of PRD
 */
export function evaluateAlerts(state: {
  settings: FarmSettings;
  flocks: Flock[];
  movements: FlockMovement[];
  hatchBatches: HatchBatch[];
  vaccinations: VaccinationSchedule[];
  feedLogs: FeedLog[];
  waterLogs: WaterLog[];
  todayStr: string; // YYYY-MM-DD
  currentTimeWIB?: string; // HH:mm
  hasLoggedToday: boolean;
}): AlertItem[] {
  const alerts: AlertItem[] = [];
  const { settings, flocks, movements, hatchBatches, vaccinations, todayStr } = state;

  const todayTime = new Date(todayStr).getTime();

  // 1. Mortality alert: > 5% in any active batch
  for (const flock of flocks) {
    if (flock.status === 'selesai') continue;
    const flMovements = movements.filter((m) => m.flockId === flock.id);
    const { dead } = calculateFlockPopulation(flock.initialCount, flMovements);
    const mortalityPct = calculateMortalityRate(dead, flock.initialCount);

    if (mortalityPct >= settings.mortalityAlertPct) {
      alerts.push({
        id: `alert-mortality-${flock.id}`,
        rule: 'mortality_high',
        level: 'tindakan',
        title: `Mortalitas Tinggi: ${flock.name}`,
        description: `Kematian mencapai ${mortalityPct}% (${dead} dari ${flock.initialCount} ekor). Periksa kebersihan kandang dan gejala penyakit.`,
        actionText: 'Lihat Batch',
        actionRoute: 'flock_detail',
        actionPayload: { flockId: flock.id },
        createdAt: todayStr,
        isRead: false,
        isResolved: false,
        dedupeKey: `mortality:${flock.id}`,
      });
    }
  }

  // 2. Vaccination due or overdue
  for (const v of vaccinations) {
    if (v.doneOn) continue; // Already done
    const dueTime = new Date(v.dueOn).getTime();
    const flock = flocks.find((f) => f.id === v.flockId);
    const flockName = flock ? flock.name : 'Ayam';

    if (dueTime <= todayTime) {
      alerts.push({
        id: `alert-vax-${v.id}`,
        rule: 'vax_due',
        level: 'tindakan',
        title: `Vaksin Jatuh Tempo: ${v.name}`,
        description: `Jadwal vaksinasi untuk ${flockName} jatuh tempo pada ${v.dueOn}. Segera berikan vaksin untuk mencegah wabah.`,
        actionText: 'Catat Vaksin',
        actionRoute: 'flock_detail',
        actionPayload: { flockId: v.flockId, tab: 'kesehatan' },
        createdAt: todayStr,
        isRead: false,
        isResolved: false,
        dedupeKey: `vax:${v.id}:${v.dueOn}`,
      });
    }
  }

  // 3. Hatch batches: Egg almost hatching (H-3 expected)
  for (const h of hatchBatches) {
    if (h.status !== 'mengeram') continue;
    const expTime = new Date(h.expectedHatchOn).getTime();
    const diffDays = Math.round((expTime - todayTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3 && diffDays >= 0) {
      alerts.push({
        id: `alert-hatch-near-${h.id}`,
        rule: 'hatch_near',
        level: 'perhatian',
        title: `Telur Segera Menetas (${diffDays === 0 ? 'Hari Ini' : `H-${diffDays}`})`,
        description: `Pengeraman oleh indukan mendekati tanggal menetas ${h.expectedHatchOn}. Siapkan wadah air dangkal dan pakan anakan halus.`,
        actionText: 'Catat Hasil Tetas',
        actionRoute: 'hatch_record',
        actionPayload: { hatchId: h.id },
        createdAt: todayStr,
        isRead: false,
        isResolved: false,
        dedupeKey: `hatch:${h.id}:${diffDays}`,
      });
    }
  }

  // 4. Batch approaching harvest (14 days before 90-day target)
  for (const flock of flocks) {
    if (flock.status === 'selesai' || flock.status === 'sebagian_terjual') continue;
    const hatchTime = new Date(flock.hatchedOn).getTime();
    const ageDays = Math.max(0, Math.round((todayTime - hatchTime) / (1000 * 60 * 60 * 24)));
    const daysLeft = flock.targetAgeDays - ageDays;

    if (daysLeft <= 14 && daysLeft > 0) {
      alerts.push({
        id: `alert-harvest-near-${flock.id}`,
        rule: 'harvest_near',
        level: 'perhatian',
        title: `Panen Mendekat: ${flock.name}`,
        description: `Umur ayam ${ageDays} hari, tersisa ${daysLeft} hari menuju target ${flock.targetAgeDays} hari. Lakukan sampling bobot.`,
        actionText: 'Sampling Bobot',
        actionRoute: 'flock_detail',
        actionPayload: { flockId: flock.id, tab: 'pertumbuhan' },
        createdAt: todayStr,
        isRead: false,
        isResolved: false,
        dedupeKey: `harvest_near:${flock.id}`,
      });
    } else if (ageDays >= flock.targetAgeDays) {
      alerts.push({
        id: `alert-ready-sell-${flock.id}`,
        rule: 'ready_sell',
        level: 'info',
        title: `Target Umur Tercapai: ${flock.name}`,
        description: `Ayam telah berumur ${ageDays} hari. Cek bobot dan kesehatan sebelum mulai menjual per ekor.`,
        actionText: 'Jual Ayam',
        actionRoute: 'sales_wizard',
        actionPayload: { flockId: flock.id },
        createdAt: todayStr,
        isRead: false,
        isResolved: false,
        dedupeKey: `ready_sell:${flock.id}`,
      });
    }
  }

  // 5. Daily log reminder (e.g. after 18:00 WIB or when not logged)
  if (!state.hasLoggedToday) {
    alerts.push({
      id: `alert-unlogged-${todayStr}`,
      rule: 'daily_unlogged',
      level: 'perhatian',
      title: 'Catatan Hari Ini Belum Diisi',
      description: 'Pencatatan harian pakan, minum, dan telur menjaga kebiasaan 7 hari dan keakuratan HPP.',
      actionText: 'Catat Sekarang',
      actionRoute: 'quick_log',
      createdAt: todayStr,
      isRead: false,
      isResolved: false,
      dedupeKey: `unlogged:${todayStr}`,
    });
  }

  return alerts;
}
