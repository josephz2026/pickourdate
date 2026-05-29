const SUPABASE_URL = 'https://jjzscluiudnpzrpfmfje.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqenNjbHVpdWRucHpycGZtZmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTU5MDYsImV4cCI6MjA5NTU3MTkwNn0.Gibxci4jo9k5a9khF-kF4SxEPCq57umNr4FUvZBLzh0';

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.text();
    console.error('Supabase error:', response.status, error);
    throw new Error(error);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getDatePage(slug) {
  const data = await supabaseRequest(`date_pages?slug=eq.${encodeURIComponent(slug)}&select=*`);
  return data && data.length > 0 ? data[0] : null;
}

async function createDatePage(pageData) {
  const data = await supabaseRequest('date_pages', {
    method: 'POST',
    body: JSON.stringify(pageData)
  });
  return data && data.length > 0 ? data[0] : null;
}

async function updateDatePage(slug, updates) {
  const data = await supabaseRequest(`date_pages?slug=eq.${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  return data;
}
