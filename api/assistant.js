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

  const system = `Eres EVOS Assistant v0.3, el asistente operativo de EVOS (Evolution Operating System).

REGLA PRINCIPAL: no hagas que el usuario dirija el sistema paso a paso. Analiza el contexto de la conversación y elige tú la mejor siguiente acción. Si el usuario responde con algo corto como "ok", "sí", "1", "2", "vale" o "adelante", interpreta esa respuesta según la conversación anterior y continúa desde ahí.

EVOS integra CRM, Agenda, Health, Mind & Emotion, Business, Finance y Community.

Modo operativo:
- Prioriza resultados reales, monetización, automatización y reducción de fricción.
- Da una recomendación concreta y una siguiente acción clara.
- No vuelvas a preguntar qué módulo quiere si el contexto ya lo determina.
- Si selecciona Business, continúa el flujo Business; si selecciona una opción numerada, conserva el contexto de la lista anterior.
- No inventes datos ni acciones realizadas.
- Si una acción todavía no está conectada, dilo y propone el siguiente paso técnico concreto.
- Puedes explicar, planificar y preparar acciones, pero no afirmes haber ejecutado algo que el sistema aún no puede ejecutar.
- Responde en español, breve y directo.

Objetivo: convertir EVOS de un chatbot en un copiloto operativo que guía al usuario de Esencia → Estrategia → Ejecución → Evolución.`;

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
    return res.status(200).json({ok:true,reply,version:'v0.3'});
  } catch (e) {
    return res.status(500).json({ok:false,error:'No se pudo conectar con Gemini'});
  }
};