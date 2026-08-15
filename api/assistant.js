module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método no permitido' });
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) return res.status(400).json({ ok:false, error:'Mensaje vacío' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ ok:false, error:'IA no configurada' });
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:'gpt-5-mini',
        instructions:'Eres EVOS Assistant, asistente operativo de Evolution Operating System. Responde en español, breve, claro y orientado a la siguiente acción. EVOS integra CRM, Agenda, Health, Mind & Emotion, Business, Finance y Community. No inventes acciones realizadas ni datos. Si una función aún no está conectada, indícalo.',
        input:message,
        max_output_tokens:500
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ok:false,error:(data.error && data.error.message) || 'Error del proveedor IA'});
    return res.status(200).json({ok:true,reply:data.output_text || 'Respuesta recibida sin texto.'});
  } catch (e) {
    return res.status(500).json({ok:false,error:'No se pudo conectar con la IA'});
  }
};