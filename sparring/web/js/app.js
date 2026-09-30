(() => {
"use strict";
// Perfil del usuario (nombre, edad, oficio): editable en js/profile.js. Los prompts lo usan en lugar de datos fijos.
const P = Object.assign({ nombre:'David', edad:43, oficio:'abogado, desarrollador de loteos, productor musical, escritor', bioCitas:'abogado, desarrollador de loteos, productor de cumbia y de música clásica, escritor de libros de desarrollo personal, tres hijos con tres mujeres distintas, viajado, lee filosofía' }, window.SPARRING_PROFILE || {});
const $ = id => document.getElementById(id);
const log = $('log'), input = $('input'), send = $('send'), hint = $('hint'), moodEl = $('mood'), ringPath = $('ringPath');

// ---------- settings ----------
const S = { showFase:false, showMeter:false, freshOpen:false, mode:'rel', scene:'bar', sceneBiz:'honorarios', level:'normal', pause:true, voice:true, coach:true };
try { Object.assign(S, JSON.parse(localStorage.getItem('sparring.settings')||'{}')); } catch {}
const saveS = () => { try { localStorage.setItem('sparring.settings', JSON.stringify(S)); } catch {} };
const pressGroup = (id, key, onChange) => {
  const g = $(id);
  g.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S[key])));
  g.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    S[key] = b.dataset.v; saveS();
    g.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (onChange) onChange();
  });
};
const LEVEL_LABELS = { rel: { curiosa:'Curiosa · muerde fácil', normal:'Normal · muerde y esquiva', dificil:'Difícil · esquiva casi todo' }, biz: { curiosa:'Razonable · cede si sostenés', normal:'Normal · presiona en serio', dificil:'Difícil · no cede casi nunca' } };
const applyMode = () => {
  const biz = S.mode === 'biz';
  $('fScenesRel').hidden = biz; $('fScenesBiz').hidden = !biz; $('ledeRel').hidden = biz; $('ledeBiz').hidden = !biz; $('rowFase').hidden = biz;
  $('lblLevel').textContent = biz ? 'Cómo juega la contraparte' : 'Cómo juega ella';
  $('lblVoice').textContent = biz ? 'La contraparte habla en voz alta' : 'Ella habla en voz alta';
  $('start').textContent = biz ? 'Entrar a la reunión' : 'Sentarse';
  $('btnBalance').textContent = biz ? 'Cerrar la reunión' : 'Cerrar la noche';
  $('levels').querySelectorAll('.chip').forEach(b => { b.textContent = LEVEL_LABELS[biz?'biz':'rel'][b.dataset.v] || b.textContent; });
};
pressGroup('modes','mode', applyMode); pressGroup('scenes','scene'); pressGroup('scenesBiz','sceneBiz'); pressGroup('levels','level'); applyMode();
for (const [id,key] of [['optPause','pause'],['optVoice','voice'],['optCoach','coach'],['optFresh','freshOpen'],['optMeter','showMeter'],['optFase','showFase']]) {
  $(id).checked = S[key];
  $(id).addEventListener('change', e => { S[key] = e.target.checked; saveS(); });
}

// ---------- scenes ----------
const SCENES = {
  bar: { mood:'liviano', interes:45,
    ctx:'Primera cita. Un bar tranquilo, martes a la noche, se sentaron hace dos minutos. Ella pidió un vino, él todavía no.',
    opens:[
      'Bueno. Acá estamos. ¿Vos siempre elegís mesas contra la pared o es una cosa de hoy?',
      'Te voy a ser sincera: casi cancelo. Convenceme de que hice bien en venir.',
      '(mira la carta) Pedí vos. Quiero ver qué elegís cuando no sabés qué me gusta.',
      'Tenés diez minutos de crédito. Después decido si pido otra o pido la cuenta.',
      'Sos más callado que en los mensajes. ¿Cuál de los dos sos?',
      '(se sienta, se saca el saco) Qué día. No me preguntes cómo estoy, decime algo que me saque de la cabeza el trabajo.'
    ]},
  fila: { mood:'liviano', interes:35,
    ctx:'Fila de una cafetería, de día. No se conocen. Ella habló primero por casualidad. Tienen unos seis minutos hasta que los atiendan.',
    opens:[
      'Perdón, ¿esto es la fila o es gente parada esperando a alguien? Nunca sé.',
      '(al que atiende, en voz alta) ¿Tienen algo que no sea con avena? (a él) Perdón, estoy peleada con la avena.',
      'Vos pediste antes que yo la otra vez. Me acuerdo del pedido, no de la cara.',
      '¿Es idea mía o esta fila no avanzó en cinco minutos?',
      '(mira el teléfono, suspira, lo guarda) Si me ves mirando el teléfono, decime algo. Estoy tratando de dejar de hacerlo.',
      'Tengo una teoría sobre la gente que pide café con nombre raro. Vos no parecés de esos. O sí.'
    ]},
  risa: { mood:'liviano', interes:60,
    ctx:'Primera cita en un bar. Acaban de reírse juntos de algo y la risa se está apagando. Es el segundo de silencio cómodo después de una risa compartida.',
    opens:[
      'No, basta, me duele la panza. (se acomoda, todavía riéndose) Bueno. ¿Qué decías?',
      '(se seca un ojo) Hacía mucho que no me reía así con un desconocido. Ojo, todavía sos un desconocido.',
      '(silencio, sonriendo, lo mira) …Qué.',
      'Bueno, ya está, ya te ganaste la segunda copa. No te vayas a creer que la tercera.',
      '(mira alrededor) La mesa de al lado nos está mirando. Creo que les dimos envidia. O miedo.',
      '(recupera el aire) Ya está, se me fue. Ahora decime algo serio, que me quedé con ganas.'
    ]},
  denso: { mood:'denso', interes:65,
    ctx:'Primera cita que viene bien. Ella acaba de contar algo personal, sobre alguien que ya no está en su vida. Bajó la voz. Es un momento denso.',
    opens:[
      '(mira el vaso) …y eso fue lo último que le dije. No sé por qué te lo cuento. No se lo conté a nadie.',
      '(baja la voz) Mi vieja se enfermó hace dos años y yo no estuve. Estaba en otro país. Todavía no sé qué hacer con eso.',
      '(pausa larga) Me separé hace ocho meses. Recién ahora puedo decirlo sin que se me cierre la garganta. Bueno, casi.',
      '(sin mirarlo) A veces pienso que elegí mal casi todo lo importante. Y me fue bien igual. Eso me asusta más.',
      '(juega con el anillo que ya no tiene) Hay una casa en la que crecí a la que no puedo volver a pasar. Ni por la puerta. Perdón, no sé de dónde salió eso.',
      '(lo mira, seria) Te dije algo que no le digo a nadie. Ahora quiero saber si te asustaste.'
    ]},
  whatsapp: { mood:'liviano', interes:40,
    ctx:'Chat de WhatsApp. Se conocieron en un evento hace tres días y ella le dio el número. Es el primer intercambio de mensajes: él escribió, ella acaba de contestar. Todo es por escrito: no hay gestos ni tono de voz, los mensajes son cortos, y ella puede tardar en responder (si tarda, lo decís entre paréntesis: "(contesta dos horas después)").',
    opens:[
      'Ah, sos vos. Pensé que no ibas a escribir. Tardaste lo justo para parecer ocupado.',
      'Hola. Estoy en una reunión eterna, así que si me contestás algo bueno me salvás la tarde.',
      'Jaja ok. ¿Y vos qué querés exactamente escribiéndome un martes a las once de la noche?',
      '(visto) … (contesta dos horas después) Perdón, día de locos. Contame.',
      'Antes de seguir: ¿vos sos de los que mandan audios de cuatro minutos? Porque ahí lo cortamos acá.',
      'Mi amiga dice que tenés cara de chamuyero. Yo todavía no me decidí.'
    ]},
  reencuentro: { mood:'liviano', interes:50,
    ctx:'Un cóctel del colegio de abogados, todos de pie. Se cruza con una ex compañera de la facultad que no ve hace quince años: la que le gustaba y a la que nunca le dijo nada. Está divorciada, le va bien, y también se acuerda de él. Tienen la historia en común a favor y quince años de distancia en contra.',
    opens:[
      '¡No! ¿Bertolasi? No te reconocí con las canas. Bueno, sí te reconocí: caminás igual.',
      '(lo mira de arriba abajo) Quince años. Vos me debés una explicación de por qué nunca me invitaste a salir.',
      'Yo te tenía como el callado del fondo que después iba a ser juez. ¿Qué pasó?',
      '(brinda) Por los que sobrevivimos a Procesal. Contame algo que no esté en tu LinkedIn.',
      'Me dijeron que hacés música. Mentira, ¿no? Vos eras el más serio de todos.',
      '(se acerca para que la escuche entre el ruido) Tenemos diez minutos antes de que me lleven a saludar gente. Aprovechalos.'
    ]},
  amiga: { mood:'liviano', interes:45,
    ctx:'Primera cita en un bar que venía bien. A los veinte minutos aparece una amiga de ella "de casualidad" y se sienta a la mesa. Es un test: la amiga es rápida, lo mide, y ella observa cómo la maneja él. En cada línea habla una de las dos; indicá cuál al principio entre paréntesis: (la amiga) o (ella). Él gana si trata bien a la amiga sin perder a ella: sin ignorar a ninguna, sin venderse, sin pedir permiso.',
    opens:[
      '(la amiga, sentándose) Hola. Vale. Ella no me contó nada de vos, así que tenés dos minutos para venderte.',
      '(ella, riéndose) No la escuches. Bueno, sí. Contestale.',
      '(la amiga) ¿Y vos qué hacés, aparte de traer a mi amiga a un bar un martes?',
      '(la amiga, a ella, como si él no estuviera) Está bien, eh. Tiene cara de que no te va a escribir a las tres de la mañana. ¿O sí?',
      '(ella) Ya está, ya la conociste. Ahora decime si te asustaste o seguimos.'
    ]},
  enfriada: { mood:'liviano', interes:30,
    ctx:'Segunda cita. Arrancó bien, pero hace diez minutos ella se enfrió: contesta corto, miró el teléfono dos veces, se acomodó lejos. No se va, todavía. Algo que él dijo o hizo la aburrió (habló de más de su trabajo, o se puso a explicarse) y él tiene que recuperar el estado sin explicarse, sin preguntarle qué pasa y sin perseguirla.',
    opens:[
      '(mira el teléfono, lo deja boca abajo) Perdón. Sí. ¿Qué me decías?',
      'Ajá. (silencio) Está lindo el lugar.',
      '(mira la hora) Mañana madrugo, ¿eh? Pero dale, seguí.',
      'Sí, sí. (toma el último sorbo) ¿Vos siempre hablás tanto de tu trabajo?',
      '(se acomoda el pelo, mira la barra) Mmm. ¿Pedimos la cuenta o querés otra?'
    ]},
  fiesta: { mood:'liviano', interes:40,
    ctx:'Cumpleaños de un amigo en una casa, mucha gente, música fuerte. La anfitriona lo agarra del brazo y lo presenta a una amiga que él no conoce: "Este es David, el que te conté". Ella queda enfrente con un vaso en la mano y una sonrisa de compromiso. Tienen la presentación forzada en contra y el ruido a favor: nadie espera una charla profunda, y cualquiera de los dos puede irse en cualquier momento.',
    opens:[
      '(sonrisa educada) "El que te conté". Ahora me tenés que decir qué te contaron a vos de mí, porque yo no sé nada.',
      'Ah, vos sos el abogado. Ya me dijeron que no te pregunte nada de derecho. ¿Qué te pregunto entonces?',
      '(mira a la anfitriona alejarse) Nos dejó solos a propósito. Qué poco disimulo. ¿Vos sabías?',
      'Dale, tenemos una canción de tiempo antes de que alguien nos rescate. Impresioname o no, pero rápido.',
      '(levanta el vaso) Estoy acá porque no tenía nada mejor que hacer. Vos también, no me mientas.'
    ]}
};
const pickOpen = (sc) => sc.opens[Math.floor(Math.random()*sc.opens.length)];
const LEVELS = {
  curiosa: 'Está intrigada y muerde fácil: cuando él deja una brecha, ella pregunta. Se ríe con facilidad. Aun así, si él se sobreexplica o se pone a enumerar credenciales, se aburre visiblemente.',
  normal:  'Muerde a veces y esquiva otras. Una brecha buena la hace preguntar; una brecha forzada la hace reírse y decir "chamuyero" o cambiar de tema. Castiga la explicación, el interrogatorio y el currículum. Premia la escena concreta, la provocación con red y la pregunta que sólo se contesta con una historia.',
  dificil: 'Esquiva casi todo. Se ríe de las líneas ensayadas, las nombra ("eso lo leíste en algún lado"), contesta con monosílabos cuando él interroga, y mira el teléfono si él monologa. Sólo se abre ante lo específico, lo verdadero y lo que no pide nada. Cuando se abre, se abre en serio.'
};

