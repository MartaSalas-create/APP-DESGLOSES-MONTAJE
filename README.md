# Desglose de Montaje · del guion a la pantalla

Aplicación web para desglosar guiones antes de empezar a montar: reuniones con dirección, lectura de guion, reunión de workflow de postproducción y entrega de necesidades a la coordinación de postproducción (color/conformado, GFX/VFX, sonido y música).

## Cómo usarla

**En iPad, iPhone o cualquier ordenador:** abre la versión publicada en claude.ai, con la sesión iniciada. Los proyectos se guardan en tu cuenta. Las descargas (.json, .csv, PNG, SVG) piden confirmación. «Imprimir / PDF» descarga un HTML de la pestaña, que se abre y se imprime o guarda como PDF.

**En ordenador, sin conexión:**

1. Abre `index.html` en el navegador (Chrome, Safari, Firefox o Edge). No hace falta instalar nada ni conexión a internet.
2. Pulsa **⬆ Subir guion** (o arrastra el archivo a la ventana).
   Formatos: **PDF** con texto (no escaneado), **Final Draft (.fdx)**, **Fountain**, **Word (.docx)** y **.txt**.
3. La app detecta secuencias (INT./EXT.), localización, día/noche, páginas en octavos, personajes, personajes en off y posibles necesidades de postproducción, buscando palabras clave.

Todo se guarda en el propio navegador. Los guiones **no se envían a ningún servidor**. Para pasar un proyecto a otro ordenador o guardar una copia: *Proyecto ▾ → Guardar copia (.json)*.

Para cargar una **nueva versión del guion**, súbela con el proyecto abierto y elige «Nueva versión». Se conservan las anotaciones de las secuencias que tienen el mismo número.

## ✦ Desglose automático con criterio de montaje

En la versión publicada en claude.ai, la pestaña **✦ Desglose automático** pide a Claude que lea el guion como una montadora con más de 30 años de experiencia y que proponga:
- la lectura de guion;
- las tramas, los personajes y sus arcos;
- el desglose secuencia a secuencia (trama, acción, conflicto, necesidades);
- las notas por departamento;
- el step line: intensidad, actos y puntos de giro.

Se puede elegir qué partes proponer. Todo queda en los campos normales y es editable. **Deshacer** vuelve al estado anterior mientras la página siga abierta. Para repetir solo una secuencia está el botón **✦ Proponer desglose de esta secuencia**, en el detalle (▸) del Desglose de montaje. El análisis usa la cuenta de Claude de quien abre la página.

## Documentos

| Pestaña | Para qué sirve |
|---|---|
| **Proyecto** | Datos de partida: título, versión del guion, páginas, secuencias, duración real, créditos (guion, dirección, montaje), logline. Estadísticas: INT/EXT, día/noche, localizaciones. |
| **Lectura de guion** | 1ª lectura (historia, género, tono, personajes), 2ª lectura (temas, mapa de personajes, estructura, puntos de interés) y análisis avanzado (secuencias sobrantes, problemas estructurales, necesidades de montaje). |
| **Tramas y personajes** | Tramas A, B, C… con su código de color. Los personajes se asignan a tramas, se pueden fusionar u ocultar. |
| **Desglose de montaje** | Una fila por secuencia con trama, personajes, acción, conflicto/objetivo, necesidades, notas de montaje y notas por departamento. También muestra el texto de la secuencia. |
| **Escaleta de script** | Tabla coloreada por tramas en el orden del guion. Se puede exportar a .csv. |
| **Escaleta de montaje** | Fichas por secuencia con el color de su trama. Se pueden reordenar arrastrándolas y quitar secuencias para ver la duración resultante. |
| **Arco de personajes** | Matriz de presencia por secuencia y fichas de evolución de cada personaje (objetivo, inicio → final, secuencias clave). |
| **Step line** | Según la metodología de Marimón: curva de intensidad dramática (los puntos se ajustan arrastrándolos), actos marcados con líneas verticales (Prólogo, Planteamiento, Desarrollo, Convergencia/Clímax, Resolución), puntos de giro en globos con el color de su trama, mapa de tramas y personajes y datos de partida. Se descarga en SVG o PNG. |
| **Necesidades por departamento** | Informe para la coordinación de postproducción: montaje, color/conformado, GFX/VFX, sonido y música. |
| **Reunión workflow** | Acta de la reunión: rodaje, montaje y entregas a cada departamento. |

Cualquier pestaña se puede imprimir o guardar en PDF: *Proyecto ▾ → Imprimir / PDF* (en horizontal).

> **Sobre la curva de intensidad:** los valores son una interpretación editorial a partir de la lectura del guion. No vienen de un análisis objetivo ni de una medición externa. Son un punto de partida para debatir y corregir en clase. El botón «Proponer curva inicial» genera una curva orientativa a partir del paradigma clásico.

## Estructura técnica

- `index.html`: la aplicación.
- `js/parser.js`: lector de guiones (PDF, FDX, Fountain, DOCX, TXT).
- `js/app.js`: interfaz y documentos.
- `js/stepline.js`: gráfico del step line (SVG).
- `vendor/`: [pdf.js](https://mozilla.github.io/pdf.js/) (Apache-2.0) y [mammoth](https://github.com/mwilliamson/mammoth.js) (BSD-2), incluidos para que funcione sin conexión.
