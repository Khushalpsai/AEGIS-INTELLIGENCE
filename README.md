# AEGIS-INTELLIGENCE

> **Autonomous Stylometric Attribution & Multi-Alias Threat Actor De-Anonymization Platform**

A stylometric identity correlation engine that ingests unstructured text posts from dark-web forums and marketplaces, extracts multi-dimensional linguistic fingerprints, computes pairwise similarity matrices, and renders an interactive force-directed threat intelligence graph — with explainable evidence, analyst workflows, and structured PDF reporting.

---

## Project Structure

```
AEGIS-INTELLIGENCE/
├── .github/
│   └── workflows/
│       └── deploy.yml               # Cloudflare Pages CI/CD (auto-deploys on push to main)
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   ├── personas.json            # Ground-truth synthetic dataset (20 personas, 31 aliases)
│   │   │   └── similarity_matrix.json   # Precomputed embeddings & stylometric evidence
│   │   ├── routers/
│   │   │   ├── aliases.py               # GET /aliases, GET /aliases/{id}
│   │   │   └── graph.py                 # GET /graph, GET /resolve/{id}, POST /inject, POST /reset-demo
│   │   └── main.py                      # FastAPI app & in-memory dataset loader
│   ├── scripts/
│   │   └── embed_and_score.py           # Offline sentence-transformer embedding & scoring script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                # Typed API fetch client
│   │   ├── components/
│   │   │   ├── Graph.jsx                # 2D force-directed graph (D3 + react-force-graph-2d)
│   │   │   ├── ThresholdSlider.jsx      # Dynamic resolution slider (0.30 – 0.95)
│   │   │   ├── EvidencePanel.jsx        # Slide-in dossier & "Explain This Link" panel
│   │   │   ├── InvestigationMode.jsx    # 4-step analyst workflow + PDF report export
│   │   │   ├── AliasDetail.jsx          # Alias profile & post timeline
│   │   │   ├── ClusterCards.jsx         # Resolved cluster strip with border-beam glow
│   │   │   ├── LandingPage.jsx          # Matrix binary skull home page
│   │   │   ├── SideSection.jsx          # Collapsible sidebar section
│   │   │   └── InjectButton.jsx         # Live alias injection demo
│   │   ├── utils/
│   │   │   └── exportPDF.js             # Programmatic PDF report generator (jsPDF + autoTable)
│   │   ├── App.jsx                      # Main SOC dashboard layout
│   │   └── index.css                    # Dark cyber theme & animations
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── DEPLOYMENT.md                        # [gitignored] Cloudflare secrets setup guide
├── NEW_FEATURES.md
├── PROJECT_OVERVIEW.md
└── README.md
```

---

## Quick Start

### 1. Backend (FastAPI)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --host 127.0.0.1
```
*API runs at `http://127.0.0.1:8000` — Swagger docs at `/docs`*

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
*App opens at `http://127.0.0.1:5173`*

---

## Key Features

| Feature | Description |
|---|---|
| **Force-Directed Graph** | 2D physics simulation with collision avoidance, cluster glow, and spotlight hover |
| **Dynamic Threshold Slider** | Live connected-components clustering from `0.30` to `0.95` (optimal: `0.62`) |
| **"Explain This Link" Dossier** | Click any edge for a per-signal breakdown: Semantic, Lexical, Syntactic, Punctuation, Temporal |
| **Analyst Investigation Mode** | 4-step workflow: Target → Candidates → Evidence Comparison → PDF Report |
| **Proper PDF Export** | Programmatic jsPDF report with cover, confidence assessment, multi-signal bar charts, evidence table, shared n-grams, temporal timeline, and analyst recommendations — NOT a screenshot |
| **Threat Actor Evolution Timeline** | Dual-track temporal visualizer showing concurrent vs. sequential alias activity |
| **Confidence Scoring** | Raw scores translated to intelligence bands: Weak / Possible / Probable / High-Confidence |
| **Staged Alias Injection** | Real-time live ingestion demo — inject held-back aliases and watch them cluster |
| **Zero Inference Latency** | All embeddings precomputed offline; backend does pure matrix filtering in <5 ms |
| **20-Persona Dataset** | 31 aliases, 100+ posts — including noise personas and decoy archetypes to prove precision |

---

## Deployment (Cloudflare Pages)

The frontend auto-deploys to Cloudflare Pages on every push to `main` via the GitHub Actions workflow at `.github/workflows/deploy.yml`.

**Setup (one-time):**
1. Create a Cloudflare Pages project named `aegis-intelligence`
2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets
3. Read `DEPLOYMENT.md` (local only, not in git) for the full step-by-step guide

---

## Tech Stack

| Layer | Technologies |
|---|---|
| NLP / Stylometrics | Python, `sentence-transformers` (`all-MiniLM-L6-v2`), `scikit-learn`, `numpy` |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Graph Engine | `react-force-graph-2d`, `d3-force` |
| Animations | Framer Motion |
| PDF Reports | jsPDF, jspdf-autotable |
| Icons | Lucide React |
| CI/CD | GitHub Actions → Cloudflare Pages (Wrangler) |
