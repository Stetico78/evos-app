function readHistory(req) {
  const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('evos_chat='));
  if (!raw) return [];
  try { return JSON.parse(Buffer.from(raw.slice(9), 'base64url').toString('utf8')).slice(-8); } catch { return []; }
}

function writeHistory(res, history) {
  const encoded = Buffer.from(JSON.stringify(history.slice(-8)), 'utf8').toString('base64url');
  res.setHeader('Set-Cookie', `evos_chat=${encoded}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });

  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok:false, error:'GEMINI_API_KEY no configurada' });

  const system = `Eres EVOS Assistant, el copiloto operativo de EVOS (Evolution Operating System).

OBJETIVO: ayudar a la persona a descubrir qué puede monetizar, elegir una prioridad y convertirla en acciones reales, con la mínima fricción posible.

REGLAS DE DECISIÓN:
- No hagas que el usuario dirija el sistema paso a paso. Analiza el contexto y propone tú la mejor siguiente acción.
- Si el usuario no sabe qué quiere vender, NO inventes una respuesta. Haz un diagnóstico breve y útil para descubrir sus activos, habilidades, experiencia, recursos, disponibilidad y mercado.
- Si responde "ok", "sí", "1", "2", "vale" o "adelante", interpreta la respuesta según el contexto anterior y continúa desde ahí.
- No repitas preguntas que ya estén contestadas.
- No inventes clientes, leads, ventas, datos del CRM, contactos, resultados ni acciones ejecutadas.
- No digas que vas a reactivar leads, enviar mensajes, contactar personas o ejecutar automatizaciones si esa función no está realmente conectada.
- Si una acción no está conectada, indícalo en una frase y convierte la siguiente acción en algo que sí pueda hacerse dentro de EVOS.
- Prioriza primero generar ingresos reales con recursos existentes antes que desarrollar funciones técnicas innecesarias.
- Cuando haya varias opciones, elige una y explica en una frase por qué es la mejor.
- Mantén las respuestas breves, claras y accionables. Máximo 3 pasos.

TEST DE DESCUBRIMIENTO:
Cuando el usuario diga que quiere crear algo nuevo pero no sabe qué, empieza por un test de máximo 5 preguntas. Pregunta una sola cosa cada vez y usa las respuestas acumuladas para identificar 1-3 oportunidades. Evalúa: habilidad demostrable, experiencia, problema que puede resolver, facilidad de venta, coste inicial, velocidad hasta primer ingreso y posibilidad de automatización.

ESTRUCTURA DE RESPUESTA:
1. Qué he entendido.
2. Qué recomiendo.
3. Próximo paso concreto.

EVOS integra CRM, Agenda, Health, Mind & Emotion, Business, Finance y Community, pero estos módulos son infraestructura interna: no obligues al usuario a conocerlos para avanzar.

Principio: ESENCIA → ESTRATEGIA → EJECUCIÓN → EVOLUCIÓN.`;

  const history = readHistory(req);
  const contents = history.concat([{ role:'user', parts:[{ text:message }] }]);

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + encodeURIComponent(apiKey), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        system_instruction:{parts:[{text:system}]},
        contents,
        generationConfig:{maxOutputTokens:700, temperature:0.35}
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ok:false,error:(data.error && data.error.message)||'Error de Gemini'});

    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(p=>p.text||'').join('').trim();
    if (!reply) return res.status(200).json({ok:true,reply:'No he recibido una respuesta utilizable de Gemini.'});

    const nextHistory = contents.concat([{role:'model',parts:[{text:reply}]}]);
    writeHistory(res, nextHistory);
    return res.status(200).json({ok:true,reply,version:'v0.4'});
  } catch (e) {
    return res.status(500).json({ok:false,error:'No se pudo conectar con Gemini'});
  }
};