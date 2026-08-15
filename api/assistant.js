function readHistory(req) {
  const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('evos_chat='));
  if (!raw) return [];
  try { return JSON.parse(Buffer.from(raw.slice(9), 'base64url').toString('utf8')).slice(-8); } catch { return []; }
}

function writeHistory(res, history) {
  const encoded = Buffer.from(JSON.stringify(history.slice(-8)), 'utf8').toString('base64url');
  res.setHeader('Set-Cookie', `evos_chat=${encoded}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`);
}

function localFallback(message) {
  const q = message.toLowerCase();
  if (q.includes('amor') || q.includes('pareja') || q.includes('relación')) return 'He entendido que quieres trabajar el área del amor. Recomiendo convertirlo en un objetivo concreto: conocer personas compatibles y aumentar las oportunidades reales de conexión. Próximo paso: definir qué tipo de relación buscas y dónde quieres conocer personas.';
  if (q.includes('dinero') || q.includes('ingreso') || q.includes('ganar')) return 'Prioridad: generar ingresos sin aumentar costes. Recomiendo convertir una habilidad que ya tienes en una oferta sencilla, cobrable y fácil de vender. Próximo paso: elegir una oferta y publicarla en un canal gratuito.';
  if (q.includes('cliente') || q.includes('clientes') || q.includes('vender')) return 'Prioridad: conseguir el primer cliente real. Recomiendo una oferta concreta y fácil de explicar. Próximo paso: publicar esa oferta y llevar cada interesado a una conversación directa.';
  if (q.includes('salud') || q.includes('entren') || q.includes('forma física')) return 'Prioridad: crear una rutina sostenible. Recomiendo definir un único objetivo físico principal. Próximo paso: organizar la semana alrededor de ese objetivo.';
  if (q.includes('evos') || q.includes('negocio')) return 'Prioridad: hacer EVOS útil y vendible antes de añadir más funciones. Recomiendo validar un flujo completo que resuelva un problema real. Próximo paso: elegir un caso de uso y llevarlo hasta resultado.';
  return 'He entendido tu objetivo. Recomiendo convertirlo en una acción concreta y medible. Próximo paso: dime qué resultado quieres conseguir y elegiré yo la vía más directa.';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok:false, error:'GEMINI_API_KEY no configurada' });

  const system = `Eres EVOS Assistant, el copiloto operativo de EVOS (Evolution Operating System).
OBJETIVO: ayudar a la persona a descubrir qué puede monetizar, elegir una prioridad y convertirla en acciones reales, con la mínima fricción posible.
REGLAS: analiza el contexto y propone tú la mejor siguiente acción; no repitas preguntas ya contestadas; interpreta "ok", "sí", "1", "2", "vale" o "adelante" según el contexto; no inventes datos ni acciones ejecutadas; prioriza ingresos reales con recursos existentes antes que desarrollo técnico innecesario; cuando haya varias opciones elige una y explica por qué; máximo 3 pasos.
TEST: si no sabe qué vender, haz un diagnóstico de máximo 5 preguntas, una por vez, para identificar habilidades, experiencia, problemas que puede resolver, facilidad de venta, coste inicial, velocidad al primer ingreso y automatización.
FORMATO: 1. Qué he entendido. 2. Qué recomiendo. 3. Próximo paso concreto.
Los módulos CRM, Agenda, Health, Mind & Emotion, Business, Finance y Community son infraestructura interna. No obligues al usuario a conocerlos.
Principio: ESENCIA → ESTRATEGIA → EJECUCIÓN → EVOLUCIÓN.`;

  const history = readHistory(req);
  const contents = history.concat([{ role:'user', parts:[{ text:message }] }]);

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(apiKey), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:600}})
    });
    const data = await response.json();
    if (!response.ok) {
      const reply = localFallback(message);
      writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
      return res.status(200).json({ok:true,reply,version:'v0.4',mode:'fallback'});
    }
    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(p=>p.text||'').join('').trim();
    const finalReply = reply || localFallback(message);
    writeHistory(res, contents.concat([{role:'model',parts:[{text:finalReply}]}]));
    return res.status(200).json({ok:true,reply:finalReply,version:'v0.4'});
  } catch (e) {
    const reply = localFallback(message);
    writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
    return res.status(200).json({ok:true,reply,version:'v0.4',mode:'fallback'});
  }
};