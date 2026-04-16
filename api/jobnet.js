// api/jobnet.js — Vercel serverless proxy för job.jobnet.dk
// Löser CORS-problemet: browsern anropar /api/jobnet, vi anropar Jobnet.dk server-side.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);

  // Tillåtna parametrar att vidarebefordra
  const allowed = ['SearchString', 'Region', 'Zip', 'ItemsPerPage', 'CurrentPage'];
  const params = new URLSearchParams();
  for (const key of allowed) {
    const val = url.searchParams.get(key);
    if (val !== null) params.set(key, val);
  }

  const upstream = `https://job.jobnet.dk/CV/FindWork/JobList?${params.toString()}`;

  try {
    const resp = await fetch(upstream, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CVmatchen/1.0',
      },
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=120, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
