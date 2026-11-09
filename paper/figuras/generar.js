#!/usr/bin/env node
// Genera las figuras del paper (SVG) en esta carpeta y escribe las cifras que cita el texto.
// Uso: node paper/figuras/generar.js
// Contiene solo las funciones del modelo que hacen falta. Licencia MIT (ver LICENSE).
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const COLORES = ["#2a55c9", "#c25a00", "#1f7a4d", "#b3261e", "#7a3fb8", "#555555"];
const FUENTE = 'font-family="DejaVu Sans, Helvetica, Arial, sans-serif"';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Números con coma decimal y signo menos tipográfico.
function num(x) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  let s;
  if (a >= 1e4 || a < 1e-3) {
    const e = Math.floor(Math.log10(a));
    const m = x / 10 ** e;
    s = (Math.abs(m - 1) < 1e-9 ? "" : `${Number(m.toPrecision(2))}×`) + `10^${e}`;
  } else s = String(Number(x.toPrecision(3)));
  return s.replace(".", ",").replace(/-/g, "−");
}

function marcas(min, max, n = 5) {
  const crudo = (max - min) / n;
  const pot = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= crudo);
  const out = [];
  for (let x = Math.ceil(min / paso - 1e-9) * paso; x <= max + paso * 1e-9; x += paso) out.push(Math.abs(x) < paso * 1e-9 ? 0 : x);
  return out;
}

function potencias(min, max) {
  const out = [];
  for (let k = Math.floor(Math.log10(min)); k <= Math.ceil(Math.log10(max)); k++) out.push(10 ** k);
  return out;
}

// Texto con superíndices para etiquetas del tipo 10^3.
function textoSVG(s) {
  return esc(s).replace(/\^(−?\d+)/g, '<tspan baseline-shift="super" font-size="70%">$1</tspan>');
}

/**
 * Gráfico de líneas.
 * op: { series: [{nombre, puntos: [[x,y]], color?, punteada?, grosor?}], xMin, xMax, yMin, yMax,
 *       xEtiqueta, yEtiqueta, logX, logY, verticales: [{x, etiqueta}], horizontales: [{y, etiqueta}],
 *       ancho, alto, leyenda: "arriba" | "abajo" | null }
 */
