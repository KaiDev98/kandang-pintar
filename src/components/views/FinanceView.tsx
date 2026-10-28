/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  calculateFlockPopulation,
  batchCost,
  hppPerBird,
  provisionalProfit,
  finalProfit,
  marginPercent,
  roiPercent,
  priceCalculator,
} from '../../domain/calculations.ts';
import {
  DollarSign,
  Plus,
  TrendingUp,
  Receipt,
  Scale,
  CreditCard,
  Calculator,
} from 'lucide-react';

interface FinanceViewProps {
  onOpenSalesWizard: (flockId?: string) => void;
  onOpenExpenseModal: (flockId?: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  onOpenSalesWizard,
  onOpenExpenseModal,
}) => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'penjualan' | 'biaya' | 'laba'>('ringkasan');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(state.flocks[0]?.id || '');
  const [targetMargin, setTargetMargin] = useState<number>(25);

  // Financial aggregates
  const totalSalesRevenue = state.sales.reduce((sum, s) => sum + s.totalIdr, 0);
  const totalFeedExpense = state.feedLogs.reduce((sum, f) => sum + f.priceIdr, 0);
  const totalOtherExpenses = state.expenses.reduce((sum, e) => sum + e.amountIdr, 0);
  const totalExpenses = totalFeedExpense + totalOtherExpenses;
  const netCashflow = totalSalesRevenue - totalExpenses;

  // Receivables (Piutang)
  const unpaidSales = state.sales.filter((s) => !s.paid);
  const totalReceivables = unpaidSales.reduce((sum, s) => sum + s.totalIdr, 0);

  // Batch calculation for Laba tab
  const selectedFlock = state.flocks.find((f) => f.id === selectedBatchId);
  const batchMovements = state.movements.filter((m) => m.flockId === selectedBatchId);
  const pop = selectedFlock
    ? calculateFlockPopulation(selectedFlock.initialCount, batchMovements)
    : { alive: 0, sold: 0, dead: 0 };

  const batchFeedLogs = state.feedLogs.filter((f) => f.flockId === selectedBatchId);
  const batchFeedCost = batchFeedLogs.reduce((sum, f) => sum + f.priceIdr, 0);
  const batchDirectExp = state.expenses
    .filter((e) => e.flockId === selectedBatchId)
    .reduce((sum, e) => sum + e.amountIdr, 0);

  const totalCost = batchCost({
    motherAllocationIdr: 45000,
    feedCostIdr: batchFeedCost,
    medicineIdr: 25000,
    allocatedGeneralIdr: 40000,
    otherIdr: batchDirectExp,
  });

  const hpp = hppPerBird(totalCost, pop.sold, pop.alive);

  // Revenue from this batch
  let batchRevenue = 0;
  state.sales.forEach((s) => {
    s.items
      .filter((it) => it.flockId === selectedBatchId)
      .forEach((it) => {
        batchRevenue += it.priceIdr;
      });
  });

  const batchProfit =
    selectedFlock?.status === 'selesai'
      ? finalProfit(batchRevenue, totalCost)
      : provisionalProfit(batchRevenue, hpp, pop.sold);

  const margin = marginPercent(batchProfit, batchRevenue);
  const roi = roiPercent(batchProfit, totalCost);
  const { breakEvenPrice, suggestedPrice } = priceCalculator(hpp, targetMargin);

  return (
    <div className="space-y-5 pb-12">
      {/* Financial Top Summary Card */}
      <div className="p-5 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3">
        <span className="text-xs font-bold text-[#4F5B52] uppercase tracking-wider block">
          Arus Kas Peternakan
        </span>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-black text-[#1B2B22] num">
              Rp {netCashflow.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-[#4F5B52] ml-2">Arus Kas Bersih</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenSalesWizard()}
              className="px-3 py-1.5 bg-[#1E6B47] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1"
            >
              <Plus size={14} /> Jual Ayam
            </button>
            <button
              type="button"
              onClick={() => onOpenExpenseModal()}
              className="px-3 py-1.5 bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3] rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus size={14} /> Catat Biaya
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D5DED3] text-center text-xs">
          <div>
            <span className="text-[#4F5B52] block text-[10px]">Pemasukan</span>
            <strong className="text-[#14663A] font-bold num">
              +Rp {totalSalesRevenue.toLocaleString('id-ID')}
            </strong>
          </div>
          <div>
            <span className="text-[#4F5B52] block text-[10px]">Total Biaya</span>
            <strong className="text-[#B3261E] font-bold num">
              -Rp {totalExpenses.toLocaleString('id-ID')}
            </strong>
          </div>
          <div>
            <span className="text-[#4F5B52] block text-[10px]">Piutang</span>
            <strong className="text-[#8A5A00] font-bold num">
              Rp {totalReceivables.toLocaleString('id-ID')}
            </strong>
          </div>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex border-b border-[#D5DED3] gap-2 text-xs font-bold">
        {[
          { id: 'ringkasan', label: 'Ringkasan' },
          { id: 'penjualan', label: 'Penjualan' },
          { id: 'biaya', label: 'Biaya' },
          { id: 'laba', label: 'Laba & HPP' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#1E6B47] text-[#1E6B47]'
                : 'border-transparent text-[#4F5B52] hover:text-[#1B2B22]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-4">
          {/* Piutang Warning if any */}
          {unpaidSales.length > 0 && (
            <div className="p-4 bg-[#FFF4D6] rounded-2xl border border-[#8A5A00]/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#8A5A00]">
                <span>Daftar Piutang (Belum Bayar)</span>
                <span className="num">Total: Rp {totalReceivables.toLocaleString('id-ID')}</span>
              </div>
              <div className="space-y-1.5">
                {unpaidSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-2 bg-white rounded-xl text-xs border border-[#D5DED3]"
                  >
                    <div>
                      <span className="font-bold text-[#1B2B22]">{s.customerName}</span>
                      <span className="text-[#4F5B52] ml-2 text-[11px]">{s.soldOn}</span>
                    </div>
                    <span className="font-bold text-[#8A5A00] num">
                      Rp {s.totalIdr.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3]">
              <span className="text-xs text-[#4F5B52] block">Ayam Terjual</span>
              <span className="text-2xl font-black text-[#1B2B22] num">
                {state.sales.reduce((sum, s) => sum + s.items.length, 0)} ekor
              </span>
              <span className="text-[11px] text-[#1E6B47] block mt-1">
                Harga rata-rata: Rp 70.000 / ekor
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3]">
              <span className="text-xs text-[#4F5B52] block">Biaya Pakan Bulan Ini</span>
              <span className="text-2xl font-black text-[#1B2B22] num">
                Rp {totalFeedExpense.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-[#4F5B52] block mt-1">Dedak dihitung Rp 0</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Penjualan */}
      {activeTab === 'penjualan' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#4F5B52] uppercase">Riwayat Penjualan</h3>
            <button
              type="button"
              onClick={() => onOpenSalesWizard()}
              className="px-3 py-1 bg-[#1E6B47] text-white rounded-lg text-xs font-bold"
            >
              + Jual Ayam
            </button>
          </div>

          {state.sales.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#D5DED3] text-center text-xs text-[#4F5B52]">
              Belum ada transaksi penjualan tercatat. Klik tombol "Jual Ayam" saat ayam telah siap panen.
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.sales.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-white rounded-xl border border-[#D5DED3] flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#1B2B22]">{s.customerName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.paid ? 'bg-[#DDF1E3] text-[#14663A]' : 'bg-[#FFF4D6] text-[#8A5A00]'
                        }`}
                      >
                        {s.paid ? 'Lunas' : 'Piutang'}
                      </span>
                    </div>
                    <p className="text-xs text-[#4F5B52] mt-0.5">
                      {s.soldOn} &bull; {s.items.length} ekor
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#14663A] num">
                      Rp {s.totalIdr.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Biaya */}
      {activeTab === 'biaya' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#4F5B52] uppercase">Pengeluaran Peternakan</h3>
            <button
              type="button"
              onClick={() => onOpenExpenseModal()}
              className="px-3 py-1 bg-[#1E6B47] text-white rounded-lg text-xs font-bold"
            >
              + Tambah Biaya
            </button>
          </div>

          {state.expenses.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#D5DED3] text-center text-xs text-[#4F5B52]">
              Belum ada pengeluaran operasional lain yang dicatat. Klik &quot;+ Tambah Biaya&quot; untuk mencatat obat, vaksin, listrik, atau perlengkapan kandang.
            </div>
          ) : (
            <div className="space-y-2">
              {state.expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 bg-white rounded-xl border border-[#D5DED3] flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-[#1B2B22]">{e.categoryName}</h4>
                    <p className="text-[11px] text-[#4F5B52]">
                      {e.spentOn} &bull; {e.allocation === 'direct' ? 'Langsung Batch' : 'Umum (Ekor-Hari)'}
                      {e.note ? ` &bull; ${e.note}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#B3261E] num">
                    -Rp {e.amountIdr.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Laba & HPP */}
      {activeTab === 'laba' && (
        <div className="space-y-4">
          {state.flocks.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-[#D5DED3] text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#DDF1E3] text-[#14663A] flex items-center justify-center mx-auto text-xl">
                📊
              </div>
              <h4 className="font-extrabold text-sm text-[#1B2B22]">Belum Ada Batch untuk Analisis HPP &amp; Laba</h4>
              <p className="text-xs text-[#4F5B52] max-w-sm mx-auto">
                Kalkulator HPP per ekor, analisis laba sementara/final, dan penetapan harga impas akan aktif otomatis setelah ada batch ayam aktif.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#4F5B52] mb-1">Pilih Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
                >
                  {state.flocks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

          {/* HPP Large Card */}
          <div className="p-5 bg-[#1E6B47] text-white rounded-2xl shadow-xs space-y-2">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">
              Modal per Ekor (HPP)
            </span>
            <div className="text-3xl font-black num">Rp {hpp.toLocaleString('id-ID')}</div>
            <p className="text-xs text-white/80">
              Total biaya batch Rp {totalCost.toLocaleString('id-ID')} dibagi {pop.sold + pop.alive} ekor ayam.
            </p>
          </div>

          {/* Laba Sementara vs Final */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3]">
              <span className="text-xs text-[#4F5B52] block">
                {selectedFlock?.status === 'selesai' ? 'Laba Final' : 'Laba Sementara'}
              </span>
              <span className="text-xl font-black text-[#14663A] num">
                Rp {batchProfit.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-[#4F5B52] block mt-0.5">
                {selectedFlock?.status === 'selesai' ? 'Batch ditutup' : 'Belum ditutup (perkiraan)'}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-[#D5DED3]">
              <span className="text-xs text-[#4F5B52] block">Margin &amp; ROI</span>
              <span className="text-xl font-black text-[#1E6B47] num">
                {margin}% / {roi}%
              </span>
              <span className="text-[10px] text-[#4F5B52] block mt-0.5">dari total modal batch</span>
            </div>
          </div>

          {/* Kalkulator Harga (FR-SAL-08) */}
          <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-3">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-[#1E6B47]" />
              <h4 className="font-extrabold text-sm text-[#1B2B22]">
                Kalkulator Harga Impas &amp; Target Laba
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
                <span className="text-[10px] text-[#4F5B52] block font-semibold">Harga Impas (BEP)</span>
                <strong className="text-base font-black text-[#1B2B22] num">
                  Rp {breakEvenPrice.toLocaleString('id-ID')}
                </strong>
                <span className="text-[9px] text-[#8A5A00] block">Batas bawah modal</span>
              </div>
              <div className="p-3 bg-[#DDF1E3] rounded-xl border border-[#1E6B47]/30">
                <span className="text-[10px] text-[#14663A] block font-semibold">
                  Disarankan (Margin {targetMargin}%)
                </span>
                <strong className="text-base font-black text-[#14663A] num">
                  Rp {suggestedPrice.toLocaleString('id-ID')}
                </strong>
                <span className="text-[9px] text-[#14663A] block">Target aman untung</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#4F5B52]">
                Sesuaikan Target Margin: {targetMargin}%
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseInt(e.target.value) || 25)}
                className="w-full accent-[#1E6B47]"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )}
</div>
  );
};
