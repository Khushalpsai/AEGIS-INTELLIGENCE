import json
from pathlib import Path
from typing import Dict, List, Optional, Set
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import aliases, graph

app = FastAPI(
    title="Dark-Web Threat Actor Identity Resolution API",
    version="1.0.0",
    description="Backend API serving precomputed stylometric embeddings, similarity graph, cluster resolution, and staged alias injection."
)

# Enable CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-Memory State & Data Loading
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent / "data"
PERSONAS_PATH = DATA_DIR / "personas.json"
SIMILARITY_PATH = DATA_DIR / "similarity_matrix.json"

class SystemState:
    personas_raw: dict = {}
    similarity_data: dict = {}
    
    # Fast lookups
    aliases_dict: Dict[str, dict] = {}           # alias_id -> { alias_id, username, platform, posts, held_back }
    alias_id_to_idx: Dict[str, int] = {}         # alias_id -> matrix index
    alias_ids: List[str] = []                    # list of all alias_ids in matrix order
    matrix: List[List[float]] = []               # NxN similarity matrix
    evidence_dict: Dict[str, dict] = {}          # "A1-A2" -> evidence obj
    
    # Active vs staged pool for demo
    active_alias_ids: Set[str] = set()
    staged_inject_pool: List[str] = []

state = SystemState()

@app.on_event("startup")
def load_dataset():
    with open(PERSONAS_PATH, "r", encoding="utf-8") as f:
        state.personas_raw = json.load(f)
        
    with open(SIMILARITY_PATH, "r", encoding="utf-8") as f:
        state.similarity_data = json.load(f)

    state.alias_ids = state.similarity_data["alias_ids"]
    state.matrix = state.similarity_data["matrix"]
    state.evidence_dict = state.similarity_data.get("evidence", {})
    state.staged_inject_pool = state.personas_raw.get("staged_inject_aliases", [])
    
    for idx, aid in enumerate(state.alias_ids):
        state.alias_id_to_idx[aid] = idx

    for persona in state.personas_raw.get("personas", []):
        for alias in persona.get("aliases", []):
            aid = alias["alias_id"]
            state.aliases_dict[aid] = {
                "alias_id": aid,
                "username": alias["username"],
                "platform": alias["platform"],
                "held_back": alias.get("held_back", False),
                "posts": alias.get("posts", [])
            }
            if not alias.get("held_back", False):
                state.active_alias_ids.add(aid)

    print(f"[STARTUP] Loaded {len(state.alias_ids)} total aliases.")
    print(f"[STARTUP] Active aliases: {len(state.active_alias_ids)} | Staged injection pool: {state.staged_inject_pool}")

# Mount routers
app.include_router(aliases.router, prefix="", tags=["Aliases"])
app.include_router(graph.router, prefix="", tags=["Graph & Resolution"])

@app.get("/")
def root():
    return {
        "service": "Dark-Web Identity Resolution API",
        "status": "online",
        "active_aliases": len(state.active_alias_ids),
        "staged_aliases": state.staged_inject_pool
    }