// ---------- negocios ----------
const SCENES_BIZ = {
  honorarios: { who:'Cliente', mood:'liviano', interes:50,
    ctx:'Su oficina. Un cliente de años, comerciante, que le trae un caso laboral nuevo y le quiere bajar los honorarios usando de referencia a otro abogado. No es agresivo: es hábil, y usa el afecto como palanca.',
    opens:[
      'Mirá, David, yo te aprecio, pero por lo mismo el otro abogado me cobra la mitad. ¿Qué hacemos?',
      'Te traigo el caso a vos porque confío, ¿no? Entonces confiá vos también y hacemelo por lo que puedo.',
      '(deja una carpeta sobre el escritorio) Esto es urgente. Y ya te aviso que no tengo para lo de la otra vez.',
      'Vos sabés que yo te mandé a mi cuñado, a mi socio, a medio barrio. Algo de eso tiene que valer, ¿no?'
    ]},
  socio: { who:'Socio', mood:'denso', interes:40,
    ctx:'Reunión con un inversor de un loteo, hombre de 55, mucho más rico que él, acostumbrado a que la gente se ponga nerviosa delante suyo. Habla poco, apura, pone a prueba. Respeta al que no se apura.',
    opens:[
      '(mira el reloj) Tengo veinte minutos. Los números que me mandaste no cierran y vos ya lo sabés. ¿Por qué estamos acá?',
      '(sin saludar) Leí lo tuyo. Está bien escrito. No me dice por qué tengo que poner la plata con vos y no con otro.',
      '(silencio largo mientras revisa el teléfono; después lo mira) …Dale.',
      'Mi contador me dice que no. Mi mujer me dice que no. Decime vos por qué sí, y sin vueltas.'
    ]},
  asamblea: { who:'Vecino', mood:'liviano', interes:45,
    ctx:'Asamblea de vecinos de un loteo, treinta personas en un salón. Un vecino de 60 años, el que siempre está en contra de todo, lo ataca en público. El resto mira. Lo que está en juego no es el argumento: es quién controla la sala.',
    opens:[
      'Perdón, pero acá el doctor viene a cobrar y los que ponemos la plata somos nosotros. Yo quiero que explique dónde fue el dinero de la luz.',
      '(de pie, al fondo) Yo hace tres asambleas que pregunto lo mismo y nadie me contesta. ¿Hoy tampoco?',
      '(a los demás, no a él) Ustedes fíjense cómo habla. Bonito, eh. Yo lo único que quiero es que me muestre un papel.',
      'Doctor, con respeto: a usted lo trajo el loteador. Usted no está de nuestro lado. Dígalo de frente.'
    ]},
  contraparte: { who:'Colega', mood:'liviano', interes:45,
    ctx:'Pasillo de tribunales, cinco minutos antes de una audiencia. El abogado de la contraria, un tipo de 50 con cancha, lo aborda con condescendencia amable para tantearlo y sacarle una concesión antes de entrar.',
    opens:[
      'Bertolasi. Che, te vi el escrito. Con todo respeto, no sé quién te dijo que eso prospera. ¿Arreglamos ahora o querés perder en Cámara?',
      '(le palmea el hombro) Pibe, yo litigo acá hace treinta años. Te lo digo por tu bien: esto no lo ganás. ¿Cuánto quiere tu cliente?',
      '(mirando su teléfono) Mi cliente tiene plata para cansarte. Vos no. Pensalo antes de entrar.',
      'Mirá, entre nosotros: tu demanda tiene un problema en la prueba y vos lo sabés. Te lo dejo pasar si cerramos hoy.'
    ]},
  mesa: { who:'Amigo', mood:'liviano', interes:50,
    ctx:'Asado con seis amigos de siempre. Uno de ellos, el más grandote y el más rápido, lo subestima en broma delante de todos, como hace siempre. La mesa se ríe. Es el juego de estatus del grupo.',
    opens:[
      '(a la mesa, riéndose) No, dejalo a David que él es el intelectual del grupo. Explicanos, Dave, qué opina Marco Aurelio del asado.',
      '(sirviendo) Che, ¿y el escritor cuándo nos firma un libro? ¿O hay que comprarlo? (risas)',
      '(a otro) Vos preguntale a David, que él te lo explica en tres cuartos de hora. (a David) Dale, contanos de tus lotes.',
      '(lo mira) Vos siempre tan tranquilo. ¿Qué pasa, no te importa nada o no te enterás de nada?'
    ]},
  jefe: { who:'Él', mood:'denso', interes:40,
    ctx:'Oficina de un empresario grande, potencial cliente importante. Lo trata con cordialidad de superior: amable, pero dejando claro quién tiene el poder. Mide si David se achica, se agranda o se queda en su lugar.',
    opens:[
      'Sentate, sentate. Me dijeron que sos bueno. Yo tengo poco tiempo y muchos abogados, así que convenceme.',
      '(sin levantar la vista de la pantalla) Hablá. Te escucho.',
      '(le sirve un café) ¿Vos sos el de los loteos? Interesante. Yo tuve un problema con uno de esos. Contame por qué el tuyo es distinto.',
      'Mirá, yo a los abogados les pago para que me digan que sí. Los que me dicen que no, duran poco. ¿Vos cuál sos?'
    ]},
  juez: { who:'Juez', mood:'denso', interes:45,
    ctx:'Audiencia de vista de causa en un Tribunal del Trabajo. El juez, de 60, con la sala llena, lo interrumpe con impaciencia y lo apura para que concilie por una cifra baja. No es hostil: está cansado y quiere cerrar el expediente. Lo trata de usted. Mide si el abogado sostiene su posición con respeto o se achica; castiga tanto la sumisión como la soberbia.',
    opens:[
      'Doctor, vamos al grano. Su cliente pide una cifra que este tribunal no va a dar. ¿Qué número real trae?',
      '(sin levantar la vista) Ya leí la demanda. Tres veces. Dígame algo que no esté escrito.',
      'Le doy dos minutos. Si no hay acuerdo se pasa a sentencia, y usted sabe cómo viene la jurisprudencia de esta sala.',
      'Doctor, con respeto: esto se arregla hoy o su cliente cobra en tres años. Explíqueselo usted, que es su abogado.'
    ]},
  indebido: { who:'Cliente', mood:'liviano', interes:50,
    ctx:'Su oficina. Un cliente importante, con varios expedientes en el estudio, le pide algo que no corresponde: presentar un certificado que no es del todo cierto, o "acomodar" una fecha en un contrato. Lo pide con naturalidad, como un favor entre amigos, y deja entrever que si no, se lleva los casos. Él tiene que decir que no sin sermonear, sin justificarse y sin perder al cliente si se puede.',
    opens:[
      'Mirá, es un detalle nomás. Ponés que el contrato se firmó en marzo y listo. Nadie lo va a mirar.',
      'David, yo te traigo cinco expedientes por año. Un favor te estoy pidiendo. Uno.',
      'El otro abogado me dijo que él lo hace sin problema. Vos siempre con los peros.',
      '(se ríe) No me hagas la cara de juez. Vos sabés cómo es esto. ¿Me lo hacés o no?'
    ]},
  comprador: { who:'Comprador', mood:'liviano', interes:50,
    ctx:'Oficina del loteo. Un comprador de un lote firmó boleto hace ocho meses, pagó la mitad, y ahora quiere echarse atrás o renegociar el saldo diciendo que el barrio no avanzó como le prometieron. Habla fuerte, mezcla quejas reales (hay una obra atrasada) con presión y amenazas de ir a Defensa del Consumidor. Cede sólo si él reconoce lo real sin ceder lo que no corresponde.',
    opens:[
      'A mí me dijeron que en un año había luz y calle. Pasaron ocho meses y hay un poste. Yo quiero mi plata.',
      'O me bajás el saldo a la mitad o vamos a Defensa del Consumidor. Elegí.',
      '(pone el boleto sobre la mesa) Esto lo firmé yo, sí. Pero vos también firmaste cosas. ¿Dónde está el agua?',
      'Mirá, yo no quiero pelear. Pero mi señora está enloquecida. Decime qué le digo.'
    ]},
  artista: { who:'Artista', mood:'liviano', interes:50,
    ctx:'Estudio de grabación. Un cantante de cumbia joven, con seguidores, al que él produce. Le pide un adelanto, quiere sacar el tema antes de que esté terminado y amenaza con irse con otro productor "que le ofrece más". Es simpático, afectuoso y manipulador: usa el "hermano", el ego y la urgencia. Respeta al que no se apura y le pone reglas claras sin enojarse.',
    opens:[
      'Dave, hermano, te quiero, pero el de La Plata me ofrece el doble y me saca el tema el viernes.',
      'Yo pongo la cara, vos ponés los botones. ¿Y el que factura sos vos? No cierra.',
      '(muestra el teléfono) Mirá los números del último. Eso lo hice yo. Necesito que me adelantes algo, aunque sea la mitad.',
      'Dale, sacalo así como está. Está bien. La gente no escucha esas cosas que vos escuchás.'
    ]},
  mediacion: { who:'Abogado de la ART', mood:'denso', interes:45,
    ctx:'Mediación por un accidente de trabajo. El abogado de la ART, frío y correcto, ofrece una cifra baja, habla de "lo que la Comisión Médica va a decir" y usa el tiempo contra él: sabe que el trabajador necesita la plata ya. Lo trata de doctor. Cede sólo ante alguien que no muestra apuro, no discute el baremo en su terreno y deja ver que puede levantarse e ir a juicio.',
    opens:[
      'Doctor, la oferta es esta. Es más de lo que su cliente va a cobrar en la Comisión, y lo sabemos los dos.',
      '(ordena papeles) Podemos cerrar hoy o nos vemos en dos años. Su cliente no tiene dos años. Usted decide.',
      'El baremo dice ocho por ciento. Su pericia dice veintidós. Vamos a dejar de jugar.',
      'Mire, entre colegas: mi cliente tiene un presupuesto por caso. Este es el número. No hay otro.'
    ]}
};
const LEVELS_BIZ = {
  curiosa: 'Es razonable: prueba una vez y, si él sostiene, cede terreno. Respeta la calma. Se pone difícil sólo si él se justifica o se agranda.',
  normal:  'Presiona de verdad. Usa el tiempo, el afecto, la comparación y el silencio. Cede sólo ante alguien que no se apura, no se justifica, pregunta en vez de discutir y sostiene el marco sin agredir. Castiga la justificación, el exceso de argumentos, la concesión rápida y la agresión.',
  dificil: 'No cede casi nunca. Interrumpe, cambia de tema, menosprecia con amabilidad, deja silencios incómodos. Sólo lo respeta si él aguanta el silencio, devuelve la pregunta, nombra el juego sin enojarse o está dispuesto a levantarse de la mesa. Cuando lo respeta, cambia de tono de golpe.'
};

// ---------- stats (persisten en este teléfono) ----------
const ST = { sessions:[], drills:[] };
try { Object.assign(ST, JSON.parse(localStorage.getItem('sparring.stats')||'{}')); } catch {}
const saveST = () => { try { localStorage.setItem('sparring.stats', JSON.stringify(ST)); } catch {} };
let cur = null; // sesión de sparring en curso
const fmtDate = (t) => new Date(t).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'}) + ' ' + new Date(t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
const setPin = (id, her, coach) => {
  const p = $(id); p.innerHTML = '';
  if (her) p.append(el('div','pher', her));
  if (coach) { const c = el('div','pcoach'); c.innerHTML = coach; p.append(c); }
};

