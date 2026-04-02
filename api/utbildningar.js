// api/utbildningar.js
// Returnerar kuraterad lista över utbildningar i Familjen Helsingborg
// Skolverkets beta-API är instabilt — använder statisk lista som uppdateras manuellt

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

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  res.json({
    kalla: 'Kuraterad lista (skanevux.se)',
    hamtad: new Date().toISOString().slice(0, 10),
    antal: FH_STATIC.length,
    omraden: FH_AREAS,
    utbildningar: FH_STATIC,
    ansok: 'https://skanevux.se',
    info: 'Alla i Familjen Helsingborgs 11 kommuner kan soka samtliga komvux yrkesutbildningar via en gemensam ansokan pa Helsingborg.se.'
  });
};
