# AEGIS-INTELLIGENCE — Architecture

> **Dark-Web Threat Actor Identity Resolution**  
> A zero-inference-latency stylometric attribution platform.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Layout](#2-repository-layout)
3. [Data Pipeline (Offline)](#3-data-pipeline-offline)
4. [Backend API](#4-backend-api)
5. [Frontend SPA](#5-frontend-spa)
6. [Data Flow — End to End](#6-data-flow--end-to-end)
7. [Core Algorithms](#7-core-algorithms)
8. [Key Design Decisions](#8-key-design-decisions)
9. [Signal Weights & Calibration](#9-signal-weights--calibration)
10. [Benchmarks](#10-benchmarks)

---

## 1. System Overview

AEGIS-INTELLIGENCE resolves the problem of identity fragmentation: a single threat actor operating under multiple pseudonyms across dark-web forums. Rather than using network-level indicators (IP, device fingerprints) — which Tor, I2P, and VPNs neutralize — the system analyses **stylometric DNA**: the subconscious writing patterns an author exhibits regardless of platform or alias.

The architecture is split into two distinct phases:

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1 — OFFLINE (run once, or when dataset changes)  │
│  scripts/embed_and_score.py                             │
│  Input:  personas.json  (raw posts)                     │
│  Output: similarity_matrix.json  (N×N scored tensor)    │
└────────────────────┬────────────────────────────────────┘
                     │  static JSON artefact
                     ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2 — ONLINE (runtime, live requests)              │
│  FastAPI backend  <──>  React/Vite frontend             │
│  Pure matrix filtering, < 5 ms per API call             │
└─────────────────────────────────────────────────────────┘
```

There is **no live ML inference at runtime**. All expensive computation happens offline. The backend is a pure read path over an in-memory matrix.

---

## 2. Repository Layout

```
AEGIS-INTELLIGENCE/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, CORS, in-memory state, startup loader
│   │   ├── routers/
│   │   │   ├── aliases.py              # GET /aliases, GET /aliases/{id}
│   │   │   └── graph.py                # GET /graph, GET /resolve/{id}, GET /explain/{a}/{b}
│   │   └── data/
│   │       ├── personas.json           # Ground-truth dataset: 20 personas, 31 aliases, 100+ posts
│   │       └── similarity_matrix.json  # Precomputed N×N composite matrix + evidence
│   ├── scripts/
│   │   └── embed_and_score.py          # Offline pipeline: embeddings → matrix → evidence
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── App.jsx                     # Root shell: routing, global state, header, sidebar
│       ├── api/
│       │   └── client.js               # Typed fetch wrappers for every API endpoint
│       └── components/
│           ├── LandingPage.jsx         # Full-screen matrix rain intro
│           ├── Graph.jsx               # Canvas-rendered force-directed graph
│           ├── EvidencePanel.jsx       # Slide-in dossier: node profile or edge forensics
│           ├── AliasDetail.jsx         # Node mode: alias profile + resolution matches
│           ├── InvestigationMode.jsx   # 4-step analyst workflow + PDF report
│           ├── ClusterCards.jsx        # Bottom cluster strip
│           ├── ThresholdSlider.jsx     # Live similarity threshold control
│           └── SideSection.jsx         # Collapsible sidebar panel wrapper
│
├── ARCHITECTURE.md                     # <- this file
├── PROJECT_OVERVIEW.md
├── NEW_FEATURES.md
└── README.md
```

---

## 3. Data Pipeline (Offline)

**Script:** `backend/scripts/embed_and_score.py`

Run this once whenever `personas.json` is updated. It produces `similarity_matrix.json`.

### 3.1 Input — `personas.json`

A hand-crafted JSON dataset structured as:

```json
{
  "personas": [
    {
      "persona_id": "P1",
      "aliases": [
        {
          "alias_id": "A1",
          "username": "ShadowX",
          "platform": "Forum-A",
          "held_back": false,
          "posts": [
            { "timestamp": "2024-01-15T02:14:00Z", "text": "..." }
          ]
        }
      ]
    }
  ]
}
```

- **20 personas**, **31 aliases**, **100+ posts**
- Each alias is one pseudonym on one platform
- Aliases sharing a `persona_id` are ground-truth same-author pairs

### 3.2 Pipeline Steps

```
personas.json
     │
     ├─[1]─ Semantic Embeddings
     │       Model: all-MiniLM-L6-v2 (sentence-transformers)
     │       Input: full corpus per alias (all posts concatenated)
     │       Output: 384-dim L2-normalised dense vectors
     │       Matrix: cosine_similarity(emb) → N×N float32
     │
     ├─[2]─ Lexical Similarity
     │       TF-IDF over unigrams + bigrams (custom IDF across all aliases)
     │       Cosine similarity of sparse TF-IDF vectors
     │       Output: N×N float32
     │
     ├─[3]─ Syntactic Similarity
     │       Two sub-signals averaged (50/50):
     │         a) Sentence-length cadence: 1 - |avgLen_A - avgLen_B| / 15
     │         b) Punctuation profile cosine: 6-dim vector [!?.,;:] frequency
     │       Output: N×N float32
     │
     ├─[4]─ Temporal Similarity
     │       24-bin UTC hour histogram per alias (Laplace-smoothed)
     │       Cosine similarity of activity histograms
     │       Output: N×N float32
     │
     ├─[5]─ Composite Score
     │       Weighted linear combination:
     │         score = 0.45·Sem + 0.20·Lex + 0.15·Syn + 0.20·Tmp
     │       Clipped to [0, 1], rounded to 4 decimal places
     │
     └─[6]─ Evidence Dictionary
             For every pair (A_i, A_j):
               - shared_phrases: top-k shared bigrams (stopword-filtered)
               - sentence_length_delta: |avgLen_A - avgLen_B|
               - punctuation_similarity: cosine of punctuation profiles
               - top_score_drivers: human-readable list of what drove the score
               - signals: { semantic, lexical, syntactic, temporal }
```

### 3.3 Output — `similarity_matrix.json`

```json
{
  "alias_ids": ["A1", "A2", "..."],
  "matrix": [[1.0, 0.73, "..."], ["..."]],
  "evidence": {
    "A1-A2": {
      "shared_phrases": ["botnet loader", "is ready"],
      "sentence_length_delta": 2.1,
      "punctuation_similarity": 0.812,
      "top_score_drivers": ["vocabulary overlap", "sentence length cadence"],
      "signals": { "semantic": 0.81, "lexical": 0.67, "syntactic": 0.74, "temporal": 0.58 }
    }
  },
  "weights": { "semantic": 0.45, "lexical": 0.20, "syntactic": 0.15, "temporal": 0.20 }
}
```

Size on disk: ~420 KB for 31 aliases. Loaded entirely into RAM at startup.

---

## 4. Backend API

**Framework:** FastAPI + Uvicorn  
**State:** Single in-memory `SystemState` singleton loaded at startup  
**Inference latency:** < 5 ms per request (pure matrix ops, no ML)

### 4.1 In-Memory State (`app/main.py`)

```python
class SystemState:
    personas_raw:     dict              # raw personas.json
    similarity_data:  dict              # raw similarity_matrix.json
    aliases_dict:     Dict[str, dict]   # alias_id → {username, platform, posts, held_back}
    alias_id_to_idx:  Dict[str, int]    # alias_id → matrix row/col index
    alias_ids:        List[str]         # ordered list matching matrix rows
    matrix:           List[List[float]] # N×N composite scores
    evidence_dict:    Dict[str, dict]   # "A1-A2" → evidence object
    active_alias_ids: Set[str]          # aliases currently visible in the graph
```

Everything is loaded once at `@app.on_event("startup")` and held for the process lifetime. No database. No ORM. No cache invalidation.

### 4.2 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check, active alias count |
| `GET` | `/aliases` | List all active aliases with metadata |
| `GET` | `/aliases/{id}` | Full profile + post history for one alias |
| `GET` | `/graph?threshold=X` | Nodes, edges, and cluster assignments at threshold X |
| `GET` | `/resolve/{id}?threshold=X` | Cluster membership + all pairwise scores for one alias |
| `GET` | `/explain/{a}/{b}` | Full forensic explanation for a specific pair |

### 4.3 Cluster Resolution (`GET /graph`)

Runs **connected-components BFS** over the active alias set on every request:

```python
# For each unvisited alias, BFS collects all neighbours with score >= threshold
# Each resulting component becomes one cluster
```

Every node gets a `cluster_id`. Clusters with more than one member get an `avg_confidence` score (mean of all intra-cluster pairwise scores). Complexity O(N²) — negligible at N=31.

### 4.4 Explain Endpoint (`GET /explain/{a}/{b}`)

Reads the precomputed `evidence_dict` entry for the pair. Derives lightweight live stats (avg sentence length, active UTC window) from in-memory post data. Generates natural-language supporting and contradictory evidence strings by applying threshold rules to precomputed signal scores. No ML is invoked.

---

## 5. Frontend SPA

**Framework:** React 19 + Vite  
**Styling:** Tailwind CSS v4  
**Graph rendering:** `react-force-graph-2d` (D3 force simulation, HTML5 Canvas)  
**Animations:** Framer Motion (panel slide-in, presence transitions)  
**PDF export:** jsPDF

### 5.1 View Routing

Three views managed by a single `currentView` string in `App.jsx` — no React Router:

```
'landing'        →  LandingPage.jsx
'dashboard'      →  Main graph dashboard (App.jsx layout)
'investigation'  →  InvestigationMode.jsx (full-screen)
```

### 5.2 Global State (`App.jsx`)

All state lives in `App.jsx` and flows down as props. No Redux, Zustand, or Context — the tree is shallow enough that prop drilling is correct here.

| State | Type | Purpose |
|-------|------|---------|
| `threshold` | `number` | Active similarity cutoff (0.30–0.95) |
| `graphData` | `object` | `{ nodes, edges, clusters }` from last `/graph` fetch |
| `selectedNode` | `object \| null` | Node the user clicked |
| `selectedNodeDetail` | `object \| null` | `/aliases/{id}` response |
| `selectedNodeResolution` | `object \| null` | `/resolve/{id}` response |
| `selectedEdge` | `object \| null` | Edge the user clicked |
| `isPanelOpen` | `bool` | Whether EvidencePanel is visible |
| `panelMode` | `'node' \| 'edge'` | What the panel is showing |
| `highlightClusterId` | `string \| null` | Cluster to highlight on canvas |
| `searchQuery` | `string` | Sidebar alias directory filter |

### 5.3 Graph Rendering (`Graph.jsx`)

`react-force-graph-2d` wraps a D3 force simulation and delegates rendering to `<canvas>` via two custom callbacks:

- **`nodeCanvasObject`** — draws the circle, optional selection ring, and three label pills (ID, @username, [platform])
- **`linkCanvasObject`** — draws the edge with alpha proportional to score strength; draws a score pill when zoomed in or the edge is selected

D3 force configuration:
```js
forceCollide().radius(50).iterations(3)          // prevent node overlap
forceManyBody().strength(-380).distanceMax(500)  // repulsion
forceLink().distance(90).strength(0.4)           // edge pull
```

### 5.4 Evidence Panel (`EvidencePanel.jsx`)

Framer Motion slide-in from the right. Two modes:

**Node mode** (`AliasDetail.jsx`):
- Alias metadata and platform badge
- Full post timeline
- Pairwise resolution matches ranked by composite score

**Edge mode**:
- Fires `GET /explain/{a}/{b}` on mount
- Classification banner (Weak / Possible / Probable / High-Confidence)
- 4-signal progress bar breakdown
- Supporting and contradictory evidence lists
- Pairwise comparison table (avg sentence length, post count, active UTC window)
- Shared lexical bigram tags

### 5.5 Investigation Mode (`InvestigationMode.jsx`)

Full-screen 4-step analyst workflow:

```
Step 1 — Target Selection
  Live-search and select an alias from the active graph

Step 2 — Candidate Correlation
  GET /resolve/{id}  →  ranked candidate matches by composite score

Step 3 — Evidence Comparison
  GET /explain/{a}/{b}  →  signal breakdown + dual-track temporal activity timeline

Step 4 — Intelligence Report
  jsPDF A4 formal intelligence memo:
    - Formal TO/FROM/DATE/SUBJECT header
    - 1. Executive Summary with natural analyst narrative
    - 2. Subjects Under Review
    - 3. Stylometric Evidence (Semantic, Syntactic, Punctuation)
    - 4. Shared Linguistic Markers (bulleted phrases)
    - 5. Temporal Analysis
    - 6. Analyst Recommendation
    - Formal disclaimer and physical signature line
```

### 5.6 Threshold Slider (`ThresholdSlider.jsx`)

Range `[0.30, 0.95]`, 150 ms debounce on drag. On commit:
1. Re-fetches `GET /graph?threshold={val}` — entire graph re-clusters instantly
2. If a node is already selected, re-fetches `/resolve/{id}?threshold={val}`

Four preset buttons snap to LOOSE / OPT / STRICT / HIGH.

---

## 6. Data Flow — End to End

### Graph Load

```
User enters dashboard
  → App.jsx useEffect → fetchGraph(0.55)
  → GET /graph?threshold=0.55
  → backend BFS clusters active_alias_ids
  → returns { nodes[], edges[], clusters[] }
  → Graph.jsx re-renders canvas, D3 simulation reheats
```

### Node Click

```
User clicks a node on the canvas
  → handleNodeClick(node)
  → parallel:
      GET /aliases/{id}     → alias profile + post history
      GET /resolve/{id}     → cluster membership + ranked matches
  → EvidencePanel slides in (node mode)
```

### Edge Click

```
User clicks an edge on the canvas
  → handleEdgeClick(edge)
  → EvidencePanel slides in (edge mode)
  → EvidencePanel useEffect fires:
      GET /explain/{a}/{b}  → forensic signal breakdown
  → renders classification, bars, evidence, table
```

### Threshold Change

```
User drags slider (150ms debounce)
  → GET /graph?threshold={new}          → graph re-clusters
  → if node selected:
      GET /resolve/{id}?threshold={new} → matches update
  → canvas redraws, clusters merge or fracture
```

---

## 7. Core Algorithms

### BFS Cluster Resolution — `graph.py`

```python
for aid in active_aids:
    if aid not in visited:
        queue = [aid]
        visited.add(aid)
        comp = []
        while queue:
            curr = queue.pop(0)
            comp.append(curr)
            for other in active_aids:
                if other not in visited:
                    if matrix[idx(curr)][idx(other)] >= threshold:
                        visited.add(other)
                        queue.append(other)
        # comp = one resolved cluster
```

### Composite Score — `embed_and_score.py`

```
score(A, B) = 0.45 · semantic(A, B)
            + 0.20 · lexical(A, B)
            + 0.15 · syntactic(A, B)
            + 0.20 · temporal(A, B)
```

Clipped to `[0.0, 1.0]`. Weights calibrated against ground-truth persona pairs.

---

## 8. Key Design Decisions

### Zero Runtime Inference
All ML computation (transformer encoding, cosine similarity) happens in the offline pipeline. The backend never loads a model. This gives:
- Sub-5 ms API responses with no GPU dependency
- Deployable on any server with 512 MB RAM
- No cold-start latency during demos

Tradeoff: adding new aliases requires re-running `embed_and_score.py` and restarting the backend.

### No Database
The full dataset is under 1 MB and read-only at runtime. A database would add query latency and operational complexity with zero benefit at this scale.

### Canvas over SVG
`react-force-graph-2d` renders to `<canvas>` rather than SVG DOM nodes. This avoids DOM bloat at 30+ nodes, enables full sub-pixel control over label pill rendering, and keeps the D3 physics loop out of React's reconciliation cycle entirely.

### Framer Motion `AnimatePresence`
The slide-in EvidencePanel uses `AnimatePresence` so the panel properly unmounts after its exit animation completes, rather than toggling `display:none` and losing the transition.

### Prop Drilling (no state store)
The component tree is 3 levels deep at most. Adding a context or external store would be pure overhead for this scope.

---

## 9. Signal Weights & Calibration

| Signal | Weight | Rationale |
|--------|--------|-----------|
| Semantic (transformer cosine) | **0.45** | Strongest signal — captures topic, vocabulary, and reasoning style holistically |
| Temporal (UTC hour histogram) | **0.20** | Activity windows are consistent per person and difficult to fake across platforms |
| Lexical (TF-IDF bigram cosine) | **0.20** | Captures distinctive jargon, slang, and phrase collocations |
| Syntactic (cadence + punctuation) | **0.15** | Weakest in isolation — reinforces the semantic signal |

**Decoy validation:** Personas P7 (speculative crypto moonboy) and P8 (quantitative crypto analyst) both discuss cryptocurrency but score `0.17–0.20`. This confirms the system distinguishes *writing style* over subject matter — it would not falsely cluster them at any reasonable threshold.

---

## 10. Benchmarks

| Metric | Result |
|--------|--------|
| Same-persona composite score range | **0.65 – 0.82** |
| Cross-persona composite score range | **0.16 – 0.46** |
| Decoy pair score (P7 vs P8) | **0.17 – 0.20** |
| Cluster purity at default threshold (0.62) | **100%** — 8 of 8 clusters pure |
| `GET /graph` API response time | **< 5 ms** |
| `GET /explain` API response time | **< 10 ms** |
| Offline pipeline runtime (31 aliases, CPU) | **~90 seconds** |
| `similarity_matrix.json` size on disk | **~420 KB** |
| `personas.json` size on disk | **~46 KB** |