// ---------- state ----------
let turns = [];           // {role, content} for sample()
let lastHerEnd = 0;       // ms when her last line finished (spoken or shown)
let sample = null, busy = false, count = 0, ctl = null;
let moodNow = 'liviano'; let interes = 50, hiStreak = 0;
const FASES = {
  A2: { n:'A2 · curiosidad y atracción', d:'ATRACCIÓN, interés masculino. Todavía no está atraída: te tiene etiquetado como "uno más" y está midiendo si sos un premio o un pretendiente. Lo que la mueve: demostrar valor sin declararlo (una escena con imagen, una historia con giro, un hilo abierto que no cerrás), hablar desde el yo (cómo te afecta algo, no el dato), el descaro con humor, el desinterés activo (no perseguir, no elogiar, no pedir), el tease con red, la restricción de tiempo o la falsa retirada, y sobre todo la calma: respuestas cortas, pausas, el que no se apura. Lo que la aleja: cualquier gesto de que la necesita, cumplidos al aspecto, preguntas de entrevista (más de dos seguidas), explicar, monólogo, buscar conexión antes de tiempo, regalar interés que ella no se ganó.' },
  A3: { n:'A3 · calificación', d:'ATRACCIÓN, interés femenino. Ya hay señales de ella (pregunta, se ríe, sostiene, reinicia la charla). Ahora él tiene que hacer que ELLA se gane algo: calificarla ("¿y vos qué tenés además de la cara?", "¿qué te hace distinta?"), ponerle una prueba chica (que haga o cuente algo), premiar con atención lo que ella ofrece y retirarla si no ofrece (push-pull, "sos divertida, lástima que…"). Ciclo: fomentar que invierta → detectar un mérito concreto (no "sos linda": "el idioma secreto que tenés con tu amiga") → expresarlo con avance. Lo que la mueve: que él tenga criterio y no la acepte gratis. Lo que la aleja: seguir en descaro puro sin dejarla entrar, o al revés, rendirse y volverse amable ahora que ella mostró interés; premiar sin que ella haya invertido. Es la fase donde más hombres fallan: creen que ya ganaron y aflojan.' },
  C1: { n:'C1 · conexión', d:'COMODIDAD, conexión. Ya está atraída; ahora lo que la mueve es que sea real: que él cuente algo verdadero con vulnerabilidad elegida (contada desde arriba, sin autocompasión, y que se cierre: un vistazo, no una confesión), que escuche de verdad y devuelva su última palabra, que sostenga un tema serio sin escaparse con un chiste, que haga la pregunta que sólo se contesta con una historia ("¿cómo sería un día perfecto para vos?", "¿de qué estás más orgullosa?", "¿quién sos, además de esto?"), que pase de hechos a gustos a sentimientos, que use el "nosotros" y que no esté de acuerdo con todo (el desacuerdo con calma sube el interés). Lo que la aleja: el cocky-funny permanente (no sabe parar), la brecha sostenida cuando ella ya se abrió (ahora es esquivo, no misterioso), el desinterés fingido (ahora se lee frío), resolverle el problema en vez de escucharla, contar la pena o la ex. Volver a lo liviano está bien cuando el momento denso ya cerró; escaparse de lo denso es error.' },
  C2: { n:'C2 · intimidad', d:'COMODIDAD profunda. Ya hay complicidad. Lo que la mueve: el nosotros (conspiración contra la sala, chistes internos, una palabra propia de los dos), la confesión gradual y recíproca, la calma total, tocar un tema difícil con cuidado, nombrar lo que está pasando entre los dos sin rematar ni pedir definición, insinuar lo siguiente con una excusa que la libere de responsabilidad. Lo que la aleja: volver a técnica (calificación, negs) cuando ya está adentro, apurar el cierre, ponerse solemne, hacer explícita la tensión antes de que ella la haya mostrado, pedir definiciones.' },
  C3: { n:'C3 · cierre', d:'Cierre de la noche. Ella ya decidió. Lo que la mueve: que él no se apure ni se ponga nervioso ahora que va bien, que proponga lo siguiente con naturalidad y como preferencia propia (otro bar, "esto sigue", "el jueves te llevo a X") con un por qué (el mérito que detectó) y con una salida fácil para ella, sin pedir permiso ni confirmación, que corte en un punto alto, que sostenga la calma hasta el final. Lo que la aleja: agradecer de más, festejar, pedir confirmación ("¿te parece?", "¿seguro?"), preguntar sí/no para escalar, cambiar de personalidad porque "ya está".' }
};
const faseCode = () => interes < 45 ? 'A2' : interes < 60 ? 'A3' : interes < 75 ? 'C1' : interes < 90 ? 'C2' : 'C3';
const faseNow = () => faseCode();
const setInteres = (v) => { interes = Math.max(0, Math.min(100, Math.round(Number(v)||0))); const f = $('ifill'); f.style.width = interes + '%'; f.classList.toggle('hi', interes >= 85); f.classList.toggle('lo', interes <= 20); $('inum').textContent = String(interes); };
const curScene = () => S.mode==='biz' ? SCENES_BIZ[S.sceneBiz] : SCENES[S.scene];
const herName = () => S.mode==='biz' ? (SCENES_BIZ[S.sceneBiz].who||'Contraparte') : 'Ella';
const rulesNow = () => S.mode==='biz' ? RULES_BIZ() : RULES();

// ---------- voice ----------
let voiceF = null, voiceM = null;
const pickVoice = () => {
  const vs = speechSynthesis.getVoices();
  const es = vs.filter(v => /^es/i.test(v.lang));
  const fem = /female|mujer|Paulina|Elena|Isabela|Lucia|Luciana|Mónica|Monica|Sabina|Helena|Camila/i, masc = /male|hombre|Diego|Jorge|Carlos|Enrique|Juan|Pablo|Andrés|Andres|Álvaro|Alvaro|Tomás|Tomas/i;
  voiceF = es.find(v => /AR|419/.test(v.lang) && fem.test(v.name)) || es.find(v => fem.test(v.name) || /Google español/i.test(v.name)) || es.find(v => /AR|419/.test(v.lang)) || es[0] || null;
  voiceM = es.find(v => /AR|419/.test(v.lang) && masc.test(v.name) && !fem.test(v.name)) || es.find(v => masc.test(v.name) && !fem.test(v.name)) || voiceF;
};
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
const speak = (text) => new Promise(res => {
  if (!S.voice || !('speechSynthesis' in window)) return res();
  const clean = text.replace(/\([^)]*\)/g, '').trim();
  if (!clean) return res();
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const voice = S.mode==='biz' ? voiceM : voiceF;
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'es-AR'; u.rate = S.mode==='biz' ? 0.95 : 0.92; u.pitch = S.mode==='biz' ? (voice===voiceF ? 0.75 : 0.95) : 1.05;
    u.onend = () => res(); u.onerror = () => res();
    speechSynthesis.speak(u);
    setTimeout(res, Math.min(15000, 400 + clean.length * 75)); // safety
  } catch { res(); }
});

// ---------- rendering ----------
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const scrollDown = () => { log.scrollTop = log.scrollHeight; };
const addHer = (text, thinking=false) => {
  const t = el('div','turn her'); t.append(el('span','who',herName()));
  const b = el('div','bubble' + (thinking?' thinking':''), text); t.append(b); log.append(t); scrollDown(); return b;
};
const addMe = (text, m) => {
  const t = el('div','turn me'); t.append(el('span','who','Vos'));
  t.append(el('div','bubble',text));
  const mt = el('div','metrics');
  mt.innerHTML = `<span>pausa <b>${(m.latency/1000).toFixed(1)}s</b> <small style="color:var(--ink3)">desde que tocaste el cuadro</small></span><span>palabras <b>${m.words}</b></span>` + (m.typingRatio!=null?`<span>ritmo <b>${m.wpm} ppm</b></span>`:'');
  t.append(mt); log.append(t); scrollDown();
};
const addCoach = (c) => {
  const t = el('div','coach'); t.append(el('span','who','Coach'));
  const f = el('div','flags');
  (c.flags||[]).slice(0,5).forEach(x => { const s = el('span','flag ' + (x.ok?'ok':'bad'), x.t); f.append(s); });
  t.append(f);
  if (c.nota) t.append(el('div',null, c.nota));
  if (c.mejor) { const m = el('div','mejor'); const b = el('b',null,'hubiese ido mejor'); m.append(b); m.append(document.createTextNode(c.mejor)); t.append(m); }
  log.append(t); scrollDown();
};
const setMood = (m) => { moodNow = m; moodEl.dataset.m = m; const base = ({liviano:'liviano',denso:'denso',perdido: S.mode==='biz' ? 'perdiste el marco' : 'la perdiste'})[m] || m; moodEl.textContent = (S.mode!=='biz' && m!=='perdido' && S.showFase) ? base + ' · ' + FASES[faseCode()].n : base; };

// ---------- pause gate ----------
let gateTimer = null, gateStart = 0;
const armGate = () => {
  clearInterval(gateTimer);
  if (!S.pause) { send.disabled = false; ringPath.setAttribute('stroke-dashoffset','0'); hint.textContent = 'decí lo tuyo'; hint.classList.remove('warn'); return; }
  send.disabled = true; gateStart = performance.now(); hint.textContent = 'uno… dos…'; hint.classList.add('warn');
  gateTimer = setInterval(() => {
    const p = Math.min(1, (performance.now() - gateStart) / 2000);
    ringPath.setAttribute('stroke-dashoffset', String(100 - p*100));
    if (p >= 1) { clearInterval(gateTimer); send.disabled = false; hint.textContent = 'ahora'; hint.classList.remove('warn'); }
  }, 50);
};

// ---------- prompt ----------
const RULES_BIZ = () => `Sos dos cosas a la vez en este ejercicio de entrenamiento de asertividad, y contestás SOLO con un objeto JSON.

1) LA CONTRAPARTE. ${SCENES_BIZ[S.sceneBiz].ctx} Tu temperamento hoy: ${LEVELS_BIZ[S.level]} Hablás en voseo rioplatense (o de usted si la escena lo dice: juez, mediación), frases cortas, como se habla en una reunión real. Podés usar acotaciones entre paréntesis: (mira el reloj), (se ríe), (silencio). Nunca sos caricatura: sos alguien que quiere algo y prueba cuánto puede sacar. Nunca nombrás reglas ni técnicas. Reaccionás al ESTADO de la interacción:
- liviano: tanteás, presionás con humor o afecto, ves qué hace.
- denso: presión real, silencio, tiempo, comparación; sostenés la mirada.
- perdido: él perdió el marco. Ya no lo tomás en serio: lo apurás, le pasás por arriba, cerrás el tema a tu favor o te vas.
Tu estado cambia según lo que él hace. Se vuelve "perdido" si él se justifica (explica por qué cobra lo que cobra, por qué hizo lo que hizo), apila argumentos, cede rápido, pide disculpas sin motivo, responde a la provocación con enojo, o se agranda (amenaza, credenciales, "yo soy abogado"). Se vuelve "denso" (te lo estás tomando en serio) si él hace una pausa, devuelve la pregunta ("¿qué te hace decir eso?"), nombra el juego sin enojo, ofrece opciones en vez de defender, o muestra que puede levantarse de la mesa. Vuelve a "liviano" si él desactiva con humor y mantiene el marco.

2) EL COACH DE ASERTIVIDAD. Evaluás la ÚLTIMA línea de él contra estas reglas. Como mucho 4 flags, cortos (2-4 palabras), ok=true si cumplió algo bien, ok=false si falló:
- se justificó / explicó de más / apiló argumentos
- pidió disculpas sin motivo / pidió permiso
- cedió el marco (aceptó la premisa del otro, discutió en su terreno)
- reaccionó a la provocación (enojo, ironía defensiva, agrandarse)
- concesión rápida (bajó el precio, aflojó, ofreció sin que le pidan)
- amenaza o credencial ("yo soy abogado", "te vas a arrepentir")
- devolvió la pregunta ("¿qué te hace decir eso?")
- nombró el juego sin enojo
- ofreció opciones (ilusión de control: "¿preferís A o B?")
- reencuadre (cambió de qué se está hablando)
- silencio o pausa bien usada
- dispuesto a irse (BATNA visible, sin drama)
- dio la razón en algo y redirigió (nunca "estás equivocado")
- reencuadró los números (achicó la diferencia, cambió la unidad)
- reto al ego ("quizás esto es mucho para vos")
- corto y firme (menos de 25 palabras)
- pausa: si latencia < 1.2 s marcá "respondió sin pausa"; entre 1.5 y 4 s "buena pausa"; > 8 s "se enfrió".
También das "nota": UNA frase corta, directa, en voseo, sobre lo más importante del turno. Y "mejor": una versión alternativa de lo que él dijo, de una o dos frases, que hubiese sostenido mejor el marco con las mismas intenciones; si su línea ya estaba bien, "mejor" es "". Sin moraleja ni teoría.

3) POSICIÓN. Además llevás un número de 0 a 100: cuánto terreno controla ${P.nombre} en esta interacción (50 = parejo, 100 = la contraparte cede a sus términos, 0 = le pasa por arriba). Te digo el valor actual en cada turno. Se mueve como un dimmer, no como un interruptor. Devolvés el nuevo valor y una "magnitud": "normal" (movimiento de -7 a +7: casi todos los turnos son esto), "notable" (de -12 a +12: una pausa perfecta, una pregunta devuelta que lo descoloca, o una justificación larga), "epico" (hasta +20: una jugada que cambia la reunión, rarísima; o -20 si cedió todo de golpe), "barbaridad" (cae a 0 y se termina: insulto, amenaza, agresión). Sube con la pausa, devolver la pregunta, nombrar el juego con calma, ofrecer opciones, reencuadrar, mostrar que puede irse, firmeza corta; baja con justificarse, apilar argumentos, ceder rápido, disculparse, reaccionar, amenazar o agrandarse. Un turno correcto pero sin brillo mueve +3 o +5. Sé CONSISTENTE: mismo criterio siempre, en el número y en el coach.
Si pasa de 85, la contraparte cede visiblemente (acepta los términos, cambia de tono, pide seguir hablando). Si baja de 15, cierra el tema a su favor y da por terminada la reunión.

FORMATO: contestá únicamente con JSON así, sin texto fuera. Dentro de los textos NO uses comillas dobles (si citás algo, usá comillas simples) ni saltos de línea:
{"reply":"lo que dice la contraparte","mood":"liviano|denso|perdido","interes":0-100,"magnitud":"normal|notable|epico|barbaridad","coach":{"flags":[{"t":"texto","ok":true}],"nota":"…","mejor":"…"}}`;

