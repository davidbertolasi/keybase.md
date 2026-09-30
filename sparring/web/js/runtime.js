/* El Sparring · adaptador de runtime.
   Dentro de un artefacto de claude.ai existe window.claude.use('sample'): la página le pide texto o JSON a Claude
   sin backend. Fuera de ese entorno (esta app), este archivo provee la MISMA interfaz sobre nuestro servidor
   (POST /api/sample), así app.js queda igual en los dos mundos.

   Interfaz que app.js espera:
     const sample = await window.claude.use('sample');
     await sample(prompt, opts)                 -> { text }
     await sample.json(promptOrMessages, opts)  -> objeto/array ya parseado (lanza {code:'invalid_json', text} si no se pudo)
     await sample.limits()                      -> { images: { mediaTypes:[], maxCount } }
     opts: { modelTier:'quick'|'default', signal: AbortSignal, images: File[] }
   Códigos de error que app.js maneja: invalid_json, not_granted, sampling_disabled, rate_limited, cancelled,
   image_rejected, images_unavailable, refused. */
(() => {
  if (window.claude && typeof window.claude.use === 'function') return; // estamos dentro de un artefacto: runtime nativo

  const BASE = String(window.SPARRING_API_BASE || '').replace(/\/$/, '');

  // Token de acceso opcional (SPARRING_ACCESS_TOKEN en el servidor). Se pasa una vez por URL:
  //   https://tu-app/#token=XXXX  → queda guardado en este navegador y se quita de la barra.
  try {
    const m = location.hash.match(/(?:^#|&)token=([^&]+)/);
    if (m) { localStorage.setItem('sparring.token', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
  } catch {}
  const token = () => { try { return localStorage.getItem('sparring.token') || ''; } catch { return ''; } };

  const err = (code, message, text) => { const e = new Error(message || code); e.code = code; if (text != null) e.text = text; return e; };

  const fileToImage = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const s = String(r.result); res({ media_type: f.type || 'image/jpeg', data: s.slice(s.indexOf(',') + 1) }); };
    r.onerror = () => rej(err('image_rejected', 'no pude leer la imagen'));
    r.readAsDataURL(f);
  });

  const call = async (path, body, signal) => {
    let r;
    try {
      r = await fetch(BASE + path, {
        method: body ? 'POST' : 'GET',
        headers: { 'content-type': 'application/json', ...(token() ? { authorization: 'Bearer ' + token() } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw err('cancelled', 'cancelado');
      throw err('failed', 'sin conexión con el servidor');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) {
      const code = j.error || (r.status === 429 ? 'rate_limited' : r.status === 401 ? 'not_granted' : 'failed');
      throw err(code, j.message, j.text);
    }
    return j;
  };

  const norm = async (opts) => ({
    modelTier: (opts && opts.modelTier) || 'quick',
    images: opts && opts.images && opts.images.length ? await Promise.all(Array.from(opts.images).map(fileToImage)) : undefined,
  });

  const sample = async (prompt, opts = {}) => {
    const j = await call('/api/sample', { kind: 'text', prompt: String(prompt), ...(await norm(opts)) }, opts.signal);
    return { text: String(j.text == null ? '' : j.text) };
  };
  sample.json = async (promptOrMessages, opts = {}) => {
    const body = Array.isArray(promptOrMessages) ? { messages: promptOrMessages } : { prompt: String(promptOrMessages) };
    const j = await call('/api/sample', { kind: 'json', ...body, ...(await norm(opts)) }, opts.signal);
    return j.data;
  };
  sample.limits = async () => call('/api/limits');

  window.claude = { use: async (cap) => (cap === 'sample' ? sample : null) };
})();
