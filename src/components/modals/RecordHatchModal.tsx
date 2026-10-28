/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateHatchRate } from '../../domain/calculations.ts';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface RecordHatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedHatchId?: string;
}

export const RecordHatchModal: React.FC<RecordHatchModalProps> = ({
  isOpen,
  onClose,
  preselectedHatchId,
}) => {
  const { state, recordHatch } = useApp();

  const activeBatches = state.hatchBatches.filter((h) => h.status === 'mengeram');
  const [hatchBatchId, setHatchBatchId] = useState<string>(
    preselectedHatchId || activeBatches[0]?.id || ''
  );

  const selectedBatch = state.hatchBatches.find((h) => h.id === hatchBatchId);
  const hen = state.birds.find((b) => b.id === selectedBatch?.birdId);

  const [hatchedCount, setHatchedCount] = useState<number>(12);
  const [coopId, setCoopId] = useState<string>(selectedBatch?.coopTargetId || state.coops[0]?.id || '');
  const [flockName, setFlockName] = useState<string>('');

  if (!isOpen) return null;

  const eggsSet = selectedBatch?.eggsSet || 14;
  const hatchRate = calculateHatchRate(hatchedCount, eggsSet);
  const meetsTarget = hatchedCount >= 10; // Target klien: > 10 anakan per siklus

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hatchBatchId) return;

    const name = flockName || `Batch ${state.flocks.length + 1} (Induk ${hen?.code || 'Betina'})`;
    const res = recordHatch({
      hatchBatchId,
      hatchedCount,
      coopId,
      flockName: name,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-hatch-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="record-hatch-title" className="text-xl font-extrabold text-[#1B2B22]">
              Catat Hasil Tetas
            </h2>
            <p className="text-xs text-[#4F5B52]">Membuat batch anakan baru</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup hasil tetas"
            className="p-2 rounded-full hover:bg-[#F1F5EF] text-[#4F5B52]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Pilih Pengeraman Aktif
            </label>
            {activeBatches.length === 0 ? (
              <p className="text-xs text-[#B3261E] bg-[#FBE3E0] p-2.5 rounded-lg">
                Tidak ada induk yang sedang mengeram saat ini.
              </p>
            ) : (
              <select
                value={hatchBatchId}
                onChange={(e) => setHatchBatchId(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
              >
                {activeBatches.map((h) => {
                  const bHen = state.birds.find((b) => b.id === h.birdId);
                  return (
                    <option key={h.id} value={h.id}>
                      {bHen?.code || 'Betina'} &bull; {h.eggsSet} butir (Mulai {h.startedOn})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div className="bg-[#F1F5EF] p-4 rounded-xl border border-[#D5DED3] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-[#1B2B22]">Jumlah Telur Menetas</span>
              <span className="text-xs text-[#4F5B52]">Dari total {eggsSet} butir</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setHatchedCount((c) => Math.max(0, c - 1))}
                className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] font-bold text-xl"
              >
                -
              </button>
              <div className="text-center">
                <span className="text-3xl font-black text-[#1B2B22] num">{hatchedCount}</span>
                <span className="text-xs text-[#4F5B52] ml-1">ekor</span>
              </div>
              <button
                type="button"
                onClick={() => setHatchedCount((c) => Math.min(eggsSet, c + 1))}
                className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] font-bold text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Persen Menetas & Target Indicator (FR-EGG-06) */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              meetsTarget
                ? 'bg-[#DDF1E3] border-[#1E6B47]/30 text-[#14663A]'
                : 'bg-[#FFF4D6] border-[#8A5A00]/30 text-[#8A5A00]'
            }`}
          >
            {meetsTarget ? (
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div>
                Persen Menetas: <strong className="font-extrabold">{hatchRate}%</strong> ({hatchedCount} dari {eggsSet} telur)
              </div>
              <div>
                {meetsTarget
                  ? '✓ Target klien tercapai (> 10 anakan per siklus).'
                  : '! Di bawah target klien (> 10 anakan). Evaluasi kelembapan dan kebersihan sarang.'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Nama Batch Baru
            </label>
            <input
              type="text"
              value={flockName}
              onChange={(e) => setFlockName(e.target.value)}
              placeholder={`Contoh: Batch ${state.flocks.length + 1} (${hen?.code || 'Betina'})`}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Kandang Penempatan Anakan
            </label>
            <select
              value={coopId}
              onChange={(e) => setCoopId(e.target.value)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm bg-white"
            >
              {state.coops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!hatchBatchId}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold shadow-xs transition-all disabled:opacity-40"
          >
            {hatchedCount > 0 ? 'Buat Batch Baru' : 'Tutup Pengeraman Gagal (0 Ekor)'}
          </button>
        </form>
      </div>
    </div>
  );
};