const RULES = () => `Sos dos cosas a la vez en este ejercicio de entrenamiento conversacional, y contestás SOLO con un objeto JSON.

1) ELLA. Una mujer de entre 38 y 44 años, argentina, rioplatense, inteligente, con vida propia. Está en esta escena: ${SCENES[S.scene].ctx} Su temperamento hoy: ${LEVELS[S.level]} Habla en voseo natural, frases cortas, como se habla en un bar. Puede usar acotaciones entre paréntesis para gestos: (se ríe), (mira el vaso). Si la escena es por chat, escribe como en WhatsApp: mensajes cortos, sin gestos, a veces con demora. Si la escena dice que hay una amiga en la mesa, cada línea empieza indicando quién habla. Nunca es un personaje complaciente ni una fantasía: tiene criterio, se aburre, se va si la aburren, y se abre cuando hay motivo. No nombra nunca reglas ni técnicas.
CÓMO FUNCIONA SU ATRACCIÓN (esto no es opinión, es el modelo del ejercicio, síntesis de la literatura de seducción y de los estudios de cortejo): la atracción es una emoción, no una decisión; viene ANTES que la comodidad y se produce en minutos, no en una frase. La produce el tipo que no busca su aprobación y que ella siente que se GANÓ: calma (habla poco, pausa, respuestas cortas), humor con descaro, el tira-y-afloja (un elogio con una retirada: "me caés bien, lástima que…"), la calificación (hacer que ELLA se gane algo: "todavía no me decidí sobre vos"), la restricción de tiempo o la falsa retirada, la escena concreta contada con imagen, la brecha que no se explica, hablar desde el yo (cómo le afecta algo, no el dato), las afirmaciones y suposiciones en vez de preguntas, el desacuerdo sereno (el que no está de acuerdo con todo le resulta más atractivo), el interés condicionado a un mérito concreto de ella. Ella llega con el escudo puesto: te asume "uno más" hasta que hacés algo que un pretendiente nunca haría. La MATA el tipo que busca conexión antes de tiempo: el que elogia su aspecto en los primeros minutos, el que está de acuerdo con todo, el que pregunta como en una entrevista (tres preguntas de dato seguidas), el que explica sus chistes, el que responde literalmente a una provocación de ella, el que muestra que necesita que la noche salga bien, el que regala interés que ella no se ganó, el que sigue alimentando una charla que ella dejó morir. Ella no premia la amabilidad: la da por descontada. Premia el nervio con red. Lógica retroactiva: cada vez que ella invierte (cuenta algo, pregunta, se ríe, cumple una prueba chica), su interés sube por haberlo hecho. Le importa cómo se siente ahora, no quién tiene razón: la lógica contra su emoción no funciona.
SUS TESTS (los hace más cuanto más le interesa; son señal de interés, no de rechazo): "eso se lo decís a todas", "¿me estás chamuyando?", "no sos mi tipo", "tengo novio", "eso lo leíste en algún lado", "qué raro sos", criticarle la ropa, pedirle algo (un trago, que le explique por qué está soltero), intentar hacer retroceder la charla cuando ya se puso íntima, quedarse callada a ver si él se llena de palabras. Los pasa el que no se defiende, no se justifica, no pide perdón, no niega la etiqueta ("sí, soy raro"), malinterpreta a su favor, comprime con humor, le da la razón y reencuadra, responde a la emoción y no a la frase, o ignora y sigue con lo suyo. Los pierde el que se explica.
FASES (modelo de la seducción por etapas; te digo la fase actual en cada turno; NO la nombres nunca en tu línea, sólo actuá según ella):
${Object.values(FASES).map(f => '- ' + f.n + ': ' + f.d).join('\n')}
La transición de A a C la decide ELLA con señales (pregunta personal, reinicia la charla cuando decae, se acerca, sostiene la mirada, se ríe con los ojos, se autocalifica, cumple una prueba chica), no él con un cambio de tema. Si él pasa a comodidad antes de las señales, se apuró. Si sigue en atracción después de las señales, no sabe leer. Si él sigue fomentando cuando ya podía avanzar, lo lee como miedo.
Reacciona al ESTADO de la conversación:
- liviano: habla más, se ríe, provoca de vuelta, tira tests.
- denso: habla menos y más lento, sostiene, no se ríe pero no se va.
- perdido: monosílabos, mira el teléfono, cambia de tema o dice que se tiene que ir.
Tu estado cambia según lo que él hace. Se vuelve "perdido" si él interroga (tres preguntas de dato seguidas), monologa (más de ~70 palabras), apila credenciales, explica un misterio que acaba de plantear, elogia su aspecto temprano, suplica aprobación, se disculpa ante un test, resuelve un problema que ella contó en vez de escucharlo, cuenta la ex o una pena, o pide permiso para avanzar. Se vuelve "denso" si él dice algo específico y verdadero, le devuelve una pregunta que sólo se contesta con una historia, sostiene un silencio, o no está de acuerdo con calma. Vuelve a "liviano" con humor de situación, descaro, un juego o rol inventado, o provocación con red.

2) EL COACH. NO sos un coach políticamente correcto ni amable. Evaluás SEGÚN LA FASE (te la digo en cada turno; el modelo es el de arriba). Regla general: en A2 premiá el valor demostrado, el descaro, la calma y el desinterés activo; castigá la conexión temprana, el cumplido y el interrogatorio. En A3 premiá la calificación, la prueba chica, el push-pull y el interés condicionado a un mérito concreto; castigá tanto el descaro sin dejarla entrar como aflojar y volverse amable, y premiar sin que ella haya invertido. En C1 y C2 premiá la conexión real, la vulnerabilidad elegida y cerrada, escuchar, el nosotros, el desacuerdo sereno y sostener lo serio; castigá el cocky-funny permanente, la brecha esquiva cuando ella ya se abrió, escaparse de lo denso con un chiste y contar la pena. En C3 premiá proponer lo siguiente con calma, con por qué y con salida fácil; castigá festejar, agradecer de más, pedir confirmación o preguntar sí/no para escalar. Un cambio de registro con pie de ella o después de un silencio cómodo se PREMIA como "buen cambio de registro"; sin pie ni timing se marca "cambio de registro apurado". Evaluás la ÚLTIMA línea de él. Como mucho 4 flags, cortos (2-4 palabras), ok=true si cumplió algo bien y ok=false si falló:
PREMIÁ (ok=true): cocky-funny / descaro con humor · push-pull · calificación (ella se lo tiene que ganar) · prueba chica (le pidió algo mínimo) · falsa retirada / restricción de tiempo · brecha bien sostenida (dijo y no explicó) · hilo abierto (dejó algo sin cerrar) · escena concreta (lugar, hora, objeto) · habló desde el yo (emoción, no dato) · afirmación en vez de pregunta (supuso, adivinó, acusó en broma) · pregunta que abre historia · nosotros · mérito concreto (elogió algo específico que ella hizo o dijo, no el cuerpo) · provocación con red (contra la situación o una categoría, no contra ella) · pasó el test (no se defendió: judo, comprimió, aceptó la etiqueta, tradujo la emoción, ignoró y siguió) · desacuerdo sereno · sostuvo el silencio / vacío · juego o rol inventado · historia corta con devolución a ella · cortó en alto · escaló con excusa (le dio a ella una salida) · buena pausa (latencia 1.5 a 4 s) · corto y firme.
CASTIGÁ (ok=false): explicó la brecha / aclaró ("es un chiste") / justificó · terminó con verificación ("¿entendés?", "¿viste?", "¿no?") · adjetivos calificativos (increíble, hermoso) en vez de imagen · interrogatorio (pregunta de dato: edad, trabajo, de dónde sos; o más de dos preguntas seguidas) · currículum (credenciales apiladas o el "qué" de un logro cuando debía dejar hueco) · monólogo (más de 70 palabras) · resolvió el problema de ella en vez de escuchar · se rió antes que ella / sarcasmo defensivo · cumplido a su aspecto temprano · de acuerdo con todo / hombre sí · busca conexión antes de tiempo · regaló interés (elogio o avance sin mérito de ella) · pidió permiso o aprobación ("¿te puedo…?", "¿te parece?") · se disculpó ante un test / negó la etiqueta · respondió literal a una provocación (se defendió) · lógica contra emoción · contó la ex o la pena · reconfirmó ("¿el jueves, no?") · hizo explícita la tensión antes de tiempo · siguió alimentando una charla que ella dejó morir · insulto real, no tease (el neg como agresión se lee como inseguridad a esta edad) · respondió sin pausa (latencia < 1.2 s) · se enfrió (latencia > 8 s).
También das "nota": UNA frase corta, directa, en voseo, sobre lo más importante del turno (qué hizo bien o el error principal). Y "mejor": una versión alternativa de lo que él dijo, de una o dos frases, que hubiese funcionado mejor con las mismas intenciones; usá los mecanismos del modelo (afirmación en vez de pregunta, judo, traducción de la emoción, mérito concreto, hilo abierto, escala con excusa); si su línea ya estaba bien, "mejor" es "" (vacío). Sin moraleja, sin explicar teoría, sin nombrar libros ni autores.

3) INTERÉS. Además llevás un número de 0 a 100: cuánto le interesa a ella seguir con él esta noche. Te digo el valor actual en cada turno. Se mueve como un dimmer, no como un interruptor. Devolvés el nuevo valor y una "magnitud": "normal" (movimiento de -7 a +7: casi todos los turnos son esto), "notable" (de -12 a +12: una escena concreta muy buena, un test pasado con timing, una brecha sostenida, o un monólogo de currículum), "epico" (hasta +20: un momento que ella va a recordar, rarísimo; o -20 si la hizo sentir usada), "barbaridad" (cae a 0 y se termina: grosería sexual, agresión, humillación). Sube con lo específico, la brecha sostenida, la provocación con red, la pregunta que abre historia, la afirmación que la obliga a corregirlo, el test pasado, la calma; baja con la explicación, el interrogatorio, el currículum, el monólogo, la necesidad, la disculpa, el chiste que se ríe solo. Un turno correcto pero sin brillo mueve +3 o +5. Sé CONSISTENTE: la misma línea en el mismo contexto merece el mismo movimiento; usá el criterio, no el humor del momento. El coach también: mismo criterio, misma evaluación.
Si el interés pasa de 85, ella empieza a dar señales claras (se acerca, propone otra copa, le pregunta cosas personales). Si baja de 15, se enfría del todo y busca cómo irse.

FORMATO: contestá únicamente con JSON así, sin texto fuera. Dentro de los textos NO uses comillas dobles (si citás algo, usá comillas simples) ni saltos de línea:
{"reply":"lo que ella dice","mood":"liviano|denso|perdido","interes":0-100,"magnitud":"normal|notable|epico|barbaridad","coach":{"flags":[{"t":"texto","ok":true}],"nota":"…","mejor":"…"}}`;
const repairJson = (t) => {
  const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  const src = t.slice(a, b + 1); let out = '', inStr = false, esc = false;
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
const parseMaybe = (t) => { if (!t) return null; try { return JSON.parse(t); } catch {} const m = t.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} } return repairJson(String(t)); };
// pide JSON; si viene roto, lo repara; si no se puede, reintenta una vez
const askJson = async (msgs, opts) => {
  for (let i = 0; i < 2; i++) {
    try { return await sample.json(msgs, opts); }
    catch (e) {
      if (e?.code === 'invalid_json') { const d = parseMaybe(e.text || ''); if (d) return d; if (i === 0) continue; }
      throw e;
    }
  }
};

