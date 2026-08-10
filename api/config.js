export default function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({
      ok: false,
      error: 'Faltan variables de Supabase'
    });
  }

  return res.status(200).json({
    ok: true,
    url,
    anonKey
  });
}