function grafico(op) {
  const W = op.ancho || 640, H = op.alto || 400;
  const m = { l: 70, r: 18, t: op.leyenda === null ? 16 : 40, b: 56 };
  const tx = (x) => (op.logX ? Math.log10(x) : x);
  const ty = (y) => (op.logY ? Math.log10(y) : y);
  const pts = op.series.flatMap((s) => s.puntos).filter(([x, y]) => isFinite(tx(x)) && isFinite(ty(y)));
  const xMin = op.xMin ?? Math.min(...pts.map((p) => p[0]));
  const xMax = op.xMax ?? Math.max(...pts.map((p) => p[0]));
  const yMin = op.yMin ?? Math.min(...pts.map((p) => p[1]));
  const yMax = op.yMax ?? Math.max(...pts.map((p) => p[1]));
  const X = (x) => m.l + ((tx(x) - tx(xMin)) / (tx(xMax) - tx(xMin))) * (W - m.l - m.r);
  const Y = (y) => H - m.b - ((ty(y) - ty(yMin)) / (ty(yMax) - ty(yMin))) * (H - m.t - m.b);
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${FUENTE} font-size="13">`,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>`];
  const mx = op.logX ? potencias(xMin, xMax) : marcas(xMin, xMax, op.marcasX || 6);
  const my = op.logY ? potencias(yMin, yMax) : marcas(yMin, yMax, op.marcasY || 5);
  for (const x of mx) {
    if (x < xMin - 1e-12 || x > xMax + 1e-12) continue;
    o.push(`<line x1="${X(x)}" y1="${m.t}" x2="${X(x)}" y2="${H - m.b}" stroke="#e3e1db"/>`);
    o.push(`<text x="${X(x)}" y="${H - m.b + 18}" text-anchor="middle" fill="#333">${textoSVG(num(x))}</text>`);
  }
  for (const y of my) {
    if (y < yMin - 1e-12 || y > yMax + 1e-12) continue;
    o.push(`<line x1="${m.l}" y1="${Y(y)}" x2="${W - m.r}" y2="${Y(y)}" stroke="#e3e1db"/>`);
    o.push(`<text x="${m.l - 8}" y="${Y(y) + 4}" text-anchor="end" fill="#333">${textoSVG(num(y))}</text>`);
  }
  o.push(`<rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="none" stroke="#333"/>`);
  if (op.xEtiqueta) o.push(`<text x="${m.l + (W - m.l - m.r) / 2}" y="${H - 14}" text-anchor="middle" fill="#111">${textoSVG(op.xEtiqueta)}</text>`);
  if (op.yEtiqueta) o.push(`<text transform="translate(18 ${m.t + (H - m.t - m.b) / 2}) rotate(-90)" text-anchor="middle" fill="#111">${textoSVG(op.yEtiqueta)}</text>`);
  o.push(`<clipPath id="area"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath><g clip-path="url(#area)">`);
  (op.verticales || []).forEach((v, j) => {
    o.push(`<line x1="${X(v.x)}" y1="${m.t}" x2="${X(v.x)}" y2="${H - m.b}" stroke="#666" stroke-dasharray="4 4"/>`);
    // etiquetas escalonadas para que no se pisen si las líneas están cerca
    if (v.etiqueta) o.push(`<text x="${X(v.x) + 5}" y="${m.t + 16 + 15 * j}" fill="#444" font-size="12">${textoSVG(v.etiqueta)}</text>`);
  });
  for (const h of op.horizontales || []) {
    o.push(`<line x1="${m.l}" y1="${Y(h.y)}" x2="${W - m.r}" y2="${Y(h.y)}" stroke="#666" stroke-dasharray="4 4"/>`);
    if (h.etiqueta) o.push(`<text x="${W - m.r - 6}" y="${Y(h.y) - 6}" text-anchor="end" fill="#444" font-size="12">${textoSVG(h.etiqueta)}</text>`);
  }
  op.series.forEach((s, i) => {
    const d = [];
    let abierto = false;
    for (const [x, y] of s.puntos) {
      if (!isFinite(tx(x)) || !isFinite(ty(y))) { abierto = false; continue; }
      d.push(`${abierto ? "L" : "M"}${X(x).toFixed(2)} ${Y(y).toFixed(2)}`);
      abierto = true;
    }
    const color = s.color || COLORES[i % COLORES.length];
    o.push(`<path d="${d.join(" ")}" fill="none" stroke="${color}" stroke-width="${s.grosor || 2.2}"${s.punteada ? ' stroke-dasharray="7 5"' : ""} stroke-linejoin="round"/>`);
  });
  o.push("</g>");
  if (op.leyenda !== null) {
    let lx = m.l;
    op.series.forEach((s, i) => {
      if (!s.nombre) return;
      const color = s.color || COLORES[i % COLORES.length];
      o.push(`<line x1="${lx}" y1="${m.t - 16}" x2="${lx + 22}" y2="${m.t - 16}" stroke="${color}" stroke-width="3"${s.punteada ? ' stroke-dasharray="6 4"' : ""}/>`);
      o.push(`<text x="${lx + 28}" y="${m.t - 12}" fill="#111">${textoSVG(s.nombre)}</text>`);
      lx += 40 + s.nombre.length * 7.2;
    });
  }
  o.push("</svg>");
  return o.join("\n");
}

function guardar(nombre, svg) {
  fs.writeFileSync(path.join(__dirname, nombre + ".svg"), svg + "\n");
  console.log("figura:", nombre + ".svg");
}

