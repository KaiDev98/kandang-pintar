/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateFlockPopulation, calculateMortalityRate } from '../../domain/calculations.ts';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Clock,
  Egg,
  Droplet,
  Utensils,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface HomeViewProps {
  onOpenQuickLog: (flockId?: string) => void;
  onNavigateToFlock: (flockId: string) => void;
  onNavigateToTab: (tab: string, payload?: Record<string, unknown>) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenQuickLog,
  onNavigateToFlock,
  onNavigateToTab,
}) => {
  const { state } = useApp();

  // Get current date string WIB
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const todayStr = wib.toISOString().split('T')[0];
  const hourWIB = wib.getHours();

  const greeting =
    hourWIB < 11
      ? 'Selamat pagi'
      : hourWIB < 15
      ? 'Selamat siang'
      : hourWIB < 18
      ? 'Selamat sore'
      : 'Selamat malam';

  const hasLoggedToday = state.completedDates.includes(todayStr);

  // 7-day streak calculation (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(wib);
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split('T')[0];
    const isToday = dStr === todayStr;
    const isCompleted = state.completedDates.includes(dStr);
    const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];

    return { dateStr: dStr, isToday, isCompleted, dayName };
  });

  // Today's summary stats
  const todayFeedLogs = state.feedLogs.filter((f) => f.logDate === todayStr);
  const todayFeedKg = todayFeedLogs.reduce((sum, f) => sum + f.weightKg, 0);
  const todayFeedCost = todayFeedLogs.reduce((sum, f) => sum + f.priceIdr, 0);

  const todayEggLogs = state.eggLogs.filter((e) => e.logDate === todayStr);
  const todayEggsCount = todayEggLogs.reduce((sum, e) => sum + e.good, 0);

  const todayWaterLog = state.waterLogs.find((w) => w.logDate === todayStr);
  const isWaterDone = todayWaterLog?.changedAndCleaned ?? false;

  // Monthly summary stats
  const currentMonthPrefix = todayStr.substring(0, 7);
  const monthlyExpenses = state.expenses
    .filter((e) => e.spentOn.startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amountIdr, 0);
  const monthlyFeedCost = state.feedLogs
    .filter((f) => f.logDate.startsWith(currentMonthPrefix))
    .reduce((sum, f) => sum + f.priceIdr, 0);
  const totalMonthlyCost = monthlyExpenses + monthlyFeedCost;

  // Active flocks and urgent alerts
  const activeFlocks = state.flocks.filter((f) => f.status !== 'selesai');
  const openAlerts = state.alerts.filter((a) => !a.isResolved);

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1B2B22]">{greeting}, Pak Peternak</h2>
          <p className="text-xs text-[#4F5B52]">
            {wib.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* 1. Habit Card: Jejak 7 Hari & Catat Cepat CTA */}
      <div className="p-5 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasLoggedToday ? (
              <CheckCircle size={22} className="text-[#1E6B47]" />
            ) : (
              <Clock size={22} className="text-[#F2B632]" />
            )}
            <div>
              <h3 className="font-extrabold text-sm text-[#1B2B22]">
                {hasLoggedToday ? 'Catatan hari ini lengkap ✓' : 'Hari ini belum dicatat'}
              </h3>
              <p className="text-xs text-[#4F5B52]">
                {hasLoggedToday
                  ? 'Kebiasaan mencatat harian terjaga dengan baik.'
                  : 'Selesaikan pencatatan rutin dalam waktu di bawah 30 detik.'}
              </p>
            </div>
          </div>
        </div>

        {/* 7 Dots (Jejak 7 Hari) */}
        <div className="bg-[#F1F5EF] p-3 rounded-xl border border-[#D5DED3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {last7Days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    d.isCompleted
                      ? 'bg-[#F2B632] text-[#1B2B22] font-black text-[11px] shadow-2xs'
                      : 'bg-white border-2 border-[#D5DED3]'
                  } ${d.isToday ? 'ring-2 ring-[#1E6B47] ring-offset-1' : ''}`}
                >
                  {d.isCompleted ? '✓' : ''}
                </div>
                <span className="text-[10px] text-[#4F5B52] font-semibold">{d.dayName}</span>
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-[#1E6B47] uppercase tracking-wider pl-2 border-l border-[#D5DED3]">
            Jejak 7 Hari
          </span>
        </div>

        {!hasLoggedToday && (
          <button
            type="button"
            onClick={() => onOpenQuickLog()}
            className="w-full h-12 bg-[#F2B632] hover:bg-[#e6a928] text-[#1B2B22] font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
          >
            <Plus size={18} className="stroke-[3]" /> Catat Sekarang
          </button>
        )}
      </div>

      {/* 2. Peringatan / Perlu Perhatian */}
      {openAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
              Perlu Perhatian ({openAlerts.length})
            </h3>
            <button
              onClick={() => onNavigateToTab('notifikasi')}
              className="text-xs text-[#1E6B47] font-bold hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2">
            {openAlerts.slice(0, 3).map((alert) => {
              const isTindakan = alert.level === 'tindakan';
              return (
                <div
                  key={alert.id}
                  onClick={() => onNavigateToTab(alert.actionRoute || 'beranda', alert.actionPayload)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
                    isTindakan
                      ? 'bg-[#FBE3E0] border-[#B3261E]/40 text-[#9C1C16]'
                      : 'bg-[#FFF4D6] border-[#8A5A00]/40 text-[#8A5A00]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isTindakan ? (
                      <AlertCircle size={20} className="text-[#B3261E] shrink-0" />
                    ) : (
                      <AlertTriangle size={20} className="text-[#8A5A00] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#1B2B22] truncate">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-[#4F5B52] line-clamp-1">{alert.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1E6B47] shrink-0 flex items-center">
                    {alert.actionText || 'Buka'} <ChevronRight size={14} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Ayam: Kartu Batch Aktif */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
            Batch Ayam Aktif ({activeFlocks.length})
          </h3>
          <button
            onClick={() => onNavigateToTab('ayam')}
            className="text-xs text-[#1E6B47] font-bold hover:underline"
          >
            Semua Batch &rsaquo;
          </button>
        </div>

        {activeFlocks.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-[#D5DED3] text-center text-[#4F5B52]">
            <p className="text-sm font-bold text-[#1B2B22]">Belum ada batch ayam aktif.</p>
            <p className="text-xs mt-1">Mulai pengeraman telur dari menu Ayam untuk menghasilkan anakan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeFlocks.map((flock) => {
              const movements = state.movements.filter((m) => m.flockId === flock.id);
              const pop = calculateFlockPopulation(flock.initialCount, movements);
              const mortality = calculateMortalityRate(pop.dead, flock.initialCount);

              const hatchDate = new Date(flock.hatchedOn).getTime();
              const ageDays = Math.max(0, Math.round((wib.getTime() - hatchDate) / 86400000));
              const daysLeft = Math.max(0, flock.targetAgeDays - ageDays);

              const latestSample = state.weightSamples
                .filter((ws) => ws.flockId === flock.id)
                .sort((a, b) => new Date(b.sampledOn).getTime() - new Date(a.sampledOn).getTime())[0];
              const avgWeightKg = latestSample ? (latestSample.avgG / 1000).toFixed(2) : '0.80';

              // Age progress %
              const ageProgressPct = Math.min(100, Math.round((ageDays / flock.targetAgeDays) * 100));

              return (
                <div
                  key={flock.id}
                  onClick={() => onNavigateToFlock(flock.id)}
                  className="p-4 bg-white rounded-2xl border border-[#D5DED3] hover:border-[#1E6B47] transition-all cursor-pointer shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-[#1B2B22]">{flock.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF1E3] text-[#14663A]">
                          ✓ Aman
                        </span>
                      </div>
                      <div className="text-xs text-[#4F5B52] mt-0.5">
                        <strong className="text-[#1B2B22] font-bold">{pop.alive} ekor</strong> &bull; Umur {ageDays} hari &bull; Fase: {flock.phase === 'umbaran' ? 'Umbaran' : 'Kandang'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E6B47] block">
                        {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Siap Jual'}
                      </span>
                      {mortality > 0 && (
                        <span className="text-[10px] text-[#B3261E] font-medium">
                          Mati {mortality}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (Dual Segmen: Umur & Bobot) */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#F1F5EF] h-2.5 rounded-full overflow-hidden border border-[#D5DED3]">
                      <div
                        className="bg-[#1E6B47] h-full rounded-full transition-all duration-500"
                        style={{ width: `${ageProgressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#4F5B52]">
                      <span>Umur {ageDays} dari {flock.targetAgeDays} hari</span>
                      <span className="font-semibold text-[#1B2B22] num">
                        Bobot {avgWeightKg} dari 1.00 kg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Hari Ini (Pakan, Telur, Air) */}
      <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
          Aktivitas Hari Ini
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
            <Utensils size={18} className="mx-auto text-[#1E6B47] mb-1" />
            <div className="text-xs font-bold text-[#1B2B22] num">{todayFeedKg.toFixed(1)} kg</div>
            <div className="text-[10px] text-[#4F5B52]">Rp {todayFeedCost.toLocaleString('id-ID')}</div>
          </div>

          <div className="p-2.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
            <Egg size={18} className="mx-auto text-[#F2B632] mb-1" />
            <div className="text-xs font-bold text-[#1B2B22] num">{todayEggsCount} butir</div>
            <div className="text-[10px] text-[#4F5B52]">Telur Baru</div>
          </div>

          <div className="p-2.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
            <Droplet size={18} className="mx-auto text-[#2F6F9F] mb-1" />
            <div className="text-xs font-bold text-[#1B2B22]">
              {isWaterDone ? 'Sudah ✓' : 'Belum'}
            </div>
            <div className="text-[10px] text-[#4F5B52]">Air &amp; Wadah</div>
          </div>
        </div>
      </div>

      {/* 5. Bulan Ini (Biaya & Proyeksi Laba) */}
      <div className="p-4 bg-[#DDF1E3]/50 rounded-2xl border border-[#1E6B47]/20 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#14663A] uppercase tracking-wider block">
            Bulan Ini
          </span>
          <div className="text-xs text-[#4F5B52] mt-0.5">
            Biaya operasional: <strong className="text-[#1B2B22] num">Rp {totalMonthlyCost.toLocaleString('id-ID')}</strong>
          </div>
          <div className="text-sm font-black text-[#14663A] mt-1 flex items-center gap-1.5">
            <TrendingUp size={16} />
            <span>Proyeksi Laba (Perkiraan): Rp 480.000</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToTab('keuangan')}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#1E6B47]/40 text-xs font-bold text-[#1E6B47] shadow-2xs hover:bg-[#1E6B47] hover:text-white transition-all"
        >
          Keuangan &rsaquo;
        </button>
      </div>
    </div>
  );
};
