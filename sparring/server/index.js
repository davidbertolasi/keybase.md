// El Sparring · servidor.
// Sirve la app (web/) y expone POST /api/sample, la única puerta a Claude. La clave de API vive acá, nunca en el navegador.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeProvider } from './provider.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.SPARRING_ACCESS_TOKEN || '';
const RATE_PER_MIN = Number(process.env.SPARRING_RATE_PER_MIN || 30);
const IMAGES = { mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], maxCount: 3, maxBytes: 5 * 1024 * 1024 };

const provider = makeProvider();
const app = express();
app.disable('x-powered-by');
if (process.env.SPARRING_TRUST_PROXY) app.set('trust proxy', Number(process.env.SPARRING_TRUST_PROXY) || 1);
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(here, '..', 'web'), { extensions: ['html'] }));

// Acceso: si SPARRING_ACCESS_TOKEN está definido, /api exige "Authorization: Bearer <token>".
// Sin eso, cualquiera con la URL gasta tu API; no publiques la app sin token.
const auth = (req, res, next) => {
  if (!TOKEN) return next();
  if ((req.get('authorization') || '') === 'Bearer ' + TOKEN) return next();
  res.status(401).json({ error: 'not_granted', message: 'token de acceso inválido o ausente' });
};

// Límite por IP (ventana de un minuto, en memoria). Suficiente para un servidor; con varios, mover a Redis.
const hits = new Map();
const limiter = (req, res, next) => {
  const now = Date.now();
  const arr = (hits.get(req.ip) || []).filter((t) => now - t < 60_000);
  if (arr.length >= RATE_PER_MIN) { res.set('retry-after', '60'); return res.status(429).json({ error: 'rate_limited', message: 'demasiadas solicitudes; esperá un minuto' }); }
  arr.push(now); hits.set(req.ip, arr);
  if (hits.size > 10_000) hits.clear();
  next();
};

app.get('/api/health', (req, res) => res.json({ ok: true, provider: provider.name }));
app.get('/api/limits', auth, (req, res) => res.json({ images: { mediaTypes: IMAGES.mediaTypes, maxCount: IMAGES.maxCount }, provider: provider.name, models: provider.models }));

app.post('/api/sample', auth, limiter, async (req, res) => {
  const b = req.body || {};
  const kind = b.kind === 'json' ? 'json' : 'text';
  const tier = b.modelTier === 'default' ? 'default' : 'quick';

  let messages = null;
  if (Array.isArray(b.messages)) {
    messages = b.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));
  } else if (typeof b.prompt === 'string' && b.prompt.trim()) {
    messages = [{ role: 'user', content: b.prompt }];
  }
  if (!messages || !messages.length || messages[0].role !== 'user') return res.status(400).json({ error: 'bad_request', message: 'falta prompt o messages' });
  if (messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'bad_request', message: 'el último mensaje debe ser del usuario' });

  const images = [];
  if (Array.isArray(b.images) && b.images.length) {
    if (b.images.length > IMAGES.maxCount) return res.status(400).json({ error: 'image_rejected', message: `máximo ${IMAGES.maxCount} imágenes` });
    for (const im of b.images) {
      if (!im || !IMAGES.mediaTypes.includes(im.media_type) || typeof im.data !== 'string' || !im.data) return res.status(400).json({ error: 'image_rejected', message: 'formato de imagen no admitido' });
      if (Buffer.byteLength(im.data, 'base64') > IMAGES.maxBytes) return res.status(400).json({ error: 'image_rejected', message: 'imagen demasiado grande (máximo 5 MB)' });
      images.push({ media_type: im.media_type, data: im.data });
    }
  }

  try {
    res.json(await provider.sample({ kind, tier, messages, images }));
  } catch (e) {
    const code = e.code || 'failed';
    if (code !== 'invalid_json') console.error('[sample]', code, e.message);
    res.status(e.status || 502).json({ error: code, message: e.message, ...(e.text != null ? { text: e.text } : {}) });
  }
});

app.listen(PORT, () => console.log(`El Sparring · http://localhost:${PORT} · proveedor: ${provider.name}${TOKEN ? ' · con token de acceso' : ' · SIN token de acceso'}`));
