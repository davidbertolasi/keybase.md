// Parseo tolerante de JSON: el mismo algoritmo que usa el cliente (app.js), del lado del servidor.
// El modelo a veces devuelve comillas dobles sin escapar o saltos de línea dentro de un string; esto lo repara.
const repair = (t) => {
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  const a2 = t.indexOf('['), b2 = t.lastIndexOf(']');
  const useArr = a < 0 || (a2 >= 0 && a2 < a);
  const start = useArr ? a2 : a, end = useArr ? b2 : b;
  if (start < 0 || end <= start) return null;
  const src = t.slice(start, end + 1);
  let out = '', inStr = false, esc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (!inStr) { if (c === '"') inStr = true; out += c; continue; }
    if (esc) { out += c; esc = false; continue; }
    if (c === '\\') { out += c; esc = true; continue; }
    if (c === '\n') { out += '\\n'; continue; }
    if (c === '\r' || c === '\t') { out += ' '; continue; }
    if (c === '"') { if (/^\s*([,}\]:]|$)/.test(src.slice(i + 1))) { inStr = false; out += c; } else out += '\\"'; continue; }
    out += c;
  }
  try { return JSON.parse(out); } catch { return null; }
};

export const parseLenient = (text) => {
  if (!text) return null;
  let t = String(text).trim();
  // bloque ```json ... ``` si el modelo lo agregó
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch {}
  const m = t.match(/[\[{][\s\S]*[\]}]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return repair(t);
};
