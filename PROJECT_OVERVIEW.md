# AEGIS-INTELLIGENCE: Dark-Web Threat Actor Identity Resolution

> **Autonomous Stylometric Attribution & Multi-Alias Threat Actor De-Anonymization Platform**

---

## 1. Executive Summary

In the cyber threat landscape, malicious actors rarely operate under a single identity. Threat actors fragment their digital footprints across decentralized dark-web forums, invite-only Telegram groups, Tor marketplaces, and ransomware leak sites by maintaining multiple pseudonymous handles.

**AEGIS-INTELLIGENCE** resolves this identity fragmentation through **cross-platform stylometric identity correlation** — a non-invasive, text-based intelligence engine that ingests unstructured communications, extracts multi-dimensional linguistic and semantic representations, computes pairwise similarity matrices, and renders an interactive threat intelligence graph with explainable evidence per match.

---

## 2. The Problem

### Identity Fragmentation & Adversarial Obfuscation

1. **Compartmentalized OPSEC**: Experienced threat actors maintain distinct aliases per role — exploit sellers, escrow brokers, botnet loader developers. Network-level indicators are neutralized by Tor, I2P, rotating VPNs, and disposable VMs.
2. **Infrastructure Blindspots**: Law enforcement cannot rely on network telemetry alone to link aliases.
3. **Information Overload**: Vast volumes of unindexed dark-web posts. Manual correlation is slow, error-prone, and unscalable.

---

## 3. Our Solution

**AEGIS-INTELLIGENCE** bypasses network-level obfuscation by analyzing **behavioral stylometric DNA** — the subconscious writing patterns that authors exhibit regardless of platform.

### Core Capabilities

| Capability | Description |
|---|---|
| **Multi-Signal Stylometric Profiling** | Combines transformer semantic embeddings with lexical n-gram mining, sentence-length cadence analysis, and punctuation profile cosine similarity |
| **Dynamic Topological Graphing** | Interactive force-directed network graph; clusters represent resolved threat actors; edges represent verified stylometric correlations |
| **Adjustable Confidence Thresholding** | Analysts tune sensitivity in real time (0.30 – 0.95); clusters merge/fracture instantly with zero inference latency |
| **Analyst Investigation Mode** | Structured 4-step workflow: Target Selection → Candidate Generation → Evidence Comparison → PDF Intelligence Report |
| **"Explain This Link" Dossier** | Per-edge signal breakdown: Semantic, Lexical, Syntactic, Punctuation, Temporal — with supporting & contradictory evidence |
| **Temporal Evolution Timeline** | Dual-track timeline showing whether aliases operated concurrently or represent a sequential identity handover |
| **Confidence Scoring System** | Raw scores mapped to intelligence bands: Weak / Possible / Probable / High-Confidence |
| **Staged Real-Time Ingestion** | Simulate live threat alias ingestion; new handles auto-resolve into their cluster |
| **Structured PDF Report Export** | jsPDF-based programmatic intelligence reports with cover page, confidence assessment, multi-signal bar charts, evidence table, shared n-gram grid, temporal activity timeline, and analyst recommendations — NOT a screenshot |

---

## 4. Methodology

```
[ Unstructured Dark-Web Corpora ]
               │
               ▼
[ Multi-Signal Stylometric Profiling ]
  ├── 1. Transformer Semantic Embeddings (all-MiniLM-L6-v2)
  ├── 2. Shared Lexical Collocations (N-gram mining)
  ├── 3. Syntactic Structure (Sentence-length cadence delta)
  └── 4. Punctuation Profile Distribution (Cosine syntax vector)
               │
               ▼
[ Pairwise Similarity & Evidence Matrix Engine ]
  └── Offline Precomputed N×N Cosine Tensor + Signal Attribution
               │
               ▼
[ Graph Clustering & Intelligence Dashboard ]
  ├── Connected-Components Cluster Resolution (Threshold: 0.62)
  ├── 2D Force-Directed Graph with Collision Avoidance
  ├── Right Slide-in Threat Actor Dossier & Pairwise Evidence
  └── PDF Intelligence Report Generation
```

### Linguistic Fingerprint Analysis
Even when threat actors disguise their usernames, subconscious writing habits persist:
- **Lexical Vocabulary & Jargon**: Distinctive slang (e.g., `ngl`, `fr fr` vs. `per our agreement; regards` vs. `is ready my friend`).
- **Cadence & Sentence Flow**: High-burst short exclamations vs. structured numbered procedurals.
- **Punctuation Profiles**: Heavy ellipsis (`...`), semicolons (`;`), or excessive markers (`!!`, `??`).

### Zero-Inference Architecture
All embeddings and pairwise evidence are precomputed offline into an N×N similarity matrix. The backend performs pure matrix filtering with **<5 ms** API response times — no live GPU bottlenecks during briefings.

---

## 5. What We Built

