'use strict';

function renderHistory({ id, title, legendStatus, legend, chronology, notesIntro, notes, sources, places = [], cultures = [], environments = [], guide = [] }) {
  for (const selector of ['#simbolos', '#franjas', '#bandas-culturales', '#notas-mapa', '#claves-mapa', '#fuentes-mapa']) {
    document.querySelector(selector).replaceChildren();
  }
  document.querySelector('#ficha').hidden = true;
  document.querySelector('#leyenda').open = false;
  document.querySelector('.cronologia').open = false;
  document.querySelector('.hitos-mapa').open = false;
  document.querySelector('#lecturas-mapa').open = false;
  document.querySelector('#nombre-mapa').textContent = id + ' · ' + title;
  document.querySelector('#introduccion-hitos').textContent = notesIntro ?? '';
  const mapNode = document.querySelector('#mapa');
  function showCultureAreas(areas = [], raster, populationCards = []) {
    mapNode.dispatchEvent(new CustomEvent('atlas:culturas', { detail: { areas, raster, populationCards } }));
  }
  showCultureAreas();
  const placeById = new Map(places.map(place => [place.id, place]));
  function focusPlace(place) {
    mapNode.dispatchEvent(new CustomEvent('atlas:enfocar', { detail: place }));
  }
  const guideList = document.querySelector('#claves-mapa');
  for (const key of guide) {
    const item = document.createElement('article');
    item.className = 'clave-mapa';
    const heading = document.createElement('h3');
    heading.textContent = key.title;
    const description = document.createElement('p');
    description.textContent = key.text;
    const actions = document.createElement('div');
    actions.className = 'clave-acciones';
    for (const action of key.actions) {
      const place = placeById.get(action.placeId);
      const state = environments.find(entry => entry.id === action.environmentId);
      const culture = cultures.find(entry => entry.title === action.cultureTitle);
      if (!place && !state && !culture) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.onclick = () => {
        if (place) {
          mapNode.onatlasplace?.();
          document.querySelector('.hitos-mapa').open = false;
          focusPlace(place);
        } else if (state) {
          showEntry(button, { ...state, title: state.heading ?? 'Extensión del hielo' });
        } else {
          showEntry(button, { ...culture, date: 'zonas orientativas' });
        }
      };
      if (!place) button.setAttribute('aria-pressed', 'false');
      actions.append(button);
    }
    item.append(heading);
    if (key.illustration) {
      const figure = document.createElement('figure');
      figure.className = 'clave-ilustracion';
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.src = key.illustration.src;
      image.alt = key.illustration.alt;
      image.width = key.illustration.width;
      image.height = key.illustration.height;
      const caption = document.createElement('figcaption');
      caption.textContent = key.illustration.caption;
      figure.append(image, caption);
      item.append(figure);
    }
    item.append(description, actions);
    guideList.append(item);
  }

  const notesList = document.querySelector('#notas-mapa');
  for (const { heading, body, placeIds = [] } of notes) {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = heading;
    item.append(name, document.createTextNode(' ' + body));
    for (const placeId of placeIds) {
      const place = placeById.get(placeId);
      if (!place) continue;
      const locate = document.createElement('button');
      locate.type = 'button';
      locate.className = 'ver-lugar';
      locate.textContent = placeIds.length === 1 ? 'Ver en el mapa' : 'Ver ' + place.title;
      locate.onclick = () => {
        notesList.closest('.hitos-mapa').open = false;
        focusPlace(place);
      };
      item.append(locate);
    }
    notesList.append(item);
  }
  const sourcesList = document.querySelector('#fuentes-mapa');
  for (const source of sources) {
    const reference = document.createElement('p');
    const cite = document.createElement('cite');
    cite.textContent = source.title;
    reference.append(cite);
    if (source.edition) reference.append(document.createTextNode('. ' + source.edition));
    const scope = document.createElement('p');
    scope.textContent = source.reference;
    sourcesList.append(reference, scope);
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.linkLabel ?? 'Consultar la fuente';
      const line = document.createElement('p');
      line.append(link);
      sourcesList.append(line);
    }
  }

  const panel = document.querySelector('#leyenda');
  const symbols = document.querySelector('#simbolos');
  const tracks = document.querySelector('#franjas');
  const card = document.querySelector('#ficha');
  const close = document.querySelector('#cerrar-ficha');
  let activeMark;
  let highlightedSymbol;
  const selectedLayers = new Set();
  const layerButtons = [];
  const layers = environments.filter(entry => entry.areas?.length || entry.raster || entry.populationCards?.length);
  function renderLayers() {
    const selected = [...selectedLayers];
    showCultureAreas(selected.flatMap(entry => entry.areas ?? []), selected.find(entry => entry.raster)?.raster, selected.flatMap(entry => entry.populationCards ?? []));
    for (const { button, entry } of layerButtons) {
      button.setAttribute('aria-pressed', String(selectedLayers.has(entry)));
    }
    allLayers.setAttribute('aria-pressed', String(layers.length > 0 && selectedLayers.size === layers.length));
    comparison.hidden = selectedLayers.size < 2;
  }
  function clearLayers() {
    selectedLayers.clear();
    renderLayers();
  }
  const controls = document.createElement('div');
  controls.className = 'leyenda-acciones';
  const allLayers = document.createElement('button');
  allLayers.type = 'button';
  allLayers.textContent = 'Mostrar todo';
  allLayers.disabled = layers.length === 0;
  allLayers.setAttribute('aria-pressed', 'false');
  allLayers.onclick = () => {
    layers.forEach(entry => selectedLayers.add(entry));
    activeMark?.setAttribute('aria-pressed', 'false');
    card.hidden = true;
    renderLayers();
  };
  const hideLayers = document.createElement('button');
  hideLayers.type = 'button';
  hideLayers.textContent = 'Ocultar capas';
  hideLayers.onclick = () => {
    clearLayers();
    activeMark?.setAttribute('aria-pressed', 'false');
    card.hidden = true;
  };
  const comparison = document.createElement('p');
  comparison.className = 'leyenda-nota';
  comparison.setAttribute('role', 'status');
  comparison.textContent = 'Comparación de épocas distintas. Las capas superpuestas no representan un único momento.';
  comparison.hidden = true;
  controls.append(allLayers, hideLayers);
  symbols.append(controls, comparison);
  function addLayerButton(options, entry, title) {
    const option = document.createElement('button');
    option.type = 'button';
    option.style.setProperty('--tono-hielo', entry.color);
    option.textContent = title;
    option.setAttribute('aria-pressed', 'false');
    if (!entry.areas?.length && !entry.raster && !entry.populationCards?.length) {
      option.textContent += ' · explicación';
      option.onclick = () => showEntry(option, { ...entry, title: entry.heading ?? entry.title });
      options.append(option);
      return;
    }
    option.onclick = () => {
      if (selectedLayers.has(entry)) selectedLayers.delete(entry);
      else selectedLayers.add(entry);
      activeMark?.setAttribute('aria-pressed', 'false');
      renderLayers();
      card.hidden = !selectedLayers.has(entry);
      if (!card.hidden) {
        if (entry.focusCoordinates) focusPlace({ coordinates: entry.focusCoordinates });
        document.querySelector('#titulo-ficha').textContent = (entry.heading ?? entry.title) + ' · ' + (entry.date ?? 'zonas orientativas');
        document.querySelector('#texto-ficha').textContent = entry.text;
        document.querySelector('#enlace-ficha').textContent = '';
      }
    };
    layerButtons.push({ button: option, entry });
    options.append(option);
  }
  mapNode.dispatchEvent(new CustomEvent('atlas:lugares', { detail: places }));
  mapNode.onatlasplace = () => {
    clearLayers();
    activeMark?.setAttribute('aria-pressed', 'false');
    activeMark = undefined;
    highlightedSymbol?.classList.remove('simbolo-activo');
    card.hidden = true;
  };

  const glyphs = { cueva: '◆', arte: '✋︎', estructura: '▲', venus: '♟', asentamiento: '⌂', concha: '◒', cementerio: '✦', neandertal: '⬟', grabados: '≋', plaquetas: '▤' };

  for (const [index, [title, entries]] of legend.entries()) {
    const group = document.createElement('details');
    const summary = document.createElement('summary');
    const list = document.createElement('ul');
    summary.textContent = title;
    group.open = index === 0;
    for (const [kind, label, id] of entries) {
      const item = document.createElement('li');
      const icon = document.createElement('span');
      icon.className = 'simbolo simbolo-' + kind;
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = glyphs[kind] ?? '';
      if (id) item.id = id;
      item.append(icon, document.createTextNode(label));
      list.append(item);
    }
    group.append(summary, list);
    symbols.append(group);
  }
  const note = document.createElement('p');
  note.className = 'leyenda-nota';
  note.textContent = legendStatus;
  if (legendStatus) symbols.prepend(note);

  function showEntry(mark, entry) {
    clearLayers();
    const layer = layers.find(layer => layer.areas === entry.areas && layer.raster === entry.raster && layer.populationCards === entry.populationCards);
    if (layer) {
      selectedLayers.add(layer);
      renderLayers();
    } else {
      showCultureAreas(entry.areas, entry.raster, entry.populationCards);
    }
    activeMark?.setAttribute('aria-pressed', 'false');
    activeMark = mark;
    mark.setAttribute('aria-pressed', 'true');
    highlightedSymbol?.classList.remove('simbolo-activo');
    const { date, title, text, association, legendId, placeId } = entry;
    const place = placeById.get(placeId);
    if (place) focusPlace(place);
    else if (entry.focusCoordinates) focusPlace({ coordinates: entry.focusCoordinates });
    document.querySelector('#titulo-ficha').textContent = title + ' · ' + date;
    document.querySelector('#texto-ficha').textContent = text;
    document.querySelector('#enlace-ficha').textContent = place ? 'Lugar señalado en el mapa.' : association ?? '';
    highlightedSymbol = legendId ? document.getElementById(legendId) : undefined;
    if (highlightedSymbol) {
      panel.open = true;
      highlightedSymbol.closest('details').open = true;
      highlightedSymbol.classList.add('simbolo-activo');
    }
    card.hidden = false;
  }

  for (const groupTitle of new Set(environments.map(state => state.group ?? 'Comparar el entorno'))) {
    const group = document.createElement('details');
    const heading = document.createElement('summary');
    heading.textContent = groupTitle;
    group.append(heading);
    const options = document.createElement('div');
    options.className = 'comparar-hielo';
    for (const state of environments.filter(entry => (entry.group ?? 'Comparar el entorno') === groupTitle)) {
      addLayerButton(options, state, state.title);
    }
    group.append(options);
    symbols.append(group);
  }

  const cultureSection = document.querySelector('#culturas');
  cultureSection.hidden = cultures.length === 0;
  const bands = document.querySelector('#bandas-culturales');
  for (const culture of cultures) {
    const band = document.createElement('button');
    band.type = 'button';
    band.className = 'banda-cultural';
    band.style.gridRow = String(culture.row);
    band.style.gridColumn = culture.from + ' / ' + culture.to;
    band.textContent = culture.title;
    if (culture.color) band.style.setProperty('--tono-cultura', culture.color);
    if (culture.areas?.length) band.classList.add('banda-con-area');
    if (culture.title === 'Auriñaciense') band.classList.add('banda-doble');
    band.setAttribute('aria-pressed', 'false');
    band.onclick = () => showEntry(band, {
      title: culture.title, date: 'orden aproximado', text: culture.text, areas: culture.areas
    });
    bands.append(band);
  }

  const years = [...new Set(chronology.flatMap(({ entries }) => entries.map(({ start }) => start)))]
    .sort((left, right) => left - right);
  tracks.style.setProperty('--fechas', years.length);
  const axis = document.createElement('div');
  axis.className = 'fila-tiempo eje-fechas';
  const era = document.createElement('span');
  const allBefore = years.every(year => year < 0);
  const allAfter = years.every(year => year > 0);
  era.textContent = allBefore ? 'a. C.' : allAfter ? 'd. C.' : '';
  const dates = document.createElement('div');
  dates.className = 'carril-tiempo';
  for (const year of years) {
    const label = document.createElement('span');
    label.textContent = String(Math.abs(year)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (!allBefore && !allAfter) label.textContent += year < 0 ? ' a. C.' : ' d. C.';
    dates.append(label);
  }
  axis.append(era, dates);
  tracks.append(axis);

  for (const { title: label, entries } of chronology) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    const rail = document.createElement('div');
    row.className = 'fila-tiempo';
    rail.className = 'carril-tiempo';
    name.textContent = label;
    for (const entry of [...entries].sort((left, right) => left.start - right.start)) {
      const { start, end, date, title } = entry;
      const mark = document.createElement('button');
      mark.type = 'button';
      mark.style.gridColumn = String(years.indexOf(start) + 1);
      mark.className = start === end ? 'hito' : 'hito intervalo';
      const dateLabel = document.createElement('small');
      dateLabel.textContent = date;
      const titleLabel = document.createElement('strong');
      titleLabel.textContent = title;
      mark.append(dateLabel, titleLabel);
      mark.title = date + ' · ' + title;
      mark.setAttribute('aria-label', mark.title);
      mark.setAttribute('aria-pressed', 'false');
      mark.onclick = () => showEntry(mark, entry);
      rail.append(mark);
    }
    row.append(name, rail);
    tracks.append(row);
  }

  close.onclick = () => {
    clearLayers();
    card.hidden = true;
    highlightedSymbol?.classList.remove('simbolo-activo');
    activeMark?.setAttribute('aria-pressed', 'false');
    activeMark?.focus({ preventScroll: true });
    activeMark = undefined;
  };
}

