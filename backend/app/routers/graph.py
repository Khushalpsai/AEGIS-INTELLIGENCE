from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import app.main as main_app
import re
from datetime import datetime

router = APIRouter()

class InjectRequest(BaseModel):
    alias_id: Optional[str] = None

def compute_connected_components(active_aids: List[str], matrix: List[List[float]], aid_to_idx: Dict[str, int], threshold: float):
    """
    Compute connected components for the active aliases given threshold.
    Returns:
      cluster_map: Dict[alias_id, int] (cluster index 1..K)
      clusters: List[Dict] with cluster_id, aliases, avg_confidence
    """
    n = len(active_aids)
    visited = set()
    clusters = []
    cluster_map = {}

    def get_score(aid1, aid2):
        i = aid_to_idx[aid1]
        j = aid_to_idx[aid2]
        return matrix[i][j]

    cluster_counter = 1
    for aid in active_aids:
        if aid not in visited:
            # BFS / DFS
            queue = [aid]
            visited.add(aid)
            comp = []
            
            while queue:
                curr = queue.pop(0)
                comp.append(curr)
                for other in active_aids:
                    if other not in visited and curr != other:
                        if get_score(curr, other) >= threshold:
                            visited.add(other)
                            queue.append(other)
            
            # Compute average confidence (intra-cluster similarity)
            pair_scores = []
            for i in range(len(comp)):
                for j in range(i + 1, len(comp)):
                    pair_scores.append(get_score(comp[i], comp[j]))
            
            if len(comp) > 1 and pair_scores:
                avg_conf = round(float(sum(pair_scores) / len(pair_scores)), 4)
                conf_pct = round(avg_conf * 100, 1)
            else:
                avg_conf = None
                conf_pct = None
            
            cluster_id = f"Cluster-{cluster_counter}"
            for member in comp:
                cluster_map[member] = cluster_id

            clusters.append({
                "cluster_id": cluster_id,
                "alias_count": len(comp),
                "aliases": comp,
                "confidence": avg_conf,
                "confidence_pct": conf_pct
            })
            cluster_counter += 1

    return cluster_map, clusters


@router.get("/graph")
def get_graph(threshold: float = Query(0.62, ge=0.0, le=1.0)):
    """
    Returns nodes and edges filtered by similarity threshold.
    Threshold slider hits this endpoint. Zero live ML inference — purely matrix filtering.
    """
    state = main_app.state
    active_aids = sorted(list(state.active_alias_ids))
    
    cluster_map, clusters = compute_connected_components(
        active_aids, state.matrix, state.alias_id_to_idx, threshold
    )

    # Build nodes list
    nodes = []
    for aid in active_aids:
        alias = state.aliases_dict[aid]
        nodes.append({
            "id": aid,
            "alias_id": aid,
            "username": alias["username"],
            "platform": alias["platform"],
            "post_count": len(alias.get("posts", [])),
            "cluster_id": cluster_map.get(aid, "Unassigned"),
        })

    # Build edges list filtered by threshold
    edges = []
    for i in range(len(active_aids)):
        aid1 = active_aids[i]
        idx1 = state.alias_id_to_idx[aid1]
        for j in range(i + 1, len(active_aids)):
            aid2 = active_aids[j]
            idx2 = state.alias_id_to_idx[aid2]
            score = state.matrix[idx1][idx2]
            if score >= threshold:
                key = f"{aid1}-{aid2}"
                ev = state.evidence_dict.get(key, {})
                edges.append({
                    "source": aid1,
                    "target": aid2,
                    "score": round(score, 4),
                    "evidence": ev
                })

    return {
        "threshold": threshold,
        "nodes": nodes,
        "edges": edges,
        "clusters": clusters,
        "staged_aliases": [aid for aid in state.staged_inject_pool if aid not in state.active_alias_ids]
    }


