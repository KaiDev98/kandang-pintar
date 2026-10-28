/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateFlockPopulation } from '../../domain/calculations.ts';
import { X, Check } from 'lucide-react';

interface RecountModalProps {
  isOpen: boolean;
  onClose: () => void;
  flockId: string;
}

export const RecountModal: React.FC<RecountModalProps> = ({ isOpen, onClose, flockId }) => {
  const { state, recountFlock } = useApp();
  const flock = state.flocks.find((f) => f.id === flockId);
  const movements = state.movements.filter((m) => m.flockId === flockId);
  const { alive } = flock ? calculateFlockPopulation(flock.initialCount, movements) : { alive: 0 };

  const [foundCount, setFoundCount] = useState<number>(alive);
  const [reason, setReason] = useState<'lost' | 'dead'>('lost');

  if (!isOpen || !flock) return null;

  const diff = alive - foundCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recountFlock(flockId, foundCount, reason);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recount-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="recount-title" className="text-xl font-extrabold text-[#1B2B22]">
              Hitung Ulang Umbaran
            </h2>
            <p className="text-xs text-[#4F5B52]">{flock.name}</p>
          </div>
          <button onClick={onClose} aria-label="Tutup form hitung ulang" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-4 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] text-center space-y-2">
            <span className="text-xs font-bold text-[#4F5B52] uppercase">
              Berapa ekor yang ditemukan hari ini?
            </span>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setFoundCount((c) => Math.max(0, c - 1))}
                className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] font-bold text-xl"
              >
                -
              </button>
              <span className="text-3xl font-black text-[#1B2B22] num">{foundCount}</span>
              <button
                type="button"
                onClick={() => setFoundCount((c) => c + 1)}
                className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] font-bold text-xl"
              >
                +
              </button>
            </div>
            <p className="text-xs text-[#4F5B52] pt-1">
              Tercatat di sistem: <strong className="font-bold text-[#1B2B22]">{alive} ekor</strong>
            </p>
          </div>

          {diff > 0 && (
            <div className="p-3 bg-[#FFF4D6] border border-[#8A5A00]/30 rounded-xl space-y-2">
              <span className="text-xs font-bold text-[#8A5A00]">
                Selisih {diff} ekor kurang. Catat sebagai:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReason('lost')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    reason === 'lost'
                      ? 'bg-[#8A5A00] text-white border-[#8A5A00]'
                      : 'bg-white text-[#8A5A00] border-[#8A5A00]/40'
                  }`}
                >
                  Hilang (Predator/Kabur)
                </button>
                <button
                  type="button"
                  onClick={() => setReason('dead')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    reason === 'dead'
                      ? 'bg-[#B3261E] text-white border-[#B3261E]'
                      : 'bg-white text-[#B3261E] border-[#B3261E]/40'
                  }`}
                >
                  Ditemukan Mati
                </button>
              </div>
            </div>
          )}

          {diff < 0 && (
            <div className="p-3 bg-[#DDF1E3] border border-[#1E6B47]/30 rounded-xl text-xs text-[#14663A] font-semibold">
              Ditemukan +{Math.abs(diff)} ekor lebih banyak dari catatan. Sistem akan membuat penyesuaian (adjust).
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check size={18} /> Simpan Hitung Ulang
          </button>
        </form>
      </div>
    </div>
  );
};
