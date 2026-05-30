export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { input } = req.body;
  if (!input) return res.status(400).json({ error: 'Missing input' });
  try {
    let placeName = input;
    if (input.startsWith('http')) {
      const match = input.match(/place\/([^/@]+)/);
      if (match) placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&fields=name,rating,user_ratings_total,formatted_address,place_id&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const places = data.results.slice(0, 5).map(place => ({
        name: place.name,
        address: place.formatted_address || '',
        rating: place.rating || null,
        reviews: place.user_ratings_total
          ? place.user_ratings_total.toLocaleString()
          : null,
        maps: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      }));
      return res.status(200).json({ results: places });
    }
    return res.status(200).json({ results: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
