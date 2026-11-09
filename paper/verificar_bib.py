#!/usr/bin/env python3
"""Verifica que cada entrada de paper/referencias.bib exista.

- Con DOI: consulta Crossref y compara el título y el año.
- Con arXiv: consulta la API de arXiv y compara el título.
- Solo con URL: comprueba que la dirección responda.

Uso, desde la raíz del repo:  python3 paper/verificar_bib.py
Sale con error si alguna entrada no se puede verificar.
"""
import difflib
import json
import os
import re
import ssl
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from web import leer_bib, limpiar_bib  # noqa: E402

UA = {"User-Agent": "verificar-bib/1.0 (python urllib)"}


def contexto_ssl():
    """Usa los certificados del sistema si el Python no trae los suyos (pasa en macOS)."""
    ctx = ssl.create_default_context()
    if not ctx.get_ca_certs() and os.path.exists("/etc/ssl/cert.pem"):
        ctx = ssl.create_default_context(cafile="/etc/ssl/cert.pem")
    return ctx


SSL = contexto_ssl()


def normal(t):
    t = unicodedata.normalize("NFKD", t)
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()


def parecido(a, b):
    a, b = normal(a), normal(b)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def obtener(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30, context=SSL) as r:
        return r.status, r.read().decode("utf-8", "replace")


def verificar(clave, e):
    titulo = limpiar_bib(e.get("title", ""))
    anio = limpiar_bib(e.get("year", ""))
    if e.get("doi"):
        doi = limpiar_bib(e["doi"])
        _, cuerpo = obtener("https://api.crossref.org/works/" + urllib.parse.quote(doi))
        m = json.loads(cuerpo)["message"]
        t = " ".join(m.get("title") or [""])
        sub = " ".join(m.get("subtitle") or [])
        fechas = [m.get(k, {}).get("date-parts", [[None]])[0][0] for k in ("published-print", "published-online", "issued", "created")]
        fechas = [f for f in fechas if f]
        sim = max(parecido(titulo, t), parecido(titulo, t + " " + sub))
        ok_anio = not anio or not fechas or any(abs(int(anio) - f) <= 1 for f in fechas)
        if sim >= 0.8 and ok_anio:
            return True, f"DOI {doi}"
        return False, f"DOI {doi}: Crossref dice «{t}» ({fechas[:1]}), parecido {sim:.2f}"
    if e.get("eprint"):
        x = limpiar_bib(e["eprint"])
        _, cuerpo = obtener("https://export.arxiv.org/api/query?id_list=" + urllib.parse.quote(x))
        m = re.search(r"<entry>.*?<title>(.*?)</title>", cuerpo, re.S)
        if m and parecido(titulo, m.group(1)) >= 0.8:
            return True, f"arXiv {x}"
        return False, f"arXiv {x}: no coincide ({m.group(1).strip() if m else 'sin resultado'})"
    if e.get("url"):
        u = limpiar_bib(e["url"])
        if "openlibrary.org/" in u:  # la página pide verificación humana; la API JSON no
            _, cuerpo = obtener(u.rstrip("/") + ".json")
            t = json.loads(cuerpo).get("title", "")
            # en un capítulo, la ficha de Open Library es la del libro que lo contiene
            sim = max(parecido(titulo, t), parecido(titulo.split(":")[0], t), parecido(limpiar_bib(e.get("booktitle", "")), t))
            return sim >= 0.6, f"Open Library {u}: «{t}», parecido {sim:.2f}"
        estado, pagina = obtener(u)
        palabras = [w for w in normal(titulo).split() if len(w) > 4] or normal(titulo).split()
        presentes = sum(w in normal(pagina) for w in palabras)
        ok = estado == 200 and presentes >= max(1, len(palabras) // 2)
        return ok, f"URL {u} → {estado}, {presentes}/{len(palabras)} palabras del título en la página"
    return False, "sin DOI, arXiv ni URL"


def main():
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "referencias.bib")
    bib = leer_bib(ruta)
    malas = 0
    for clave, e in bib.items():
        try:
            ok, detalle = verificar(clave, e)
        except Exception as ex:  # red o API caída: cuenta como no verificada
            ok, detalle = False, f"error: {ex}"
        malas += not ok
        time.sleep(1)  # Crossref limita las consultas seguidas
        print(("OK   " if ok else "FALLA"), clave, "—", detalle)
    print(f"\n{len(bib) - malas} de {len(bib)} verificadas")
    sys.exit(1 if malas else 0)


if __name__ == "__main__":
    main()