/**
 * Barras apiladas horizontales. grupos: [{nombre, partes: [valor...]}], categorias: [nombre...]
 */
function barras(op) {
  const W = op.ancho || 640, alto = op.alturaBarra || 34, sep = op.separacion || 22;
  const m = { l: op.margenIzq || 210, r: 30, t: 54, b: 46 };
  const H = m.t + op.grupos.length * (alto + sep) - sep + m.b;
  const total = op.maximo || Math.max(...op.grupos.map((g) => g.partes.reduce((a, b) => a + b, 0)));
  const X = (v) => m.l + (v / total) * (W - m.l - m.r);
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${FUENTE} font-size="13">`,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>`];
  let lx = m.l;
  op.categorias.forEach((c, i) => {
    o.push(`<rect x="${lx}" y="${m.t - 36}" width="14" height="14" fill="${(op.colores || COLORES)[i]}"/>`);
    o.push(`<text x="${lx + 20}" y="${m.t - 24}" fill="#111">${esc(c)}</text>`);
    lx += 34 + c.length * 7.2;
  });
  for (const v of marcas(0, total, op.marcas || 5)) {
    o.push(`<line x1="${X(v)}" y1="${m.t - 6}" x2="${X(v)}" y2="${H - m.b}" stroke="#e3e1db"/>`);
    o.push(`<text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle" fill="#333">${num(v)}</text>`);
  }
  op.grupos.forEach((g, k) => {
    const y = m.t + k * (alto + sep);
    o.push(`<text x="${m.l - 10}" y="${y + alto / 2 + 5}" text-anchor="end" fill="#111">${esc(g.nombre)}</text>`);
    let acum = 0;
    g.partes.forEach((v, i) => {
      if (!v) return;
      o.push(`<rect x="${X(acum)}" y="${y}" width="${X(acum + v) - X(acum)}" height="${alto}" fill="${(op.colores || COLORES)[i]}"/>`);
      o.push(`<text x="${(X(acum) + X(acum + v)) / 2}" y="${y + alto / 2 + 5}" text-anchor="middle" fill="#fff" font-weight="bold">${num(v)}</text>`);
      acum += v;
    });
  });
  if (op.xEtiqueta) o.push(`<text x="${m.l + (W - m.l - m.r) / 2}" y="${H - 10}" text-anchor="middle" fill="#111">${esc(op.xEtiqueta)}</text>`);
  o.push("</svg>");
  return o.join("\n");
}

/** Diagrama de pasos en fila: cajas con número y texto, unidas por flechas. */
function pasos(lista, op = {}) {
  const W = op.ancho || 640, porFila = op.porFila || 3, cw = (W - 40 - (porFila - 1) * 30) / porFila, ch = op.altoCaja || 92;
  const filas = Math.ceil(lista.length / porFila);
  const H = 20 + filas * ch + (filas - 1) * 40 + 20;
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${FUENTE} font-size="13">`,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>`,
    `<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#555"/></marker></defs>`];
  const pos = lista.map((_, i) => {
    const f = Math.floor(i / porFila), c = f % 2 === 0 ? i % porFila : porFila - 1 - (i % porFila);
    return { x: 20 + c * (cw + 30), y: 20 + f * (ch + 40) };
  });
  lista.forEach((p, i) => {
    const { x, y } = pos[i];
    o.push(`<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="10" fill="#f3f5fc" stroke="${COLORES[0]}" stroke-width="1.5"/>`);
    o.push(`<text x="${x + 12}" y="${y + 24}" fill="${COLORES[0]}" font-weight="bold" font-size="14">${esc(p.titulo)}</text>`);
    (p.lineas || []).forEach((l, j) => o.push(`<text x="${x + 12}" y="${y + 46 + j * 17}" fill="#222">${esc(l)}</text>`));
    if (i + 1 < lista.length) {
      const a = pos[i], b = pos[i + 1];
      if (a.y === b.y) {
        const izq = b.x > a.x;
        o.push(`<line x1="${izq ? a.x + cw : a.x}" y1="${a.y + ch / 2}" x2="${izq ? b.x - 2 : b.x + cw + 2}" y2="${b.y + ch / 2}" stroke="#555" stroke-width="1.6" marker-end="url(#flecha)"/>`);
      } else {
        o.push(`<line x1="${a.x + cw / 2}" y1="${a.y + ch}" x2="${b.x + cw / 2}" y2="${b.y - 2}" stroke="#555" stroke-width="1.6" marker-end="url(#flecha)"/>`);
      }
    }
  });
  o.push("</svg>");
  return o.join("\n");
}