// ---------- flow ----------
const start = async () => {
  $('setup').style.display = 'none'; $('stage').style.display = 'flex';
  log.innerHTML = ''; $('balance').style.display='none'; turns = []; count = 0; hiStreak = 0; input.disabled = false; $('hdrR').dataset.hide = S.showMeter ? '0' : '1';
  cur = { t: Date.now(), mode: S.mode, scene: S.mode==='biz'?S.sceneBiz:S.scene, level: S.level, turns: 0, lostAt: null, bad: {}, latencies: [], words: [] };
  const sc = curScene(); setMood(sc.mood); setInteres(sc.interes); cur.start = sc.interes; cur.hist = [sc.interes];
  let open = pickOpen(sc);
  if (S.freshOpen) { try { const o = await (sample || (sample = await window.claude?.use?.('sample')))?.json?.(`Escena: ${sc.ctx} Escribí UNA sola línea de apertura que diría ${S.mode==='biz'?'la contraparte':'ella'} para arrancar, en voseo rioplatense, máximo 30 palabras, distinta de estas: ${sc.opens.slice(0,3).join(' | ')}. Contestá SOLO con JSON: {"open":"…"}`, { modelTier:'quick', cache:false }); if (o?.open) open = String(o.open); } catch {} }
  addHer(open); setPin('pin', open, '');
  turns.push({ role:'assistant', content: JSON.stringify({reply: open, mood: sc.mood, interes: sc.interes}) });
  await speak(open);
  lastHerEnd = performance.now();
  armGate();
  if (!sample) { sample = await window.claude?.use?.('sample'); if (!sample) { hint.textContent = 'Claude no disponible en esta vista'; send.disabled = true; } }
};

let typingStart = 0, focusAt = 0;
input.addEventListener('focus', () => { if (!focusAt) focusAt = performance.now(); });
input.addEventListener('input', () => {
  if (!typingStart && input.value.trim()) typingStart = performance.now();
  input.style.height = 'auto'; input.style.height = Math.min(140, input.scrollHeight) + 'px';
});
input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !send.disabled) { e.preventDefault(); go(); } });
send.addEventListener('click', go);

async function go() {
  const text = input.value.trim(); if (!text || busy || !sample) return;
  busy = true; send.disabled = true; clearInterval(gateTimer);
  const now = performance.now();
  const latency = Math.max(0, (typingStart || now) - (focusAt || lastHerEnd));
  const words = text.split(/\s+/).filter(Boolean).length;
  const typingMs = typingStart ? now - typingStart : 0;
  const wpm = typingMs > 0 ? Math.round(words / (typingMs/60000)) : null;
  addMe(text, { latency, words, wpm, typingRatio: wpm });
  if (cur) { cur.turns++; cur.latencies.push(latency); cur.words.push(words); }
  input.value = ''; input.style.height = 'auto'; typingStart = 0; focusAt = 0; count++; input.blur();
  setPin('pin', '', herName().toLowerCase() + ' piensa…');

  const userTurn = { role:'user', content: `[latencia: ${(latency/1000).toFixed(1)} s · palabras: ${words} · estado actual: ${moodNow} · interés actual: ${interes} · fase: ${S.mode==='biz' ? '-' : faseCode()}]\nÉl dice: ${text}` };
  turns.push(userTurn);
  const ctxTurns = turns.slice(-14);
  const bubble = addHer('…', true); hint.textContent = herName().toLowerCase() + ' piensa'; hint.classList.remove('warn');
  ctl = new AbortController();
  try {
    const data = await askJson([{ role:'user', content: rulesNow() }, ...ctxTurns], { modelTier:'quick', cache:false, signal: ctl.signal });
    const reply = String(data?.reply || '…'); const mood = ['liviano','denso','perdido'].includes(data?.mood) ? data.mood : moodNow;
    bubble.textContent = reply; bubble.classList.remove('thinking'); setMood(mood);
    if (data?.interes != null) {
      const prev = interes; const want = Math.max(0, Math.min(100, Number(data.interes)||prev));
      const mag = String(data.magnitud||'normal'); const cap = ({normal:7, notable:12, epico:20})[mag] ?? 7;
      let next = mag === 'barbaridad' ? 0 : prev + Math.max(-cap, Math.min(cap, want - prev));
      setInteres(next); if (cur) { (cur.hist ||= [cur.start ?? prev]).push(interes); } setMood(moodNow);
      if (mag === 'barbaridad') { hiStreak = 0; }
    }
    turns.push({ role:'assistant', content: JSON.stringify({reply, mood, interes}) });
    hiStreak = interes >= 85 ? hiStreak + 1 : 0;
    if (cur) cur.peak = Math.max(cur.peak||0, interes);
    if (S.coach && data?.coach) addCoach(data.coach);
    const cflags = (data?.coach?.flags||[]);
    if (cur) { if (mood === 'perdido' && cur.lostAt == null) cur.lostAt = cur.turns; cflags.filter(f=>!f.ok).forEach(f => { cur.bad[f.t] = (cur.bad[f.t]||0)+1; }); saveSession(); }
    setPin('pin', reply, S.coach && data?.coach ? (cflags.map(f=>`<b>${f.ok?'✓':'✗'}</b> ${f.t}`).join(' · ') + (data.coach.nota?'<br>'+data.coach.nota:'') + (data.coach.mejor?'<br><i>mejor: '+data.coach.mejor+'</i>':'')) : '');
    scrollDown();
    await speak(reply);
    if (hiStreak >= 2 || interes <= 10 || (mood === 'perdido' && (cur?.lostAt != null) && cur.turns - cur.lostAt >= 3)) await endScene(hiStreak >= 2);
  } catch (e) {
    if (e?.code === 'invalid_json' && e.text) {
      const d = parseMaybe(e.text); if (d?.reply) { bubble.textContent = d.reply; bubble.classList.remove('thinking'); turns.push({role:'assistant',content:JSON.stringify({reply:d.reply,mood:d.mood||moodNow})}); if (S.coach && d.coach) addCoach(d.coach); await speak(d.reply); }
      else { bubble.textContent = S.mode==='biz' ? '(mira el teléfono) …¿Qué decías?' : (S.scene==='whatsapp' ? '(escribiendo…) … (se corta) ¿Qué me decías?' : '(se distrajo mirando la barra) …¿Qué decías?'); bubble.classList.remove('thinking'); turns.pop(); }
    } else if (e?.code === 'not_granted' || e?.code === 'sampling_disabled') {
      bubble.textContent = 'Esta vista no tiene permiso para usar Claude. Sin eso, ella no puede contestar.'; bubble.classList.remove('thinking'); busy = false; return;
    } else if (e?.code === 'rate_limited') {
      bubble.textContent = '(mira el teléfono) Dame un minuto.'; bubble.classList.remove('thinking'); turns.pop();
    } else if (e?.code !== 'cancelled') {
      bubble.textContent = S.mode==='biz' ? '(no te escuchó) ¿Cómo?' : '(no te escuchó por la música) ¿Qué?'; bubble.classList.remove('thinking'); turns.pop();
    }
  } finally {
    busy = false; lastHerEnd = performance.now(); armGate();
  }
}
const endScene = async (won) => {
  if (!cur || cur.result) return;
  cur.result = won ? 'gano' : 'perdio'; saveSession();
  const box = $('balance'); box.style.display = 'block';
  box.innerHTML = `<h2>${won ? (S.mode==='biz' ? 'Cedió. Ganaste el marco.' : 'Se quedó. Ganaste la noche.') : (S.mode==='biz' ? 'Te pasó por arriba.' : 'Se fue.')}</h2>`;
  const biz = S.mode==='biz'; const lbl = biz ? 'Posición final' : 'Interés final';
  box.append(document.createTextNode(won ? `${lbl} ${interes}. Turnos: ${cur.turns}. Queda registrada como escena ganada.` : `${lbl} ${interes}. Turnos: ${cur.turns}. ${biz ? 'Perdiste el marco' : 'La perdiste'} en el turno ${cur.lostAt ?? cur.turns}. Tocá "${biz ? 'Cerrar la reunión' : 'Cerrar la noche'}" para el balance, o "Otra escena".`));
  $('hdrR').dataset.hide = '0';
  if (cur.hist && cur.hist.length > 1) { const c = el('div','curve'); const mx = Math.max(...cur.hist); c.innerHTML = 'Curva: ' + cur.hist.map(v => v === mx ? `<b>${v}</b>` : String(v)).join(' → ') + (S.mode!=='biz' ? '<br>Llegaste hasta: <b>' + FASES[(mx<45?'A2':mx<60?'A3':mx<75?'C1':mx<90?'C2':'C3')].n + '</b>' : ''); box.append(c); }
  send.disabled = true; input.disabled = true; hint.textContent = won ? 'ganada' : 'terminada'; clearInterval(gateTimer);
  scrollDown();
};
const saveSession = () => {
  if (!cur) return;
  const i = ST.sessions.findIndex(s => s.t === cur.t);
  const rec = { t:cur.t, mode:cur.mode||'rel', scene:cur.scene, result:cur.result||null, peak:cur.peak||0, hist:cur.hist||[], level:cur.level, turns:cur.turns, lostAt:cur.lostAt, bad:cur.bad, avgLat: cur.latencies.length? cur.latencies.reduce((a,b)=>a+b,0)/cur.latencies.length : 0, avgWords: cur.words.length? cur.words.reduce((a,b)=>a+b,0)/cur.words.length : 0 };
  if (i >= 0) ST.sessions[i] = rec; else ST.sessions.push(rec);
  if (ST.sessions.length > 60) ST.sessions = ST.sessions.slice(-60);
  saveST();
};

$('start').addEventListener('click', start);
$('btnReset').addEventListener('click', () => { ctl?.abort(); try{speechSynthesis.cancel();}catch{} $('stage').style.display='none'; $('setup').style.display='flex'; });

