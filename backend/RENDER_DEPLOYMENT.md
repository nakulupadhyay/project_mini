# 🚀 Render Deployment Guide

## Issues Fixed:
✅ File upload directory handling  
✅ Build script configuration  
✅ Environment variables setup  
✅ Proper CORS configuration  

## Step-by-Step Deployment:

### Step 1: Delete Old Render Service (if exists)
1. Go to dashboard.render.com
2. Find your previous deployment
3. Click **Settings** → **Delete Service**

### Step 2: Create New Web Service
1. Click **"New"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Click **"Connect account"** (GitHub)
4. Search and select: `project_mini`
5. Click **"Connect"**

### Step 3: Configure Service Settings

**Basic Settings:**
- **Name:** `mindcare-ai-backend`
- **Environment:** `Node`
- **Region:** `Oregon` (free tier)
- **Branch:** `main`
- **Root Directory:** `emotion-health-monitor/backend`

**Build & Start:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these 5 variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://n1697083_db_user:IZoqDECaL2k5fjjP@emotionmonitor.3dwlyez.mongodb.net/?appName=EmotionMonitor` |
| `JWT_SECRET` | `MindCare@2025!SecureKey#EmotionMonitor$Production` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `CORS_ORIGIN` | `https://health-care-mu-six.vercel.app` |

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Once deployed, you'll get a URL like: `https://mindcare-ai-backend.onrender.com`

### Step 6: Test Backend
After deployment completes, test:

```
https://mindcare-ai-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "MindCare AI Backend",
  "timestamp": "2025-11-26T..."
}
```

### Step 7: Update Frontend
Update your frontend's `.env` file:

```
REACT_APP_API_URL=https://mindcare-ai-backend.onrender.com/api
```

Then push to GitHub. Vercel will auto-redeploy.

---

## Troubleshooting

**If build still fails:**
1. Check Render's deployment logs
2. Ensure MongoDB connection string is correct
3. Verify all environment variables are set
4. Check that root directory is: `emotion-health-monitor/backend`

**If API doesn't respond:**
1. Test health endpoint first
2. Check CORS_ORIGIN matches your frontend URL
3. Verify MongoDB credentials are correct

---

**GitHub Repository:**  
https://github.com/nakulupadhyay/project_mini

**Backend Ready for Production! ✅**
