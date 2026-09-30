// Prueba de humo: levanta el servidor con el proveedor simulado y recorre la app en Chromium
// (escena de sparring con coach, ronda de reflejo, "respondé por mí", resultados). Sin API real.
//   npm test          (usa el paquete `playwright` local o el global)
import { spawn, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const PORT = 3123;

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const g = execSync('npm root -g').toString().trim();
  return import(path.join(g, 'playwright', 'index.mjs'));
}

const server = spawn(process.execPath, ['server/index.js'], { cwd: root, env: { ...process.env, PORT: String(PORT), SPARRING_PROVIDER: 'mock' }, stdio: ['ignore', 'pipe', 'inherit'] });
server.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
const waitUp = async () => { for (let i = 0; i < 50; i++) { try { const r = await fetch(`http://localhost:${PORT}/api/health`); if (r.ok) return; } catch {} await new Promise((r) => setTimeout(r, 100)); } throw new Error('el servidor no levantó'); };

let failed = false;
try {
  await waitUp();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  // Errores de consola de la app; los recursos externos (Google Fonts) no cuentan: pueden no cargar sin internet.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(`http://localhost:${PORT}/`)) errors.push('request: ' + r.url() + ' ' + (r.failure() || {}).errorText); });
  // sin voz y sin compuerta de 2 s para que la prueba sea rápida
  await page.addInitScript(() => localStorage.setItem('sparring.settings', JSON.stringify({ voice: false, pause: false })));

  await page.goto(`http://localhost:${PORT}/`);
  if ((await page.title()) !== 'El Sparring') throw new Error('título inesperado');

  // 1) escena de sparring: apertura, una línea, coach
  await page.click('#start');
  await page.waitForSelector('.turn.her .bubble');
  await page.fill('#input', 'Depende. ¿Vos siempre elegís al que llega segundo?');
  await page.waitForSelector('#send:not([disabled])');
  await page.click('#send');
  await page.waitForSelector('.coach .flag', { timeout: 10_000 });
  const flags = await page.$$eval('.coach .flag', (els) => els.map((e) => e.textContent));
  console.log('escena ok · flags:', flags.join(' | '));
  mkdirSync(path.join(here, 'out'), { recursive: true });
  await page.screenshot({ path: path.join(here, 'out', 'escena.png') });

  // 2) reflejo: un pinchazo, una respuesta, evaluación
  await page.click('#btnReset');
  await page.click('#startDrill');
  await page.waitForSelector('.jab');
  await page.waitForSelector('#dinput:not([disabled])');
  await page.fill('#dinput', 'Sí. ¿Y?');
  await page.click('#dsend');
  await page.waitForSelector('.dres .alt', { timeout: 10_000 });
  console.log('reflejo ok ·', await page.$eval('.dres .score', (e) => e.textContent));

  // 3) respondé por mí
  await page.click('#dReset');
  await page.click('#showReply');
  await page.fill('#replyChat', 'Ella: qué raro sos\nYo: puede ser\nElla: no me convence');
  await page.click('#replyGo');
  await page.waitForSelector('.opt', { timeout: 10_000 });
  console.log('respondé por mí ok · opciones:', await page.$$eval('.opt .reg', (els) => els.map((e) => e.textContent).join(', ')));
  await page.screenshot({ path: path.join(here, 'out', 'responde.png') });

  // 4) resultados con lo guardado
  await page.click('#replyBack');
  await page.click('#showResults');
  await page.waitForSelector('.tile');
  console.log('resultados ok');

  await browser.close();
  if (errors.length) { console.error('errores de página:\n' + errors.join('\n')); failed = true; }
} catch (e) {
  console.error('FALLÓ:', e.message); failed = true;
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