### Ground-Truth Dataset (20 Personas)
- **31 aliases**, **100+ posts** across hand-crafted archetypes:
  - **Threat Actors**: Exploit Developer (`ShadowX`), Enterprise Escrow Vendor (`CipherTrade`), Botnet Developer (`volk_admin`), Script Kiddie (`xpl0it_k1ng`), OPSEC Consultant (`null_ptr`), Ransomware Negotiator (`LockSupport`), Initial Access Broker (`AccessKing`), Carding Specialist (`PlasticGod`)
  - **Background Noise**: Dark-web dealer, tech support, gamer, fitness enthusiast, student, web developer, photographer, car enthusiast, conspiracy theorist
  - **Decoy Archetypes**: Speculative Crypto Moonboy vs. Quantitative Crypto Analyst — proves the system distinguishes writing style over keyword matching

### FastAPI Backend

| Endpoint | Description |
|---|---|
| `GET /aliases` | Enumerate all monitored handles |
| `GET /aliases/{id}` | Full intelligence post history & metadata |
| `GET /graph?threshold=X` | Nodes/edges filtered by threshold with cluster assignments |
| `GET /resolve/{id}` | Cluster membership, intra-cluster score, pairwise correlations |
| `POST /inject` | Simulate live threat alias ingestion |
| `POST /reset-demo` | Reset to initial baseline state |

### Cyber SOC Intelligence Dashboard (React + Vite)

- **Landing Page**: Fullscreen matrix binary skull background, telemetry badges, launch button
- **2D Force-Directed Graph**: D3 collision avoidance, cluster color palette, spotlight glow
- **Dynamic Threshold Slider**: 150ms debounced live threshold control
- **Slide-in Evidence Panel (Framer Motion)**:
  - *Node Mode*: Alias profile, platform badge, full post timeline
  - *Edge Mode*: 5-signal stylometric gauge, top score drivers, shared n-grams, sentence delta, punctuation match
- **Analyst Investigation Mode** (4-step workflow):
  - Step 1: Target alias selection with live search
  - Step 2: Candidate generation with confidence ranking
  - Step 3: Side-by-side stylometric + temporal evidence comparison
  - Step 4: Automated intelligence report → one-click PDF export
- **PDF Report Export**: 7-section structured A4 report (jsPDF):
  - Cover page with case ID and timestamp
  - Classification confidence banner
  - Subject identity cards
  - Confidence assessment with narrative
  - Multi-signal stylometric bar charts
  - Pairwise evidence table (autoTable)
  - Shared N-gram grid
  - Temporal activity timeline with overlap analysis
  - Analyst assessment & recommendations paragraph
  - Legal disclaimer footer
- **Resolved Cluster Strip**: Glowing border-beam cards showing cluster ID, alias count, confidence

### CI/CD — Cloudflare Pages

- GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on every push to `main`
- Builds the Vite frontend → deploys `dist/` to Cloudflare Pages via Wrangler
- Zero-downtime global CDN delivery

---

## 6. Technical Stack

| Layer | Technologies | Role |
|---|---|---|
| **Stylometrics / NLP** | Python, `sentence-transformers` (`all-MiniLM-L6-v2`), `scikit-learn`, `numpy` | 384-dim dense semantic vectors + n-gram & punctuation extraction |
| **Backend API** | FastAPI, Uvicorn, Pydantic | In-memory sub-millisecond matrix filtering with CORS |
| **Frontend Framework** | React 19, Vite, Tailwind CSS v4 | High-performance SPA, custom dark cyber HUD theme |
| **Network Visualization** | `react-force-graph-2d`, `d3-force` | Real-time physics simulation, canvas rendering |
| **Motion & Animations** | `framer-motion` | Slide-in dossiers, border-beam cluster glow, state transitions |
| **PDF Reports** | `jspdf`, `jspdf-autotable` | Programmatic A4 intelligence dossiers — not screenshots |
| **Icons** | Lucide React | Cyber telemetry badges, HUD elements |
| **CI/CD** | GitHub Actions, Cloudflare Wrangler | Auto-deploy on push to `main` → Cloudflare Pages CDN |

---

## 7. Verification & Benchmarking

| Metric | Result | Target |
|---|---|---|
| **Intra-Persona Similarity (Same Author)** | **0.65 – 0.82** | ≥ 0.60 (High confidence) |
| **Inter-Persona Similarity (Different Authors)** | **0.16 – 0.46** | ≤ 0.50 (Safe buffer) |
| **Decoy Isolation (P7 vs P8)** | **0.1655 – 0.1999** | ≤ 0.30 (Zero false correlation) |
| **Cluster Purity at Default Threshold (0.62)** | **100% Pure** (8/8 Clusters) | 100% ground-truth alignment |
| **API Response Time** | **< 5 ms** | Real-time threshold filtering |

---

## 8. Conclusion

**AEGIS-INTELLIGENCE** provides a mathematically grounded, visually intuitive, and explainable solution to dark-web threat actor identity resolution. By analyzing intrinsic stylometric DNA rather than spoofable network artifacts, it empowers cyber defense teams and intelligence analysts to link disparate pseudonyms into unified threat actor clusters with high confidence, complete forensic transparency, and presentation-ready PDF intelligence reports.
