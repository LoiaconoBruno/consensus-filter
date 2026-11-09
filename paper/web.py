#!/usr/bin/env python3
"""Genera la versión web del paper (index.html) a partir de paper/paper.tex y paper/referencias.bib.

Convierte el subconjunto de LaTeX que usan estos papers: secciones, párrafos, énfasis,
listas, citas, figuras, tablas, ecuaciones y bibliografía. Las ecuaciones las dibuja
MathJax en el navegador, con la misma numeración que el PDF.

Uso, desde la raíz del repo:  python3 paper/web.py
"""
import html
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPER = os.path.join(RAIZ, "paper")


# ---------------------------------------------------------------- utilidades
def leer(ruta):
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def argumento(texto, i):
    """Devuelve (contenido, fin) del grupo {...} que empieza en texto[i] == '{'."""
    if i >= len(texto) or texto[i] != "{":
        raise ValueError(f"se esperaba '{{' en la posición {i}: {texto[i:i + 40]!r}")
    nivel, j = 0, i
    while j < len(texto):
        c = texto[j]
        if c == "\\":
            j += 2
            continue
        if c == "{":
            nivel += 1
        elif c == "}":
            nivel -= 1
            if nivel == 0:
                return texto[i + 1:j], j + 1
        j += 1
    raise ValueError("llave sin cerrar")


def opcional(texto, i):
    """Salta un argumento opcional [...] si lo hay."""
    while i < len(texto) and texto[i] in " \t":
        i += 1
    if i < len(texto) and texto[i] == "[":
        return texto.index("]", i) + 1
    return i


def sin_comentarios(texto):
    return "\n".join(re.sub(r"(?<!\\)%.*", "", linea) for linea in texto.split("\n"))


# ---------------------------------------------------------------- bibliografía
def leer_bib(ruta):
    texto = leer(ruta)
    entradas = {}
    for m in re.finditer(r"@(\w+)\s*\{\s*([^,\s]+)\s*,", texto):
        tipo, clave = m.group(1).lower(), m.group(2)
        i, nivel = m.end(), 1
        j = i
        while nivel and j < len(texto):
            if texto[j] == "{":
                nivel += 1
            elif texto[j] == "}":
                nivel -= 1
            j += 1
        cuerpo = texto[i:j - 1]
        campos = {"tipo": tipo}
        k = 0
        while k < len(cuerpo):
            mm = re.match(r"\s*,?\s*(\w+)\s*=\s*", cuerpo[k:])
            if not mm:
                break
            nombre = mm.group(1).lower()
            k += mm.end()
            if cuerpo[k] == "{":
                valor, k = argumento(cuerpo, k)
            elif cuerpo[k] == '"':
                fin = cuerpo.index('"', k + 1)
                valor, k = cuerpo[k + 1:fin], fin + 1
            else:
                mm2 = re.match(r"[^,\s]+", cuerpo[k:])
                valor, k = mm2.group(0), k + mm2.end()
            campos[nombre] = valor
        entradas[clave] = campos
    return entradas


def limpiar_bib(v):
    v = v.replace("{", "").replace("}", "").replace("\\&", "&").replace("--", "–")
    v = re.sub(r"\\url\s*", "", v)
    return re.sub(r"\s+", " ", v).strip()


def autores(campo):
    """Lista de (apellido, iniciales) a partir de 'Apellido, Nombre and ...'."""
    out = []
    for a in re.split(r"\s+and\s+", campo):
        a = a.strip()
        if a.startswith("{") and a.endswith("}"):
            out.append((limpiar_bib(a), ""))
            continue
        a = limpiar_bib(a)
        if "," in a:
            ap, no = [x.strip() for x in a.split(",", 1)]
        else:
            partes = a.split()
            ap, no = partes[-1], " ".join(partes[:-1])
        ini = " ".join(p[0] + "." for p in re.split(r"[\s-]+", no) if p)
        out.append((ap, ini))
    return out


def autores_cita(e):
    lista = autores(e.get("author") or e.get("editor") or "Anónimo")
    if len(lista) == 1:
        return lista[0][0]
    if len(lista) == 2:
        return f"{lista[0][0]} y {lista[1][0]}"
    return f"{lista[0][0]} et al."


def anio(e):
    return limpiar_bib(e.get("year") or e.get("date", "s. f.")[:4])


