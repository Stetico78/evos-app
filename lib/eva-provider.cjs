'use strict';

const instructions = `Eres EVA, recepcionista virtual de Portes y Montajes by EVOS. Hablas español natural, empático, elegante y conciso. Escucha primero: aprovecha TODOS los datos del mensaje y del historial, incluso si llegan desordenados. Contesta dudas sobre el servicio y haz como máximo una pregunta breve, con una o dos frases. No te presentes como persona humana ni uses el nombre personal del propietario: di "el equipo EVOS".
Objetivo: preparar una ficha real para que el equipo EVOS revise y proponga precio y disponibilidad. No repitas datos ya recibidos ni preguntas que el cliente no puede resolver. Si dice "no sé", guarda una nota pendiente y sigue. Distingue transporte, mudanza, montaje e instalación: para montaje o instalación sin traslado, pide solo el lugar de trabajo y no una dirección de entrega. Para empezar bastan trabajo y lugar o, si hay transporte, recogida y destino. Los detalles de contacto, medidas, peso, accesos en ambos lugares, aparcamiento, desmontaje, ayudantes, fecha, hora y flexibilidad de día u horario se completan después, sin bloquear la orientación. Guarda condiciones importantes del cliente en notes sin perder las anteriores. No inventes direcciones exactas, tiempos, precios, descuentos, disponibilidad, verificaciones de Maps ni acciones realizadas. Una ficha revisada no es una reserva: EVOS debe enviar una propuesta y el cliente aceptarla. No solicites pagos ni prometas descuentos no calculados por el sistema.
Devuelve SOLO JSON: {"reply":"respuesta natural breve", "updates":{}, "nextQuestion":{"field":"campo","text":"una pregunta breve","reason":"motivo"}, "rejected":[], "summary":"resumen"}.
updates es un parche con la misma estructura que ESTADO. Conserva datos anteriores y modifica solo lo aportado explícitamente. Nunca escribas pricing, route, mapStatus, placeId, coordenadas ni confirmedByCustomer. serviceType: transport, transport_assembly o assembly_only. Direcciones: country,city,street,number,floor,door,elevator,stairsFloors,parkingAccess. schedule:dateISO,startTime,timeLabel. load:itemCount,itemTypes,largestDimensionsCm:{length,width,height},maxItemWeightKg. access:customerHelpLoad,customerHelpUnload,extraEvosHelpersNeeded. work:assembly,disassembly. contact:firstName,lastName,phone,email. notes:array de observaciones. Usa null para desconocidos. No extraigas piso del número de calle. Un nombre compuesto no es un apellido. finalReviewConfirmed solo tras aceptación expresa de la ficha. Hoy es FECHA_ACTUAL, zona Europe/Madrid.`;

async function callEvaModel(message, history, state, options = {}) {
  const env = options.env || process.env;
  const request = options.fetch || fetch;
  if (env.GEMINI_API_KEY && (env.EVA_PROVIDER === 'gemini' || !env.OPENAI_API_KEY)) return callGemini(message, history, state, options);
  if (!env.OPENAI_API_KEY) throw new Error('EVA_OPENAI_KEY_MISSING');
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid'}).format(new Date());
  const response = await request('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.OPENAI_API_KEY}`},
    signal:AbortSignal.timeout(25000),
    body:JSON.stringify({
      model:env.EVA_OPENAI_MODEL || 'gpt-4.1-mini',
      store:false,
      temperature:.25,
      max_completion_tokens:1400,
      response_format:{type:'json_object'},
      messages:[
        {role:'system',content:instructions.replace('FECHA_ACTUAL',today)},
        {role:'user',content:JSON.stringify({estado:state,historial:history.slice(-12),mensaje:message})},
      ],
    }),
  });
  if (!response.ok) {
    let code = `EVA_PROVIDER_${response.status}`;
    try {
      const detail = await response.json();
      if (detail.error?.code === 'insufficient_quota') code = 'EVA_OPENAI_QUOTA_EXHAUSTED';
    } catch {}
    if (env.GEMINI_API_KEY) return callGemini(message, history, state, options);
    throw new Error(code);
  }
  const data = await response.json();
  let parsed;
  try { parsed = JSON.parse(data.choices?.[0]?.message?.content || ''); }
  catch { throw new Error('EVA_INVALID_RESPONSE'); }
  if (!parsed || typeof parsed.reply !== 'string' || !parsed.reply.trim() || !parsed.updates || typeof parsed.updates !== 'object' || Array.isArray(parsed.updates)) throw new Error('EVA_INVALID_RESPONSE');
  for (const field of ['route','pricing']) delete parsed.updates[field];
  for (const side of ['origin','destination']) {
    const address = parsed.updates[side];
    if (address && typeof address === 'object') {
      for (const field of ['mapStatus','placeId','lat','lng','confirmedByCustomer','formattedAddress']) delete address[field];
    }
  }
  return parsed;
}

async function callGemini(message, history, state, options = {}) {
  const env = options.env || process.env;
  const request = options.fetch || fetch;
  const model = env.EVA_GEMINI_MODEL || 'gemini-2.5-flash';
  let response;
  for (let attempt=0;attempt<2;attempt++) {
  response = await request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
    signal:AbortSignal.timeout(20000),
    body:JSON.stringify({
      system_instruction:{parts:[{text:instructions.replace('FECHA_ACTUAL',new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(new Date()))}]},
      contents:[{role:'user',parts:[{text:JSON.stringify({estado:state,historial:history.slice(-12),mensaje:message})}]}],
      generationConfig:{maxOutputTokens:1800,responseMimeType:'application/json',...(/^gemini-3\./.test(model)?{thinkingConfig:{thinkingLevel:'low'}}:{})},
    }),
  });
  if (![500,502,503,504].includes(response.status)||attempt===1) break;
  await response.body?.cancel();
  await (options.sleep||((ms)=>new Promise(resolve=>setTimeout(resolve,ms))))(500+Math.floor(Math.random()*500));
  }
  if (!response.ok) {
    let code = `EVA_GEMINI_${response.status}`;
    try {
      const detail = await response.json();
      if (detail.error?.status === 'RESOURCE_EXHAUSTED') code = 'EVA_GEMINI_QUOTA_EXHAUSTED';
    } catch {}
    throw new Error(code);
  }
  const data = await response.json();
  let result;
  try {result=JSON.parse((data.candidates?.[0]?.content?.parts || []).map(part=>part.text || '').join(''));}
  catch {throw new Error('EVA_INVALID_RESPONSE');}
  if (!result || typeof result.reply !== 'string' || !result.updates || typeof result.updates !== 'object' || Array.isArray(result.updates)) throw new Error('EVA_INVALID_RESPONSE');
  delete result.updates.route;
  delete result.updates.pricing;
  for (const side of ['origin','destination']) {
    if (result.updates[side] && typeof result.updates[side] === 'object') {
      for (const field of ['mapStatus','placeId','lat','lng','confirmedByCustomer','formattedAddress']) delete result.updates[side][field];
    }
  }
  return result;
}

module.exports = {callEvaModel};
