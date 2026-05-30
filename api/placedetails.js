export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { placeId } = req.body;
  if (!placeId) return res.status(400).json({ error: 'Missing placeId' });
  
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'displayName,formattedAddress,rating,userRatingCount,id'
        }
      }
    );
    const place = await response.json();
    return res.status(200).json({
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      rating: place.rating || null,
      reviews: place.userRatingCount ? place.userRatingCount.toLocaleString() : null,
      maps: `https://www.google.com/maps/place/?q=place_id:${place.id}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
