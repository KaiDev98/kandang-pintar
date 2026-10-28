/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Send,
  Sparkles,
  Check,
  Edit2,
  AlertTriangle,
  AlertCircle,
  Stethoscope,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface ParsedLogPreview {
  targetName?: string;
  targetType?: string;
  purKg: number;
  purPriceIdr: number;
  dedakKg: number;
  dedakPriceIdr: number;
  otherFeedKg?: number;
  otherFeedName?: string;
  waterChanged: boolean;
  deadCount: number;
  deadReason?: string;
  eggs?: Array<{ henCode: string; count: number }>;
  summary: string;
}

export const AssistantView: React.FC = () => {
  const { state, logDaily, showToast } = useApp();

  const [mode, setMode] = useState<'catat' | 'tanya' | 'kesehatan'>('catat');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mode Catat preview card
  const [parsedPreview, setParsedPreview] = useState<ParsedLogPreview | null>(null);

  // Mode Tanya chat history
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: 'Halo Pak! Saya Asisten AI Kandang Pintar. Anda dapat mencatat kegiatan dengan bahasa santai, menanyakan HPP & laba, atau cek kesehatan awal ayam.',
      time: 'Baru saja',
    },
  ]);

  // Mode Kesehatan state
  const [symptomText, setSymptomText] = useState<string>('');
  const [symptomDeadCount, setSymptomDeadCount] = useState<number>(0);
  const [symptomResult, setSymptomResult] = useState<any | null>(null);

  // Handle parsing natural language for Catat mode
  const handleParseLog = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/parse-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          context: {
            flocks: state.flocks.map((f) => ({ id: f.id, name: f.name })),
            birds: state.birds.map((b) => ({ id: b.id, code: b.code })),
          },
        }),
      });

      if (!response.ok) throw new Error('Gagal parsing data');
      const data = await response.json();
      setParsedPreview(data);
    } catch (e) {
      console.error(e);
      // Graceful offline/local parsing fallback
      const pur = inputText.match(/pur\s*([\d.,]+)/i)?.[1] || '0.6';
      const dedak = inputText.match(/dedak\s*([\d.,]+)/i)?.[1] || '0.6';
      setParsedPreview({
        purKg: parseFloat(pur.replace(',', '.')),
        purPriceIdr: Math.round(parseFloat(pur.replace(',', '.')) * (state.settings.defaultPurPriceIdr || 10000)),
        dedakKg: parseFloat(dedak.replace(',', '.')),
        dedakPriceIdr: 0,
        waterChanged: true,
        deadCount: inputText.match(/mati\s*(\d+)/i)?.[1] ? parseInt(inputText.match(/mati\s*(\d+)/i)![1], 10) : 0,
        summary: `Catatan dari: "${inputText}"`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm save from preview card
  const handleSaveParsedPreview = async () => {
    if (!parsedPreview) return;
    setIsLoading(true);

    try {
      const targetFlock = state.flocks.find(
        (f) =>
          parsedPreview.targetName &&
          f.name.toLowerCase().includes(parsedPreview.targetName.toLowerCase())
      );
      const targetId = targetFlock ? targetFlock.id : state.flocks[0]?.id || 'indukan';

      await logDaily({
        targetId,
        purKg: parsedPreview.purKg || 0,
        purPriceIdr: parsedPreview.purPriceIdr || 0,
        dedakKg: parsedPreview.dedakKg || 0,
        dedakPriceIdr: parsedPreview.dedakPriceIdr || 0,
        otherFeedKg: parsedPreview.otherFeedKg,
        otherFeedName: parsedPreview.otherFeedName,
        waterChanged: parsedPreview.waterChanged !== false,
        deadCount: parsedPreview.deadCount || 0,
        deadReason: parsedPreview.deadReason,
      });

      setParsedPreview(null);
      setInputText('');
      showToast('Data dari Asisten AI berhasil disimpan ke catatan ✓');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Chat in Mode Tanya (with Thinking Mode)
  const handleSendChat = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText('');

    const newChat = [...chatMessages, { sender: 'user' as const, text: userMsg, time: 'Sekarang' }];
    setChatMessages(newChat);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: newChat,
          farmData: {
            flocks: state.flocks,
            birds: state.birds,
            settings: state.settings,
            salesCount: state.sales.length,
          },
        }),
      });

      if (!response.ok) throw new Error('Respon error');
      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply || 'Data peternakan telah dianalisis.', time: 'Baru saja' },
      ]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Asisten AI sedang offline. Anda tetap dapat melihat data di tab Beranda, Ayam, dan Keuangan.',
          time: 'Baru saja',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Symptom Check
  const handleCheckSymptom = async () => {
    if (!symptomText.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomText,
          deadCount: symptomDeadCount,
        }),
      });
      const data = await response.json();
      setSymptomResult(data);
    } catch (e) {
      console.error(e);
      setSymptomResult({
        urgency: 'perhatian',
        likelyCause: 'Evaluasi Offline',
        assessment: 'Karantina ayam sakit dan berikan air minum elektrolit hangat.',
        immediateSteps: ['Pisahkan ayam dari kelompok', 'Jaga kandang tetap kering'],
        disclaimer: 'Disclaimer: Bukan pengganti dokter hewan profesional.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header and Mode Selector */}
      <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F2B632] text-[#1B2B22] flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1B2B22]">Asisten Kandang Pintar</h2>
            <p className="text-xs text-[#4F5B52]">Didukung AI analisis mendalam &amp; data peternakan</p>
          </div>
        </div>

        {/* 3 Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5EF] rounded-xl border border-[#D5DED3]">
          <button
            type="button"
            onClick={() => {
              setMode('catat');
              setParsedPreview(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'catat' ? 'bg-white text-[#1E6B47] shadow-xs' : 'text-[#4F5B52]'
            }`}
          >
            Catat Bicara
          </button>
          <button
            type="button"
            onClick={() => setMode('tanya')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'tanya' ? 'bg-white text-[#1E6B47] shadow-xs' : 'text-[#4F5B52]'
            }`}
          >
            Tanya Data
          </button>
          <button
            type="button"
            onClick={() => setMode('kesehatan')}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'kesehatan' ? 'bg-white text-[#1E6B47] shadow-xs' : 'text-[#4F5B52]'
            }`}
          >
            Cek Gejala
          </button>
        </div>
      </div>

      {/* MODE 1: CATAT BAHASA NATURAL */}
      {mode === 'catat' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] space-y-3">
            <label className="block text-xs font-bold text-[#4F5B52] uppercase">
              Ketik Kalimat Catatan Anda
            </label>
            <p className="text-xs text-[#4F5B52]">
              Contoh: <em>"tadi pagi kasih pur 0.8 kg, dedak 0.5 kg di batch A, air sudah diganti, mati 1 ekor kedinginan"</em>
            </p>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis kegiatan kandang dengan bahasa bebas..."
              className="w-full p-3 border border-[#D5DED3] rounded-xl text-sm"
            />

            <button
              type="button"
              disabled={isLoading || !inputText.trim()}
              onClick={handleParseLog}
              className="w-full py-3 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
            >
              <Sparkles size={16} />
              {isLoading ? 'Mengekstrak Data...' : 'Analisis & Pratinjau Catatan'}
            </button>
          </div>

          {/* Kartu Pratinjau (FR-AI-01 & Section 6.5) */}
          {parsedPreview && (
            <div className="p-5 bg-white rounded-2xl border-2 border-[#1E6B47] shadow-md space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-[#D5DED3] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1E6B47]">
                  <Check size={16} /> Pratinjau Catatan Terstruktur
                </div>
                <span className="text-[10px] text-[#4F5B52]">Belum tersimpan</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Pakan Pur:</span>
                  <span className="font-bold text-[#1B2B22] num">
                    {parsedPreview.purKg} kg (Rp {parsedPreview.purPriceIdr.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Pakan Dedak:</span>
                  <span className="font-bold text-[#1B2B22] num">
                    {parsedPreview.dedakKg} kg (Rp {parsedPreview.dedakPriceIdr.toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5B52]">Air Minum Diganti:</span>
                  <span className="font-bold text-[#14663A]">
                    {parsedPreview.waterChanged ? 'Ya ✓' : 'Tidak'}
                  </span>
                </div>
                {parsedPreview.deadCount > 0 && (
                  <div className="flex justify-between text-[#B3261E]">
                    <span>Ayam Mati:</span>
                    <span className="font-bold num">
                      {parsedPreview.deadCount} ekor ({parsedPreview.deadReason || 'Kematian harian'})
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-[#F1F5EF] rounded-xl text-[11px] text-[#4F5B52]">
                {parsedPreview.summary}
              </div>

              {/* Action Buttons: Simpan & Ubah */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedPreview(null)}
                  className="py-2.5 border border-[#D5DED3] rounded-xl text-xs font-bold text-[#4F5B52] flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} /> Ubah Kalimat
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSaveParsedPreview}
                  className="py-2.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs"
                >
                  <Check size={16} /> Simpan Catatan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: TANYA DATA DENGAN THINKING MODE */}
      {mode === 'tanya' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3 min-h-[300px] flex flex-col justify-between">
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1E6B47] text-white rounded-tr-xs'
                        : 'bg-[#F1F5EF] text-[#1B2B22] border border-[#D5DED3] rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-[#F1F5EF] text-[#4F5B52] text-xs rounded-2xl border border-[#D5DED3] flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin text-[#F2B632]" />
                    <span>Menganalisis data peternakan secara mendalam...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#D5DED3]">
              {[
                'Berapa HPP batch saat ini?',
                'Kapan estimasi panen?',
                'Evaluasi efisiensi pakan',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setInputText(q);
                  }}
                  className="px-2.5 py-1 bg-[#F1F5EF] hover:bg-[#e4ece1] rounded-lg text-[11px] text-[#4F5B52] font-semibold transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
                placeholder="Tanyakan analisis peternakan..."
                className="flex-1 p-2.5 border border-[#D5DED3] rounded-xl text-xs"
              />
              <button
                type="button"
                disabled={isLoading || !inputText.trim()}
                onClick={handleSendChat}
                className="px-4 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: CEK GEJALA KESEHATAN (RULE-BASED RED FLAGS + LLM) */}
      {mode === 'kesehatan' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#D5DED3] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B2B22]">
              <Stethoscope size={18} className="text-[#1E6B47]" />
              <span>Cek Gejala &amp; Tanda Penyakit Ayam</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4F5B52] mb-1">
                Deskripsikan Gejala yang Muncul
              </label>
              <textarea
                rows={2}
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="Contoh: ayam bersin ngorok, nafsu makan turun, atau jengger pucat..."
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4F5B52] mb-1">
                Jumlah Ayam Mati Terkait (Jika Ada)
              </label>
              <input
                type="number"
                value={symptomDeadCount}
                onChange={(e) => setSymptomDeadCount(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-[#D5DED3] rounded-xl text-xs num"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || !symptomText.trim()}
              onClick={handleCheckSymptom}
              className="w-full py-2.5 bg-[#1E6B47] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Stethoscope size={16} /> Evaluasi Gejala Awal
            </button>
          </div>

          {/* Results Card */}
          {symptomResult && (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                symptomResult.isRedFlag
                  ? 'bg-[#FBE3E0] border-[#B3261E] text-[#9C1C16]'
                  : 'bg-white border-[#D5DED3]'
              }`}
            >
              {symptomResult.isRedFlag ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm text-[#B3261E]">
                    <AlertTriangle size={20} />
                    <span>{symptomResult.alertTitle}</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">{symptomResult.directive}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase text-[#1E6B47]">
                      Dugaan Awal:
                    </span>
                    <strong className="text-xs font-bold text-[#1B2B22]">
                      {symptomResult.likelyCause}
                    </strong>
                  </div>
                  <p className="text-xs text-[#4F5B52]">{symptomResult.assessment}</p>
                </div>
              )}

              {/* Immediate steps */}
              {symptomResult.immediateSteps && (
                <div className="space-y-1 pt-2 border-t border-black/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider block">
                    Langkah Pertolongan Pertama:
                  </span>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {symptomResult.immediateSteps.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {symptomResult.disclaimer && (
                <div className="text-[10px] text-[#4F5B52] italic pt-2 border-t border-black/10">
                  {symptomResult.disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
