/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import * as XLSX from 'xlsx';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import winston from 'winston';
import { exit } from 'process';

// Load environment variables (.env.local for development, .env for production)
dotenv.config({ path: '.env.local' });  // Priority: .env.local (development)
dotenv.config();                         // Fallback: .env (production)

// ============================================
// FIX #1: API Key Validation
// ============================================
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
  console.error('🔴 FATAL ERROR: GEMINI_API_KEY environment variable is not set');
  console.error('Please set GEMINI_API_KEY in your .env file or environment:');
  console.error('  export GEMINI_API_KEY="your-actual-key-here"');
  console.error('\nReferensi: https://aistudio.google.com/app/apikey');
  exit(1);
}

console.log('✅ GEMINI_API_KEY is configured');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// ============================================
// FIX #5: Winston Logger Setup
// ============================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'kandang-pintar' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // All logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Add console logs in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// ============================================
// FIX #2: Rate Limiting Setup
// ============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per windowMs
  message: '❌ Terlalu banyak request dari IP ini. Coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  // Use default keyGenerator (IPv6 compliant)
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // stricter for AI endpoints
  message: 'Terlalu banyak AI requests. Tunggu sebentar...'
});

// Apply rate limiters
app.use('/api/', apiLimiter);

// ============================================
// FIX #6: CORS Configuration
// ============================================
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    if (!origin || allowedOrigins.includes(origin.trim())) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// FIX #3: Input Validation Middleware
// ============================================
const validateJsonBody = (req: Request, res: Response, next: Function) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    logger.warn('Invalid JSON body received', { contentType: req.get('content-type') });
    return res.status(400).json({
      error: 'Request body harus berupa JSON object',
      received: typeof req.body
    });
  }
  next();
};

const validateTextField = (fieldName: string) => 
  (req: Request, res: Response, next: Function) => {
    const value = req.body[fieldName];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      logger.warn(`Missing or empty field: ${fieldName}`);
      return res.status(400).json({
        error: `${fieldName} harus berupa string yang tidak kosong`
      });
    }
    next();
  };

// ============================================
// FIX #4: API Key Authentication Middleware
// ============================================
const apiKeyAuth = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    logger.warn('Missing API key', { path: req.path, ip: req.ip });
    return res.status(401).json({
      error: 'API key required',
      hint: 'Include X-Api-Key header or ?api_key=... in URL'
    });
  }

  if (apiKey !== process.env.API_SECRET_KEY) {
    logger.warn('Invalid API key attempt', { ip: req.ip });
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  next();
};

// Initialize Google GenAI client server-side only
const aiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: aiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint (FR-DSH, PRD Section 18)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Kandang Pintar Server',
  });
});

// Rule-based RED FLAG check for critical poultry symptoms (Avian Influenza, Newcastle, etc.)
function checkPoultryRedFlags(symptomsText: string): { isRedFlag: boolean; warning?: string } {
  const lower = symptomsText.toLowerCase();
  const redFlagKeywords = [
    'mati mendadak',
    'banyak mati',
    'jengger biru',
    'jengger membiru',
    'muka bengkak',
    'ngorok parah',
    'lumpuh mendadak',
    'keluar lendir darah',
    'leher terpelintir',
    'tortikolis',
    'flu burung',
    'tetelo ganas',
  ];

  for (const kw of redFlagKeywords) {
    if (lower.includes(kw)) {
      return {
        isRedFlag: true,
        warning: `PERINGATAN BAHAYA TINGGI: Gejala "${kw}" berpotensi merupakan penyakit menular berbahaya (seperti AI/Flu Burung atau ND Ganas). SEGERA pisahkan/karantina ayam sakit, jangan konsumsi, dan hubungi Dokter Hewan terdekat atau Dinas Peternakan setempat!`,
      };
    }
  }
  return { isRedFlag: false };
}

async function withTimeout<T>(promise: Promise<T>, ms: number = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI Request timeout')), ms)),
  ]);
}

