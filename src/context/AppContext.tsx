/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  FarmSettings,
  Flock,
  FlockMovement,
  EggLog,
  HatchBatch,
  FeedLog,
  WaterLog,
  WeightSample,
  Expense,
  Sale,
  AlertItem,
  QueuedOfflineOp,
  NestBox,
  Coop,
  Bird,
} from '../domain/types.ts';
import { generateSeedData, createCleanProductionState, DEFAULT_SETTINGS, INITIAL_COOPS, INITIAL_NEST_BOXES, INITIAL_BIRDS } from '../domain/mockData.ts';
import { checkNestBoxConflict, evaluateAlerts } from '../domain/rules.ts';
import { calculateFlockPopulation, calculateHatchRate } from '../domain/calculations.ts';

interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'warn' | 'error' | 'info';
  undoAction?: () => void;
}

interface AppContextType {
  state: AppState;
  isOnline: boolean;
  toast: ToastInfo | null;
  showToast: (message: string, undoAction?: () => void, type?: 'success' | 'warn' | 'error' | 'info') => void;
  clearToast: () => void;
  logDaily: (payload: {
    targetId: string; // flockId or 'indukan'
    purKg: number;
    purPriceIdr: number;
    dedakKg: number;
    dedakPriceIdr: number;
    otherFeedKg?: number;
    otherFeedName?: string;
    otherFeedPriceIdr?: number;
    waterChanged: boolean;
    waterLiters?: number;
    waterSupplement?: string;
    eggs?: Array<{ birdId: string; good: number; broken: number; abnormal: number }>;
    deadCount: number;
    deadReason?: string;
  }) => Promise<boolean>;
  startBrooding: (payload: {
    birdId: string;
    nestBoxId: string;
    coopTargetId: string;
    startedOn: string;
    eggsSet: number;
    note?: string;
  }) => { success: boolean; error?: string };
  recordHatch: (payload: {
    hatchBatchId: string;
    hatchedCount: number;
    coopId: string;
    flockName: string;
  }) => { success: boolean; error?: string };
  moveToFreeRange: (flockId: string, freeRangeDate: string) => void;
  recountFlock: (flockId: string, foundCount: number, reason: 'lost' | 'dead') => void;
  recordWeightSample: (flockId: string, weightsG: number[], sampledOn: string) => void;
  recordVaccinationDone: (vaxId: string, doneOn: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  createSale: (sale: Omit<Sale, 'id' | 'totalIdr'>) => void;
  closeFlock: (flockId: string) => void;
  updateSettings: (newSettings: Partial<FarmSettings>) => void;
  resetDemoData: () => void;
  resetToCleanProduction: () => void;
  toggleDemoMode: (enabled: boolean) => void;
  dismissAlert: (alertId: string) => void;
  syncOfflineQueue: () => Promise<void>;
  completeOnboarding: (data: { farmName: string; defaultPurPrice: number }) => void;
  addNestBox: (payload: { name: string; note?: string }) => void;
  addCoop: (payload: { name: string; capacity: number; note?: string }) => void;
  addBird: (payload: { code: string; sex: 'jantan' | 'betina'; acquiredOn: string; weightG?: number; note?: string }) => void;
}

const STORAGE_KEY = 'kandang_pintar_state_v2';
const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved data was from demo mode, ensure clean state
        if (!parsed.settings?.isDemoMode) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved state, using clean state:', e);
    }
    return createCleanProductionState();
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }, [state]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung. Menyinkronkan catatan...', undefined, 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sedang offline. Catatan akan disimpan di HP dan dikirim saat online.', undefined, 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback(
    (message: string, undoAction?: () => void, type: 'success' | 'warn' | 'error' | 'info' = 'success') => {
      const id = String(Date.now());
      setToast({ id, message, undoAction, type });
      if (navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3500);
    },
    []
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Today in YYYY-MM-DD (WIB)
  const todayStr = useMemo(() => {
    const d = new Date();
    // Offset for WIB (UTC+7)
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    return wib.toISOString().split('T')[0];
  }, []);

  // Re-evaluate alerts whenever flocks, movements, or logs change
  useEffect(() => {
    const hasLoggedToday = state.completedDates.includes(todayStr);
    const newAlerts = evaluateAlerts({
      settings: state.settings,
      flocks: state.flocks,
      movements: state.movements,
      hatchBatches: state.hatchBatches,
      vaccinations: state.vaccinations,
      feedLogs: state.feedLogs,
      waterLogs: state.waterLogs,
      todayStr,
      hasLoggedToday,
    });

    setState((prev) => ({
      ...prev,
      alerts: newAlerts,
    }));
  }, [state.flocks, state.movements, state.hatchBatches, state.vaccinations, state.completedDates, todayStr, state.settings]);

  // Sync queued offline items to server
  const syncOfflineQueue = useCallback(async () => {
    if (state.offlineQueue.length === 0 || !navigator.onLine) return;
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: state.offlineQueue }),
      });
      if (response.ok) {
        setState((prev) => ({ ...prev, offlineQueue: [] }));
        showToast('Semua catatan offline berhasil disinkronkan ke server ✓');
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  }, [state.offlineQueue, showToast]);

  // Attempt sync when online
  useEffect(() => {
    if (isOnline && state.offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline, state.offlineQueue.length, syncOfflineQueue]);

  // Daily Logging Action (< 30 seconds target)
  const logDaily = useCallback(
    async (payload: {
      targetId: string;
      purKg: number;
      purPriceIdr: number;
      dedakKg: number;
      dedakPriceIdr: number;
      otherFeedKg?: number;
      otherFeedName?: string;
      otherFeedPriceIdr?: number;
      waterChanged: boolean;
      waterLiters?: number;
      waterSupplement?: string;
      eggs?: Array<{ birdId: string; good: number; broken: number; abnormal: number }>;
      deadCount: number;
      deadReason?: string;
    }): Promise<boolean> => {
      const prevState = { ...state };
      const clientOpId = 'op-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const isIndukan = payload.targetId === 'indukan';
      const flockId = isIndukan ? undefined : payload.targetId;

      const newFeedLogs: FeedLog[] = [];
      if (payload.purKg > 0) {
        newFeedLogs.push({
          id: 'feed-pur-' + Date.now(),
          logDate: todayStr,
          flockId,
          feedType: 'pur',
          weightKg: payload.purKg,
          priceIdr: payload.purPriceIdr,
          clientOpId,
        });
      }
      if (payload.dedakKg > 0) {
        newFeedLogs.push({
          id: 'feed-dedak-' + Date.now(),
          logDate: todayStr,
          flockId,
          feedType: 'dedak',
          weightKg: payload.dedakKg,
          priceIdr: payload.dedakPriceIdr,
          clientOpId,
        });
      }
      if (payload.otherFeedKg && payload.otherFeedKg > 0) {
        newFeedLogs.push({
          id: 'feed-other-' + Date.now(),
          logDate: todayStr,
          flockId,
          feedType: 'benih_beras',
          weightKg: payload.otherFeedKg,
          priceIdr: payload.otherFeedPriceIdr || 0,
          clientOpId,
        });
      }

      const newWaterLog: WaterLog = {
        id: 'water-' + Date.now(),
        logDate: todayStr,
        flockId,
        changedAndCleaned: payload.waterChanged,
        liters: payload.waterLiters,
        supplement: payload.waterSupplement,
        clientOpId,
      };

      const newEggLogs: EggLog[] = [];
      if (payload.eggs && payload.eggs.length > 0) {
        for (const egg of payload.eggs) {
          if (egg.good > 0 || egg.broken > 0 || egg.abnormal > 0) {
            newEggLogs.push({
              id: 'egg-' + egg.birdId + '-' + Date.now(),
              birdId: egg.birdId,
              logDate: todayStr,
              good: egg.good,
              broken: egg.broken,
              abnormal: egg.abnormal,
              clientOpId,
            });
          }
        }
      }

      const newMovements: FlockMovement[] = [];
      if (payload.deadCount > 0 && flockId) {
        newMovements.push({
          id: 'mov-dead-' + Date.now(),
          flockId,
          kind: 'dead',
          qty: payload.deadCount,
          occurredOn: todayStr,
          reason: payload.deadReason || 'Kematian harian tercatat',
          refType: 'daily_log',
          clientOpId,
        });
      }

      // Offline queue tracking
      const offlineOp: QueuedOfflineOp = {
        clientOpId,
        type: 'feed',
        payload: { ...payload, logDate: todayStr },
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: 'pending',
      };

      setState((prev) => ({
        ...prev,
        feedLogs: [...prev.feedLogs, ...newFeedLogs],
        waterLogs: [...prev.waterLogs, newWaterLog],
        eggLogs: [...prev.eggLogs, ...newEggLogs],
        movements: [...prev.movements, ...newMovements],
        completedDates: prev.completedDates.includes(todayStr)
          ? prev.completedDates
          : [...prev.completedDates, todayStr],
        offlineQueue: !isOnline ? [...prev.offlineQueue, offlineOp] : prev.offlineQueue,
      }));

      showToast(
        isOnline
          ? 'Catatan harian berhasil disimpan ✓'
          : 'Tersimpan di HP (offline), akan dikirim saat online ✓',
        () => {
          setState(prevState);
          showToast('Catatan berhasil diurungkan', undefined, 'info');
        }
      );

      return true;
    },
    [todayStr, isOnline, showToast, state]
  );

  // Mulai Pengeraman (FR-EGG-02 & BR-01)
  const startBrooding = useCallback(
    (payload: {
      birdId: string;
      nestBoxId: string;
      coopTargetId: string;
      startedOn: string;
      eggsSet: number;
      note?: string;
    }): { success: boolean; error?: string } => {
      const expectedDays = state.settings.broodingDays || 21;
      const start = new Date(payload.startedOn);
      const expectedHatch = new Date(start.getTime() + expectedDays * 24 * 3600000);
      const expectedHatchOn = expectedHatch.toISOString().split('T')[0];

      // BR-01 Check exclusivity
      const conflict = checkNestBoxConflict(
        state.hatchBatches,
        payload.nestBoxId,
        payload.birdId,
        payload.startedOn,
        expectedHatchOn
      );

      if (conflict.hasConflict) {
        return { success: false, error: conflict.reason };
      }

      const newBatch: HatchBatch = {
        id: 'hb-' + Date.now(),
        birdId: payload.birdId,
        nestBoxId: payload.nestBoxId,
        coopTargetId: payload.coopTargetId,
        startedOn: payload.startedOn,
        expectedHatchOn,
        eggsSet: payload.eggsSet,
        status: 'mengeram',
        note: payload.note,
      };

      setState((prev) => ({
        ...prev,
        hatchBatches: [newBatch, ...prev.hatchBatches],
      }));

      showToast(`Pengeraman dimulai! Perkiraan menetas: ${expectedHatchOn}`);
      return { success: true };
    },
    [state.settings.broodingDays, state.hatchBatches, showToast]
  );

  // Hasil Tetas (FR-EGG-04 & FR-FLK-03)
  const recordHatch = useCallback(
    (payload: {
      hatchBatchId: string;
      hatchedCount: number;
      coopId: string;
      flockName: string;
    }): { success: boolean; error?: string } => {
      const hb = state.hatchBatches.find((h) => h.id === payload.hatchBatchId);
      if (!hb) return { success: false, error: 'Data pengeraman tidak ditemukan' };

      const hatchRate = calculateHatchRate(payload.hatchedCount, hb.eggsSet);

      if (payload.hatchedCount === 0) {
        // Failed hatch (BR-Q6)
        setState((prev) => ({
          ...prev,
          hatchBatches: prev.hatchBatches.map((h) =>
            h.id === payload.hatchBatchId
              ? { ...h, status: 'gagal', hatchedCount: 0, closedOn: todayStr }
              : h
          ),
        }));
        showToast('Pengeraman ditutup (0 menetas). Tempat pengeraman kini bebas.', undefined, 'warn');
        return { success: true };
      }

      const newFlockId = 'flock-' + Date.now();
      const newFlock: Flock = {
        id: newFlockId,
        name: payload.flockName || `Batch ${state.flocks.length + 1} (${payload.hatchedCount} ekor)`,
        motherBirdId: hb.birdId,
        hatchBatchId: hb.id,
        coopId: payload.coopId || hb.coopTargetId,
        hatchedOn: todayStr,
        initialCount: payload.hatchedCount,
        phase: 'kandang',
        status: 'aktif',
        targetAgeDays: state.settings.minSellAgeDays || 90,
        targetWeightG: state.settings.minSellWeightG || 1000,
      };

      const inMovement: FlockMovement = {
        id: 'mov-in-' + Date.now(),
        flockId: newFlockId,
        kind: 'in',
        qty: payload.hatchedCount,
        occurredOn: todayStr,
        refType: 'hatch',
        refId: hb.id,
      };

      // Initial standard vaccination template for new flock
      const defaultVax: Array<{ name: string; daysAfterHatch: number }> = [
        { name: 'ND Hitchner B1 (Tetes Mata)', daysAfterHatch: 4 },
        { name: 'Gumboro A (Air Minum)', daysAfterHatch: 14 },
        { name: 'ND Lasota Booster', daysAfterHatch: 28 },
      ];

      const newVaxes = defaultVax.map((v, i) => {
        const dueDate = new Date(new Date(todayStr).getTime() + v.daysAfterHatch * 86400000)
          .toISOString()
          .split('T')[0];
        return {
          id: `vax-${newFlockId}-${i}`,
          flockId: newFlockId,
          name: v.name,
          dueOn: dueDate,
        };
      });

      setState((prev) => ({
        ...prev,
        hatchBatches: prev.hatchBatches.map((h) =>
          h.id === payload.hatchBatchId
            ? { ...h, status: 'menetas', hatchedCount: payload.hatchedCount, closedOn: todayStr, flockId: newFlockId }
            : h
        ),
        flocks: [newFlock, ...prev.flocks],
        movements: [...prev.movements, inMovement],
        vaccinations: [...prev.vaccinations, ...newVaxes],
      }));

      showToast(`Batch baru dibuat! ${payload.hatchedCount} anak ayam menetas (${hatchRate}%)`);
      return { success: true };
    },
    [state.hatchBatches, state.flocks.length, state.settings, todayStr, showToast]
  );

  // Pindah ke Umbaran (FR-FLK-05)
  const moveToFreeRange = useCallback((flockId: string, freeRangeDate: string) => {
    setState((prev) => ({
      ...prev,
      flocks: prev.flocks.map((f) =>
        f.id === flockId ? { ...f, phase: 'umbaran', freeRangeOn: freeRangeDate } : f
      ),
    }));
    showToast('Ayam berhasil dipindah ke fase umbaran! Kandang kini dapat dibersihkan.');
  }, [showToast]);

  // Hitung ulang umbaran mingguan (FR-FLK-08)
  const recountFlock = useCallback(
    (flockId: string, foundCount: number, reason: 'lost' | 'dead') => {
      const flock = state.flocks.find((f) => f.id === flockId);
      if (!flock) return;

      const { alive } = calculateFlockPopulation(
        flock.initialCount,
        state.movements.filter((m) => m.flockId === flockId)
      );

      const diff = alive - foundCount;
      if (diff === 0) {
        showToast('Jumlah ayam sesuai catatan (lengkap) ✓');
        return;
      }

      if (diff > 0) {
        // Less chickens found: recorded as lost or dead
        const movement: FlockMovement = {
          id: 'mov-recount-' + Date.now(),
          flockId,
          kind: reason,
          qty: diff,
          occurredOn: todayStr,
          reason: `Selisih hitung ulang umbaran (${diff} ekor ${reason === 'lost' ? 'hilang' : 'mati'})`,
          refType: 'recount',
        };
        setState((prev) => ({
          ...prev,
          movements: [...prev.movements, movement],
        }));
        showToast(`Hitung ulang tersimpan: ${diff} ekor dicatat sebagai ${reason}.`, undefined, 'warn');
      } else {
        // More chickens found: adjust
        const movement: FlockMovement = {
          id: 'mov-recount-adj-' + Date.now(),
          flockId,
          kind: 'adjust',
          qty: Math.abs(diff),
          occurredOn: todayStr,
          reason: `Koreksi hitung ulang umbaran (+${Math.abs(diff)} ekor ditemukan)`,
          refType: 'recount',
        };
        setState((prev) => ({
          ...prev,
          movements: [...prev.movements, movement],
        }));
        showToast(`Koreksi tersimpan: +${Math.abs(diff)} ekor disesuaikan ✓`);
      }
    },
    [state.flocks, state.movements, todayStr, showToast]
  );

  // Sampling bobot (FR-GRW-01)
  const recordWeightSample = useCallback((flockId: string, weightsG: number[], sampledOn: string) => {
    if (weightsG.length === 0) return;
    const avgG = Math.round(weightsG.reduce((a, b) => a + b, 0) / weightsG.length);

    const newSample: WeightSample = {
      id: 'ws-' + Date.now(),
      flockId,
      sampledOn: sampledOn || todayStr,
      weightsG,
      avgG,
    };

    setState((prev) => ({
      ...prev,
      weightSamples: [newSample, ...prev.weightSamples],
    }));

    showToast(`Sampling tersimpan: rata-rata ${avgG} gram (${weightsG.length} ekor) ✓`);
  }, [todayStr, showToast]);

  // Vaksinasi selesai (FR-HLT-02)
  const recordVaccinationDone = useCallback((vaxId: string, doneOn: string) => {
    setState((prev) => ({
      ...prev,
      vaccinations: prev.vaccinations.map((v) =>
        v.id === vaxId ? { ...v, doneOn: doneOn || todayStr } : v
      ),
    }));
    showToast('Catatan vaksinasi berhasil disimpan ✓');
  }, [todayStr, showToast]);

  // Tambah biaya (FR-CST)
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      ...expense,
    };
    setState((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));
    showToast(`Biaya ${newExp.categoryName} (Rp ${newExp.amountIdr.toLocaleString('id-ID')}) tersimpan ✓`);
  }, [showToast]);

  // Jual ayam per ekor (FR-SAL)
  const createSale = useCallback((sale: Omit<Sale, 'id' | 'totalIdr'>) => {
    const totalItems = sale.items.reduce((sum, item) => sum + item.priceIdr, 0);
    const totalIdr = totalItems + (sale.shippingIdr || 0);

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      ...sale,
      totalIdr,
    };

    // Group sold chickens by flock and record movement
    const flockCountMap: Record<string, number> = {};
    for (const item of sale.items) {
      flockCountMap[item.flockId] = (flockCountMap[item.flockId] || 0) + 1;
    }

    const soldMovements: FlockMovement[] = Object.entries(flockCountMap).map(([fId, qty]) => ({
      id: 'mov-sold-' + fId + '-' + Date.now(),
      flockId: fId,
      kind: 'sold',
      qty,
      occurredOn: sale.soldOn || todayStr,
      refType: 'sale',
      refId: newSale.id,
      reason: `Penjualan per ekor (${sale.customerName || 'Pembeli umum'})`,
    }));

    setState((prev) => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      movements: [...prev.movements, ...soldMovements],
    }));

    showToast(`Penjualan berhasil disimpan! Total Rp ${totalIdr.toLocaleString('id-ID')} (${sale.items.length} ekor) ✓`);
  }, [todayStr, showToast]);

  // Tutup batch (FR-FLK-11)
  const closeFlock = useCallback((flockId: string) => {
    setState((prev) => ({
      ...prev,
      flocks: prev.flocks.map((f) =>
        f.id === flockId ? { ...f, status: 'selesai', closedAt: new Date().toISOString() } : f
      ),
    }));
    showToast('Batch resmi ditutup. Angka laba dan HPP kini dikunci menjadi final.');
  }, [showToast]);

  // Pengaturan
  const updateSettings = useCallback((newSettings: Partial<FarmSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    showToast('Pengaturan peternakan berhasil diperbarui ✓');
  }, [showToast]);

  // Mode Demo & Reset
  const resetDemoData = useCallback(() => {
    const freshData = generateSeedData();
    setState(freshData);
    showToast('Data contoh simulasi berhasil dimuat ✓');
  }, [showToast]);

  const resetToCleanProduction = useCallback(() => {
    const cleanData = createCleanProductionState();
    setState(cleanData);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('kandang_pintar_state_v1');
    } catch (e) {
      console.warn('Failed clearing old storage:', e);
    }
    showToast('Seluruh data operasional dibersihkan. Peternakan siap pakai untuk produksi ✓');
  }, [showToast]);

  const toggleDemoMode = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, isDemoMode: enabled },
    }));
    showToast(enabled ? 'Mode contoh diaktifkan' : 'Mode data asli aktif', undefined, 'info');
  }, [showToast]);

  const dismissAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== alertId),
    }));
  }, []);

  const completeOnboarding = useCallback((data: { farmName: string; defaultPurPrice: number }) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        farmName: data.farmName || prev.settings.farmName,
        defaultPurPriceIdr: data.defaultPurPrice || prev.settings.defaultPurPriceIdr,
      },
      hasCompletedOnboarding: true,
    }));
    showToast('Peternakan Anda siap digunakan! Mulai dengan mencatat harian.');
  }, [showToast]);

  const addNestBox = useCallback((payload: { name: string; note?: string }) => {
    const newBox: NestBox = {
      id: 'box-' + Date.now(),
      name: payload.name.trim(),
      note: payload.note?.trim(),
    };
    setState((prev) => ({
      ...prev,
      nestBoxes: [...prev.nestBoxes, newBox],
    }));
    showToast(`Tempat pengeraman "${newBox.name}" berhasil ditambahkan ✓`);
  }, [showToast]);

  const addCoop = useCallback((payload: { name: string; capacity: number; note?: string }) => {
    const newCoop: Coop = {
      id: 'coop-' + Date.now(),
      name: payload.name.trim(),
      capacity: payload.capacity > 0 ? payload.capacity : 25,
      note: payload.note?.trim(),
    };
    setState((prev) => ({
      ...prev,
      coops: [...prev.coops, newCoop],
    }));
    showToast(`Kandang "${newCoop.name}" (Kapasitas ${newCoop.capacity} ekor) berhasil ditambahkan ✓`);
  }, [showToast]);

  const addBird = useCallback((payload: {
    code: string;
    sex: 'jantan' | 'betina';
    acquiredOn: string;
    weightG?: number;
    note?: string;
  }) => {
    const newBird: Bird = {
      id: 'bird-' + Date.now(),
      code: payload.code.trim(),
      sex: payload.sex,
      status: 'aktif',
      acquiredOn: payload.acquiredOn || todayStr,
      weightG: payload.weightG,
      note: payload.note?.trim(),
    };
    setState((prev) => ({
      ...prev,
      birds: [...prev.birds, newBird],
    }));
    showToast(`Indukan "${newBird.code}" (${newBird.sex === 'jantan' ? 'Jantan' : 'Betina'}) berhasil ditambahkan ✓`);
  }, [todayStr, showToast]);

  return (
    <AppContext.Provider
      value={{
        state,
        isOnline,
        toast,
        showToast,
        clearToast,
        logDaily,
        startBrooding,
        recordHatch,
        moveToFreeRange,
        recountFlock,
        recordWeightSample,
        recordVaccinationDone,
        addExpense,
        createSale,
        closeFlock,
        updateSettings,
        resetDemoData,
        resetToCleanProduction,
        toggleDemoMode,
        dismissAlert,
        syncOfflineQueue,
        completeOnboarding,
        addNestBox,
        addCoop,
        addBird,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
