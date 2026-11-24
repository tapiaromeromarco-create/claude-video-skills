#!/usr/bin/env python3
"""Lista archivos o subcategorías de una categoría de Commons. Uso: commons_cat.py "Category:X" [file|subcat] [limite]"""
import sys
from commons_search import get
cat, typ = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "file")
n = int(sys.argv[3]) if len(sys.argv) > 3 else 50
d = get({"action": "query", "list": "categorymembers", "cmtitle": cat, "cmtype": typ, "cmlimit": n})
for m in d.get("query", {}).get("categorymembers", []): print(m["title"])
