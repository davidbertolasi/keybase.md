import { makeClaudeProvider } from './claude.js';
import { makeMockProvider } from './mock.js';

export function makeProvider() {
  const which = (process.env.SPARRING_PROVIDER || 'claude').toLowerCase();
  if (which === 'mock') return makeMockProvider();
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn('[sparring] No hay ANTHROPIC_API_KEY ni ANTHROPIC_AUTH_TOKEN: el SDK buscará un perfil de `ant auth login`. Para desarrollar sin API: SPARRING_PROVIDER=mock');
  }
  return makeClaudeProvider();
}
