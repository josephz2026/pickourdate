export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { input } = req.body;
  if (!input || input.length < 2) return res.status(200).json({ suggestions: [] });
  
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ['restaurant', 'bar', 'cafe', 'night_club', 'movie_theater', 'park', 'museum', 'tourist_attraction']
        })
      }
    );
    const data = await response.json();
    if (data.suggestions && data.suggestions.length > 0) {
      const suggestions = data.suggestions.slice(0, 5).map(s => ({
        placeId: s.placePrediction?.placeId,
        name: s.placePrediction?.structuredFormat?.mainText?.text || '',
        address: s.placePrediction?.structuredFormat?.secondaryText?.text || ''
      }));
      return res.status(200).json({ suggestions });
    }
    return res.status(200).json({ suggestions: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
