# 🚀 Kandang Pintar - Vercel Deployment Guide

**Date:** 28 Oktober 2026  
**Status:** 🟢 READY FOR DEPLOYMENT

---

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/KaiDev98/kandang-pintar
- ✅ Vercel account: https://vercel.com (free tier available)
- ✅ Node.js v18+ (for local testing)
- ✅ npm/yarn (package manager)

---

## 🔑 Environment Variables Setup

### Step 1: Configure in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project (or create new)
3. Go to **Settings → Environment Variables**
4. Add these variables:

```
GEMINI_API_KEY = your-actual-api-key-here
NODE_ENV = production
FRONTEND_URL = https://your-domain.vercel.app
```

### Step 2: Get GEMINI_API_KEY

1. Visit: https://aistudio.google.com/app/apikey
2. Create new API key (free tier available)
3. Copy the key
4. Paste into Vercel Environment Variables

---

## 🌐 Deployment Options

### Option A: Deploy via Vercel CLI (Recommended)

**Step 1: Login to Vercel**
```bash
cd /home/aizensx/Development/PROJEK-2027/kandang-pintar
npx vercel login
```
Follow the prompts and authenticate with GitHub/GitLab

**Step 2: Link Project**
```bash
npx vercel link
```
- Choose "Create a new project"
- Enter project name: `kandang-pintar`
- Select: "Other" (since we have both frontend + backend)

**Step 3: Add Environment Variables**
```bash
npx vercel env add GEMINI_API_KEY
```
When prompted, paste your actual API key

**Step 4: Deploy to Staging (Preview)**
```bash
npm run deploy:staging
```

**Step 5: Deploy to Production**
```bash
npm run deploy
```

---

### Option B: Deploy via GitHub Integration (Easiest)

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select: `KaiDev98/kandang-pintar`
4. Configure:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add Environment Variables:
   - Key: `GEMINI_API_KEY`
   - Value: Your API key

6. Click "Deploy"

---

## 📦 Project Structure for Vercel

```
kandang-pintar/
├── api/
│   └── index.ts          ← Serverless function (API routes)
├── src/
│   ├── main.tsx          ← React entry point
│   ├── App.tsx
│   ├── components/       ← React components
│   ├── context/          ← State management
│   └── domain/           ← Business logic
├── public/
│   ├── icon.svg
│   └── manifest.json
├── index.html            ← Vite entry
├── vite.config.ts        ← Vite config
├── vercel.json           ← Vercel config ✅ (ADDED)
├── package.json
├── tsconfig.json
└── ...
```

---

## 🔍 How It Works on Vercel

### Frontend (React/Vite)
- **Build:** `vite build` → Creates `dist/` folder
- **Deploy:** Static files served from Vercel's CDN
- **Performance:** Instant global deployment with caching

### Backend (Express API)
- **Deploy:** Serverless function in `api/index.ts`
- **Scale:** Auto-scales based on traffic
- **Pricing:** Free tier allows 100 serverless invocations/day

### Routing
- Requests to `/` → Served by React frontend (from `dist/`)
- Requests to `/api/*` → Routed to serverless backend function

---

## 📊 What Gets Deployed

### ✅ Included
- React 19 frontend (UI)
- Express API server (backend)
- All dependencies
- Environment variables (secured)
- Static assets (public/)

### ❌ NOT Included (Git-ignored)
- `.env.local` (development only)
- `node_modules/` (installed fresh on Vercel)
- `logs/` directory
- `.git/` history

---

## 🎯 Deployment Steps Summary

### Quick Deploy (Recommended)

```bash
# 1. Navigate to project
cd /home/aizensx/Development/PROJEK-2027/kandang-pintar

# 2. Install dependencies (if needed)
npm install

# 3. Build locally (test)
npm run build

# 4. Deploy to Vercel
npm run deploy:staging        # First deploy to preview
npm run deploy               # Deploy to production

# 5. Wait for deployment...
# Your app will be live at: https://kandang-pintar.vercel.app
```

