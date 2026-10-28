/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, FarmSettings, Coop, NestBox, Bird, Flock, FlockMovement, EggLog, HatchBatch, FeedLog, WaterLog, WeightSample, VaccinationSchedule, Expense, Sale } from './types.ts';

export const DEFAULT_SETTINGS: FarmSettings = {
  farmName: 'Peternakan Berkah Sejahtera',
  minSellAgeDays: 90,
  minSellWeightG: 1000,
  broodingDays: 21,
  coopEmptyMinWeeks: 3,
  coopCapacity: 25,
  referencePriceIdr: 70000,
  defaultPurPriceIdr: 10000,
  mortalityAlertPct: 5,
  isDemoMode: false,
};

export const INITIAL_COOPS: Coop[] = [
  { id: 'coop-1', name: 'Kandang 1 (Anakan & Induk)', capacity: 25, note: 'Dekat pohon mangga' },
  { id: 'coop-2', name: 'Kandang 2 (Pembesaran Awal)', capacity: 25, note: 'Sisi timur' },
];

export const INITIAL_NEST_BOXES: NestBox[] = [
  { id: 'box-1', name: 'Tempat Eram 1', note: 'Sudut kiri kandang utama' },
  { id: 'box-2', name: 'Tempat Eram 2', note: 'Sudut kanan kandang utama' },
];

export const INITIAL_BIRDS: Bird[] = [
  { id: 'bird-j1', code: 'Jantan 1', sex: 'jantan', status: 'aktif', acquiredOn: new Date().toISOString().split('T')[0], weightG: 2200 },
  { id: 'bird-b1', code: 'Betina 1', sex: 'betina', status: 'aktif', acquiredOn: new Date().toISOString().split('T')[0], weightG: 1700 },
  { id: 'bird-b2', code: 'Betina 2', sex: 'betina', status: 'aktif', acquiredOn: new Date().toISOString().split('T')[0], weightG: 1650 },
  { id: 'bird-b3', code: 'Betina 3', sex: 'betina', status: 'aktif', acquiredOn: new Date().toISOString().split('T')[0], weightG: 1800 },
];

export function createCleanProductionState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS, isDemoMode: false },
    coops: [...INITIAL_COOPS],
    nestBoxes: [...INITIAL_NEST_BOXES],
    birds: [...INITIAL_BIRDS],
    flocks: [],
    movements: [],
    eggLogs: [],
    hatchBatches: [],
    feedLogs: [],
    waterLogs: [],
    weightSamples: [],
    healthRecords: [],
    vaccinations: [],
    expenses: [],
    sales: [],
    alerts: [],
    offlineQueue: [],
    completedDates: [],
    hasCompletedOnboarding: false,
  };
}

