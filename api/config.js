export default function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzswijcavmkgwqbgtlac.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Azl0VuEcGbPwKZs1n21NDg_4uD1avti';

  return res.status(200).json({
    ok: true,
    url,
    anonKey
  });
}
