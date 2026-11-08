# Atlas Histórico 3D de Europa — PROJECT.md

**Versión:** 0.2 — Base cartográfica y plantilla común · 6 de noviembre de 2026  
**Estado:** Prototipo local con base cartográfica aprobada y plantilla reutilizable aplicada a la entrada 1.12  
**Fuente histórica organizadora:** *La historia del mundo en mapas* (Susaeta).  
**Alcance inicial:** Europa, con áreas mediterráneas y euroasiáticas cuando sean necesarias para explicar su historia.

## 1. Objetivo

Crear un atlas histórico interactivo en navegador, con una base geográfica tridimensional continua de Europa y capas históricas que permitan estudiar territorios, fronteras, pueblos, rutas, ciudades, conflictos, economía y cultura. El propósito es **didáctico**, no el realismo geográfico ni una simulación de videojuego.

## 2. Principios acordados

- Una **única base cartográfica regional plana de Europa con relieve 3D**, común a todas las épocas. La base representa la geografía actual. El hielo, las costas y los cursos fluviales antiguos se incorporan como capas históricas fechadas cuando estén documentados.
- Relieve reconocible, ligero y estilizado: cordilleras, llanuras, costas y ríos relevantes; altura ligeramente realzada cuando mejore la lectura.
- Vista inicial oblicua; zoom, giro e inclinación; opción de vista casi cenital.
- La cronología muestra **únicamente información incorporada y documentada**. Los intervalos de un mapa no implican datos para cada año.
- No interpolar automáticamente fronteras, rutas o acontecimientos entre fechas sin fundamento documental. Indicar fechas aproximadas e incertidumbre.
- Una misma página del atlas impreso puede aportar **muchos elementos con cronologías distintas**.
- Capas temáticas activables: política, economía, sociedad, cultura, religión, migraciones, conflictos, comercio y otras según los datos disponibles.
- Tarjetas informativas inicialmente minimizadas, expandibles y vinculadas a los elementos seleccionados.
- Mapa protagonista de la pantalla; cronología siempre accesible.
- Incorporación progresiva, mapa a mapa, sin exigir completar el catálogo antes de publicar un prototipo.
- El atlas de Susaeta es la **fuente organizadora principal**. Otras fuentes se incorporarán para completar vacíos o contrastar información; se admitirán reconstrucciones propias justificadas y citadas.
- Evitar reproducir directamente imágenes protegidas del libro en una web pública; elaborar cartografía propia a partir de datos y fuentes con derechos de uso adecuados.

## 3. Base cartográfica y alojamiento

