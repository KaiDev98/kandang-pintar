/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string, payload?: Record<string, unknown>) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { state, dismissAlert } = useApp();

  if (!isOpen) return null;

  const alerts = state.alerts;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="notif-title" className="text-xl font-extrabold text-[#1B2B22]">
              Pusat Peringatan &amp; Notifikasi
            </h2>
            <p className="text-xs text-[#4F5B52]">{alerts.length} pengingat aktif</p>
          </div>
          <button onClick={onClose} aria-label="Tutup notifikasi" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-[#4F5B52]">
              <div className="w-12 h-12 rounded-full bg-[#DDF1E3] text-[#14663A] flex items-center justify-center mx-auto mb-2">
                <Check size={24} />
              </div>
              <p className="font-bold text-sm text-[#1B2B22]">Semua Aman!</p>
              <p className="text-xs">Tidak ada peringatan atau tugas mendesak saat ini.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isTindakan = alert.level === 'tindakan';
              const isPerhatian = alert.level === 'perhatian';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTindakan
                      ? 'bg-[#FBE3E0] border-[#B3261E]/30 text-[#9C1C16]'
                      : isPerhatian
                      ? 'bg-[#FFF4D6] border-[#8A5A00]/30 text-[#8A5A00]'
                      : 'bg-[#F1F5EF] border-[#D5DED3] text-[#1B2B22]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {isTindakan ? (
                        <AlertCircle size={18} className="text-[#B3261E] shrink-0" />
                      ) : isPerhatian ? (
                        <AlertTriangle size={18} className="text-[#8A5A00] shrink-0" />
                      ) : (
                        <Info size={18} className="text-[#1E6B47] shrink-0" />
                      )}
                      <span className="font-extrabold text-sm text-[#1B2B22]">
                        {alert.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs text-[#4F5B52] hover:text-[#1B2B22] px-1 font-semibold"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="text-xs text-[#4F5B52] mb-3 leading-relaxed">
                    {alert.description}
                  </p>
                  {alert.actionText && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab(alert.actionRoute || 'beranda', alert.actionPayload);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs active:scale-95 transition-all ${
                        isTindakan
                          ? 'bg-[#B3261E] text-white hover:bg-[#8f1e18]'
                          : isPerhatian
                          ? 'bg-[#F2B632] text-[#1B2B22] hover:bg-[#dfa62a]'
                          : 'bg-[#1E6B47] text-white hover:bg-[#165538]'
                      }`}
                    >
                      {alert.actionText} &rsaquo;
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
