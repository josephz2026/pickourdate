export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { input } = req.body || {};
  if (!input || input.length < 2) return res.status(200).json({ suggestions: [] });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_API_KEY is not set');
    return res.status(500).json({ error: 'GOOGLE_API_KEY is not set on the server' });
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({ input })
      }
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Google Places error:', JSON.stringify(data.error || data));
      return res.status(502).json({
        error: data.error?.message || 'Google Places request failed',
        status: data.error?.status,
        reason: data.error?.details?.[0]?.reason
      });
    }

    const suggestions = (data.suggestions || []).slice(0, 5).map(s => ({
      placeId: s.placePrediction?.placeId,
      name: s.placePrediction?.structuredFormat?.mainText?.text || '',
      address: s.placePrediction?.structuredFormat?.secondaryText?.text || ''
    }));
    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error('Autocomplete function error:', err);
    return res.status(500).json({ error: err.message });
  }
}