// ================= REFLEJO =================
const JABS = [
  // sobre cómo está
  'Uy, vos sos de los que piensan mucho antes de hablar, ¿no? Se te nota.',
  '¿Siempre sos así de serio o es que te intimido un poco?',
  'Estás sentado como si te fueran a tomar examen.',
  'Te noto muy cómodo. Sospechoso.',
  'Relajá los hombros que no te voy a morder. Todavía.',
  'Tenés cara de que ya sabés cómo termina esto.',
  'Me parece que me estás analizando. Tranquilo, no hay nada que encontrar.',
  'Vos hablás con las manos cuando mentís. Ya lo vi dos veces.',
  '¿Me estás escuchando o estás armando la próxima frase?',
  'Sonreíste de costado. ¿Eso fue a propósito?',
  // oficio
  'Tenés cara de abogado. No sé si es un elogio.',
  'Ah, abogado. ¿Y cuánto me sale esta charla?',
  'Vos debés ganar todas las discusiones. Qué cansador.',
  'Decime que no me vas a hacer firmar nada al final.',
  'Se te cayó una pregunta de currículum. Ahí, al lado del vaso.',
  'Hacés música. Claro. ¿Y también tenés un podcast?',
  'Cumbia y clásica. O sea que no te decidís por nada.',
  'Escritor. ¿De esos que te cuentan el libro entero en la primera cita?',
  'Vendés lotes. Contame la parte donde no me tratás de vender uno.',
  'Tres trabajos. ¿Cuál es el que hacés cuando no te mira nadie?',
  // edad / historia
  'Tres hijos, tres madres. Qué eficiencia.',
  '¿A esta altura ya perdiste la cuenta de las primeras citas?',
  'Vos sos de los que dicen "yo no soy celoso". Todos los celosos dicen eso.',
  'A ver, ¿cuál es la excusa oficial de por qué estás soltero?',
  'Cuarenta y pico y en una app. Qué salió mal.',
  'Seguro tenés una ex que "no entendió nada".',
  'Apuesto a que en tu casa mandás vos. En tu cabeza.',
  'Ya sé: sos el bueno de la historia. Siempre son los buenos.',
  'Con esa edad tendrías que tener menos dudas y más ganas.',
  '¿Todavía te ponés nervioso o eso se te fue con el pelo?',
  // gustos
  'Apuesto a que tenés una playlist que se llama "para pensar".',
  'Mirá que yo no salgo con tipos que usan la palabra "interesante".',
  'Decime tres cosas que te gusten y que no sean el asado.',
  'Estoico. Claro. ¿Y eso cuánto te dura en un embotellamiento?',
  'Vos leés para citar, no para leer. Se nota en cómo lo decís.',
  'Seguro tu comida favorita es "lo que haya".',
  '¿Nasrudín? ¿Eso es un vino?',
  'Filosofía de dos mil años. ¿Y de esta semana qué tenés?',
  // la cita
  'Bueno, pasaron veinte minutos y todavía no me hiciste reír. Reloj.',
  '¿Ese es tu mejor intento de conversación o estás calentando?',
  'Este bar lo elegiste vos. Ya me dice bastante.',
  'Si esto fuera una entrevista, ¿cómo te iría?',
  'Te doy cinco minutos más. Después me decido.',
  'Estoy esperando el momento en que dejes de ser amable.',
  'Eso que dijiste recién, ¿lo probaste con otra antes?',
  'Eso lo leíste en algún lado. Decime dónde.',
  'Qué frase. ¿La tenés ensayada o te salió sola?',
  'No te creo ni la mitad. Pero seguí.',
  'Me estás mintiendo y me gusta cómo lo hacés.',
  'Dale, contame algo que no le contás a nadie. Ahora.',
  // estatus / test
  'Yo no soy de las que se impresionan fácil, te aviso.',
  'La última vez que un tipo me dijo eso, no hubo segunda cita.',
  'Mis amigas ya me están escribiendo para saber si me voy.',
  '¿Cuántas citas tuviste este mes? Y no me mientas.',
  'Si te digo que me quiero ir, ¿qué hacés?',
  '¿Vos sabés que me puedo levantar e irme, no?',
  'Sos lindo, pero no tanto como para eso que acabás de decir.',
  'Me parece que estás acostumbrado a que te digan que sí.',
  'A ver si adivino: ahora viene la parte donde me preguntás de mí.',
  'Dejá de hacer preguntas. Decí algo.',
  // aplicaciones / época
  'En tu perfil parecías más alto.',
  'Tu foto es de hace cuánto, ¿tres años? Cinco.',
  'Te tenía como el tipo que escribe "hola, cómo va" y desaparece.',
  '¿Cuántas conversaciones abiertas tenés ahora mismo en el teléfono?',
  'Vos sos de los que dicen "yo casi no uso la app". Todos dicen eso.',
  'Tu descripción decía "sin drama". Los que dicen eso son el drama.',
  // tests de la literatura
  'Eso se lo decís a todas.',
  '¿Me estás chamuyando? Decime la verdad.',
  'No sos mi tipo. Pero seguí, que me divierto.',
  'Tengo novio. Bueno, casi.',
  'No le doy mi número a cualquiera.',
  '¿Por qué me hablás a mí, con todas las que hay acá?',
  'Qué raro sos. En serio.',
  'Esa camisa, ¿la elegiste vos o te la eligieron?',
  'Decime algo de vos que no sea tu trabajo.',
  '¿Y vos qué tenés además de la labia?',
  'Sos muy bueno. Demasiado. Desconfío.',
  'Contame de tu ex. Dale, una sola.',
  'Pagás vos, ¿no? Vos sos el hombre.',
  'Me estoy aburriendo. Hacé algo.',
  'No deberíamos estar hablando de esto en la primera cita.',
  'Vos no me conocés. No te hagas el que sí.',
  '(se queda callada, te mira, no dice nada)',
  'Esperá, ¿eso fue una indirecta?',
  'Sos de los que después escriben "llegaste bien?". Lo sé.',
  'Convenceme de que no sos igual a los otros.',
  // cortos y secos
  'Mmm. No.',
  'Aburrido.',
  'Eso no fue gracioso y te reíste vos.',
  'Repetilo, que no te creo.',
  '¿Y?',
  'Ajá. Seguí.'
];
const JABS_BIZ = [
  'Mirá, con todo respeto, el otro abogado me cobra la mitad.',
  '¿Vos estás seguro de esto o me lo decís para que me quede tranquilo?',
  'No me convence. Convenceme.',
  'Tengo cinco minutos. Andá al grano.',
  'Eso ya lo intentaron otros y no funcionó.',
  'Perdón, ¿y vos quién sos exactamente en todo esto?',
  '(silencio largo) …Seguí.',
  'Dejalo a David que él es el intelectual. Explicanos, Dave.',
  'No, no, eso no es lo que acordamos.',
  'Yo no te pago para que me digas lo que no se puede.',
  '¿Y si me voy con otro? ¿Qué pasa?',
  'Todos los abogados dicen lo mismo.',
  'Me parece que estás nervioso.',
  'Bajame el precio y cerramos ahora.',
  'Eso lo puedo hacer yo solo, ¿para qué te necesito?',
  'No me gusta cómo lo estás manejando.',
  '¿Eso lo decís vos o lo dice la ley?',
  'Sos joven todavía para esto.',
  'Ok. ¿Y?',
  'Te veo muy confiado para alguien que todavía no ganó nada.',
  'Mi cuñado es abogado y dice otra cosa.',
  'Mirá, yo confío en vos, pero necesito que me confirmes que esto sale bien.',
  'Vos ganás igual, pierda o gane. Yo no.',
  'Che, ¿esto es lo mejor que tenés?',
  'No me interrumpas. Terminá de escucharme.',
  'Hablalo con mi socio, yo no decido estas cosas.',
  'Sí, sí, muy lindo. ¿Cuánto?',
  'Si fueras tan bueno no estarías acá.',
  'Eso es un no, entonces.',
  'Perdón, me perdí. ¿Qué querés de mí?'
];
const dlog = $('dlog'), dinput = $('dinput'), dsend = $('dsend'), dhint = $('dhint'), dfill = $('dfill'), dcount = $('dcount');
let dRound = 0, dTimer = null, dStart = 0, dBusy = false, dResults = [], dJab = '', dUsed = [], dFresh = [];
const DTOTAL = 10, DMS = 6000;
let dSeen = []; try { dSeen = JSON.parse(localStorage.getItem('sparring.seen')||'[]'); } catch {}
const markSeen = (i) => { dSeen.push(i); if (dSeen.length > Math.floor(JABS.length*0.7)) dSeen = dSeen.slice(-Math.floor(JABS.length*0.7)); try { localStorage.setItem('sparring.seen', JSON.stringify(dSeen)); } catch {} };

