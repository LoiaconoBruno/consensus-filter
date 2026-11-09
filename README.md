# Un filtro de consenso

**Simulación de una red que solo publica lo que coincide con su base de verdad.** Preprint de Bruno Loiacono, estudiante de Física (Universidad de Buenos Aires).

Una IA modera una red social y solo deja publicar las conclusiones cercanas a su base de «verdad objetiva». El paper lo modela como una dinámica de opiniones del tipo Friedkin–Johnsen y compara la misma población con y sin filtro. Si la base es correcta, el filtro funciona. Si tiene un error, lo congela: la verdad se rechaza, los expertos quedan afuera y todos terminan escribiendo parecido. El equilibrio de las creencias se deriva en forma cerrada y coincide con la simulación.

- 📄 **[PDF](paper/paper.pdf)**
- 🌐 **[Versión web](https://loiaconobruno.github.io/consensus-filter/)**

> Preprint, documento de trabajo sin revisión por pares.

## Cómo se genera

`paper/paper.tex` es la única fuente. En cada push, GitHub Actions compila el PDF con TeX Live y arma la versión web (`index.html`). Para regenerar a mano las figuras, chequear las referencias o rearmar la página:

```bash
node paper/figuras/generar.js     # figuras y todas las cifras de la sección 4
python3 paper/verificar_bib.py    # cada referencia contra Crossref, arXiv, Open Library o su URL
python3 paper/web.py              # index.html a partir del .tex
```

## Cómo citarlo

```bibtex
@misc{loiacono2026consenso,
  author       = {Loiacono, Bruno},
  title        = {Un filtro de consenso: simulación de una red que solo publica lo que coincide con su base de verdad},
  year         = {2026},
  howpublished = {Preprint, documento de trabajo sin revisión por pares},
  url          = {https://github.com/LoiaconoBruno/consensus-filter}
}
```

## Licencia

El texto, las figuras y el PDF están bajo [CC BY 4.0](LICENSE-CC-BY-4.0.txt). Los scripts que generan las figuras y la página están bajo MIT. El detalle está en [LICENSE](LICENSE).
