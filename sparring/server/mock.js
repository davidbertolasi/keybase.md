// Proveedor simulado: responde con la forma exacta que espera la app, sin llamar a Claude.
// Sirve para desarrollar la interfaz, correr la prueba de humo y hacer demos sin gastar API.
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function makeMockProvider() {
  return {
    name: 'mock',
    models: { default: 'mock', quick: 'mock' },
    async sample({ kind, messages }) {
      await sleep(250);
      const last = messages[messages.length - 1].content;
      const first = messages[0].content;
      if (kind === 'text') {
        return { text: 'Mejor momento: cuando dejaste el hilo abierto y no lo explicaste. Error repetido: contestaste sin pausa dos veces. El estado cambió en el turno tres. Esta semana: una pregunta que sólo se contesta con una historia. Menos es más.' };
      }
      let data;
      if (/\{"open":/.test(first)) data = { open: pick(['Bueno. Acá estamos. Sorprendeme.', '(mira la carta) Elegí vos. Quiero ver qué hacés con eso.']) };
      else if (/JSON array de 10/.test(first)) data = Array.from({ length: 10 }, (_, i) => pick(['Eso se lo decís a todas.', '¿Y vos qué tenés además de la labia?', 'Mmm. No.', 'Tenés cara de abogado. No sé si es un elogio.', 'Me estoy aburriendo. Hacé algo.']) + ' (' + (i + 1) + ')');
      else if (/"puntos"/.test(first)) data = { puntos: 4 + Math.floor(Math.random() * 6), veredicto: 'Te defendiste un poco. Con la mitad de palabras ganabas.', alt1: 'Sí. Y todavía no terminé.', alt2: '(la mira) ¿Eso fue una pregunta?' };
      else if (/"lectura"/.test(first)) data = { lectura: 'Te está probando: quiere ver si te llenás de palabras. Fase A3.', opciones: [ { registro: 'seca', texto: 'Puede ser.', mecanismo: 'No reacciona; le devuelve el vacío.' }, { registro: 'de juego', texto: 'Sí, soy raro. Vos recién lo notás.', mecanismo: 'Acepta la etiqueta y la juega.' }, { registro: 'de avance', texto: 'El jueves te llevo a un lugar donde eso se discute mejor.', mecanismo: 'Escala con excusa y salida fácil.' } ], evitar: 'Explicar por qué no sos raro: es justo lo que ella espera.' };
      else {
        const cur = Number((last.match(/interés actual: (\d+)/) || [])[1] || 50);
        const said = (last.split('Él dice:')[1] || '').trim();
        const words = said.split(/\s+/).filter(Boolean).length;
        const good = words > 0 && words <= 25;
        const interes = Math.max(0, Math.min(100, cur + (good ? 5 : -5)));
        data = {
          reply: pick(['(se ríe) Chamuyero. Pero seguí.', 'Ajá. ¿Y eso lo pensaste recién?', '(lo mira, sostiene) …Bueno.', 'No te creo ni la mitad. Me gusta cómo lo decís.']),
          mood: interes < 20 ? 'perdido' : interes > 60 ? 'denso' : 'liviano',
          interes, magnitud: 'normal',
          coach: { flags: good ? [ { t: 'corto y firme', ok: true }, { t: 'hilo abierto', ok: true } ] : [ { t: 'monólogo', ok: false }, { t: 'explicó la brecha', ok: false } ], nota: good ? 'Bien: dijiste y no explicaste.' : 'Demasiadas palabras: ella se fue a mitad de frase.', mejor: good ? '' : 'Puede ser. (silencio)' },
        };
      }
      return { data, text: JSON.stringify(data) };
    },
  };
}
