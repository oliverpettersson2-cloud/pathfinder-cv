// api/jobnet.js — Vercel Edge Function proxy för job.jobnet.dk
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url  = new URL(req.url);
  const q    = url.searchParams.get('SearchString') || '';
  const page = url.searchParams.get('CurrentPage')  || '1';
  const per  = url.searchParams.get('ItemsPerPage') || '20';

  // SearchLocation=Helsingør är det parameter Jobnet förstår för orten
  const params = new URLSearchParams({
    SearchString:   q,
    SearchLocation: 'Helsingør',
    CurrentPage:    page,
    ItemsPerPage:   per,
    SortOrder:      'CreatedDate',
  });

  const upstream = `https://job.jobnet.dk/CV/FindWork/JobList?${params}`;

  try {
    const resp = await fetch(upstream, {
      headers: {
        'Accept':           'application/json, text/javascript, */*',
        'User-Agent':       'Mozilla/5.0 CVmatchen/1.0',
        'Referer':          'https://job.jobnet.dk/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const text = await resp.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'parse_fail', raw: text.slice(0, 500) }), {
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