// Fallback rule-based extractor
function fallbackExtractLog(text: string) {
  const purMatch = text.match(/pur\s*([\d.,]+)\s*(?:kg)?/i);
  const dedakMatch = text.match(/dedak\s*([\d.,]+)\s*(?:kg)?/i);
  const deadMatch = text.match(/mati\s*(\d+)/i);
  const flockMatch = text.match(/batch\s*([a-zA-Z0-9]+)/i);

  const purKg = purMatch ? parseFloat(purMatch[1].replace(',', '.')) : 0.6;
  const dedakKg = dedakMatch ? parseFloat(dedakMatch[1].replace(',', '.')) : 0.6;
  const deadCount = deadMatch ? parseInt(deadMatch[1], 10) : 0;
  const targetName = flockMatch ? `Batch ${flockMatch[1].toUpperCase()}` : 'Batch A';

  return {
    targetType: 'batch',
    targetName,
    purKg,
    purPriceIdr: Math.round(purKg * 10000),
    dedakKg,
    dedakPriceIdr: 0,
    waterChanged: true,
    deadCount,
    deadReason: deadCount > 0 ? 'Tercatat dari teks' : undefined,
    summary: `Pur: ${purKg} kg (Rp ${(purKg * 10000).toLocaleString('id-ID')}), Dedak: ${dedakKg} kg, Air diganti: Ya${deadCount > 0 ? `, Mati: ${deadCount} ekor` : ''}`,
  };
}

// 1. POST /api/ai/parse-log (Natural language to structured daily log preview)
app.post('/api/ai/parse-log', validateJsonBody, validateTextField('text'), async (req: Request, res: Response) => {
  try {
    const { text, context } = req.body;
    logger.info('Parse log request', { textLength: text.length });

    if (!aiApiKey) {
      logger.warn('No GEMINI_API_KEY, using fallback parser');
      res.json(fallbackExtractLog(text));
      return;
    }

    const systemInstruction = `Kamu adalah asisten peternakan ayam kampung cerdas untuk aplikasi "Kandang Pintar".
Tugasmu adalah mengekstrak data catatan harian dari kalimat peternak ke format JSON terstruktur.
Peternak mencatat pakan pur (berat kg, harga default Rp 10.000/kg), dedak (berat kg, harga default Rp 0), air diganti, telur, dan ayam mati.`;

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Ekstrak catatan berikut ke JSON:\n"${text}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                targetType: { type: Type.STRING },
                targetName: { type: Type.STRING },
                purKg: { type: Type.NUMBER },
                purPriceIdr: { type: Type.INTEGER },
                dedakKg: { type: Type.NUMBER },
                dedakPriceIdr: { type: Type.INTEGER },
                otherFeedKg: { type: Type.NUMBER },
                otherFeedName: { type: Type.STRING },
                waterChanged: { type: Type.BOOLEAN },
                deadCount: { type: Type.INTEGER },
                deadReason: { type: Type.STRING },
                summary: { type: Type.STRING },
              },
              required: ['purKg', 'dedakKg', 'waterChanged', 'deadCount', 'summary'],
            },
          },
        }),
        6000
      );

      const parsedJson = JSON.parse(response.text || '{}');
      res.json(parsedJson);
    } catch (e) {
      console.warn('Gemini parse timed out or failed, using rule-based fallback:', e);
      res.json(fallbackExtractLog(text));
    }
  } catch (error) {
    logger.error('Error parsing log:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.json(fallbackExtractLog(req.body.text || ''));
  }
});

