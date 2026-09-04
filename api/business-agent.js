const clean = (value, max = 320) => String(value || '')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const norm = (value) => clean(value, 2000)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

function safeCatalog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 24).map((x, i) => ({
    id: clean(x.id || `svc-${i + 1}`, 64),
    name: clean(x.name, 100),
    description: clean(x.description, 260),
    price: Number(x.price) || 0,
    duration: Number(x.duration) || 0,
    unit: clean(x.unit || 'EUR', 12),
    keywords: Array.isArray(x.keywords) ? x.keywords.slice(0, 18).map(k => clean(k, 36)) : []
  })).filter(x => x.id && x.name);
}

const intros = {
  es: 'Entiendo. Voy a ayudarte a encontrar la opción más útil sin hacerte perder tiempo.',
  en: 'I understand. I’ll help you find the most useful option without wasting your time.',
  it: 'Capisco. Ti aiuto a trovare l’opzione più utile senza farti perdere tempo.',
  fr: 'Je comprends. Je vais vous aider à trouver l’option la plus utile sans vous faire perdre de temps.'
};

function detectLanguage(message, requested) {
  if (['es','en','it','fr'].includes(requested)) return requested;
  const q = norm(message);
  if (/\b(hello|need|want|price|book|move|training)\b/.test(q)) return 'en';
  if (/\b(ciao|vorrei|prezzo|trasloco|allenamento|bisogno)\b/.test(q)) return 'it';
  if (/\b(bonjour|besoin|prix|demenagement|entrainement|rendez-vous)\b/.test(q)) return 'fr';
  return 'es';
}

function detectIntent(message) {
  const q = norm(message);
  if (/precio|presupuesto|cuanto|price|quote|prezzo|preventivo|prix|devis/.test(q)) return 'quote';
  if (/reserv|cita|agenda|book|appointment|prenot|rendez-vous/.test(q)) return 'booking';
  if (/urgente|hoy|ahora|urgent|today|subito|oggi|maintenant/.test(q)) return 'urgent';
  if (/inform|como funciona|details|how does|informazioni|comment ca marche/.test(q)) return 'information';
  return 'discovery';
}

function fallback(message, catalog, language) {
  const q = norm(message);
  const ranked = catalog.map(item => {
    const hay = norm([item.name, item.description, ...item.keywords].join(' '));
    let score = 0;
    for (const k of item.keywords) if (q.includes(norm(k))) score += 5;
    for (const word of q.split(/\s+/).filter(w => w.length > 3)) if (hay.includes(word)) score += .45;
    return {...item, score};
  }).sort((a,b) => b.score - a.score || a.price - b.price);
  const picked = (ranked.filter(x => x.score > .5).length ? ranked.filter(x => x.score > .5) : ranked).slice(0,3);
  const reason = {
    es:'Encaja con lo que has explicado.',
    en:'It matches what you described.',
    it:'È coerente con ciò che hai spiegato.',
    fr:'Cela correspond à ce que vous avez expliqué.'
  }[language] || 'Encaja con lo que has explicado.';
  return {
    reply: intros[language] || intros.es,
    intent: detectIntent(message),
    recommendations: picked.map(x => ({id:x.id, reason})),
    nextAction: picked.length ? 'offer_services' : 'capture_lead',
    mode: 'rule-engine'
  };
}

async function askAI(message, sector, catalog, language) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const compact = catalog.map(x => ({id:x.id,name:x.name,description:x.description,price:x.price,duration:x.duration,unit:x.unit}));
  const prompt = `You are EVOS Business Agent, a high-quality digital receptionist and sales assistant for an SME.\n\nSECTOR: ${sector}\nREPLY LANGUAGE: ${language}. Always reply in that language.\n\nGOALS:\n1. Understand the customer with empathy.\n2. Recommend only real items from the supplied catalog.\n3. Move toward a qualified lead, quote or booking with minimum friction.\n4. Ask at most one short question when something essential is missing.\n\nRULES:\n- Never invent price, duration, availability, discounts, results or services.\n- Never promise guaranteed savings, sales or outcomes.\n- No medical/legal diagnosis. Escalate emergencies instead of selling.\n- Be warm, concise, professional and natural; never robotic or pushy.\n- Return ONLY valid JSON.\n\nJSON: {"reply":"1-2 short sentences","intent":"discovery|information|quote|booking|urgent","recommendations":[{"id":"exact catalog id","reason":"short reason"}],"nextAction":"offer_services|ask_one_question|capture_lead"}\n\nCUSTOMER: ${clean(message,1200)}\nCATALOG: ${JSON.stringify(compact)}`;
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(key), {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      contents:[{role:'user',parts:[{text:prompt}]}],
      generationConfig:{temperature:.18,maxOutputTokens:500,responseMimeType:'application/json'}
    })
  });
  if (!r.ok) return null;
  const data = await r.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    const ids = new Set(catalog.map(x => x.id));
    const recommendations = (parsed.recommendations || []).slice(0,3)
      .filter(x => ids.has(String(x.id || '')))
      .map(x => ({id:String(x.id), reason:clean(x.reason,180)}));
    return {
      reply: clean(parsed.reply,360) || intros[language] || intros.es,
      intent: clean(parsed.intent,24) || detectIntent(message),
      recommendations,
      nextAction: clean(parsed.nextAction,32) || (recommendations.length ? 'offer_services' : 'capture_lead'),
      mode:'ai'
    };
  } catch { return null; }
}

module.exports = async function handler(req,res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }
  const message = clean(req.body?.message,1200);
  const sector = clean(req.body?.sector || 'business',40);
  const catalog = safeCatalog(req.body?.catalog);
  const language = detectLanguage(message, clean(req.body?.language,4));
  if (!message) return res.status(400).json({ok:false,error:'Empty message'});
  if (!catalog.length) return res.status(400).json({ok:false,error:'Catalog unavailable'});
  try {
    const ai = await askAI(message, sector, catalog, language);
    const result = ai || fallback(message,catalog,language);
    return res.status(200).json({ok:true,language,sector,...result,version:'evos-agent-suite-v1'});
  } catch {
    return res.status(200).json({ok:true,language,sector,...fallback(message,catalog,language),mode:'fallback',version:'evos-agent-suite-v1'});
  }
};
