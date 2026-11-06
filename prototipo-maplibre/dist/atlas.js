/* global maplibregl */
'use strict';

const status = document.querySelector('#estado');
const mapElement = document.querySelector('#mapa');
const overviewZoom = mapElement.clientWidth < 850 ? 2.95 : 3.45;
const overview = { center: [14, 52], zoom: overviewZoom, pitch: 46, bearing: 0 };
const altitudeDirectory = new URL('./datos/altitud/', document.baseURI);
const globalDetail = 4;
const regionalBounds = [-34, 25, 62, 77];

function regionalTile(z, x, y) {
  const [west, south, east, north] = regionalBounds;
  const width = 2 ** z;
  const tileX = lon => Math.floor((lon + 180) / 360 * width);
  const tileY = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) * width / 2);
  return x >= tileX(west) && x <= tileX(east) && y >= tileY(north) && y <= tileY(south);
}

async function elevationTile(request, controller) {
  const [z, x, y] = request.url.slice('atlasdem://'.length).split('/').map(Number);
  const lowerDetail = z > globalDetail && !regionalTile(z, x, y);
  const sourceZoom = lowerDetail ? globalDetail : z;
  const scale = 2 ** (z - sourceZoom);
  const col = Math.floor(x / scale);
  const row = Math.floor(y / scale);
  const url = new URL(sourceZoom + '/' + col + '/' + row + '.png?v=global', altitudeDirectory);
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) throw new Error('Tesela de elevación no disponible: ' + url.pathname);
  if (!lowerDetail) return { data: await response.arrayBuffer() };

  const size = 256;
  const cut = size / scale;
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  // Terrarium encodes metres across RGB channels. Preserve exact source pixels.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, (x % scale) * cut, (y % scale) * cut, cut, cut, 0, 0, size, size);
  bitmap.close();
  const image = await canvas.convertToBlob({ type: 'image/png' });
  return { data: await image.arrayBuffer() };
}

const dem = {
  type: 'raster-dem',
  tiles: ['atlasdem://{z}/{x}/{y}'],
  tileSize: 256,
  maxzoom: 7,
  encoding: 'terrarium',
  attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Elevación: Mapzen / fuentes</a>'
};
const seaColor = '#2e5262';

function addLabels(map) {
  const places = [
    ['Atlántico', -15, 48, 'mar', 2.5, 5.5],
    ['Mar del Norte', 3, 57, 'mar', 2.8, 6.5],
    ['Mediterráneo', 15, 35.8, 'mar', 2.5, 6],
    ['Mar Negro', 34, 43.2, 'mar', 3, 7],
    ['Alpes', 10, 46.6, 'relieve', 2.9, 8],
    ['Pirineos', 0.7, 42.7, 'relieve', 4, 8],
    ['Cárpatos', 24, 47.7, 'relieve', 4, 8]
  ];
  const labels = places.map(([name, lon, lat, kind, min, max]) => {
    const element = document.createElement('span');
    element.className = 'etiqueta etiqueta-' + kind;
    element.textContent = name;
    new maplibregl.Marker({ element }).setLngLat([lon, lat]).addTo(map);
    return { element, min, max };
  });
  function updateLabels() {
    const zoom = map.getZoom();
    for (const { element, min, max } of labels) element.hidden = zoom < min || zoom > max;
  }
  map.on('zoom', updateLabels);
  updateLabels();
}

function init() {
  maplibregl.addProtocol('atlasdem', elevationTile);
  const map = new maplibregl.Map({
    container: mapElement,
    attributionControl: {
      compact: true,
      customAttribution: '<a href="#bibliografia" data-bibliografia>Bibliografía</a>'
    },
    ...overview,
    minZoom: overviewZoom - 0.25,
    maxZoom: 9,
    maxPitch: 72,
    renderWorldCopies: false,
    dragPan: false,
    dragRotate: false,
    style: {
      version: 8,
      projection: { type: 'mercator' },
      sources: {
        elevacion: dem,
        sombreado: { ...dem },
        tierra: {
          type: 'geojson', data: './datos/tierra.geojson', tolerance: 0.15,
          attribution: '<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>'
        },
        rios: { type: 'geojson', data: './datos/rios.geojson' }
      },
      terrain: { source: 'elevacion', exaggeration: 3 },
      layers: [
        { id: 'mar', type: 'background', paint: { 'background-color': seaColor } },
        { id: 'tierra', type: 'fill', source: 'tierra', paint: { 'fill-color': '#bac59a' } },
        {
          id: 'altitudes', type: 'color-relief', source: 'sombreado',
          paint: {
            'color-relief-color': [
              'interpolate', ['linear'], ['elevation'],
              0, 'rgba(0,0,0,0)',
              30, '#a9bd90',
              250, '#bac495',
              650, '#d5c69a',
              1300, '#c5a77d',
              2300, '#b69272',
              3100, '#dfcdb1',
              4300, '#fbf5e8'
            ]
          }
        },
        {
          id: 'relieve', type: 'hillshade', source: 'sombreado',
          paint: {
            'hillshade-exaggeration': 0.6, 'hillshade-illumination-anchor': 'map',
            'hillshade-illumination-direction': 315, 'hillshade-shadow-color': '#4d4940',
            'hillshade-highlight-color': '#fff4cf', 'hillshade-accent-color': '#797966'
          }
        },
        {
          id: 'rios', type: 'line', source: 'rios',
          paint: { 'line-color': '#47768b', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 8, 1.5] }
        }
      ]
    }
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

  const canvas = map.getCanvas();
  let drag;
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || ![0, 2].includes(event.button)) return;
    map.stop();
    drag = { button: event.button, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (drag.button === 0) {
      map.jumpTo({
        pitch: Math.max(0, Math.min(72, map.getPitch() - dy * 0.35)),
        bearing: map.getBearing() - dx * 0.35
      });
    } else {
      map.panBy([-dx, -dy], { duration: 0 });
    }
  });
  function releaseDrag() {
    drag = undefined;
  }
  canvas.addEventListener('pointerup', releaseDrag);
  canvas.addEventListener('pointercancel', releaseDrag);

  map.on('error', event => {
    console.error(event.error);
    if (!status.hidden) status.textContent = 'Error al cargar un recurso local del mapa.';
  });
  map.once('load', () => {
    const perspective = document.querySelector('#perspectiva');
    const topDown = document.querySelector('#cenital');
    perspective.onclick = () => map.easeTo(overview);
    topDown.onclick = () => map.easeTo({ pitch: 0, bearing: 0 });
    function updateView() {
      const isTopDown = map.getPitch() < 1;
      perspective.setAttribute('aria-pressed', String(!isTopDown));
      topDown.setAttribute('aria-pressed', String(isTopDown));
    }
    map.on('pitchend', updateView);
    perspective.disabled = false;
    topDown.disabled = false;
    addLabels(map);
    status.hidden = true;
  });
}

try {
  init();
} catch (error) {
  status.textContent = 'No se pudo iniciar MapLibre. ' + error.message;
  console.error(error);
}
