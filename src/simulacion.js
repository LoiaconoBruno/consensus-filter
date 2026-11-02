// Simulación de una red social donde una IA solo deja publicar lo que converge
// con su base de "verdad objetiva".
//
// Hay una verdad real R (que nadie ve directamente) y una base de verdad
// T = R + error que usa el filtro. Cada ronda:
//   1. Cada persona recibe evidencia propia, ruidosa, sobre R y ajusta su creencia (peso β).
//   2. Publica su conclusión. Con filtro, la IA la compara con T:
//        |c − T| ≤ tolerancia       → aprobada tal cual
//        |c − T| ≤ 2 × tolerancia   → "optimizada": se publica T
//        más lejos                  → rechazada
//      Lo que pasa el filtro además sale con el estilo "pulido" hacia el promedio.
//   3. Cada persona lee lo publicado y acerca su conclusión al promedio (peso α).
//      Su estilo se acerca al de la versión que la IA publicó por ella (peso
//      "adopción"): con los años todos escriben parecido.
// Una minoría de "expertos" confía más en su propia evidencia (como Semmelweis).
// Se corre la misma población con y sin filtro, con el mismo azar, para comparar.
const Simulacion = (() => {
  const DEFECTO = {
    personas: 200,
    rondas: 60,
    error: 1.5,        // T − R: el error en la base de verdad
    tolerancia: 0.5,   // cuánto puede alejarse una conclusión de T y pasar igual
    alfa: 0.3,         // influencia de lo publicado
    beta: 0.1,         // peso de la evidencia propia
    ruido: 1,          // ruido de la evidencia propia
    dispersionInicial: 2,
    pulido: 0.15,      // cuánto homogeneiza la IA el estilo de lo que aprueba
    adopcion: 0.2,     // cuánto adopta cada persona el estilo con que la publicaron
    expertos: 0.1,     // fracción de personas con más peso en su propia evidencia
    betaExpertos: 0.8, // peso de la evidencia propia en los expertos
    semilla: 42,
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

  // Qué hace el filtro con una conclusión c: "aprobada", "optimizada" o "rechazada".
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
    let estilos = Array.from({ length: p.personas }, () => r.u());
    const nExpertos = Math.round(p.expertos * p.personas);
    const beta = (i) => (i < nExpertos ? p.betaExpertos : p.beta);
    const rondas = [];
    let publicadas = [];

    for (let k = 0; k < p.rondas; k++) {
      // 1. Evidencia propia
      creencias = creencias.map((b, i) => b + beta(i) * (R + p.ruido * r.normal() - b));

      // 2. Publicación
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

      // 3. Lectura de lo publicado
      const mPub = media(publicadas);
      if (mPub !== null) creencias = creencias.map((b) => b + p.alfa * (mPub - b));

      rondas.push({
        dispersionPublica: desvio(publicadas),
        dispersionPrivada: desvio(creencias),
        rechazo: rechazadas / p.personas,
        optimizadas: optimizadas / p.personas,
        rechazoExpertos: nExpertos ? rechazadasExp / nExpertos : 0,
        errorPublico: mPub === null ? null : Math.abs(mPub - R),
        errorPrivado: Math.abs(media(creencias) - R),
        estilo: desvio(estilosPub),
      });
    }
    return { rondas, creencias, publicadas };
  }

  function simular(params = {}) {
    const p = { ...DEFECTO, ...params };
    const T = R + p.error;
    return {
      params: p,
      verdad: R,
      base: T,
      con: correr(p, true),
      sin: correr(p, false),
      // ¿Puede publicarse una conclusión que dice exactamente la verdad real?
      verdadPublicable: filtrar(R, T, p.tolerancia) !== "rechazada",
      // Punto fijo de las creencias privadas si lo publicado se queda en T.
      equilibrioPrivado: (p.beta * R + p.alfa * T) / (p.alfa + p.beta),
    };
  }

  // Histograma simple: devuelve [[centro, cantidad], ...].
  function histograma(xs, desde, hasta, cajas = 30) {
    const ancho = (hasta - desde) / cajas;
    const cuenta = new Array(cajas).fill(0);
    for (const x of xs) {
      const k = Math.floor((x - desde) / ancho);
      if (k >= 0 && k < cajas) cuenta[k]++;
    }
    return cuenta.map((c, k) => [desde + ancho * (k + 0.5), c]);
  }

  return { DEFECTO, filtrar, simular, histograma, media, desvio };
})();

if (typeof module !== "undefined") module.exports = Simulacion;
