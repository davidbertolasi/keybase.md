// Proveedor real: la API de Claude a través del SDK oficial (@anthropic-ai/sdk).
// Credenciales: ANTHROPIC_API_KEY (o ANTHROPIC_AUTH_TOKEN, o un perfil de `ant auth login`); nunca en el cliente.
import Anthropic from '@anthropic-ai/sdk';
import { parseLenient } from './jsonrepair.js';

// Modelo y esfuerzo por nivel. La app pide 'quick' para los turnos de escena (latencia) y 'default'
// cuando manda capturas de pantalla. Los dos usan Claude Opus 5.5; se puede bajar 'quick' a un modelo
// más barato con SPARRING_MODEL_QUICK (por ejemplo claude-sonnet-5-5) sin tocar código.
const MODELS = {
  default: process.env.SPARRING_MODEL_DEFAULT || 'claude-opus-5-5',
  quick: process.env.SPARRING_MODEL_QUICK || process.env.SPARRING_MODEL_DEFAULT || 'claude-opus-5-5',
};
const EFFORT = {
  default: process.env.SPARRING_EFFORT_DEFAULT || 'medium',
  quick: process.env.SPARRING_EFFORT_QUICK || 'low',
};
const MAX_TOKENS = Number(process.env.SPARRING_MAX_TOKENS || 4096); // las respuestas son cortas por diseño (JSON de un turno)

// Prompt de sistema corto y estable (los prompts largos de cada modo viajan como primer mensaje, igual que en el artefacto).
const SYSTEM = [
  'Sos el motor de El Sparring, una app de entrenamiento de conversación y asertividad en español rioplatense.',
  'Cumplís al pie de la letra el rol y el formato que te da el primer mensaje de cada pedido.',
  'Cuando el pedido exige JSON, respondés únicamente con el JSON, sin texto antes ni después y sin bloques de código.',
].join(' ');

const fail = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra });

export function makeClaudeProvider() {
  const client = new Anthropic();

  const toParams = ({ messages, images }) => messages.map((m, i) => {
    const content = [];
    const isLast = i === messages.length - 1;
    if (isLast && images.length) for (const im of images) content.push({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } });
    const text = { type: 'text', text: m.content };
    // Las reglas de la escena (primer mensaje) no cambian en toda la sesión: breakpoint de caché de prompt.
    if (i === 0 && messages.length > 1) text.cache_control = { type: 'ephemeral' };
    content.push(text);
    return { role: m.role, content };
  });

  return {
    name: 'claude',
    models: MODELS,
    async sample({ kind, tier, messages, images }) {
      let resp;
      try {
        resp = await client.beta.messages.create({
          model: MODELS[tier],
          max_tokens: MAX_TOKENS,
          // Si un clasificador de seguridad declina el pedido, la API lo reintenta sola en el modelo recomendado.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: EFFORT[tier] },
          system: SYSTEM,
          messages: toParams({ messages, images }),
        });
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) throw fail('rate_limited', 'límite de uso de la API; probá en un minuto', { status: 429 });
        if (e instanceof Anthropic.AuthenticationError) throw fail('not_granted', 'la clave de API del servidor no es válida', { status: 502 });
        if (e instanceof Anthropic.BadRequestError) throw fail(images.length ? 'image_rejected' : 'bad_request', e.message, { status: 400 });
        if (e instanceof Anthropic.APIConnectionError) throw fail('failed', 'sin conexión con la API de Claude', { status: 502 });
        if (e instanceof Anthropic.APIError) throw fail('failed', `API ${e.status}: ${e.message}`, { status: 502 });
        throw e;
      }
      if (resp.stop_reason === 'refusal') throw fail('refused', (resp.stop_details && resp.stop_details.explanation) || 'Claude no quiso trabajar con ese contenido', { status: 422 });
      const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
      if (process.env.SPARRING_LOG_USAGE) console.log('[usage]', resp.model, JSON.stringify(resp.usage));
      if (kind === 'text') return { text };
      const data = parseLenient(text);
      if (data == null) throw fail('invalid_json', 'la respuesta no fue JSON válido', { status: 422, text });
      return { data, text };
    },
  };
}
