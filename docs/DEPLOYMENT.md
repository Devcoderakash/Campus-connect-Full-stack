# Deployment Reference Document

## 1. Backend Deployment (Render)
Render is configured to deploy the Express application located inside `/backend`.

### 1.1 Deployment Parameters
*   **Environment**: Node
*   **Root Directory**: `backend`
*   **Build Command**: `npm install` (or `bun install`)
*   **Start Command**: `npm start` (or `bun run start`)

### 1.2 Environment Variables
Make sure to configure the following environment variables in the Render console:
*   `PORT`: `5000`
*   `MONGO_URI`: *Your MongoDB connection string*
*   `JWT_SECRET`: *Your JWT token secret key*
*   `GOOGLE_DRIVE_FOLDER_ID`: *Google Drive storage folder ID*
*   `GOOGLE_DRIVE_CREDENTIALS`: *Google Service Account credentials JSON*

---

## 2. Frontend Deployment (Netlify)
Netlify builds and hosts the static client SPA built in `/frontend`.

### 2.1 Netlify UI Configurations
*   **Repository Base Directory**: `frontend`
*   **Build Command**: `npm run build`
*   **Publish Directory**: `dist/client`

### 2.2 Environment Variables
*   `VITE_API_URL`: `https://campus-connect-full-stack.onrender.com`
*   `VITE_GOOGLE_CLIENT_ID`: *Optional Google OAuth Client ID*

---

## 3. Admin Dashboard Deployment (Vercel)
Vercel is ideal for hosting the standalone React admin dashboard located in `/admin-panel`.

### 3.1 Vercel Project Configurations
*   **Framework Preset**: Vite
*   **Root Directory**: `admin-panel`
*   **Build Command**: `npm run build` (runs `tsc -b && vite build`)
*   **Output Directory**: `dist`

### 3.2 Environment Variables
*   `VITE_API_URL`: `https://campus-connect-full-stack.onrender.com`