- **MapLibre GL JS 5.15.0** es el motor de la base aprobada. La vista es regional y plana, en proyección Mercator, con relieve tridimensional, vista inicial oblicua y opción cenital.
- Elevaciones reales de [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) en formato Terrarium. Cobertura mundial hasta el nivel 4 y detalle regional europeo hasta el 7. Fuera de la cobertura detallada, el visor reutiliza las alturas de menor resolución y mantiene el mismo estilo.
- Costas vectoriales a escala 1:10 millones y ríos de referencia a 1:50 millones de [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2).
- Estilo aprobado con llanuras en verde, altitudes medias en ocre y cumbres claras. El relieve tiene realce vertical ×3 y el mar conserva el sombreado batimétrico. Las etiquetas geográficas aparecen de forma selectiva según el zoom.
- Arrastrar con el botón izquierdo inclina y gira. Arrastrar con el derecho desplaza. La rueda y los botones ajustan el zoom. El alejamiento está limitado para mantener una escala regional útil.
- El prototipo se encuentra en `prototipo-maplibre/`. El motor, la base y los datos históricos esenciales se sirven desde el mismo sitio. Las teselas de elevación se solicitan según la vista. La fluidez en ordenadores escolares y la transferencia inicial real quedan pendientes de medir.
- Alojamiento previsto como web estática en **GitHub Pages**, en [raisedkob-Universal/3dHistoryMaps](https://github.com/raisedkob-Universal/3dHistoryMaps). El dominio queda pendiente.

## 4. Modelo de datos por entrada histórica

Cada mapa del índice es una **unidad de referencia bibliográfica**, no necesariamente una única capa o instante temporal.

Campos propuestos:

- `id_fuente`: código original del índice (p. ej., `3.06`).
- `titulo_original`, `periodo_inicio`, `periodo_fin`, `precision_temporal`.
- `ambito_geografico`, `tematicas`, `pagina_libro` (pendiente de transcribir/verificar).
- `fuente_bibliografica`, `fuentes_complementarias`, `derechos_uso`.
- `elementos`: territorios, fronteras, rutas, ciudades, lugares, acontecimientos, cada uno con sus fechas y referencias propias.
- `certeza`: documentado, aproximado o interpretación fundamentada.
- `estado`: pendiente, inventariado, digitalizando, revisado, publicado.

**Importante:** las fechas y títulos del catálogo siguiente son una **transcripción de trabajo de la selección previamente elaborada en la conversación**. Deben cotejarse con las páginas originales del índice antes de considerarse definitivos. Los códigos identifican entradas, **no números de página**. Los números de página impresos todavía no se han incorporado.

### Plantilla de datos implementada

Cada entrada histórica aporta su contenido en `prototipo-maplibre/dist/mapas/<código>.json`. El atributo `data-mapa` de `index.html` indica la entrada inicial si la dirección no especifica una. El selector usa `dist/mapas/catalogo.json` y la dirección `?mapa=<código>` permite abrir directamente una entrada disponible. `historia.js` construye la interfaz compartida a partir de `legend`, `chronology`, `guide`, `notes` y `sources`. El título y el código de la entrada también proceden del archivo de datos.

En la cronología, los años a. C. se representan con números negativos y los años d. C. con positivos. El campo `date` conserva la etiqueta que se muestra al alumnado, incluidas aproximaciones e intervalos. Las fechas expresadas como «hace … años» mantienen la expresión de la fuente mientras su normalización esté pendiente.

La entrada 1.12 es la primera aplicación. Tiene 15 categorías de leyenda en cinco grupos, ocho notas explicativas y trece marcas cronológicas (doce hitos y un estado del hielo procedente de la leyenda). Las geometrías históricas siguen pendientes de inventariar, contrastar y dibujar. Véase la [ficha documental de la entrada 1.12](documentacion/1.12-paleolitico-superior-en-europa.md).

## 5. Catálogo maestro inicial: 58 entradas relacionadas con Europa

### 5.1 Antigüedad y mundo clásico — 20 entradas

| Código | Mapa | Período |
|---|---|---|
| 1.12 | Paleolítico Superior en Europa | 35000–5000 a. C. |
| 1.13 | Neolítico en Europa | 5000–2000 a. C. |
| 1.14 | Edad de Bronce en Europa | 2000–500 a. C. |
| 1.15 | Las primeras civilizaciones del Mediterráneo | 2000–1100 a. C. |
| 1.16 | La expansión fenicia y griega en el Mediterráneo | 900–500 a. C. |
| 1.17 | La creación de ciudades-estado griegas | 1100–500 a. C. |
| 1.18 | Etruscos, griegos y cartagineses | 800–480 a. C. |
| 2.01 | Las Guerras Médicas y la Grecia del siglo V | 499–435 a. C. |
| 2.02 | La Guerra del Peloponeso y el auge de Macedonia | 435–336 a. C. |
| 2.03 | Las conquistas de Alejandro Magno | 336–300 a. C. |
| 2.04 | El mundo helenístico | 301–30 a. C. |
| 2.06 | La Roma republicana y las Guerras Púnicas | 509–201 a. C. |
| 2.07 | La expansión del Imperio romano | 201 a. C.–117 d. C. |
| 2.08 | Economía y sociedad del Imperio romano | 27 a. C.–305 d. C. |
| 2.09 | Crisis y recuperación del Imperio romano | 117–376 d. C. |
| 2.10 | La caída del Imperio romano de Occidente | 376–480 d. C. |
| 2.11 | Justiniano y los orígenes del Imperio bizantino | 480–629 d. C. |
| 2.12 | Los celtas | 500 a. C.–600 d. C. |
| 2.13 | Los germanos y los eslavos | 750 a. C.–600 d. C. |
| 2.14 | Los nómadas de la estepa | 900 a. C.–600 d. C. |

### 5.2 Edad Media — 12 entradas

| Código | Mapa | Período |
|---|---|---|
| 3.01 | El auge del Imperio carolingio | 600–814 |
| 3.02 | La Europa de los vikingos | 793–1050 |
| 3.03 | La Europa feudal | 1050–1300 |
| 3.04 | Religión en la Europa medieval | 800–1300 |
| 3.05 | Guerras, revueltas y plagas en la Europa del siglo XIV | 1300–1400 |
| 3.06 | La economía de la Europa medieval | 1000–1500 |
| 3.07 | La Europa del Renacimiento | 1400–1492 |
| 3.08 | Las grandes conquistas árabes | 632–750 |
| 3.09 | El mundo árabe dividido | 750–1037 |
| 3.10 | El Imperio bizantino | 610–1204 |
| 3.11 | Los imperios turcos medievales | 1038–1492 |
| 3.12 | Las Cruzadas | 1096–1291 |

### 5.3 Edad Moderna — 10 entradas

| Código | Mapa | Período |
|---|---|---|
| 4.01 | La Europa de la Reforma | 1492–1560 |
| 4.02 | La Europa de la Contrarreforma | 1560–1600 |
| 4.03 | La apuesta de Suecia por el dominio del Báltico | 1561–1721 |
| 4.04 | Europa en el período de la Guerra de los Treinta Años | 1600–1648 |
| 4.05 | Europa durante el reinado de Luis XIV | 1648–1715 |
| 4.06 | Desarrollo económico europeo | 1492–1783 |
| 4.07 | La expansión de Rusia | 1492–1783 |
| 4.08 | Europa en el Antiguo Régimen | 1715–1783 |
| 4.09 | El auge del Imperio otomano | 1492–1640 |
| 4.10 | El declive del Imperio otomano | 1640–1783 |

### 5.4 Siglo XIX — 8 entradas

| Código | Mapa | Período |
|---|---|---|
| 5.01 | Europa en la era de la revolución | 1783–1800 |
| 5.02 | La Europa napoleónica | 1800–1815 |
| 5.03 | Aumento de los nacionalismos en Europa | 1815–1871 |
| 5.04 | La Revolución Industrial en Europa | 1783–1914 |
| 5.05 | La unificación de Alemania | 1848–1871 |
| 5.06 | El Imperio ruso | 1783–1917 |
| 5.07 | El sistema de alianzas europeas | 1871–1914 |
| 5.08 | El declive del poder otomano | 1783–1923 |

### 5.5 Siglos XX y XXI — 8 entradas

| Código | Mapa | Período |
|---|---|---|
| 6.01 | Primera Guerra Mundial | 1914–1918 |
| 6.02 | Europa en el período de entreguerras | 1918–1939 |
| 6.03 | Segunda Guerra Mundial en Europa | 1939–1942 |
| 6.04 | Segunda Guerra Mundial en Europa | 1942–1945 |
| 6.05 | Europa dividida | 1945–1989 |
| 6.06 | Europa después de la Guerra Fría | 1989–siglo XXI |
| 6.10 | La creación de la Unión Soviética | 1917–1941 |
| 6.11 | El declive de la Unión Soviética y de Rusia | 1941–siglo XXI |

**Recuento:** Antigüedad 20 + Edad Media 12 + Edad Moderna 10 + Siglo XIX 8 + Siglos XX–XXI 8 = **58 entradas**.

## 6. Integración de fuentes y cobertura de vacíos

1. Analizar una página o doble página del libro principal.
2. Identificar y registrar **todos** los elementos cartográficos y sus fechas, no solo el tema general.
3. Separar datos documentados de interpretaciones y zonas de incertidumbre.
4. Detectar cambios históricos importantes no cubiertos por las entradas existentes.
5. Buscar fuentes fiables complementarias o crear reconstrucciones propias contrastadas cuando sea necesario.
6. Añadir la nueva información a la cronología común, sin inventar estados intermedios.
7. Revisar exactitud histórica, legibilidad didáctica y derechos de uso antes de publicar.

## 7. Diseño fijo de la plantilla

- **Selector Mapas junto al título.** Catálogo por épocas, búsqueda por título o código y estado de disponibilidad. La selección carga el contenido histórico en la misma base geográfica.
- **Mapa protagonista.** Encabezado con el código y título de la entrada. Perspectiva, Cenital y zoom arriba a la derecha.
- **Leyenda plegable a la izquierda.** Inventario informativo con símbolos diferenciados, nombres breves y grupos desplegables. Cuando haya geometrías documentadas, las capas se podrán activar de forma independiente.
- **Claves del mapa a la derecha.** Tarjeta plegable con explicaciones didácticas y acciones para localizar lugares, mostrar capas y comparar estados. El apartado «Más sobre los lugares» reúne las notas numeradas complementarias.
- **Cronología plegable abajo.** Eje de fechas compartido y tarjetas ordenadas por fecha en franjas alineadas. En 1.12 las franjas son Cultura y Cambios físicos. En pantallas pequeñas se conservan ambas filas y el eje y las tarjetas se desplazan juntos en horizontal. La separación entre columnas es uniforme para facilitar la lectura.
- **Ficha breve al pulsar un hito.** Muestra fecha y explicación. Si hay un símbolo de leyenda asociado, lo resalta. Cuando exista geometría documentada, la ficha podrá señalar el lugar o activar el estado fechado que corresponda.
- **Bibliografía en ⓘ**, abajo a la derecha. Las referencias completas de la entrada se concentran en ese apartado.
- El diseño se comparte entre entradas. Cada mapa aporta sus símbolos, franjas, textos, fuentes y geometrías mediante sus datos.

## 8. Fases de trabajo

**Fase 0 — Documentación.** Recuperado el catálogo maestro de 58 entradas y confirmado el acceso al libro mediante el visor de préstamo. Pendiente cotejar títulos, períodos y páginas impresas con el original.

**Fase 1 — Prototipo.** Base de MapLibre y diseño común aprobados. Plantilla local aplicada a la entrada 1.12 con cronología, leyenda, hitos y bibliografía. Pendiente completar su reconstrucción cartográfica.

**Fase 2 — Motor de datos históricos.** Incorporar geometrías vectoriales documentadas, selección contextual, visibilidad de capas y fechas por elemento. Mantener una sola base geográfica.

**Fase 3 — Digitalización progresiva.** Incorporar las demás entradas del catálogo a la plantilla, con fuentes y verificación histórica.

**Fase 4 — Ampliación.** Fuentes adicionales, mapas intermedios, mejoras visuales y eventuales reconstrucciones 3D puntuales.

## 9. Trabajo pendiente

- Completar el inventario del mapa 1.12 a partir de su vista completa. Contrastar yacimientos, áreas culturales, hielo, bosques, migración e hidrografía histórica antes de trazar sus geometrías.
- Cotejar los títulos, períodos y números de página impresos de las 58 entradas. Mantener separado el número de página del libro de la posición en el visor digital.
- Activar nuevas entradas en el catálogo a medida que dispongan de contenido para el visor.
- Medir la carga y fluidez en ordenadores escolares. Decidir si hace falta optimizar los contornos que se descargan al inicio.
- Acordar el dominio y la publicación cuando el prototipo esté listo.

## 10. Criterio de mantenimiento

Este archivo es el documento rector. Cada cambio de alcance o arquitectura debe reflejarse aquí. El catálogo podrá ampliarse, pero los identificadores originales de Susaeta deben conservarse para mantener la trazabilidad bibliográfica. La comprobación de GitHub Pages y del dominio público corresponde al propietario del proyecto; el desarrollo no debe efectuar verificaciones públicas repetitivas por su cuenta.

## 11. Tarjetas geográficas de poblaciones

La plantilla admite una sola opción de leyenda para activar una colección de tarjetas de poblaciones, sin añadir un panel general ni entradas en la cronología. Se integra en Poblaciones y desplazamientos y en los controles Mostrar todo y Ocultar capas. Al cambiar de mapa se retiran las tarjetas y sus fichas.

Cada tarjeta ofrece nombre comprensible, fecha y explicación, con detalle genético expandible y fuentes trazables. Los marcadores se agrupan cuando sus tarjetas se solapan en pantalla. Los lugares son referencias documentadas y las zonas de ocupación solo se incorporarán con respaldo cartográfico específico.

La entrada 1.12 añade una comparación complementaria de 9000–7000 a. C., diferenciada del final de 8000 a. C. del mapa principal. La selección inicial comprende Huseby Klev y dos muestras de Grotta Continenza. La cobertura genética europea queda abierta a ampliación con nuevas evidencias contrastadas.

### Continuación acordada de las poblaciones

La selección comprende ahora tres casos, con Cheddar Man como ejemplo del oeste de Europa. La incorporación de agricultura y comunidades anatolias queda pendiente del mapa complementario que aportará el propietario. Recordar este asunto al recibirlo.
