import { mkdir, rename, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';

const curl = promisify(execFile);
const folder = join(import.meta.dirname, 'dist');
const naturalEarth = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/';
const library = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.15.0/';
const terrain = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/';
const restoreElevation = process.argv.includes('--restaurar-altitud');
const jobs = [
  ['maplibre/maplibre-gl.js', library + 'dist/maplibre-gl.js'],
  ['maplibre/maplibre-gl.css', library + 'dist/maplibre-gl.css'],
  ['maplibre/LICENSE.txt', library + 'LICENSE.txt'],
  ['datos/tierra.geojson', naturalEarth + 'ne_10m_land.geojson'],
  ['datos/rios.geojson', naturalEarth + 'ne_50m_rivers_lake_centerlines.geojson']
];
const west = -34, east = 62, south = 25, north = 77;
for (let z = 0; z <= 7; z++) {
  const width = 2 ** z;
  const x = lon => Math.floor((lon + 180) / 360 * width);
  const y = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) * width / 2);
  const global = z <= 4;
  for (let col = global ? 0 : x(west); col <= (global ? width - 1 : x(east)); col++) {
    for (let row = global ? 0 : y(north); row <= (global ? width - 1 : y(south)); row++) {
      const tile = z + '/' + col + '/' + row + '.png';
      jobs.push(['datos/altitud/' + tile, terrain + tile]);
    }
  }
}

const failures = [];
let cursor = 0;
let completed = 0;
await Promise.all(Array.from({ length: 12 }, async () => {
  while (cursor < jobs.length) {
    const [file, url] = jobs[cursor++];
    const target = join(folder, file);
    try {
      const existing = await stat(target).catch(() => null);
      if (!existing?.size || (restoreElevation && file.startsWith('datos/altitud/'))) {
        await mkdir(dirname(target), { recursive: true });
        await curl('curl.exe', ['-fLsS', '--compressed', '--retry', '2', '--max-time', file.endsWith('.geojson') ? '240' : '35', url, '-o', target + '.part']);
        await rename(target + '.part', target);
      }
    } catch (error) {
      failures.push(file + ': ' + error.stderr);
    }
    completed++;
    if (completed % 100 === 0 || completed === jobs.length) console.log(completed + '/' + jobs.length);
  }
}));
if (failures.length) {
  console.error(failures.slice(0, 12).join('\n'));
  console.error(failures.length + ' archivos pendientes');
  process.exitCode = 1;
}
