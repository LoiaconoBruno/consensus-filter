# El filtro de consenso: paper de uso y guía de la idea

## Resumen

Este documento acompaña a **Consensus Filter**, una simulación interactiva de la premisa de una novela distópica: una red social donde una inteligencia artificial solo publica lo que converge con su base de "verdad objetiva". Se permiten muchas miradas, pero una sola conclusión. La página corre la misma población **con y sin filtro** y muestra qué pasa cuando la base de verdad tiene un error: decir la verdad real pasa a ser rechazado como desinformación, lo publicado se queda en el error, quienes más confían en su propia evidencia (los "Semmelweis") quedan afuera, y como la IA "pule" lo que aprueba, con el tiempo todos escriben parecido.

La primera parte es un paper de uso: escenarios, controles, gráficos, un ejemplo resuelto con los números de la herramienta y los límites del modelo. La segunda es una guía de la idea. Recorre la tradición distópica (Zamiatin, Huxley, Orwell, Bradbury y la lectura de Neil Postman), los casos históricos en que un consenso equivocado castigó a quien tenía razón (Ignaz Semmelweis, Alfred Wegener, Barry Marshall y Robin Warren, Dan Shechtman, y el caso extremo de Trofim Lysenko), la defensa de la libertad de opinión de John Stuart Mill y la epistemología falibilista de Popper y Kuhn, los modelos matemáticos de dinámica de opiniones (DeGroot, Friedkin y Johnsen, Deffuant, Hegselmann y Krause) de los que sale la fórmula del equilibrio de la herramienta, la sabiduría de las multitudes de Galton y su fragilidad ante la influencia social (Lorenz y colaboradores), la espiral del silencio de Elisabeth Noelle-Neumann, la moderación de contenidos según Tarleton Gillespie y la evidencia reciente sobre cómo los modelos de lenguaje homogeneizan la escritura y se degradan al entrenarse con su propia producción.

## Parte I. Paper de uso

### 1. Qué es la herramienta

