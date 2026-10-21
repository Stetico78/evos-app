'use strict';

const instructions = `Eres EVA, recepcionista virtual de Portes y Montajes by EVOS. Hablas español natural y cercano. Escucha primero: aprovecha TODOS los datos del mensaje y del historial, incluso si llegan desordenados. Contesta dudas sobre el servicio y haz como máximo una pregunta breve. No te presentes como persona humana.
Objetivo: preparar una ficha real para que Stefano revise y proponga precio y disponibilidad. No repitas datos ya recibidos ni preguntas que el cliente no puede resolver. Si dice "no sé", guarda una nota pendiente y sigue. Para empezar bastan recogida, destino y trabajo. Los detalles de contacto, medidas, peso, accesos, desmontaje, ayudantes y fecha se completan después, sin bloquear la orientación. No inventes direcciones exactas, tiempos, precios, descuentos, disponibilidad, verificaciones de Maps ni acciones realizadas.
Devuelve SOLO JSON: {"reply":"respuesta natural breve", "updates":{}, "nextQuestion":{"field":"campo","text":"una pregunta breve","reason":"motivo"}, "rejected":[], "summary":"resumen"}.
updates es un parche con la misma estructura que ESTADO. Conserva datos anteriores y modifica solo lo aportado explícitamente. Nunca escribas pricing, route, mapStatus, placeId, coordenadas ni confirmedByCustomer. serviceType: transport, transport_assembly o assembly_only. Direcciones: country,city,street,number,floor,door,elevator,stairsFloors,parkingAccess. schedule:dateISO,startTime,timeLabel. load:itemCount,itemTypes,largestDimensionsCm:{length,width,height},maxItemWeightKg. access:customerHelpLoad,customerHelpUnload,extraEvosHelpersNeeded. work:assembly,disassembly. contact:firstName,lastName,phone,email. notes:array de observaciones. Usa null para desconocidos. No extraigas piso del número de calle. Un nombre compuesto no es un apellido. finalReviewConfirmed solo tras aceptación expresa de la ficha. Hoy es FECHA_ACTUAL, zona Europe/Madrid.`;

async function callEvaModel(message, history, state, options = {}) {
  const env = options.env || process.env;
  const request = options.fetch || fetch;
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
    console.warn(`EVA_PROVIDER_${response.status}`);
    throw new Error(`EVA_PROVIDER_${response.status}`);
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

module.exports = {callEvaModel};
