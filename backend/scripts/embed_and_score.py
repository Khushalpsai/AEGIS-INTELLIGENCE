"""
embed_and_score.py — Offline embedding + similarity matrix generator.

Loads personas.json, embeds alias-level text corpora using sentence-transformers,
computes pairwise cosine similarity, extracts evidence signals, and writes
similarity_matrix.json. Run ONCE, commit the output, never run during demo.
"""

import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parent / "app" / "data"
PERSONAS_PATH = DATA_DIR / "personas.json"
OUTPUT_PATH = DATA_DIR / "similarity_matrix.json"


def load_personas(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def flatten_aliases(data: dict) -> list[dict]:
    """Return a flat list of alias dicts with a concatenated 'corpus' field."""
    aliases = []
    for persona in data["personas"]:
        for alias in persona["aliases"]:
            corpus = " ".join(post["text"] for post in alias["posts"])
            aliases.append({
                "alias_id": alias["alias_id"],
                "username": alias["username"],
                "platform": alias["platform"],
                "corpus": corpus,
                "posts": alias["posts"],
                "persona_id": persona["persona_id"],  # ground truth, for validation only
                "held_back": alias.get("held_back", False)
            })
    return aliases


def compute_embeddings(corpora: list[str]) -> np.ndarray:
    """Embed alias-level text corpora using sentence-transformers."""
    from sentence_transformers import SentenceTransformer

    print("Loading model all-MiniLM-L6-v2 ...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded. Computing embeddings ...")
    embeddings = model.encode(corpora, show_progress_bar=True, normalize_embeddings=True)
    return np.array(embeddings)


# ---------------------------------------------------------------------------
# Evidence extraction — stylometric heuristics
# ---------------------------------------------------------------------------

def extract_ngrams(text: str, n: int = 2) -> list[str]:
    """Extract word-level n-grams from lowercased text."""
    words = re.findall(r"[a-z0-9']+", text.lower())
    return [" ".join(words[i:i+n]) for i in range(len(words) - n + 1)]


def shared_ngrams(corpus_a: str, corpus_b: str, n: int = 2, top_k: int = 8) -> list[str]:
    """Find the most frequent shared n-grams between two corpora."""
    ngrams_a = Counter(extract_ngrams(corpus_a, n))
    ngrams_b = Counter(extract_ngrams(corpus_b, n))
    common = set(ngrams_a.keys()) & set(ngrams_b.keys())
    scored = [(ng, ngrams_a[ng] + ngrams_b[ng]) for ng in common]
    scored.sort(key=lambda x: -x[1])
    stopwords = {"the", "a", "an", "is", "it", "of", "to", "and", "in", "for",
                 "on", "that", "this", "with", "i", "you", "my", "be", "have",
                 "not", "are", "was", "but", "or", "at", "by", "from", "as"}
    filtered = []
    for ng, _ in scored:
        words = set(ng.split())
        if not words.issubset(stopwords):
            filtered.append(ng)
        if len(filtered) >= top_k:
            break
    return filtered


def avg_sentence_length(text: str) -> float:
    """Average word count per sentence."""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 0.0
    return float(np.mean([len(s.split()) for s in sentences]))


def punctuation_profile(text: str) -> dict[str, float]:
    """Relative frequency of punctuation marks."""
    total = len(text) or 1
    marks = "!?.,;:—-...\"'()"
    profile = {}
    for m in marks:
        profile[m] = text.count(m) / total
    return profile


def punctuation_similarity(profile_a: dict, profile_b: dict) -> float:
    """Cosine similarity between two punctuation profiles."""
    keys = set(profile_a.keys()) | set(profile_b.keys())
    vec_a = np.array([profile_a.get(k, 0) for k in keys])
    vec_b = np.array([profile_b.get(k, 0) for k in keys])
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))


def compute_evidence(aliases: list[dict]) -> dict[str, dict]:
    """Compute pairwise evidence signals for all alias pairs."""
    evidence = {}
    n = len(aliases)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = aliases[i], aliases[j]
            key = f"{a['alias_id']}-{b['alias_id']}"
            reverse_key = f"{b['alias_id']}-{a['alias_id']}"

            shared = shared_ngrams(a["corpus"], b["corpus"])
            len_a = avg_sentence_length(a["corpus"])
            len_b = avg_sentence_length(b["corpus"])
            punc_a = punctuation_profile(a["corpus"])
            punc_b = punctuation_profile(b["corpus"])
            punc_sim = punctuation_similarity(punc_a, punc_b)

            drivers = []
            if len(shared) >= 2:
                drivers.append("vocabulary overlap")
            if abs(len_a - len_b) < 6:
                drivers.append("sentence length cadence")
            if punc_sim > 0.65:
                drivers.append("punctuation style")

            ev_obj = {
                "shared_phrases": shared if shared else ["no significant lexical overlap"],
                "sentence_length_delta": round(abs(len_a - len_b), 2),
                "punctuation_similarity": round(punc_sim, 3),
                "top_score_drivers": drivers if drivers else ["semantic embedding baseline"],
            }
            evidence[key] = ev_obj
            evidence[reverse_key] = ev_obj
    return evidence


# ---------------------------------------------------------------------------
# Threshold sweep — for demo narration planning
# ---------------------------------------------------------------------------

