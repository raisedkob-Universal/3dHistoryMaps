# Prueba local de MapLibre GL JS

Desde esta carpeta, ejecuta `node preview.mjs` y abre la dirección local que imprime. El motor, el terreno, la costa, los ríos y las capas de prueba se sirven desde esa dirección. Si faltan archivos de datos, `node preparar.mjs` repone los que falten.

## Controles

- Perspectiva y Cenital junto al zoom.

- Arrastre izquierdo para inclinar y girar. Arrastre derecho para desplazar. Rueda para acercar o alejar.

## Datos de la prueba

- [MapLibre GL JS 5.15.0](https://github.com/maplibre/maplibre-gl-js/tree/v5.15.0).
- [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2), tierra a 1:10 millones y ríos a 1:50 millones.
- [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), alturas Terrarium globales hasta el nivel 4 y regionales hasta el 7. [Atribución y licencias de las fuentes de altitud](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- La exageración vertical ×3 y el sombreado son decisiones de visualización. El zoom por encima del detalle disponible reutiliza las alturas de las teselas de menor resolución.

- El color terrestre varía con la elevación. El mar conserva el sombreado batimétrico de las teselas originales.

## Plantilla de mapas históricos

Cada entrada usa la misma interfaz. Sus datos se guardan en `dist/mapas/<código>.json`. El atributo `data-mapa` del cuerpo de `index.html` indica qué entrada se carga al abrir el visor. La entrada 1.12 sirve como ejemplo.

Los campos `legend`, `chronology`, `notes` y `sources` alimentan las cuatro secciones comunes. En la cronología, los años a. C. se guardan como números negativos y los d. C. como positivos. `date` conserva el texto visible, incluidas aproximaciones e intervalos.
