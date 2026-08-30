# 🛡️ AEGIS-INTELLIGENCE: Dark-Web Threat Actor Identity Resolution

> **Autonomous Stylometric Attribution & Multi-Alias Threat Actor De-Anonymization Platform**

---

## 🎯 1. Executive Summary & Project Focus

In the cyber threat landscape, malicious actors rarely operate under a single identity. Threat actors operating across decentralized dark-web forums, invite-only Telegram groups, Tor marketplaces, and ransomware leak sites intentionally fragment their digital footprints by creating multiple pseudonymous handles across different platforms.

**AEGIS-INTELLIGENCE** solves this identity fragmentation challenge. The project focuses on **cross-platform stylometric identity resolution**—a non-invasive, text-based intelligence engine that ingests unstructured forum and marketplace communications, extracts multi-dimensional linguistic and semantic vector representations, computes pairwise similarity matrices, and renders an interactive, force-directed threat intelligence graph with explainable evidence attribution per match.

---

## 🚨 2. The Problem Statement

### The Core Challenge: Identity Fragmentation & Adversarial Obfuscation
1. **Compartmentalized Operational Security (OPSEC)**:
   - Experienced cybercriminals maintain distinct aliases for specific operational roles (e.g., an exploit seller on Forum-A, an escrow broker on Marketplace-B, and a botnet loader developer on Forum-C).
   - Conventional network-level indicators (IP addresses, MAC addresses, device fingerprints, and browser user-agents) are effectively obscured by Tor, I2P, VPN routing, and disposable virtual machines.
2. **Infrastructure Blindspots**:
   - Law enforcement and threat intelligence analysts cannot rely on network telemetry alone to link aliases because threat actors frequently switch VPNs, utilize mixers for cryptocurrency transactions, and use rotating proxies.
3. **Information Overload & False Matches**:
   - Threat intelligence teams face vast volumes of unindexed forum posts. Without an automated, explainable correlation engine, manually identifying whether two handles share identical linguistic DNA is slow, error-prone, and unscalable.

---

## 💡 3. Our Solution

**AEGIS-INTELLIGENCE** introduces an automated, end-to-end identity resolution platform that bypasses network-level obfuscation by analyzing **behavioral and stylometric linguistics**—the subconscious, intrinsic writing patterns that authors consistently exhibit regardless of the platform they operate on.

### Key Capabilities:
- **Stylometric Feature Extraction**: Combines deep transformer-based semantic embeddings with statistical lexical markers (signature slang n-grams, sentence length cadences, and punctuation profile distributions).
- **Dynamic Topological Graphing**: Interactive force-directed network graph where clusters represent resolved threat actors, and edges represent mathematically verified stylometric correlations.
- **Adjustable Confidence Thresholding**: Analysts can dynamically tune correlation sensitivity (`0.30` to `0.95`, with optimal resolution at `0.62`), watching clusters merge or fracture in real time with **zero live inference latency**.
- **Transparent, Explainable Evidence Dossier**: Clicking any edge provides forensic attribution metrics explaining *why* two handles are linked (shared lexical collocations, variance in sentence length, and syntax matching).
- **Staged Real-Time Threat Ingestion**: Simulates active intelligence ingestion, where newly monitored handles are added to the live graph and automatically resolve into their corresponding threat clusters.

---

## 🔬 4. Our Approach & Methodology

Our pipeline follows a four-stage intelligence workflow:

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
  └── Right Slide-in Threat Actor Dossier & Pairwise Evidence
