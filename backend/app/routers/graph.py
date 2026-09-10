from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import app.main as main_app

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