// ---------------------------------------------------------------------------
// Modelo: una red donde un filtro solo publica lo que está cerca de su base de verdad T.
// R = verdad real, T = R + error. Cada ronda: evidencia propia (peso beta), filtro
// (aprobada / optimizada / rechazada) y lectura del promedio de lo publicado (peso alfa).
// ---------------------------------------------------------------------------
const DEFECTO = {
  personas: 200, rondas: 60, error: 1.5, tolerancia: 0.5, alfa: 0.3, beta: 0.1, ruido: 1,
  dispersionInicial: 2, pulido: 0.15, adopcion: 0.2, expertos: 0.1, betaExpertos: 0.8, semilla: 42,
};
const R = 0;

function rng(semilla) {
  let a = semilla >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => {
    let x = 0;
    while (x === 0) x = u();
    return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * u());
  };
  return { u, normal };
}

const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const desvio = (xs) => {
  if (xs.length < 2) return null;
  const m = media(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
};

function filtrar(c, T, tolerancia) {
  const d = Math.abs(c - T);
  if (d <= tolerancia) return "aprobada";
  if (d <= 2 * tolerancia) return "optimizada";
  return "rechazada";
}

function correr(p, conFiltro) {
  const r = rng(p.semilla);
  const T = R + p.error;
  let creencias = Array.from({ length: p.personas }, () => R + p.dispersionInicial * r.normal());
  const estilos = Array.from({ length: p.personas }, () => r.u());
  const nExpertos = Math.round(p.expertos * p.personas);
  const beta = (i) => (i < nExpertos ? p.betaExpertos : p.beta);
  const rondas = [];
  let publicadas = [];
  for (let k = 0; k < p.rondas; k++) {
    creencias = creencias.map((b, i) => b + beta(i) * (R + p.ruido * r.normal() - b));
    publicadas = [];
    const estilosPub = [];
    let rechazadas = 0, optimizadas = 0, rechazadasExp = 0;
    creencias.forEach((b, i) => {
      if (!conFiltro) { publicadas.push(b); estilosPub.push(estilos[i]); return; }
      const res = filtrar(b, T, p.tolerancia);
      if (res === "rechazada") { rechazadas++; if (i < nExpertos) rechazadasExp++; return; }
      if (res === "optimizada") optimizadas++;
      publicadas.push(res === "aprobada" ? b : T);
      const pulido = estilos[i] + p.pulido * (0.5 - estilos[i]);
      estilosPub.push(pulido);
      estilos[i] += p.adopcion * (pulido - estilos[i]);
    });
    const mPub = media(publicadas);
    if (mPub !== null) creencias = creencias.map((b) => b + p.alfa * (mPub - b));
    rondas.push({
      mediaPublica: mPub,
      rechazo: rechazadas / p.personas,
      optimizadas: optimizadas / p.personas,
      rechazoExpertos: nExpertos ? rechazadasExp / nExpertos : 0,
      errorPublico: mPub === null ? null : Math.abs(mPub - R),
      errorPrivado: Math.abs(media(creencias) - R),
      estilo: desvio(estilosPub),
    });
  }
  return { rondas, creencias };
}

function simular(params = {}) {
  const p = { ...DEFECTO, ...params };
  return { p, T: R + p.error, con: correr(p, true), sin: correr(p, false), verdad: filtrar(R, R + p.error, p.tolerancia) };
}

function histograma(xs, desde, hasta, cajas = 30) {
  const ancho = (hasta - desde) / cajas;
  const cuenta = new Array(cajas).fill(0);
  for (const x of xs) {
    const k = Math.floor((x - desde) / ancho);
    if (k >= 0 && k < cajas) cuenta[k]++;
  }
  return cuenta.map((c, k) => [desde + ancho * (k + 0.5), c]);
}

// Punto fijo exacto del mapa de una ronda (evidencia, después lectura) si lo publicado vale m.
const equilibrio = (alfa, beta, m) => ((1 - alfa) * beta * R + alfa * m) / (alfa + beta - alfa * beta);
// Límite de pesos chicos (Friedkin y Johnsen): (beta R + alfa m) / (alfa + beta).
const equilibrioAprox = (alfa, beta, m) => (beta * R + alfa * m) / (alfa + beta);
// Promedio de la población: mezcla de no expertos y expertos.
const equilibrioPoblacion = (p, m) =>
  (1 - p.expertos) * equilibrio(p.alfa, p.beta, m) + p.expertos * equilibrio(p.alfa, p.betaExpertos, m);

// Resumen de una corrida, con las mismas definiciones que usa el texto.
function resumen(s) {
  const ult = (c, campo, n = 10) => media(c.rondas.slice(-n).map((x) => x[campo]));
  const fin = (c) => c.rondas[c.rondas.length - 1];
  const m = ult(s.con, "mediaPublica");
  return {
    verdad: s.verdad,
    errPubCon: fin(s.con).errorPublico, errPubSin: fin(s.sin).errorPublico,
    errPrivCon: fin(s.con).errorPrivado, errPrivSin: fin(s.sin).errorPrivado,
    expRech: ult(s.con, "rechazoExpertos"),
    rechazo: ult(s.con, "rechazo"),
    estilo: fin(s.con).estilo / s.sin.rondas[0].estilo,
    estiloSin: fin(s.sin).estilo / s.sin.rondas[0].estilo,
    mPub: m,
    eqExacto: equilibrioPoblacion(s.p, m),
    eqAproxT: equilibrioAprox(s.p.alfa, s.p.beta, s.T),
    eqExactoT: equilibrio(s.p.alfa, s.p.beta, s.T),
  };
}

const f2 = (x) => (typeof x === "number" ? x.toFixed(3) : x);
const imprimir = (nombre, r) => console.log(nombre.padEnd(34), Object.entries(r).map(([k, v]) => `${k}=${f2(v)}`).join(" "));

// ---------------------------------------------------------------------------
// Cifras del texto
// ---------------------------------------------------------------------------
const conError = simular();
const correcta = simular({ error: 0 });
imprimir("Base con error (por defecto)", resumen(conError));
imprimir("Base correcta", resumen(correcta));
imprimir("Base con error, tolerancia 0,75", resumen(simular({ tolerancia: 0.75 })));
imprimir("Base con error, tolerancia 1,5", resumen(simular({ tolerancia: 1.5 })));
imprimir("alfa = beta = 0,1", resumen(simular({ alfa: 0.1 })));
imprimir("30 % de expertos", resumen(simular({ expertos: 0.3 })));
imprimir("Sin pulido", resumen(simular({ pulido: 0 })));
const semillas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => resumen(simular({ semilla: s })));
const rango = (campo) => {
  const v = semillas.map((x) => x[campo]);
  return `${f2(Math.min(...v))}–${f2(Math.max(...v))}`;
};
console.log("Semillas 1–10:", ["errPubCon", "errPubSin", "errPrivCon", "expRech", "estilo"].map((c) => `${c} ${rango(c)}`).join(" | "));