Consensus Filter es una página estática sin dependencias que se abre desde la [demo en vivo](https://loiaconobruno.github.io/consensus-filter/) o con doble clic en `index.html`. Todo se recalcula al mover un deslizador.

La página tiene tres zonas:

1. **Mundo:** dos escenarios (Base correcta y Base con error) y diez deslizadores.
2. **Al final de la simulación:** cinco indicadores que comparan la corrida con filtro y la corrida sin filtro.
3. **Cuatro gráficos:** qué se publica, qué hace el filtro, cómo escribe la gente y qué cree la gente al final.

La lógica está en `src/simulacion.js`, sin acceso al DOM. Los tests se corren con `npm test` (Node 18 o más nuevo).

### 2. Instalación

```bash
git clone https://github.com/LoiaconoBruno/consensus-filter.git
cd consensus-filter
npm test
```

Después se abre `index.html` con doble clic.

### 3. El modelo en una página

Hay una sola pregunta, con una respuesta numérica: la **verdad real** R, que vale 0. La IA tiene una **base de verdad** T, que puede coincidir con R o tener un error: T = R + error. Hay una población de personas. Cada una tiene una **conclusión privada** (un número, lo que cree) y un **estilo** (un número entre 0 y 1, que representa cómo escribe).

En cada ronda:

1. **Evidencia.** Cada persona recibe una observación propia de la verdad, con ruido, y acerca su conclusión a esa observación con un peso β. Los **expertos** (10 % de la población por defecto) usan un peso mayor: confían más en su propia evidencia.
2. **Publicación.** Cada persona publica su conclusión. Con filtro, la IA la compara con T:
   - si está a menos de la **tolerancia**, se **aprueba**;
   - si está a menos del doble de la tolerancia, se **optimiza**: se publica T en lugar de lo que la persona dijo;
   - si está más lejos, se **rechaza**.

   Lo que pasa el filtro sale con el estilo "pulido" hacia el promedio, y la persona adopta en parte ese estilo.
3. **Lectura.** Cada persona lee lo publicado y acerca su conclusión al promedio con un peso α.

La corrida sin filtro es idéntica, con el mismo azar, pero todo lo que se escribe se publica tal cual. La única diferencia entre las dos corridas es el filtro.

### 4. Los controles

| Control | Rango | Por defecto | Qué representa |
|---|---|---|---|
| Error en la base de verdad | 0 a 3 | 1,5 | T − R |
| Tolerancia del filtro | 0,1 a 1,5 | 0,5 | Cuánto puede alejarse una conclusión de T y pasar igual |
| Influencia de lo publicado (α) | 0 a 0,8 | 0,3 | Cuánto se deja llevar cada persona por lo que lee |
| Peso de la evidencia propia (β) | 0 a 0,8 | 0,1 | Cuánto confía cada persona en lo que observa |
| Fracción de expertos | 0 a 0,3 | 0,1 | Proporción de personas con más peso en su evidencia |
| Peso de la evidencia en expertos | 0 a 1 | 0,8 | El β de los expertos |
| Cuánto pule la IA el estilo | 0 a 0,5 | 0,15 | Cuánto acerca al promedio el estilo de lo que aprueba |
| Rondas | 10 a 150 | 60 | Duración de la simulación |
| Personas | 50 a 500 | 200 | Tamaño de la población |
| Semilla del azar | 1 a 100 | — | Para repetir o variar la corrida |

Los escenarios cambian solo el error: **Base correcta** lo pone en 0; **Base con error**, en 1,5.

### 5. Los indicadores

| Indicador | Qué mide |
|---|---|
| ¿Se puede publicar la verdad real? | Si alguien que dijera exactamente R pasaría el filtro (aprobada u optimizada) |
| Error de lo publicado (con / sin filtro) | Distancia entre el promedio de lo publicado y R, al final |
| Error en lo que cree la gente (con / sin) | Distancia entre el promedio de las conclusiones privadas y R, al final |
| Expertos rechazados (últimas 10 rondas) | Qué fracción de las publicaciones de expertos rechazó el filtro |
| Diversidad de estilo que queda | Dispersión del estilo al final, como porcentaje de la inicial |

### 6. Los gráficos

- **Qué se publica:** error de lo publicado por ronda, con y sin filtro.
- **Qué hace el filtro:** porcentaje de publicaciones rechazadas y optimizadas por ronda.
- **Cómo escribe la gente:** diversidad de estilo por ronda, con y sin filtro.
- **Qué cree la gente al final:** histograma de las conclusiones privadas, con y sin filtro.

### 7. Ejemplo resuelto

1. **Base con error.** Al abrir, la verdad real vale 0, la base de verdad vale 1,5 y la tolerancia es 0,5.
2. **Los indicadores.**
   - ¿Se puede publicar la verdad real? **No**. Una conclusión de 0 está a 1,5 de T, más del doble de la tolerancia (1,0): se rechaza.
   - Error de lo publicado: **1,31** con filtro contra **0,02** sin filtro. Con filtro, lo publicado se quedó casi en el error de la base; sin filtro, la población encontró la verdad.
   - Error en lo que cree la gente: **1,03** contra **0,02**. La gente, en privado, cree el error a medias.
   - Expertos rechazados en las últimas 10 rondas: **66 %**. Los que más confían en su propia evidencia son los más silenciados.
   - Diversidad de estilo que queda: **17 %**. Todos escriben parecido.
3. **Base correcta.** La verdad pasa a ser publicable, el error cae a **0,01** y el rechazo de expertos baja al **22 %**: con la base correcta, el filtro parece un buen sistema (aunque igual rechaza a uno de cada cinco expertos, por el ruido de su evidencia).
4. **Más tolerancia.** De vuelta en Base con error, con la tolerancia en 1,5, decir la verdad real vuelve a pasar el filtro: una conclusión de 0 está exactamente a 1,5 de T, dentro de la tolerancia.

### 8. La fórmula del equilibrio

Si lo publicado se queda en T, cada persona recibe en cada ronda dos tirones: hacia su evidencia (que, en promedio, apunta a R) con peso β, y hacia lo publicado (T) con peso α. El punto donde los dos tirones se equilibran es

$$ creencia ≈ (β · R + α · T) / (α + β) $$

Con los valores por defecto (β = 0,1, α = 0,3, R = 0, T = 1,5), el equilibrio es (0 + 0,45)/0,4 = **1,125**. La simulación da 1,03, un poco menos porque los expertos (con β = 0,8) tiran más hacia la verdad. La fórmula dice algo importante para la novela: **la gente no cree del todo el error, pero tampoco la verdad**. Cree un promedio ponderado entre lo que ve y lo que lee. Cuanto más pesa lo que lee frente a lo que ve, más cree el error.

Se puede comprobar con los deslizadores. Con α = β = 0,1 (la gente pesa igual lo que ve y lo que lee), la fórmula da 0,75: la mitad del error. La simulación da 0,73. Con α = 0,3 y β = 0,1, la fórmula da 1,125 y la simulación 1,03. Y con más expertos (30 % en vez de 10 %), el error privado baja de 1,03 a 0,94, pero el error de lo publicado no cambia (1,33): los expertos creen mejor, pero no pueden publicarlo. Es la tesis de la novela en dos números.

### 9. Cómo leer los resultados

- **Con la base correcta, el filtro "funciona".** Lo publicado converge a la verdad, el ruido desaparece de la red y la gente cree lo correcto. Es el argumento de quien defiende el sistema, y la novela lo necesita para que el sistema sea creíble.
- **Con un error, el filtro lo congela.** Sin filtro, la evidencia dispersa de muchas personas corrige el error en pocas rondas. Con filtro, la corrección no puede publicarse, porque se ve como desinformación.
- **Los expertos son los más castigados.** Como confían más en su evidencia, sus conclusiones se acercan a la verdad real y se alejan de T. Son los primeros en ser rechazados.
- **La homogeneización es un efecto aparte.** Incluso con la base correcta, el pulido de estilo reduce la diversidad de cómo escribe la gente.

#### 9.1 Preguntas frecuentes

**¿Qué pasa con la tolerancia en 0,75?** Una conclusión de 0 está a 1,5 de T, exactamente el doble de la tolerancia: se **optimiza**. La página dice que la verdad es "publicable", pero lo que se publica es T. Es uno de los rasgos más inquietantes del modelo: con ciertas tolerancias, decir la verdad no se rechaza, se **reescribe**. El autor ve publicado algo distinto de lo que escribió.

**¿Por qué hay rechazos con la base correcta?** Porque la evidencia de cada persona tiene ruido. En cada ronda, algunas conclusiones caen lejos de T por azar, y el filtro las rechaza aunque la base sea correcta. Los expertos, que siguen más de cerca su evidencia ruidosa, son rechazados más seguido.

**¿Por qué el error de lo publicado con filtro es 1,31 y no 1,5?** Porque lo publicado incluye conclusiones aprobadas que están dentro de la tolerancia, algunas del lado de la verdad. El promedio queda cerca de T pero no exactamente en T.

**¿Qué significa la semilla?** Fija la secuencia de números aleatorios. Con la misma semilla, la simulación da exactamente lo mismo; cambiándola, se ve cuánto dependen los resultados del azar.

#### 9.2 Recorrido guiado

1. **Empezá en Base correcta** y mirá el gráfico "Qué se publica". Con y sin filtro, el error baja a casi cero. *¿Para qué sirve el filtro, entonces?* Mirá "Qué hace el filtro": rechaza el ruido, y lo publicado converge más rápido.
2. **Pasá a Base con error.** Mirá cómo la curva con filtro se queda arriba y la sin filtro baja. Es el centro de todo.
3. **Mirá el histograma de creencias.** Con filtro, la gente se agrupa entre la verdad y el error; sin filtro, alrededor de la verdad.
4. **Mové la tolerancia** de 0,5 a 1,5 de a poco. Anotá en qué valor la verdad pasa a ser "publicable" (0,75, optimizada) y en cuál pasa a ser aprobada (1,5). Entre los dos, la verdad se publica, pero reescrita.
5. **Subí α** (la influencia de lo publicado) a 0,8. *¿Qué pasa con lo que cree la gente?* Se acerca al error: una población que confía mucho en lo que lee es más vulnerable.
6. **Poné el pulido en 0.** La diversidad de estilo deja de caer: la homogeneización depende de la IA que pule, no del filtro de conclusiones.
7. **Cambiá la semilla** varias veces. Los números cambian un poco, pero las conclusiones se mantienen: no dependen del azar.

### 10. Limitaciones

- Es un modelo de juguete: una sola pregunta numérica, todos leen todo y nadie miente.
- No modela resistencia organizada, canales por fuera de la red ni actualizaciones de la base de verdad.
- El "estilo" es un número, no texto real.

## Parte II. Guía de la idea

### 11. La idea: muchas miradas, una conclusión

La idea original es la premisa de una novela: una red social en la que una IA modera todo lo que se publica según una base de "verdad objetiva". No censura opiniones en el sentido tradicional: se puede escribir con cualquier estilo, desde cualquier punto de vista, con cualquier argumento. Lo único que no se puede es **llegar a otra conclusión**. Si la conclusión coincide con la base, se publica (pulida); si difiere un poco, se corrige; si difiere mucho, se rechaza como desinformación.

Para que la novela funcione, dice la idea, el sistema tiene que ser **creíble**: tener beneficios reales (menos desinformación, menos ruido, menos agresividad) y, aun así, dar miedo. El motor de la trama es un evento: **un error en la base de verdad que nadie puede corregir**, porque cualquier corrección es, por definición, una conclusión distinta de la base.

La simulación sirve para diseñar ese motor y ver sus consecuencias antes de escribirlas. Esta guía cuenta de dónde viene la idea, qué casos reales se le parecen y qué dicen los modelos matemáticos y la evidencia empírica sobre lo que pasaría.

### 12. La tradición distópica

#### 12.1 Zamiatin, Huxley, Orwell, Bradbury

La novela distópica del siglo XX imaginó muchas formas de controlar lo que la gente piensa. Yevgueni Zamiatin, en *Nosotros* (escrita en 1920-1921, publicada en inglés en 1924), describió un Estado Único donde todo es transparente, literalmente: las casas son de vidrio. Aldous Huxley, en *Un mundo feliz* (1932), imaginó un control sin violencia, por placer, condicionamiento y distracción. George Orwell, en *1984* (1949), imaginó el Ministerio de la Verdad, que reescribe el pasado y una neolengua diseñada para que ciertos pensamientos sean imposibles de formular. Ray Bradbury, en *Fahrenheit 451* (1953), imaginó bomberos que queman libros, y una población que en realidad ya había dejado de leerlos.

El filtro de la idea combina elementos de todas: como en Orwell, hay una verdad oficial que no se puede contradecir; como en Huxley, el sistema se presenta como un beneficio; como en Zamiatin, todo lo que se publica pasa por una mirada central; como en Bradbury, la homogeneización avanza también porque la gente se adapta.

#### 12.2 Orwell o Huxley

Neil Postman, en *Amusing Ourselves to Death* (1985), contrapuso las dos grandes distopías. Orwell temía que alguien nos prohibiera los libros; Huxley, que no hiciera falta prohibirlos porque nadie querría leerlos. Orwell temía que nos ocultaran la verdad; Huxley, que la verdad se ahogara en un mar de irrelevancia. Postman sostenía que la sociedad de la televisión se parecía más a Huxley.

El filtro de consenso tiene un pie en cada una. Es orwelliano en su núcleo (una verdad oficial) pero huxleyano en su presentación: no se siente como censura sino como un servicio que mejora la calidad de la conversación. Esa ambigüedad es lo que lo hace creíble, y lo que la simulación muestra con números: con la base correcta, el filtro reduce el error de lo publicado a casi cero.

### 13. Cuando el consenso se equivoca

#### 13.1 Semmelweis

Ignaz Semmelweis era un médico húngaro que trabajaba en 1847 en la maternidad del Hospital General de Viena. Notó que en la sala atendida por médicos y estudiantes la mortalidad por fiebre puerperal era varias veces mayor que en la sala atendida por parteras. Después de la muerte de un colega que se había cortado durante una autopsia y murió con síntomas parecidos, Semmelweis concluyó que los médicos llevaban "partículas cadavéricas" de la sala de autopsias a las parturientas. Impuso el lavado de manos con solución de cal clorada, y la mortalidad cayó drásticamente.

La comunidad médica lo rechazó. La idea contradecía la teoría dominante de las enfermedades (los miasmas) y, de paso, acusaba a los médicos de matar a sus pacientes. Semmelweis publicó sus resultados en 1861 en *Die Ätiologie, der Begriff und die Prophylaxis des Kindbettfiebers*, respondió a sus críticos con cartas cada vez más furiosas, fue internado en un asilo en 1865 y murió allí ese mismo año. Pocos años después, el trabajo de Louis Pasteur y Joseph Lister sobre los gérmenes le dio la razón. Hoy se llama **reflejo de Semmelweis** a la tendencia a rechazar evidencia nueva que contradice normas establecidas.

En la simulación, los expertos que confían en su propia evidencia y son rechazados por el filtro son los "Semmelweis". El 66 % de rechazo con la base equivocada es la versión numérica de su historia.

#### 13.2 Wegener y la deriva continental

En 1912, el meteorólogo alemán Alfred Wegener propuso que los continentes se habían movido, y lo desarrolló en *Die Entstehung der Kontinente und Ozeane* (1915). Reunió evidencia de que las costas de Sudamérica y África encajan, de que hay fósiles y rocas iguales a ambos lados del Atlántico y de que hay huellas de glaciaciones en zonas hoy tropicales. Los geólogos lo rechazaron casi unánimemente durante décadas, en parte porque no proponía un mecanismo convincente para el movimiento. Wegener murió en Groenlandia en 1930. La tectónica de placas, que le dio la razón en lo esencial, se aceptó recién en los años sesenta, cuando los datos del fondo oceánico mostraron la expansión del lecho marino.

#### 13.3 Marshall, Warren y la úlcera

A principios de los años ochenta, el consenso médico era que las úlceras de estómago se debían al estrés, la dieta y el exceso de ácido. En 1983, Robin Warren y Barry Marshall, en Perth, publicaron en *The Lancet* (321, 1273–1275) la observación de bacterias curvas en el estómago de pacientes con gastritis, y propusieron que una bacteria, después llamada *Helicobacter pylori*, causaba la mayoría de las úlceras. La comunidad fue escéptica. En 1984, Marshall se bebió un cultivo de la bacteria, desarrolló gastritis y se curó con antibióticos. La hipótesis se aceptó durante los años noventa, y Marshall y Warren recibieron el Premio Nobel de Medicina en 2005.

#### 13.4 Shechtman y los cuasicristales

En 1982, Dan Shechtman observó un patrón de difracción con simetría de orden diez, imposible según el consenso de la cristalografía. Fue ridiculizado; Linus Pauling, dos veces premio Nobel, dijo que no existían los cuasicristales, sino los "cuasicientíficos". Shechtman recibió el Nobel de Química en 2011.

#### 13.5 Lysenko: el filtro con poder de Estado

El caso más cercano a la distopía es el de Trofim Lysenko en la Unión Soviética. Lysenko, un agrónomo sin formación rigurosa, rechazaba la genética mendeliana y sostenía que los caracteres adquiridos por las plantas se heredaban. Con el apoyo de Stalin, en la sesión de la Academia Lenin de Ciencias Agrícolas de agosto de 1948, su doctrina se declaró oficial y la genética se proscribió como "ciencia burguesa". Los genetistas fueron despedidos, y algunos, como Nikolái Vavílov (arrestado en 1940, muerto en prisión en 1943), habían sido perseguidos desde antes. La biología soviética quedó atrasada durante décadas, con consecuencias agrícolas graves. Zhores Medvedev contó la historia en *The Rise and Fall of T. D. Lysenko* (1969).

Lysenko es la versión real de "un error en la base de verdad que nadie puede corregir": una conclusión oficial, sostenida por una autoridad que controla lo que se publica, que convirtió a quienes tenían razón en disidentes.

#### 13.6 La lección

Estos casos no muestran que el consenso científico suela estar equivocado: la mayoría de las veces, el consenso es la mejor conclusión disponible. Muestran algo más específico: que **el consenso se corrige gracias a quienes lo contradicen con evidencia**, y que esa corrección es lenta y costosa incluso cuando los disidentes pueden publicar. En la distopía de la idea, no pueden. La simulación lo muestra con la comparación más simple: sin filtro, el error de lo publicado cae a 0,02; con filtro, se queda en 1,31.

### 14. Por qué hay que dejar hablar al que se equivoca

#### 14.1 Mill, 1859

John Stuart Mill dedicó el segundo capítulo de *Sobre la libertad* (1859) a defender la libertad de pensamiento y discusión. Sus argumentos siguen siendo la mejor respuesta a la premisa del filtro:

1. **La opinión silenciada puede ser verdadera.** Negarlo es suponer la propia infalibilidad. Quienes silenciaron opiniones verdaderas en la historia estaban tan seguros como cualquiera.
2. **Aunque sea falsa, puede contener una parte de verdad**, y la opinión dominante rara vez es toda la verdad; solo el choque entre opiniones permite completarla.
3. **Aunque la opinión dominante sea toda la verdad**, si no se la discute se sostiene como un prejuicio, sin comprender sus fundamentos.
4. **Y el sentido mismo de la doctrina** se pierde: se vuelve una fórmula muerta, repetida sin convicción.

El filtro de la idea vulnera los cuatro. El primero es el del error en la base. El tercero y el cuarto aparecen incluso con la base correcta: si nadie puede publicar una conclusión distinta, nadie tiene que defender la correcta, y la homogeneización del estilo (el 17 % de diversidad que queda) es una imagen de la "fórmula muerta" de Mill.

#### 14.2 Popper y el falibilismo

Karl Popper sostuvo, en *La lógica de la investigación científica* (1934, edición inglesa de 1959) y en *Conjeturas y refutaciones* (1963), que el conocimiento científico no se justifica de una vez para siempre: se mantiene mientras resiste los intentos de refutarlo. Una teoría que no se puede refutar no es científica. Una sociedad que no permite intentar refutar sus verdades oficiales, dijo en *La sociedad abierta y sus enemigos* (1945), se cierra al aprendizaje.

El filtro, en términos popperianos, inmuniza la base de verdad contra la refutación. Es exactamente lo que Popper llamaba una estrategia que convierte una teoría en dogma.

#### 14.3 Kuhn y las anomalías

Thomas Kuhn describió en *La estructura de las revoluciones científicas* (1962) cómo la ciencia normal trabaja dentro de un **paradigma** y cómo las **anomalías** (resultados que no encajan) se acumulan hasta provocar una crisis y un cambio de paradigma. Kuhn mostró que la resistencia a las anomalías es normal y hasta útil: un paradigma no se abandona por cualquier resultado raro. Pero las anomalías tienen que poder registrarse y circular. En la red de la idea, cada anomalía (cada conclusión que se aleja de T) se rechaza antes de ser vista, y nunca se acumulan las suficientes para provocar una crisis.

### 15. La matemática de las opiniones

#### 15.1 DeGroot: el promedio que converge

Morris DeGroot propuso en 1974 (*Journal of the American Statistical Association*, 69(345), 118–121) un modelo simple de cómo un grupo llega a un consenso: en cada ronda, cada persona reemplaza su opinión por un promedio ponderado de las opiniones de los demás. Bajo condiciones muy generales, el grupo converge a una opinión común. El modelo explica por qué los grupos llegan a acuerdos, pero también por qué pueden converger a algo equivocado: el resultado depende de las opiniones iniciales y de los pesos, no de la verdad.

#### 15.2 Friedkin y Johnsen: el ancla de la evidencia

Noah Friedkin y Eugene Johnsen agregaron en 1990 (*Journal of Mathematical Sociology*, 15(3–4), 193–206) un ingrediente: cada persona mantiene un apego a su opinión inicial (o a su propia información), además de dejarse influir por los demás. El resultado ya no es un consenso total sino un equilibrio en el que cada uno queda entre su ancla y la influencia social.

La fórmula del equilibrio de la herramienta, (β · R + α · T) / (α + β), es un caso particular de ese modelo: el ancla de cada persona es su evidencia (que apunta a R) con peso β, y la influencia social es lo publicado (que el filtro fija en T) con peso α. Lo que el filtro hace es reemplazar la influencia de los demás por la influencia de la base.

#### 15.3 Confianza acotada

Guillaume Deffuant y colaboradores (*Advances in Complex Systems*, 3, 87–98, 2000) y Rainer Hegselmann y Ulrich Krause (*Journal of Artificial Societies and Social Simulation*, 5(3), 2002) propusieron modelos de **confianza acotada**: cada persona solo se deja influir por opiniones que están a menos de cierta distancia de la suya. Opiniones muy lejanas se ignoran. Según el tamaño de esa distancia, la población converge a un consenso, se polariza en dos grupos o se fragmenta en muchos.

El filtro de la idea es una confianza acotada impuesta desde afuera y centrada en un punto fijo: la tolerancia es la distancia máxima a T que se acepta. Con tolerancia chica, la red se vuelve un monólogo; con tolerancia grande, el filtro deja pasar casi todo y el error se corrige. La herramienta permite ver la transición: con la base equivocada en 1,5, la verdad se vuelve publicable a partir de una tolerancia de 0,75 (optimizada) o de 1,5 (aprobada).

#### 15.4 Un experimento mental: el filtro en Viena, 1847

Traduzcamos el caso de Semmelweis al lenguaje del modelo. La pregunta es la tasa de mortalidad atribuible a las manos de los médicos. La verdad real R es alta; la base de verdad T del consenso médico (los miasmas, no las manos) es cero. Los médicos de la época son la población; Semmelweis y unos pocos más, que observaron de cerca las dos salas, son los expertos con β alto.

Sin filtro, la historia real: Semmelweis publica, los demás lo critican, pero sus datos circulan, otros los repiten, y décadas después (con la ayuda de Pasteur y Lister) el consenso cambia. Lento y doloroso, pero el error se corrige.

Con filtro y tolerancia chica, sus publicaciones se rechazan como desinformación. Sus colegas que tuvieran dudas privadas no verían ningún texto que las confirmara, y su creencia se quedaría en el equilibrio entre lo que ven en sus salas y lo que leen. Si confían más en lo que leen que en lo que ven (α > β), creerían que las manos importan poco. Los datos de Semmelweis no circularían, y la corrección que en la historia real tardó unas dos décadas podría no llegar nunca.

Con filtro y tolerancia intermedia, pasaría algo peor: algunas publicaciones de Semmelweis serían **optimizadas**, es decir, publicadas con su nombre pero con la conclusión del consenso. Semmelweis aparecería, ante sus colegas, como alguien que confirma que las manos no importan.

El experimento mental muestra por qué la premisa funciona como distopía: no hace falta imaginar un régimen malvado. Basta con un sistema bien intencionado, una base razonable para su época y una tolerancia elegida para frenar el ruido.

### 16. La sabiduría de las multitudes y su fragilidad

#### 16.1 Galton y el buey

En 1906, en una feria de ganado en Plymouth, Francis Galton analizó unas 800 apuestas sobre el peso de un buey faenado. La mediana de las estimaciones fue 1207 libras; el peso real, 1198. Galton lo publicó en 1907 en *Nature* (75, 450–451) con el título *Vox populi*. Es el ejemplo fundacional de la **sabiduría de las multitudes**: el promedio de muchas estimaciones independientes, cada una con su error, puede ser muy preciso, porque los errores se cancelan.

La corrida sin filtro de la herramienta es una sabiduría de las multitudes: cada persona tiene evidencia ruidosa, y el promedio de lo publicado converge a la verdad (error 0,02).

#### 16.2 La influencia social la destruye

La condición clave es la **independencia**. Jan Lorenz, Heiko Rauhut, Frank Schweitzer y Dirk Helbing mostraron en 2011 (*Proceedings of the National Academy of Sciences*, 108(22), 9020–9025) que cuando las personas ven las estimaciones de los demás antes de dar la suya, la diversidad de estimaciones se reduce sin que mejore la precisión, y el grupo se vuelve más confiado en un resultado que puede estar equivocado. Lo llamaron el **efecto de la reducción de rango** y el **efecto de confianza**.

En el filtro de consenso, la influencia social es extrema: lo único que se ve publicado es lo que está cerca de T. La diversidad colapsa por diseño, y con ella la capacidad de la multitud de corregir errores.

#### 16.3 La diversidad como recurso

Lu Hong y Scott Page mostraron en 2004 (*Proceedings of the National Academy of Sciences*, 101(46), 16385–16389), con un modelo de agentes que resuelven problemas, que un grupo diverso de solucionadores puede superar a un grupo de los individualmente mejores, porque los diversos exploran más regiones del espacio de soluciones. Page lo desarrolló en *The Difference* (2007). El filtro elimina justamente la diversidad que permitiría encontrar el error.

### 17. Callarse antes de que te rechacen

#### 17.1 Asch

Solomon Asch hizo en los años cincuenta sus célebres experimentos de conformidad (*Psychological Monographs*, 70(9), 1956): personas que debían juzgar cuál de tres líneas era igual a una línea de referencia, en un grupo de cómplices que daban unánimemente una respuesta equivocada. Alrededor de un tercio de las respuestas de los participantes se ajustaron al grupo. Pero bastaba un solo cómplice que diera la respuesta correcta para que la conformidad cayera drásticamente. Un solo disidente visible protege a los demás.

En la red filtrada, ningún disidente es visible. Es la condición experimental en la que Asch encontró más conformidad.

#### 17.2 La espiral del silencio

Elisabeth Noelle-Neumann propuso en 1974 (*Journal of Communication*, 24(2), 43–51) la **espiral del silencio**: las personas observan el clima de opinión y, si creen que su opinión es minoritaria, tienden a callarse por miedo al aislamiento. Al callarse, la opinión parece todavía más minoritaria, y más gente se calla. El ciclo puede hacer que una opinión mayoritaria en privado desaparezca del espacio público.

El primer próximo paso del proyecto es agregar **autocensura**: personas que aprenden a escribir lo que pasa el filtro. Con autocensura, la espiral del silencio se volvería parte del modelo: la tasa de rechazo bajaría (porque la gente deja de intentar publicar lo que sabe que será rechazado), y el filtro parecería cada vez menos represivo justo cuando más está funcionando. Es un giro posible para la novela: un sistema que, con el tiempo, casi no necesita rechazar nada.

### 18. Moderación real y sus problemas

#### 18.1 Los custodios de internet

Tarleton Gillespie, en *Custodians of the Internet* (2018), mostró que la moderación de contenidos no es un agregado de las plataformas sino su producto central: decidir qué se ve y qué no es lo que hacen. Las plataformas moderan con reglas, con equipos humanos y, cada vez más, con sistemas automáticos. Todos esos mecanismos cometen errores en las dos direcciones: dejan pasar contenido dañino y bajan contenido legítimo.

El filtro de la idea es una exageración de una tendencia real: delegar en un sistema automático la decisión de qué es verdad. La diferencia es de grado. Las plataformas actuales etiquetan, reducen el alcance o eliminan contenido que sus sistemas consideran desinformación según fuentes de verificación; el filtro de la idea solo publica lo que coincide con su base.

#### 18.2 La desinformación es un problema real

La idea no sería creíble si el problema que el filtro dice resolver no existiera. Existe. Soroush Vosoughi, Deb Roy y Sinan Aral analizaron en 2018 (*Science*, 359(6380), 1146–1151) la difusión de unas 126 000 noticias en Twitter entre 2006 y 2017, y encontraron que las falsas llegaban más lejos, más rápido y a más gente que las verdaderas, sobre todo en política, y que la diferencia se debía a las personas, no a los bots. La novedad de las noticias falsas las hacía más compartibles.

Esa es la tentación del filtro: si la verdad pierde la carrera contra la mentira en una red libre, ¿por qué no ayudarla? La simulación da la respuesta matemática: porque la ayuda solo funciona si la base es correcta, y nadie puede garantizar eso.

#### 18.3 Quién controla la base

La pregunta clásica es la de Juvenal: *quis custodiet ipsos custodes?*, ¿quién vigila a los vigilantes? El segundo próximo paso del proyecto es agregar una **actualización de la base de verdad**: ¿quién la controla?, ¿cada cuánto se revisa?, ¿con qué evidencia, si la evidencia contraria no se puede publicar? Es la pregunta que convierte la premisa en una trama. Si la base se actualiza con lo que se publica, nunca cambia (porque solo se publica lo que coincide). Si se actualiza con otra fuente, la novela tiene que decir cuál, y esa fuente se vuelve el verdadero poder.

### 19. Todos escriben parecido: la homogeneización

#### 19.1 Monocultivo algorítmico

Jon Kleinberg y Manish Raghavan analizaron en 2021 (*Proceedings of the National Academy of Sciences*, 118(22), e2018340118) el **monocultivo algorítmico**: cuando muchas decisiones (contrataciones, créditos, admisiones) se toman con el mismo algoritmo, sus errores se vuelven correlacionados. Un candidato que el algoritmo evalúa mal es rechazado en todos lados, no solo en un lugar. Mostraron que, en ciertos casos, usar el mismo algoritmo, aunque sea más preciso que las alternativas, empeora el resultado social.

El filtro de consenso es un monocultivo perfecto: un solo sistema decide qué se publica en toda la red. Sus errores no se compensan con los de otros sistemas.

#### 19.2 La IA que pule

El efecto de pulido del modelo tiene evidencia real. Vishakh Padmakumar y He He mostraron en 2024 (*International Conference on Learning Representations*) que, cuando muchas personas escriben con ayuda del mismo modelo de lenguaje, los textos resultantes son menos diversos entre sí que los escritos sin ayuda. Anil Doshi y Oliver Hauser encontraron en 2024 (*Science Advances*, 10(28), eadn5290) que las historias escritas con ideas sugeridas por una IA eran individualmente evaluadas como más creativas, pero colectivamente más parecidas entre sí. Es la paradoja que el modelo captura: cada texto mejora, el conjunto se empobrece.

#### 19.3 El colapso de los modelos

Hay un efecto más profundo. Ilia Shumailov y colaboradores mostraron en 2024 (*Nature*, 631, 755–759) que los modelos de IA entrenados repetidamente con datos generados por otros modelos (o por versiones anteriores de sí mismos) sufren un **colapso**: pierden primero las colas de la distribución (lo raro, lo diverso) y después la calidad general. En una red donde todo lo publicado pasó por el filtro y fue pulido por la IA, cualquier modelo futuro entrenado con esa red heredaría la homogeneidad y el error. El filtro no solo congela el error del presente: contamina los datos del futuro.

### 20. Lo que el modelo deja afuera

El modelo es deliberadamente simple, y sus omisiones son, a la vez, limitaciones y oportunidades para la novela.

**Nadie miente.** En el modelo, todas las personas buscan la verdad con evidencia honesta; el único problema es el ruido. En el mundo real hay quienes publican falsedades a sabiendas, por interés o por diversión. Agregarlos haría al filtro **más** defendible: con la base correcta, eliminaría mentiras además de ruido. Es un buen argumento para el personaje que defiende el sistema, y la novela debería dárselo: un filtro que solo frena a gente honesta con evidencia ruidosa es un hombre de paja.

**Nadie se organiza.** No hay resistencia ni canales alternativos. En la historia real, los sistemas de control de la información siempre generaron circuitos paralelos. En la Unión Soviética, el **samizdat** (literalmente, "autoedición") hacía circular textos prohibidos copiados a máquina, de mano en mano, desde los años cincuenta hasta el fin del régimen; obras de Solzhenitsyn, Ajmátova o Bulgákov llegaron a sus lectores así. Una novela sobre el filtro de consenso probablemente necesite su samizdat: un canal fuera de la red donde circulen las conclusiones rechazadas. La simulación podría incorporarlo como una fracción de personas que leen también lo que el filtro rechazó.

**Todos leen todo.** En el modelo, cada persona lee el promedio de lo publicado. En una red real, cada uno ve una parte, seleccionada por algoritmos de recomendación y por sus contactos. Eso crea burbujas y comunidades con creencias distintas, y abriría la posibilidad de que el error de la base se corrija en algunas comunidades y no en otras.

**La base no cambia.** Es el segundo próximo paso del proyecto, y quizás el más importante para la trama. Una base que nunca cambia es un dogma; una que cambia según lo publicado, un círculo vicioso; una que cambia según una autoridad externa, un poder político. Cada opción es una novela distinta.

**Una sola pregunta.** El modelo tiene una única pregunta numérica. Una red real discute miles de preguntas, con distintos grados de certeza. Un filtro con error en una sola pregunta, entre miles correctas, sería mucho más difícil de detectar: su buen desempeño en las demás le daría credibilidad. Es quizás la versión más realista, y más inquietante, de la premisa.

### 21. Usar la simulación para escribir la novela

El tercer próximo paso es escribir el mismo posteo en tres versiones (original, optimizado y rechazado) usando los casos que salen de la simulación. La simulación ofrece varios materiales narrativos:

- **El experto rechazado.** Un personaje con buena evidencia (β alto), cuyas publicaciones son rechazadas dos de cada tres veces. Su conclusión privada está cerca de la verdad; su vida pública, vacía.
- **La persona optimizada.** Alguien cuya conclusión está a una distancia intermedia de T: no la rechazan, la **reescriben**. Ve publicado con su nombre algo que no dijo. Es quizás el personaje más inquietante, porque el sistema no la silencia: la usa.
- **La mayoría a medias.** El 1,03 de error privado: gente que cree el error a medias, con dudas que no puede compartir.
- **La deriva del estilo.** El 17 % de diversidad que queda: una sociedad en la que todos los textos suenan igual. Una escena posible es alguien que encuentra un texto viejo, previo al filtro, y le sorprende la variedad de voces.
- **El parámetro de la tolerancia.** Una decisión técnica (subir o bajar la tolerancia) con consecuencias políticas enormes. Quién la toca y por qué puede ser una subtrama.
- **El momento en que la base cambia.** Si la base se corrige, ¿qué pasa con los Semmelweis? ¿Se los reivindica o se borra que fueron rechazados?

La regla de la novela, como la de la simulación, es que el sistema tiene que ser creíble. Con la base correcta, el filtro funciona. El horror no está en el sistema en sí sino en que nadie puede saber si la base es correcta.

### 22. Consensos legítimos: cómo se forman y cómo se corrigen

La premisa de la novela podría leerse como un ataque al consenso en general. No lo es, y conviene que la novela tampoco lo sea. Hay consensos que son la mejor conclusión disponible, y la diferencia entre ellos y la base de verdad del filtro no está en el contenido sino en el **proceso**.

#### 22.1 El consenso como resultado

En 2004, la historiadora de la ciencia Naomi Oreskes publicó en *Science* (306(5702), 1686) un breve ensayo titulado *The scientific consensus on climate change*. Analizó una muestra de 928 resúmenes de artículos con revisión por pares publicados entre 1993 y 2003 que contenían la expresión "cambio climático global", y no encontró ninguno que rechazara explícitamente la conclusión de que el calentamiento de las décadas recientes se debía en buena parte a la actividad humana. John Cook y colaboradores hicieron un análisis más amplio en 2013 (*Environmental Research Letters*, 8, 024024), con casi 12 000 resúmenes, y encontraron que, entre los que expresaban una posición, alrededor del 97 % respaldaba esa conclusión.

Lo importante de esos estudios es cómo se llegó al consenso: miles de investigadores independientes, con datos distintos, métodos distintos y la posibilidad abierta de publicar resultados contrarios, que convergieron en la misma conclusión. Es la sabiduría de las multitudes de Galton en su versión institucional. Y es exactamente lo contrario del filtro: el consenso climático es un **resultado** de la libertad de disentir; la base de verdad del filtro es un **punto de partida** que la elimina.

#### 22.2 Instituciones de síntesis

El Panel Intergubernamental sobre Cambio Climático (IPCC), creado en 1988, no hace investigación propia: reúne a cientos de autores para evaluar la literatura publicada, y sus informes pasan por varias rondas de revisión abierta a expertos y gobiernos, con miles de comentarios que deben ser respondidos. Las conclusiones se expresan con un lenguaje calibrado de probabilidad ("muy probable", "probable") y de confianza, que indica cuán sólida es la evidencia.

Esa forma de expresar el consenso tiene tres rasgos que el filtro no tiene. Primero, admite grados: no hay una conclusión única sino un rango con su incertidumbre. Segundo, se revisa periódicamente: cada informe actualiza al anterior. Tercero, deja registro del disenso: los comentarios de los revisores y las respuestas se publican. Un filtro que quisiera parecerse a un consenso legítimo tendría que incorporar esas tres cosas, y entonces dejaría de ser un filtro.

#### 22.3 Wikipedia: consenso con disenso visible

Wikipedia es un experimento enorme de construcción de consenso. Sus artículos se escriben bajo la regla del "punto de vista neutral", que pide representar las posiciones significativas en proporción a su presencia en fuentes confiables. En 2005, *Nature* comparó artículos científicos de Wikipedia y de la *Encyclopaedia Britannica* (Jim Giles, *Nature*, 438, 900–901) y encontró que la cantidad de errores graves era similar y que Wikipedia tenía algo más de errores menores. El resultado fue discutido, pero mostró que un proceso abierto podía producir un consenso de calidad comparable al de uno cerrado y experto.

Lo más interesante de Wikipedia para la novela no son sus artículos sino sus **páginas de discusión** y su **historial**: cada artículo tiene, detrás, una conversación pública en la que se discuten las fuentes y las afirmaciones, y un registro de cada cambio. El consenso es visible y, al mismo tiempo, se puede ver cómo se formó y quién no estuvo de acuerdo. El filtro de la novela es la imagen inversa: muestra el resultado y oculta el desacuerdo.

#### 22.4 La ciencia también se equivoca, y lo sabe

La ciencia tiene mecanismos para corregir sus errores, imperfectos pero reales. En 2012, Ferric Fang, R. Grant Steen y Arturo Casadevall analizaron más de 2000 artículos biomédicos retractados (*Proceedings of the National Academy of Sciences*, 109(42), 17028–17033) y encontraron que la mayoría se retiró por mala conducta (fraude, plagio, duplicación) y no por error honesto, y que la proporción de retractaciones venía creciendo. En 2015, la Open Science Collaboration intentó replicar cien estudios de psicología publicados en revistas importantes (*Science*, 349(6251), aac4716) y obtuvo resultados significativos en solo alrededor de un tercio de los casos.

Estos trabajos se suelen citar como evidencia de una "crisis" de la ciencia. Para la novela, muestran otra cosa: que la ciencia publica sus propios fracasos. La crisis de replicación fue descubierta, discutida y medida por científicos, en revistas científicas, y llevó a cambios concretos (preregistración, datos abiertos, estudios de replicación). Es el mecanismo que el filtro rompe: una comunidad que puede publicar que se equivocó.

#### 22.5 Herramientas contra el error

Después de la crisis de replicación, la comunidad científica adoptó prácticas pensadas para que los errores se detecten antes y se corrijan más rápido. Brian Nosek y colaboradores describieron una de ellas en *The preregistration revolution* (*Proceedings of the National Academy of Sciences*, 115(11), 2600–2606, 2018): registrar públicamente, antes de recolectar los datos, qué hipótesis se van a poner a prueba y cómo se van a analizar. Otras son la publicación de los datos y del código, los informes registrados (revistas que aceptan un artículo por su diseño, antes de conocer los resultados) y los estudios de replicación coordinados entre muchos laboratorios.

Todas tienen algo en común: hacen **más visible** el trabajo, incluido lo que sale mal. Son el opuesto exacto del filtro, que hace menos visible todo lo que se aparta de la base. Para la novela, pueden inspirar a la resistencia: un grupo que, sin poder publicar sus conclusiones, registra sus predicciones con fecha en algún lugar fuera de la red, para poder demostrar después que tenían razón antes de que la base cambiara.

### 23. El filtro en la vida diaria: lo que ya existe

La premisa exagera, pero varias piezas del filtro ya existen en escala reducida, y conocerlas ayuda a escribir una distopía verosímil.

- **Etiquetas de verificación.** Durante la pandemia de COVID-19, varias plataformas agregaron etiquetas a publicaciones sobre vacunas y tratamientos, enlazando a fuentes oficiales, y redujeron el alcance de las que contradecían a esas fuentes. Algunas afirmaciones etiquetadas como desinformación en un momento (por ejemplo, sobre el origen del virus) pasaron después a considerarse hipótesis legítimas en discusión. Es un caso real, aunque mucho más acotado, de una base de verdad que cambió mientras se usaba para moderar.
- **Correctores y asistentes de escritura.** Los sistemas que sugieren cómo reescribir un texto son, en su forma más benigna, el "pulido" del modelo. Cuando millones de personas aceptan las mismas sugerencias, el efecto agregado es la homogeneización que midieron Padmakumar, He, Doshi y Hauser.
- **Respuestas únicas.** Los buscadores y asistentes que responden con un solo párrafo en vez de una lista de fuentes concentran en una sola respuesta lo que antes era una variedad de enlaces. La pregunta de la novela, "¿y si esa respuesta está mal?", es una pregunta práctica para cualquier sistema de este tipo.

Ninguno de estos ejemplos es el filtro de la novela, y la novela no necesita afirmar que lo sean. Pero muestran que la distancia entre la premisa y el presente es de grado y de alcance, no de naturaleza. Es la distancia justa para una buena distopía: lo bastante lejos para ser ficción, lo bastante cerca para inquietar.

Una manera útil de usar estos ejemplos en la novela es preguntarse qué condiciones tendría que cumplir el filtro para ser **legítimo**, y mostrar cómo, en la ficción, cada una se fue perdiendo. Con lo visto en la sección 22, la lista sería: que la base de verdad exprese grados de certeza y no una sola conclusión; que se revise periódicamente con un procedimiento público; que el disenso fundado quede registrado y visible aunque no se amplifique; que haya una instancia independiente para apelar un rechazo; y que nadie que controle la base se beneficie de su contenido. Una distopía verosímil no empieza con un villano que apaga todo, sino con un sistema que cumplía esas condiciones y las fue abandonando, una por una, por eficiencia, por urgencia o por comodidad.

### 24. Del modelo al código

| Concepto | En `src/simulacion.js` | Qué produce |
|---|---|---|
| Parámetros por defecto | `DEFECTO` | 200 personas, 60 rondas, error 1,5, tolerancia 0,5, α 0,3, β 0,1, 10 % de expertos con β 0,8, pulido 0,15 |
| Decisión del filtro | `filtrar(c, T, tolerancia)` | "aprobada", "optimizada" o "rechazada" |
| Simulación con y sin filtro | `simular(params)` | Las dos corridas con el mismo azar, si la verdad es publicable y el equilibrio privado |
| Histograma | `histograma(valores, …)` | El gráfico de creencias finales |
| Estadísticas | `media`, `desvio` | Promedios y dispersiones |

Los tests verifican: que el filtro aprueba, optimiza o rechaza según la distancia a la base; que con la base correcta el filtro converge a la verdad y casi no rechaza; que con un error en la base lo publicado se queda en el error y sin filtro se corrige; que las creencias privadas quedan cerca del equilibrio entre evidencia y lo publicado; que el filtro empobrece la diversidad de estilo y sin filtro se mantiene; que con un error en la base los expertos terminan mucho más rechazados que sin error; que la misma semilla da el mismo resultado, y que el histograma cuenta cada valor en su caja.

```js
const S = require("./src/simulacion.js");
S.filtrar(0, 1.5, 0.5);                  // "rechazada"
S.filtrar(0, 1.5, 0.75);                 // "optimizada"
S.simular({}).equilibrioPrivado;         // 1,125
```

### 25. Ejercicios

1. Con la base con error, ¿qué tolerancia mínima hace que la verdad sea publicable? ¿Y que sea aprobada sin reescribir?
2. Calculá con la fórmula del equilibrio qué creería la gente si α = β. ¿Y si β = 0?
3. Poné la fracción de expertos en 0,3. ¿Cambia el error de lo que cree la gente? ¿Por qué?
4. Poné el pulido en 0. ¿Qué pasa con la diversidad de estilo con filtro?
5. Diseñá en papel una regla de actualización de la base de verdad. ¿Con qué datos se actualizaría, si lo publicado ya está filtrado?
6. Escribí el mismo posteo en tres versiones: lo que escribió un experto, cómo lo publicaría el filtro optimizado y el aviso de rechazo.
7. Elegí una de las cinco condiciones de legitimidad de la sección 23 y escribí la escena en la que el filtro de la novela la abandona.
8. Buscá un caso real en el que una plataforma etiquetó como falsa una afirmación que después se reconsideró. ¿Qué mecanismo permitió la corrección?
9. Leé el segundo capítulo de *Sobre la libertad* de Mill y elegí cuál de sus cuatro argumentos sería el centro de la novela.

### 26. Glosario

- **Verdad real (R):** el valor correcto de la pregunta del modelo.
- **Base de verdad (T):** lo que la IA considera verdadero; puede tener un error.
- **Tolerancia:** distancia máxima a T que el filtro acepta sin cambios.
- **Publicación optimizada:** la que el filtro reescribe con el valor de T.
- **Equilibrio privado:** punto donde se estabilizan las creencias, entre la evidencia y lo publicado.
- **Reflejo de Semmelweis:** rechazo de evidencia nueva que contradice normas establecidas.
- **Falibilismo:** posición según la cual todo conocimiento puede ser revisado.
- **Confianza acotada:** modelo en el que solo influyen opiniones cercanas a la propia.
- **Sabiduría de las multitudes:** precisión del promedio de muchas estimaciones independientes.
- **Espiral del silencio:** proceso por el que las opiniones percibidas como minoritarias se callan cada vez más.
- **Monocultivo algorítmico:** uso del mismo algoritmo en muchas decisiones, con errores correlacionados.
- **Retractación:** retiro formal de un artículo científico publicado, por error o mala conducta.
- **Crisis de replicación:** constatación de que muchos resultados publicados no se reproducen al repetir los estudios.
- **Colapso de modelos:** degradación de modelos entrenados con datos generados por modelos.

### 27. Conclusión

La premisa de la novela, una red en la que una IA solo publica lo que coincide con su base de verdad, tiene la virtud de las buenas distopías: exagera una tendencia real hasta volverla visible. La simulación muestra con números por qué da miedo aunque funcione. Con la base correcta, el filtro reduce el error de lo publicado a casi cero, y es fácil defenderlo. Con un error, lo congela: la verdad real se rechaza como desinformación, lo publicado se queda en 1,31, la gente cree el error a medias (1,03, cerca del equilibrio de Friedkin y Johnsen) y dos de cada tres publicaciones de los expertos se rechazan. Sin filtro, la misma población, con el mismo azar, encuentra la verdad: es la sabiduría de las multitudes de Galton.

La historia de Semmelweis, Wegener, Marshall y Warren, Shechtman y, en el extremo, Lysenko muestra que los errores de consenso existen y que se corrigen gracias a quienes los contradicen. Mill, Popper y Kuhn explican por qué esa corrección necesita que los disidentes puedan hablar. Asch y Noelle-Neumann explican por qué, sin disidentes visibles, la gente se calla. Y la investigación reciente sobre monocultivo algorítmico, homogeneización de la escritura y colapso de modelos sugiere que una IA que filtra y pule no solo congela el presente sino que empobrece el futuro. Los próximos pasos (autocensura, actualización de la base y los tres posteos) son también los próximos capítulos.

## Referencias

- Asch, S. E. (1956). Studies of independence and conformity: I. A minority of one against a unanimous majority. *Psychological Monographs: General and Applied*, 70(9), 1–70. https://doi.org/10.1037/h0093718
- Bradbury, R. (1953). *Fahrenheit 451*. Ballantine Books.
- Cook, J., Nuccitelli, D., Green, S. A., Richardson, M., Winkler, B., Painting, R., Way, R., Jacobs, P., & Skuce, A. (2013). Quantifying the consensus on anthropogenic global warming in the scientific literature. *Environmental Research Letters*, 8(2), 024024. https://doi.org/10.1088/1748-9326/8/2/024024
- Deffuant, G., Neau, D., Amblard, F., & Weisbuch, G. (2000). Mixing beliefs among interacting agents. *Advances in Complex Systems*, 3(1–4), 87–98. https://doi.org/10.1142/S0219525900000078
- DeGroot, M. H. (1974). Reaching a consensus. *Journal of the American Statistical Association*, 69(345), 118–121. https://doi.org/10.1080/01621459.1974.10480137
- Doshi, A. R., & Hauser, O. P. (2024). Generative AI enhances individual creativity but reduces the collective diversity of novel content. *Science Advances*, 10(28), eadn5290. https://doi.org/10.1126/sciadv.adn5290
- Fang, F. C., Steen, R. G., & Casadevall, A. (2012). Misconduct accounts for the majority of retracted scientific publications. *Proceedings of the National Academy of Sciences*, 109(42), 17028–17033. https://doi.org/10.1073/pnas.1212247109
- Friedkin, N. E., & Johnsen, E. C. (1990). Social influence and opinions. *Journal of Mathematical Sociology*, 15(3–4), 193–206. https://doi.org/10.1080/0022250X.1990.9990069
- Galton, F. (1907). Vox populi. *Nature*, 75, 450–451. https://doi.org/10.1038/075450a0
- Giles, J. (2005). Internet encyclopaedias go head to head. *Nature*, 438, 900–901. https://doi.org/10.1038/438900a
- Gillespie, T. (2018). *Custodians of the Internet: Platforms, Content Moderation, and the Hidden Decisions That Shape Social Media*. Yale University Press. ISBN 978-0-300-17313-0.
- Hegselmann, R., & Krause, U. (2002). Opinion dynamics and bounded confidence: Models, analysis and simulation. *Journal of Artificial Societies and Social Simulation*, 5(3), 2.
- Hong, L., & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. *Proceedings of the National Academy of Sciences*, 101(46), 16385–16389. https://doi.org/10.1073/pnas.0403723101
- Huxley, A. (1932). *Brave New World*. Chatto & Windus.
- Kleinberg, J., & Raghavan, M. (2021). Algorithmic monoculture and social welfare. *Proceedings of the National Academy of Sciences*, 118(22), e2018340118. https://doi.org/10.1073/pnas.2018340118
- Kuhn, T. S. (1962). *The Structure of Scientific Revolutions*. University of Chicago Press.
- Lorenz, J., Rauhut, H., Schweitzer, F., & Helbing, D. (2011). How social influence can undermine the wisdom of crowd effect. *Proceedings of the National Academy of Sciences*, 108(22), 9020–9025. https://doi.org/10.1073/pnas.1008636108
- Medvedev, Z. A. (1969). *The Rise and Fall of T. D. Lysenko*. Columbia University Press.
- Mill, J. S. (1859). *On Liberty*. Londres: John W. Parker and Son.
- Noelle-Neumann, E. (1974). The spiral of silence: A theory of public opinion. *Journal of Communication*, 24(2), 43–51. https://doi.org/10.1111/j.1460-2466.1974.tb00367.x
- Nosek, B. A., Ebersole, C. R., DeHaven, A. C., & Mellor, D. T. (2018). The preregistration revolution. *Proceedings of the National Academy of Sciences*, 115(11), 2600–2606. https://doi.org/10.1073/pnas.1708274114
- Open Science Collaboration. (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251), aac4716. https://doi.org/10.1126/science.aac4716
- Oreskes, N. (2004). The scientific consensus on climate change. *Science*, 306(5702), 1686. https://doi.org/10.1126/science.1103618
- Orwell, G. (1949). *Nineteen Eighty-Four*. Secker & Warburg.
- Padmakumar, V., & He, H. (2024). Does writing with language models reduce content diversity? En *Proceedings of the Twelfth International Conference on Learning Representations (ICLR)*.
- Page, S. E. (2007). *The Difference: How the Power of Diversity Creates Better Groups, Firms, Schools, and Societies*. Princeton University Press. ISBN 978-0-691-12838-2.
- Popper, K. (1945). *The Open Society and Its Enemies*. Routledge.
- Popper, K. (1959). *The Logic of Scientific Discovery*. Hutchinson.
- Postman, N. (1985). *Amusing Ourselves to Death: Public Discourse in the Age of Show Business*. Viking.
- Semmelweis, I. (1861). *Die Ätiologie, der Begriff und die Prophylaxis des Kindbettfiebers*. Pest, Viena y Leipzig: C. A. Hartleben.
- Shechtman, D., Blech, I., Gratias, D., & Cahn, J. W. (1984). Metallic phase with long-range orientational order and no translational symmetry. *Physical Review Letters*, 53(20), 1951–1953. https://doi.org/10.1103/PhysRevLett.53.1951
- Shumailov, I., Shumaylov, Z., Zhao, Y., Papernot, N., Anderson, R., & Gal, Y. (2024). AI models collapse when trained on recursively generated data. *Nature*, 631, 755–759. https://doi.org/10.1038/s41586-024-07566-y
- Vosoughi, S., Roy, D., & Aral, S. (2018). The spread of true and false news online. *Science*, 359(6380), 1146–1151. https://doi.org/10.1126/science.aap9559
- Warren, J. R., & Marshall, B. (1983). Unidentified curved bacilli on gastric epithelium in active chronic gastritis. *The Lancet*, 321(8336), 1273–1275. https://doi.org/10.1016/S0140-6736(83)92719-8
- Wegener, A. (1915). *Die Entstehung der Kontinente und Ozeane*. Braunschweig: Vieweg.
- Zamiatin, Y. (1924). *We* (trad. G. Zilboorg). E. P. Dutton.
