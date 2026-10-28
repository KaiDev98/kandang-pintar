/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFlockId?: string;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  preselectedFlockId,
}) => {
  const { state, logDaily } = useApp();
  const defaultPurPrice = state.settings.defaultPurPriceIdr || 10000;

  // Selected target: either flock id or 'indukan'
  const [targetId, setTargetId] = useState<string>(
    preselectedFlockId || (state.flocks[0]?.id || 'indukan')
  );

  // Stepper states
  const [purKg, setPurKg] = useState<number>(0.6);
  const [purPrice, setPurPrice] = useState<number>(6000);
  const [customPurPrice, setCustomPurPrice] = useState<boolean>(false);

  const [dedakKg, setDedakKg] = useState<number>(0.6);
  const [dedakPrice, setDedakPrice] = useState<number>(0);

  const [showOtherFeed, setShowOtherFeed] = useState<boolean>(false);
  const [otherFeedName, setOtherFeedName] = useState<string>('Benih beras');
  const [otherFeedKg, setOtherFeedKg] = useState<number>(0.2);
  const [otherFeedPrice, setOtherFeedPrice] = useState<number>(0);

  // Water
  const [waterChanged, setWaterChanged] = useState<boolean>(true);
  const [showWaterDetails, setShowWaterDetails] = useState<boolean>(false);
  const [waterLiters, setWaterLiters] = useState<number>(3);
  const [waterSupplement, setWaterSupplement] = useState<string>('Vitachick');

  // Eggs (for indukan)
  const [eggCounts, setEggCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    state.birds
      .filter((b) => b.sex === 'betina' && b.status === 'aktif')
      .forEach((b) => {
        initial[b.id] = 1; // sensible default
      });
    return initial;
  });

  // Mortality
  const [deadCount, setDeadCount] = useState<number>(0);
  const [deadReason, setDeadReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isIndukan = targetId === 'indukan';
  const selectedFlock = state.flocks.find((f) => f.id === targetId);

  // Auto-calculate pur price when purKg changes if not manually customized
  const handlePurChange = (newVal: number) => {
    const val = Math.max(0, parseFloat(newVal.toFixed(2)));
    setPurKg(val);
    if (!customPurPrice) {
      setPurPrice(Math.round(val * defaultPurPrice));
    }
  };

  const handleDedakChange = (newVal: number) => {
    const val = Math.max(0, parseFloat(newVal.toFixed(2)));
    setDedakKg(val);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const eggsPayload = isIndukan
        ? Object.entries(eggCounts).map(([birdId, count]) => ({
            birdId,
            good: count,
            broken: 0,
            abnormal: 0,
          }))
        : undefined;

      await logDaily({
        targetId,
        purKg,
        purPriceIdr: purPrice,
        dedakKg,
        dedakPriceIdr: dedakPrice,
        otherFeedKg: showOtherFeed ? otherFeedKg : 0,
        otherFeedName: showOtherFeed ? otherFeedName : undefined,
        otherFeedPriceIdr: showOtherFeed ? otherFeedPrice : 0,
        waterChanged,
        waterLiters: showWaterDetails ? waterLiters : undefined,
        waterSupplement: showWaterDetails ? waterSupplement : undefined,
        eggs: eggsPayload,
        deadCount: isIndukan ? 0 : deadCount,
        deadReason: deadCount > 0 ? deadReason : undefined,
      });

      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#D5DED3] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="quick-log-title" className="text-xl font-extrabold text-[#1B2B22]">
              Catat Hari Ini
            </h2>
            <p className="text-xs text-[#4F5B52]">Target selesai dalam &lt; 30 detik</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup formulir catat"
            className="p-2 rounded-full hover:bg-[#F1F5EF] text-[#4F5B52] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4F5B52] uppercase tracking-wider mb-2">
              Untuk Siapa?
            </label>
            <div className="flex flex-wrap gap-2">
              {state.flocks
                .filter((f) => f.status !== 'selesai')
                .map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTargetId(f.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      targetId === f.id
                        ? 'bg-[#1E6B47] text-white shadow-xs'
                        : 'bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3]'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setTargetId('indukan')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isIndukan
                    ? 'bg-[#1E6B47] text-white shadow-xs'
                    : 'bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3]'
                }`}
              >
                Indukan (Dewasa)
              </button>
            </div>
          </div>

          {/* Section Pakan */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1">
              Pakan Harian
            </h3>

            {/* Stepper Pur */}
            <div className="bg-[#F1F5EF] p-3.5 rounded-2xl border border-[#D5DED3]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1B2B22]">Pur (Pabrikan)</span>
                <span className="text-xs font-semibold text-[#1E6B47]">
                  Rp {purPrice.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePurChange(purKg - 0.1)}
                  aria-label="Kurangi pur 0.1 kg"
                  className="w-14 h-14 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-[#1B2B22] shadow-xs"
                >
                  <Minus size={22} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-[#1B2B22] num">
                    {purKg.toFixed(1)}
                  </span>
                  <span className="text-sm text-[#4F5B52] ml-1">kg</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePurChange(purKg + 0.1)}
                  aria-label="Tambah pur 0.1 kg"
                  className="w-14 h-14 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-[#1B2B22] shadow-xs"
                >
                  <Plus size={22} />
                </button>
              </div>
            </div>

            {/* Stepper Dedak */}
            <div className="bg-[#F1F5EF] p-3.5 rounded-2xl border border-[#D5DED3]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1B2B22]">Dedak (Hasil Sendiri)</span>
                <span className="text-xs font-semibold text-[#4F5B52]">
                  Rp {dedakPrice.toLocaleString('id-ID')} (Rp 0)
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDedakChange(dedakKg - 0.1)}
                  aria-label="Kurangi dedak 0.1 kg"
                  className="w-14 h-14 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-[#1B2B22] shadow-xs"
                >
                  <Minus size={22} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-[#1B2B22] num">
                    {dedakKg.toFixed(1)}
                  </span>
                  <span className="text-sm text-[#4F5B52] ml-1">kg</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDedakChange(dedakKg + 0.1)}
                  aria-label="Tambah dedak 0.1 kg"
                  className="w-14 h-14 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center text-xl font-bold active:scale-95 transition-all text-[#1B2B22] shadow-xs"
                >
                  <Plus size={22} />
                </button>
              </div>
            </div>

            {/* Toggle Other Feed */}
            {!showOtherFeed ? (
              <button
                type="button"
                onClick={() => setShowOtherFeed(true)}
                className="text-xs font-bold text-[#1E6B47] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Tambah pakan tambahan (benih beras / jagung)
              </button>
            ) : (
              <div className="p-3 bg-white border border-[#D5DED3] rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={otherFeedName}
                    onChange={(e) => setOtherFeedName(e.target.value)}
                    className="text-xs font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-0.5 outline-hidden"
                    placeholder="Nama pakan lain"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOtherFeed(false)}
                    className="text-xs text-[#B3261E]"
                  >
                    Hapus
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={otherFeedKg}
                    onChange={(e) => setOtherFeedKg(parseFloat(e.target.value) || 0)}
                    placeholder="kg"
                    className="w-1/2 p-2 rounded-lg border border-[#D5DED3] text-sm"
                  />
                  <input
                    type="number"
                    value={otherFeedPrice}
                    onChange={(e) => setOtherFeedPrice(parseInt(e.target.value) || 0)}
                    placeholder="Rp harga"
                    className="w-1/2 p-2 rounded-lg border border-[#D5DED3] text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Minum */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1">
              Air Minum
            </h3>
            <label className="flex items-center gap-3 p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] cursor-pointer">
              <input
                type="checkbox"
                checked={waterChanged}
                onChange={(e) => setWaterChanged(e.target.checked)}
                className="w-5 h-5 accent-[#1E6B47] rounded-sm"
              />
              <span className="text-sm font-semibold text-[#1B2B22]">
                Air minum sudah diganti &amp; wadah dibersihkan
              </span>
            </label>

            {!showWaterDetails ? (
              <button
                type="button"
                onClick={() => setShowWaterDetails(true)}
                className="text-xs font-semibold text-[#4F5B52] hover:text-[#1E6B47]"
              >
                Isi liter &amp; suplemen/vitamin &rsaquo;
              </button>
            ) : (
              <div className="p-3 bg-white border border-[#D5DED3] rounded-xl space-y-2">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="text-[10px] text-[#4F5B52] font-semibold">Volume (L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={waterLiters}
                      onChange={(e) => setWaterLiters(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#D5DED3] rounded-lg text-sm"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="text-[10px] text-[#4F5B52] font-semibold">
                      Vitamin / Suplemen
                    </label>
                    <input
                      type="text"
                      value={waterSupplement}
                      onChange={(e) => setWaterSupplement(e.target.value)}
                      placeholder="Contoh: Vitachick"
                      className="w-full p-2 border border-[#D5DED3] rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Telur (khusus Indukan) */}
          {isIndukan && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1">
                Catatan Telur per Induk
              </h3>
              <div className="space-y-2">
                {state.birds
                  .filter((b) => b.sex === 'betina' && b.status === 'aktif')
                  .map((hen) => (
                    <div
                      key={hen.id}
                      className="flex items-center justify-between p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]"
                    >
                      <span className="font-semibold text-sm text-[#1B2B22]">{hen.code}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEggCounts((prev) => ({
                              ...prev,
                              [hen.id]: Math.max(0, (prev[hen.id] || 0) - 1),
                            }))
                          }
                          aria-label={`Kurangi telur ${hen.code}`}
                          className="w-9 h-9 rounded-lg bg-white border border-[#D5DED3] flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black text-lg text-[#1B2B22] num">
                          {eggCounts[hen.id] || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEggCounts((prev) => ({
                              ...prev,
                              [hen.id]: (prev[hen.id] || 0) + 1,
                            }))
                          }
                          aria-label={`Tambah telur ${hen.code}`}
                          className="w-9 h-9 rounded-lg bg-white border border-[#D5DED3] flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Section Kematian (khusus Batch) */}
          {!isIndukan && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1">
                Ayam Mati Hari Ini
              </h3>
              <div className="flex items-center justify-between p-3.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
                <span className="font-bold text-sm text-[#1B2B22]">Jumlah Mati</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDeadCount((prev) => Math.max(0, prev - 1))}
                    aria-label="Kurangi ayam mati"
                    className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center font-bold text-lg"
                  >
                    -
                  </button>
                  <span
                    className={`w-10 text-center font-black text-2xl num ${
                      deadCount > 0 ? 'text-[#B3261E]' : 'text-[#1B2B22]'
                    }`}
                  >
                    {deadCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeadCount((prev) => prev + 1)}
                    aria-label="Tambah ayam mati"
                    className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {deadCount > 0 && (
                <div className="p-3 bg-[#FBE3E0] rounded-xl border border-[#B3261E]/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#9C1C16]">
                    <AlertCircle size={16} /> Dugaan Penyebab (Opsional)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Kedinginan', 'Lemas / Tak mau makan', 'Predator', 'Lainnya'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDeadReason(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          deadReason === r
                            ? 'bg-[#B3261E] text-white'
                            : 'bg-white text-[#9C1C16] border border-[#B3261E]/40'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Submit Button (Sticky Bottom) */}
        <div className="p-4 bg-white border-t border-[#D5DED3]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="w-full h-13 bg-[#1E6B47] hover:bg-[#165538] text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-50"
          >
            <Check size={20} />
            {isSubmitting ? 'Menyimpan...' : 'Simpan catatan hari ini'}
          </button>
        </div>
      </div>
    </div>
  );
};
