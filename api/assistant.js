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
function localFallback(message, context) {
  const q = message.toLowerCase();
  const goal = context?.member?.primary_goal;
  const avg = context?.latest_assessment?.average;
  const area = context?.latest_assessment?.dominant_area || context?.member?.dominant_area;
  const next = context?.latest_recommendation?.next_action;
  if (q.includes('dinero') || q.includes('ingreso') || q.includes('ganar') || q.includes('oferta')) return monetizationFallback();
  if (context && (q.includes('prioridad') || q.includes('semana') || q.includes('plan') || q.includes('siguiente'))) {
    return `Tu prioridad EVOS ahora es convertir el diagnóstico en ejecución.\n\n1. OBJETIVO: ${goal || 'define una meta concreta esta semana'}.\n2. ESTADO ACTUAL: ${avg ?? 'sin puntuación global'}${area ? ` · área prioritaria ${area}` : ''}.\n3. ACCIÓN PRINCIPAL: ${next || 'completa tu Test EVOS y reserva una acción con fecha'}.\n4. ESTA SEMANA: ejecuta una acción medible, registra el resultado y vuelve a EVOS para ajustar el siguiente paso.\n5. GESTIÓN: usa Agenda para convertir la recomendación en una cita o bloque real.`;
  }
  if (q.includes('cliente') || q.includes('clientes') || q.includes('vender')) return `Prioridad: conseguir el primer cliente real.\n\n1. OFERTA: programa de transformación de 6 semanas con coaching + entrenamiento + seguimiento.\n2. PRECIO PILOTO: 149 €.\n3. PRIMERA ACCIÓN: publicar la oferta y llevar interesados a WhatsApp.\n\nYo me encargo de estructurar después el anuncio, el seguimiento y el flujo EVOS.`;
  if (q.includes('salud') || q.includes('entren') || q.includes('forma física')) return 'Prioridad: convertir tu objetivo físico en una acción medible. Próximo paso: selecciona una meta semanal, agenda la sesión necesaria y registra la nueva medición en EVOS.';
  if (q.includes('evos') || q.includes('negocio')) return 'Prioridad: hacer EVOS útil y vendible. Próximo paso: conectar cada diagnóstico con una recomendación, una reserva y un seguimiento medible.';
  return next ? `He revisado tu contexto EVOS. Tu siguiente acción guardada es: ${next}` : 'He entendido tu objetivo. Voy a elegir la vía más directa y convertirla en una acción concreta, sin hacerte repetir información.';
}
function safeContext(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const member = raw.member && typeof raw.member === 'object' ? raw.member : {};
  const assessment = raw.latest_assessment && typeof raw.latest_assessment === 'object' ? raw.latest_assessment : null;
  const recommendation = raw.latest_recommendation && typeof raw.latest_recommendation === 'object' ? raw.latest_recommendation : null;
  const booking = raw.next_booking && typeof raw.next_booking === 'object' ? raw.next_booking : null;
  const clean = {
    member: {
      display_name: String(member.display_name || '').slice(0,80) || null,
      primary_goal: String(member.primary_goal || '').slice(0,220) || null,
      evos_level: Number(member.evos_level) || 1,
      dominant_area: String(member.dominant_area || '').slice(0,40) || null
    },
    latest_assessment: assessment ? {
      body: Number(assessment.body), mind: Number(assessment.mind), emotion: Number(assessment.emotion), relationships: Number(assessment.relationships), purpose: Number(assessment.purpose), average: Number(assessment.average), dominant_area: String(assessment.dominant_area || '').slice(0,40) || null, date: String(assessment.date || '').slice(0,40) || null
    } : null,
    latest_recommendation: recommendation ? {
      title: String(recommendation.title || '').slice(0,160), recommendation: String(recommendation.recommendation || '').slice(0,800), next_action: String(recommendation.next_action || '').slice(0,400), priority: Number(recommendation.priority) || null
    } : null,
    next_booking: booking ? {service:String(booking.service || '').slice(0,160),starts_at:String(booking.starts_at || '').slice(0,50),status:String(booking.status || '').slice(0,40)} : null
  };
  return clean;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });
  const message = String((req.body && req.body.message) || '').trim().slice(0,3000);
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });
  const context = safeContext(req.body && req.body.context);
  const mode = String((req.body && req.body.mode) || 'general');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const reply = localFallback(message, context);
    return res.status(200).json({ok:true,reply,version:'v0.5',mode:'evos-local'});
  }
  const system = `Eres EVOS AI, copiloto operativo y de gestión de EVOS. Tu función es transformar información real del usuario en decisiones, acciones medibles, reservas, seguimiento y evolución continua.
REGLAS: usa el contexto EVOS disponible; no inventes datos, resultados, clientes, ventas ni acciones ejecutadas; no repitas preguntas si el contexto ya contiene la respuesta; elige la mejor opción cuando sea razonable; prioriza acciones concretas, de coste cero o mínimo; cuando exista una recomendación guardada, úsala como punto de partida; cuando exista una próxima reserva, tenla en cuenta; si el usuario pide un plan, conviértelo en pasos con horizonte temporal; si detectas riesgo médico, legal o financiero, no sustituyas a un profesional y limita la respuesta a orientación segura.
PARA MIEMBROS EVOS: actúa como un dashboard inteligente. Resume situación, identifica prioridad, propone siguiente acción y explica cómo medirla. Máximo 5 puntos salvo que el usuario pida detalle.
PARA NEGOCIO/INGRESOS: prioriza validación real de oferta, captación, conversión, seguimiento y recurrencia antes que más tecnología.
Principio EVOS: ESENCIA → ESTRATEGIA → EJECUCIÓN → EVOLUCIÓN.`;
  const contextText = context ? `\nCONTEXTO PRIVADO EVOS ACTUAL:\n${JSON.stringify(context)}` : '';
  const history = readHistory(req);
  const contents = history.concat([{ role:'user', parts:[{ text:message + contextText }] }]);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(apiKey), {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents,generationConfig:{maxOutputTokens:900,temperature:0.22}})
    });
    const data = await response.json();
    if (!response.ok) {
      const reply = localFallback(message, context); writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
      return res.status(200).json({ok:true,reply,version:'v0.5',mode:'fallback'});
    }
    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(p=>p.text||'').join('').trim();
    const finalReply = reply || localFallback(message, context); writeHistory(res, contents.concat([{role:'model',parts:[{text:finalReply}]}]));
    return res.status(200).json({ok:true,reply:finalReply,version:'v0.5',mode:mode === 'member' ? 'member-ai' : 'ai'});
  } catch (e) {
    const reply = localFallback(message, context); writeHistory(res, contents.concat([{role:'model',parts:[{text:reply}]}]));
    return res.status(200).json({ok:true,reply,version:'v0.5',mode:'fallback'});
  }
};