// ---------------------------------------------------------------------------
// Figura 1: error de lo publicado por ronda
// ---------------------------------------------------------------------------
const serie = (c, campo, escala = 1) => c.rondas.map((x, k) => [k + 1, x[campo] === null ? NaN : x[campo] * escala]);
guardar("error-publicado", grafico({
  series: [
    { nombre: "Con filtro, base con error", puntos: serie(conError.con, "errorPublico"), color: COLORES[1] },
    { nombre: "Sin filtro", puntos: serie(conError.sin, "errorPublico"), color: COLORES[0] },
    { nombre: "Con filtro, base correcta", puntos: serie(correcta.con, "errorPublico"), color: COLORES[2], punteada: true },
  ],
  xMin: 1, xMax: DEFECTO.rondas, yMin: 0, yMax: 1.6,
  horizontales: [{ y: 1.5, etiqueta: "error de la base, ε = 1,5" }],
  xEtiqueta: "Ronda k", yEtiqueta: "Error de lo publicado |m − R|",
}));

// ---------------------------------------------------------------------------
// Figura 2: qué hace el filtro (base con error)
// ---------------------------------------------------------------------------
guardar("filtro", grafico({
  series: [
    { nombre: "Rechazadas", puntos: serie(conError.con, "rechazo", 100), color: COLORES[3] },
    { nombre: "Optimizadas", puntos: serie(conError.con, "optimizadas", 100), color: COLORES[4] },
    { nombre: "Expertos rechazados", puntos: serie(conError.con, "rechazoExpertos", 100), color: COLORES[1], punteada: true },
  ],
  xMin: 1, xMax: DEFECTO.rondas, yMin: 0, yMax: 100,
  xEtiqueta: "Ronda k", yEtiqueta: "Porcentaje de publicaciones (%)",
}));

