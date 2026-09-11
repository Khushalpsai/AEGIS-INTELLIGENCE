import json, math, re
from collections import Counter
from datetime import datetime
from pathlib import Path
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

SCRIPT_DIR    = Path(__file__).resolve().parent
DATA_DIR      = SCRIPT_DIR.parent / "app" / "data"
PERSONAS_PATH = DATA_DIR / "personas.json"
OUTPUT_PATH   = DATA_DIR / "similarity_matrix.json"

W_SEMANTIC  = 0.45
W_LEXICAL   = 0.20
W_SYNTACTIC = 0.15
W_TEMPORAL  = 0.20

def load_personas(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def flatten_aliases(data):
    aliases = []
    for persona in data["personas"]:
        for alias in persona["aliases"]:
            corpus = " ".join(p["text"] for p in alias["posts"])
            aliases.append({
                "alias_id":   alias["alias_id"],
                "username":   alias["username"],
                "platform":   alias["platform"],
                "corpus":     corpus,
                "posts":      alias["posts"],
                "persona_id": persona["persona_id"],
                "held_back":  alias.get("held_back", False),
            })
    return aliases

def compute_semantic_embeddings(corpora):
    from sentence_transformers import SentenceTransformer
    print("  Loading all-MiniLM-L6-v2 ...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("  Encoding corpora ...")
    emb = model.encode(corpora, show_progress_bar=True, normalize_embeddings=True, batch_size=32)
    return np.array(emb, dtype=np.float32)

def compute_semantic_matrix(emb):
    sim = cosine_similarity(emb).astype(np.float32)
    np.fill_diagonal(sim, 1.0)
    return np.clip(sim, 0.0, 1.0)

def tokenize(text):
    return re.findall(r"[a-z0-9]+", text.lower())

def build_idf(corpora):
    N = len(corpora)
    df = Counter()
    for corpus in corpora:
        toks = tokenize(corpus)
        bigs = [f"{toks[i]} {toks[i+1]}" for i in range(len(toks)-1)]
        df.update(set(toks+bigs))
    return {t: math.log((N+1)/(c+1))+1.0 for t,c in df.items()}

def build_tfidf_vec(corpus, idf):
    toks = tokenize(corpus)
    bigs = [f"{toks[i]} {toks[i+1]}" for i in range(len(toks)-1)]
    tf   = Counter(toks+bigs)
    return {t: (1.0+math.log(c))*idf[t] for t,c in tf.items() if t in idf}

def tfidf_cosine(va, vb):
    common = set(va) & set(vb)
    if not common: return 0.0
    dot = sum(va[t]*vb[t] for t in common)
    na  = math.sqrt(sum(v*v for v in va.values()))
    nb  = math.sqrt(sum(v*v for v in vb.values()))
    if na == 0 or nb == 0: return 0.0
    return float(np.clip(dot/(na*nb), 0.0, 1.0))

def compute_lexical_matrix(corpora):
    print("  Building TF-IDF vectors ...")
    idf  = build_idf(corpora)
    vecs = [build_tfidf_vec(c, idf) for c in corpora]
    n    = len(vecs)
    mat  = np.eye(n, dtype=np.float32)
    for i in range(n):
        for j in range(i+1, n):
            s = tfidf_cosine(vecs[i], vecs[j])
            mat[i,j] = mat[j,i] = s
    return mat

def avg_sent_len(text):
    sents = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    return float(np.mean([len(s.split()) for s in sents])) if sents else 0.0

def punc_profile(text):
    marks = list("!?.,;:")
    total = max(len(text), 1)
    return np.array([text.count(m)/total for m in marks], dtype=np.float32)

def vec_cos(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0: return 0.0
    return float(np.clip(np.dot(a,b)/(na*nb), 0.0, 1.0))

def syn_score_pair(ca, cb):
    cadence  = max(0.0, 1.0-abs(avg_sent_len(ca)-avg_sent_len(cb))/15.0)
    punc_cos = vec_cos(punc_profile(ca), punc_profile(cb))
    return float(np.clip(0.5*cadence + 0.5*punc_cos, 0.0, 1.0))

def compute_syntactic_matrix(corpora):
    print("  Computing syntactic scores ...")
    n   = len(corpora)
    mat = np.eye(n, dtype=np.float32)
    for i in range(n):
        for j in range(i+1, n):
            s = syn_score_pair(corpora[i], corpora[j])
            mat[i,j] = mat[j,i] = s
    return mat

LAPLACE_ALPHA = 0.1

def hourly_histogram(posts):
    counts = np.zeros(24, dtype=np.float32)
    for p in posts:
        try:
            dt = datetime.fromisoformat(p.get("timestamp","").replace("Z","+00:00"))
            counts[dt.hour] += 1
        except:
            pass
    total = counts.sum()
    return (counts + LAPLACE_ALPHA) / (total + 24 * LAPLACE_ALPHA)

def compute_temporal_matrix(aliases):
    print("  Computing temporal histograms ...")
    hists = [hourly_histogram(a["posts"]) for a in aliases]
    n     = len(hists)
    mat   = np.eye(n, dtype=np.float32)
    for i in range(n):
        for j in range(i+1, n):
            s = vec_cos(hists[i], hists[j])
            mat[i,j] = mat[j,i] = s
    return mat

def extract_ngrams(text, n=2):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return [" ".join(words[i:i+n]) for i in range(len(words)-n+1)]

def shared_ngrams(ca, cb, n=2, top_k=8):
    nga = Counter(extract_ngrams(ca, n))
    ngb = Counter(extract_ngrams(cb, n))
    common = set(nga) & set(ngb)
    scored = sorted([(g, nga[g]+ngb[g]) for g in common], key=lambda x:-x[1])
    sw = {"the","a","an","is","it","of","to","and","in","for","on","that",
          "this","with","i","you","my","be","have","not","are","was","but",
          "or","at","by","from","as"}
    return [g for g,_ in scored if not set(g.split()).issubset(sw)][:top_k]

def build_evidence(aliases, sem, lex, syn, tmp):
    ev = {}
    n  = len(aliases)
    for i in range(n):
        for j in range(i+1, n):
            a, b    = aliases[i], aliases[j]
            aid, bid = a["alias_id"], b["alias_id"]
            key      = f"{aid}-{bid}"
            rev      = f"{bid}-{aid}"
            shared   = shared_ngrams(a["corpus"], b["corpus"])
            la, lb   = avg_sent_len(a["corpus"]), avg_sent_len(b["corpus"])
            punc_sim = vec_cos(punc_profile(a["corpus"]), punc_profile(b["corpus"]))
            sem_s    = float(sem[i,j])
            lex_s    = float(lex[i,j])
            syn_s    = float(syn[i,j])
            tmp_s    = float(tmp[i,j])
            drivers  = []
            if len(shared) >= 2: drivers.append("vocabulary overlap")
            if abs(la-lb) < 6:   drivers.append("sentence length cadence")
            if punc_sim > 0.65:  drivers.append("punctuation style")
            if tmp_s > 0.70:     drivers.append("temporal activity overlap")
            if lex_s > 0.65:     drivers.append("TF-IDF lexical alignment")
            obj = {
                "shared_phrases":         shared if shared else ["no significant lexical overlap"],
                "sentence_length_delta":  round(abs(la-lb), 2),
                "punctuation_similarity": round(punc_sim, 4),
                "top_score_drivers":      drivers if drivers else ["semantic embedding baseline"],
                "signals": {
                    "semantic":  round(sem_s, 4),
                    "lexical":   round(lex_s, 4),
                    "syntactic": round(syn_s, 4),
                    "temporal":  round(tmp_s, 4),
                },
            }
            ev[key] = ev[rev] = obj
    return ev

def compute_composite(sem, lex, syn, tmp):
    comp = W_SEMANTIC*sem + W_LEXICAL*lex + W_SYNTACTIC*syn + W_TEMPORAL*tmp
    np.fill_diagonal(comp, 1.0)
    return np.round(np.clip(comp, 0.0, 1.0), 4)

def connected_components_cc(alias_ids, matrix, threshold, pl):
    n, visited, clusters = len(alias_ids), [False]*len(alias_ids), []
    def dfs(node, comp):
        visited[node] = True
        comp.append(node)
        for nbr in range(n):
            if not visited[nbr] and node != nbr and matrix[node,nbr] >= threshold:
                dfs(nbr, comp)
    for i in range(n):
        if not visited[i]:
            comp = []
            dfs(i, comp)
            ps = {pl[alias_ids[k]] for k in comp}
            clusters.append({"aliases": [alias_ids[k] for k in comp], "personas": ps, "pure": len(ps)==1})
    return clusters

def calibration_report(alias_ids, matrix, aliases, threshold=0.62):
    pl = {a["alias_id"]: a["persona_id"] for a in aliases}
    same, diff = [], []
    n = len(alias_ids)
    for i in range(n):
        for j in range(i+1,n):
            s = float(matrix[i,j])
            bucket = same if pl[alias_ids[i]]==pl[alias_ids[j]] else diff
            bucket.append((alias_ids[i], alias_ids[j], s))
    sep = "="*72
    print(f"\n{sep}\nCALIBRATION REPORT -- Multi-Signal Composite\n{sep}")
    print(f"\n[Same-persona pairs] (target>={threshold})")
    for a,b,s in sorted(same, key=lambda x:-x[2]):
        flag = "OK" if s>=threshold else "BELOW_THRESHOLD"
        print(f"  {a:5} <-> {b:5}  {s:.4f}  {pl[a]}  [{flag}]")
    avg_same = float(np.mean([s for *_,s in same])) if same else 0.0
    avg_diff = float(np.mean([s for *_,s in diff])) if diff else 0.0
    print(f"  avg same :{avg_same:.4f}  avg diff:{avg_diff:.4f}")
    print(f"\n[Top 10 cross-persona pairs] (target<=0.45)")
    for a,b,s in sorted(diff, key=lambda x:-x[2])[:10]:
        flag = "OK" if s<=0.45 else "ELEVATED"
        print(f"  {a:5} <-> {b:5}  {s:.4f}  [{pl[a]} vs {pl[b]}]  [{flag}]")
    p7 = [a["alias_id"] for a in aliases if a["persona_id"]=="P7"]
    p8 = [a["alias_id"] for a in aliases if a["persona_id"]=="P8"]
    if p7 and p8:
        print("\n[Decoy P7 vs P8] (target < 0.30)")
        for a7 in p7:
            for a8 in p8:
                i,j = alias_ids.index(a7), alias_ids.index(a8)
                s = float(matrix[i,j])
                flag = "ISOLATED" if s<0.30 else "ELEVATED"
                print(f"  {a7} <-> {a8}: {s:.4f}  [{flag}]")
    print("\n[Threshold sweep]")
    for t in [0.50, 0.55, 0.62, 0.65, 0.70, 0.75, 0.80]:
        cs    = connected_components_cc(alias_ids, matrix, t, pl)
        pure  = sum(1 for c in cs if c["pure"])
        multi = sum(1 for c in cs if len(c["aliases"])>1)
        print(f"  t={t:.2f}  clusters={len(cs):3d}  pure={pure}/{len(cs)}  multi={multi}")

def main():
    print("\nAEGIS-INTELLIGENCE Multi-Signal Composite Generator")
    print(f"Sem={W_SEMANTIC} Lex={W_LEXICAL} Syn={W_SYNTACTIC} Tmp={W_TEMPORAL}\n")
    data      = load_personas(PERSONAS_PATH)
    aliases   = flatten_aliases(data)
    alias_ids = [a["alias_id"] for a in aliases]
    corpora   = [a["corpus"]   for a in aliases]
    print(f"Loaded {len(aliases)} aliases across {len(data['personas'])} personas.\n")
    print("[1/4] Semantic")
    sem_emb = compute_semantic_embeddings(corpora)
    sem     = compute_semantic_matrix(sem_emb)
    print("\n[2/4] Lexical")
    lex = compute_lexical_matrix(corpora)
    print("\n[3/4] Syntactic")
    syn = compute_syntactic_matrix(corpora)
    print("\n[4/4] Temporal")
    tmp = compute_temporal_matrix(aliases)
    print("\nComposite ...")
    composite = compute_composite(sem, lex, syn, tmp)
    print("Evidence ...")
    evidence = build_evidence(aliases, sem, lex, syn, tmp)
    calibration_report(alias_ids, composite, aliases)
    output = {
        "alias_ids": alias_ids,
        "matrix":    composite.tolist(),
        "evidence":  evidence,
        "weights":   {"semantic": W_SEMANTIC, "lexical": W_LEXICAL, "syntactic": W_SYNTACTIC, "temporal": W_TEMPORAL},
    }
    print(f"\nWriting {OUTPUT_PATH} ...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print("Done.")

if __name__ == "__main__":
    main()
