/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateFlockPopulation, isSellable } from '../../domain/calculations.ts';
import { X, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';

interface SalesWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFlockId?: string;
}

export const SalesWizardModal: React.FC<SalesWizardModalProps> = ({
  isOpen,
  onClose,
  preselectedFlockId,
}) => {
  const { state, createSale } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Batch selection and quantity
  const [selectedFlockId, setSelectedFlockId] = useState<string>(
    preselectedFlockId || state.flocks.find((f) => f.status !== 'selesai')?.id || ''
  );
  const [qty, setQty] = useState<number>(2);

  // Step 2: Per-bird items (weight, price, health check)
  const [birdWeights, setBirdWeights] = useState<number[]>([1050, 1100]);
  const [birdPrices, setBirdPrices] = useState<number[]>([
    state.settings.referencePriceIdr || 70000,
    state.settings.referencePriceIdr || 70000,
  ]);
  const [birdHealthChecks, setBirdHealthChecks] = useState<boolean[]>([true, true]);
  const [overrideUnsellable, setOverrideUnsellable] = useState<boolean>(false);

  // Step 3: Customer and review
  const [customerName, setCustomerName] = useState<string>('');
  const [shippingIdr, setShippingIdr] = useState<number>(0);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [saleNote, setSaleNote] = useState<string>('');

  if (!isOpen) return null;

  const currentFlock = state.flocks.find((f) => f.id === selectedFlockId);
  const currentMovements = state.movements.filter((m) => m.flockId === selectedFlockId);
  const { alive } = currentFlock
    ? calculateFlockPopulation(currentFlock.initialCount, currentMovements)
    : { alive: 0 };

  // Calculate age of selected batch
  const hatchTime = currentFlock ? new Date(currentFlock.hatchedOn).getTime() : Date.now();
  const ageDays = Math.max(0, Math.round((Date.now() - hatchTime) / (1000 * 60 * 60 * 24)));

  // Latest sample average weight
  const latestSample = state.weightSamples
    .filter((ws) => ws.flockId === selectedFlockId)
    .sort((a, b) => new Date(b.sampledOn).getTime() - new Date(a.sampledOn).getTime())[0];
  const avgWeight = latestSample ? latestSample.avgG : 900;

  // Check sellability criteria (BR-08)
  const sellableCheck = isSellable(
    { ageDays, weightG: avgWeight, healthy: true },
    {
      minAgeDays: state.settings.minSellAgeDays || 90,
      minWeightG: state.settings.minSellWeightG || 1000,
    }
  );

  const handleQtyChange = (newQty: number) => {
    const validQty = Math.max(1, Math.min(alive || 1, newQty));
    setQty(validQty);

    // Sync array sizes
    const newWeights = [...birdWeights];
    const newPrices = [...birdPrices];
    const newHealth = [...birdHealthChecks];

    while (newWeights.length < validQty) {
      newWeights.push(avgWeight || 1050);
      newPrices.push(state.settings.referencePriceIdr || 70000);
      newHealth.push(true);
    }
    setBirdWeights(newWeights.slice(0, validQty));
    setBirdPrices(newPrices.slice(0, validQty));
    setBirdHealthChecks(newHealth.slice(0, validQty));
  };

  const handleCompleteSale = () => {
    if (!currentFlock) return;

    const items = birdPrices.map((price, idx) => ({
      id: 'item-' + Date.now() + '-' + idx,
      flockId: selectedFlockId,
      weightG: birdWeights[idx] || 1000,
      priceIdr: price,
      healthyChecked: birdHealthChecks[idx] !== false,
    }));

    createSale({
      soldOn: new Date().toISOString().split('T')[0],
      customerName: customerName || 'Pembeli Langsung',
      items,
      shippingIdr,
      paid: isPaid,
      paidOn: isPaid ? new Date().toISOString().split('T')[0] : undefined,
      note: saleNote,
    });

    onClose();
  };

  const totalPrice = birdPrices.reduce((a, b) => a + b, 0) + shippingIdr;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sales-wizard-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="sales-wizard-title" className="text-xl font-extrabold text-[#1B2B22]">
              Jual Ayam (Langkah {step} dari 3)
            </h2>
            <p className="text-xs text-[#4F5B52]">
              {step === 1 && 'Pilih batch dan jumlah ekor'}
              {step === 2 && 'Atur bobot, harga, dan checklist sehat'}
              {step === 3 && 'Tinjau total dan simpan transaksi'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup form jual ayam"
            className="p-2 rounded-full hover:bg-[#F1F5EF] text-[#4F5B52]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#D5DED3] h-1.5">
          <div
            className="bg-[#1E6B47] h-1.5 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* STEP 1: Batch & Quantity */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4F5B52] uppercase mb-2">
                  Pilih Batch Ayam
                </label>
                <div className="space-y-2">
                  {state.flocks
                    .filter((f) => f.status !== 'selesai')
                    .map((f) => {
                      const fMovs = state.movements.filter((m) => m.flockId === f.id);
                      const fPop = calculateFlockPopulation(f.initialCount, fMovs);
                      const isSelected = selectedFlockId === f.id;

                      return (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFlockId(f.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1E6B47] bg-[#DDF1E3]/30 shadow-xs'
                              : 'border-[#D5DED3] bg-white hover:bg-[#F1F5EF]'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-[#1B2B22]">{f.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DDF1E3] text-[#14663A]">
                              {fPop.alive} ekor hidup
                            </span>
                          </div>
                          <div className="text-xs text-[#4F5B52] mt-1">
                            Fase: {f.phase === 'umbaran' ? 'Umbaran' : 'Kandang'} &bull; Umur: {ageDays} hari
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="bg-[#F1F5EF] p-4 rounded-xl border border-[#D5DED3]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-[#1B2B22]">Jumlah yang Dijual</span>
                  <span className="text-xs text-[#4F5B52]">Maksimal {alive} ekor</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(qty - 1)}
                    disabled={qty <= 1}
                    aria-label="Kurangi jumlah ayam dijual"
                    className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center font-bold text-lg disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black text-[#1B2B22] num">{qty} ekor</span>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(qty + 1)}
                    disabled={qty >= alive}
                    aria-label="Tambah jumlah ayam dijual"
                    className="w-12 h-12 rounded-xl bg-white border border-[#D5DED3] flex items-center justify-center font-bold text-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Layak Jual Warning if below threshold */}
              {!sellableCheck.sellable && (
                <div className="p-3.5 bg-[#FFF4D6] rounded-xl border border-[#8A5A00]/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A5A00]">
                    <AlertTriangle size={18} /> Perhatian: Batch Belum Memenuhi Ambang Layak Jual
                  </div>
                  <ul className="text-xs text-[#8A5A00] list-disc list-inside space-y-0.5">
                    {sellableCheck.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <label className="flex items-center gap-2 pt-1 text-xs font-bold text-[#1B2B22] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideUnsellable}
                      onChange={(e) => setOverrideUnsellable(e.target.checked)}
                      className="w-4 h-4 accent-[#1E6B47]"
                    />
                    Tetap jual (konfirmasi eksplisit peternak)
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Per-bird item details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-xs text-[#4F5B52]">
                Isi rincian per ekor (bobot aktual, harga, dan centang kondisi fisik sehat).
              </div>

              <div className="space-y-3">
                {Array.from({ length: qty }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-[#1B2B22]">
                      <span>Ayam ke-{idx + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={birdHealthChecks[idx] !== false}
                          onChange={(e) => {
                            const newHealth = [...birdHealthChecks];
                            newHealth[idx] = e.target.checked;
                            setBirdHealthChecks(newHealth);
                          }}
                          className="w-4 h-4 accent-[#1E6B47]"
                        />
                        <span className="text-xs text-[#14663A] font-semibold">Lolos cek sehat</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#4F5B52] font-semibold">
                          Bobot (gram)
                        </label>
                        <input
                          type="number"
                          value={birdWeights[idx] || 1000}
                          onChange={(e) => {
                            const newWeights = [...birdWeights];
                            newWeights[idx] = parseInt(e.target.value) || 0;
                            setBirdWeights(newWeights);
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-[#D5DED3] text-sm num"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#4F5B52] font-semibold">
                          Harga Jual (Rp)
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={birdPrices[idx] || 70000}
                          onChange={(e) => {
                            const newPrices = [...birdPrices];
                            newPrices[idx] = parseInt(e.target.value) || 0;
                            setBirdPrices(newPrices);
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-[#D5DED3] text-sm num"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Review & Customer */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#DDF1E3] rounded-xl border border-[#1E6B47]/30 space-y-2">
                <div className="text-xs font-bold text-[#14663A]">Ringkasan Penjualan</div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4F5B52]">Jumlah Ayam:</span>
                  <span className="font-bold text-[#1B2B22]">{qty} ekor</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4F5B52]">Rata-rata Bobot:</span>
                  <span className="font-bold text-[#1B2B22] num">
                    {(birdWeights.reduce((a, b) => a + b, 0) / qty / 1000).toFixed(2)} kg/ekor
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold pt-2 border-t border-[#1E6B47]/20">
                  <span className="text-[#14663A]">Total Penerimaan:</span>
                  <span className="text-[#14663A] num">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#4F5B52] mb-1">
                    Nama Pembeli (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Warung Bu Siti / Tetangga"
                    className="w-full p-2.5 rounded-xl border border-[#D5DED3] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4F5B52] mb-1">
                    Ongkos Kirim (Jika Ada)
                  </label>
                  <input
                    type="number"
                    value={shippingIdr}
                    onChange={(e) => setShippingIdr(parseInt(e.target.value) || 0)}
                    placeholder="Rp 0"
                    className="w-full p-2.5 rounded-xl border border-[#D5DED3] text-sm num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4F5B52] mb-1">Status Bayar</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaid(true)}
                      className={`p-2.5 rounded-xl font-bold text-xs border ${
                        isPaid
                          ? 'bg-[#1E6B47] text-white border-[#1E6B47]'
                          : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                      }`}
                    >
                      Lunas (Tunai/Transfer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaid(false)}
                      className={`p-2.5 rounded-xl font-bold text-xs border ${
                        !isPaid
                          ? 'bg-[#F2B632] text-[#1B2B22] border-[#F2B632]'
                          : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                      }`}
                    >
                      Piutang (Belum Bayar)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4F5B52] mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={saleNote}
                    onChange={(e) => setSaleNote(e.target.value)}
                    placeholder="Catatan transaksi..."
                    className="w-full p-2.5 rounded-xl border border-[#D5DED3] text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-white border-t border-[#D5DED3] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-4 py-3 rounded-xl border border-[#D5DED3] text-sm font-bold text-[#4F5B52] flex items-center gap-1.5"
            >
              <ArrowLeft size={16} /> Kembali
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!sellableCheck.sellable && !overrideUnsellable}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="px-6 py-3 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-bold flex items-center gap-1.5 ml-auto disabled:opacity-40"
            >
              Lanjut <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSale}
              className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs"
            >
              <Check size={18} /> Simpan Penjualan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
