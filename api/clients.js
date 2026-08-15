const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ownerId = process.env.EVOS_OWNER_ID;

  if (!url || !anonKey || !ownerId) {
    return json(res, 500, { ok: false, error: 'Falta configuración de Supabase/EVOS_OWNER_ID' });
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  };
  const endpoint = `${url}/rest/v1/clients`;

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${endpoint}?owner_id=eq.${ownerId}&select=*&order=created_at.desc`, { headers });
      const data = await r.json();
      return json(res, r.status, r.ok ? { ok: true, clients: data } : { ok: false, error: data });
    }

    if (req.method === 'POST') {
      const { name, email = null, phone = null, status = 'Nuevo Lead' } = req.body || {};
      if (!name?.trim()) return json(res, 400, { ok: false, error: 'Nombre obligatorio' });
      const r = await fetch(endpoint, {
        method: 'POST', headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ owner_id: ownerId, name: name.trim(), email, phone, status })
      });
      const data = await r.json();
      return json(res, r.status, r.ok ? { ok: true, client: data[0] } : { ok: false, error: data });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!id) return json(res, 400, { ok: false, error: 'ID obligatorio' });
      const r = await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}&owner_id=eq.${ownerId}`, { method: 'DELETE', headers });
      if (!r.ok) return json(res, r.status, { ok: false, error: await r.text() });
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { ok: false, error: 'Método no permitido' });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message });
  }
}