// ---------------------------------------------------------------------------
// Figura 3: diversidad de estilo
// ---------------------------------------------------------------------------
const e0 = conError.sin.rondas[0].estilo;
guardar("estilo", grafico({
  series: [
    { nombre: "Con filtro (pulido 0,15)", puntos: serie(conError.con, "estilo", 1 / e0), color: COLORES[1] },
    { nombre: "Sin filtro", puntos: serie(conError.sin, "estilo", 1 / e0), color: COLORES[0] },
  ],
  xMin: 1, xMax: DEFECTO.rondas, yMin: 0, yMax: 1.1,
  xEtiqueta: "Ronda k", yEtiqueta: "Diversidad de estilo (relativa a la inicial)",
}));

// ---------------------------------------------------------------------------
// Figura 4: creencias privadas al final
// ---------------------------------------------------------------------------
const rc = resumen(conError);
guardar("creencias", grafico({
  series: [
    { nombre: "Con filtro", puntos: histograma(conError.con.creencias, -2, 3.5, 44), color: COLORES[1] },
    { nombre: "Sin filtro", puntos: histograma(conError.sin.creencias, -2, 3.5, 44), color: COLORES[0] },
  ],
  xMin: -2, xMax: 3.5, yMin: 0,
  verticales: [{ x: R, etiqueta: "R" }, { x: conError.T, etiqueta: "T" }, { x: rc.eqExacto, etiqueta: "equilibrio" }],
  xEtiqueta: "Creencia privada b al final", yEtiqueta: "Cantidad de personas",
}));