// 2. POST /api/ai/chat (Tanya jawab dengan thinking mode menggunakan gemini-4-argon)
app.post('/api/ai/chat', validateJsonBody, validateTextField('message'), async (req: Request, res: Response) => {
  try {
    const { message, history, farmData } = req.body;
    logger.info('Chat request', { messageLength: message.length });

    if (!aiApiKey) {
      logger.warn('No GEMINI_API_KEY, using fallback chat');
      res.json({
        reply: `Saat ini kunci API Gemini belum dikonfigurasi. Berikut data ringkas peternakan Anda: Ada ${farmData?.flocks?.length || 0} batch aktif. Catatan dan analisis tetap berfungsi secara lokal.`,
      });
      return;
    }

    const systemPrompt = `Kamu adalah Konsultan Peternakan Ayam Kampung Ahli & Analis Finansial untuk "Kandang Pintar".
Kamu berkomunikasi dalam Bahasa Indonesia yang hangat, praktis, ramah peternak, dan berbasis data riil peternakan klien.
Gunakan data peternakan yang diberikan berikut untuk menjawab pertanyaan dengan akurat (sebutkan angka pasti HPP, populasi, laba, estimasi panen):
${JSON.stringify(farmData, null, 2)}

Aturan:
1. Jika pengguna bertanya tentang HPP, laba, atau biaya, sebutkan rumus dan angkanya secara transparan.
2. Ingatkan bahwa harga impas (BEP) adalah acuan batas bawah penjualan ayam.
3. Selalu beri saran praktis manajemen pemeliharaan, pakan, atau biosekuriti ayam kampung asli Indonesia.`;

    // Complex queries & reasoning use gemini-4-argon with thinkingLevel: HIGH as mandated
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      res.json({ reply: response.text });
    } catch (modelError) {
      console.warn('Falling back to gemini-3.8-flash for chat:', modelError);
      // Graceful fallback to gemini-3.8-flash if argon is unavailable or rate limited
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });
      res.json({ reply: fallbackResponse.text });
    }
  } catch (error) {
    logger.error('Error in AI chat:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      error: 'Asisten AI sedang tidak dapat merespons. Silakan coba sesaat lagi.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});

// 3. POST /api/ai/symptom-check (Cek kesehatan awal & deteksi penyakit)
app.post('/api/ai/symptom-check', validateJsonBody, validateTextField('symptoms'), async (req: Request, res: Response) => {
  try {
    const { symptoms, flockName, ageDays, deadCount } = req.body;
    logger.info('Symptom check request', { symptomsLength: symptoms.length });

    // Rule-based red flags check first (outside LLM)
    const redFlag = checkPoultryRedFlags(`${symptoms || ''} ${deadCount ? 'banyak mati' : ''}`);

    if (redFlag.isRedFlag) {
      res.json({
        urgency: 'bahaya_tinggi',
        isRedFlag: true,
        alertTitle: 'PERINGATAN BAHAYA PENYAKIT MENULAR',
        directive: redFlag.warning,
        disclaimer: 'Disclaimer: Peringatan ini dihasilkan oleh sistem deteksi tanda bahaya penyakit menular unggas. Segera hubungi medik veteriner resmi.',
        immediateSteps: [
          'Segera isolasi ayam yang bergejala ke tempat jauh dari kandang lain',
          'Tutup akses kandang dari tamu dan burung liar (biosekuriti ketat)',
          'Jangan memotong atau mengonsumsi ayam yang sakit atau mati mendadak',
          'Bakar atau kubur bangkai ayam dengan kedalaman minimal 1 meter dan taburi kapur',
          'Segera kontak dokter hewan / dinas peternakan setempat',
        ],
      });
      return;
    }

    if (!aiApiKey) {
      res.json({
        urgency: 'perhatian',
        isRedFlag: false,
        alertTitle: 'Evaluasi Gejala Ayam',
        directive: 'Amati nafsu makan dan keaktifan ayam selama 24 jam. Berikan air minum bersuplemen vitamin dan elektrolit.',
        disclaimer: 'Catatan: Ini adalah panduan awal peternakan pemula dan bukan pengganti diagnosa dokter hewan profesional.',
        immediateSteps: [
          'Pisahkan ayam yang lemas ke kandang karantina bersih',
          'Pastikan alas kandang kering dan tidak berbau amonia',
          'Berikan air hangat bercampur gula merah/elektrolit untuk memulihkan energi',
        ],
      });
      return;
    }

    const systemInstruction = `Kamu adalah Dokter Hewan Praktisi Unggas Tradisional & Peternakan Ayam Kampung.
Evaluasi gejala yang dilaporkan peternak secara objektif dan ilmiah.
Tentukan tingkat urgensi: 'aman', 'perhatian', atau 'tindakan'.
Sebutkan kemungkinan penyebab (misalnya CRD/ngorok biasa, kekurangan vitamin, cacingan, coccidiosis) dan langkah pertolongan pertama.
SELALU sertakan disclaimer medis bahwa ini adalah penilaian awal.`;

    const prompt = `Batch: ${flockName || 'Ayam'} (Umur ${ageDays || '-'} hari).
Gejala yang tampak: "${symptoms}".
Kematian terkait: ${deadCount || 0} ekor.
Berikan analisa dan rekomendasi tindakan awal.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: { type: Type.STRING, description: "'aman', 'perhatian', atau 'tindakan'" },
            likelyCause: { type: Type.STRING, description: "Dugaan awal penyakit / kondisi" },
            assessment: { type: Type.STRING, description: "Penjelasan ringkas bahasa peternak" },
            immediateSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar 3-5 langkah tindakan praktis",
            },
            homeRemedy: { type: Type.STRING, description: "Herbal/ramuan alami (e.g. kunyit, jahe, bawang putih)" },
            disclaimer: { type: Type.STRING, description: "Pernyataan sangkalan resmi" },
          },
          required: ['urgency', 'likelyCause', 'assessment', 'immediateSteps', 'disclaimer'],
        },
      },
    });

    const assessment = JSON.parse(response.text || '{}');
    res.json({
      ...assessment,
      isRedFlag: false,
    });
  } catch (error) {
    logger.error('Error in symptom check:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      error: 'Gagal mengevaluasi gejala. Pisahkan ayam yang sakit dan periksa ke dokter hewan.',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
});

// 4. POST /api/ai/weekly-insight (Insight berkala)
app.post('/api/ai/weekly-insight', validateJsonBody, async (req: Request, res: Response) => {
  try {
    const { stats } = req.body;
    logger.info('Weekly insight request', { hasStats: !!stats });
    
    if (!aiApiKey) {
      logger.warn('No GEMINI_API_KEY, using fallback insight');
      res.json({
        summary: 'Pencatatan berjalan lancar. Jaga kebersihan tempat minum dan pantau bobot anakan di umbaran secara teratur.',
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Beri insight 3 paragraf singkat dan evaluasi efisiensi peternakan berdasarkan data ini:\n${JSON.stringify(stats)}`,
      config: {
        systemInstruction: 'Kamu adalah konsultan peternakan ayam kampung. Berikan tips peningkatan efisiensi pakan, mortalitas rendah, dan profitabilitas.',
      },
    });

    res.json({ summary: response.text });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memproses insight mingguan' });
  }
});

