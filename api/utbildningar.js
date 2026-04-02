// api/utbildningar.js
// Hämtar utbildningsdata från Skolverket Planned Educations API (v3)
// för alla kommuner i Familjen Helsingborg
// Uppdateras dagligen (Skolverket synkar sina data varje natt)

const FH_MUNICIPALITIES = [1283, 1282, 1284, 1292, 1260, 1256, 1285, 1252, 1265, 1277, 1266];
const FH_NAMES = {
  1283: 'Helsingborg', 1282: 'Landskrona', 1284: 'Höganäs', 1292: 'Ängelholm',
  1260: 'Bjuv', 1256: 'Båstad', 1285: 'Klippan', 1252: 'Perstorp',
  1265: 'Svalöv', 1277: 'Åstorp', 1266: 'Örkelljunga'
};

const PE_BASE = 'https://api.skolverket.se/planned-educations/v3';
const PE_HEADERS = {
  'accept': 'application/vnd.skolverket.plannededucations.api.v3.hal+json',
  'User-Agent': 'Pathfinder-CV/1.0 (educational guidance app; contact@pathfinderai.se)'
};

// ── Hjälpfunktion: hämta en sida från PE-API ─────────────────────────────────
async function fetchPE(path) {
  const url = `${PE_BASE}${path}`;
  const res = await fetch(url, { headers: PE_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`PE API ${res.status}: ${path}`);
  return res.json();
}

// ── Hämta skolenheter (komvux/YH) i Familjen Helsingborg ─────────────────────
async function getSchoolUnits() {
  const munStr = FH_MUNICIPALITIES.join(',');
  try {
    // Hämta komvux-enheter
    const kvData = await fetchPE(
      `/compact-school-units?municipalityCode=${munStr}&schoolType=KV&page=0&size=100`
    );
    return (kvData._embedded?.compactSchoolUnits || kvData.compactSchoolUnits || []);
  } catch (e) {
    console.error('School units error:', e.message);
    return [];
  }
}

// ── Hämta utbildningsprogram för en skolenhet ─────────────────────────────────
async function getTrainingPrograms(schoolUnitCode) {
  try {
    const data = await fetchPE(`/school-units/${schoolUnitCode}/training-programs?page=0&size=50`);
    return data._embedded?.trainingPrograms || data.trainingPrograms || [];
  } catch {
    return [];
  }
}

// ── Alternativ: hämta utbildningstillfällen direkt ───────────────────────────
async function getEducationEvents() {
  const munStr = FH_MUNICIPALITIES.join(',');
  try {
    const data = await fetchPE(
      `/education-events?municipalityCode=${munStr}&page=0&size=100`
    );
    return data._embedded?.educationEvents || data.educationEvents || [];
  } catch (e) {
    console.error('Education events error:', e.message);
    return [];
  }
}

// ── Simplifierar rådata till vad SYV-AI:n behöver ────────────────────────────
function simplify(raw, municipalityCode) {
  const kommunNamn = FH_NAMES[municipalityCode] || String(municipalityCode);
  return {
    namn: raw.name || raw.educationEventName || raw.trainingProgramName || '–',
    kommun: kommunNamn,
    typ: raw.educationType || raw.schoolType || 'Komvux',
    start: raw.startDate || raw.plannedStartDate || null,
    platser: raw.seats || raw.numberOfSeats || null,
    studietakt: raw.studyPace || raw.pace || null,
    behörighet: raw.entryRequirements || raw.prerequisites || null,
    url: raw.applicationUrl || raw.url || 'https://skanevux.se'
  };
}

// ── Huvud-handler ─────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  // Cache 1 timme (Skolverket uppdaterar dagligen)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const utbildningar = [];

    // Strategi 1: hämta via education-events endpoint
    const events = await getEducationEvents();
    if (events.length > 0) {
      for (const ev of events) {
        const munCode = ev.municipalityCode || ev.municipality?.code;
        utbildningar.push(simplify(ev, munCode));
      }
    }

    // Strategi 2 (fallback): hämta via school-units → training-programs
    if (utbildningar.length === 0) {
      const units = await getSchoolUnits();
      for (const unit of units.slice(0, 15)) { // Max 15 enheter för att hålla nere latens
        const programs = await getTrainingPrograms(unit.schoolUnitCode || unit.code);
        for (const prog of programs) {
          utbildningar.push(simplify(prog, unit.municipalityCode || unit.municipality?.code));
        }
        if (utbildningar.length >= 60) break;
      }
    }

    // Deduplicera på namn+kommun
    const seen = new Set();
    const unique = utbildningar.filter(u => {
      const key = `${u.namn}|${u.kommun}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    res.json({
      källa: 'Skolverket Planned Educations API',
      hämtad: new Date().toISOString().slice(0, 10),
      antal: unique.length,
      kommuner: Object.values(FH_NAMES),
      utbildningar: unique,
      ansökan: 'https://helsingborg.se/forskola-och-utbildning/vuxenutbildning/utbildningar/yrkesutbildningar-pa-gymnasial-niva/'
    });

  } catch (err) {
    console.error('utbildningar.js fel:', err);
    // Returnera tom lista — SYV faller tillbaka på web_search
    res.json({
      källa: 'Skolverket (tillfälligt otillgänglig)',
      hämtad: new Date().toISOString().slice(0, 10),
      antal: 0,
      utbildningar: [],
      ansökan: 'https://skanevux.se'
    });
  }
};
