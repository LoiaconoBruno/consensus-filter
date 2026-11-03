<div align="center">

# Consensus Filter

**Filtro de consenso artificial.** Una red social donde una IA solo publica lo que coincide con su base de verdad. ¿Qué pasa si la base tiene un error?

[**▶ Probala en vivo**](https://loiaconobruno.github.io/consensus-filter/) · [Cómo funciona](#cómo-funciona) · [Limitaciones](#limitaciones)

[![Tests](https://github.com/LoiaconoBruno/consensus-filter/actions/workflows/tests.yml/badge.svg)](https://github.com/LoiaconoBruno/consensus-filter/actions/workflows/tests.yml)
![Dependencias: 0](https://img.shields.io/badge/dependencias-0-brightgreen)
![HTML, CSS y JavaScript](https://img.shields.io/badge/HTML%20%C2%B7%20CSS%20%C2%B7%20JS-sin%20build-f7df1e)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)

<img src="docs/captura.png" alt="Captura de Consensus Filter" width="800">

</div>

Simulación interactiva de la premisa de una distopía: una red social donde una IA solo publica lo que converge con su base de "verdad objetiva". Se permiten muchas miradas, pero una sola conclusión. La página corre la misma población **con y sin filtro** y muestra qué pasa cuando la base de verdad tiene un error.

## Por qué

La novela necesita que el sistema sea creíble: que tenga beneficios reales y que, aun así, dé miedo. La simulación sirve para diseñar el motor de la trama, **el error en la base de verdad que nadie puede corregir**, y ver sus consecuencias antes de escribirlas:

- con la base correcta, el filtro parece un buen sistema;
- con un error, decir la verdad real es rechazado como desinformación, lo publicado se queda en el error y los que más confían en su propia evidencia (los Semmelweis) son los que quedan afuera;
- como la IA "pule" lo que aprueba, con el tiempo todos escriben parecido.

## Instalación

No hace falta instalar nada: **[abrila en el navegador](https://loiaconobruno.github.io/consensus-filter/)**.

Para usarla sin conexión o modificarla:

```bash
git clone https://github.com/LoiaconoBruno/consensus-filter.git
```

Después abrí `index.html` con doble clic. No hay dependencias ni paso de build. Para correr los tests hace falta Node 18 o más nuevo:

```bash
npm test
```

## Uso

Abrí la [demo en vivo](https://loiaconobruno.github.io/consensus-filter/) o `index.html` con doble clic. Todo se recalcula al mover un deslizador.

Ejemplo:

1. Al abrir está el escenario **Base con error**: la verdad real vale 0, la base de verdad vale 1,5 y la tolerancia del filtro es 0,5.
2. En "Al final de la simulación" se ve: **¿Se puede publicar la verdad real? No**. El error de lo publicado es 1,31 con filtro contra 0,02 sin filtro, y el de lo que cree la gente es 1,03 contra 0,02. Los expertos rechazados en las últimas 10 rondas son el 66 % y la diversidad de estilo que queda es el 17 %.
3. Apretá **Base correcta**: la verdad pasa a ser publicable, el error cae a 0,01 y el rechazo de expertos baja al 22 %.
4. Volvé a **Base con error** y subí la **tolerancia** a 1,5: decir la verdad real vuelve a pasar el filtro.

## Cómo funciona

Cada persona tiene una conclusión privada (un número) y un estilo (entre 0 y 1). En cada ronda:

1. Recibe evidencia propia, ruidosa, sobre la verdad real y acerca su conclusión a ella con peso β. Los **expertos** (10 % por defecto) usan un peso mayor.
2. Publica su conclusión. Con filtro, la IA la compara con la base de verdad T:
   - si está a menos de la tolerancia, se **aprueba**;
   - si está a menos del doble, se **optimiza** (se publica T);
   - si no, se **rechaza**.
   Lo que pasa el filtro sale con el estilo pulido hacia el promedio, y la persona adopta en parte ese estilo.
3. Lee lo publicado y acerca su conclusión al promedio con peso α.

Si lo publicado se queda en T, la conclusión privada de la mayoría tiende a `(β·R + α·T) / (α + β)`: la gente termina creyendo el error a medias.

Las dos corridas (con y sin filtro) usan el mismo azar, así que la única diferencia es el filtro. La lógica está en `src/simulacion.js`, sin DOM, y se testea con:

```bash
npm test
```

## Limitaciones

- Es un modelo de juguete: una sola pregunta numérica, todos leen todo y nadie miente.
- No modela resistencia organizada, canales por fuera de la red ni actualizaciones de la base de verdad.
- El "estilo" es un número, no texto real.

## Próximos pasos

- Agregar autocensura: personas que aprenden a escribir lo que pasa el filtro.
- Agregar una actualización de la base de verdad (¿quién la controla? ¿cada cuánto?).
- Escribir el mismo posteo en tres versiones, original, optimizado y rechazado, usando los casos que salen de la simulación.

## Licencia

MIT