```

### 1. Linguistic Fingerprint Analysis
Even when threat actors disguise their usernames, their subconscious writing habits persist:
- **Lexical Vocabulary & Jargon**: Distinctive slang markers (e.g., `ngl`, `fr fr`, `no cap` vs. legalistic covenants like `per our agreement; regards` vs. ESL artifacts like `is ready my friend`).
- **Cadence & Sentence Flow**: High-burst short exclamation sentences vs. structured, numbered procedural instructions.
- **Punctuation Profiles**: Heavy ellipsis (`...`), semicolon delimiters (`;`), or excessive punctuation marks (`!!`, `??`).

### 2. Zero-Inference Architecture
To guarantee instant UI responsiveness and eliminate live GPU bottlenecks during critical intelligence briefings, all embeddings and pairwise evidence signals are precomputed and indexed offline into an $N \times N$ similarity matrix. The backend performs pure matrix filtering in sub-millisecond response times.

---

## 🛠️ 5. What Exactly We Built

### 1. The Threat Persona & Ground-Truth Dataset
- Hand-crafted synthetic dataset with **8 distinct threat actor archetypes** (18 aliases, 80+ posts):
  - **Persona 1 (Exploit Developer)**: Slang-heavy 0-day broker (`ShadowX`, `shadow_x`, `sh4d0w`).
  - **Persona 2 (Enterprise Escrow Vendor)**: Legalistic, formal business tone with semicolons (`CipherTrade`, `ct_official`).
  - **Persona 3 (Loader / Botnet Developer)**: Eastern European ESL syntax with `my friend` cadence (`volk_admin`, `wolfpack99`, `v0lk`).
  - **Persona 4 (Script Kiddie / Defacer)**: Chaotic, ALL-CAPS bursts and exclamation marks (`xpl0it_k1ng`, `hackmaster2k`).
  - **Persona 5 (OPSEC Consultant / Auditor)**: Numbered steps, em-dashes, and rigorous security terminology (`null_ptr`, `devnull_sec`).
  - **Persona 6 (Chill Dark-Web Dealer)**: Relaxed conversational cadence (`greenlight`, `gl_supplies`).
  - **Decoy Persona 7 (Crypto Hype Moonboy)**: Speculative degen hype (`cryptowave`, `wave_rider`).
  - **Decoy Persona 8 (Crypto Quantitative Analyst)**: Econometric DeFi and liquidity pool analysis (`blockanalyst`, `ba_research`).
- **Decoy Isolation**: P7 and P8 both discuss cryptocurrency, but their stylometric variance produces low similarity (`~0.18`), mathematically proving our system distinguishes style over simple keyword matching.

### 2. High-Performance FastAPI Backend
- `GET /aliases`: Enumerates all monitored handles and platform origins.
- `GET /aliases/{id}`: Retrieves full intelligence post history and metadata.
- `GET /graph?threshold=X`: Returns nodes and edges filtered by threshold with real-time cluster assignments.
- `GET /resolve/{id}`: Provides cluster membership, intra-cluster confidence score, and pairwise correlations.
- `POST /inject`: Simulates live threat ingestion by introducing staged handles into the active graph.
- `POST /reset-demo`: Resets the environment to initial baseline state.

### 3. Cyber SOC Intelligence Dashboard (React + Vite)
- **AEGIS-INTELLIGENCE Green Matrix Home Page**: Fullscreen matrix binary skull background, telemetry status badges, and direct launch button.
- **2D Force-Directed Graph Engine**:
  - D3 collision avoidance (`forceCollide(48)`) preventing node/label overlap.
  - Cluster color palette and spotlight outer glow hover effects.
  - High-contrast label backdrop pills ensuring 100% legibility.
- **Dynamic Threshold Slider (0.30 – 0.95)**: Live debounced (150ms) threshold control.
- **Slide-in Evidence & Dossier Panel (Framer Motion)**:
  - Node Mode: Threat actor alias profile, platform badge, and full post timeline.
  - Edge Mode: Pairwise stylometric similarity gauge, top score drivers, shared n-grams, sentence length delta, and punctuation profile match.
- **Resolved Cluster Summary Strip**: Aceternity-inspired glowing border-beam cards displaying cluster ID, alias count, and confidence percentage (with singletons clearly labeled as *Unmatched*).

---

## 🏗️ 6. How Exactly We Built It (Technical Stack)

| Layer | Technologies Used | Role & Functionality |
|---|---|---|
| **Stylometrics & NLP** | Python, `sentence-transformers` (`all-MiniLM-L6-v2`), `scikit-learn`, `numpy` | Generates 384-dimensional dense semantic vectors and extracts n-gram collocations and punctuation metrics. |
| **Backend API** | FastAPI, Uvicorn, Pydantic, HTTPX | In-memory dataset server with CORS support, dynamic connected-components clustering, and sub-millisecond query latency. |
| **Frontend Framework** | React 19, Vite, Tailwind CSS v4 | High-performance Single Page Application (SPA) structured with custom dark cyber themes. |
| **Network Visualization** | `react-force-graph-2d`, `d3-force` | Real-time physics simulation, collision avoidance, and canvas node/edge rendering. |
| **Motion & Animations** | `framer-motion` | Smooth slide-in dossiers, glowing border-beam cluster animations, and state transitions. |
| **UI Components & Icons** | Lucide React, Custom CSS HUD elements | Cyber telemetry badges, pulse indicators, and responsive controls. |

---

## 📊 7. Verification & Benchmarking

| Metric | Result | Benchmark Target |
|---|---|---|
| **Intra-Persona Similarity (Same Author)** | **0.65 – 0.82** | $\ge 0.60$ (High confidence) |
| **Inter-Persona Similarity (Different Authors)** | **0.16 – 0.46** | $\le 0.50$ (Safe buffer) |
| **Decoy Isolation (P7 vs P8)** | **0.1655 – 0.1999** | $\le 0.30$ (Zero false correlation) |
| **Cluster Purity at Default Threshold (0.62)** | **100% Pure** (8/8 Clusters) | 100% Ground-truth alignment |
| **API Response Time** | **< 5 ms** | Real-time threshold filtering |

---

## 🏁 8. Conclusion

**AEGIS-INTELLIGENCE** provides a mathematically grounded, visually intuitive, and explainable solution to dark-web threat actor identity resolution. By focusing on intrinsic stylometric DNA rather than spoofable network artifacts, it empowers cyber defense teams and intelligence analysts to link disparate pseudonyms into unified threat actor clusters with high confidence and complete forensic transparency.
