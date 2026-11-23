#!/usr/bin/env python3
"""Descarga activos de Wikimedia Commons por bloque y registra créditos.
Uso: commons_download.py spec.txt carpeta_destino
spec.txt: líneas '## Bloque_X' y debajo títulos exactos ('File:...') o 'q: consulta :: N' (top N)."""
import csv, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from commons_search import get, search, UA

def info(title):
    d = get({"action": "query", "titles": title, "prop": "imageinfo",
             "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 1920})  # miniatura estándar: pesa menos y provoca menos 429
    p = next(iter(d["query"]["pages"].values()))
    if "imageinfo" not in p: return None
    ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
    g = lambda k: re.sub(r"<[^>]+>", "", m.get(k, {}).get("value", "")).strip()
    return dict(title=p["title"], url=ii.get("thumburl") or ii["url"], page=ii["descriptionurl"],
                license=g("LicenseShortName"), artist=g("Artist"), date=g("DateTimeOriginal"),
                credit=g("Credit"), w=ii.get("width"), h=ii.get("height"))

def fetch(url, path):
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r: data = r.read()
            with open(path, "wb") as f: f.write(data)
            return True
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get("Retry-After") or 10 * (i + 1)) if e.code == 429 else 5
            print(f"  HTTP {e.code}, espero {wait}s", flush=True); time.sleep(min(wait, 660))
        except Exception as e:
            print(f"  error {e}, reintento", flush=True); time.sleep(5)
    return False

FIELDS = ["bloque", "archivo", "title", "license", "artist", "date", "credit", "page"]

def main(spec, out):
    block, n = None, 0
    path = os.path.join(out, "CREDITOS.csv")
    done = {}
    if os.path.exists(path):
        for r in csv.DictReader(open(path, encoding="utf-8")): done[(r["bloque"], r["title"])] = r["archivo"]
    else:
        with open(path, "w", newline="", encoding="utf-8") as f: csv.DictWriter(f, fieldnames=FIELDS).writeheader()
    for line in open(spec, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#!"): continue
        if line.startswith("## "):
            block, n = line[3:], 0; os.makedirs(os.path.join(out, block), exist_ok=True); continue
        titles = [line]
        if line.startswith("q:"):
            q, k = line[2:].split("::"); titles = [r["title"] for r in search(q.strip(), int(k))]
        for t in titles:
            t = t if t.startswith("File:") else t
            if (block, t) in done: n = max(n, int(done[(block, t)][:2])); continue
            meta = info(t); time.sleep(1)
            if not meta: print("NO ENCONTRADO", t); continue
            n += 1
            ext = os.path.splitext(urllib.parse.urlparse(meta["url"]).path)[1].lower() or ".jpg"
            slug = re.sub(r"[^A-Za-z0-9]+", "_", os.path.splitext(meta["title"][5:])[0])[:60].strip("_")
            fname = f"{n:02d}_{slug}{ext}"
            ok = fetch(meta["url"], os.path.join(out, block, fname)); time.sleep(1)
            print(("OK  " if ok else "FALLO"), block, fname, meta["license"], flush=True)
            if ok:
                with open(path, "a", newline="", encoding="utf-8") as f:
                    csv.DictWriter(f, fieldnames=FIELDS).writerow(dict(bloque=block, archivo=fname,
                        **{k: meta[k] for k in FIELDS[2:]}))
                done[(block, meta["title"])] = fname
            time.sleep(1.5 if os.environ.get('WIKIMEDIA_CONTACT') else 3)

if __name__ == "__main__": main(*sys.argv[1:3])
