const AREAS = {
  body: 'cuerpo',
  mind: 'mente',
  emotion: 'emoción',
  relationships: 'relaciones',
  purpose: 'propósito'
};

function cleanScores(raw = {}) {
  return Object.fromEntries(
    Object.keys(AREAS)
      .map((area) => [area, Number(raw[area])])
      .filter(([, value]) => Number.isFinite(value) && value >= 0 && value <= 100)
  );
}

function fallback(input = {}) {
  const scores = cleanScores(input.scores);
  const entries = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const area = entries[0]?.[0] || 'emotion';
  const label = AREAS[area];
  const score = scores[area];
  const goal = String(input.goal || '').trim().slice(0, 180);
  const goalText = goal ? ` para avanzar hacia “${goal}”` : '';

  return {
    title: `Prioridad EVOS: ${label}`,
    recommendation: `Durante los próximos 30 días concentra tu trabajo en ${label}${goalText}. Completa una acción concreta por semana y registra cómo cambia tu puntuación.`,
    next_action: `Elige hoy una acción de ${label} que puedas completar en los próximos 7 días.`,
    priority: score !== undefined && score < 40 ? 5 : 4
  };
}

function validRecommendation(value) {
  return value
    && typeof value === 'object'
    && String(value.title || '').trim()
    && String(value.recommendation || '').trim()
    && String(value.next_action || '').trim();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const input = req.body || {};
  const scores = cleanScores(input.scores);
  if (!Object.keys(scores).length) {
    return res.status(400).json({ ok: false, error: 'Puntuaciones EVOS no válidas' });
  }

  const safeInput = {
    scores,
    goal: String(input.goal || '').trim().slice(0, 180),
    dominant_area: Object.prototype.hasOwnProperty.call(AREAS, input.dominant_area)
      ? input.dominant_area
      : undefined
  };
  const local = fallback(safeInput);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ ok: true, ...local, mode: 'fallback' });
  }

  const system = `Eres el motor de recomendaciones de EVOS. Recibes puntuaciones de 0 a 100 en cuerpo, mente, emoción, relaciones y propósito, además de un objetivo. Debes devolver JSON estricto con: title, recommendation, next_action, priority (1-5). No diagnostiques enfermedades ni hagas promesas médicas. Recomienda una prioridad práctica de 30 días, clara, medible y breve.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(safeInput) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350,
            responseMimeType: 'application/json'
          }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error('AI request failed');

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || '')
      .join('')
      .trim();
    const parsed = JSON.parse(text);
    if (!validRecommendation(parsed)) throw new Error('AI response incomplete');

    return res.status(200).json({
      ok: true,
      title: String(parsed.title).trim().slice(0, 120),
      recommendation: String(parsed.recommendation).trim().slice(0, 900),
      next_action: String(parsed.next_action).trim().slice(0, 300),
      priority: Math.min(5, Math.max(1, Number(parsed.priority) || 3)),
      mode: 'ai'
    });
  } catch {
    return res.status(200).json({ ok: true, ...local, mode: 'fallback' });
  }
};
