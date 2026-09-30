# El Sparring

Entrenamiento de conversación y asertividad. Enfrente hay alguien (ella en una cita, o una contraparte de negocios) que no te la hace fácil; vos decís lo tuyo; el coach te dice cómo lo dijiste. Nació como artefacto de claude.ai; acá vive como aplicación propia: mismo código de interfaz, servidor Node que habla con la API de Claude.

Modos:

- **Sparring por escenas.** Nueve escenas de citas y once de negocios, tres niveles de dificultad, interés o posición de 0 a 100 que se mueve como un dimmer, coach con flags, nota y "hubiese ido mejor" en cada turno, balance al cerrar.
- **Reflejo.** Diez pinchazos con seis segundos para contestar, puntaje 0 a 10 y dos remates alternativos por ronda.
- **Respondé por mí.** Pegás un chat (o subís capturas) y te devuelve lectura de la situación, tres respuestas en registros distintos con su mecanismo, y qué evitar.
- **Resultados.** Historial de rondas y escenas, lo que más te marca el coach.

## Estructura

```
sparring/
  web/                  la app (estática; se sirve tal cual)
    index.html          marcado del artefacto, con manifest e ícono para instalar en el teléfono
    css/sparring.css    estilos del artefacto, sin cambios
    js/profile.js       tu perfil (nombre, edad, oficio): entra en los prompts
    js/runtime.js       adaptador: reproduce window.claude.use('sample') sobre /api/sample
    js/app.js           toda la lógica del artefacto (escenas, prompts, coach, reflejo, resultados)
  server/
    index.js            Express: sirve web/, expone /api/sample, /api/limits, /api/health; token de acceso y límite por IP
    claude.js           proveedor real: SDK oficial de Anthropic
    mock.js             proveedor simulado: respuestas con la forma exacta, sin gastar API
    jsonrepair.js       parseo tolerante del JSON que devuelve el modelo
  test/smoke.mjs        prueba de humo en Chromium contra el servidor con mock
  artifact/             copia intacta del artefacto exportado (para volver a publicarlo en claude.ai)
  Dockerfile, .env.example, package.json
```

## Cómo funciona la conexión con Claude

Dentro de claude.ai, un artefacto le pide texto o JSON al modelo con `window.claude.use('sample')`. Fuera de ese entorno esa función no existe. `runtime.js` la reconstruye con la misma firma sobre nuestro servidor, así `app.js` no distingue dónde corre:

```
navegador ── POST /api/sample ──> server/index.js ──> server/claude.js ──> API de Claude
             {kind, prompt|messages, modelTier, images}     (clave de API sólo acá)
```

Decisiones en `server/claude.js`:

- Modelo `claude-opus-5-5` en los dos niveles. El nivel `quick` (turnos de escena, reflejo, balances) corre con esfuerzo `low`; `default` (capturas) con `medium`. Ambos se cambian por variable de entorno, por ejemplo `SPARRING_MODEL_QUICK=claude-sonnet-5-5` para abaratar los turnos.
- `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`): si un clasificador de seguridad declina un pedido, la API lo reintenta sola en otro modelo en la misma llamada. Desactivable borrando esas dos líneas.
- Caché de prompt: las reglas de la escena van como primer mensaje y no cambian durante la sesión, así que llevan `cache_control`. A partir del segundo turno esa parte se cobra al 5 %.
- Errores mapeados a los códigos que la interfaz ya maneja: `invalid_json` (con el texto crudo, para que el cliente también intente repararlo), `rate_limited`, `refused`, `image_rejected`, `not_granted`.

Costo estimado por turno de escena con Opus 5.5 (reglas ~2.500 tokens en caché, historial ~1.500, salida ~250):

| Concepto | Tokens | Costo aprox. |
|---|---|---|
| reglas (lectura de caché) | 2.500 | 0,0005 USD |
| historial y línea nueva | 1.500 | 0,006 USD |
| respuesta | 250 | 0,005 USD |
| **turno** | | **~0,012 USD** |

Una escena de diez turnos ronda 0,12 USD; con Sonnet 5.5 en `quick`, la mitad. `SPARRING_LOG_USAGE=1` imprime los tokens reales de cada pedido para medir.

## Correr en tu máquina

Requiere Node 20 o superior.

```bash
cd sparring
npm install
cp .env.example .env        # y poné tu ANTHROPIC_API_KEY
set -a; source .env; set +a
npm start                   # http://localhost:3000
```