def referencia_html(e):
    lista = autores(e.get("author") or e.get("editor") or "Anónimo")
    nombres = [f"{ap}, {ini}".strip().rstrip(",") for ap, ini in lista]
    if len(nombres) > 1:
        aut = ", ".join(nombres[:-1]) + " y " + nombres[-1]
    else:
        aut = nombres[0]
    partes = [html.escape(aut), f" ({anio(e)}). "]
    titulo = html.escape(limpiar_bib(e.get("title", "")))
    tipo = e["tipo"]
    if tipo in ("book", "thesis", "phdthesis", "report", "techreport", "manual"):
        partes.append(f"<i>{titulo}</i>. ")
        for k in ("institution", "school", "publisher"):
            if e.get(k):
                partes.append(html.escape(limpiar_bib(e[k])) + ". ")
                break
    elif tipo in ("incollection", "inproceedings", "inbook"):
        partes.append(f"{titulo}. En <i>{html.escape(limpiar_bib(e.get('booktitle', '')))}</i>")
        if e.get("pages"):
            partes.append(f" (pp. {html.escape(limpiar_bib(e['pages']))})")
        partes.append(". ")
        if e.get("publisher"):
            partes.append(html.escape(limpiar_bib(e["publisher"])) + ". ")
    else:
        partes.append(f"{titulo}. ")
        revista = e.get("journal") or e.get("journaltitle") or e.get("howpublished") or ""
        if revista:
            partes.append(f"<i>{html.escape(limpiar_bib(revista))}</i>")
            if e.get("volume"):
                partes.append(f", <i>{html.escape(limpiar_bib(e['volume']))}</i>")
            if e.get("number"):
                partes.append(f"({html.escape(limpiar_bib(e['number']))})")
            if e.get("pages"):
                partes.append(f", {html.escape(limpiar_bib(e['pages']))}")
            partes.append(". ")
    if e.get("doi"):
        d = limpiar_bib(e["doi"])
        partes.append(f'<a href="https://doi.org/{html.escape(d)}">https://doi.org/{html.escape(d)}</a>')
    elif e.get("eprint"):
        x = limpiar_bib(e["eprint"])
        partes.append(f'<a href="https://arxiv.org/abs/{html.escape(x)}">arXiv:{html.escape(x)}</a>')
    elif e.get("url"):
        u = limpiar_bib(e["url"])
        partes.append(f'<a href="{html.escape(u)}">{html.escape(u)}</a>')
    return "".join(partes)


