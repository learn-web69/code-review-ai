# 🚀 Deployment Guide - Vercel

Deploy your Code Review AI API to Vercel in **5 minutes**. Vercel is free, fast, and perfect for Node.js APIs.

## ✅ Pre-Deployment Checklist

Before deploying, ensure everything works locally:

```bash
# ✅ Server starts
npm run server

# ✅ Tests pass
bash test-api.sh

# ✅ No TypeScript errors
npm run type-check

# ✅ Builds successfully
npm run build
```

All commands should complete without errors.

---

## 🎯 Step-by-Step Deployment

### Step 1: Push Code to GitHub

Make sure all code is committed and on GitHub:

```bash
cd /Users/andrii/projects/code-review-ai

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Setup for Vercel deployment"

# Push to GitHub
git push origin main
```

**Verify:** Go to https://github.com/learn-web69/code-review-ai and confirm files are there.

---

### Step 2: Create Vercel Account

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel
5. ✅ Done!

---

### Step 3: Import Project to Vercel

1. In Vercel dashboard, click **"New Project"** or **"Add New..." → "Project"**
2. Find **"code-review-ai"** in your repos list
3. Click **"Import"**

---

### Step 4: Configure Settings

You'll see a configuration screen. Update these settings:

**Root Directory:**

- Keep as: `./` (default) — Your `vercel.json` file already specifies `src/server/index.ts` as the entry point

**Build Command:**

- Change to: `npm run build`

**Output Directory:**

- Change to: `dist`

> **Note:** The `vercel.json` configuration in your repo will override these settings and correctly route all requests to `src/server/index.ts`

---

### Step 5: Add Environment Variables

In the **"Environment Variables"** section, add these variables:

| Variable         | Value      | From                                 |
| ---------------- | ---------- | ------------------------------------ |
| `GITHUB_TOKEN`   | your_token | GitHub Settings → Developer settings |
| `GEMINI_API_KEY` | your_key   | Google AI Studio                     |
| `QDRANT_API_KEY` | your_key   | Qdrant Cloud dashboard               |
| `QDRANT_URL`     | your_url   | Qdrant Cloud dashboard               |
| `NODE_ENV`       | production | -                                    |

**Get your tokens:**

**GITHUB_TOKEN:**

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`
4. Copy token

**GEMINI_API_KEY:**

1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API key"
3. Create/copy your API key

**QDRANT:**

1. Go to [qdrant.tech](https://qdrant.tech)
2. Create a cloud account
3. Create a cluster
4. Copy API key and URL

---

### Step 6: Deploy

Click **"Deploy"** button. Vercel will:

1. Build your project
2. Run tests
3. Deploy to the cloud
4. Give you a live URL

⏱️ This takes 2-3 minutes.

---

## 🎉 You're Live!

Once deployment completes, you'll get a URL like:

```
https://code-review-ai-xxxxx.vercel.app
```

---

## 🧪 Test Your Deployment

### Test Status Endpoint

```bash
curl https://code-review-ai-xxxxx.vercel.app/status
```

Expected response:

```json
{
  "status": "ok",
  "indexed": false,
  "message": "Status check endpoint - implementation pending"
}
```

### Test Other Endpoints

```bash
# Test init-repository
curl -X POST https://code-review-ai-xxxxx.vercel.app/init-repository/my-repo \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/test/repo"}'

# Test review-pr
curl -X POST https://code-review-ai-xxxxx.vercel.app/review-pr/42 \
  -H "Content-Type: application/json" \
  -d '{"repo_id": "my-repo"}'

# Test tools/review
curl -X POST https://code-review-ai-xxxxx.vercel.app/tools/review \
  -H "Content-Type: application/json" \
  -d '{"code": "const x = 1;", "question": "What is this?"}'
```

---

## 🔧 Configuration Files

These files support your Vercel deployment (already created):

**`vercel.json`** - Tells Vercel how to build your app
**`.vercelignore`** - Excludes unnecessary files

Both files are in your root directory and already configured.

---

## 🚨 Troubleshooting

### Build Fails

- Run `npm run type-check` locally first
- Verify `package.json` has correct scripts
- Check Node version (20+)

### 500 Server Error

- Go to Vercel dashboard → Settings → Environment Variables
- Verify all 4 variables are set (GITHUB_TOKEN, GEMINI_API_KEY, QDRANT_API_KEY, QDRANT_URL)
- Check deployment logs

### 404 Not Found

- Verify endpoint path is correct (e.g., /status, /init-repository, etc.)
- Check deployment succeeded in Vercel dashboard

---

## 📈 Next Steps

✅ **Deployed!** Now:

1. Share your URL with your team
2. Update your frontend to use the deployed URL
3. Implement the TODOs in `src/server/app.ts`
4. Monitor logs in Vercel dashboard

---

**Deployed successfully?** 🎉 Share your API URL and start testing!
