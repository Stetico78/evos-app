function readHistory(req) {
  const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('evos_chat='));
  if (!raw) return [];
  try { return JSON.parse(Buffer.from(raw.slice(9), 'base64url').toString('utf8')).slice(-8); } catch { return []; }
}
function writeHistory(res, history) {
  const encoded = Buffer.from(JSON.stringify(history.slice(-8)), 'utf8').toString('base64url');
  res.setHeader('Set-Cookie', `evos_chat=${encoded}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax; Secure`);
}
function monetizationFallback() {
  return `He elegido la vía más rápida para validar ingresos sin gastar dinero.\n\n1. OFERTA: EVOS Transformación 6 Semanas — coaching emocional + entrenamiento personalizado + seguimiento.\n2. PRECIO INICIAL: 149 € por programa piloto; después podremos subirlo cuando tengamos resultados y testimonios.\n3. CLIENTE OBJETIVO: personas que quieren recuperar energía, forma física y claridad y necesitan acompañamiento real.\n4. TEXTO DE VENTA: “En 6 semanas te ayudo a recuperar energía, mejorar tu forma física y ordenar lo que te está bloqueando. Entrenamiento + coaching + seguimiento personalizado. Plazas piloto limitadas.”\n5. PRIMERA ACCIÓN: publicar esta oferta en tus canales gratuitos y llevar cada interesado a WhatsApp.\n\nNo necesitas construir más tecnología para empezar a vender. Primero validamos una venta real; después automatizamos EVOS alrededor de lo que funciona.`;
}
function localFallback(message) {
  const q = message.toLowerCase();
  if (q.includes('dinero') || q.includes('ingreso') || q.includes('ganar') || q.includes('oferta')) return monetizationFallback();
  if (q.includes('cliente') || q.includes('clientes') || q.includes('vender')) return `Prioridad: conseguir el primer cliente real.\n\n1. OFERTA: programa de transformación de 6 semanas con coaching + entrenamiento + seguimiento.\n2. PRECIO PILOTO: 149 €.\n3. PRIMERA ACCIÓN: publicar la oferta y llevar interesados a WhatsApp.\n\nYo me encargo de estructurar después el anuncio, el seguimiento y el flujo EVOS.`;
  if (q.includes('salud') || q.includes('entren') || q.includes('forma física')) return 'Prioridad: convertir tu experiencia como entrenador y coach en una oferta cobrable. Próximo paso: programa de 6 semanas con objetivo físico y acompañamiento personal.';
  if (q.includes('evos') || q.includes('negocio')) return 'Prioridad: hacer EVOS vendible antes de añadir más tecnología. Próximo paso: conectar el flujo Oferta → Captación → Cliente → Seguimiento → Venta.';
  return 'He entendido tu objetivo. Voy a elegir la vía más directa y convertirla en una acción concreta, sin hacerte repetir información.';
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok:false, error:'GEMINI_API_KEY no configurada' });
  const system = `Eres EVOS Assistant, copiloto operativo de EVOS. El usuario ya tiene experiencia demostrable en coaching emocional, entrenamiento/fitness, baile, tarot/astrología, creación de contenido y uso de IA, además de estar desarrollando EVOS.
OBJETIVO PRINCIPAL: convertir sus capacidades existentes en ingresos reales cuanto antes y después automatizar y escalar.
REGLAS: analiza el contexto; elige tú la mejor opción; no hagas que el usuario redacte lo que EVOS puede construir; no repitas habilidades ya conocidas; interpreta "ok", "sí", "vale" y "adelante" según contexto; no inventes clientes, ventas ni acciones ejecutadas; prioriza coste cero o mínimo y velocidad hasta el primer ingreso.
CUANDO EL OBJETIVO SEA GENERAR DINERO O CONSEGUIR CLIENTES: no devuelvas la tarea al usuario. Construye directamente una propuesta inicial con: 1) nombre de oferta, 2) transformación prometida, 3) cliente objetivo, 4) precio piloto, 5) texto corto de venta, 6) primera acción de captación. Si falta un dato imprescindible, elige una hipótesis razonable y márcala como propuesta piloto en lugar de bloquear el avance.
No desarrolles más tecnología antes de validar una venta real, salvo que una función técnica sea imprescindible para esa venta.
Máximo 5 puntos y lenguaje muy claro.
Principio: ESENCIA → ESTRATEGIA → EJECUCIÓN → EVOLUCIÓN.`;
  const history = readHistory(req);
  const contents = history.concat([{ role:'user', parts:[{ text:message }] }]);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(apiKey), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:700,temperature:0.25}})
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