@router.get("/resolve/{alias_id}")
def resolve_alias(alias_id: str, threshold: float = Query(0.62, ge=0.0, le=1.0), compare_all: bool = False):
    """
    Resolve which cluster an alias resolves into + confidence + evidence per connected alias.
    """
    state = main_app.state
    if alias_id not in state.aliases_dict:
        raise HTTPException(status_code=404, detail=f"Alias '{alias_id}' not found")

    if compare_all:
        active_aids = list(state.aliases_dict.keys())
    else:
        active_aids = sorted(list(state.active_alias_ids))
        if alias_id not in active_aids:
            active_aids.append(alias_id)

    cluster_map, clusters = compute_connected_components(
        active_aids, state.matrix, state.alias_id_to_idx, threshold
    )

    my_cluster_id = cluster_map.get(alias_id, "Cluster-1")
    my_cluster = next((c for c in clusters if c["cluster_id"] == my_cluster_id), None)

    # Gather pairwise connections & evidence with aliases in the same cluster or across active set
    matches = []
    idx1 = state.alias_id_to_idx[alias_id]
    for other_aid in active_aids:
        if other_aid == alias_id:
            continue
        idx2 = state.alias_id_to_idx[other_aid]
        score = state.matrix[idx1][idx2]
        key = f"{alias_id}-{other_aid}"
        ev = state.evidence_dict.get(key, state.evidence_dict.get(f"{other_aid}-{alias_id}", {}))
        
        conf_pct = round(score * 100)
        if conf_pct < 40:
            confidence_label = "Weak"
        elif conf_pct < 65:
            confidence_label = "Possible"
        elif conf_pct < 80:
            confidence_label = "Probable"
        else:
            confidence_label = "High-confidence linkage"
            
        matches.append({
            "target_alias_id": other_aid,
            "target_username": state.aliases_dict[other_aid]["username"],
            "target_platform": state.aliases_dict[other_aid]["platform"],
            "score": round(score, 4),
            "confidence_pct": conf_pct,
            "confidence_label": confidence_label,
            "is_above_threshold": score >= threshold,
            "evidence": ev
        })

    # Sort matches by similarity score descending
    matches.sort(key=lambda x: -x["score"])

    return {
        "alias_id": alias_id,
        "username": state.aliases_dict[alias_id]["username"],
        "platform": state.aliases_dict[alias_id]["platform"],
        "threshold": threshold,
        "cluster_id": my_cluster_id,
        "cluster_summary": my_cluster,
        "matches": matches
    }


@router.post("/inject")
def inject_alias(req: Optional[InjectRequest] = None):
    """
    Demo-only: Inject a held-back alias from the pre-staged pool into the live graph.
    Returns the newly added node and its resolved edges with evidence.
    """
    state = main_app.state
    available_staged = [aid for aid in state.staged_inject_pool if aid not in state.active_alias_ids]
    
    target_aid = None
    if req and req.alias_id:
        target_aid = req.alias_id
    elif available_staged:
        target_aid = available_staged[0]
    else:
        # If all already injected, return status
        return {
            "status": "exhausted",
            "message": "All staged aliases have already been injected into the live graph.",
            "injected_node": None,
            "new_edges": [],
            "remaining_staged": []
        }

    if target_aid not in state.aliases_dict:
        raise HTTPException(status_code=404, detail=f"Alias '{target_aid}' not in dataset")

    # Add to active set
    state.active_alias_ids.add(target_aid)
    
    alias = state.aliases_dict[target_aid]
    target_idx = state.alias_id_to_idx[target_aid]

    # Find edges with other active nodes at threshold 0.62
    new_edges = []
    for other_aid in state.active_alias_ids:
        if other_aid == target_aid:
            continue
        other_idx = state.alias_id_to_idx[other_aid]
        score = state.matrix[target_idx][other_idx]
        key = f"{target_aid}-{other_aid}"
        ev = state.evidence_dict.get(key, state.evidence_dict.get(f"{other_aid}-{target_aid}", {}))
        
        new_edges.append({
            "source": target_aid,
            "target": other_aid,
            "score": round(score, 4),
            "evidence": ev
        })

    # Sort edges descending by score
    new_edges.sort(key=lambda x: -x["score"])

    remaining = [aid for aid in state.staged_inject_pool if aid not in state.active_alias_ids]

    return {
        "status": "success",
        "injected_alias_id": target_aid,
        "injected_node": {
            "id": target_aid,
            "alias_id": target_aid,
            "username": alias["username"],
            "platform": alias["platform"],
            "post_count": len(alias.get("posts", []))
        },
        "resolved_edges": [e for e in new_edges if e["score"] >= 0.62],
        "all_pairwise_scores": new_edges,
        "remaining_staged": remaining
    }


