// Interfaz: deslizadores → Simulacion.simular → números y gráficos.
(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (x, d = 2) => (x === null ? "—" : Number(x.toFixed(d)).toLocaleString("es-AR"));
  const pct = (x) => Math.round(x * 100) + " %";

  const CONTROLES = [
    ["error", "Error en la base de verdad", 0, 3, 0.1],
    ["tolerancia", "Tolerancia del filtro", 0.1, 1.5, 0.05],
    ["alfa", "Influencia de lo publicado (α)", 0, 0.8, 0.05],
    ["beta", "Peso de la evidencia propia (β)", 0, 0.8, 0.05],
    ["expertos", "Fracción de expertos", 0, 0.3, 0.01],
    ["betaExpertos", "Peso de la evidencia en expertos", 0, 1, 0.05],
    ["pulido", "Cuánto pule la IA el estilo", 0, 0.5, 0.05],
    ["rondas", "Rondas", 10, 150, 1],
    ["personas", "Personas", 50, 500, 10],
    ["semilla", "Semilla del azar", 1, 100, 1],
  ];
  const params = { ...Simulacion.DEFECTO };

  const cont = $("sliders");
  for (const [k, nombre, min, max, paso] of CONTROLES) {
    cont.insertAdjacentHTML("beforeend",
      `<label for="c-${k}">${nombre} <span class="val" id="v-${k}"></span></label>
       <input type="range" id="c-${k}" min="${min}" max="${max}" step="${paso}">`);
  }
  for (const [k] of CONTROLES) {
    $("c-" + k).addEventListener("input", () => { params[k] = parseFloat($("c-" + k).value); render(); });
  }

  function escribir() {
    for (const [k] of CONTROLES) $("c-" + k).value = params[k];
  }

  $("p-correcta").addEventListener("click", () => { Object.assign(params, Simulacion.DEFECTO, { error: 0 }); escribir(); render(); });
  $("p-error").addEventListener("click", () => { Object.assign(params, Simulacion.DEFECTO); escribir(); render(); });

  function render() {
    for (const [k, , , , paso] of CONTROLES) $("v-" + k).textContent = paso >= 1 ? params[k] : fmt(params[k]);
    const r = Simulacion.simular(params);
    const ult = (c) => c.rondas[c.rondas.length - 1];
    const con = ult(r.con), sin = ult(r.sin);

    $("s-publicable").textContent = r.verdadPublicable ? "Sí" : "No";
    $("s-error").textContent = `${fmt(con.errorPublico)} / ${fmt(sin.errorPublico)}`;
    $("s-priv").textContent = `${fmt(con.errorPrivado)} / ${fmt(sin.errorPrivado)}`;
    const exp = Simulacion.media(r.con.rondas.slice(-10).map((x) => x.rechazoExpertos));
    $("s-exp").textContent = params.expertos > 0 ? pct(exp) : "—";
    const estiloInicial = r.sin.rondas[0].estilo;
    $("s-estilo").textContent = con.estilo === null ? "—" : pct(con.estilo / estiloInicial);

    $("lectura").textContent = params.error === 0
      ? "Con la base correcta el filtro parece un buen sistema: lo publicado converge rápido a la verdad y casi nadie es rechazado. Igual quedan afuera, de vez en cuando, algunos expertos que siguen su propia evidencia ruidosa. Y todos terminan escribiendo parecido."
      : r.verdadPublicable
        ? "El error de la base es menor que la tolerancia: decir la verdad real todavía pasa el filtro."
        : `Decir la verdad real (0) es rechazado: está a ${fmt(params.error)} de la base y la tolerancia es ${fmt(params.tolerancia)}. Lo publicado se queda en el error, la mayoría termina creyéndolo a medias y los que más confían en su evidencia son los rechazados.`;

    const x = (c, campo) => c.rondas.map((ro, i) => [i + 1, ro[campo]]).filter((p) => p[1] !== null);
    Grafico.lineas($("g-publico"), {
      series: [
        { nombre: "Con filtro", puntos: x(r.con, "errorPublico") },
        { nombre: "Sin filtro", puntos: x(r.sin, "errorPublico") },
      ],
      xEtiqueta: "ronda", yEtiqueta: "distancia a la verdad", yMin: 0, yMax: Math.max(1, params.error + 0.6),
      horizontales: params.error > 0 ? [{ y: params.error, etiqueta: "base de verdad" }] : [],
      alto: 220,
    });
    Grafico.lineas($("g-filtro"), {
      series: [
        { nombre: "Rechazadas", puntos: x(r.con, "rechazo").map(([a, b]) => [a, b * 100]) },
        { nombre: "Optimizadas", puntos: x(r.con, "optimizadas").map(([a, b]) => [a, b * 100]) },
        { nombre: "Expertos rech.", puntos: x(r.con, "rechazoExpertos").map(([a, b]) => [a, b * 100]) },
      ],
      xEtiqueta: "ronda", yEtiqueta: "% de las personas", yMin: 0, yMax: 100, alto: 220,
    });
    Grafico.lineas($("g-estilo"), {
      series: [
        { nombre: "Con filtro", puntos: x(r.con, "estilo") },
        { nombre: "Sin filtro", puntos: x(r.sin, "estilo") },
      ],
      xEtiqueta: "ronda", yEtiqueta: "diversidad de estilo", yMin: 0, alto: 220,
    });
    const desde = -2, hasta = Math.max(3, params.error + 1.5);
    Grafico.lineas($("g-hist"), {
      series: [
        { nombre: "Con filtro", puntos: Simulacion.histograma(r.con.creencias, desde, hasta, 40) },
        { nombre: "Sin filtro", puntos: Simulacion.histograma(r.sin.creencias, desde, hasta, 40) },
      ],
      xEtiqueta: "conclusión privada", yEtiqueta: "personas", yMin: 0, xMin: desde, xMax: hasta,
      verticales: [{ x: 0, etiqueta: "verdad" }, ...(params.error > 0 ? [{ x: params.error, etiqueta: "base" }] : [])],
      alto: 220,
    });
  }

  window.addEventListener("resize", render);
  escribir();
  render();
})();
