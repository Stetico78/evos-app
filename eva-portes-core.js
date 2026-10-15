(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EVAQuoteCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FIELD_ORDER = [
    'service',
    'origin',
    'destination',
    'date',
    'time',
    'items',
    'accessOrigin',
    'accessDestination',
    'assembly',
    'name',
    'phone',
    'email',
    'notes'
  ];

  const REQUIRED_FIELDS = [
    'service',
    'origin',
    'destination',
    'date',
    'time',
    'items',
    'accessOrigin',
    'accessDestination',
    'assembly',
    'name',
    'phone'
  ];

  const LABELS = {
    service: 'Servicio',
    origin: 'Origen',
    destination: 'Destino',
    date: 'Fecha',
    time: 'Hora o franja',
    items: 'Carga',
    accessOrigin: 'Acceso en origen',
    accessDestination: 'Acceso en destino',
    assembly: 'Montaje',
    name: 'Nombre y apellidos',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    notes: 'Observaciones'
  };

  const QUESTIONS = {
    service: '¿Qué servicio necesitas: solo transporte, transporte con montaje/desmontaje o solo montaje?',
    origin: '¿Cuál es la dirección de origen? Indica localidad, calle y número.',
    destination: '¿Cuál es la dirección de destino? Indica localidad, calle y número.',
    date: '¿Qué fecha aproximada necesitas?',
    time: '¿A qué hora o en qué franja te viene bien?',
    items: '¿Qué hay que transportar o montar y cuántos bultos son aproximadamente?',
    accessOrigin: '¿Cómo es el acceso en origen: planta, ascensor, escaleras y posibilidad de aparcar cerca?',
    accessDestination: '¿Cómo es el acceso en destino: planta, ascensor, escaleras y posibilidad de aparcar cerca?',
    assembly: '¿Necesitas desmontaje, montaje, ambos o ninguno?',
    name: '¿Cuál es tu nombre y apellidos?',
    phone: '¿Cuál es tu teléfono de contacto?',
    email: '¿Quieres añadir un correo electrónico? También puedes elegir continuar solo por WhatsApp.',
    notes: '¿Hay algo más que debamos saber: objetos frágiles, medidas, peso, urgencia o acceso complicado?'
  };

  const QUICK_REPLIES = {
    service: ['Solo transporte', 'Transporte + montaje', 'Solo montaje'],
    time: ['Mañana', 'Tarde', 'Flexible'],
    accessOrigin: ['Bajo / acceso directo', 'Con ascensor', 'Sin ascensor'],
    accessDestination: ['Bajo / acceso directo', 'Con ascensor', 'Sin ascensor'],
    assembly: ['Ninguno', 'Montaje', 'Desmontaje + montaje'],
    email: ['Continuar solo por WhatsApp'],
    notes: ['Nada más']
  };

  function createState(seed) {
    const state = {};
    FIELD_ORDER.forEach((key) => { state[key] = ''; });
    state.reference = '';
    state.createdAt = '';
    return Object.assign(state, seed || {});
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clean(value, max) {
    return String(value || '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max || 300);
  }

  function hasValue(value) {
    return clean(value).length > 0;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function relativeDate(text, now) {
    const n = normalize(text);
    const base = now ? new Date(now) : new Date();
    if (Number.isNaN(base.getTime())) return '';
    if (/\bpasado manana\b/.test(n)) base.setDate(base.getDate() + 2);
    else if (/\bmanana\b/.test(n)) base.setDate(base.getDate() + 1);
    else if (!/\bhoy\b/.test(n)) return '';
    return formatDate(base);
  }

  function normalizeService(text) {
    const n = normalize(text);
    if (/solo montaje|unicamente montaje/.test(n)) return 'Solo montaje';
    if (/desmont|montaje|montar|desmontar/.test(n) && /transport|porte|mudanza|recog|llevar|traslad/.test(n)) {
      return 'Transporte + montaje';
    }
    if (/transport|porte|mudanza|recog|llevar|traslad/.test(n)) return 'Solo transporte';
    if (/montaje|montar|desmont/.test(n)) return 'Solo montaje';
    return '';
  }

  function normalizeAssembly(text) {
    const n = normalize(text);
    if (/desmont.*mont|mont.*desmont|ambos/.test(n)) return 'Desmontaje + montaje';
    if (/sin montaje|ningun montaje|no necesito montaje|ninguno/.test(n)) return 'Ninguno';
    if (/desmont/.test(n)) return 'Desmontaje';
    if (/montaje|montar/.test(n)) return 'Montaje';
    return '';
  }

  function describeAccess(text) {
    const n = normalize(text);
    const bits = [];
    const floor = text.match(/\b(bajo|entresuelo|\d{1,2}\s*(?:º|o|a)?(?:\s*(?:piso|planta))?)\b/i);
    if (floor) bits.push(clean(floor[0], 40));
    if (/sin ascensor/.test(n)) bits.push('sin ascensor');
    else if (/con ascensor|hay ascensor|ascensor/.test(n)) bits.push('con ascensor');
    if (/aparc|parking|carga|descarga/.test(n)) {
      const parking = text.match(/(?:aparcamiento|aparcar|parking|zona de carga|carga y descarga)[^,.;]{0,80}/i);
      bits.push(clean(parking ? parking[0] : 'acceso de aparcamiento indicado', 100));
    }
    return Array.from(new Set(bits)).join(' · ');
  }

  function splitRoute(text) {
    const routePatterns = [
      /(?:\bdesde\b|\brecoger(?:\s+[^,.]*)?\s+en\b)\s+(.+?)\s+(?:\bhasta\b|\by\s+llevar(?:\s+[^,.]*)?\s+a\b|\bllevar(?:\s+[^,.]*)?\s+a\b)\s+(.+?)(?=(?:\s+(?:hoy|mañana|manana|pasado mañana|pasado manana|el\s|para\s+el|por\s+la|a\s+las|con\s+montaje|sin\s+montaje|flexible)\b)|[.;]|$)/i,
      /\bde\s+(.+?)\s+\ba\s+(.+?)(?=(?:\s+(?:hoy|mañana|manana|pasado mañana|pasado manana|el\s|para\s+el|por\s+la|a\s+las|con\s+montaje|sin\s+montaje|flexible)\b)|[.;]|$)/i
    ];
    for (const pattern of routePatterns) {
      const match = text.match(pattern);
      if (match) return { origin: clean(match[1], 180), destination: clean(match[2], 180) };
    }
    return null;
  }

  function validPhone(value) {
    const digits = clean(value, 40).replace(/\D/g, '');
    const local = digits.startsWith('34') && digits.length === 11 ? digits.slice(2) : digits;
    return local.length === 9 && /^[6789]/.test(local);
  }

  function normalizePhone(value) {
    const digits = clean(value, 40).replace(/\D/g, '');
    const local = digits.startsWith('34') && digits.length === 11 ? digits.slice(2) : digits;
    return validPhone(value) ? '+34 ' + local.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '';
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(clean(value, 150));
  }

  function setIfEmpty(state, key, value) {
    if (!hasValue(state[key]) && hasValue(value)) state[key] = clean(value, 300);
  }

  function extractInitial(text, inputState, now) {
    const state = createState(inputState);
    const raw = clean(text, 1800);
    const n = normalize(raw);

    setIfEmpty(state, 'service', normalizeService(raw));

    const route = splitRoute(raw);
    if (route) {
      setIfEmpty(state, 'origin', route.origin);
      setIfEmpty(state, 'destination', route.destination);
      setIfEmpty(state, 'accessOrigin', describeAccess(route.origin));
      setIfEmpty(state, 'accessDestination', describeAccess(route.destination));
    }

    const rel = relativeDate(raw, now);
    if (rel) setIfEmpty(state, 'date', rel);
    const numericDate = raw.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b/);
    if (numericDate) setIfEmpty(state, 'date', numericDate[0]);
    if (!state.date) {
      const weekday = raw.match(/\b(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(?:\s+\d{1,2})?\b/i);
      if (weekday) setIfEmpty(state, 'date', weekday[0]);
    }

    if (/por la manana/.test(n)) setIfEmpty(state, 'time', 'Mañana');
    else if (/por la tarde/.test(n)) setIfEmpty(state, 'time', 'Tarde');
    else if (/por la noche/.test(n)) setIfEmpty(state, 'time', 'Noche');
    else if (/horario flexible|hora flexible|me da igual la hora|cualquier hora/.test(n)) setIfEmpty(state, 'time', 'Flexible');
    const explicitTime = raw.match(/\b(?:a\s+las\s+)?([01]?\d|2[0-3])(?::([0-5]\d))\s*(?:h|horas)?\b/i);
    if (explicitTime && !/\b\d+\s+(?:cajas|bultos|bolsas|sillas|pisos|plantas)\b/i.test(raw)) {
      setIfEmpty(state, 'time', explicitTime[1].padStart(2, '0') + ':' + (explicitTime[2] || '00'));
    }

    const qty = raw.match(/\b(\d{1,3})\s+(cajas|bultos|bolsas|maletas|paquetes|sillas|mesas|muebles|electrodomésticos|electrodomesticos)\b/i);
    const objects = raw.match(/\b(sofá|sofa|armario|mesa|cama|colchón|colchon|nevera|frigorífico|frigorifico|lavadora|secadora|televisor|mueble|moto|piano|cajas)\b/i);
    if (qty) setIfEmpty(state, 'items', qty[1] + ' ' + qty[2]);
    else if (objects) {
      const beforeRoute = raw.split(/\s+(?:desde|de|recoger(?:\s+[^,.]*)?\s+en)\s+/i)[0];
      setIfEmpty(state, 'items', clean(beforeRoute.replace(/^.*?(?:llevar|transportar|mover|recoger)\s+/i, ''), 220) || objects[0]);
    }

    setIfEmpty(state, 'assembly', normalizeAssembly(raw));

    if (!state.accessOrigin && /origen/.test(n)) {
      const accessOrigin = raw.match(/(?:en\s+origen|origen)[^.;]{0,140}/i);
      if (accessOrigin) setIfEmpty(state, 'accessOrigin', describeAccess(accessOrigin[0]));
    }
    if (!state.accessDestination && /destino/.test(n)) {
      const accessDestination = raw.match(/(?:en\s+destino|destino)[^.;]{0,140}/i);
      if (accessDestination) setIfEmpty(state, 'accessDestination', describeAccess(accessDestination[0]));
    }

    const name = raw.match(/(?:me llamo|soy|a nombre de)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{3,80})(?=\s+(?:mi teléfono|mi telefono|teléfono|telefono|correo|email|y mi)|[,.;]|$)/i);
    if (name) setIfEmpty(state, 'name', name[1]);

    const phone = raw.match(/(?:\+?34[\s.-]*)?(?:[6789][\s.-]*)(?:\d[\s.-]*){8}\b/);
    if (phone && validPhone(phone[0])) setIfEmpty(state, 'phone', normalizePhone(phone[0]));

    const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (email) setIfEmpty(state, 'email', email[0]);

    return state;
  }

  function assignField(inputState, field, value) {
    const state = createState(inputState);
    const raw = clean(value, 500);
    const n = normalize(raw);
    if (!FIELD_ORDER.includes(field)) return { ok: false, state, error: 'Campo desconocido.' };
    if (!raw) return { ok: false, state, error: 'Necesito una respuesta para continuar.' };

    if (field === 'service') {
      const service = normalizeService(raw) || (/transporte \+ montaje/i.test(raw) ? 'Transporte + montaje' : '');
      if (!service) return { ok: false, state, error: 'Elige solo transporte, transporte con montaje o solo montaje.' };
      state.service = service;
      return { ok: true, state };
    }

    if (field === 'assembly') {
      const assembly = normalizeAssembly(raw);
      if (!assembly) return { ok: false, state, error: 'Indica montaje, desmontaje, ambos o ninguno.' };
      state.assembly = assembly;
      return { ok: true, state };
    }

    if (field === 'phone') {
      if (!validPhone(raw)) return { ok: false, state, error: 'Ese teléfono parece incompleto. Escribe 9 cifras o incluye +34.' };
      state.phone = normalizePhone(raw);
      return { ok: true, state };
    }

    if (field === 'email') {
      if (/solo por whatsapp|sin email|sin correo|omitir|no tengo/.test(n)) {
        state.email = 'Continuar solo por WhatsApp';
        return { ok: true, state };
      }
      if (!validEmail(raw)) return { ok: false, state, error: 'El correo no parece válido. Corrígelo o elige continuar solo por WhatsApp.' };
      state.email = raw;
      return { ok: true, state };
    }

    if (field === 'notes') {
      state.notes = /nada|ningun|sin observaciones|no hay mas/.test(n) ? 'Sin observaciones adicionales' : raw;
      return { ok: true, state };
    }

    if (field === 'name') {
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{3,80}$/.test(raw) || raw.split(/\s+/).length < 2) {
        return { ok: false, state, error: 'Escribe nombre y apellidos para identificar el presupuesto.' };
      }
    }

    if ((field === 'origin' || field === 'destination') && raw.length < 5) {
      return { ok: false, state, error: 'Necesito al menos localidad, calle y número o una referencia clara.' };
    }

    if ((field === 'accessOrigin' || field === 'accessDestination') && raw.length < 3) {
      return { ok: false, state, error: 'Indica planta, ascensor o acceso directo.' };
    }

    state[field] = raw;
    return { ok: true, state };
  }

  function nextField(state) {
    return FIELD_ORDER.find((field) => !hasValue(state[field])) || '';
  }

  function missingRequired(state) {
    return REQUIRED_FIELDS.filter((field) => !hasValue(state[field]));
  }

  function progress(state) {
    const done = REQUIRED_FIELDS.filter((field) => hasValue(state[field])).length;
    return {
      done,
      total: REQUIRED_FIELDS.length,
      percent: Math.round((done / REQUIRED_FIELDS.length) * 100)
    };
  }

  function isReady(state) {
    return FIELD_ORDER.every((field) => hasValue(state[field]));
  }

  function createReference(now, randomValue) {
    const d = now ? new Date(now) : new Date();
    const stamp = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('');
    const random = typeof randomValue === 'number' ? randomValue : Math.random();
    const suffix = Math.floor(Math.abs(random % 1) * 10000).toString().padStart(4, '0');
    return 'EVO-' + stamp + '-' + suffix;
  }

  function finalize(inputState, now, randomValue) {
    const state = createState(inputState);
    if (!state.reference) state.reference = createReference(now, randomValue);
    if (!state.createdAt) state.createdAt = new Date(now || Date.now()).toISOString();
    return state;
  }

  function summaryLines(state) {
    return [
      ['Referencia', state.reference || 'Pendiente'],
      ['Servicio', state.service],
      ['Origen', state.origin],
      ['Destino', state.destination],
      ['Fecha', state.date],
      ['Hora o franja', state.time],
      ['Carga', state.items],
      ['Acceso en origen', state.accessOrigin],
      ['Acceso en destino', state.accessDestination],
      ['Montaje', state.assembly],
      ['Cliente', state.name],
      ['Teléfono', state.phone],
      ['Email', state.email],
      ['Observaciones', state.notes],
      ['Precio', 'Pendiente de validación EVOS']
    ];
  }

  function summaryText(state) {
    return summaryLines(state).map(([label, value]) => label + ': ' + (value || '—')).join('\n');
  }

  function whatsappUrl(state, number) {
    const destination = String(number || '34645772010').replace(/\D/g, '');
    const text = 'Hola EVOS, envío mi solicitud de presupuesto de Portes y Montajes.\n\n' + summaryText(state);
    return 'https://wa.me/' + destination + '?text=' + encodeURIComponent(text);
  }

  return {
    FIELD_ORDER,
    REQUIRED_FIELDS,
    LABELS,
    QUESTIONS,
    QUICK_REPLIES,
    createState,
    normalize,
    clean,
    relativeDate,
    normalizeService,
    normalizeAssembly,
    describeAccess,
    splitRoute,
    validPhone,
    normalizePhone,
    validEmail,
    extractInitial,
    assignField,
    nextField,
    missingRequired,
    progress,
    isReady,
    createReference,
    finalize,
    summaryLines,
    summaryText,
    whatsappUrl
  };
});
