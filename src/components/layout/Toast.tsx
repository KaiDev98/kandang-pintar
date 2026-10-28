/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Check, AlertTriangle, AlertCircle, Info, RotateCcw } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-[#1B2B22] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-white/10"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {toast.type === 'error' ? (
          <AlertCircle size={18} className="text-[#B3261E] shrink-0" />
        ) : toast.type === 'warn' ? (
          <AlertTriangle size={18} className="text-[#F2B632] shrink-0" />
        ) : toast.type === 'info' ? (
          <Info size={18} className="text-[#2F6F9F] shrink-0" />
        ) : (
          <Check size={18} className="text-[#5CC08A] shrink-0" />
        )}
        <span className="text-xs font-semibold leading-snug truncate">
          {toast.message}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {toast.undoAction && (
          <button
            type="button"
            onClick={() => {
              toast.undoAction?.();
              clearToast();
            }}
            className="text-xs font-black text-[#F2B632] hover:underline flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg"
          >
            <RotateCcw size={12} /> Urungkan
          </button>
        )}
        <button
          type="button"
          onClick={clearToast}
          aria-label="Tutup notifikasi pesan"
          className="text-white/60 hover:text-white text-xs px-1"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