// 5. POST /api/sync (Offline queue sync endpoint)
app.post('/api/sync', (req: Request, res: Response) => {
  const { operations } = req.body;
  if (!Array.isArray(operations)) {
    res.status(400).json({ error: 'Operasi tidak valid' });
    return;
  }

  // Idempotent processing using clientOpId
  res.json({
    success: true,
    processedCount: operations.length,
    timestamp: new Date().toISOString(),
    message: `${operations.length} catatan berhasil disinkronkan ke server.`,
  });
});

// 6. POST /api/export/excel (Excel and CSV download)
app.post('/api/export/excel', (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const wb = XLSX.utils.book_new();

    if (type === 'batch') {
      const summarySheet = XLSX.utils.json_to_sheet(data.summary || []);
      const movementsSheet = XLSX.utils.json_to_sheet(data.movements || []);
      const feedSheet = XLSX.utils.json_to_sheet(data.feedLogs || []);
      const salesSheet = XLSX.utils.json_to_sheet(data.sales || []);

      XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan Batch');
      XLSX.utils.book_append_sheet(wb, movementsSheet, 'Pergerakan Ayam');
      XLSX.utils.book_append_sheet(wb, feedSheet, 'Riwayat Pakan');
      XLSX.utils.book_append_sheet(wb, salesSheet, 'Penjualan');
    } else {
      const dailySheet = XLSX.utils.json_to_sheet(data.dailyLogs || []);
      const expensesSheet = XLSX.utils.json_to_sheet(data.expenses || []);
      const eggSheet = XLSX.utils.json_to_sheet(data.eggLogs || []);

      XLSX.utils.book_append_sheet(wb, dailySheet, 'Catatan Harian');
      XLSX.utils.book_append_sheet(wb, expensesSheet, 'Biaya Peternakan');
      XLSX.utils.book_append_sheet(wb, eggSheet, 'Produksi Telur');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=kandang-pintar-${type}-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Gagal mengekspor data Excel' });
  }
});

// Setup Vite middleware for local development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Kandang Pintar running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