# ---------------------------------------------------------------- conversor
class Conversor:
    def __init__(self, bib):
        self.bib = bib
        self.citadas = []
        self.etiquetas = {}
        self.cont = {"sec": 0, "sub": 0, "fig": 0, "tab": 0}
        self.toc = []

    # --- inline
    def citar(self, claves, textual):
        out = []
        for k in [c.strip() for c in claves.split(",") if c.strip()]:
            if k not in self.bib:
                raise KeyError(f"cita sin entrada en la bibliografía: {k}")
            if k not in self.citadas:
                self.citadas.append(k)
            e = self.bib[k]
            a, y = html.escape(autores_cita(e)), anio(e)
            enlace = f'<a href="#ref-{k}">{y}</a>'
            out.append(f"{a} ({enlace})" if textual else f"{a} {enlace}")
        return "; ".join(out) if textual else "(" + "; ".join(out) + ")"

    def inline(self, t):
        """Convierte comandos de texto. Deja intactas las fórmulas $...$."""
        piezas = re.split(r"(\$[^$]+\$)", t)
        out = []
        for p in piezas:
            if p.startswith("$") and p.endswith("$") and len(p) > 1:
                out.append(html.escape(p, quote=False))
            else:
                out.append(self.texto(p))
        return "".join(out)

    def texto(self, t):
        res, i = [], 0
        while i < len(t):
            c = t[i]
            if c == "\\":
                m = re.match(r"\\([A-Za-z]+)\*?", t[i:])
                if not m:
                    sig = t[i + 1:i + 2]
                    mapa = {"%": "%", "&": "&amp;", "_": "_", "#": "#", "$": "$", ",": "\u2009", ";": "\u2005",
                            " ": " ", "\\": "<br>", "{": "{", "}": "}", "-": ""}
                    res.append(mapa.get(sig, html.escape(sig)))
                    i += 2
                    continue
                cmd, i = m.group(1), i + m.end()
                if cmd in ("emph", "textit"):
                    a, i = argumento(t, i); res.append(f"<em>{self.texto(a)}</em>")
                elif cmd == "textbf":
                    a, i = argumento(t, i); res.append(f"<strong>{self.texto(a)}</strong>")
                elif cmd == "texttt":
                    a, i = argumento(t, i); res.append(f"<code>{self.texto(a)}</code>")
                elif cmd == "textsc":
                    a, i = argumento(t, i); res.append(f'<span style="font-variant:small-caps">{self.texto(a)}</span>')
                elif cmd == "foreignlanguage":
                    _, i = argumento(t, i); a, i = argumento(t, i); res.append(f'<span lang="en">{self.texto(a)}</span>')
                elif cmd == "url":
                    a, i = argumento(t, i); res.append(f'<a href="{html.escape(a)}">{html.escape(a)}</a>')
                elif cmd == "href":
                    u, i = argumento(t, i); a, i = argumento(t, i); res.append(f'<a href="{html.escape(u)}">{self.texto(a)}</a>')
                elif cmd in ("parencite", "textcite", "cite"):
                    i = opcional(t, i)
                    a, i = argumento(t, i); res.append(self.citar(a, cmd == "textcite"))
                elif cmd in ("ref", "eqref"):
                    a, i = argumento(t, i)
                    if a.startswith("eq:"):
                        res.append(f"\\{cmd}{{{html.escape(a)}}}")  # MathJax las numera
                    else:
                        res.append(f'<a href="#{html.escape(a)}">{self.etiquetas.get(a, "??")}</a>')
                elif cmd in ("noindent", "medskip", "smallskip", "bigskip", "centering", "par", "newline",
                             "small", "footnotesize", "clearpage", "newpage"):
                    pass
                elif cmd in ("thispagestyle", "pagestyle", "vspace", "hspace"):
                    _, i = argumento(t, i)  # solo afecta al PDF
                elif cmd in ("ldots", "dots"):
                    res.append("…")
                elif cmd == "textasciitilde":
                    res.append("~")
                elif cmd == "S":
                    res.append("§")
                elif cmd == "quad":
                    res.append("\u2003")
                else:
                    raise ValueError(f"comando no soportado en el texto: \\{cmd}")
                continue
            if t.startswith("---", i):
                res.append("—"); i += 3; continue
            if t.startswith("--", i):
                res.append("–"); i += 2; continue
            if c == "~":
                res.append("\u00a0"); i += 1; continue
            if c in "{}":
                i += 1; continue
            res.append(html.escape(c, quote=False)); i += 1
        return "".join(res)

    # --- bloques
    def parrafos(self, t):
        out = []
        for p in re.split(r"\n\s*\n", t):
            p = p.strip()
            if p:
                out.append(f"<p>{self.inline(p)}</p>")
        return "\n".join(out)

    def lista(self, cuerpo, tipo):
        items = re.split(r"\\item\s*", cuerpo)[1:]
        tag = "ol" if tipo == "enumerate" else "ul"
        return f"<{tag}>" + "".join(f"<li>{self.inline(it.strip())}</li>" for it in items) + f"</{tag}>"

    def tabla(self, cuerpo):
        cap = re.search(r"\\caption\{", cuerpo)
        caption = ""
        if cap:
            caption, _ = argumento(cuerpo, cap.end() - 1)
        lab = re.search(r"\\label\{([^}]+)\}", cuerpo)
        ini = cuerpo.index("\\begin{tabular}") + len("\\begin{tabular}")
        _, ini = argumento(cuerpo, ini)  # especificación de columnas, con llaves anidadas
        interior = cuerpo[ini:cuerpo.index("\\end{tabular}")]
        filas = [f.strip() for f in re.split(r"\\\\", interior) if f.strip()]
        enc, html_filas, en_cuerpo = None, [], False
        for f in filas:
            f2 = re.sub(r"\\(toprule|midrule|bottomrule|hline)", "", f).strip()
            marca_medio = "\\midrule" in f
            if not f2:
                if marca_medio:
                    en_cuerpo = True
                continue
            celdas = [self.inline(c.strip()) for c in re.split(r"(?<!\\)&", f2)]
            if enc is None and not en_cuerpo:
                enc = celdas
            else:
                html_filas.append(celdas)
            if marca_medio:
                en_cuerpo = True
        num = self.etiquetas.get(lab.group(1)) if lab else ""
        idattr = f' id="{lab.group(1)}"' if lab else ""
        h = [f'<figure class="tabla"{idattr}>']
        if caption:
            h.append(f"<figcaption><strong>Tabla {num}.</strong> {self.inline(caption)}</figcaption>")
        h.append('<div class="desliza"><table>')
        if enc:
            h.append("<thead><tr>" + "".join(f"<th>{c}</th>" for c in enc) + "</tr></thead>")
        h.append("<tbody>" + "".join("<tr>" + "".join(f"<td>{c}</td>" for c in fila) + "</tr>" for fila in html_filas) + "</tbody>")
        h.append("</table></div></figure>")
        return "".join(h)

    def figura(self, cuerpo):
        img = re.search(r"\\includegraphics(\[[^\]]*\])?\{([^}]+)\}", cuerpo)
        cap = re.search(r"\\caption\{", cuerpo)
        caption, _ = argumento(cuerpo, cap.end() - 1)
        lab = re.search(r"\\label\{([^}]+)\}", cuerpo)
        num = self.etiquetas.get(lab.group(1), "") if lab else ""
        ruta = "paper/" + img.group(2) + ("" if img.group(2).endswith(".svg") else ".svg")
        alt = re.sub(r"<[^>]+>", "", self.inline(caption))
        idattr = f' id="{lab.group(1)}"' if lab else ""
        return (f'<figure{idattr}><img src="{ruta}" alt="{html.escape(alt)}" loading="lazy">'
                f"<figcaption><strong>Figura {num}.</strong> {self.inline(caption)}</figcaption></figure>")

    def numerar(self, cuerpo):
        """Primera pasada: números de secciones, figuras y tablas, para resolver \\ref."""
        sec = sub = fig = tab = 0
        for m in re.finditer(r"\\(section|subsection)(\*?)\{|\\begin\{(figure|table)\}|\\label\{([^}]+)\}", cuerpo):
            if m.group(1) and not m.group(2):
                if m.group(1) == "section":
                    sec, sub = sec + 1, 0; actual = str(sec)
                else:
                    sub += 1; actual = f"{sec}.{sub}"
            elif m.group(1):
                actual = ""
            elif m.group(3) == "figure":
                fig += 1; actual = str(fig)
            elif m.group(3) == "table":
                tab += 1; actual = str(tab)
            elif m.group(4) and not m.group(4).startswith("eq:"):
                self.etiquetas[m.group(4)] = actual

    def cuerpo(self, t):
        self.numerar(t)
        out, i = [], 0
        patron = re.compile(r"\\(section|subsection|subsubsection)(\*?)\{|\\begin\{(itemize|enumerate|figure|table|equation\*?|align\*?|quote|resumen|abstractEN)\}|\\(palabrasclave|keywords)\{|\\printbibliography|\\maketitle|\\label\{[^}]*\}")
        sec = sub = 0
        while True:
            m = patron.search(t, i)
            texto_previo = t[i:m.start()] if m else t[i:]
            if texto_previo.strip():
                out.append(self.parrafos(texto_previo))
            if not m:
                break
            if m.group(1):
                titulo, fin = argumento(t, m.end() - 1)
                lab = re.match(r"\s*\\label\{([^}]+)\}", t[fin:])
                ident = lab.group(1) if lab else re.sub(r"\W+", "-", titulo.lower()).strip("-")
                if lab:
                    fin += lab.end()
                nivel = {"section": 2, "subsection": 3, "subsubsection": 4}[m.group(1)]
                numero = ""
                if not m.group(2) and m.group(1) == "section":
                    sec, sub = sec + 1, 0; numero = f"{sec}. "
                elif not m.group(2) and m.group(1) == "subsection":
                    sub += 1; numero = f"{sec}.{sub}. "
                tt = self.inline(titulo)
                out.append(f'<h{nivel} id="{ident}">{numero}{tt}</h{nivel}>')
                if nivel == 2:
                    self.toc.append((ident, numero + tt))
                i = fin
                continue
            if m.group(3):
                env = m.group(3)
                fin_env = t.index(f"\\end{{{env}}}", m.end())
                interior = t[m.end():fin_env]
                i = fin_env + len(f"\\end{{{env}}}")
                if env in ("itemize", "enumerate"):
                    out.append(self.lista(interior, env))
                elif env == "figure":
                    out.append(self.figura(interior))
                elif env == "table":
                    out.append(self.tabla(interior))
                elif env.startswith(("equation", "align")):
                    out.append(f'<div class="ecuacion">{html.escape(t[m.start():i], quote=False)}</div>')
                elif env == "quote":
                    out.append(f"<blockquote>{self.parrafos(interior)}</blockquote>")
                elif env == "resumen":
                    out.append(f'<section class="resumen"><h2 id="resumen">Resumen</h2>{self.parrafos(interior)}</section>')
                elif env == "abstractEN":
                    out.append(f'<section class="resumen" lang="en"><h2 id="abstract">Abstract</h2>{self.parrafos(interior)}</section>')
                continue
            if m.group(4):
                a, fin = argumento(t, m.end() - 1)
                rotulo = "Palabras clave" if m.group(4) == "palabrasclave" else "Keywords"
                lang = ' lang="en"' if m.group(4) == "keywords" else ""
                out.append(f'<p class="clave"{lang}><strong>{rotulo}:</strong> {self.inline(a)}</p>')
                i = fin
                continue
            if m.group(0) == "\\printbibliography":
                refs = sorted(self.citadas, key=lambda k: (autores(self.bib[k].get("author") or self.bib[k].get("editor") or "")[0][0].lower(), anio(self.bib[k])))
                out.append('<h2 id="referencias">Referencias</h2><ol class="refs">' +
                           "".join(f'<li id="ref-{k}">{referencia_html(self.bib[k])}</li>' for k in refs) + "</ol>")
                self.toc.append(("referencias", "Referencias"))
            i = m.end()
        return "\n".join(out)


