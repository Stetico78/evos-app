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
  if (q.includes('dinero') || q.includes('ingreso') || q.includes('ganar')) return 'He entendido que quieres generar ingresos cuanto antes. Por tus capacidades actuales, la vía más directa es vender un servicio que combine coaching/entrenamiento y acompañamiento personal, usando EVOS como sistema de captación y seguimiento. Próximo paso: convertirlo en una oferta simple con precio y llamada a la acción.';
  if (q.includes('cliente') || q.includes('clientes') || q.includes('vender')) return 'Prioridad: conseguir clientes reales. Tu ventaja es combinar entrenamiento, coaching emocional, baile y orientación personal. Próximo paso: elegir una oferta principal, publicarla y llevar cada interesado a WhatsApp.';
  if (q.includes('salud') || q.includes('entren') || q.includes('forma física')) return 'Prioridad: convertir tu experiencia como entrenador y coach en un servicio claro. Próximo paso: definir un objetivo físico, una duración y un precio para una primera oferta.';
  if (q.includes('evos') || q.includes('negocio')) return 'Prioridad: hacer EVOS vendible antes de añadir más tecnología. Próximo paso: terminar un flujo que capte un cliente, registre sus datos y lo lleve hasta una primera venta.';
  return 'He entendido tu objetivo. Voy a utilizar el contexto disponible para elegir la vía más directa y evitar que tengas que repetir información.';
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok:false, error:'GEMINI_API_KEY no configurada' });
  const system = `Eres EVOS Assistant, copiloto operativo de EVOS. El usuario ya tiene experiencia demostrable en coaching emocional, entrenamiento/fitness, baile, tarot/astrología, creación de contenido y uso de IA, además de estar desarrollando EVOS. NO preguntes de nuevo cuáles son sus habilidades salvo que falte un dato imprescindible.
OBJETIVO: convertir sus capacidades existentes en ingresos reales y después automatizar y escalar.
REGLAS: analiza contexto; elige tú la mejor siguiente acción; interpreta "ok", "sí", "1", "2", "vale" y "adelante" según contexto; no inventes datos ni acciones ejecutadas; prioriza ingresos reales con recursos existentes; no obligues a conocer módulos técnicos; máximo 3 pasos.
Si necesitas diagnóstico, pregunta solo por el dato que realmente falta. Evalúa velocidad hasta primer ingreso, coste, facilidad de venta, demanda y automatización.
FORMATO: 1. Qué he entendido. 2. Qué recomiendo. 3. Próximo paso concreto.
Principio: ESENCIA → ESTRATEGIA → EJECUCIÓN → EVOLUCIÓN.`;
  const history = readHistory(req);
  const contents = history.concat([{ role:'user', parts:[{ text:message }] }]);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(apiKey), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:600,temperature:0.35}})
    });
    const data = await response.json();
    if (!response.ok) {
      const reply = localFallback(message); writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
      return res.status(200).json({ok:true,reply,version:'v0.4',mode:'fallback'});
    }
    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(p=>p.text||'').join('').trim();
    const finalReply = reply || localFallback(message); writeHistory(res, contents.concat([{role:'model',parts:[{text:finalReply}]}]));
    return res.status(200).json({ok:true,reply:finalReply,version:'v0.4'});
  } catch (e) {
    const reply = localFallback(message); writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
    return res.status(200).json({ok:true,reply,version:'v0.4',mode:'fallback'});
  }
};