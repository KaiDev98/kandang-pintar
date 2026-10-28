# 🎯 KANDANG PINTAR - IMPLEMENTATION RECOMMENDATIONS

**Document Date:** 28 Oktober 2026  
**Priority Level:** CRITICAL → HIGH → MEDIUM  
**Estimated Implementation Time:** 4-8 jam kerja

---

## 🔴 CRITICAL FIXES (Lakukan Hari Ini)

### FIX #1: API Key Validation

**File:** `server.ts`  
**Priority:** 🔴 CRITICAL (blocking production)  
**Time:** 10 menit

**Problem:**
```typescript
// CURRENT - DANGEROUS
const aiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: aiApiKey,  // Bisa berupa string kosong!
});
```

**Solution:**
```typescript
// RECOMMENDED
import { exit } from 'process';

// Add this after dotenv.config()
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
  console.error('🔴 FATAL ERROR: GEMINI_API_KEY environment variable is not set');
  console.error('Please set GEMINI_API_KEY in your .env file or environment:');
  console.error('  export GEMINI_API_KEY="your-actual-key-here"');
  console.error('\nReferensi: https://aistudio.google.com/app/apikey');
  exit(1);
}

console.log('✅ GEMINI_API_KEY is configured');

const aiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: aiApiKey,
});
```

---

### FIX #2: Implement Rate Limiting

**File:** `server.ts`  
**Priority:** 🔴 CRITICAL (DDoS protection)  
**Time:** 20 menit  
**Steps:**

1. Install dependency:
```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

2. Add to `server.ts`:
```typescript
import rateLimit from 'express-rate-limit';

// After app initialization
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per windowMs
  message: '❌ Terlalu banyak request dari IP ini. Coba lagi dalam 15 menit.',
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  skip: (req) => req.path === '/api/health', // Don't limit health checks
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy, otherwise use IP
    return req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
  }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // stricter for AI endpoints
  message: 'Terlalu banyak AI requests. Tunggu sebentar...'
});

// Apply limiters
app.use('/api/', apiLimiter);
app.post('/api/ai/*', strictLimiter); // Stricter for AI
```

---

### FIX #3: Add Input Validation Middleware

**File:** `server.ts`  
**Priority:** 🔴 CRITICAL (prevent crashes)  
**Time:** 30 menit

Add validation middleware sebelum error handler:

```typescript
// Validation middleware
const validateJsonBody = (req: Request, res: Response, next: Function) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      error: 'Request body harus berupa JSON object',
      received: typeof req.body
    });
  }
  next();
};

// For endpoints yang expect text
const validateTextField = (fieldName: string) => 
  (req: Request, res: Response, next: Function) => {
    const value = req.body[fieldName];
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return res.status(400).json({
        error: `${fieldName} harus berupa string yang tidak kosong`
      });
    }
    next();
  };

// Apply to endpoints
app.post('/api/ai/parse-log', validateJsonBody, validateTextField('text'), async (req, res) => {
  const { text } = req.body;
  try {
    // ... existing code
  } catch (error) {
    console.error('Error parsing log:', error);
    res.status(500).json({
      error: 'Gagal memproses catatan. Coba lagi atau hubungi support.'
    });
  }
});

app.post('/api/ai/chat', validateJsonBody, validateTextField('message'), async (req, res) => {
  const { message } = req.body;
  // ... rest of code
});

app.post('/api/ai/symptom-check', validateJsonBody, validateTextField('symptoms'), async (req, res) => {
  const { symptoms } = req.body;
  // ... rest of code
});
```

---

## 🟠 HIGH PRIORITY (Sebelum Production)

### FIX #4: Add Authentication & Authorization

**File:** `server.ts`  
**Priority:** 🟠 HIGH  
**Time:** 45 menit  
**Importance:** Critical untuk production

**Option A: Simple API Key Auth (Recommended untuk MVP)**

```typescript
// Middleware for API key authentication
const apiKeyAuth = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      hint: 'Include X-Api-Key header or ?api_key=... in URL'
    });
  }

  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  next();
};

// Apply to protected endpoints
app.post('/api/ai/*', apiKeyAuth, (req, res) => { /* ... */ });
app.post('/api/export/*', apiKeyAuth, (req, res) => { /* ... */ });
```

**Setup in .env:**
```bash
API_SECRET_KEY="super-secret-key-change-in-production"
```

---

### FIX #5: Add Error Logging

**File:** `server.ts`  
**Priority:** 🟠 HIGH  
**Time:** 40 menit

Install Winston:
```bash
npm install winston
```

Add to server.ts:
```typescript
import winston from 'winston';
import path from 'path';

// Create logger
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

