'use strict';

function renderHistory({ id, title, legendStatus, legend, chronology, notesIntro, notes, sources }) {
  document.querySelector('#nombre-mapa').textContent = id + ' · ' + title;
  document.querySelector('#introduccion-hitos').textContent = notesIntro ?? '';
  const notesList = document.querySelector('#notas-mapa');
  for (const { heading, body } of notes) {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = heading;
    item.append(name, document.createTextNode(' ' + body));
    notesList.append(item);
  }
  const sourcesList = document.querySelector('#fuentes-mapa');
  for (const source of sources) {
    const reference = document.createElement('p');
    const cite = document.createElement('cite');
    cite.textContent = source.title;
    reference.append(cite, document.createTextNode('. ' + source.edition));
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

  const glyphs = { cueva: '◆', arte: '✋︎', estructura: '▲', venus: '♟', asentamiento: '⌂', concha: '◒' };

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
    activeMark?.setAttribute('aria-pressed', 'false');
    activeMark = mark;
    mark.setAttribute('aria-pressed', 'true');
    highlightedSymbol?.classList.remove('simbolo-activo');
    const { date, title, text, association, legendId } = entry;
    document.querySelector('#titulo-ficha').textContent = title + ' · ' + date;
    document.querySelector('#texto-ficha').textContent = text;
    document.querySelector('#enlace-ficha').textContent = association ?? '';
    highlightedSymbol = legendId ? document.getElementById(legendId) : undefined;
    if (highlightedSymbol) {
      panel.open = true;
      highlightedSymbol.closest('details').open = true;
      highlightedSymbol.classList.add('simbolo-activo');
    }
    card.hidden = false;
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
    card.hidden = true;
    highlightedSymbol?.classList.remove('simbolo-activo');
    activeMark?.setAttribute('aria-pressed', 'false');
    activeMark?.focus({ preventScroll: true });
    activeMark = undefined;
  };
}

async function loadHistory() {
  const id = document.body.dataset.mapa;
  const response = await fetch('./mapas/' + encodeURIComponent(id) + '.json');
  if (!response.ok) throw new Error('No se pudo cargar el mapa ' + id);
  renderHistory(await response.json());
}

loadHistory().catch(error => {
  document.querySelector('#nombre-mapa').textContent = 'No se pudo cargar el contenido histórico.';
  console.error(error);
});

document.querySelector('#mapa').addEventListener('click', event => {
  const link = event.target.closest('[data-bibliografia]');
  if (!link) return;
  event.preventDefault();
  document.querySelector('#bibliografia').showModal();
});