export default async function handler(req, res) {
  const { slug } = req.query;
  
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/date_pages?slug=eq.${encodeURIComponent(slug)}&select=guest_name,sender_name,personal_note,status&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const data = await response.json();
    const page = data && data.length > 0 ? data[0] : null;

    if (!page) {
      return res.status(404).json({ error: 'Not found' });
    }

    const isConfirmed = page.status === 'confirmed';
    const title = isConfirmed
      ? `It's a date! 🎉`
      : `You have a date proposal 💌`;
    const description = isConfirmed
      ? `${page.guest_name} confirmed the date${page.sender_name ? ` with ${page.sender_name}` : ''}.`
      : `${page.sender_name ? page.sender_name + ' wants' : 'Someone wants'} to take you out${page.guest_name ? `, ${page.guest_name}` : ''}. Pick your venue and time.`;

    return res.status(200).json({ title, description });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
