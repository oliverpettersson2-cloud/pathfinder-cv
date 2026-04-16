// api/jobnet.js — Vercel Edge Function proxy för job.jobnet.dk
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url  = new URL(req.url);
  const q    = url.searchParams.get('SearchString') || '';
  const page = parseInt(url.searchParams.get('CurrentPage') || '1', 10);

  // Jobnet använder Offset + SortValue (inte CurrentPage/SortOrder)
  const offset = (page - 1) * 20;

  const params = new URLSearchParams({
    SearchString: q,
    Zip:          '3000',       // 3000 = Helsingør postnummer
    Offset:       String(offset),
    SortValue:    'BestMatch',
    Region:       '',
    Municipality: '',
    Country:      'DK',
  });

  const upstream = `https://job.jobnet.dk/CV/FindWork/JobList?${params}`;

  try {
    const resp = await fetch(upstream, {
      headers: {
        'Accept':           'application/json, text/javascript, */*; q=0.01',
        'Accept-Language':  'da-DK,da;q=0.9',
        'User-Agent':       'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer':          'https://job.jobnet.dk/CV/FindWork',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const text = await resp.text();
    console.log('[jobnet] status:', resp.status, 'len:', text.length, 'preview:', text.slice(0, 200));

    let data;
    try { data = JSON.parse(text); }
    catch { return new Response(JSON.stringify({ error: 'parse_fail', status: resp.status, raw: text.slice(0, 800) }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=120', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
