/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { state, completeOnboarding, resetDemoData } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [farmName, setFarmName] = useState<string>(state.settings.farmName || 'Peternakan Ayam Kampung');
  const [defaultPurPrice, setDefaultPurPrice] = useState<number>(state.settings.defaultPurPriceIdr || 10000);

  if (!isOpen) return null;

  const handleFinish = () => {
    completeOnboarding({ farmName, defaultPurPrice });
    onClose();
  };

  const handleUseDemo = () => {
    resetDemoData();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D5DED3] overflow-hidden flex flex-col">
        {/* Top visual banner */}
        <div className="bg-[#1E6B47] text-white p-6 text-center">
          <span className="text-3xl mb-1 block">🐔</span>
          <h2 id="onboarding-title" className="text-2xl font-black">
            Selamat Datang di Kandang Pintar
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Sistem manajemen peternakan ayam kampung modern, cepat, dan siap pakai.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-between items-center px-6 pt-4 text-xs font-bold text-[#4F5B52]">
          <span>Langkah {step} dari 3</span>
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-xs text-[#1E6B47] font-extrabold flex items-center gap-1 hover:underline"
          >
            <Sparkles size={14} className="text-[#F2B632]" /> Coba dengan Data Contoh
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-[#1B2B22]">
                1. Beri Nama Peternakan Anda
              </h3>
              <p className="text-xs text-[#4F5B52]">
                Nama ini akan muncul pada laporan dan dashboard peternakan Anda.
              </p>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Contoh: Peternakan Berkah Sejahtera"
                className="w-full p-3 border border-[#D5DED3] rounded-xl text-sm font-semibold"
              />
              <div className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] text-xs text-[#4F5B52]">
                Sistem otomatis menyiapkan <strong>2 Kandang</strong> (Kapasitas 25) dan <strong>2 Tempat Pengeraman</strong> sesuai standar awal.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-[#1B2B22]">
                2. Pendaftaran Indukan Awal
              </h3>
              <p className="text-xs text-[#4F5B52]">
                Sesuai perencanaan, peternakan Anda dimulai dengan 4 ekor indukan terdaftar:
              </p>
              <div className="space-y-2">
                {[
                  { name: 'Jantan 1', desc: 'Pejantan utama tangguh' },
                  { name: 'Betina 1', desc: 'Induk betina produktif' },
                  { name: 'Betina 2', desc: 'Induk betina produktif' },
                  { name: 'Betina 3', desc: 'Induk betina produktif' },
                ].map((bird, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] flex justify-between items-center text-xs"
                  >
                    <span className="font-bold text-[#1B2B22]">{bird.name}</span>
                    <span className="text-[#4F5B52]">{bird.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-[#1B2B22]">
                3. Harga Standar Pakan Pur
              </h3>
              <p className="text-xs text-[#4F5B52]">
                Harga ini dipakai untuk menghitung biaya harian pakan otomatis (dedak dihitung Rp 0).
              </p>
              <div>
                <label className="block text-xs font-bold text-[#4F5B52] mb-1">
                  Harga Pur per Kilogram (Rupiah)
                </label>
                <input
                  type="number"
                  step="500"
                  value={defaultPurPrice}
                  onChange={(e) => setDefaultPurPrice(parseInt(e.target.value) || 10000)}
                  className="w-full p-3 border border-[#D5DED3] rounded-xl text-lg font-black text-[#1B2B22] num"
                />
              </div>
              <div className="p-3 bg-[#DDF1E3] rounded-xl text-xs text-[#14663A] font-semibold">
                ✓ Siap! Anda dapat langsung mulai mencatat pakan, telur, dan pengeraman pertama.
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                className="px-4 py-2.5 border border-[#D5DED3] rounded-xl text-xs font-bold text-[#4F5B52]"
              >
                Kembali
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className="px-5 py-2.5 bg-[#1E6B47] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto"
              >
                Lanjut <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check size={16} /> Masuk ke Peternakan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
