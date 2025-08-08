# SAP Agentless Fullstack Demo (Frontend + Backend)

This repo is a deploy-ready prototype for the SAP Agentless Discovery & Validation tool.
It contains a **frontend** (React + Vite + Tailwind) and a **backend** (FastAPI) with simulated collectors and AI-capable validation.

## Structure
- `frontend/` — React app (vite) with Data Collection and Dashboard pages.
- `backend/`  — FastAPI app with endpoints for manual upload, auto-collect simulation, validation, and overview.
- `sample_landscape.json` — realistic SAP landscape used by the frontend demo.

---
## Quick local run (if you have Node & Python locally)
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Backend will run on port 8000 by default.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend dev server runs on port 5173 (Vite). Configure `VITE_API_BASE` env var if your backend is remote.

---
## Deploying (no local install required)
### Frontend → Netlify (free)
1. Create a GitHub repo and push the `frontend/` folder contents (or push the whole project and set Netlify to the `frontend/` subfolder).
2. On Netlify, create site from Git -> select the repo.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_BASE` with the backend base URL (e.g., `https://<your-backend>.onrender.com`)

### Backend → Render (free tier)
1. Create a repo for `backend/` or push the whole project and point Render to the backend folder.
2. Create a new Web Service on Render (or Background Worker) - select Python/Docker.
3. If using the Python environment on Render, set the Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Add environment variable `HF_MODEL_DIR` (optional) pointing to a mounted directory with the `flan-t5-small` model files if you want local AI. If not set, the validation will use rule-based fallback.
4. Deploy. Render will provide a public URL like `https://<service>.onrender.com`

### Notes about the local model (flan-t5-small)
- If you want AI feedback offline, download `google/flan-t5-small` weights and tokenizer to a host directory and set `HF_MODEL_DIR` to that path. Quantize to 8-bit to reduce memory/space using bitsandbytes if desired.
- The backend will attempt to load the model from `HF_MODEL_DIR` at startup. If it cannot be loaded, it will fallback to deterministic rule-based feedback.

---
## After deployment
- Set Netlify `VITE_API_BASE` to your backend URL so frontend can call `/api/*` endpoints.
- Use the Data Collection page to load sample data, upload files, or run simulated collectors.
- The Dashboard page visualizes the sample landscape health.

---
If you'd like, I can package this repo as a ZIP you can upload to GitHub, or provide a step-by-step script to create the GitHub repo and push these files via the GitHub web UI.