export function generateSeedData(): AppState {
  const settings = { ...DEFAULT_SETTINGS };
  const coops = [...INITIAL_COOPS];
  const nestBoxes = [...INITIAL_NEST_BOXES];
  const birds = [...INITIAL_BIRDS];

  // Batch A: Hatched 72 days ago (approaching harvest in 18 days), 18 chicks initially
  const batchA: Flock = {
    id: 'flock-a',
    name: 'Batch A (Induk Betina 1)',
    motherBirdId: 'bird-b1',
    hatchBatchId: 'hb-1',
    coopId: 'coop-1',
    hatchedOn: '2026-08-16', // ~72 days ago
    initialCount: 18,
    phase: 'umbaran',
    freeRangeOn: '2026-09-08', // diumbar pada umur 3 minggu
    status: 'aktif',
    targetAgeDays: 90,
    targetWeightG: 1000,
    note: 'Pertumbuhan seragam, aktif di kebun belakang',
  };

  // Batch B: Hatched 24 days ago, 14 chicks, still in coop
  const batchB: Flock = {
    id: 'flock-b',
    name: 'Batch B (Induk Betina 2)',
    motherBirdId: 'bird-b2',
    hatchBatchId: 'hb-2',
    coopId: 'coop-2',
    hatchedOn: '2026-10-03', // ~24 days ago
    initialCount: 14,
    phase: 'kandang',
    status: 'aktif',
    targetAgeDays: 90,
    targetWeightG: 1000,
    note: 'Fase brooding kandang hangat',
  };

  const flocks: Flock[] = [batchA, batchB];

  // Movements: Batch A lost 1 in free range, 1 died early
  const movements: FlockMovement[] = [
    { id: 'mov-1', flockId: 'flock-a', kind: 'in', qty: 18, occurredOn: '2026-08-16', refType: 'hatch' },
    { id: 'mov-2', flockId: 'flock-a', kind: 'dead', qty: 1, occurredOn: '2026-08-25', reason: 'Kedinginan saat hujan', refType: 'daily_log' },
    { id: 'mov-3', flockId: 'flock-a', kind: 'lost', qty: 1, occurredOn: '2026-09-22', reason: 'Tidak kembali saat hitung ulang sore', refType: 'recount' },
    { id: 'mov-4', flockId: 'flock-b', kind: 'in', qty: 14, occurredOn: '2026-10-03', refType: 'hatch' },
  ];

  // Hatch Batches
  const hatchBatches: HatchBatch[] = [
    {
      id: 'hb-1',
      birdId: 'bird-b1',
      nestBoxId: 'box-1',
      coopTargetId: 'coop-1',
      startedOn: '2026-07-26',
      expectedHatchOn: '2026-08-16',
      eggsSet: 20,
      hatchedCount: 18,
      closedOn: '2026-08-16',
      status: 'menetas',
      flockId: 'flock-a',
    },
    {
      id: 'hb-2',
      birdId: 'bird-b2',
      nestBoxId: 'box-2',
      coopTargetId: 'coop-2',
      startedOn: '2026-09-12',
      expectedHatchOn: '2026-10-03',
      eggsSet: 15,
      hatchedCount: 14,
      closedOn: '2026-10-03',
      status: 'menetas',
      flockId: 'flock-b',
    },
    {
      id: 'hb-3',
      birdId: 'bird-b3',
      nestBoxId: 'box-1',
      coopTargetId: 'coop-1',
      startedOn: '2026-10-10',
      expectedHatchOn: '2026-10-31',
      eggsSet: 14,
      status: 'mengeram',
      note: 'Sedang mengeram erat, telur utuh',
    },
  ];

  // Egg Logs for yesterday and today
  const eggLogs: EggLog[] = [
    { id: 'el-1', birdId: 'bird-b1', logDate: '2026-10-25', good: 1, broken: 0, abnormal: 0 },
    { id: 'el-2', birdId: 'bird-b2', logDate: '2026-10-25', good: 1, broken: 0, abnormal: 0 },
    { id: 'el-3', birdId: 'bird-b1', logDate: '2026-10-26', good: 1, broken: 0, abnormal: 0 },
  ];

  // Feed logs
  const feedLogs: FeedLog[] = [
    { id: 'feed-1', logDate: '2026-10-25', flockId: 'flock-a', feedType: 'pur', weightKg: 0.8, priceIdr: 8000 },
    { id: 'feed-2', logDate: '2026-10-25', flockId: 'flock-a', feedType: 'dedak', weightKg: 0.8, priceIdr: 0 },
    { id: 'feed-3', logDate: '2026-10-25', flockId: 'flock-b', feedType: 'pur', weightKg: 0.4, priceIdr: 4000 },
    { id: 'feed-4', logDate: '2026-10-26', flockId: 'flock-a', feedType: 'pur', weightKg: 0.8, priceIdr: 8000 },
    { id: 'feed-5', logDate: '2026-10-26', flockId: 'flock-a', feedType: 'dedak', weightKg: 0.8, priceIdr: 0 },
  ];

  // Water logs
  const waterLogs: WaterLog[] = [
    { id: 'wl-1', logDate: '2026-10-25', flockId: 'flock-a', changedAndCleaned: true, liters: 3, supplement: 'Vitachick' },
    { id: 'wl-2', logDate: '2026-10-26', flockId: 'flock-a', changedAndCleaned: true, liters: 3 },
  ];

  // Weight samples for Batch A
  const weightSamples: WeightSample[] = [
    { id: 'ws-1', flockId: 'flock-a', sampledOn: '2026-09-25', weightsG: [450, 480, 500, 470, 490], avgG: 478 },
    { id: 'ws-2', flockId: 'flock-a', sampledOn: '2026-10-10', weightsG: [680, 710, 700, 690, 720], avgG: 700 },
    { id: 'ws-3', flockId: 'flock-a', sampledOn: '2026-10-24', weightsG: [810, 840, 820, 830, 850], avgG: 830 },
  ];

  // Health records & vaccinations
  const healthRecords = [
    {
      id: 'hr-1',
      flockId: 'flock-a',
      recordedOn: '2026-09-02',
      symptoms: 'Nafsu makan menurun sedikit setelah hujan',
      medication: 'Air jahe & kunyit + Vitachick',
      outcome: 'Ayam kembali lincah dalam 2 hari',
    },
  ];

  const vaccinations: VaccinationSchedule[] = [
    { id: 'vax-1', flockId: 'flock-a', name: 'ND Hitchner B1 (Tetes Mata)', dueOn: '2026-08-20', doneOn: '2026-08-20' },
    { id: 'vax-2', flockId: 'flock-a', name: 'Gumboro A (Air Minum)', dueOn: '2026-08-30', doneOn: '2026-08-30' },
    { id: 'vax-3', flockId: 'flock-a', name: 'ND Lasota Booster', dueOn: '2026-10-28' }, // Due tomorrow / today!
    { id: 'vax-4', flockId: 'flock-b', name: 'ND Hitchner B1 (Tetes Mata)', dueOn: '2026-10-07', doneOn: '2026-10-07' },
    { id: 'vax-5', flockId: 'flock-b', name: 'Gumboro A (Air Minum)', dueOn: '2026-10-17', doneOn: '2026-10-17' },
  ];

  // Expenses
  const expenses: Expense[] = [
    { id: 'exp-1', categoryId: 'pakan', categoryName: 'Pakan Pur Starter 511 (50kg)', amountIdr: 450000, spentOn: '2026-08-10', allocation: 'general', note: 'Karung pakan awal' },
    { id: 'exp-2', categoryId: 'obat_vitamin', categoryName: 'Vitachick & Neobro', amountIdr: 45000, spentOn: '2026-08-15', allocation: 'direct', flockId: 'flock-a' },
    { id: 'exp-3', categoryId: 'vaksin', categoryName: 'Vaksin ND & Gumboro Medion', amountIdr: 65000, spentOn: '2026-08-18', allocation: 'general' },
    { id: 'exp-4', categoryId: 'listrik', categoryName: 'Listrik Pemanas Lampu Bohlam', amountIdr: 50000, spentOn: '2026-09-01', allocation: 'general' },
  ];

  // Sales (0 so far in Batch A, ready for first sale)
  const sales: Sale[] = [];

  // Completed log dates for 7-day streak
  const completedDates = [
    '2026-10-21',
    '2026-10-22',
    '2026-10-23',
    '2026-10-24',
    '2026-10-25',
    '2026-10-26',
  ];

  return {
    settings,
    coops,
    nestBoxes,
    birds,
    flocks,
    movements,
    eggLogs,
    hatchBatches,
    feedLogs,
    waterLogs,
    weightSamples,
    healthRecords,
    vaccinations,
    expenses,
    sales,
    alerts: [],
    offlineQueue: [],
    completedDates,
    hasCompletedOnboarding: true,
  };
}
