from typing import List, Optional
from fastapi import APIRouter, HTTPException
import app.main as main_app

router = APIRouter()

@router.get("/aliases")
def get_aliases(include_staged: bool = False):
    """
    List all aliases + metadata (no similarity data).
    By default returns currently active aliases in the environment.
    """
    state = main_app.state
    results = []
    
    for aid, alias in state.aliases_dict.items():
        if include_staged or aid in state.active_alias_ids:
            results.append({
                "id": aid,
                "alias_id": aid,
                "username": alias["username"],
                "platform": alias["platform"],
                "post_count": len(alias.get("posts", [])),
                "is_active": aid in state.active_alias_ids,
                "is_staged": aid in state.staged_inject_pool and aid not in state.active_alias_ids
            })
            
    return {
        "count": len(results),
        "aliases": sorted(results, key=lambda x: x["id"])
    }

@router.get("/aliases/{alias_id}")
def get_alias_detail(alias_id: str):
    """
    Full post history and profile metadata for one alias.
    """
    state = main_app.state
    if alias_id not in state.aliases_dict:
        raise HTTPException(status_code=404, detail=f"Alias '{alias_id}' not found")
        
    alias = state.aliases_dict[alias_id]
    return {
        "id": alias["alias_id"],
        "alias_id": alias["alias_id"],
        "username": alias["username"],
        "platform": alias["platform"],
        "is_active": alias_id in state.active_alias_ids,
        "is_staged": alias_id in state.staged_inject_pool,
        "posts": alias.get("posts", [])
    }
