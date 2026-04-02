// api/utbildningar.js — Utbildningsdata för Familjen Helsingborg
// Försöker Skolverket API, faller annars tillbaka på kuraterad statisk lista

const FH_MUNICIPALITIES = [1283, 1282, 1284, 1292, 1260, 1256, 1285, 1252, 1265, 1277, 1266];

const FH_STATIC = [
  { namn: 'Undersköterska', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Skyddad yrkestitel. ~1 år.' },
  { namn: 'Undersköterska', kommun: 'Landskrona', typ: 'Komvux yrkesutp.', info: 'Skyddad yrkestitel.' },
  { namn: 'Undersköterska', kommun: 'Ängelholm', typ: 'Komvux yrkesutp.', info: 'Skyddad yrkestitel.' },
  { namn: 'Barnskötare', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Förskola & fritids.' },
  { namn: 'Stödpedagog / Behandlingsassistent', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'LSS & socialvård.' },
  { namn: 'Lagerlogistiker', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Inkl. truckkörkort.' },
  { namn: 'Truckförare / Lagerarbetare', kommun: 'Landskrona', typ: 'Komvux yrkesutp.', info: 'Truckkörkort ingår.' },
  { namn: 'Yrkesförare lastbil (C)', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'C-körkort ingår.' },
  { namn: 'Murare', kommun: 'Ängelholm', typ: 'Komvux yrkesutp.', info: 'Hög efterfrågan.' },
  { namn: 'Målare', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Bygg & industri.' },
  { namn: 'Fastighetsskötare', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Teknisk förvaltning.' },
  { namn: 'Svetsare', kommun: 'Ängelholm', typ: 'Komvux yrkesutp.', info: 'MIG/MAG & TIG.' },
  { namn: 'CNC-operatör', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Industriell tillverkning.' },
  { namn: 'Lackerare / Billackerare', kommun: 'Ängelholm', typ: 'Komvux yrkesutp.', info: 'Fordonslackering.' },
  { namn: 'Kock / Restaurangbiträde', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Restaurang & storkök.' },
  { namn: 'Lokalvårdare', kommun: 'Bjuv', typ: 'Komvux yrkesutp.', info: 'Kan kombineras med SFI.' },
  { namn: 'Butikssäljare', kommun: 'Helsingborg', typ: 'Komvux yrkesutp.', info: 'Detaljhandel.' },
  { namn: 'Systemutvecklare', kommun: 'Helsingborg', typ: 'YH 2 år', info: 'Yrkeshögskola, hög lön.' },
  { namn: 'Nätverkstekniker / IT-support', kommun: 'Helsingborg', typ: 'YH 2 år', info: 'Yrkeshögskola.' },
  { namn: 'Digital marknadsförare', kommun: 'Helsingborg', typ: 'YH 2 år', info: 'SEO, SoMe, Ads.' },
  { namn: 'Redovisningsekonom', kommun: 'Helsingborg', typ: 'YH 2 år', info: 'Yrkeshögskola.' },
];

const FH_AREAS = [
  { namn: 'Vård & omsorg', emoji: '🏥' },
  { namn: 'Transport & logistik', emoji: '🚛' },
  { namn: 'Bygg & anläggning', emoji: '🏗️' },
  { namn: 'Teknik & industri', emoji: '⚙️' },
  { namn: 'IT & data', emoji: '💻' },
  { namn: 'Handel & service', emoji: '🛍️' },
  { namn: 'Restaurang & kök', emoji: '🍳' },
  { namn: 'Ekonomi', emoji: '📊' },
];

async function trySkolverk() {
  const munStr = FH_MUNICIPALITIES.join(',');
  const headers = {
    'accept': 'application/vnd.skolverket.plannededucations.api.v3.hal+json',
    'User-Agent': 'Pathfinder-CV/1.0'
  };
  const url = `https://api.skolverket.se/planned-educations/v3/education-events?municipalityCode=${munStr}&page=0&size=100`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const items = data._embedded?.educationEvents || data.educationEvents || [];
  return items.map(ev => ({
    namn: ev.name || ev.educationEventName || '-',
    kommun: ev.municipalityName || String(ev.municipalityCode || ''),
    typ: ev.educationType || 'Komvux',
    info: ev.entryRequirements || ''
  })).filter(u => u.namn !== '-');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  let utbildningar = [];
  let kalla = 'Statisk lista (skanevux.se)';

  try {
    const live = await trySkolverk();
    if (live.length > 0) {
      utbildningar = live;
      kalla = 'Skolverket Planned Educations API (realtid)';
    } else {
      throw new Error('Inga poster');
    }
  } catch (e) {
    utbildningar = FH_STATIC;
    kalla = 'Kuraterad lista — se skanevux.se for aktuella program';
  }

  res.json({
    kalla,
    hamtad: new Date().toISOString().slice(0, 10),
    antal: utbildningar.length,
    omraden: FH_AREAS,
    utbildningar,
    ansok: 'https://skanevux.se',
    info: 'Alla i Familjen Helsingborgs 11 kommuner kan soka samtliga komvux yrkesutbildningar via en gemensam ansokan.'
  });
};
