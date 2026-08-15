module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });

  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok:false, error:'GEMINI_API_KEY no configurada' });

  const system = 'Eres EVOS Assistant, asistente operativo de EVOS (Evolution Operating System). Responde en español de forma breve, clara, resolutiva y orientada a la siguiente acción. EVOS integra CRM, Agenda, Health, Mind & Emotion, Business, Finance y Community. No inventes datos ni acciones realizadas. Si una función aún no está conectada, indícalo claramente. Prioriza simplicidad, automatización, resultados reales y monetización.';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.5 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ ok:false, error:(data.error && data.error.message) || 'Error de Gemini' });
    }

    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || [])
      .map(p => p.text || '')
      .join('')
      .trim();

    return res.status(200).json({ ok:true, reply: reply || 'Gemini respondió sin texto.' });
  } catch (e) {
    return res.status(500).json({ ok:false, error:'No se pudo conectar con Gemini' });
  }
};