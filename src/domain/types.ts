/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FarmSettings {
  farmName: string;
  minSellAgeDays: number;     // default 90 days (3 months)
  minSellWeightG: number;     // default 1000g (1 kg)
  broodingDays: number;       // default 21 days
  coopEmptyMinWeeks: number;  // default 3 weeks
  coopCapacity: number;       // default 25 birds
  referencePriceIdr: number;  // default Rp 70.000
  defaultPurPriceIdr: number; // default Rp 10.000 / kg
  mortalityAlertPct: number;  // default 5%
  isDemoMode: boolean;
}

export interface Coop {
  id: string;
  name: string;
  capacity: number; // default 25
  note?: string;
}

export interface NestBox {
  id: string;
  name: string;
  note?: string;
}

export type BirdSex = 'jantan' | 'betina';
export type BirdStatus = 'aktif' | 'afkir' | 'mati' | 'terjual';

export interface Bird {
  id: string;
  code: string; // e.g. "Jantan 1", "Betina 1", "Betina 2", "Betina 3"
  sex: BirdSex;
  status: BirdStatus;
  acquiredOn: string; // YYYY-MM-DD
  weightG?: number;
  note?: string;
}

export type FlockPhase = 'kandang' | 'umbaran';
export type FlockStatus = 'aktif' | 'siap_jual' | 'sebagian_terjual' | 'selesai';

export interface Flock {
  id: string;
  name: string; // e.g. "Batch A (Betina 1)"
  motherBirdId: string;
  hatchBatchId?: string;
  coopId: string;
  hatchedOn: string; // YYYY-MM-DD
  initialCount: number;
  phase: FlockPhase;
  freeRangeOn?: string; // YYYY-MM-DD
  status: FlockStatus;
  targetAgeDays: number; // default 90
  targetWeightG: number; // default 1000
  closedAt?: string; // ISO date
  note?: string;
}

export type MovementKind = 'in' | 'dead' | 'culled' | 'lost' | 'sold' | 'moved' | 'adjust';

export interface FlockMovement {
  id: string;
  flockId: string;
  kind: MovementKind;
  qty: number; // Positive; adjust can be positive or negative
  occurredOn: string; // YYYY-MM-DD
  reason?: string;
  refType?: 'hatch' | 'sale' | 'recount' | 'daily_log' | 'manual';
  refId?: string;
  clientOpId?: string;
}

export interface EggLog {
  id: string;
  birdId: string;
  logDate: string; // YYYY-MM-DD
  good: number;
  broken: number;
  abnormal: number;
  clientOpId?: string;
}

export type HatchStatus = 'mengeram' | 'menetas' | 'gagal' | 'batal';

export interface HatchBatch {
  id: string;
  birdId: string;
  nestBoxId: string;
  coopTargetId: string;
  startedOn: string; // YYYY-MM-DD
  expectedHatchOn: string; // YYYY-MM-DD
  eggsSet: number;
  hatchedCount?: number;
  closedOn?: string; // YYYY-MM-DD
  status: HatchStatus;
  flockId?: string;
  note?: string;
}

export interface FeedLog {
  id: string;
  logDate: string; // YYYY-MM-DD
  flockId?: string;
  birdId?: string;
  feedType: 'pur' | 'dedak' | 'benih_beras' | 'lainnya';
  weightKg: number;
  priceIdr: number;
  clientOpId?: string;
}

export interface WaterLog {
  id: string;
  logDate: string; // YYYY-MM-DD
  flockId?: string;
  birdId?: string;
  changedAndCleaned: boolean;
  liters?: number;
  supplement?: string; // Vitamin, elektrolit
  clientOpId?: string;
}

export interface WeightSample {
  id: string;
  flockId: string;
  sampledOn: string; // YYYY-MM-DD
  weightsG: number[];
  avgG: number;
}

export interface HealthRecord {
  id: string;
  flockId?: string;
  birdId?: string;
  recordedOn: string; // YYYY-MM-DD
  symptoms: string;
  medication?: string;
  dose?: string;
  outcome?: string;
  isUrgent?: boolean;
}

export interface VaccinationSchedule {
  id: string;
  flockId: string;
  name: string; // ND/IB, Gumboro, dll.
  dueOn: string; // YYYY-MM-DD
  doneOn?: string; // YYYY-MM-DD
  notes?: string;
}

export type ExpenseCategory =
  | 'pakan'
  | 'obat_vitamin'
  | 'vaksin'
  | 'listrik'
  | 'air'
  | 'tenaga_kerja'
  | 'peralatan'
  | 'perbaikan_kandang'
  | 'transportasi'
  | 'indukan'
  | 'lain_lain';

export interface Expense {
  id: string;
  categoryId: ExpenseCategory;
  categoryName: string;
  flockId?: string; // If direct batch expense
  amountIdr: number;
  spentOn: string; // YYYY-MM-DD
  allocation: 'direct' | 'general';
  note?: string;
  receiptPhotoUrl?: string;
}

export interface SaleItem {
  id: string;
  flockId: string;
  weightG: number;
  priceIdr: number;
  healthyChecked: boolean;
}

export interface Sale {
  id: string;
  soldOn: string; // YYYY-MM-DD
  customerName?: string;
  items: SaleItem[];
  shippingIdr: number;
  paid: boolean;
  paidOn?: string;
  totalIdr: number;
  note?: string;
}

export type AlertLevel = 'tindakan' | 'perhatian' | 'info';

export interface AlertItem {
  id: string;
  rule: string;
  level: AlertLevel;
  title: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
  actionPayload?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
  isResolved: boolean;
  dedupeKey: string;
}

export interface QueuedOfflineOp {
  clientOpId: string;
  type: 'feed' | 'water' | 'egg' | 'death';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
}

export interface AppState {
  settings: FarmSettings;
  coops: Coop[];
  nestBoxes: NestBox[];
  birds: Bird[];
  flocks: Flock[];
  movements: FlockMovement[];
  eggLogs: EggLog[];
  hatchBatches: HatchBatch[];
  feedLogs: FeedLog[];
  waterLogs: WaterLog[];
  weightSamples: WeightSample[];
  healthRecords: HealthRecord[];
  vaccinations: VaccinationSchedule[];
  expenses: Expense[];
  sales: Sale[];
  alerts: AlertItem[];
  offlineQueue: QueuedOfflineOp[];
  completedDates: string[]; // Set of YYYY-MM-DD when daily logs were entered
  hasCompletedOnboarding: boolean;
}
