import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { action, email, accessToken, userId, cvData } = req.body || {};

  try {
    if (action === 'magic_link') {
      const origin = req.headers.origin || 'https://pathfinder-cv.vercel.app';
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: origin }
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'get_user') {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data.user);
    }

    if (action === 'save_cv') {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
      });
      const { error } = await userClient.from('cv_data').upsert({
        user_id: userId,
        cv_json: cvData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'load_cv') {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
      });
      const { data, error } = await userClient
        .from('cv_data')
        .select('cv_json')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') return res.status(400).json({ error: error.message });
      return res.status(200).json({ cv: data?.cv_json || null });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