// ---------------------------------------------------------------------------
// Figura 5: el equilibrio en función de alfa
// ---------------------------------------------------------------------------
const alfas = [];
for (let a = 0.05; a <= 0.801; a += 0.05) alfas.push(Number(a.toFixed(2)));
const barrido = alfas.map((a) => ({ a, r: resumen(simular({ alfa: a })), p: { ...DEFECTO, alfa: a } }));
guardar("equilibrio", grafico({
  series: [
    { nombre: "Simulación", puntos: barrido.map(({ a, r }) => [a, r.errPrivCon]), color: COLORES[1] },
    { nombre: "Punto fijo exacto (m medido)", puntos: barrido.map(({ a, r }) => [a, r.eqExacto]), color: COLORES[0], punteada: true },
    { nombre: "Pesos chicos, m = T", puntos: barrido.map(({ a, p }) => [a, (1 - p.expertos) * equilibrioAprox(a, p.beta, R + p.error) + p.expertos * equilibrioAprox(a, p.betaExpertos, R + p.error)]), color: COLORES[5], punteada: true, grosor: 1.6 },
  ],
  xMin: 0, xMax: 0.8, yMin: 0, yMax: 1.6,
  horizontales: [{ y: 1.5, etiqueta: "T" }],
  xEtiqueta: "Influencia de lo publicado α", yEtiqueta: "Creencia privada media b̄ al final",
}));
const errMax = Math.max(...barrido.map(({ r }) => Math.abs(r.errPrivCon - r.eqExacto)));
console.log(`Equilibrio: máxima diferencia simulación − ec. exacta en el barrido de alfa = ${f2(errMax)}`);

// ---------------------------------------------------------------------------
// Figura 6: el error de lo publicado en función de la tolerancia
// ---------------------------------------------------------------------------
const taus = [];
for (let t = 0.1; t <= 2.001; t += 0.05) taus.push(Number(t.toFixed(2)));
const porTau = taus.map((t) => ({ t, r: resumen(simular({ tolerancia: t })) }));
guardar("tolerancia", grafico({
  series: [
    { nombre: "Error de lo publicado", puntos: porTau.map(({ t, r }) => [t, r.errPubCon]), color: COLORES[1] },
    { nombre: "Error de lo que cree la gente", puntos: porTau.map(({ t, r }) => [t, r.errPrivCon]), color: COLORES[0] },
  ],
  xMin: 0.1, xMax: 2, yMin: 0, yMax: 1.6,
  verticales: [{ x: 0.75, etiqueta: "τ = ε/2" }, { x: 1.5, etiqueta: "τ = ε" }],
  xEtiqueta: "Tolerancia del filtro τ", yEtiqueta: "Error al final (ronda 60)",
}));
for (const { t, r } of porTau.filter(({ t }) => [0.5, 0.75, 1, 1.25, 1.5, 2].includes(t))) {
  console.log(`tau=${t}: verdad ${r.verdad}, errPub ${f2(r.errPubCon)}, errPriv ${f2(r.errPrivCon)}, rechazo ${f2(r.rechazo)}`);
}

// ---------------------------------------------------------------------------
// Dos comprobaciones analíticas que cita el texto
// ---------------------------------------------------------------------------
{
  const p = DEFECTO;
  // Ancho del pico de creencias de los no expertos: varianza estacionaria del mapa lineal con ruido.
  const v = ((1 - p.alfa) ** 2 * p.beta ** 2 * p.ruido ** 2) / (1 - (1 - p.alfa) ** 2 * (1 - p.beta) ** 2);
  const nExp = Math.round(p.expertos * p.personas);
  const noExpertos = conError.con.creencias.slice(nExp);
  console.log(`Desvío de creencias de no expertos al final: simulación ${f2(desvio(noExpertos))}, predicción ${f2(Math.sqrt(v))}`);
  console.log(`Media de no expertos ${f2(media(noExpertos))} vs punto fijo ${f2(equilibrio(p.alfa, p.beta, rc.mPub))}; expertos ${f2(media(conError.con.creencias.slice(0, nExp)))} vs ${f2(equilibrio(p.alfa, p.betaExpertos, rc.mPub))}`);
  // Estilo: cada ronda publicada acerca el estilo a 1/2 en un factor (1 − adopción · pulido).
  console.log(`(1 − a·p)^${p.rondas} = ${f2((1 - p.adopcion * p.pulido) ** p.rondas)}; diversidad medida ${f2(rc.estilo)}`);
}