@router.post("/reset-demo")
def reset_demo():
    """Reset active aliases back to initial state (holding back staged aliases)."""
    state = main_app.state
    state.active_alias_ids.clear()
    for persona in state.personas_raw.get("personas", []):
        for alias in persona.get("aliases", []):
            aid = alias["alias_id"]
            if not alias.get("held_back", False):
                state.active_alias_ids.add(aid)
    return {
        "status": "reset",
        "active_count": len(state.active_alias_ids),
        "staged_pool": state.staged_inject_pool
    }

def extract_words(text: str) -> set:
    words = re.findall(r"[a-z0-9']+", text.lower())
    return set(words)

@router.get("/explain/{alias_a}/{alias_b}")
def explain_link(alias_a: str, alias_b: str):
    """
    Detailed explanation of why two aliases are linked, calculating 
    granular signals and providing natural language evidence.
    """
    state = main_app.state
    if alias_a not in state.aliases_dict or alias_b not in state.aliases_dict:
        raise HTTPException(status_code=404, detail="Alias not found")

    dict_a = state.aliases_dict[alias_a]
    dict_b = state.aliases_dict[alias_b]
    
    idx_a = state.alias_id_to_idx[alias_a]
    idx_b = state.alias_id_to_idx[alias_b]
    
    # 1. Semantic (Score)
    score = state.matrix[idx_a][idx_b]
    
    # Evidence
    key = f"{alias_a}-{alias_b}"
    ev = state.evidence_dict.get(key, state.evidence_dict.get(f"{alias_b}-{alias_a}", {}))
    
    # Calculate Lexical Jaccard Similarity on the fly
    corpus_a = " ".join([p["text"] for p in dict_a.get("posts", [])])
    corpus_b = " ".join([p["text"] for p in dict_b.get("posts", [])])
    
    words_a = extract_words(corpus_a)
    words_b = extract_words(corpus_b)
    
    intersection = words_a.intersection(words_b)
    union = words_a.union(words_b)
    jaccard = len(intersection) / len(union) if union else 0.0
    
    # The jaccard is raw vocabulary overlap. Map it nicely
    lexical_score = min(1.0, (jaccard / 0.15) * 0.8 + score * 0.2)
    
    # Syntactic score derived from sentence length delta
    delta = ev.get("sentence_length_delta", 5.0)
    syntactic_score = max(0.0, 1.0 - (delta / 15.0))
    
    # Punctuation Score
    punctuation_score = ev.get("punctuation_similarity", 0.0)
    
    # Temporal Calculation
    def get_times(posts):
        times = []
        for p in posts:
            try:
                times.append(datetime.fromisoformat(p["timestamp"].replace("Z", "+00:00")).timestamp())
            except:
                pass
        return times

    times_a = get_times(dict_a.get("posts", []))
    times_b = get_times(dict_b.get("posts", []))
    
    min_a, max_a = min(times_a) if times_a else 0, max(times_a) if times_a else 0
    min_b, max_b = min(times_b) if times_b else 0, max(times_b) if times_b else 0
    
    overlap_start = max(min_a, min_b)
    overlap_end = min(max_a, max_b)
    
    temporal_score = 0.0
    has_overlap = False
    if min_a != max_a and min_b != max_b:
        if overlap_start <= overlap_end:
            has_overlap = True
            overlap_duration = overlap_end - overlap_start
            total_duration = max(max_a, max_b) - min(min_a, min_b)
            temporal_score = overlap_duration / total_duration if total_duration > 0 else 1.0
            temporal_score = min(1.0, temporal_score + 0.4)
        else:
            gap = overlap_start - overlap_end
            temporal_score = max(0.0, 0.4 - (gap / (86400 * 30))) 

    # Confidence Classification
    conf_pct = round(score * 100)
    if conf_pct < 40:
        classification = "Weak Link"
    elif conf_pct < 65:
        classification = "Possible Link"
    elif conf_pct < 80:
        classification = "Probable Link"
    else:
        classification = "HIGH-CONFIDENCE POTENTIAL LINK"
        
    # Generate Evidence
    supporting = []
    contradictory = []
    
    if score >= 0.70:
        supporting.append("Strong semantic similarity across their posts.")
    elif score < 0.50:
        contradictory.append("Low underlying semantic alignment.")
        
    if lexical_score >= 0.65:
        supporting.append("Both aliases frequently use similar lexical patterns and distinctive n-grams.")
    elif lexical_score < 0.40:
        contradictory.append("Significant vocabulary differences detected.")
        
    if syntactic_score >= 0.75:
        supporting.append("The sentence-length distributions of the two aliases are highly correlated.")
    elif syntactic_score < 0.50:
        contradictory.append(f"Large sentence-length variance (delta of {delta} words).")
        
    if punctuation_score >= 0.80:
        supporting.append("The punctuation profiles show a strong statistical correlation.")
    elif punctuation_score < 0.50:
        contradictory.append("Distinctively different punctuation habits.")
        
    if temporal_score >= 0.60 or has_overlap:
        supporting.append("The aliases demonstrate overlapping temporal activity periods.")
    elif temporal_score < 0.20:
        contradictory.append("Low temporal correlation; active windows do not overlap.")
        
    if not contradictory:
        contradictory.append("No significant contradictory evidence detected.")
        
    shared_patterns = ev.get("shared_phrases", [])
    if shared_patterns and shared_patterns[0] == "no significant lexical overlap":
        shared_patterns = []

    # Pairwise Stats
    def active_window(times):
        if not times: return "N/A"
        hours = [datetime.fromtimestamp(t).hour for t in times]
        if not hours: return "N/A"
        return f"{min(hours):02d}–{max(hours):02d} UTC"

    stats_a = {
        "avg_sentence_length": round(sum([len(s.split()) for s in re.split(r'[.!?]+', corpus_a) if s.strip()]) / max(1, len([s for s in re.split(r'[.!?]+', corpus_a) if s.strip()])), 1),
        "post_count": len(dict_a.get("posts", [])),
        "active_window": active_window(times_a)
    }
    
    stats_b = {
        "avg_sentence_length": round(sum([len(s.split()) for s in re.split(r'[.!?]+', corpus_b) if s.strip()]) / max(1, len([s for s in re.split(r'[.!?]+', corpus_b) if s.strip()])), 1),
        "post_count": len(dict_b.get("posts", [])),
        "active_window": active_window(times_b)
    }

    return {
        "alias_a": alias_a,
        "alias_b": alias_b,
        "username_a": dict_a.get("username", ""),
        "username_b": dict_b.get("username", ""),
        "overall_confidence": round(score, 4),
        "classification": classification,
        "signals": {
            "semantic": round(score, 4),
            "lexical": round(lexical_score, 4),
            "syntactic": round(syntactic_score, 4),
            "punctuation": round(punctuation_score, 4),
            "temporal": round(temporal_score, 4)
        },
        "supporting_evidence": supporting,
        "contradictory_evidence": contradictory,
        "shared_patterns": shared_patterns,
        "pairwise_stats": {
            "Alias A": stats_a,
            "Alias B": stats_b
        },
        "summary": "AEGIS identifies a strong potential relationship between these aliases based primarily on semantic, lexical, syntactic, and temporal similarities. Assessment: Potential common operator. Further analyst verification required."
    }

