/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface StartBroodingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartBroodingModal: React.FC<StartBroodingModalProps> = ({ isOpen, onClose }) => {
  const { state, startBrooding } = useApp();

  // Active hens that are currently not brooding
  const activeBroodingBirdIds = new Set(
    state.hatchBatches.filter((h) => h.status === 'mengeram').map((h) => h.birdId)
  );
  const activeBroodingBoxIds = new Set(
    state.hatchBatches.filter((h) => h.status === 'mengeram').map((h) => h.nestBoxId)
  );

  const availableHens = state.birds.filter(
    (b) => b.sex === 'betina' && b.status === 'aktif' && !activeBroodingBirdIds.has(b.id)
  );
  const availableBoxes = state.nestBoxes.filter((nb) => !activeBroodingBoxIds.has(nb.id));

  const [birdId, setBirdId] = useState<string>(availableHens[0]?.id || '');
  const [nestBoxId, setNestBoxId] = useState<string>(availableBoxes[0]?.id || '');
  const [coopTargetId, setCoopTargetId] = useState<string>(state.coops[0]?.id || '');
  const [startedOn, setStartedOn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eggsSet, setEggsSet] = useState<number>(14);
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Estimated hatch date (+21 days)
  const broodingDays = state.settings.broodingDays || 21;
  const expectedHatchDate = new Date(new Date(startedOn).getTime() + broodingDays * 86400000)
    .toISOString()
    .split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!birdId) {
      setErrorMessage('Pilih indukan yang akan mengeram');
      return;
    }
    if (!nestBoxId) {
      setErrorMessage('Pilih tempat pengeraman');
      return;
    }

    const result = startBrooding({
      birdId,
      nestBoxId,
      coopTargetId,
      startedOn,
      eggsSet,
      note,
    });

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Gagal memulai pengeraman');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-brooding-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="start-brooding-title" className="text-xl font-extrabold text-[#1B2B22]">
              Mulai Pengeraman
            </h2>
            <p className="text-xs text-[#4F5B52]">Dierami induk sendiri (21 hari)</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pengeraman"
            className="p-2 rounded-full hover:bg-[#F1F5EF] text-[#4F5B52]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#FBE3E0] border border-[#B3261E]/40 rounded-xl flex items-start gap-2 text-xs font-semibold text-[#9C1C16]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Induk Selection */}
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Pilih Indukan (Betina)
            </label>
            {availableHens.length === 0 ? (
              <p className="text-xs text-[#B3261E] bg-[#FBE3E0] p-2.5 rounded-lg">
                Semua indukan aktif sedang mengeram.
              </p>
            ) : (
              <select
                value={birdId}
                onChange={(e) => setBirdId(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
              >
                {availableHens.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.code} (Status: Bebas)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tempat Pengeraman (BR-01) */}
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Tempat Pengeraman (Nest Box)
            </label>
            {availableBoxes.length === 0 ? (
              <p className="text-xs text-[#B3261E] bg-[#FBE3E0] p-2.5 rounded-lg">
                Kedua tempat pengeraman sedang terisi. Tunggu hingga salah satu menetas.
              </p>
            ) : (
              <select
                value={nestBoxId}
                onChange={(e) => setNestBoxId(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
              >
                {availableBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Tersedia)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tanggal Mulai & Perkiraan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startedOn}
                onChange={(e) => setStartedOn(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Jumlah Telur</label>
              <input
                type="number"
                min="1"
                max="30"
                value={eggsSet}
                onChange={(e) => setEggsSet(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-bold num"
              />
            </div>
          </div>

          <div className="p-3 bg-[#DDF1E3] rounded-xl border border-[#1E6B47]/30 flex items-center gap-2">
            <Calendar size={18} className="text-[#14663A] shrink-0" />
            <div className="text-xs text-[#14663A]">
              Perkiraan Menetas: <strong className="font-bold">{expectedHatchDate}</strong> (+{broodingDays} hari)
            </div>
          </div>

          {/* Kandang Tujuan */}
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Kandang Penempatan Anakan Nanti
            </label>
            <select
              value={coopTargetId}
              onChange={(e) => setCoopTargetId(e.target.value)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm bg-white"
            >
              {state.coops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Kapasitas: {c.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Catatan</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan kondisi telur/induk..."
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={availableHens.length === 0 || availableBoxes.length === 0}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold shadow-xs transition-all disabled:opacity-40"
          >
            Mulai Masa Eram
          </button>
        </form>
      </div>
    </div>
  );
};
