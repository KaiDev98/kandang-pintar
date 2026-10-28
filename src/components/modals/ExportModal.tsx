/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateFlockPopulation, batchCost, hppPerBird, provisionalProfit, finalProfit } from '../../domain/calculations.ts';
import { X, FileSpreadsheet, Download, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { state, showToast } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportType, setExportType] = useState<'batch' | 'all'>('batch');
  const [selectedFlockId, setSelectedFlockId] = useState<string>(state.flocks[0]?.id || '');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      if (exportType === 'batch') {
        const flock = state.flocks.find((f) => f.id === selectedFlockId);
        if (!flock) return;

        const flMovements = state.movements.filter((m) => m.flockId === flock.id);
        const pop = calculateFlockPopulation(flock.initialCount, flMovements);

        // Feed logs for this flock
        const flFeed = state.feedLogs.filter((f) => f.flockId === flock.id);
        const totalFeedCost = flFeed.reduce((sum, f) => sum + f.priceIdr, 0);

        // Direct expenses
        const flExp = state.expenses.filter((e) => e.flockId === flock.id);
        const directExpCost = flExp.reduce((sum, e) => sum + e.amountIdr, 0);

        const totalCost = batchCost({
          motherAllocationIdr: 45000,
          feedCostIdr: totalFeedCost,
          medicineIdr: 25000,
          allocatedGeneralIdr: 50000,
          otherIdr: directExpCost,
        });

        const hpp = hppPerBird(totalCost, pop.sold, pop.alive);

        // Sales for this flock
        const flSales: Array<{ Tanggal: string; Pembeli: string; Ekor: number; Harga_Total_Rp: number }> = [];
        let totalRevenue = 0;
        state.sales.forEach((s) => {
          const items = s.items.filter((it) => it.flockId === flock.id);
          if (items.length > 0) {
            const revenue = items.reduce((sum, it) => sum + it.priceIdr, 0);
            totalRevenue += revenue;
            flSales.push({
              Tanggal: s.soldOn,
              Pembeli: s.customerName || 'Pembeli Langsung',
              Ekor: items.length,
              Harga_Total_Rp: revenue,
            });
          }
        });

        const profit = flock.status === 'selesai'
          ? finalProfit(totalRevenue, totalCost)
          : provisionalProfit(totalRevenue, hpp, pop.sold);

        // 1. Summary Sheet
        const summaryRows = [
          { Parameter: 'Nama Batch', Nilai: flock.name },
          { Parameter: 'Tanggal Menetas', Nilai: flock.hatchedOn },
          { Parameter: 'Populasi Awal', Nilai: `${flock.initialCount} ekor` },
          { Parameter: 'Ayam Hidup', Nilai: `${pop.alive} ekor` },
          { Parameter: 'Ayam Mati', Nilai: `${pop.dead} ekor` },
          { Parameter: 'Ayam Terjual', Nilai: `${pop.sold} ekor` },
          { Parameter: 'Fase', Nilai: flock.phase === 'umbaran' ? 'Umbaran' : 'Kandang' },
          { Parameter: 'Total Biaya Batch', Nilai: `Rp ${totalCost.toLocaleString('id-ID')}` },
          { Parameter: 'HPP per Ekor', Nilai: `Rp ${hpp.toLocaleString('id-ID')}` },
          { Parameter: 'Total Pendapatan', Nilai: `Rp ${totalRevenue.toLocaleString('id-ID')}` },
          { Parameter: 'Laba (Sementara/Final)', Nilai: `Rp ${profit.toLocaleString('id-ID')}` },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Batch');

        // 2. Movements Sheet
        const wsMovs = XLSX.utils.json_to_sheet(
          flMovements.map((m) => ({
            Tanggal: m.occurredOn,
            Jenis: m.kind,
            Jumlah_Ekor: m.qty,
            Keterangan: m.reason || '-',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsMovs, 'Pergerakan Ayam');

        // 3. Sales Sheet
        const wsSales = XLSX.utils.json_to_sheet(flSales);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Penjualan');

        const fileName = `Laporan_${flock.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        if (selectedFormat === 'csv') {
          XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
        } else {
          XLSX.writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx' });
        }
      } else {
        // Complete Daily Logs Export
        const wsFeed = XLSX.utils.json_to_sheet(
          state.feedLogs.map((f) => ({
            Tanggal: f.logDate,
            Target: f.flockId || 'Indukan',
            Jenis_Pakan: f.feedType,
            Berat_Kg: f.weightKg,
            Biaya_Rp: f.priceIdr,
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsFeed, 'Catatan Pakan');

        const wsEggs = XLSX.utils.json_to_sheet(
          state.eggLogs.map((e) => {
            const hen = state.birds.find((b) => b.id === e.birdId);
            return {
              Tanggal: e.logDate,
              Induk: hen?.code || 'Betina',
              Telur_Baik: e.good,
              Telur_Pecah: e.broken,
              Telur_Abnormal: e.abnormal,
            };
          })
        );
        XLSX.utils.book_append_sheet(wb, wsEggs, 'Produksi Telur');

        const wsExp = XLSX.utils.json_to_sheet(
          state.expenses.map((ex) => ({
            Tanggal: ex.spentOn,
            Kategori: ex.categoryName,
            Jumlah_Rp: ex.amountIdr,
            Alokasi: ex.allocation === 'direct' ? 'Langsung Batch' : 'Umum',
            Catatan: ex.note || '-',
          }))
        );
        XLSX.utils.book_append_sheet(wb, wsExp, 'Semua Biaya');

        const fileName = `Semua_Catatan_Peternakan_${new Date().toISOString().split('T')[0]}`;
        if (selectedFormat === 'csv') {
          XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
        } else {
          XLSX.writeFile(wb, `${fileName}.xlsx`, { bookType: 'xlsx' });
        }
      }

      showToast(`Data berhasil diekspor (${selectedFormat.toUpperCase()}) ✓`);
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Gagal mengekspor file', undefined, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="export-title" className="text-xl font-extrabold text-[#1B2B22]">
              Ekspor Data Peternakan
            </h2>
            <p className="text-xs text-[#4F5B52]">Format Excel (.xlsx) atau .csv</p>
          </div>
          <button onClick={onClose} aria-label="Tutup ekspor" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-2 uppercase">
              Pilih Jenis Laporan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportType('batch')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'batch'
                    ? 'border-[#1E6B47] bg-[#DDF1E3]/40 text-[#1E6B47] font-bold'
                    : 'border-[#D5DED3] bg-white text-[#1B2B22]'
                }`}
              >
                <div className="text-sm font-extrabold">Laporan per Batch</div>
                <div className="text-[11px] text-[#4F5B52] mt-0.5">Biaya, HPP, Penjualan, Laba</div>
              </button>
              <button
                type="button"
                onClick={() => setExportType('all')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportType === 'all'
                    ? 'border-[#1E6B47] bg-[#DDF1E3]/40 text-[#1E6B47] font-bold'
                    : 'border-[#D5DED3] bg-white text-[#1B2B22]'
                }`}
              >
                <div className="text-sm font-extrabold">Semua Catatan</div>
                <div className="text-[11px] text-[#4F5B52] mt-0.5">Pakan, Telur, Biaya Lengkap</div>
              </button>
            </div>
          </div>

          {exportType === 'batch' && (
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Pilih Batch</label>
              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
              >
                {state.flocks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-2 uppercase">
              Format Berkas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('xlsx')}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                  selectedFormat === 'xlsx'
                    ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
                    : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                }`}
              >
                <FileSpreadsheet size={16} /> Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                  selectedFormat === 'csv'
                    ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
                    : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                }`}
              >
                <Download size={16} /> CSV (.csv)
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownload}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-40"
          >
            <Download size={18} />
            {isExporting ? 'Mengekspor...' : 'Unduh Laporan'}
          </button>
        </div>
      </div>
    </div>
  );
};
