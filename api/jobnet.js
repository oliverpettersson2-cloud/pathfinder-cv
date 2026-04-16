// api/jobnet.js — Vercel Edge Function proxy för job.jobnet.dk
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url  = new URL(req.url);
  const q    = url.searchParams.get('SearchString') || '';
  const page = url.searchParams.get('CurrentPage')  || '1';
  const per  = url.searchParams.get('ItemsPerPage') || '20';

  // Prova utan SearchLocation — annars returnerar Jobnet 0 träffar
  // Vi filtrerar på Helsingør-kommunen med WorkArea istället
  const params = new URLSearchParams({
    SearchString:   q,
    WorkArea:       'Helsingør',   // kommunnamn på danska
    CurrentPage:    page,
    ItemsPerPage:   per,
    SortOrder:      'CreatedDate',
  });

  const upstream = `https://job.jobnet.dk/CV/FindWork/JobList?${params}`;

  try {
    const resp = await fetch(upstream, {
      headers: {
        'Accept':           'application/json, text/javascript, */*; q=0.01',
        'Accept-Language':  'da,sv;q=0.9,en;q=0.8',
        'User-Agent':       'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Referer':          'https://job.jobnet.dk/CV/FindWork',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin':           'https://job.jobnet.dk',
      },
    });

    const text = await resp.text();
    console.log('[jobnet] status:', resp.status, 'url:', upstream);
    console.log('[jobnet] body slice:', text.slice(0, 300));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'parse_fail', status: resp.status, raw: text.slice(0, 800) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               's-maxage=120, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