const nextJab = () => {
  if (dFresh.length) return dFresh.shift();
  const POOL = S.mode==='biz' ? JABS_BIZ : JABS;
  let pool = POOL.map((j,i)=>i).filter(i => !dUsed.includes(i) && !dSeen.includes(i));
  if (!pool.length) pool = POOL.map((j,i)=>i).filter(i => !dUsed.includes(i));
  const i = pool[Math.floor(Math.random()*pool.length)]; dUsed.push(i); if (S.mode!=='biz') markSeen(i); return POOL[i];
};
const fetchFresh = async () => {
  try {
    const arr = await sample.json(S.mode==='biz' ? `Sos un interlocutor de negocios difícil (cliente que regatea, socio que apura, vecino que ataca en asamblea, abogado de la contraria, amigo que subestima en una mesa, empresario con poder). El otro es ${P.nombre}, ${P.edad}, ${P.oficio}. Escribí 10 frases de presión que le dirías para probar si sostiene el marco: cortas (máximo 18 palabras), en voseo rioplatense, realistas, sin insultos, variando el tipo (regateo, apuro, comparación, menosprecio amable, silencio, cambio de tema, pedido de garantía, test de estatus). Contestá SOLO con un JSON array de 10 strings.` : `Sos una mujer de 40 años, argentina, rioplatense, con humor filoso, en una primera cita en un bar con un hombre de ${P.edad}: ${P.bioCitas}. Escribí 10 pinchazos en broma que le tirarías para probarlo: provocadores, cortos (máximo 18 palabras), en voseo, ninguno cruel ni insultante, todos con salida cómica. Variá los ángulos: su oficio, su edad, su historia, sus gustos, la cita misma, lo que acaba de decir, tests de estatus, algo seco de dos palabras. Nada de estos que ya usó: ${JABS.slice(0,20).join(' | ')}. Contestá SOLO con un JSON array de 10 strings.`, { modelTier:'quick', cache:false });
    if (Array.isArray(arr)) dFresh = arr.filter(x => typeof x === 'string' && x.trim()).slice(0,10);
  } catch { dFresh = []; }
};
const showJab = async () => {
  dRound++; dcount.textContent = `${dRound} / ${DTOTAL}`;
  dJab = nextJab();
  const j = el('div','jab'); const w = el('span','who', herName() + ' · '); j.append(w); j.append(document.createTextNode(dJab)); dlog.append(j); dlog.scrollTop = dlog.scrollHeight;
  dinput.value=''; dinput.disabled = true; dsend.disabled = true; dfill.style.width='100%'; dfill.classList.remove('late'); dhint.textContent='…';
  setPin('dpin', dJab, '');
  await speak(dJab);
  dinput.disabled = false; dsend.disabled = false;
  dStart = performance.now(); dhint.textContent = 'seis segundos';
  clearInterval(dTimer);
  dTimer = setInterval(() => {
    const t = performance.now() - dStart; const left = Math.max(0, 1 - t/DMS);
    dfill.style.width = (left*100) + '%';
    if (t > DMS) { dfill.classList.add('late'); dhint.textContent = 'tarde. decilo igual'; clearInterval(dTimer); }
  }, 60);
};
const dGo = async () => {
  if (dBusy) return;
  const text = dinput.value.trim(); const ms = performance.now() - dStart;
  clearInterval(dTimer); dBusy = true; dsend.disabled = true; dinput.disabled = true;
  const said = text || '(silencio)';
  const box = el('div','dres'); const you = el('div','you'); const b = el('b',null,said); you.append(document.createTextNode('Vos: ')); you.append(b); box.append(you);
  const sc = el('div','score', `${(ms/1000).toFixed(1)} s · evaluando…`); box.append(sc); dlog.append(box); dlog.scrollTop = dlog.scrollHeight;
  try {
    const d = await askJson(S.mode==='biz' ? `Ejercicio de reflejo en negociación. Una contraparte difícil le tira a ${P.nombre} (${P.oficio}, ${P.edad}) una frase de presión. Él tiene seis segundos. Evaluá su respuesta por asertividad: 1) ¿sostuvo el marco desde la calma (no se justificó, no cedió rápido, no se agrandó, no reaccionó a la provocación)? 2) ¿usó una de estas: devolver la pregunta, nombrar el juego sin enojo, ofrecer opciones, reencuadrar, silencio deliberado, mostrar que puede irse? 3) ¿fue corto? Más de 25 palabras es malo. Un silencio o un "…seguí" con calma puede ser bueno; penalizá defenderse y ceder. Tiempo: ${(ms/1000).toFixed(1)} s (más de 6 es tarde).\nPresión: "${dJab}"\nRespuesta de él: "${said}"\nContestá SOLO con JSON (sin comillas dobles ni saltos de línea dentro de los textos): {"puntos": entero 0-10, "veredicto": "una frase corta y directa en voseo", "alt1": "respuesta alternativa que sostiene el marco, corta", "alt2": "otra alternativa de registro distinto (una que devuelve la pregunta, una que ofrece opciones o nombra el juego)"}` : `Ejercicio de reflejo conversacional. Ella (mujer de 40, primera cita, bar) le tira un pinchazo en broma a él. Él tiene seis segundos para contestar. Evaluá la respuesta de él con este criterio, en este orden de importancia: 1) ¿reaccionó desde la calma (no se defiende, no se justifica, no pide perdón, no niega la etiqueta, no compite por ganar) o se defendió/explicó/se ofendió? 2) ¿usó alguna de estas salidas: malinterpretar a su favor, comprimir con humor, darle la razón y reencuadrar (judo), aceptar la etiqueta y jugarla ("sí, soy raro"), responder a la emoción y no a la frase, devolverle una prueba chica, cambio de magnitud (exagerar lo mínimo o minimizar lo enorme), respuesta sorpresa (la emoción contraria a la esperada), absurdo o rol inventado, o ignorar y seguir con lo suyo? La provocación con red va contra la situación o una categoría, nunca contra ella. 3) ¿fue corto? Más de 20 palabras es malo. Un silencio o un "…bien" dicho con calma puede ser una respuesta VÁLIDA y hasta buena: no penalices el no rematar, penalizá el defenderse. Tiempo: ${(ms/1000).toFixed(1)} s (más de 6 es tarde; menos de 1.5 con una respuesta buena es excelente).
Pinchazo de ella: "${dJab}"
Respuesta de él: "${said}"
Contestá SOLO con JSON (sin comillas dobles ni saltos de línea dentro de los textos): {"puntos": entero 0-10, "veredicto": "una frase corta y directa en voseo, sin moraleja", "alt1": "un remate alternativo, corto, desde la calma", "alt2": "otro remate alternativo distinto en registro (uno de judo o de aceptar la etiqueta, uno de no-reacción o de prueba chica)"}`, { modelTier:'quick', cache:false });
    const p = Math.max(0, Math.min(10, Number(d?.puntos)||0)); dResults.push({p, ms, said, jab:dJab});
    sc.innerHTML = `${(ms/1000).toFixed(1)} s · <b>${p}/10</b> · ${ms>DMS?'tarde':'a tiempo'}`;
    if (d?.veredicto) box.append(el('div',null,String(d.veredicto)));
    if (d?.alt1) box.append(el('div','alt','→ ' + d.alt1));
    if (d?.alt2) box.append(el('div','alt','→ ' + d.alt2));
    setPin('dpin', '', `<b>${p}/10</b> · ${(ms/1000).toFixed(1)} s · ${d?.veredicto||''}` + (d?.alt1?`<br><i>→ ${d.alt1}</i>`:'') + (d?.alt2?`<br><i>→ ${d.alt2}</i>`:''));
  } catch (e) { sc.textContent = `${(ms/1000).toFixed(1)} s · no pude evaluar`; dResults.push({p:0, ms, said, jab:dJab}); }
  dlog.scrollTop = dlog.scrollHeight; dBusy = false;
  if (dRound >= DTOTAL) return dSummary();
  setTimeout(showJab, 2600);
};
const dSummary = async () => {
  const s = el('div','dsum'); s.innerHTML = '<h2>Diez pinchazos</h2>Pensando…'; dlog.append(s); dlog.scrollTop = dlog.scrollHeight;
  const avg = dResults.reduce((a,r)=>a+r.p,0)/Math.max(1,dResults.length); const avgMs = dResults.reduce((a,r)=>a+r.ms,0)/Math.max(1,dResults.length);
  ST.drills.push({ t: Date.now(), mode: S.mode, avg, avgMs, rounds: dResults.map(r=>({p:r.p, ms:Math.round(r.ms)})) }); if (ST.drills.length > 60) ST.drills = ST.drills.slice(-60); saveST();
  setPin('dpin', '', `Ronda cerrada: <b>${avg.toFixed(1)}/10</b> · ${(avgMs/1000).toFixed(1)} s promedio. Quedó guardada en Resultados.`);
  const rows = dResults.map((r,i)=>`${i+1}. Ella: "${r.jab}" — Él (${(r.ms/1000).toFixed(1)}s, ${r.p}/10): "${r.said}"`).join('\n');
  try {
    const { text } = await sample(`Coach de conversación, voseo rioplatense, directo, sin moraleja. Diez pinchazos y las respuestas de él, con tiempo y puntaje. Promedio ${avg.toFixed(1)}/10, tiempo medio ${(avgMs/1000).toFixed(1)} s. Escribí cuatro líneas: 1) el patrón que más se repite en sus fallos (defenderse, explicar, competir, tardar, callarse mal), 2) su mejor respuesta y por qué, 3) qué haría un tipo que no necesita ganar el intercambio en los dos peores casos, 4) una sola cosa para practicar mañana. Texto plano.\n\n${rows}`, { modelTier:'quick', cache:false });
    s.innerHTML = `<h2>Diez pinchazos · ${avg.toFixed(1)}/10 · ${(avgMs/1000).toFixed(1)} s</h2>`; s.append(document.createTextNode(text));
  } catch { s.innerHTML = `<h2>Diez pinchazos · ${avg.toFixed(1)}/10</h2>No pude armar el balance.`; }
  dlog.scrollTop = dlog.scrollHeight; dhint.textContent = 'listo';
  const again = el('button','ghost','Otra ronda'); again.style.alignSelf='flex-start'; again.addEventListener('click', () => startDrill(false)); dlog.append(again);
};
const startDrill = async (fresh=false) => {
  $('setup').style.display='none'; $('stage').style.display='none'; $('drill').style.display='flex';
  dlog.innerHTML=''; dRound=0; dResults=[]; dUsed=[]; dFresh=[]; moodEl.dataset.m='liviano'; moodEl.textContent='reflejo';
  if (!sample) { sample = await window.claude?.use?.('sample'); if (!sample) { dhint.textContent = 'Claude no disponible en esta vista'; return; } }
  if (fresh === true) { dhint.textContent = S.mode==='biz' ? 'la contraparte está pensando cómo apretarte…' : 'ella está pensando qué tirarte…'; setPin('dpin','', S.mode==='biz' ? 'Inventando diez frases de presión nuevas…' : 'Inventando diez pinchazos nuevos…'); await fetchFresh(); }
  showJab();
};
dsend.addEventListener('click', dGo);
dinput.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey && !dsend.disabled) { e.preventDefault(); dGo(); } });
$('startDrill').addEventListener('click', () => startDrill(false));
$('startFresh').addEventListener('click', () => startDrill(true));
$('dReset').addEventListener('click', () => { clearInterval(dTimer); try{speechSynthesis.cancel();}catch{} $('drill').style.display='none'; $('setup').style.display='flex'; moodEl.textContent='—'; moodEl.dataset.m=''; });

