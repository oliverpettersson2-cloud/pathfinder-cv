// api/utbildningar.js
// Hämtar YH-utbildningar från MYH + kurerad statisk data för Familjen Helsingborg
// Vercel serverless function — körs max 10s

const FAMILJEN_HBG_KOMMUNER = [
  'Helsingborg', 'Ängelholm', 'Höganäs', 'Landskrona',
  'Bjuv', 'Båstad', 'Klippan', 'Åstorp', 'Svalöv', 'Perstorp', 'Örkelljunga'
];

// Kurerad statisk data — reala program, verifierade 2024
const STATISK_DATA = [
  // YH
  { id: 'yh-001', namn: 'Systemutvecklare .NET', skola: 'Medieinstitutet Helsingborg', ort: 'Helsingborg', typ: 'YH', langd: '2 år', krav: 'Gymnasieexamen', csnberättigad: true, url: 'https://www.myh.se', startdatum: 'Höst 2025' },
  { id: 'yh-002', namn: 'Undersköterska med inriktning äldreomsorg', skola: 'Folkhögskolan Helsingborg', ort: 'Helsingborg', typ: 'YH', langd: '1,5 år', krav: 'Gymnasieexamen alt SFI D + erfarenhet', csnberättigad: true, url: 'https://www.myh.se', startdatum: 'Vår 2025' },
  { id: 'yh-003', namn: 'Logistiker', skola: 'NTI-skolan Helsingborg', ort: 'Helsingborg', typ: 'YH', langd: '2 år', krav: 'Gymnasieexamen', csnberättigad: true, url: 'https://www.myh.se', startdatum: 'Höst 2025' },
  { id: 'yh-004', namn: 'Redovisningsekonom', skola: 'Campus Ängelholm', ort: 'Ängelholm', typ: 'YH', langd: '2 år', krav: 'Gymnasieexamen med ekonomi', csnberättigad: true, url: 'https://www.myh.se', startdatum: 'Höst 2025' },
  { id: 'yh-005', namn: 'Byggnadsingenjör', skola: 'Buildex Helsingborg', ort: 'Helsingborg', typ: 'YH', langd: '2 år', krav: 'Gymnasieexamen bygg/teknik', csnberättigad: true, url: 'https://www.myh.se', startdatum: 'Höst 2025' },

  // Komvux / Yrkesutbildning via Skånevux
  { id: 'kv-001', namn: 'Barnskötare', skola: 'Skånevux', ort: 'Helsingborg', typ: 'Yrkesutbildning', langd: '1 år', krav: 'Grundskola + svenska', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Löpande' },
  { id: 'kv-002', namn: 'Busschaufför', skola: 'Skånevux', ort: 'Helsingborg', typ: 'Yrkesutbildning', langd: '6 mån', krav: 'Grundskola + B-körkort', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Löpande' },
  { id: 'kv-003', namn: 'Svetsare', skola: 'Skånevux', ort: 'Helsingborg', typ: 'Yrkesutbildning', langd: '1 år', krav: 'Grundskola', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Höst 2025' },
  { id: 'kv-004', namn: 'Fastighetsskötare', skola: 'Skånevux', ort: 'Landskrona', typ: 'Yrkesutbildning', langd: '1 år', krav: 'Grundskola', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Löpande' },
  { id: 'kv-005', namn: 'Kock', skola: 'Skånevux', ort: 'Helsingborg', typ: 'Yrkesutbildning', langd: '1 år', krav: 'Grundskola + svenska', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Höst 2025' },
  { id: 'kv-006', namn: 'Lagerlogistiker', skola: 'Skånevux', ort: 'Helsingborg', typ: 'Yrkesutbildning', langd: '6 mån', krav: 'Grundskola', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Löpande' },
  { id: 'kv-007', namn: 'Personalassistent', skola: 'Skånevux', ort: 'Ängelholm', typ: 'Yrkesutbildning', langd: '1 år', krav: 'Gymnasieexamen', csnberättigad: true, url: 'https://skanevux.se', startdatum: 'Höst 2025' },

  // Komvux akademiska
  { id: 'km-001', namn: 'Svenska för invandrare (SFI) A-D', skola: 'Helsingborgs stad', ort: 'Helsingborg', typ: 'SFI', langd: 'Tills du klarar D', krav: 'Inget', csnberättigad: false, url: 'https://helsingborg.se/vuxenutbildning', startdatum: 'Löpande' },
  { id: 'km-002', namn: 'Kombinationsutbildning SFI + Vård', skola: 'Helsingborgs stad', ort: 'Helsingborg', typ: 'Kombi SFI+Yrke', langd: '1-2 år', krav: 'SFI B', csnberättigad: true, url: 'https://helsingborg.se/vuxenutbildning', startdatum: 'Höst 2025' },
  { id: 'km-003', namn: 'Kombinationsutbildning SFI + Bygg', skola: 'Helsingborgs stad', ort: 'Helsingborg', typ: 'Kombi SFI+Yrke', langd: '1,5 år', krav: 'SFI B', csnberättigad: true, url: 'https://helsingborg.se/vuxenutbildning', startdatum: 'Höst 2025' },
  { id: 'km-004', namn: 'Gymnasiekomplettering (Ma, Sv, En)', skola: 'Komvux Helsingborg', ort: 'Helsingborg', typ: 'Komvux', langd: 'Per kurs', krav: 'Grundskola', csnberättigad: true, url: 'https://helsingborg.se/vuxenutbildning', startdatum: 'Löpande' },

  // Campus Helsingborg (LU)
  { id: 'lu-001', namn: 'Servicemanagement', skola: 'Campus Helsingborg (LU)', ort: 'Helsingborg', typ: 'Högskola', langd: '3 år', krav: 'Gymnasieexamen + behörighet', csnberättigad: true, url: 'https://lu.se/campus-helsingborg', startdatum: 'Höst 2025' },
  { id: 'lu-002', namn: 'Strategisk kommunikation', skola: 'Campus Helsingborg (LU)', ort: 'Helsingborg', typ: 'Högskola', langd: '3 år', krav: 'Gymnasieexamen + Sv B', csnberättigad: true, url: 'https://lu.se/campus-helsingborg', startdatum: 'Höst 2025' },

  // Arbetsmarknadsutbildningar
  { id: 'af-001', namn: 'Truckförare (A+B)', skola: 'Arbetsförmedlingen', ort: 'Helsingborg', typ: 'AF-utbildning', langd: '3 mån', krav: 'Inskriven på AF', csnberättigad: false, url: 'https://arbetsformedlingen.se', startdatum: 'Löpande' },
  { id: 'af-002', namn: 'Yrkessvenska för vård', skola: 'Arbetsförmedlingen', ort: 'Helsingborg', typ: 'AF-utbildning', langd: '3 mån', krav: 'SFI D + inskriven AF', csnberättigad: false, url: 'https://arbetsformedlingen.se', startdatum: 'Löpande' },
];

async function fetchMYH() {
  try {
    // MYH öppna data API — YH-utbildningar i Skåne
    const res = await fetch(
      'https://api.myh.se/utbildningar/v1/utbildningsomgangar?lan=12&status=2&perPage=100',
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data.data || data.utbildningsomgangar || []);

    // Filtrera på kommuner i Familjen Helsingborg
    return items
      .filter(u => {
        const ort = (u.ort || u.studieort || u.platsOrt || '').toLowerCase();
        return FAMILJEN_HBG_KOMMUNER.some(k => ort.includes(k.toLowerCase()));
      })
      .slice(0, 40)
      .map(u => ({
        id: 'myh-' + (u.id || u.utbildningsomgangId || Math.random()),
        namn: u.utbildningsnamn || u.namn || 'YH-utbildning',
        skola: u.anordnarens_namn || u.anordnare || '',
        ort: u.ort || u.studieort || '',
        typ: 'YH',
        langd: (u.studietid_veckor ? Math.round(u.studietid_veckor / 4) + ' månader' : ''),
        krav: 'Gymnasieexamen',
        csnberättigad: true,
        url: u.url || 'https://www.myh.se',
        startdatum: u.utbildningsstart || ''
      }));
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  // Försök hämta live-data från MYH
  const myhData = await fetchMYH();
  const utbildningar = (myhData && myhData.length > 5)
    ? [...myhData, ...STATISK_DATA.filter(s => s.typ !== 'YH')]
    : STATISK_DATA;

  const kalla = (myhData && myhData.length > 5) ? 'MYH API + kurerad data' : 'Kurerad data';

  return res.status(200).json({
    utbildningar,
    antal: utbildningar.length,
    kalla,
    hamtad: new Date().toISOString().slice(0, 10),
    kommuner: FAMILJEN_HBG_KOMMUNER,
    info: 'Ansök via skanevux.se (Komvux/Yrkes), myh.se (YH), lu.se/campus-helsingborg (Högskola)',
    ansok: 'skanevux.se'
  });
}
