const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function safeCatalog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0,40).map(x => ({
    professional_service_id: String(x.professional_service_id || '').slice(0,80),
    service_name: String(x.service_name || '').slice(0,120),
    category: String(x.category || '').slice(0,60),
    description: String(x.description || '').slice(0,320),
    professional_name: String(x.professional_name || '').slice(0,100),
    duration_minutes: Number(x.duration_minutes) || 0,
    price_cents: Number(x.price_cents) || 0,
    currency: String(x.currency || 'EUR').slice(0,8),
    modality: String(x.modality || '').slice(0,30),
    featured: Boolean(x.featured)
  })).filter(x => x.professional_service_id && x.service_name);
}

const categoryTerms = {
  fitness:['entrenar','entrenamiento','ejercicio','fuerza','musculo','forma fisica','adelgazar','peso','fitness','movilidad'],
  massage:['masaje','contractura','tension muscular','espalda','cuello','descargar','relajante','deportivo'],
  wellness:['bienestar','energia','cansancio','estres','equilibrio','sentirme mejor','habitos'],
  coaching:['emocion','emocional','bloqueo','motivacion','confianza','cambio','decidir','objetivo'],
  mind:['foco','concentracion','mente','claridad','productividad','disciplina'],
  relationships:['pareja','relacion','relaciones','conflicto','separacion','comunicacion'],
  mindfulness:['meditar','meditacion','calma','silencio','respirar','relajar mente'],
  tarot:['tarot','cartas','lectura','orientacion simbolica'],
  astrology:['astrologia','carta natal','signo','natal','horoscopo'],
  dance:['baile','bailar','movimiento','salsa','bachata','zouk'],
  guidance:['no se','orientacion','guia','por donde empezar','ayuda','evos']
};

function fallbackMatch(message, catalog) {
  const q = norm(message);
  const scored = catalog.map(item => {
    let score = item.featured ? 0.15 : 0;
    const cat = norm(item.category);
    const hay = norm([item.service_name,item.description,item.category].join(' '));
    for (const [category,terms] of Object.entries(categoryTerms)) {
      const hits = terms.filter(t => q.includes(norm(t))).length;
      if (hits && cat === category) score += hits * 5;
      else if (hits && hay.includes(category)) score += hits * 2;
    }
    const words = q.split(/\s+/).filter(w => w.length > 4);
    for (const w of words) if (hay.includes(w)) score += 0.5;
    return {...item,score};
  }).sort((a,b)=>b.score-a.score || a.price_cents-b.price_cents);

  let picks = scored.filter(x => x.score > 0.3).slice(0,3);
  if (!picks.length) {
    picks = scored.filter(x => ['guidance','wellness','coaching'].includes(norm(x.category))).slice(0,3);
  }
  if (!picks.length) picks = scored.slice(0,3);
  return picks.map((x,i)=>({
    ...x,
    reason: i === 0 ? 'Es la opción que mejor encaja con lo que has explicado.' : 'Puede ser una alternativa útil según tu prioridad.'
  }));
}

async function aiMatch(message, catalog) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const compact = catalog.map(x => ({id:x.professional_service_id,name:x.service_name,category:x.category,description:x.description,professional:x.professional_name,duration:x.duration_minutes,price_cents:x.price_cents,currency:x.currency,modality:x.modality}));
  const prompt = `Eres EVOS Guide, un recepcionista comercial prudente. El cliente explica una necesidad y debes elegir como máximo 3 servicios REALES del catálogo. No inventes servicios, precios, diagnósticos ni beneficios médicos. Prioriza un siguiente paso sencillo y relevante. Devuelve SOLO JSON válido con esta forma: {"intro":"frase breve","recommendations":[{"id":"id exacto","reason":"motivo breve"}]}.\n\nCLIENTE: ${message}\n\nCATALOGO: ${JSON.stringify(compact)}`;
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key='+encodeURIComponent(key),{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,maxOutputTokens:500,responseMimeType:'application/json'}})
  });
  if (!r.ok) return null;
  const data = await r.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p=>p.text||'').join('').trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    const byId = new Map(catalog.map(x=>[x.professional_service_id,x]));
    const picks = (parsed.recommendations || []).slice(0,3).map(rec => {
      const item = byId.get(String(rec.id || ''));
      return item ? {...item,reason:String(rec.reason || '').slice(0,220)} : null;
    }).filter(Boolean);
    if (!picks.length) return null;
    return {intro:String(parsed.intro || 'He seleccionado las opciones que mejor encajan.').slice(0,240),picks};
  } catch { return null; }
}

module.exports = async (req,res) => {
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'Metodo no permitido'});
  const message = String(req.body?.message || '').trim().slice(0,1200);
  const catalog = safeCatalog(req.body?.catalog);
  if (!message) return res.status(400).json({ok:false,error:'Explica brevemente que necesitas'});
  if (!catalog.length) return res.status(400).json({ok:false,error:'Catalogo EVOS no disponible'});
  try {
    const ai = await aiMatch(message,catalog);
    const picks = ai?.picks || fallbackMatch(message,catalog);
    return res.status(200).json({ok:true,intro:ai?.intro || 'He seleccionado los servicios que mejor encajan con lo que has contado.',recommendations:picks,mode:ai?'ai':'rule-engine'});
  } catch (e) {
    return res.status(200).json({ok:true,intro:'He seleccionado una via practica para empezar.',recommendations:fallbackMatch(message,catalog),mode:'fallback'});
  }
};