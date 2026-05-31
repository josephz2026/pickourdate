export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let { input } = req.body;
  if (!input) return res.status(400).json({ error: 'Missing input' });
  try {
    let placeName = input;
    if (input.startsWith('http')) {
      if (input.includes('goo.gl') || input.includes('maps.app')) {
        try {
          const redirectRes = await fetch(input, { redirect: 'follow' });
          input = redirectRes.url;
          const nameMatch = input.match(/place\/([^/@?]+)/) || 
                           input.match(/search\/([^/@?]+)/) ||
                           input.match(/q=([^&]+)/);
          if (nameMatch) placeName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
        } catch(e) {}
      }
      const match = input.match(/place\/([^/@]+)/);
      if (match) placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    const apiKey = process.env.GOOGLE_API_KEY;
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.id'
        },
        body: JSON.stringify({ textQuery: placeName })
      }
    );
    const data = await response.json();
console.log('Places API response:', JSON.stringify(data));
    if (data.places && data.places.length > 0) {
      const places = data.places.slice(0, 5).map(place => ({
        name: place.displayName?.text || placeName,
        address: place.formattedAddress || '',
        rating: place.rating || null,
        reviews: place.userRatingCount
          ? place.userRatingCount.toLocaleString()
          : null,
        maps: `https://www.google.com/maps/place/?q=place_id:${place.id}`
      }));
      return res.status(200).json({ results: places });
    }
    return res.status(200).json({ results: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
