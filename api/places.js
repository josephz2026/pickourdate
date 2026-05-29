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
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName)}&inputtype=textquery&fields=name,rating,user_ratings_total,formatted_address,place_id&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      return res.status(200).json({
        name: place.name,
        address: place.formatted_address || '',
        rating: place.rating || 4.5,
        reviews: place.user_ratings_total
          ? place.user_ratings_total.toLocaleString()
          : '500+',
        maps: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      });
    }

    return res.status(200).json({
      name: placeName,
      address: '',
      rating: 4.5,
      reviews: '500+',
      maps: input.startsWith('http')
        ? input
        : `https://maps.google.com/?q=${encodeURIComponent(placeName)}`
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}