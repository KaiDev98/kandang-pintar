/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  calculateFlockPopulation,
  calculateMortalityRate,
  batchCost,
  hppPerBird,
  provisionalProfit,
  finalProfit,
  calculateADG,
  estimateDaysToTarget,
  feedCostPerBirdPerDay,
} from '../../domain/calculations.ts';
import {
  ChevronLeft,
  Calendar,
  Home as HomeIcon,
  Plus,
  Scale,
  RefreshCw,
  Skull,
  Lock,
  CheckCircle,
  AlertTriangle,
  HeartPulse,
  DollarSign,
  Utensils,
  TrendingUp,
} from 'lucide-react';

import { AddNestBoxModal } from '../modals/AddNestBoxModal.tsx';
import { AddCoopModal } from '../modals/AddCoopModal.tsx';
import { AddBirdModal } from '../modals/AddBirdModal.tsx';

interface FlockViewProps {
  initialFlockId?: string;
  onOpenQuickLog: (flockId?: string) => void;
  onOpenStartBrooding: () => void;
  onOpenRecordHatch: (hatchId?: string) => void;
  onOpenRecount: (flockId: string) => void;
  onOpenWeightSample: (flockId: string) => void;
  onOpenSalesWizard: (flockId: string) => void;
}

export const FlockView: React.FC<FlockViewProps> = ({
  initialFlockId,
  onOpenQuickLog,
  onOpenStartBrooding,
  onOpenRecordHatch,
  onOpenRecount,
  onOpenWeightSample,
  onOpenSalesWizard,
}) => {
  const { state, moveToFreeRange, closeFlock, recordVaccinationDone } = useApp();

  const [selectedFlockId, setSelectedFlockId] = useState<string | null>(initialFlockId || null);
  const [subView, setSubView] = useState<'batches' | 'coops' | 'calendar'>('batches');
  const [batchFilter, setBatchFilter] = useState<'aktif' | 'siap_jual' | 'selesai'>('aktif');
  const [detailTab, setDetailTab] = useState<'ringkasan' | 'pertumbuhan' | 'pakan' | 'kesehatan' | 'keuangan'>('ringkasan');

  // Modals for adding nest box, coop, and bird
  const [isAddNestBoxOpen, setIsAddNestBoxOpen] = useState<boolean>(false);
  const [isAddCoopOpen, setIsAddCoopOpen] = useState<boolean>(false);
  const [isAddBirdOpen, setIsAddBirdOpen] = useState<boolean>(false);

  // Currently selected flock object
  const currentFlock = state.flocks.find((f) => f.id === selectedFlockId);

  // Filtered flocks
  const filteredFlocks = state.flocks.filter((f) => {
    if (batchFilter === 'aktif') return f.status === 'aktif';
    if (batchFilter === 'siap_jual') return f.status === 'siap_jual';
    return f.status === 'selesai';
  });

  // If a flock is selected, render flock detail view
  if (currentFlock) {
    const movements = state.movements.filter((m) => m.flockId === currentFlock.id);
    const pop = calculateFlockPopulation(currentFlock.initialCount, movements);
    const mortality = calculateMortalityRate(pop.dead, currentFlock.initialCount);

    const hatchDate = new Date(currentFlock.hatchedOn).getTime();
    const ageDays = Math.max(0, Math.round((Date.now() - hatchDate) / 86400000));
    const daysLeft = Math.max(0, currentFlock.targetAgeDays - ageDays);

    // Weights & ADG
    const flockSamples = state.weightSamples
      .filter((ws) => ws.flockId === currentFlock.id)
      .sort((a, b) => new Date(a.sampledOn).getTime() - new Date(b.sampledOn).getTime());
    const latestSample = flockSamples[flockSamples.length - 1];
    const adg = calculateADG(flockSamples);
    const estDaysTo1Kg = estimateDaysToTarget(latestSample?.avgG || 700, adg, 1000);

    // Feed stats
    const flockFeeds = state.feedLogs.filter((f) => f.flockId === currentFlock.id);
    const totalFeedKg = flockFeeds.reduce((sum, f) => sum + f.weightKg, 0);
    const totalFeedCost = flockFeeds.reduce((sum, f) => sum + f.priceIdr, 0);
    const feedPerDayCost = feedCostPerBirdPerDay(totalFeedCost / Math.max(1, ageDays), pop.alive);

    // Expenses & HPP
    const flockExpenses = state.expenses.filter((e) => e.flockId === currentFlock.id);
    const directExpCost = flockExpenses.reduce((sum, e) => sum + e.amountIdr, 0);

    const totalCost = batchCost({
      motherAllocationIdr: 45000,
      feedCostIdr: totalFeedCost,
      medicineIdr: 25000,
      allocatedGeneralIdr: 40000,
      otherIdr: directExpCost,
    });

    const hpp = hppPerBird(totalCost, pop.sold, pop.alive);

    // Sales
    const flockSales = state.sales.filter((s) => s.items.some((it) => it.flockId === currentFlock.id));
    const totalRevenue = flockSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((it) => it.flockId === currentFlock.id)
          .reduce((itemSum, it) => itemSum + it.priceIdr, 0),
      0
    );

    const profit =
      currentFlock.status === 'selesai'
        ? finalProfit(totalRevenue, totalCost)
        : provisionalProfit(totalRevenue, hpp, pop.sold);

    // Vaccinations
    const flockVaxes = state.vaccinations.filter((v) => v.flockId === currentFlock.id);

    return (
      <div className="space-y-4 pb-12">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedFlockId(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1E6B47] hover:underline"
          >
            <ChevronLeft size={18} /> Kembali ke Daftar Batch
          </button>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              currentFlock.status === 'selesai'
                ? 'bg-[#F1F5EF] text-[#4F5B52]'
                : 'bg-[#DDF1E3] text-[#14663A]'
            }`}
          >
            {currentFlock.status === 'selesai' ? 'Batch Selesai (Dikunci)' : 'Batch Aktif'}
          </span>
        </div>

        {/* Batch Hero Card */}
        <div className="p-5 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-[#1B2B22]">{currentFlock.name}</h2>
              <p className="text-xs text-[#4F5B52]">
                Menetas {currentFlock.hatchedOn} &bull; Umur {ageDays} hari
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#1B2B22] num">{pop.alive}</span>
              <span className="text-xs text-[#4F5B52] block">ekor hidup</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D5DED3] text-center text-xs">
            <div>
              <span className="text-[#4F5B52] block text-[10px]">Fase</span>
              <strong className="text-[#1B2B22] capitalize font-bold">
                {currentFlock.phase === 'umbaran' ? 'Umbaran' : 'Kandang'}
              </strong>
            </div>
            <div>
              <span className="text-[#4F5B52] block text-[10px]">Mortalitas</span>
              <strong
                className={`font-bold ${mortality > 5 ? 'text-[#B3261E]' : 'text-[#1E6B47]'}`}
              >
                {mortality}% ({pop.dead} ekor)
              </strong>
            </div>
            <div>
              <span className="text-[#4F5B52] block text-[10px]">Bobot Rerata</span>
              <strong className="text-[#1B2B22] font-bold num">
                {latestSample ? `${latestSample.avgG}g` : '830g'}
              </strong>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="flex border-b border-[#D5DED3] overflow-x-auto gap-2 text-xs font-bold no-scrollbar">
          {[
            { id: 'ringkasan', label: 'Ringkasan' },
            { id: 'pertumbuhan', label: 'Pertumbuhan' },
            { id: 'pakan', label: 'Pakan' },
            { id: 'kesehatan', label: 'Kesehatan' },
            { id: 'keuangan', label: 'Biaya & Laba' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id as typeof detailTab)}
              className={`py-2 px-3 border-b-2 whitespace-nowrap transition-all ${
                detailTab === tab.id
                  ? 'border-[#1E6B47] text-[#1E6B47]'
                  : 'border-transparent text-[#4F5B52] hover:text-[#1B2B22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Ringkasan */}
        {detailTab === 'ringkasan' && (
          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {currentFlock.phase === 'kandang' ? (
                <button
                  type="button"
                  onClick={() =>
                    moveToFreeRange(currentFlock.id, new Date().toISOString().split('T')[0])
                  }
                  className="p-3 bg-[#DDF1E3] hover:bg-[#c9e8d2] text-[#14663A] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <HomeIcon size={16} /> Pindah ke Umbaran
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenRecount(currentFlock.id)}
                  className="p-3 bg-[#FFF4D6] hover:bg-[#fae6b8] text-[#8A5A00] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={16} /> Hitung Ulang Umbaran
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenWeightSample(currentFlock.id)}
                className="p-3 bg-[#F1F5EF] hover:bg-[#e4ece1] text-[#1B2B22] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Scale size={16} /> Timbang Sampel
              </button>

              <button
                type="button"
                onClick={() => onOpenQuickLog(currentFlock.id)}
                className="p-3 bg-[#F2B632] hover:bg-[#e5a828] text-[#1B2B22] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={16} /> Catat Harian Batch
              </button>

              <button
                type="button"
                onClick={() => onOpenSalesWizard(currentFlock.id)}
                className="p-3 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
              >
                <DollarSign size={16} /> Jual Ayam Batch Ini
              </button>
            </div>

            {/* Harvest readiness check */}
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-2">
              <h4 className="text-xs font-bold text-[#4F5B52] uppercase">Progres Menuju Panen</h4>
              <div className="w-full bg-[#F1F5EF] h-3 rounded-full overflow-hidden border border-[#D5DED3]">
                <div
                  className="bg-[#1E6B47] h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((ageDays / currentFlock.targetAgeDays) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#4F5B52]">
                <span>Umur {ageDays} / {currentFlock.targetAgeDays} hari</span>
                <span>{daysLeft > 0 ? `${daysLeft} hari lagi` : 'Target umur tercapai'}</span>
              </div>
            </div>

            {/* Lock / Close batch action */}
            {currentFlock.status !== 'selesai' && (
              <div className="p-3.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#1B2B22] block">Tutup Siklus Batch</span>
                  <span className="text-[11px] text-[#4F5B52]">Kunci laba dan HPP final</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Tutup batch ini dan kunci angka laba/HPP menjadi final?')) {
                      closeFlock(currentFlock.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#B3261E]/40 text-[#B3261E] hover:bg-[#FBE3E0] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Lock size={14} /> Tutup Batch
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pertumbuhan */}
        {detailTab === 'pertumbuhan' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-[#1B2B22]">Kurva Pertumbuhan Bobot</h4>
                <button
                  type="button"
                  onClick={() => onOpenWeightSample(currentFlock.id)}
                  className="px-3 py-1 bg-[#1E6B47] text-white rounded-lg text-xs font-bold"
                >
                  + Timbang Baru
                </button>
              </div>

              {flockSamples.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#4F5B52]">
                  Belum ada sampling timbang. Masukkan 5-10 sampel bobot untuk menghitung ADG dan estimasi panen.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
                      <span className="text-[10px] text-[#4F5B52] block">Pertambahan Bobot (ADG)</span>
                      <strong className="text-base font-black text-[#1E6B47] num">
                        {adg ? `${adg.toFixed(1)} g/hari` : 'Belum cukup data'}
                      </strong>
                    </div>
                    <div className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
                      <span className="text-[10px] text-[#4F5B52] block">Estimasi Menembus 1 kg</span>
                      <strong className="text-base font-black text-[#1E6B47] num">
                        {estDaysTo1Kg !== null ? `${estDaysTo1Kg} hari lagi` : 'Tercapai'}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-[#4F5B52] uppercase">Riwayat Sampling</span>
                    {flockSamples.map((s) => (
                      <div
                        key={s.id}
                        className="flex justify-between items-center p-2.5 bg-[#F1F5EF] rounded-xl text-xs"
                      >
                        <span className="font-semibold text-[#1B2B22]">{s.sampledOn}</span>
                        <span className="text-[#4F5B52]">{s.weightsG.length} sampel</span>
                        <strong className="font-bold text-[#1E6B47] num">{s.avgG} gram</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Pakan */}
        {detailTab === 'pakan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] text-center">
                <span className="text-xs text-[#4F5B52] block">Total Konsumsi Pakan</span>
                <span className="text-xl font-black text-[#1B2B22] num">{totalFeedKg.toFixed(1)} kg</span>
                <span className="text-[11px] text-[#1E6B47] block mt-0.5">
                  Rp {totalFeedCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] text-center">
                <span className="text-xs text-[#4F5B52] block">Biaya Pakan/Ekor/Hari</span>
                <span className="text-xl font-black text-[#1E6B47] num">Rp {feedPerDayCost}</span>
                <span className="text-[10px] text-[#4F5B52] block mt-0.5">berdasarkan populasi aktif</span>
              </div>
            </div>

            <div className="p-4 bg-[#FFF4D6] rounded-2xl border border-[#8A5A00]/30 space-y-1">
              <span className="text-xs font-bold text-[#8A5A00]">
                Efisiensi Pakan (FCR Perkiraan): ~2.4
              </span>
              <p className="text-[11px] text-[#8A5A00] leading-relaxed">
                Di fase umbaran, ayam mencari pakan alami tambahan di kebun, sehingga angka efisiensi diberi label "perkiraan".
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Kesehatan */}
        {detailTab === 'kesehatan' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-3">
              <h4 className="font-bold text-sm text-[#1B2B22]">Jadwal Vaksinasi Batch</h4>
              <div className="space-y-2">
                {flockVaxes.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#1B2B22] block">{v.name}</span>
                      <span className="text-[11px] text-[#4F5B52]">
                        Jatuh Tempo: {v.dueOn} {v.doneOn ? `&bull; Selesai: ${v.doneOn}` : ''}
                      </span>
                    </div>
                    {v.doneOn ? (
                      <span className="text-xs font-bold text-[#14663A] bg-[#DDF1E3] px-2 py-0.5 rounded-full">
                        ✓ Selesai
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          recordVaccinationDone(v.id, new Date().toISOString().split('T')[0])
                        }
                        className="px-2.5 py-1 bg-[#1E6B47] text-white rounded-lg text-xs font-bold"
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Biaya & Laba HPP */}
        {detailTab === 'keuangan' && (
          <div className="space-y-4">
            <div className="p-5 bg-[#1E6B47] text-white rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                Modal per Ekor (HPP)
              </span>
              <div className="text-3xl font-black num">Rp {hpp.toLocaleString('id-ID')}</div>
              <p className="text-xs text-white/90">
                Total Biaya Batch: Rp {totalCost.toLocaleString('id-ID')} dibagi {pop.sold + pop.alive} ekor ayam
              </p>
            </div>

            {/* Laba */}
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#4F5B52]">
                  {currentFlock.status === 'selesai' ? 'Laba Final' : 'Laba Sementara (Perkiraan)'}
                </span>
                <span className="text-base font-black text-[#1E6B47] num">
                  Rp {profit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#4F5B52]">
                <span>Pendapatan Terjual ({pop.sold} ekor):</span>
                <span className="font-bold text-[#1B2B22] num">Rp {totalRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Breakdown Biaya */}
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-2.5">
              <h4 className="text-xs font-bold text-[#4F5B52] uppercase">Komposisi Biaya Batch</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Pakan Pur &amp; Dedak:</span>
                  <span className="font-bold text-[#1B2B22] num">Rp {totalFeedCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Alokasi Biaya Indukan Masa Tetas:</span>
                  <span className="font-bold text-[#1B2B22] num">Rp 45.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Obat, Vitamin, &amp; Vaksin:</span>
                  <span className="font-bold text-[#1B2B22] num">Rp 25.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Alokasi Umum (Listrik/Air Ekor-Hari):</span>
                  <span className="font-bold text-[#1B2B22] num">Rp 40.000</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#D5DED3] font-bold">
                  <span className="text-[#1B2B22]">Total Modal Batch:</span>
                  <span className="text-[#1E6B47] num">Rp {totalCost.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render main Flock list view
  return (
    <div className="space-y-5 pb-12">
      {/* Top Navigation Shortcuts */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSubView('batches')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
            subView === 'batches'
              ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
              : 'bg-white text-[#1B2B22] border-[#D5DED3]'
          }`}
        >
          Daftar Batch
        </button>
        <button
          type="button"
          onClick={() => setSubView('coops')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
            subView === 'coops'
              ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
              : 'bg-white text-[#1B2B22] border-[#D5DED3]'
          }`}
        >
          Indukan &amp; Kandang
        </button>
        <button
          type="button"
          onClick={() => setSubView('calendar')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
            subView === 'calendar'
              ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
              : 'bg-white text-[#1B2B22] border-[#D5DED3]'
          }`}
        >
          Kalender Siklus
        </button>
      </div>

      {/* Subview 1: Daftar Batch */}
      {subView === 'batches' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex gap-2">
            {[
              { id: 'aktif', label: 'Aktif' },
              { id: 'siap_jual', label: 'Siap Jual' },
              { id: 'selesai', label: 'Selesai' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBatchFilter(f.id as typeof batchFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  batchFilter === f.id
                    ? 'bg-[#1B2B22] text-white'
                    : 'bg-[#F1F5EF] text-[#4F5B52] hover:text-[#1B2B22]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Flock Cards */}
          <div className="space-y-3">
            {filteredFlocks.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#D5DED3] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#DDF1E3] text-[#14663A] flex items-center justify-center mx-auto text-xl">
                  🐣
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1B2B22]">
                    Belum ada batch ayam {batchFilter === 'aktif' ? 'aktif' : batchFilter === 'siap_jual' ? 'siap jual' : 'selesai'}
                  </h4>
                  <p className="text-xs text-[#4F5B52] mt-1 max-w-sm mx-auto">
                    Mulai siklus baru dengan mengeramkan telur di tab &quot;Indukan &amp; Kandang&quot; atau catat hasil penetasan setelah telur menetas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubView('coops')}
                  className="px-4 py-2 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Buka Indukan &amp; Kandang
                </button>
              </div>
            ) : (
              filteredFlocks.map((flock) => {
                const movements = state.movements.filter((m) => m.flockId === flock.id);
                const pop = calculateFlockPopulation(flock.initialCount, movements);
                const hatchTime = new Date(flock.hatchedOn).getTime();
                const ageDays = Math.max(0, Math.round((Date.now() - hatchTime) / 86400000));
                const daysLeft = Math.max(0, flock.targetAgeDays - ageDays);

                return (
                  <div
                    key={flock.id}
                    onClick={() => setSelectedFlockId(flock.id)}
                    className="p-4 bg-white rounded-2xl border border-[#D5DED3] hover:border-[#1E6B47] transition-all cursor-pointer shadow-xs space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-base text-[#1B2B22]">{flock.name}</h4>
                        <p className="text-xs text-[#4F5B52]">
                          {pop.alive} ekor &bull; Umur {ageDays} hari &bull; Fase:{' '}
                          {flock.phase === 'umbaran' ? 'Umbaran' : 'Kandang'}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#1E6B47]">
                        {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Siap Jual'}
                      </span>
                    </div>
                    <div className="w-full bg-[#F1F5EF] h-2 rounded-full overflow-hidden border border-[#D5DED3]">
                      <div
                        className="bg-[#1E6B47] h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((ageDays / flock.targetAgeDays) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Subview 2: Indukan dan Kandang */}
      {subView === 'coops' && (
        <div className="space-y-6">
          {/* Section 1: Tempat Pengeraman */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
                  Tempat Pengeraman (Nest Box &bull; {state.nestBoxes.length} Unit)
                </h3>
                <p className="text-[11px] text-[#4F5B52]">1 tempat pengeraman untuk 1 induk mengeram</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddNestBoxOpen(true)}
                  className="px-2.5 py-1.5 bg-white hover:bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3] rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Plus size={14} /> Tambah Tempat Eram
                </button>
                <button
                  type="button"
                  onClick={onOpenStartBrooding}
                  className="px-3 py-1.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Plus size={14} /> Mulai Pengeraman
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.nestBoxes.map((nb) => {
                const activeBrood = state.hatchBatches.find(
                  (h) => h.nestBoxId === nb.id && h.status === 'mengeram'
                );
                const broodingHen = state.birds.find((b) => b.id === activeBrood?.birdId);

                return (
                  <div
                    key={nb.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      activeBrood
                        ? 'bg-[#FFF4D6] border-[#8A5A00]/40'
                        : 'bg-white border-[#D5DED3]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-[#1B2B22]">{nb.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeBrood
                            ? 'bg-[#8A5A00] text-white'
                            : 'bg-[#DDF1E3] text-[#14663A]'
                        }`}
                      >
                        {activeBrood ? 'Sedang Terpakai' : 'Bebas'}
                      </span>
                    </div>

                    {nb.note && (
                      <p className="text-[11px] text-[#4F5B52] italic mb-1">
                        {nb.note}
                      </p>
                    )}

                    {activeBrood ? (
                      <div className="text-xs text-[#4F5B52] space-y-1 mt-2 pt-2 border-t border-[#8A5A00]/20">
                        <p>
                          Dierami oleh: <strong className="text-[#1B2B22]">{broodingHen?.code}</strong>
                        </p>
                        <p>Jumlah telur: <strong className="text-[#1B2B22]">{activeBrood.eggsSet} butir</strong></p>
                        <p className="text-[#8A5A00] font-semibold">
                          Perkiraan menetas: {activeBrood.expectedHatchOn}
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenRecordHatch(activeBrood.id)}
                          className="mt-2 w-full py-1.5 bg-[#1E6B47] text-white text-xs font-bold rounded-lg hover:bg-[#165538] transition-colors"
                        >
                          Catat Hasil Tetas
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#4F5B52] mt-2">
                        Siap digunakan untuk pengeraman berikutnya.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Kandang Pembesaran */}
          <div className="space-y-3 pt-3 border-t border-[#D5DED3]">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
                  Kandang Pembesaran ({state.coops.length} Unit)
                </h3>
                <p className="text-[11px] text-[#4F5B52]">Kapasitas dan status keterisian</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCoopOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3] rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus size={14} /> Tambah Kandang
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.coops.map((coop) => {
                const flocksInCoop = state.flocks.filter(
                  (f) => f.coopId === coop.id && f.phase === 'kandang' && f.status !== 'selesai'
                );
                const birdsCount = flocksInCoop.reduce((sum, f) => {
                  const m = state.movements.filter((mov) => mov.flockId === f.id);
                  return sum + calculateFlockPopulation(f.initialCount, m).alive;
                }, 0);

                const isOver = birdsCount > coop.capacity;
                const isNear = birdsCount >= coop.capacity - 2 && birdsCount <= coop.capacity;

                return (
                  <div key={coop.id} className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-[#1B2B22]">{coop.name}</h4>
                      <span className={`text-xs font-bold num px-2 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-[#FBE3E0] text-[#9C1C16]'
                          : isNear
                          ? 'bg-[#FFF4D6] text-[#8A5A00]'
                          : 'bg-[#DDF1E3] text-[#14663A]'
                      }`}>
                        {birdsCount} / {coop.capacity} ekor
                      </span>
                    </div>

                    {coop.note && (
                      <p className="text-[11px] text-[#4F5B52] italic">
                        {coop.note}
                      </p>
                    )}

                    <div className="text-xs text-[#4F5B52] pt-1">
                      {flocksInCoop.length > 0 ? (
                        <span>Terisi oleh: <strong className="text-[#1B2B22]">{flocksInCoop.map((f) => f.name).join(', ')}</strong></span>
                      ) : (
                        <span className="text-[#14663A] font-semibold">Kandang kosong / bersih</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Indukan (Ayam Dewasa / Breeders) */}
          <div className="space-y-3 pt-3 border-t border-[#D5DED3]">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold text-[#4F5B52] uppercase tracking-wider">
                  Indukan (Ayam Dewasa &bull; {state.birds.length} Ekor)
                </h3>
                <p className="text-[11px] text-[#4F5B52]">
                  {state.birds.filter((b) => b.sex === 'betina').length} Betina &bull;{' '}
                  {state.birds.filter((b) => b.sex === 'jantan').length} Jantan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBirdOpen(true)}
                className="px-3 py-1.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus size={14} /> Tambah Indukan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.birds.map((bird) => {
                const isHen = bird.sex === 'betina';
                const isBrooding = state.hatchBatches.some(
                  (h) => h.birdId === bird.id && h.status === 'mengeram'
                );
                const eggCount = state.eggLogs
                  .filter((e) => e.birdId === bird.id)
                  .reduce((sum, e) => sum + e.good, 0);

                return (
                  <div
                    key={bird.id}
                    className="p-3.5 bg-white rounded-2xl border border-[#D5DED3] space-y-2 hover:border-[#1E6B47] transition-all shadow-2xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{isHen ? '🐔' : '🐓'}</span>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#1B2B22]">{bird.code}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isHen ? 'bg-[#DDF1E3] text-[#14663A]' : 'bg-[#E3EFFB] text-[#2F6F9F]'
                            }`}
                          >
                            {isHen ? 'Betina (Induk)' : 'Jantan (Pejantan)'}
                          </span>
                        </div>
                      </div>
                      <div>
                        {isBrooding ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF4D6] text-[#8A5A00]">
                            Sedang Mengeram
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDF1E3] text-[#14663A]">
                            ✓ Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs text-[#4F5B52] pt-1.5 border-t border-[#D5DED3]">
                      <div>
                        Bobot:{' '}
                        <strong className="text-[#1B2B22] font-semibold num">
                          {bird.weightG ? `${bird.weightG}g` : '-'}
                        </strong>
                      </div>
                      <div>
                        Masuk:{' '}
                        <strong className="text-[#1B2B22] font-semibold">{bird.acquiredOn}</strong>
                      </div>
                      {isHen && (
                        <div className="col-span-2 text-[11px] text-[#1E6B47] font-semibold">
                          Total telur dicatat: {eggCount} butir
                        </div>
                      )}
                      {bird.note && (
                        <div className="col-span-2 text-[11px] text-[#4F5B52] italic">
                          {bird.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subview 3: Kalender Siklus */}
      {subView === 'calendar' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-3">
            <h3 className="font-extrabold text-sm text-[#1B2B22] flex items-center gap-2">
              <Calendar size={18} className="text-[#1E6B47]" /> Garis Waktu Siklus Peternakan
            </h3>
            <p className="text-xs text-[#4F5B52]">
              Jadwal masa eram, menetas, umbaran, dan perkiraan panen ayam kampung.
            </p>

            <div className="space-y-3 pt-2">
              {state.flocks.map((flock) => {
                const hatchDate = new Date(flock.hatchedOn);
                const freeRangeDate = flock.freeRangeOn || 'Belum diumbar';
                const harvestDate = new Date(hatchDate.getTime() + flock.targetAgeDays * 86400000)
                  .toISOString()
                  .split('T')[0];

                return (
                  <div key={flock.id} className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] text-xs space-y-1">
                    <div className="font-bold text-[#1B2B22]">{flock.name}</div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-[#4F5B52] pt-1">
                      <div>
                        Menetas: <strong>{flock.hatchedOn}</strong>
                      </div>
                      <div>
                        Umbaran: <strong>{freeRangeDate}</strong>
                      </div>
                      <div>
                        Panen: <strong>{harvestDate}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals for Indukan & Kandang */}
      <AddNestBoxModal
        isOpen={isAddNestBoxOpen}
        onClose={() => setIsAddNestBoxOpen(false)}
      />
      <AddCoopModal
        isOpen={isAddCoopOpen}
        onClose={() => setIsAddCoopOpen(false)}
      />
      <AddBirdModal
        isOpen={isAddBirdOpen}
        onClose={() => setIsAddBirdOpen(false)}
      />
    </div>
  );
};