Sin clave, para tocar la interfaz: `npm run dev` (proveedor simulado, recarga al guardar).

Prueba de humo (levanta el servidor con mock y recorre los cuatro modos en Chromium):

```bash
npm test
```

## Publicar en internet

Cualquier plataforma que corra un contenedor o Node sirve: Railway, Render, Fly.io, Cloud Run. Con el `Dockerfile` incluido:

```bash
docker build -t sparring .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... -e SPARRING_ACCESS_TOKEN=frase-larga -e SPARRING_TRUST_PROXY=1 sparring
```

Antes de compartir la URL:

1. **Definí `SPARRING_ACCESS_TOKEN`.** Sin eso, cualquiera que tenga la URL gasta tu clave. Vos entrás una vez con `https://tu-app/#token=frase-larga`; queda guardado en ese navegador.
2. Dejá `SPARRING_RATE_PER_MIN` (30 por defecto) y `SPARRING_TRUST_PROXY=1` si hay un proxy adelante.
3. En el teléfono, "Agregar a pantalla de inicio": la app trae manifest e ícono, abre a pantalla completa.

## Qué cambió respecto del artefacto

- La lógica de `app.js` es la del artefacto. Único cambio: los datos personales que estaban escritos dentro de los prompts (nombre, edad, oficio) ahora salen de `web/js/profile.js`. Las escenas y los pinchazos siguen siendo los mismos textos.
- El artefacto no podía subir capturas si el runtime no lo permitía; acá el servidor las acepta siempre (hasta tres, JPEG/PNG/WebP/GIF, 5 MB cada una).
- Los resultados siguen guardándose en el navegador (`localStorage`). Cambiás de teléfono, arrancás de cero. Eso es lo primero que resuelve el roadmap.

Para volver a publicarlo como artefacto en claude.ai, `artifact/El-Sparring.artifact.html` es la copia exacta exportada.

## Roadmap: de app personal a app para muchos

Cada fase deja algo usable. El orden importa: primero lo que impide que la use otra persona, después lo que la hace negocio.

**Fase 1 · Multiusuario mínimo** (lo que hoy bloquea a un segundo usuario)

- Cuentas: login con enlace por correo o Google (Auth.js o Supabase Auth). Un usuario, un perfil.
- Perfil en base de datos en lugar de `profile.js`: nombre, edad, cómo se describe, a qué se dedica. Pantalla de "quién sos" en el primer ingreso.
- Escenas y pinchazos como datos por usuario: los packs actuales pasan a ser el pack inicial; se agregan escenas propias ("mi jefe", "mi ex socio") escritas por el usuario o generadas a partir de una descripción.
- Resultados en la base (Postgres): sesiones, rondas, flags. Misma pantalla de Resultados, ahora sincronizada entre dispositivos.
- Límite de uso por cuenta (turnos por día) en lugar de por IP.

**Fase 2 · Producto**

- Onboarding de tres pantallas: quién sos, qué querés entrenar (citas, negocios, ambos), primer sparring guiado.
- Plan gratis con cupo diario y plan pago mensual (Stripe o Mercado Pago). El costo por turno de arriba es la base del precio.
- Panel de progreso: curva de interés por escena, flags que bajan con las semanas, racha.
- Voz: la síntesis del navegador es desigual entre teléfonos; una voz de servidor (ElevenLabs o similar) hace que "ella" suene igual en todos.
- Correo semanal con el balance (lo que ya genera el coach, enviado).

**Fase 3 · Escala y calidad**

- Evaluación del coach: un set de líneas de referencia con el puntaje esperado, corrido en cada cambio de prompt para que el criterio no se mueva.
- Streaming de la respuesta de "ella" para que empiece a hablar antes de que termine el JSON.
- Límite por cuenta en Redis, métricas de costo por usuario, alertas de gasto.
- Aplicación instalable de verdad: hoy es PWA; si hace falta tienda, Capacitor envuelve la misma web.

## Estado de verificación

- Prueba de humo pasada: escena con coach, reflejo, respondé por mí y resultados, con el proveedor simulado.
- API validada con `curl`: token de acceso (401 sin él), texto, JSON de escena, rechazo de pedidos y de imágenes inválidas, límites, archivos estáticos.
- Parseo tolerante de JSON probado con siete casos de salida rota.
- La llamada real a la API de Claude está escrita según la documentación vigente del SDK pero no se ejecutó en el entorno donde se armó (no había clave). Primera cosa a correr con tu clave: `npm start` y una escena.