const selector = document.querySelector('#selector-mapas');
const search = document.querySelector('#buscar-mapas');
const catalogList = document.querySelector('#catalogo-mapas');
const catalogStatus = document.querySelector('#estado-mapas');
const defaultMap = document.body.dataset.mapa;
let groups = [];
let currentMap;
let pendingLoad;
let catalogRequest;

function searchKey(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
}

function renderCatalog() {
  const query = searchKey(search.value.trim());
  catalogList.replaceChildren();
  for (const group of groups) {
    const matches = group.maps.filter(entry => searchKey(entry.id + ' ' + entry.title).includes(query));
    if (!matches.length) continue;
    const section = document.createElement('details');
    section.open = Boolean(query) || matches.some(entry => entry.id === currentMap);
    const label = document.createElement('summary');
    label.textContent = group.title + ' · ' + matches.length;
    section.append(label);
    for (const entry of matches) {
      const item = document.createElement(entry.available ? 'button' : 'p');
      item.className = 'entrada-mapa';
      const name = document.createElement('strong');
      name.textContent = entry.id + ' · ' + entry.title;
      const state = document.createElement('small');
      state.textContent = entry.available ? 'Vista previa disponible' : 'En preparación';
      item.append(name, state);
      if (entry.available) {
        item.type = 'button';
        if (entry.id === currentMap) item.setAttribute('aria-current', 'true');
        item.onclick = () => selectMap(entry.id, 'push');
      }
      section.append(item);
    }
    catalogList.append(section);
  }
  catalogStatus.textContent = catalogList.childElementCount ? '' : 'No se encontraron mapas.';
}