---

## ✅ Verifying Deployment

After deployment completes:

1. **Check Health Endpoint:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "uptime": 123.45,
     "timestamp": "2026-10-28T...",
     "service": "Kandang Pintar Server",
     "environment": "production"
   }
   ```

2. **Test Frontend:**
   ```
   https://your-app.vercel.app/
   ```
   Should load Kandang Pintar UI

3. **Test API Endpoint:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/ai/parse-log \
     -H "Content-Type: application/json" \
     -d '{"text": "Ayam makan pur 5kg"}'
   ```

---

## 🔐 Security Best Practices

### ✅ DO
- Store `GEMINI_API_KEY` in Vercel Environment Variables (NOT in code)
- Use `.env.local` for local development (git-ignored)
- Enable Vercel's automatic HTTPS
- Use rate limiting (already configured)
- Monitor Vercel's usage analytics

### ❌ DON'T
- Commit `.env.local` to GitHub
- Share API keys in public channels
- Use `console.log()` for sensitive data
- Deploy without testing on staging first

---

## 📈 Monitoring & Logs

### View Deployment Logs
```bash
# Streaming logs from Vercel
npx vercel logs

# Function logs
npx vercel logs api/index
```

### Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click deployment to see logs

---

## 🚨 Troubleshooting

### "GEMINI_API_KEY not found"
- Solution: Add to Vercel Environment Variables in dashboard
- Verify variable name matches exactly

### "Build failed"
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally first
- Verify all dependencies in package.json

### "API returns 502 Bad Gateway"
- Check function logs in Vercel dashboard
- Verify `api/index.ts` is correct
- Test API locally with `npm run dev`

### "Deployment timeout"
- Increase build timeout in `vercel.json`
- Check for large dependencies
- Review build size

---

## 💡 Next Steps

1. ✅ Add GEMINI_API_KEY to Vercel
2. ✅ Deploy to staging first (`npm run deploy:staging`)
3. ✅ Test all endpoints
4. ✅ Deploy to production (`npm run deploy`)
5. ✅ Configure custom domain (optional)
6. ✅ Setup analytics/monitoring (optional)

---

## 📱 Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Follow DNS instructions
4. Wait for DNS propagation (5-30 mins)

Example:
- Default: `https://kandang-pintar.vercel.app`
- Custom: `https://kandang.yourdomain.com`

---

## 💰 Pricing

**Vercel Free Tier Includes:**
- ✅ 100 serverless function invocations/day
- ✅ 1GB data transfer/month (generous!)
- ✅ HTTPS included
- ✅ Custom domains
- ✅ Automatic deployments from GitHub

**Upgrade to Pro if needed:**
- Unlimited serverless functions
- Priority support
- Advanced analytics

---

## 🎓 Architecture Diagram

```
GitHub Repository
    ↓ (automatic on push)
Vercel Build System
    ├─ Frontend Build: vite build → dist/
    └─ Backend: api/index.ts → Serverless function
    ↓
Vercel CDN (Global Edge Network)
    ├─ Static files (dist/) → Ultra-fast delivery
    └─ API requests → Route to serverless function
    ↓
Your Users Worldwide 🌍
```

---

## 📞 Getting Help

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev
- **Express Docs:** https://expressjs.com
- **GitHub Issues:** https://github.com/KaiDev98/kandang-pintar/issues

---

## ✨ Summary

- **Status:** Ready for deployment ✅
- **Platform:** Vercel (free tier available)
- **Frontend:** React 19 + Vite (static)
- **Backend:** Express API (serverless)
- **Database:** Browser LocalStorage (client-side)
- **AI:** Google Gemini (via API key)

**Everything is configured and ready to go! 🚀**

---

**Questions or issues?**  
Check VERCEL_DEPLOYMENT.md → Troubleshooting section, or review logs in Vercel dashboard.
