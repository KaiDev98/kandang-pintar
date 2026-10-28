/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Scale, Check } from 'lucide-react';

interface WeightSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  flockId: string;
}

export const WeightSampleModal: React.FC<WeightSampleModalProps> = ({
  isOpen,
  onClose,
  flockId,
}) => {
  const { state, recordWeightSample } = useApp();
  const flock = state.flocks.find((f) => f.id === flockId);

  const [weights, setWeights] = useState<number[]>([820, 850, 800, 840, 860]);
  const [sampledOn, setSampledOn] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen || !flock) return null;

  const validWeights = weights.filter((w) => w > 0);
  const avgG = validWeights.length > 0 ? Math.round(validWeights.reduce((a, b) => a + b, 0) / validWeights.length) : 0;

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...weights];
    updated[index] = val;
    setWeights(updated);
  };

  const addField = () => {
    if (weights.length < 10) {
      setWeights([...weights, avgG || 800]);
    }
  };

  const removeField = (index: number) => {
    if (weights.length > 2) {
      setWeights(weights.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validWeights.length < 2) return;
    recordWeightSample(flockId, validWeights, sampledOn);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-sample-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="weight-sample-title" className="text-xl font-extrabold text-[#1B2B22]">
              Sampling Timbang Bobot
            </h2>
            <p className="text-xs text-[#4F5B52]">{flock.name} (5-10 sampel acak)</p>
          </div>
          <button onClick={onClose} aria-label="Tutup sampling" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Tanggal Timbang</label>
            <input
              type="date"
              value={sampledOn}
              onChange={(e) => setSampledOn(e.target.value)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <div className="p-3.5 bg-[#DDF1E3] rounded-xl border border-[#1E6B47]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={20} className="text-[#14663A]" />
              <span className="text-xs font-bold text-[#14663A]">Rata-rata Terkini:</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#14663A] num">{avgG}</span>
              <span className="text-xs text-[#14663A] ml-1">gram / ekor ({(avgG / 1000).toFixed(2)} kg)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-[#4F5B52] uppercase">
                Bobot Ayam Sampel (gram)
              </label>
              {weights.length < 10 && (
                <button
                  type="button"
                  onClick={addField}
                  className="text-xs text-[#1E6B47] font-bold hover:underline"
                >
                  + Tambah Sampel
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {weights.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-[#F1F5EF] p-2 rounded-xl border border-[#D5DED3]">
                  <span className="text-xs font-bold text-[#4F5B52] w-5">#{idx + 1}</span>
                  <input
                    type="number"
                    step="10"
                    value={w || ''}
                    onChange={(e) => handleWeightChange(idx, parseInt(e.target.value) || 0)}
                    placeholder="gram"
                    className="w-full bg-white px-2 py-1.5 rounded-lg border border-[#D5DED3] text-sm font-semibold num"
                  />
                  {weights.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="text-xs text-[#B3261E] px-1 hover:font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={validWeights.length < 2}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <Check size={18} /> Simpan Hasil Sampling
          </button>
        </form>
      </div>
    </div>
  );
};