// Use logger in endpoints
app.post('/api/ai/parse-log', async (req, res) => {
  try {
    logger.info('Parse log request', { textLength: req.body.text?.length });
    // ... existing code
  } catch (error) {
    logger.error('Parse log failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    res.status(500).json({ error: 'Gagal memproses catatan' });
  }
});
```

---

### FIX #6: Add CORS Configuration

**File:** `server.ts`  
**Priority:** 🟠 HIGH  
**Time:** 15 menit

```bash
npm install cors
npm install --save-dev @types/cors
```

```typescript
import cors from 'cors';

// Configure CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

// Preflight requests
app.options('*', cors(corsOptions));
```

Add to .env:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

---

### FIX #7: Update Package.json Metadata

**File:** `package.json`  
**Priority:** 🟠 HIGH (cosmetic but important)  
**Time:** 5 menit

```json
{
  "name": "kandang-pintar",
  "version": "1.0.0",
  "description": "Smart Poultry Farm Management System - AI-powered farm management for Indonesian farmers",
  "author": "Your Name",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/kandang-pintar"
  },
  "keywords": [
    "poultry",
    "farm-management",
    "ai",
    "gemini",
    "agriculture",
    "indonesia"
  ],
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "start": "NODE_ENV=production tsx server.ts",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js logs",
    "lint": "tsc --noEmit",
    "test": "node --test tests/**/*.test.ts"
  }
}
```

---

## 🟡 MEDIUM PRIORITY (Sprint Berikutnya)

### FIX #8: Add Request Logging (Morgan)

```bash
npm install morgan
```

```typescript
import morgan from 'morgan';

// Setup morgan for request logging
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));
```

---

### FIX #9: Add API Documentation (Swagger/OpenAPI)

```bash
npm install swagger-ui-express
npm install --save-dev @types/swagger-ui-express
```

Create `openapi.yaml`:
```yaml
openapi: 3.0.0
info:
  title: Kandang Pintar API
  version: 1.0.0
  description: Smart Poultry Farm Management API

servers:
  - url: http://localhost:3000
  - url: https://api.kandang-pintar.com

paths:
  /api/health:
    get:
      summary: Health check
      responses:
        '200':
          description: Server is healthy
          
  /api/ai/parse-log:
    post:
      summary: Parse daily farm log
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
      responses:
        '200':
          description: Successfully parsed
```

---

### FIX #10: Add Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Use Sentry error handler
app.use(Sentry.Handlers.errorHandler());
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: CRITICAL (Do Today)
- [ ] Add API key validation & early exit if missing
- [ ] Implement rate limiting on all API endpoints
- [ ] Add comprehensive input validation middleware
- [ ] Test all changes locally
- [ ] Commit to git with message "fix: add critical security measures"

**Estimated Time:** 1-2 hours

### Phase 2: HIGH (Do Before Production Deployment)
- [ ] Add API key authentication
- [ ] Setup Winston logging
- [ ] Add CORS configuration
- [ ] Update package.json metadata
- [ ] Setup environment variables for production
- [ ] Test with production-like config
- [ ] Commit to git: "feat: add security hardening and logging"

**Estimated Time:** 2-3 hours

### Phase 3: MEDIUM (Next Sprint)
- [ ] Add Morgan request logging
- [ ] Setup Swagger/OpenAPI docs
- [ ] Add Sentry error tracking
- [ ] Add monitoring dashboard
- [ ] Commit to git: "docs: add API documentation"

**Estimated Time:** 3-4 hours

---

## 🧪 TESTING AFTER FIXES

### Test 1: API Key Validation
```bash
# Should fail
NODE_ENV=production npm start

# Should work
GEMINI_API_KEY="test-key" NODE_ENV=production npm start
```

### Test 2: Rate Limiting
```bash
# Run 150 requests quickly - should get 429 on overflow
for i in {1..150}; do
  curl -s http://localhost:3000/api/health
done | grep -c "Terlalu banyak"
```

### Test 3: Input Validation
```bash
# Should get 400 error
curl -X POST http://localhost:3000/api/ai/parse-log \
  -H "Content-Type: application/json" \
  -d '{}'

# Should work
curl -X POST http://localhost:3000/api/ai/parse-log \
  -H "Content-Type: application/json" \
  -d '{"text": "Ayam makan pur 5kg"}'
```

### Test 4: CORS
```bash
curl -H "Origin: https://other-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Api-Key" \
  http://localhost:3000/api/ai/parse-log
# Should be rejected
```

---

## 📝 ENVIRONMENT VARIABLES (Production)

Create `.env.production`:
```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Required API Keys
GEMINI_API_KEY=your_actual_gemini_key_here
API_SECRET_KEY=your_super_secret_api_key_here

# Application URLs
APP_URL=https://kandang-pintar.com
ALLOWED_ORIGINS=https://kandang-pintar.com,https://api.kandang-pintar.com

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn

# Optional
NODE_OPTIONS=--max-old-space-size=512
```

---

## 🚀 DEPLOYMENT COMMANDS

After implementing all fixes:

```bash
# 1. Build
npm run build

# 2. Test production config
GEMINI_API_KEY="test" NODE_ENV=production npm start &
sleep 5
curl http://localhost:3000/api/health

# 3. Deploy to production
git add .
git commit -m "chore: add security hardening for production"
git push origin main

# Use your deployment tool (Cloud Run, Heroku, etc)
gcloud run deploy kandang-pintar \
  --source . \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY,NODE_ENV=production
```

---

## 📞 SUPPORT & REFERENCE

**Google Gemini API:** https://aistudio.google.com/app/apikey  
**Express Rate Limit:** https://github.com/nfriedly/express-rate-limit  
**Winston Logger:** https://github.com/winstonjs/winston  
**Sentry:** https://sentry.io/  

---

**Status:** Ready for Implementation  
**Last Updated:** 28 Oktober 2026

