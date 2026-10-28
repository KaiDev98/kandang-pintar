/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ExpenseCategory } from '../../domain/types.ts';
import { X, Check } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedFlockId?: string;
}

const CATEGORIES: Array<{ id: ExpenseCategory; name: string }> = [
  { id: 'pakan', name: 'Pakan (Karungan / Dedak)' },
  { id: 'obat_vitamin', name: 'Obat & Vitamin Unggas' },
  { id: 'vaksin', name: 'Vaksinasi' },
  { id: 'listrik', name: 'Listrik (Pemanas/Lampu)' },
  { id: 'air', name: 'Air Bersih' },
  { id: 'peralatan', name: 'Peralatan Kandang (Tempat Minum/Pakan)' },
  { id: 'perbaikan_kandang', name: 'Bahan Perbaikan Kandang' },
  { id: 'tenaga_kerja', name: 'Upah / Tenaga Kerja' },
  { id: 'transportasi', name: 'Bensin / Transportasi' },
  { id: 'indukan', name: 'Pembelian Indukan Baru' },
  { id: 'lain_lain', name: 'Biaya Lain-lain' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  preselectedFlockId,
}) => {
  const { state, addExpense } = useApp();

  const [categoryId, setCategoryId] = useState<ExpenseCategory>('pakan');
  const [amountIdr, setAmountIdr] = useState<number>(50000);
  const [spentOn, setSpentOn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [allocation, setAllocation] = useState<'direct' | 'general'>(
    preselectedFlockId ? 'direct' : 'general'
  );
  const [flockId, setFlockId] = useState<string>(preselectedFlockId || state.flocks[0]?.id || '');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountIdr <= 0) return;

    addExpense({
      categoryId,
      categoryName: selectedCategory?.name || 'Biaya Operasional',
      amountIdr,
      spentOn,
      allocation,
      flockId: allocation === 'direct' ? flockId : undefined,
      note,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="expense-title" className="text-xl font-extrabold text-[#1B2B22]">
              Tambah Biaya
            </h2>
            <p className="text-xs text-[#4F5B52]">Catat pengeluaran peternakan</p>
          </div>
          <button onClick={onClose} aria-label="Tutup form biaya" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Kategori Biaya</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as ExpenseCategory)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Jumlah Uang (Rupiah)</label>
            <input
              type="number"
              step="1000"
              value={amountIdr || ''}
              onChange={(e) => setAmountIdr(parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-[#D5DED3] rounded-xl text-lg font-black text-[#1B2B22] num"
              placeholder="Contoh: 50000"
            />
            <p className="text-xs text-[#1E6B47] font-semibold mt-1">
              Rp {amountIdr.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Tanggal</label>
              <input
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Jenis Alokasi</label>
              <select
                value={allocation}
                onChange={(e) => setAllocation(e.target.value as 'direct' | 'general')}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm bg-white"
              >
                <option value="general">Umum (Ekor-Hari)</option>
                <option value="direct">Langsung ke Batch</option>
              </select>
            </div>
          </div>

          {allocation === 'direct' && (
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Pilih Batch Tujuan</label>
              <select
                value={flockId}
                onChange={(e) => setFlockId(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm bg-white"
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
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Keterangan / Nota</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Beli 2 bungkus Vitachick di Toko Tani"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={amountIdr <= 0}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <Check size={18} /> Simpan Biaya
          </button>
        </form>
      </div>
    </div>
  );
};
