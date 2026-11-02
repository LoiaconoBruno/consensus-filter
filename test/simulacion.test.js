const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../src/simulacion.js");

const ultima = (corrida) => corrida.rondas[corrida.rondas.length - 1];

test("el filtro aprueba, optimiza o rechaza según la distancia a la base", () => {
  assert.equal(S.filtrar(1.4, 1.5, 0.5), "aprobada");
  assert.equal(S.filtrar(0.7, 1.5, 0.5), "optimizada");
  assert.equal(S.filtrar(0, 1.5, 0.5), "rechazada");
});

test("con la base de verdad correcta, el filtro converge a la verdad y casi no rechaza", () => {
  const r = S.simular({ error: 0 });
  assert.ok(ultima(r.con).errorPublico < 0.1);
  assert.ok(ultima(r.con).rechazo < 0.05);
  assert.ok(r.verdadPublicable);
});

test("con un error en la base, lo publicado se queda en el error y sin filtro se corrige", () => {
  const r = S.simular({ error: 1.5, tolerancia: 0.5 });
  assert.ok(Math.abs(ultima(r.con).errorPublico - 1.5) < 0.3, `con filtro: ${ultima(r.con).errorPublico}`);
  assert.ok(ultima(r.sin).errorPublico < 0.2, `sin filtro: ${ultima(r.sin).errorPublico}`);
  assert.equal(r.verdadPublicable, false, "decir la verdad real es rechazado");
});

test("las creencias privadas quedan cerca del equilibrio entre evidencia y lo publicado", () => {
  const r = S.simular({ error: 1.5, tolerancia: 0.5, rondas: 120, expertos: 0 });
  const mPriv = S.media(r.con.creencias);
  assert.ok(Math.abs(mPriv - r.equilibrioPrivado) < 0.35, `${mPriv} vs ${r.equilibrioPrivado}`);
  // Con α = 0,3 y β = 0,1: equilibrio = 0,3·1,5 / 0,4 = 1,125.
  assert.ok(Math.abs(r.equilibrioPrivado - 1.125) < 1e-12);
});

test("el filtro empobrece la diversidad de estilo; sin filtro se mantiene", () => {
  const r = S.simular({});
  const inicial = r.sin.rondas[0].estilo;
  assert.ok(Math.abs(ultima(r.sin).estilo - inicial) < 1e-9, "sin filtro nadie reescribe el estilo");
  assert.ok(ultima(r.con).estilo < inicial / 2, `con filtro: ${ultima(r.con).estilo} vs ${inicial}`);
});

test("con un error en la base, los expertos terminan mucho más rechazados que sin error", () => {
  // Promedio de las últimas 20 rondas: con 20 expertos, una sola ronda es ruidosa.
  const promedio = (r) => S.media(r.con.rondas.slice(-20).map((x) => x.rechazoExpertos));
  for (const semilla of [1, 2, 42]) {
    const conError = promedio(S.simular({ error: 1.5, semilla }));
    const sinError = promedio(S.simular({ error: 0, semilla }));
    assert.ok(conError > 0.5, `con error: ${conError}`);
    assert.ok(sinError < 0.3, `sin error: ${sinError}`);
  }
});

test("la misma semilla da el mismo resultado", () => {
  const a = S.simular({ semilla: 3, rondas: 10 });
  const b = S.simular({ semilla: 3, rondas: 10 });
  assert.deepEqual(a.con.rondas, b.con.rondas);
});

test("histograma cuenta cada valor en su caja", () => {
  const h = S.histograma([0.1, 0.2, 0.9, 5], 0, 1, 2);
  assert.deepEqual(h, [[0.25, 2], [0.75, 1]]);
});