def macros_mathjax(preambulo):
    """Pasa a MathJax las macros definidas con \\newcommand en el preámbulo."""
    macros = {}
    for m in re.finditer(r"\\newcommand\{\\(\w+)\}(\[(\d)\])?\{", preambulo):
        cuerpo, _ = argumento(preambulo, m.end() - 1)
        macros[m.group(1)] = [cuerpo, int(m.group(3))] if m.group(3) else cuerpo
    return macros


def main():
    import json
    tex = sin_comentarios(leer(os.path.join(PAPER, "paper.tex")))
    pre, doc = tex.split("\\begin{document}", 1)
    doc = doc.split("\\end{document}", 1)[0]
    meta = {}
    for campo in ("titulo", "tituloen", "repositorio", "citaclave"):
        m = re.search(r"\\newcommand\{\\" + campo + r"\}\{", pre)
        meta[campo] = argumento(pre, m.end() - 1)[0] if m else ""
    bib = leer_bib(os.path.join(PAPER, "referencias.bib"))
    conv = Conversor(bib)
    cuerpo = conv.cuerpo(doc)
    propias = ("titulo", "tituloen", "repositorio", "citaclave", "palabrasclave", "keywords")
    macros = {k: v for k, v in macros_mathjax(pre).items() if k not in propias}
    plantilla = leer(os.path.join(PAPER, "plantilla.html"))
    toc = "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in conv.toc)
    salida = (plantilla
              .replace("{{titulo_texto}}", re.sub(r"<[^>]+>", "", conv.inline(meta["titulo"])))
              .replace("{{titulo}}", conv.inline(meta["titulo"]))
              .replace("{{titulo_en}}", conv.inline(meta["tituloen"]))
              .replace("{{repositorio}}", meta["repositorio"])
              .replace("{{indice}}", toc)
              .replace("{{macros}}", json.dumps(macros))
              .replace("{{cuerpo}}", cuerpo))
    with open(os.path.join(RAIZ, "index.html"), "w", encoding="utf-8") as f:
        f.write(salida)
    sin_resolver = [k for k, v in conv.etiquetas.items() if v == ""]
    print(f"index.html: {len(conv.toc)} secciones, {len(conv.citadas)} referencias citadas de {len(bib)}")
    no_citadas = sorted(set(bib) - set(conv.citadas))
    if no_citadas:
        print("Aviso: entradas de la bibliografía que no se citan:", ", ".join(no_citadas))
    if "??" in cuerpo:
        sys.exit("Error: hay referencias cruzadas sin resolver (??)")


if __name__ == "__main__":
    main()
