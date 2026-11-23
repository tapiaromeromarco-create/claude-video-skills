#!/usr/bin/env python3
"""Busca archivos en Wikimedia Commons y muestra licencia/autor/tamaño.
Uso: commons_search.py "consulta" [limite]"""
import json, sys, time, urllib.error, urllib.parse, urllib.request, re
import os
# Wikimedia pide un contacto en el User-Agent de programas automáticos.
# Defínelo tú al correr el script: WIKIMEDIA_CONTACT="tu-correo" python3 ...
UA = "video-essay-asset-search/0.2 (educational documentary" + (
    "; contact: " + os.environ["WIKIMEDIA_CONTACT"] if os.environ.get("WIKIMEDIA_CONTACT") else "") + ")"
API = "https://commons.wikimedia.org/w/api.php"

def get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(6):
        try:
            return json.load(urllib.request.urlopen(req, timeout=30))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(5 * (i + 1))
    raise RuntimeError("rate limited")

def search(q, n=8):
    d = get({"action": "query", "generator": "search", "gsrsearch": q, "gsrnamespace": 6,
             "gsrlimit": n, "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime"})
    out = []
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        g = lambda k: re.sub("<[^>]+>", "", m.get(k, {}).get("value", "")).strip()
        out.append(dict(title=p["title"], w=ii.get("width"), h=ii.get("height"), mime=ii.get("mime"),
                        license=g("LicenseShortName"), artist=g("Artist")[:60], date=g("DateTimeOriginal")[:20],
                        url=ii["url"], page=ii.get("descriptionurl")))
    return out

if __name__ == "__main__":
    for r in search(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 8):
        print(f"{r['title'][5:70]:65} | {r['w']}x{r['h']} | {r['license'][:18]:18} | {r['date']}")
