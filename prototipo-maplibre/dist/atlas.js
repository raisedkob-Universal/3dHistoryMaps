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

function groupPopulationCards(cards, project) {
  const groups = [];
  for (const card of cards) {
    const point = project(card.coordinates);
    const group = { cards: [card], left: point.x - 88, right: point.x + 88, top: point.y - 40, bottom: point.y + 40 };
    for (let i = 0; i < groups.length; i++) {
      const other = groups[i];
      if (group.left > other.right || group.right < other.left || group.top > other.bottom || group.bottom < other.top) continue;
      group.cards.push(...other.cards);
      group.left = Math.min(group.left, other.left);
      group.right = Math.max(group.right, other.right);
      group.top = Math.min(group.top, other.top);
      group.bottom = Math.max(group.bottom, other.bottom);
      groups.splice(i, 1);
      i = -1;
    }
    groups.push(group);
  }
  return groups;
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
        recorridoAnimado: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        culturasHistoricas: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
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
          id: 'culturas-historicas', type: 'fill', source: 'culturasHistoricas', filter: ['==', ['geometry-type'], 'Polygon'],
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['coalesce', ['get', 'opacity'], 0.34], 'fill-outline-color': ['coalesce', ['get', 'outline'], ['get', 'color']] }
        },
        {
          id: 'halo-movilidad', type: 'line', source: 'culturasHistoricas',
          filter: ['all', ['==', ['geometry-type'], 'LineString'], ['has', 'width']],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#fff4db', 'line-width': 11, 'line-opacity': 0.85, 'line-dasharray': [2, 1] }
        },
        {
          id: 'limites-historicos', type: 'line', source: 'culturasHistoricas', filter: ['==', ['geometry-type'], 'LineString'],
          paint: { 'line-color': ['get', 'color'], 'line-width': ['coalesce', ['get', 'width'], 3], 'line-dasharray': [2, 1] }
        },
        {
          id: 'rios', type: 'line', source: 'rios',
          paint: { 'line-color': '#47768b', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 8, 1.5] }
        }
      ]
    }
  });
  let activeCultureAreas = [];
  let animationFrame;

  function showTravellers(features) {
    map.getSource('recorridoAnimado')?.setData({ type: 'FeatureCollection', features });
  }

  function stopRouteAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    showTravellers([]);
  }

  function animateRoutes() {
    stopRouteAnimation();
    const routes = activeCultureAreas.filter(feature =>
      feature.geometry.type === 'LineString' && feature.properties.width
    ).map(feature => {
      const points = feature.geometry.coordinates;
      const distances = [0];
      for (let i = 1; i < points.length; i++) {
        const [a, b] = points[i - 1];
        const [x, y] = points[i];
        distances.push(distances.at(-1) + Math.hypot((x - a) * Math.cos((y + b) * Math.PI / 360), y - b));
      }
      return { points, distances, color: feature.properties.color };
    });
    if (!mapReady || routes.length === 0) return;
    const start = performance.now();
    let lastDraw = -Infinity;
    function tick(now) {
      const progress = Math.min(1, (now - start) / 5200);
      if (now - lastDraw >= 40 || progress === 1) {
        showTravellers(routes.map(({ points, distances, color }) => {
          const distance = distances.at(-1) * progress;
          const index = distances.findIndex((value, i) => i > 0 && value >= distance);
          const [a, b] = points[index - 1];
          const [x, y] = points[index];
          const fraction = (distance - distances[index - 1]) / (distances[index] - distances[index - 1]);
          return { type: 'Feature', properties: { color }, geometry: {
            type: 'Point', coordinates: [a + (x - a) * fraction, b + (y - b) * fraction]
          } };
        }));
        lastDraw = now;
      }
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else animationFrame = requestAnimationFrame(stopRouteAnimation);
    }
    animationFrame = requestAnimationFrame(tick);
  }

  let activeRaster;
  let renderedRaster;
  let mapReady = false;
  function updateHistoricalRaster() {
    if (!mapReady || activeRaster === renderedRaster) return;
    if (map.getLayer('vegetacion-historica')) {
      map.removeLayer('vegetacion-historica');
      map.removeSource('vegetacionHistorica');
    }
    if (activeRaster) {
      map.addSource('vegetacionHistorica', { type: 'image', ...activeRaster });
      map.addLayer({
        id: 'vegetacion-historica', type: 'raster', source: 'vegetacionHistorica',
        paint: { 'raster-fade-duration': 0 }
      }, 'rios');
    }
    renderedRaster = activeRaster;
  }
  function updateCultureAreas() {
    map.getSource('culturasHistoricas')?.setData({
      type: 'FeatureCollection', features: activeCultureAreas
    });
  }
  let populationCards = [];
  let populationMarkers = [];
  let populationPopup;

  function openPopulationCards(cards, coordinates) {
    populationPopup?.remove();
    const content = document.createElement('section');
    content.className = 'poblacion-detalle';
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-label', 'Poblaciones hacia 9000–7000 a. C.');
    const interval = document.createElement('p');
    interval.className = 'poblacion-intervalo';
    interval.textContent = 'Poblaciones hacia 9000–7000 a. C. · comparación complementaria';
    content.append(interval);
    for (const card of cards) {
      const article = document.createElement('details');
      article.open = cards.length === 1;
      const heading = document.createElement('summary');
      heading.textContent = card.title + ' · ' + card.subtitle;
      const date = document.createElement('p');
      date.className = 'poblacion-fecha';
      date.textContent = card.date;
      const text = document.createElement('p');
      text.textContent = card.text;
      const evidence = document.createElement('p');
      evidence.textContent = card.evidence;
      const samples = document.createElement('ul');
      for (const sample of card.samples) {
        const item = document.createElement('li');
        item.textContent = sample.id + ' · ' + sample.date;
        samples.append(item);
      }
      const genetics = document.createElement('details');
      const geneticsTitle = document.createElement('summary');
      geneticsTitle.textContent = '¿Qué nos cuenta el ADN?';
      const geneticsText = document.createElement('p');
      geneticsText.textContent = card.genetics;
      genetics.append(geneticsTitle, geneticsText);
      const reference = document.createElement('p');
      const source = document.createElement('a');
      source.href = card.sourceUrl;
      source.target = '_blank';
      source.rel = 'noopener';
      source.textContent = card.sourceLabel;
      reference.append(source);
      if (card.sampleSourceUrl) {
        const sampleSource = document.createElement('a');
        sampleSource.href = card.sampleSourceUrl;
        sampleSource.target = '_blank';
        sampleSource.rel = 'noopener';
        sampleSource.textContent = 'Tabla de las muestras';
        reference.append(document.createTextNode(' · '), sampleSource);
      }
      article.append(heading, date, text, evidence, samples, genetics, reference);
      content.append(article);
    }
    const anchor = map.project(coordinates).x < mapElement.clientWidth / 2 ? 'left' : 'right';
    populationPopup = new maplibregl.Popup({ anchor, offset: 18, maxWidth: 'min(310px, calc(100vw - 36px))', className: 'poblacion-popup' })
      .setLngLat(coordinates).setDOMContent(content).addTo(map);
  }

  function updatePopulationCards() {
    for (const marker of populationMarkers) marker.remove();
    populationMarkers = groupPopulationCards(populationCards, coordinates => map.project(coordinates)).map(group => {
      const cards = group.cards;
      const coordinates = [0, 1].map(axis => cards.reduce((sum, card) => sum + card.coordinates[axis], 0) / cards.length);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'poblacion-tarjeta';
      button.setAttribute('aria-haspopup', 'dialog');
      const name = document.createElement('strong');
      name.textContent = cards.length === 1 ? cards[0].title : cards.length + ' poblaciones';
      const date = document.createElement('span');
      date.textContent = cards.length === 1 ? cards[0].date : '9000–7000 a. C. · abrir grupo';
      button.append(name, date);
      button.onclick = event => {
        event.stopPropagation();
        openPopulationCards(cards, coordinates);
      };
      return new maplibregl.Marker({ element: button }).setLngLat(coordinates).addTo(map);
    });
  }

  function setPopulationCards(cards) {
    if (cards.length === populationCards.length && cards.every((card, i) => card === populationCards[i])) return;
    populationPopup?.remove();
    populationCards = cards;
    updatePopulationCards();
  }
  map.on('moveend', updatePopulationCards);
  map.on('resize', updatePopulationCards);

  mapElement.addEventListener('atlas:culturas', event => {
    activeCultureAreas = event.detail.areas;
    activeRaster = event.detail.raster;
    setPopulationCards(event.detail.populationCards ?? []);
    updateHistoricalRaster();
    updateCultureAreas();
    animateRoutes();
  });
  let markers = [];
  let placePopup;
  function openPlace(place) {
    placePopup?.remove();
    mapElement.onatlasplace?.();
    const content = document.createElement('article');
    content.className = 'ficha-lugar';
    const heading = document.createElement('h2');
    heading.textContent = place.title;
    content.append(heading);
    if (place.date) {
      const date = document.createElement('small');
      date.className = 'lugar-fecha';
      date.textContent = place.date;
      content.append(date);
    }
    if (place.complementary) {
      const tag = document.createElement('small');
      tag.className = 'lugar-complementario';
      tag.textContent = 'Punto complementario';
      content.append(tag);
    }
    if (place.photo) {
      const figure = document.createElement('figure');
      const image = document.createElement('img');
      image.src = place.photo.src;
      image.alt = place.photo.alt;
      image.width = place.photo.width;
      image.height = place.photo.height;
      image.decoding = 'async';
      const caption = document.createElement('figcaption');
      caption.textContent = place.photo.caption + ' · ';
      const credit = document.createElement('a');
      credit.href = place.photo.source;
      credit.target = '_blank';
      credit.rel = 'noopener';
      credit.textContent = place.photo.credit;
      const license = document.createElement('a');
      license.href = place.photo.licenseUrl;
      license.target = '_blank';
      license.rel = 'noopener';
      license.textContent = place.photo.license;
      caption.append(credit, document.createTextNode(' · '), license);
      figure.append(image, caption);
      content.append(figure);
    }
    const text = document.createElement('p');
    text.textContent = place.text;
    content.append(text);
    const anchor = map.project(place.coordinates).x < mapElement.clientWidth / 2 ? 'left' : 'right';
    placePopup = new maplibregl.Popup({ anchor, offset: 14, maxWidth: 'min(245px, 44vw)', className: 'ficha-lugar-popup' })
      .setLngLat(place.coordinates).setDOMContent(content).addTo(map);
  }
  mapElement.addEventListener('atlas:lugares', event => {
    placePopup?.remove();
    for (const marker of markers) marker.remove();
    markers = event.detail.map(place => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lugar-historico lugar-' + place.kind;
      button.title = place.title;
      button.setAttribute('aria-label', place.title);
      button.textContent = { arte: '✋︎', cueva: '◆', venus: '♟', estructura: '▲', asentamiento: '⌂', concha: '◒', cementerio: '✦', neandertal: '⬟', grabados: '≋', 'cueva-grabados': '◇', plaquetas: '▤' }[place.kind] ?? '●';
      button.onclick = event => {
        event.stopPropagation();
        openPlace(place);
      };
      return new maplibregl.Marker({ element: button }).setLngLat(place.coordinates).addTo(map);
    });
  });
  mapElement.addEventListener('atlas:enfocar', event => {
    placePopup?.remove();
    map.easeTo({ center: event.detail.coordinates, zoom: event.detail.zoom ?? Math.max(6.2, map.getZoom()) });
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
    for (const [name, color] of [['flecha-neandertal', '#d45016'], ['flecha-sapiens', '#7135b5']]) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(57, 52);
      ctx.lineTo(32, 43);
      ctx.lineTo(7, 52);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff4db';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.stroke();
      map.addImage(name, ctx.getImageData(0, 0, 64, 64), { pixelRatio: 2 });
    }
    map.addLayer({
      id: 'viajeros', type: 'circle', source: 'recorridoAnimado',
      paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'],
        'circle-stroke-color': '#fff4db', 'circle-stroke-width': 3 }
    });
    map.addLayer({
      id: 'flechas-movilidad', type: 'symbol', source: 'culturasHistoricas',
      filter: ['==', ['geometry-type'], 'Point'],
      layout: {
        'icon-image': ['get', 'icon'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.66, 6, 0.95],
        'icon-rotate': ['get', 'bearing'], 'icon-rotation-alignment': 'map',
        'icon-pitch-alignment': 'viewport', 'icon-allow-overlap': false, 'icon-padding': 3
      }
    });
    mapReady = true;
    updateHistoricalRaster();
    updateCultureAreas();
    animateRoutes();
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