def connected_components(alias_ids: list[str], matrix: list[list[float]], threshold: float) -> list[list[str]]:
    """Simple connected-components clustering on the thresholded similarity matrix."""
    n = len(alias_ids)
    visited = [False] * n
    clusters = []

    def dfs(node, cluster):
        visited[node] = True
        cluster.append(alias_ids[node])
        for neighbor in range(n):
            if not visited[neighbor] and node != neighbor and matrix[node][neighbor] >= threshold:
                dfs(neighbor, cluster)

    for i in range(n):
        if not visited[i]:
            cluster = []
            dfs(i, cluster)
            clusters.append(cluster)

    return clusters


def threshold_sweep(alias_ids: list[str], matrix: list[list[float]], aliases: list[dict]):
    """Print cluster membership at key thresholds for demo planning."""
    persona_lookup = {a["alias_id"]: a["persona_id"] for a in aliases}

    print("\n" + "=" * 70)
    print("THRESHOLD SWEEP - Cluster membership at key thresholds")
    print("=" * 70)

    for threshold in [0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9]:
        clusters = connected_components(alias_ids, matrix, threshold)
        print(f"\n--- Threshold = {threshold} ---")
        for i, cluster in enumerate(clusters):
            personas = set(persona_lookup[aid] for aid in cluster)
            label = ", ".join(sorted(personas))
            members = ", ".join(cluster)
            purity = "PURE" if len(personas) == 1 else "MIXED [!]"
            print(f"  Cluster {i+1} ({len(cluster)} aliases): [{members}] -> personas: {{{label}}} [{purity}]")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Loading personas from {PERSONAS_PATH} ...")
    data = load_personas(PERSONAS_PATH)
    aliases = flatten_aliases(data)
    alias_ids = [a["alias_id"] for a in aliases]
    corpora = [a["corpus"] for a in aliases]

    print(f"Found {len(aliases)} aliases across {len(data['personas'])} personas.\n")

    embeddings = compute_embeddings(corpora)

    print("Computing cosine similarity matrix ...")
    sim_matrix_raw = cosine_similarity(embeddings)
    np.fill_diagonal(sim_matrix_raw, 1.0)
    sim_matrix = np.round(sim_matrix_raw, 4).tolist()

    print("Extracting evidence signals ...")
    evidence = compute_evidence(aliases)

    print("\n" + "=" * 70)
    print("SANITY CHECK - Same-persona pairs vs cross-persona pairs")
    print("=" * 70)
    persona_lookup = {a["alias_id"]: a["persona_id"] for a in aliases}
    same_scores = []
    diff_scores = []
    for i in range(len(alias_ids)):
        for j in range(i + 1, len(alias_ids)):
            score = sim_matrix[i][j]
            if persona_lookup[alias_ids[i]] == persona_lookup[alias_ids[j]]:
                same_scores.append((alias_ids[i], alias_ids[j], score))
            else:
                diff_scores.append((alias_ids[i], alias_ids[j], score))

    print("\nSame-persona pairs (should be HIGH):")
    for a, b, s in sorted(same_scores, key=lambda x: -x[2]):
        print(f"  {a} <-> {b}: {s:.4f}  [{persona_lookup[a]}]")

    print("\nTop 10 cross-persona pairs (should be LOW):")
    for a, b, s in sorted(diff_scores, key=lambda x: -x[2])[:10]:
        print(f"  {a} <-> {b}: {s:.4f}  [{persona_lookup[a]} vs {persona_lookup[b]}]")

    print("\n" + "=" * 70)
    print("DECOY CHECK - P7 (crypto moonboy) vs P8 (crypto quant analyst)")
    print("=" * 70)
    decoy_aliases_p7 = [a["alias_id"] for a in aliases if a["persona_id"] == "P7"]
    decoy_aliases_p8 = [a["alias_id"] for a in aliases if a["persona_id"] == "P8"]
    all_other = [a["alias_id"] for a in aliases if a["persona_id"] not in ("P7", "P8")]

    for a7 in decoy_aliases_p7:
        for a8 in decoy_aliases_p8:
            i = alias_ids.index(a7)
            j = alias_ids.index(a8)
            score = sim_matrix[i][j]
            status = "OK [pass]" if score < 0.65 else "WARNING [!] - may cross-resolve!"
            print(f"  {a7} (P7) <-> {a8} (P8): {score:.4f}  [{status}]")

    print("\nDecoys vs other personas:")
    for decoy_id in decoy_aliases_p7 + decoy_aliases_p8:
        for other_id in all_other:
            i = alias_ids.index(decoy_id)
            j = alias_ids.index(other_id)
            score = sim_matrix[i][j]
            if score >= 0.65:
                print(f"  WARNING [!] {decoy_id} <-> {other_id}: {score:.4f} - decoy resolving with non-decoy!")
            else:
                pass
    print("  Decoy cross-check complete.")

    threshold_sweep(alias_ids, sim_matrix, aliases)

    output = {
        "alias_ids": alias_ids,
        "matrix": sim_matrix,
        "evidence": evidence,
    }
    print(f"\nWriting similarity matrix to {OUTPUT_PATH} ...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print("Done. Matrix written successfully.")


if __name__ == "__main__":
    main()