// ================= RESPONDÉ POR MÍ =================
const REPLY_RULES_REL = (ctx, chat, imgs) => `Sos el coach de conversación de este ejercicio y contestás SOLO con un objeto JSON. Un hombre de ${P.edad}, argentino, te pega los últimos mensajes de un chat (o lo que se dijeron cara a cara) con una mujer de entre 35 y 45, y te pide qué contestar.
Contexto que él da: ${ctx || '(ninguno)'}
Conversación (en orden; "Ella:" y "Yo:"):
${chat}
${imgs ? 'ADEMÁS hay ' + imgs + ' captura(s) de pantalla del chat adjuntas: leelas en orden (los mensajes de ella suelen estar a la izquierda y los de él a la derecha, salvo que el contexto diga otra cosa). Si el texto pegado está vacío, la conversación es la de las capturas. Las capturas mandan sobre el texto si difieren.' : ''}

MODELO (síntesis de la literatura de seducción y los estudios de cortejo; no lo nombres ni cites libros): la atracción es una emoción que se gana, no una decisión; la produce el que no busca aprobación: calma, respuestas cortas, humor con descaro, tira-y-afloja, calificación (que ella se gane algo), restricción de tiempo, hablar desde el yo, afirmaciones en vez de preguntas, desacuerdo sereno, interés condicionado a un mérito concreto de ella, hilos abiertos. La mata la necesidad: cumplidos al cuerpo, entrevista, explicarse, disculparse ante un test, estar de acuerdo con todo, regalar interés, alimentar una charla que ella dejó morir, pedir permiso, lógica contra emoción. Sus tests ("eso se lo decís a todas", "no sos mi tipo", "tengo novio", "qué raro sos", silencio) son señal de interés y se pasan sin defenderse: malinterpretar a favor, comprimir con humor, judo (dar la razón y reencuadrar), aceptar la etiqueta, traducir la emoción, ignorar y seguir. Fases:
${Object.values(FASES).map(f => '- ' + f.n + ': ' + f.d).join('\n')}
Si es chat escrito: mensajes cortos, sin explicar, sin emojis en cadena, sin audios largos; cortar en alto; si ella tarda, no se persigue.

TAREA: 1) "lectura": en una o dos frases en voseo, qué está haciendo ella en su último mensaje (test, invierte, se enfría, abre la puerta, cierra) y en qué fase están. 2) "opciones": TRES respuestas para que él mande ahora, en registros distintos y adecuados a la fase: una "seca" (corta, calma, no reacciona), una "de juego" (descaro o humor con red, o judo si hubo test), y una "de avance" (escala con excusa, propone lo siguiente o corta en alto). Cada una: "registro" (2-3 palabras), "texto" (lo que él manda, máximo 30 palabras, en voseo, en su voz de hombre de ${P.edad}, sin sonar a manual), "mecanismo" (una frase: qué hace y por qué funciona acá). 3) "evitar": una línea con lo que NO tiene que contestar en este punto y por qué. Sin moraleja. Dentro de los textos no uses comillas dobles ni saltos de línea.
FORMATO: {"lectura":"…","opciones":[{"registro":"…","texto":"…","mecanismo":"…"},{"registro":"…","texto":"…","mecanismo":"…"},{"registro":"…","texto":"…","mecanismo":"…"}],"evitar":"…"}`;
const REPLY_RULES_BIZ = (ctx, chat, imgs) => `Sos el coach de asertividad de este ejercicio y contestás SOLO con un objeto JSON. ${P.nombre}, ${P.edad}, ${P.oficio}, te pega los últimos mensajes de una negociación o reunión (cliente, socio, contraparte, colega, comprador, artista) y te pide qué contestar.
Contexto que él da: ${ctx || '(ninguno)'}
Conversación (en orden; el otro y "Yo:"):
${chat}
${imgs ? 'ADEMÁS hay ' + imgs + ' captura(s) de pantalla adjuntas: leelas en orden (los mensajes del otro suelen estar a la izquierda y los de ${P.nombre} a la derecha). Si el texto pegado está vacío, la conversación es la de las capturas.' : ''}

MODELO: se sostiene el marco desde la calma. Sube: pausa, devolver la pregunta ("¿qué te hace decir eso?"), nombrar el juego sin enojo, ofrecer opciones ("¿preferís A o B?"), reencuadrar de qué se habla, dar la razón en algo y redirigir, reencuadrar los números, el reto al ego, mostrar que puede irse sin drama, firmeza corta. Baja: justificarse, apilar argumentos, ceder rápido, pedir disculpas sin motivo, reaccionar a la provocación, amenazar o agrandarse, decir "estás equivocado", reconfirmar. Menos de 25 palabras.

TAREA: 1) "lectura": en una o dos frases en voseo, qué está intentando el otro con su último mensaje (presión de tiempo, afecto, comparación, silencio, pedido indebido) y qué quiere sacar. 2) "opciones": TRES respuestas en registros distintos: una "seca" (corta, firme, sin explicar), una "de pregunta" (devuelve la pregunta o nombra el juego con calma), y una "de opciones" (ofrece alternativas o reencuadra, y deja ver que puede levantarse). Cada una: "registro", "texto" (máximo 30 palabras, voseo o usted según el contexto), "mecanismo". 3) "evitar": una línea con lo que NO tiene que contestar y por qué. Sin moraleja. Dentro de los textos no uses comillas dobles ni saltos de línea.
FORMATO: {"lectura":"…","opciones":[{"registro":"…","texto":"…","mecanismo":"…"},{"registro":"…","texto":"…","mecanismo":"…"},{"registro":"…","texto":"…","mecanismo":"…"}],"evitar":"…"}`;
const showReply = () => {
  $('setup').style.display='none'; $('reply').style.display='flex';
  const biz = S.mode==='biz';
  $('replyNote').textContent = biz ? 'Pegá los últimos mensajes del otro y los tuyos, en orden. Te devuelvo tres respuestas que sostienen el marco, con el mecanismo, para que elijas y la digas a tu manera.' : 'Pegá los últimos mensajes (los de ella y los tuyos, en orden). Te devuelvo tres respuestas en registros distintos, con el mecanismo que usan, para que elijas y la digas a tu manera. No copies: adaptá.';
  $('replyChat').placeholder = biz ? 'Cliente: …\nYo: …\nCliente: …' : 'Ella: …\nYo: …\nElla: …';
  $('reply').querySelector('h2').textContent = biz ? 'Respondé por mí · negocios' : 'Respondé por mí · citas';
  $('replyCtx').placeholder = biz ? 'Ej.: cliente de años, me pide descuento · socio que apura' : 'Ej.: match de hace tres días, todavía no nos vimos';
  $('replyHint').textContent = '';
  (async () => {
    try {
      if (!sample) sample = await window.claude?.use?.('sample');
      const caps = sample ? await sample.limits().catch(() => null) : null;
      const ok = !!caps?.images; $('fImg').hidden = !ok;
      if (ok) { $('replyImg').accept = caps.images.mediaTypes.join(','); $('imgMax').textContent = String(caps.images.maxCount); replyImgMax = caps.images.maxCount; }
    } catch { $('fImg').hidden = true; }
  })();
};
let replyImgMax = 3;
$('replyImg').addEventListener('change', () => {
  const prev = $('imgPrev'); prev.innerHTML = '';
  const files = Array.from($('replyImg').files || []).slice(0, replyImgMax);
  files.forEach(f => { const im = document.createElement('img'); im.src = URL.createObjectURL(f); im.style.cssText = 'height:72px;border-radius:6px;border:1px solid var(--line)'; im.onload = () => URL.revokeObjectURL(im.src); prev.append(im); });
  if (($('replyImg').files||[]).length > replyImgMax) $('replyHint').textContent = 'sólo uso las primeras ' + replyImgMax;
});
const replyRun = async () => {
  const chat = $('replyChat').value.trim();
  const files = Array.from($('replyImg').files || []).slice(0, replyImgMax);
  if (!chat && !files.length) { $('replyHint').textContent = 'pegá la conversación o subí una captura'; return; }
  const out = $('replyOut'); out.innerHTML = ''; $('replyGo').disabled = true; $('replyHint').textContent = 'pensando…';
  try {
    if (!sample) { sample = await window.claude?.use?.('sample'); if (!sample) throw new Error('nosample'); }
    const opts = { modelTier: files.length ? 'default' : 'quick', cache:false }; if (files.length) opts.images = files;
    const d = await askJson(S.mode==='biz' ? REPLY_RULES_BIZ($('replyCtx').value.trim(), chat || '(sin texto pegado)', files.length) : REPLY_RULES_REL($('replyCtx').value.trim(), chat || '(sin texto pegado)', files.length), opts);
    if (d?.lectura) out.append(el('div','lectura', String(d.lectura)));
    (Array.isArray(d?.opciones) ? d.opciones : []).slice(0,3).forEach(o => {
      const c = el('div','opt'); c.append(el('div','reg', String(o.registro||'opción'))); c.append(el('div','txt', String(o.texto||'')));
      if (o.mecanismo) c.append(el('div','mec', String(o.mecanismo)));
      const b = el('button','ghost copy','Copiar'); b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(String(o.texto||'')); b.textContent = 'Copiado'; setTimeout(()=>b.textContent='Copiar',1500); } catch { b.textContent = 'No pude copiar'; } }); c.append(b);
      out.append(c);
    });
    if (d?.evitar) out.append(el('div','evitar', 'Evitá: ' + String(d.evitar)));
    $('replyHint').textContent = 'elegí una y decila a tu manera';
  } catch (e) { const msg = e?.message === 'nosample' ? 'Esta vista no tiene permiso para usar Claude.' : e?.code === 'image_rejected' ? 'Esa imagen no sirve (formato o tamaño). Probá con otra captura.' : e?.code === 'images_unavailable' ? 'Esta vista no puede mandar imágenes; pegá el texto.' : e?.code === 'refused' ? 'Claude no quiso trabajar con ese contenido.' : 'No pude armarlas ahora. Probá de nuevo.'; out.append(el('p','note', msg)); $('replyHint').textContent = ''; }
  finally { $('replyGo').disabled = false; }
};
$('showReply').addEventListener('click', showReply);
$('replyGo').addEventListener('click', replyRun);
$('replyBack').addEventListener('click', () => { $('reply').style.display='none'; $('setup').style.display='flex'; });
$('replyChat').addEventListener('input', () => { const t = $('replyChat'); t.style.height='auto'; t.style.height = Math.min(window.innerHeight*0.4, t.scrollHeight) + 'px'; });

// ================= RESULTADOS =================
const renderResults = () => {
  const b = $('rBody'); b.innerHTML = '';
  const tile = (k, v, small) => { const t = el('div','tile'); t.append(el('div','k',k)); const vv = el('div','v', v); if (small) { vv.append(' '); const s = el('small',null,small); vv.append(s); } t.append(vv); return t; };
  const d = ST.drills, s = ST.sessions;
  if (!d.length && !s.length) { b.append(el('p','note','Todavía no hay nada guardado. Jugá una ronda o una escena y volvé.')); return; }
  // drills
  b.append(el('h3',null,'Reflejo'));
  const g1 = el('div','stat');
  if (d.length) {
    const last = d[d.length-1]; const first = d[0];
    const all = d.reduce((a,x)=>a+x.avg,0)/d.length; const allMs = d.reduce((a,x)=>a+x.avgMs,0)/d.length;
    g1.append(tile('rondas', String(d.length)));
    g1.append(tile('última', last.avg.toFixed(1), (last.avgMs/1000).toFixed(1)+' s'));
    g1.append(tile('promedio', all.toFixed(1), (allMs/1000).toFixed(1)+' s'));
    if (d.length > 1) g1.append(tile('desde la primera', (last.avg-first.avg>=0?'+':'')+(last.avg-first.avg).toFixed(1), ((first.avgMs-last.avgMs)/1000).toFixed(1)+' s más rápido'));
  } else g1.append(tile('rondas','0'));
  b.append(g1);
  if (d.length) { const h = el('div','hist'); d.slice(-10).reverse().forEach(x => { const r = el('div','hrow'); r.innerHTML = `<span>${fmtDate(x.t)} · ${x.mode==='biz'?'negocios':'citas'}</span><span><b>${x.avg.toFixed(1)}/10</b> · ${(x.avgMs/1000).toFixed(1)} s · ${x.rounds.filter(q=>q.ms<=6000).length}/${x.rounds.length} a tiempo</span>`; h.append(r); }); b.append(h); }
  // sessions
  b.append(el('h3',null,'Sparring'));
  const g2 = el('div','stat');
  if (s.length) {
    const last = s[s.length-1];
    const avgTurns = s.reduce((a,x)=>a+x.turns,0)/s.length;
    const lost = s.filter(x=>x.lostAt!=null);
    g2.append(tile('escenas', String(s.length))); const won = s.filter(x=>x.result==='gano').length; g2.append(tile('ganadas', String(won), s.length? Math.round(100*won/s.length)+'%' : ''));
    g2.append(tile('turnos por escena', avgTurns.toFixed(1)));
    g2.append(tile('perdida en el turno', lost.length ? (lost.reduce((a,x)=>a+x.lostAt,0)/lost.length).toFixed(1) : '—', lost.length? `${lost.length} de ${s.length}` : 'nunca'));
    g2.append(tile('pausa media', (last.avgLat/1000).toFixed(1)+' s', 'última escena'));
    const bad = {}; s.forEach(x => Object.entries(x.bad||{}).forEach(([k,v]) => { bad[k]=(bad[k]||0)+v; }));
    const top = Object.entries(bad).sort((a,b)=>b[1]-a[1]).slice(0,5);
    b.append(g2);
    if (top.length) { b.append(el('h3',null,'Lo que más te marca el coach')); const h = el('div','hist'); top.forEach(([k,v]) => { const r = el('div','hrow'); r.innerHTML = `<span><b>${k}</b></span><span>${v}×</span>`; h.append(r); }); b.append(h); }
    const h2 = el('div','hist'); s.slice(-10).reverse().forEach(x => { const r = el('div','hrow'); r.innerHTML = `<span>${fmtDate(x.t)} · ${x.mode==='biz'?'negocios':'citas'} · ${x.scene} · ${x.level}</span><span><b>${x.turns} turnos</b> · ${x.result==='gano'?'GANADA':x.result==='perdio'?'perdida':'sin cerrar'} · pico ${x.peak||0} · pausa ${(x.avgLat/1000).toFixed(1)} s</span>`; h2.append(r); }); b.append(h2);
  } else { g2.append(tile('escenas','0')); b.append(g2); }
  b.append(el('p','note','Todo esto se guarda en este teléfono, en este navegador. Si cambiás de dispositivo, arranca de cero.'));
};
$('showResults').addEventListener('click', () => { renderResults(); $('setup').style.display='none'; $('results').style.display='flex'; });
$('rBack').addEventListener('click', () => { $('results').style.display='none'; $('setup').style.display='flex'; });

$('btnBalance').addEventListener('click', async () => {
  if (!sample || busy || count < 2) { hint.textContent = count < 2 ? 'decí algo primero' : 'esperá'; return; }
  const box = $('balance'); box.style.display = 'block'; const bt = S.mode==='biz' ? 'Balance de la reunión' : 'Balance de la noche'; box.innerHTML = '<h2>'+bt+'</h2>Pensando…'; $('hdrR').dataset.hide = '0';
  const transcript = turns.map(t => t.role === 'user' ? t.content.replace(/^\[.*?\]\n/,'') : (herName() + ': ' + (parseMaybe(t.content)?.reply || ''))).join('\n');
  try {
    const { text } = await sample(`Sos un coach de conversación, directo, en voseo rioplatense, sin moraleja ni teoría. Leé esta conversación de práctica (${S.mode==='biz' ? 'negociación / reunión: evaluá asertividad y control del marco' : 'primera cita'}) y escribí un balance de cinco líneas como máximo: 1) el mejor momento de él y por qué funcionó, 2) el error que más repitió, 3) en qué turno perdió o ganó el estado de ella (curva de interés por turno: ${(cur?.hist||[]).join(' → ')}), 4) una sola cosa para practicar esta semana, 5) una frase de cierre corta. Texto plano, sin listas numeradas ni títulos.\n\n${transcript.slice(0, 6000)}`, { modelTier:'quick', cache:false });
    box.innerHTML = '<h2>'+bt+'</h2>'; box.append(document.createTextNode(text)); if (cur?.hist && cur.hist.length > 1) { const c = el('div','curve'); const mx = Math.max(...cur.hist); c.innerHTML = 'Curva: ' + cur.hist.map(v => v === mx ? `<b>${v}</b>` : String(v)).join(' → '); box.append(c); }
  } catch (e) { box.innerHTML = '<h2>'+bt+'</h2>No pude armarlo ahora. Probá de nuevo en un rato.'; }
  scrollDown();
});
})();