function loadCatalog() {
  if (!catalogRequest) {
    catalogRequest = fetch('./mapas/catalogo.json')
      .then(response => {
        if (!response.ok) throw new Error('Catálogo no disponible.');
        return response.json();
      })
      .then(catalog => { groups = catalog; })
      .catch(error => { catalogRequest = undefined; throw error; });
  }
  return catalogRequest;
}

async function selectMap(id, navigation) {
  pendingLoad?.abort();
  const controller = new AbortController();
  pendingLoad = controller;
  try {
    if (id !== currentMap) {
      catalogStatus.textContent = 'Cargando mapa…';
      const response = await fetch('./mapas/' + encodeURIComponent(id) + '.json', { signal: controller.signal });
      if (!response.ok) throw new Error('No se pudo cargar el mapa ' + id);
      const content = await response.json();
      if (controller.signal.aborted) return;
      renderHistory(content);
      currentMap = id;
    }
    if (navigation) {
      const url = new URL(location.href);
      url.searchParams.set('mapa', id);
      if (url.href !== location.href) {
        if (navigation === 'push') history.pushState(null, '', url);
        else history.replaceState(null, '', url);
      }
    }
    if (selector.open) selector.close();
    if (groups.length) renderCatalog();
  } catch (error) {
    if (controller.signal.aborted) return;
    catalogStatus.textContent = 'No se pudo abrir el mapa.';
    if (!currentMap) document.querySelector('#nombre-mapa').textContent = catalogStatus.textContent;
    console.error(error);
  } finally {
    if (pendingLoad === controller) pendingLoad = undefined;
  }
}

async function openFromAddress() {
  const requested = new URL(location.href).searchParams.get('mapa');
  if (!requested || requested === defaultMap) {
    await selectMap(defaultMap);
    return;
  }
  try {
    await loadCatalog();
    const available = groups.some(group => group.maps.some(entry => entry.id === requested && entry.available));
    await selectMap(available ? requested : defaultMap, available ? undefined : 'replace');
  } catch (error) {
    console.error(error);
    await selectMap(defaultMap, 'replace');
  }
}

document.querySelector('#abrir-mapas').onclick = async () => {
  selector.showModal();
  catalogStatus.textContent = 'Cargando catálogo…';
  try {
    await loadCatalog();
    renderCatalog();
  } catch (error) {
    catalogStatus.textContent = 'No se pudo cargar el catálogo.';
    console.error(error);
  }
};
search.oninput = () => { if (groups.length) renderCatalog(); };
window.addEventListener('popstate', openFromAddress);
openFromAddress();

document.querySelector('#mapa').addEventListener('click', event => {
  const link = event.target.closest('[data-bibliografia]');
  if (!link) return;
  event.preventDefault();
  document.querySelector('#bibliografia').showModal();
});