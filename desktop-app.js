/* ============================================================
   CVmatchen Desktop — App-logik
   Delar localStorage med mobilversionen så data synkas.
   ============================================================ */

(function() {
  'use strict';

  // ============================================================
  // KONSTANTER
  // ============================================================
  const STORAGE_KEY      = 'cvData';
  const AUTH_STORAGE_KEY = 'cvmatchen_auth';
  const API_KEY_STORAGE  = 'cvmatchen_api_key';
  const TRAINING_PROGRESS_KEY = 'cvmatchen_ovning_progress';
  const SAVED_CVS_KEY    = 'pathfinder_saved_cvs';
  const MATCHED_CVS_KEY  = 'pathfinder_matched_cvs';
  const MATCHED_TTL_MS   = 14 * 24 * 3600 * 1000; // 14 dagar — samma som mobilen
  const MAX_SAVED_CVS    = 3;

  const ALL_LANGUAGES = [
    'Svenska', 'Engelska', 'Danska', 'Tyska', 'Franska', 'Spanska',
    'Arabiska', 'Persiska (Farsi)', 'Somalisk', 'Kurdisk', 'Turkisk',
    'Polsk', 'Tigrinj', 'Bosnisk', 'Kroatisk', 'Italiensk',
    'Vietnamesisk', 'Portugisisk', 'Mandarin (Kinesisk)', 'Urdu', 'Tamilsk', 'Lao'
  ];

  const ALL_LICENSES = [
    'B - Personbil',
    'BE - Personbil med släp',
    'C1 - Lätt lastbil',
    'C - Lastbil',
    'CE - Lastbil med tung släp',
    'D1 - Liten buss',
    'D - Buss',
    'Truckkort A - Låglyftande',
    'Truckkort B - Höglyftande',
    'Skylift/Saxplattform',
    'Traversutbildning',
  ];

  const TEMPLATES = [
    { id: 'classic',     name: 'Klassisk',          icon: '📋', color: '#e85d26' },
    { id: 'modern',      name: 'Modern',            icon: '✨', color: '#3eb489' },
    { id: 'template-3',  name: 'Modern Blå/Grön',   icon: '🎨', color: '#4285F4' },
    { id: 'template-4',  name: 'Modern Lila/Cyan',  icon: '💫', color: '#7c3aed' },
    { id: 'template-5',  name: 'Minimalistisk',     icon: '⚪', color: '#888888' },
    { id: 'template-6',  name: 'Traditionell 1',    icon: '📄', color: '#1a1a2e' },
    { id: 'template-7',  name: 'Traditionell 2',    icon: '📑', color: '#d4af37' },
    { id: 'template-8',  name: 'Modern Kort',       icon: '🎯', color: '#ec4899' },
    { id: 'template-9',  name: 'Två-kolumn',        icon: '🌟', color: '#10b981' },
    { id: 'template-10', name: 'Färgskatt',         icon: '🎨', color: '#f59e0b' },
    { id: 'template-11', name: 'Traditionell 3',    icon: '📜', color: '#8b1a1a' },
    { id: 'template-12', name: 'Traditionell 4',    icon: '📃', color: '#0f766e' },
  ];

  // Träningsmoduler — komprimerad version för desktop
  // ============================================================
  // TRAINING MODULES — importerade från mobilen (103 moduler, 6 kategorier)
  // ============================================================
var INTRO=[
{id:'m1',icon:'📋',title:'Regler & Rättigheter',sub:'Närvaro, frånvaro & skyldigheter',color:'#3eb489',bc:'rgba(62,180,137,.3)',bg:'rgba(62,180,137,.07)',
lessons:[
{t:'Vad är aktivitetskrav?',s:'Aktivitetskrav betyder att du ska delta i de aktiviteter som du och din handläggare har bestämt. Det kan vara möten, jobbsök, praktik eller utbildning.\n\nDu behöver delta för att få ekonomiskt bistånd.',a:'Aktivitetskrav innebär att du förväntas följa den planering som beslutats tillsammans med din handläggare. Syftet är att stärka din väg mot självförsörjning. Om du inte deltar kan det påverka din ersättning.'},
{t:'Närvaro & frånvaro',s:'Om du blir sjuk måste du säga till direkt. Du ska meddela samma dag. Du kan behöva lämna intyg.',a:'Frånvaro ska alltid meddelas samma dag, helst innan aktiviteten börjar. Vid upprepad frånvaro kan handläggaren begära intyg eller uppdaterad planering.'},
{t:'Rättigheter & skyldigheter',s:'Du har rätt till stöd, planering och information.\nDu har skyldighet att delta, lämna korrekta uppgifter och följa planen.',a:'Du har rätt till en individuell plan, tydlig kommunikation och skälig handläggningstid.\nDu har skyldighet att medverka aktivt, lämna korrekta uppgifter och följa beslutade aktiviteter.'}
],
ex:{type:'write',title:'Skriv ett frånvaromeddelande',desc:'Du är sjuk och kan inte delta i dagens aktivitet. Skriv ett korrekt och professionellt meddelande till din handläggare.',tips:'Inkludera: vem du är, vilken aktivitet du missar, varför du är frånvarande och när du förväntar dig att vara tillbaka.',ph:'Hej [handläggarens namn],\n\nJag heter... och deltar i...\n\nJag kan idag inte delta på grund av...\n\nJag förväntar mig att vara tillbaka...',min:80},
quiz:[{q:'Vad betyder aktivitetskrav?',o:['Du kan göra vad du vill','Du ska delta i planerade aktiviteter','Du behöver inte meddela frånvaro'],c:1},{q:'När ska du meddela frånvaro?',o:['Dagen efter','Samma dag','Nästa vecka'],c:1},{q:'Vad är en skyldighet?',o:['Något du kan välja','Något du måste göra','En rättighet'],c:1},{q:'Vad är en rättighet?',o:['Något du är tvungen att göra','Något du har rätt till','En aktivitet'],c:1},{q:'Vad kan hända om du inte deltar?',o:['Ingenting','Din ersättning kan påverkas','Du får mer tid'],c:1}],
pr:['Förklara mina skyldigheter på enkel svenska.','Skriv ett korrekt meddelande om sjukfrånvaro.','Sammanfatta aktivitetskrav i tre meningar.']},
{id:'m2',icon:'💻',title:'SKills-systemet',sub:'Introduktion till SKills & din plan',color:'#f0c040',bc:'rgba(240,192,64,.3)',bg:'rgba(240,192,64,.07)',
lessons:[
{t:'Vad är SKills?',s:'SKills är ett system där du ser din plan, dina aktiviteter och vad du ska göra.',a:'SKills är ett digitalt verktyg för planering, uppföljning och kommunikation mellan dig och din handläggare.'},
{t:'Så använder du SKills',s:'Du loggar in, ser din plan och markerar vad du gjort.',a:'Du kan följa din utveckling, se deadlines och kommunicera med handläggare direkt i systemet.'},
{t:'SKills + CVmatchen',s:'SKills visar vad du ska göra. CVmatchen hjälper dig göra det.',a:'CVmatchen genererar CV, profiltext och matchningar som du sedan kan använda när du söker jobb i din SKills-plan.'}
],
ex:{type:'sort',title:'SKills eller CVmatchen?',desc:'Sortera funktionerna i rätt verktyg.',catA:'SKills',catB:'CVmatchen',items:[{l:'Se din plan',c:'A'},{l:'Skapa CV',c:'B'},{l:'Markera aktiviteter',c:'A'},{l:'Matcha mot jobb',c:'B'},{l:'Kommunicera med handläggare',c:'A'},{l:'Exportera PDF',c:'B'}]},
quiz:[{q:'Vad är SKills?',o:['En jobbsökarsida','Ett planeringsverktyg','En CV-mall'],c:1},{q:'Vad kan du göra i SKills?',o:['Skriva CV','Följa din plan och kommunicera','Söka utbildning'],c:1},{q:'Hur hänger de ihop?',o:['De är samma sak','SKills planerar, CVmatchen levererar','Ingen koppling'],c:1}],
pr:['Förklara SKills som om jag vore ny i Sverige.','Hjälp mig skapa en veckoplan.','Vad tänker jag på när jag loggar in i SKills?']},
{id:'m3',icon:'🤖',title:'AI & CVmatchen',sub:'Hur AI hjälper dig hitta jobb',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Vad AI kan göra för dig',s:'AI hjälper dig skriva, förstå och hitta jobb snabbare.',a:'AI analyserar texter, skapar CV och profiltext och ger feedback baserat på dina styrkor och den jobbannons du söker.'},
{t:'Hur CVmatchen fungerar',s:'1. Bygg ditt CV\n2. Sök bland riktiga jobb\n3. AI anpassar mot jobbet\n4. Exportera och skicka',a:'CVmatchen laddar jobbdata från Platsbanken, matchar din profil mot annonsens krav och genererar skräddarsytt CV och profiltext.'},
{t:'Bra prompts = bättre resultat',s:'❌ "Hjälp mig."\n✅ "Skapa en pitch baserat på min erfarenhet som butikssäljare."',a:'En bra prompt är specifik och ger AI rätt kontext. Ju mer du berättar, desto bättre svar.'}
],
ex:{type:'build',title:'Skriv din egen AI-prompt',desc:'Fyll i dessa delar för att bygga en kraftfull prompt.',fields:[{l:'Vad söker du för jobb?',ph:'t.ex. lagerarbetare, kock, säljare...',hint:'Var specifik.'},{l:'Vilken erfarenhet har du?',ph:'t.ex. 2 år i butik, kör truck...'},{l:'Vad ska AI hjälpa dig med?',ph:'t.ex. skriva profiltext, förbättra CV...',hint:'Var tydlig med uppdraget.'}]},
quiz:[{q:'Vad kan AI hjälpa med?',o:['Bara skriva brev','Skriva CV, profiltext och ge feedback','Inget'],c:1},{q:'Vad gör CVmatchen?',o:['Söker jobb åt dig','Matchar ditt CV mot jobbannonser med AI','Skickar ansökan'],c:1},{q:'Vad är en bra prompt?',o:['Kort och vag','Specifik med rätt kontext','Så lång som möjligt'],c:1}],
pr:['Skapa en kort pitch baserat på min erfarenhet.','Förklara denna jobbannons på enkel svenska.','Ge mig tre förbättringar till mitt CV.']}
];

var ARBETE=[
{id:'a0',icon:'📊',title:'Arbetsmarknaden',sub:'Sverige, Skåne & Öresundsregionen',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[
{t:'Den svenska arbetsmarknaden',
s:'Sverige har ca 5,2 miljoner sysselsatta.\n\nArbetslöshet 2025:\n🇸🇪 Sverige: ~8,6%\n📍 Skåne: ~10,2%\n🏙️ Helsingborg: ~9,8%\n\nStörsta sektorer:\n🏥 Vård & omsorg — störst\n🏗️ Bygg & teknik — hög efterfrågan\n🚚 Lager & logistik — snabbväxande\n💻 IT & digitalt — lägst arbetslöshet',
a:'Arbetsmarknaden mäts av SCB via AKU (Arbetskraftsundersökning). Ungdomsarbetslöshet 15-24 år är ca dubbelt det totala. Öppen arbetslöshet och deltagare i program räknas separat. 2024-2025 påverkas marknaden av höga räntor och svag byggsektor.'},
{t:'Skåne och Öresundsregionen',
s:'Skåne — 1,4 miljoner invånare.\n\nÖresundsregionen är en av Europas starkaste arbetsmarknader:\n\n🇩🇰 Danmark: ~5,0% arbetslöshet\n🏘️ Helsingör: ~5,3%\n\n~20 000 personer pendlar dagligen Sverige ↔ Danmark!',
a:'Öresundsbron öppnade 2000 och integrerade arbetsmarknaden. EU-medborgarskap ger fri rörlighet — du kan bo i Helsingborg och jobba i Köpenhamn. Danska löner är 20-30% högre, men levnadskostnader likaså. Skatt betalas i arbetslandet men deklaration krävs i båda länder.'},
{t:'Helsingborgs arbetsmarknad',
s:'Helsingborg är en av Skånes starkaste städer.\n\nStarka sektorer lokalt:\n🏭 Industri & livsmedel (Findus, Perstorp)\n🚢 Logistik & hamn\n🏥 Vård & Region Skåne\n🛒 Handel & service\n\n⛴️ Helsingör ligger 15 min bort med färjan — en hel dansk arbetsmarknad nära!',
a:'H+ stadsomvandlingsprojektet skapar tusentals nya jobb i Helsingborg. Arbetsförmedlingen Helsingborg: Järnvägsgatan 14. Jobbtorg Helsingborg erbjuder kostnadsfri matchning och coachning för invånare.'}
],
ex:{type:'arb-map',title:'Arbetsmarknadskartan',desc:'Utforska arbetslöshet och arbetsmarknad i Öresundsregionen.'},
quiz:[
{q:'Vad är ungefärlig arbetslöshet i Skåne 2026?',o:['5%','9%','20%'],c:1},
{q:'Hur många pendlar dagligen över Öresund?',o:['2 000','20 000','200 000'],c:1},
{q:'Vilken sektor har generellt lägst arbetslöshet i Sverige?',o:['Handel','IT & digitalt','Bygg'],c:1},
{q:'Hur lång är båtturen Helsingborg–Helsingör?',o:['5 min','15 min','45 min'],c:1}
],
pr:['Vilka jobb finns just nu i Helsingborg?','Hur söker jag jobb i Danmark som bor i Sverige?','Vilka branscher rekryterar mest i Skåne nu?']},

{id:'a_match',icon:'🎯',title:'Matcha med AI',sub:'Förstå matchningslogiken innan du kör skarpt',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[
{t:'Vad är AI-matchning?',
s:'CVmatchen AI läser ditt CV och en jobbannons — och hittar kopplingarna.\n\nResultatet:\n🟢 MATCH — du har kompetensen exakt\n🟡 PARTIAL — du har något liknande\n🔴 MISSING — du saknar det\n\nPlus tre anpassade profiltexter att välja bland.',
a:'Matchning bygger på NLP (Natural Language Processing). AI jämför semantisk likhet — inte bara exakta ord. "Truckkörning" kan matcha "truck A+B". Partial match är extra viktigt: det visar var du är nära och kan lyfta fram överförbar kompetens.'},
{t:'Nyckelord — vad händer med dem?',
s:'Annonsen bryts ner i nyckelord som AI jämför med ditt CV:\n\n🟢 MATCH = Lyft fram tydligt i CV, överst\n🟡 PARTIAL = Formulera om, visa kopplingen\n🔴 MISSING = Var ärlig, nämn viljan att lära\n\nMålet: Maximera MATCH, förklara PARTIAL.',
a:'ATS-system (Applicant Tracking Systems) filtrerar bort CV utan rätt nyckelord. Rekryterare skummar CV på 6-7 sekunder. AI-matchning hjälper dig passera ATS och fånga blicken — rätt ord, rätt plats, rätt vinkel.'},
{t:'De tre profiltexterna',
s:'AI genererar alltid tre versioner:\n\n📌 Erfarenhetsfokus\n"5 år inom lager, van vid WMS..."\n\n💡 Motivationsfokus\n"Driven av att effektivisera..."\n\n🏆 Kompetens & resultat\n"Reducerade plocktid med 23%..."\n\nVälj den som passar — eller blanda delar!',
a:'De tre vinklarna matchar olika rekryteringsstilar. Erfarenhet passar traditionella rekryterare och stora bolag. Motivation passar kulturfokuserade bolag och startups. Resultat passar datadriven rekrytering och chefsroller. Blanda gärna delar.'}
],
ex:{type:'match-trainer',title:'Träna matchningslogiken',desc:'Info → Quiz → Miniövning — förstå allt innan du kör skarpt.'},
quiz:[
{q:'Vad innebär "partial match"?',o:['Du saknar kompetensen helt','Du har liknande erfarenhet','Du har exakt kompetensen'],c:1},
{q:'Varför är nyckelord kritiska i CV?',o:['Ser proffsigare ut','ATS-system filtrerar bort CV utan rätt nyckelord','Rekryterare läser dem sist'],c:1},
{q:'Vilken profiltext-vinkel passar bäst vid karriärskifte?',o:['Erfarenhetsfokus','Motivationsfokus','Kompetens & resultat'],c:1}
],
pr:['Analysera min matchning mot denna annons: [klistra in]','Vilken profiltext-vinkel passar bäst för mitt fall?','Skriv om detta CV-avsnitt för bättre nyckelordsmatch.']},

{id:'a_cv',icon:'📄',title:'CV-byggaren',sub:'Förstå varje del INNAN du fyller i ditt riktiga CV',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[
{t:'Vad är ett bra CV?',
s:'Ditt CV är din marknadsföring — inte din biografi.\n\n✅ Anpassat per ansökan\n✅ Lätt att skumma (6-7 sek)\n✅ Rätt nyckelord på rätt plats\n✅ Ärligt och konkret\n\nCVmatchen hjälper dig bygga strukturerat med AI-stöd.',
a:'ATS (Applicant Tracking Systems) skannar CV automatiskt. Upp till 75% av CV:n läses aldrig av en människa om de inte passerar ATS. Rätt nyckelord = passerar filtret. Tydlig struktur = fångar blicken de 6-7 sekunder rekryteraren ger det.'},
{t:'Profiltext — sälj dig på 4 rader',
s:'❌ "Jag är driven och söker ett stimulerande jobb."\n\n✅ "Lagerarbetare med 4 år på PostNord. Truck A+B, WMS-erfarenhet och 100% leveransprecision Q3 2025. Söker nästa steg inom logistik i Helsingborg."\n\nFormeln: Vem + Kan + Söker = Stark profiltext',
a:'AI i CVmatchen genererar 3 alternativ: personlig inledning, styrka/passion och samarbetsfokus. Välj ett och finjustera. Profiltexten ska vara 3-5 meningar och anpassas till varje specifik ansökan.'},
{t:'Arbetsuppgifter som säljer',
s:'❌ "Jobbade i kassan och hjälpte kunder."\n\n✅ "Hanterade 200+ kundtransaktioner/dag. Ansvarade för kassaavstämning och reklamationshantering. Belönades Årets medarbetare Q2."\n\nFormeln: HANDLING + SKALA/RESULTAT = Säljer!',
a:'AI genererar 3 bullet points per anställning baserat på titel + företag. Kom ihåg: mätbara resultat (%, antal, kronor) är alltid starkare än vaga beskrivningar. Granska alltid vad AI föreslår — du vet bäst vad du faktiskt gjort.'}
],
ex:{type:'cv-trainer',title:'Träna CV-byggaren',desc:'4 infoskärmar · 6 quizfrågor · Mini-bygge — sedan är du redo för ditt riktiga CV!'},
quiz:[
{q:'Hur lång tid lägger en rekryterare på första genomläsningen?',o:['30 sekunder','6-7 sekunder','2 minuter','5 minuter'],c:1},
{q:'Vad ska profiltexten besvara?',o:['Ålder, adress och lön','Vem du är, vad du kan, vad du söker','Alla jobb du haft','Dina hobbies'],c:1},
{q:'Vilken formel gäller för starka arbetsuppgifter?',o:['Lång och detaljerad','Handling + Skala/Resultat','Känsla + Personlighet','Kopia från annonsen'],c:1}
],
pr:['Skriv en profiltext för: [yrkestitel, erfarenhet, stad]','Gör dessa arbetsuppgifter starkare: [klistra in]','Föreslå 8 kompetenser för en [yrkestitel].']},

{id:'a1',icon:'🧠',title:'Mina kompetenser',sub:'Hårda, mjuka & överförbara',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är kompetenser?',s:'Kompetenser är saker du kan. Det kan vara något du lärt dig i skolan, på jobbet eller i livet.\n\nExempel: köra bil, prata med kunder, laga mat.',a:'Kompetenser är förmågor du använder för att utföra arbetsuppgifter. De delas in i hårda (tekniska) och mjuka (sociala) kompetenser.'},{t:'Hårda och mjuka',s:'Hårda = saker du kan mäta (Excel, truckkort).\nMjuka = hur du är med andra (samarbete, tålamod).',a:'Hårda kompetenser kan testas eller certifieras. Mjuka handlar om beteenden, kommunikation och problemlösning.'},{t:'Överförbara kompetenser',s:'Överförbara kompetenser är saker du kan använda i många jobb.\n\nExempel: service, planering, ansvar.',a:'Generella förmågor som fungerar i olika branscher. Viktiga när du byter yrke.'}],
ex:{type:'sort',title:'Hård eller mjuk kompetens?',desc:'Sortera kompetenserna i rätt kategori.',catA:'🔧 Hård kompetens',catB:'🤝 Mjuk kompetens',items:[{l:'Excel',c:'A'},{l:'Tålamod',c:'B'},{l:'Truckkort',c:'A'},{l:'Samarbete',c:'B'},{l:'Körkort B',c:'A'},{l:'Kommunikation',c:'B'},{l:'Kassahantering',c:'A'},{l:'Empati',c:'B'}]},
quiz:[{q:'Vad är en kompetens?',o:['En utbildning','En förmåga att utföra arbetsuppgifter','Ett certifikat'],c:1},{q:'Vad är en hård kompetens?',o:['Att vara tålmodig','Excel eller truckkort','Att lyssna'],c:1},{q:'Vad är en mjuk kompetens?',o:['Körkort','Samarbete och kommunikation','Programmering'],c:1}],
pr:['Sammanfatta mina kompetenser baserat på: …','Vilka kompetenser passar denna annons?','Förklara hårda vs mjuka kompetenser.']},
{id:'a2',icon:'💪',title:'Styrkor & drivkrafter',sub:'Vad motiverar dig?',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är styrkor?',s:'Styrkor är saker du är bra på.\nExempel: lyssna, hjälpa andra, jobba snabbt.',a:'Styrkor är återkommande beteenden där du presterar bra. De kan vara personliga eller yrkesmässiga.'},{t:'Drivkrafter',s:'Drivkrafter är saker som gör dig motiverad.\nExempel: hjälpa andra, lära nytt, tjäna pengar.',a:'Inre motivationsfaktorer som påverkar hur du trivs och presterar.'},{t:'Koppla till jobb',s:'"Jag är bra med människor → passar i service."',a:'Att koppla styrkor till arbetsuppgifter gör det lättare att argumentera för din kompetens i CV och intervju.'}],
ex:{type:'build',title:'Identifiera dina styrkor',desc:'Beskriv dina starkaste egenskaper med konkreta exempel.',fields:[{l:'Min starkaste styrka',ph:'T.ex. Jag är lösningsorienterad...',hint:'Egenskap du fått beröm för.'},{l:'Konkret exempel',ph:'T.ex. På mitt förra jobb hanterade jag...',ta:true},{l:'Vad motiverar dig mest?',ph:'T.ex. Hjälpa andra, lösa problem...',ta:true,hint:'Din drivkraft hjälper dig hitta rätt jobb.'}]},
quiz:[{q:'Vad är en styrka?',o:['En examen','Beteende där du presterar bra','En arbetsuppgift'],c:1},{q:'Vad är en drivkraft?',o:['En skyldighet','Inre motivation','Ett mål'],c:1},{q:'Varför är styrkor viktiga?',o:['De är inte viktiga','Hjälper dig argumentera för kompetens','Arbetsgivare bryr sig inte'],c:1}],
pr:['Sammanfatta mina styrkor: …','Vilka styrkor passar denna annons?','Beskriv min starkaste egenskap för CV.']},
{id:'a3',icon:'🎯',title:'SMARTA mål',sub:'Sätt tydliga mål',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är SMARTA mål?',s:'SMARTA mål hjälper dig att veta vad du ska göra. Tydliga och möjliga att följa upp.',a:'SMART är en metod för tydliga, mätbara och realistiska mål.'},{t:'Genomgång av SMART',s:'S – Specifikt\nM – Mätbart\nA – Accepterat\nR – Realistiskt\nT – Tidsbundet',a:'Saknas ett av kraven är målet otydligt och svårt att följa upp.'},{t:'Exempel',s:'❌ "Jag ska söka jobb."\n✅ "Jag ska söka 3 jobb/vecka via CVmatchen under april."',a:'Det smarta målet är specifikt, mätbart, accepterat, realistiskt och tidsbundet.'}],
ex:{type:'build',title:'Skriv ditt SMARTA mål',desc:'Fyll i varje del av SMART-mallen.',fields:[{l:'S — Specifikt',ph:'T.ex. Söka som lagerarbetare via CVmatchen'},{l:'M — Mätbart',ph:'T.ex. Minst 3 ansökningar/vecka',hint:'Sätt ett konkret antal.'},{l:'A — Accepterat',ph:'T.ex. Ja, jag har 2 timmar varje förmiddag'},{l:'R — Realistiskt',ph:'T.ex. Ja, jag har dator och CV klart'},{l:'T — Tidsbundet',ph:'T.ex. Senast 31 maj 2026',hint:'Sätt ett datum.'},{l:'Ditt kompletta mål',ph:'Skriv ihop hela målet här...',ta:true}]},
quiz:[{q:'Vad betyder S i SMART?',o:['Snabbt','Specifikt','Socialt'],c:1},{q:'Vad betyder T i SMART?',o:['Tydligt','Tidsbundet','Tillgängligt'],c:1},{q:'Vilket är ett SMART mål?',o:['"Söka jobb"','"3 jobb/vecka under april via CVmatchen"','"Jobb snart"'],c:1}],
pr:['Hjälp mig skriva ett SMART mål.','Gör detta mål SMART: "Bli bättre på att söka jobb."','Kontrollera om mitt mål är SMART.']},
{id:'a4',icon:'🎤',title:'Min pitch',sub:'30 sekunder om dig',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är en pitch?',s:'En kort presentation av vem du är, vad du kan och vad du söker.',a:'Strukturerad, kortfattad presentation för intervjuer, nätverksevent och ansökan.'},{t:'3-stegsmodellen',s:'1. Vem jag är\n2. Vad jag kan\n3. Vad jag söker',a:'Tre delar som bygger upp en tydlig bild. Håll det under 30 sekunder.'},{t:'Exempel',s:'"Jag heter Sara. Jag är bra på service. Jag söker jobb i butik."',a:'"Jag heter Sara och har 4 års erfarenhet av kundservice. Stark på problemlösning. Söker butik eller reception."'}],
ex:{type:'build',title:'Bygg din pitch',desc:'Fyll i 3-stegsmodellen.',fields:[{l:'1. VEM ÄR DU?',ph:'T.ex. Jag heter Maria och har 5 år i kundservice...',ta:true,hint:'Max 2 meningar.'},{l:'2. VAD KAN DU?',ph:'T.ex. Mina sidor är kundkontakt, kassahantering...',ta:true},{l:'3. VAD SÖKER DU?',ph:'T.ex. Jag söker en ny tjänst inom butik...',ta:true},{l:'Din kompletta pitch',ph:'Skriv ihop alla tre delar...',ta:true,hint:'Läs högt — ca 25-30 sekunder.'}]},
quiz:[{q:'Vad är en pitch?',o:['Ett CV','Kort presentation av vem du är','En jobbannons'],c:1},{q:'Tre delar som ska ingå?',o:['Namn, ålder, adress','Vem jag är, vad jag kan, vad jag söker','Skola, jobb, hobby'],c:1},{q:'Hur lång?',o:['5 minuter','Under 30 sekunder','2 meningar max'],c:1}],
pr:['Skapa en pitch baserat på mina styrkor.','Förbättra min pitch.','Gör min pitch kortare.']},
{id:'a5',icon:'📋',title:'Förstå jobbannonser',sub:'Krav och dolda signaler',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Hur en annons är uppbyggd',s:'En jobbannons berättar vad jobbet är, vad du ska göra och vad arbetsgivaren söker.',a:'Rollbeskrivning, arbetsuppgifter, krav, meriterande kompetenser, personlighet och info om arbetsgivaren.'},{t:'Krav vs önskemål',s:'Krav = måste ha.\nÖnskemål = bra att ha.',a:'Krav är minimikrav. Önskemål ger fördel men är inte nödvändiga.'},{t:'Dolda signaler',s:'"Flexibel" eller "självständig" = hur du ska vara.',a:'Kulturella signaler: tempo, ansvarsnivå, arbetsmiljö och förväntningar på dig.'}],
ex:{type:'sort',title:'Krav eller önskemål?',desc:'Sortera varje punkt.',catA:'Krav (måste ha)',catB:'Önskemål (meriterande)',items:[{l:'Truckkort A+B',c:'A'},{l:'Erfarenhet av WMS',c:'B'},{l:'Körkort B',c:'A'},{l:'Engelska i tal',c:'B'},{l:'Kan arbeta skift',c:'A'},{l:'Erfarenhet av LEAN',c:'B'}]},
quiz:[{q:'Vad är ett krav?',o:['Bra att ha','Måste ha för jobbet','Önskad egenskap'],c:1},{q:'Vad är ett önskemål?',o:['Obligatorisk kompetens','Extra kompetens som ger fördel','Personlighet'],c:1},{q:'Vad är en dold signal?',o:['Felstavning','Kulturella signaler om tempo','Lönen'],c:1}],
pr:['Förklara denna annons: [klistra in]','Viktigaste kompetenserna?','Sammanfatta kravprofilen i 3 punkter.']},
{id:'a6',icon:'🔍',title:'Matchning & analys',sub:'Dina styrkor vs jobbet',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är matchning?',s:'Matchning = jämföra dig med jobbet.',a:'Analys av hur kompetenser, erfarenhet och styrkor passar mot kravprofilen.'},{t:'Styrkor vs luckor',s:'Styrkor = det du kan.\nLuckor = det du behöver lära.',a:'Luckor löses ofta med kort utbildning. De är möjligheter!'},{t:'CVmatchen som verktyg',s:'1. Bygg CV\n2. Sök annonser\n3. AI matchar\n4. Exportera',a:'CVmatchen analyserar annonsens krav mot din profil och genererar skräddarsytt CV.'}],
ex:{type:'build',title:'Din matchningsanalys',desc:'Välj en annons och gör matchningsanalysen.',fields:[{l:'Vilket jobb?',ph:'T.ex. Lagerarbetare hos PostNord'},{l:'3 viktigaste krav',ph:'1. \n2. \n3. ',ta:true,hint:'Vad nämns först?'},{l:'Dina styrkor som matchar',ph:'T.ex. Truckkort och 2 år lager...',ta:true},{l:'Dina luckor',ph:'T.ex. Saknar WMS-erfarenhet...',ta:true},{l:'Plan för att täppa till luckorna',ph:'T.ex. Kurs via Komvux...',ta:true,hint:'Luckor är möjligheter!'}]},
quiz:[{q:'Vad är matchning?',o:['Söka många jobb','Jämföra kompetenser med kravprofilen','Skriva CV'],c:1},{q:'Vad är en lucka?',o:['Paus i jobbsök','En kompetens du saknar','Fel i CV'],c:1},{q:'Hur hjälper CVmatchen?',o:['Söker jobb åt dig','Anpassar CV mot annons med AI','Skickar ansökan'],c:1}],
pr:['Analysera annons — styrkor och luckor?','Hur förbättrar jag matchningen?','Vilka kompetenser behöver jag?']},
{id:'a7',icon:'🗓️',title:'Jobbsökstrategi',sub:'Plan och uppföljning',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Varför strategi?',s:'En plan gör det lättare att hitta jobb.',a:'Strategi minskar stress, ökar träffsäkerhet och strukturerar jobbsökandet.'},{t:'3 delar',s:'1. Mål\n2. Aktiviteter\n3. Uppföljning',a:'Mål ger riktning, aktiviteter ger struktur, uppföljning håller dig på rätt spår.'},{t:'Veckoplanering',s:'Måndag = söka jobb. Tisdag = uppdatera CV.',a:'Varva intensiva uppgifter med enklare för att hålla motivationen.'}],
ex:{type:'build',title:'Bygg din strategi',desc:'Skapa en konkret jobbsökstrategi.',fields:[{l:'Ditt mål',ph:'T.ex. Lagerarbetare senast 1 juni',ta:true},{l:'Kanaler du använder',ph:'T.ex. CVmatchen, Platsbanken, LinkedIn...',hint:'Minst 2-3.'},{l:'Din veckoplan',ph:'Måndag: \nTisdag: \nOnsdag: \nTorsdag: \nFredag: ',ta:true},{l:'Hur följer du upp?',ph:'T.ex. Räknar ansökningar per vecka...',ta:true}]},
quiz:[{q:'Varför strategi?',o:['Behövs inte','Minskar stress och ökar träffsäkerhet','Krav'],c:1},{q:'Tre delar?',o:['CV, ansökan, intervju','Mål, aktiviteter, uppföljning','LinkedIn, e-post, telefon'],c:1},{q:'Vad är en veckoplan?',o:['Lista med jobb','Planering av dagliga aktiviteter','Kalender'],c:1}],
pr:['Skapa strategi baserat på mina mål.','Gör min veckoplan mer realistisk.','Hjälp mig prioritera aktiviteter.']},
{id:'a8',icon:'🤝',title:'Intervju-grunder',sub:'Förberedelse & trygghet',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är en intervju?',s:'Intervjun är ett samtal där arbetsgivaren vill lära känna dig.',a:'Strukturerad bedömning av kompetens, beteende och motivation — och ditt tillfälle att bedöma jobbet.'},{t:'Vanliga frågor',s:'• Berätta om dig själv\n• Varför söker du jobbet?\n• Styrkor?\n• Svagheter?',a:'Förbered konkreta svar. Använd din pitch för "berätta om dig själv".'},{t:'Kroppsspråk',s:'Sitt rakt, le, titta i kameran.',a:'Lugn röst, tydlig struktur. Pauser är okej — visar att du tänker.'}],
ex:{type:'build',title:'Förbered dina intervjusvar',desc:'Skriv svar på de vanligaste frågorna.',fields:[{l:'"Berätta om dig själv"',ph:'Jag heter... och har...',ta:true,hint:'Max 60 sek.'},{l:'"Varför söker du jobbet?"',ph:'Jag söker för att...',ta:true},{l:'"Din styrka?"',ph:'Min starkaste egenskap är... t.ex...',ta:true,hint:'Ge konkret exempel!'},{l:'"Din svaghet?"',ph:'Jag kan ibland vara... men jobbar på det...',ta:true,hint:'Äkta svaghet + hur du jobbar på den.'}]},
quiz:[{q:'Syftet med intervjun?',o:['Testa kunskaper','Arbetsgivaren lär känna dig','Skriva kontrakt'],c:1},{q:'Vanlig intervjufråga?',o:['"Favoritfilm?"','"Berätta om dig själv"','"Vad tjänar du?"'],c:1},{q:'Bra kroppsspråk?',o:['Kryssa armarna','Sitta rakt, le, ögonkontakt','Titta ner'],c:1}],
pr:['Hjälp mig svara: Berätta om dig själv.','Förbättra mina intervjusvar.','Frågor att förbereda inför lagerintervju?']},
{id:'a9',icon:'⭐',title:'STAR-metoden',sub:'Konkreta exempel i intervjun',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Vad är STAR?',s:'S – Situation\nT – Task (uppgift)\nA – Action (vad DU gjorde)\nR – Result (resultatet)',a:'Beprövad metod för strukturerade, övertygande svar på beteendefrågor.'},{t:'I praktiken',s:'"Kund blev upprörd (S). Lösa snabbt (T). Lyssnade & ersatte (A). Kund nöjd, beröm av chef (R)."',a:'Fokusera på VAD DU gjorde — inte vad teamet gjorde.'},{t:'Vanliga STAR-frågor',s:'"Berätta om en utmaning du löst."\n"Exempel på bra samarbete?"',a:'Börjar med: "Ge ett exempel på…", "Berätta om…", "Hur hanterade du…"'}],
ex:{type:'build',title:'Bygg ditt STAR-svar',desc:'Välj en situation och bygg ett fullständigt svar.',fields:[{l:'S — Situation',ph:'T.ex. Jobbade på ICA en fredagskväll...',ta:true,hint:'Beskriv kort.'},{l:'T — Din uppgift',ph:'T.ex. Hålla flödet igång...',ta:true},{l:'A — Vad DU gjorde',ph:'T.ex. Öppnade extra kassa, kommunicerade...',ta:true,hint:'DU — inte teamet.'},{l:'R — Resultatet',ph:'T.ex. Kö minskade, chef berömde mig...',ta:true,hint:'Mätbart = starkt.'},{l:'Komplett STAR-svar',ph:'Skriv hela svaret naturligt...',ta:true}]},
quiz:[{q:'S i STAR?',o:['Styrka','Situation','Strategi'],c:1},{q:'R i STAR?',o:['Roll','Resultat','Relation'],c:1},{q:'Vilken fråga passar STAR?',o:['"Heter du?"','"Utmaning du löst?"','"Lönen?"'],c:1}],
pr:['STAR-svar baserat på: …','Förbättra mitt STAR-svar.','Hitta ett STAR-exempel från mitt liv.']},
{id:'a10',icon:'🧘',title:'Kommunikation & trygghet',sub:'Hantera nervositet',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Tydlig kommunikation',s:'Korta meningar, tydlig struktur, tala lugnt.',a:'Tydlighet och struktur. Anpassa språket. Undvik för långa svar.'},{t:'Hantera nervositet',s:'• Andas djupt\n• Förbered dig\n• Ta pauser',a:'Nervositet är normalt. Förberedelse är bästa motgiftet.'},{t:'Avslutning',s:'• Ställ minst en fråga\n• Tacka för mötet\n• Fråga om nästa steg',a:'Genomtänkta frågor visar engagemang.'}],
ex:{type:'build',title:'Din trygghetsplan',desc:'Plan för att känna dig trygg i intervjun.',fields:[{l:'3 frågor till arbetsgivaren',ph:'1. Hur ser intro ut?\n2. Vad är viktigast för att lyckas?\n3. Hur ser teamet ut?',ta:true,hint:'Visar engagemang.'},{l:'Min nervositetsplan',ph:'T.ex. 3 djupa andetag, påminn om mina styrkor...',ta:true},{l:'Kvällen innan',ph:'T.ex. Lägger fram kläder, repeterar pitch...',ta:true},{l:'Mina 3 styrkor att lyfta',ph:'1. \n2. \n3. ',ta:true}]},
quiz:[{q:'Tydlig kommunikation?',o:['Prata länge','Korta strukturerade meningar','Aldrig pausa'],c:1},{q:'Minska nervositet?',o:['Undvika förberedelse','Djupandning och förberedelse','Prata snabbt'],c:1},{q:'Sist i intervjun?',o:['Bara gå','Frågor, tack och nästa steg?','Fråga om du fick jobbet'],c:1}],
pr:['Formulera lugna intervjusvar.','Trygghetsplan inför imorgon.','3 bra frågor att ställa i slutet.']},

{id:'a_akassa',icon:'🛡️',title:'A-kassa & Facket',sub:'Ditt ekonomiska skyddsnät',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Vad är A-kassa?',s:'A-kassa = Arbetslöshetsersättning.\n\nOm du förlorar jobbet kan du få pengar under söktiden.\n\n✅ Max ca 80% av lönen\n✅ Upp till 300 dagar\n✅ Kräver aktiv jobbsökning\n✅ Du söker via din a-kassa, inte AF\n\nKostnad: ca 80-130 kr/mån',a:'Grundvillkor: arbetat minst 80 tim/mån i 12 månader. Inkomstrelaterad ersättning ger upp till 1 200 kr/dag de första 200 dagarna. Alfakassan tar emot alla branscher.'},{t:'Välj rätt a-kassa',s:'Det finns 24 a-kassor i Sverige.\n\n🏥 Kommunal → vård & omsorg\n🏗️ Byggnads → bygg\n💼 Alfa-kassan → passar alla\n💻 Unionen → tjänstemän\n\nalfakassan.se om du är osäker',a:'Alfakassan är öppen för alla som inte tillhör en specifik branschkassa. Ny på arbetsmarknaden eller byter bransch? Alfa är tryggt val.'},{t:'Facket — vad och varför?',s:'Facket förhandlar dina löner och villkor.\n\n✅ Kollektivavtal → schyssta villkor\n✅ Juridisk hjälp vid tvist\n✅ Löneförhandlingsstöd\n\nCa 65% av svenska arbetstagare är fackanslutna.\nKostnad: ca 200-400 kr/mån',a:'De tre stora: LO (blå krage), TCO (tjänstemän), SACO (akademiker). Kollektivavtal täcker ca 90% av arbetstagare även utan fackmedlemskap — men juridisk hjälp kräver medlemskap.'}],ex:{type:'build',title:'Planera ditt skyddsnät',desc:'Sätt upp din A-kassa och fackplan.',fields:[{l:'Vilken bransch jobbar du i/siktar på?',ph:'T.ex. Lager, vård, bygg...'},{l:'Vilken a-kassa passar?',ph:'T.ex. Alfa-kassan — passar alla',hint:'alfakassan.se'},{l:'Vilket fackförbund?',ph:'T.ex. Kommunal, Transport, Unionen...'},{l:'Är du med? Om nej — nästa steg?',ph:'T.ex. Ansöker till Alfa-kassan den här veckan...'}]},quiz:[{q:'Vad krävs för A-kassa?',o:['Bara AF-inskriven','Arbetat 80 tim/mån i 12 mån + aktivt söka','Vara med i facket','Fast anst.'],c:1},{q:'Vad kostar A-kassan?',o:['Gratis','80-130 kr/mån','500 kr/mån','1000 kr/mån'],c:1},{q:'Vad ger kollektivavtal?',o:['Bara löneökning','Schyssta branschvillkor','Obligatorisk fackansl.','Gratis juridik alla'],c:1},{q:'Vilken a-kassa passar alla?',o:['Kommunal','Alfa-kassan','Unionen','Byggnads'],c:1}],pr:['Vilken a-kassa för [yrke]?','Skillnad facket vs a-kassan?','A-kassan om jag jobbar extra?']},

{id:'a_brev',icon:'✉️',title:'Personligt brev',sub:'Skrivet rätt öppnar det dörren',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Vad är ett personligt brev?',s:'CV:et visar VAD du gjort. Brevet visar VEM du är och VARFÖR just detta jobb.\n\nStruktur:\n1. Fånga intresset (1 mening)\n2. Varför jobbet + företaget?\n3. Dina matchande styrkor\n4. Avslutning + call to action\n\nMax 1 sida / ca 300 ord.',a:'Rekryterare läser brevet för att bedöma personlighet och motivation. Generiska brev sorteras bort. Anpassa varje brev — 20-30 min per ansökan.'},{t:'Öppningsmening — gör den oemotståndlig',s:'❌ "Jag söker härmed tjänsten som..."\n\n✅ "Tre år på PostNords lager lärde mig att logistik handlar om mer än orderrader — det handlar om att hela kedjan håller."\n\nFånga — rapportera inte!',a:'Öppningar som fastnar: en situation, ett resultat eller en insikt. Undvik: "Jag heter X och söker tjänsten som Y" — det vet rekryteraren redan.'},{t:'Avslutning med call to action',s:'✅ "Jag ser fram emot att berätta mer i en intervju."\n✅ "Jag hör av mig på fredag om ni inte hört av er."\n\nVara proaktiv — det visar självförtroende.\n\nUndvik: "Hoppas höra från er" — för passivt.',a:'Proaktiv avslutning ökar callback-frekvensen. Tacka för läsningen. Undvik att be om ursäkter för bristande kompetens.'}],ex:{type:'write',title:'Skriv din öppningsmening',desc:'Skriv de 2-3 starkaste inledningsmeningarna för ett personligt brev till ett jobb du söker.',tips:'Börja med en situation, ett resultat eller en insikt — inte "Jag söker härmed...". Visa VEM du är.',ph:'T.ex. "Tre år i lager lärde mig att logistik handlar om mer än orderrader..."',min:80},quiz:[{q:'Vad visar brevet som CV inte visar?',o:['Löneönskemål','Vem du är och varför just detta jobb','Alla utbildningar','Adress'],c:1},{q:'Vilken öppning är starkast?',o:['"Jag söker härmed tjänsten"','"Jag heter Anna och är intresserad"','"300 orderrader/dag lärde mig att tempo och precision inte utesluter varandra."','Alla lika bra'],c:2},{q:'Hur långt bör brevet vara?',o:['1-2 meningar','Ca 300 ord / 1 sida','2-3 sidor','Så långt som möjligt'],c:1},{q:'Vad visar proaktiv avslutning?',o:['Desperation','Självförtroende och genuint intresse','Stress','Dålig etikett'],c:1}],pr:['Skriv personligt brev: [annons + styrkor]','Förbättra min öppningsmening: [klistra in]','Gör detta brev mer specifikt: [klistra in]']},

{id:'a_natverk',icon:'🤝',title:'Nätverkande & dolda jobbet',sub:'40-50% av jobben annonseras aldrig',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Den dolda arbetsmarknaden',s:'Upp till 50% av alla jobb tillsätts utan annons.\n\nHur?\n• Intern rekrytering\n• Tips från nätverk\n• Spontanansökningar\n• LinkedIn-kontakter\n\nSöker du bara annonser missar du hälften!',a:'Studier visar 40-50% av tjänstetillsättningar sker via nätverk. Ju mer senior tjänst, desto vanligare med nätverksrekrytering.'},{t:'Hur nätverkar du praktiskt?',s:'1. LinkedIn — kontaktförfrågan + kort meddelande\n2. Informella möten — "Kan vi ta en kaffe?"\n3. AF-evenemang & jobbmässor\n4. Gamla kontakter — ex-kollegor, klasskompisar\n5. Branschföreningar\n\nGe innan du tar!',a:'"Kan du berätta om hur det är att jobba på X?" öppnar fler dörrar än "Har ni lediga tjänster?". LinkedIn InMail har ca 30% svarsfrekvens.'},{t:'Spontanansökan — hur?',s:'Strukturen:\n1. Adressera rätt person\n2. Visa att du känner till företaget\n3. Förklara värdet du tillför\n4. Be om 20 min möte\n\n"Hej [namn], jag har följt [företag] och tror min bakgrund i [X] kan tillföra [Y]."',a:'Spontanansökningar har högre callback-frekvens — lägre konkurrens. Bäst timing: efter expansion-nyheter. LinkedIn är bästa kanalen.'}],ex:{type:'build',title:'Din nätverksstrategi',desc:'Konkret plan för nätverkande i jobbsöket.',fields:[{l:'3 personer att kontakta den här veckan',ph:'T.ex. Ex-kollega på ICA, kompis på Peab...',ta:true,hint:'Tänk brett!'},{l:'Företag för spontanansökan',ph:'T.ex. IKEA Helsingborg, Region Skåne...'},{l:'Öppningsmeningen till spontanansökan',ph:'Hej [namn], jag har följt [företag] och tror min bakgrund i...',ta:true},{l:'LinkedIn-mål den här veckan',ph:'T.ex. Kontaktförfrågan till 3 + kommentera 2 inlägg',hint:'Regelbundenhet > kvantitet'}]},quiz:[{q:'Andel jobb utan annons?',o:['10-15%','40-50%','5%','80%'],c:1},{q:'Bästa sättet att börja nätverka?',o:['"Har ni lediga tjänster?"','Fråga om råd — visa intresse','Skicka CV till alla','Vänta passivt'],c:1},{q:'Vad är spontanansökan?',o:['En sen ansökan','Kontakt utan utlyst tjänst','Ansökan utan brev','Via telefon'],c:1},{q:'Varför hög callback för spontanansökningar?',o:['Ser bättre ut','Lägre konkurrens','Obligatoriskt','Företag föredrar det'],c:1}],pr:['LinkedIn-meddelande för informellt möte.','Spontanansökan till [företag] för [roll].','Hitta rätt kontaktperson på LinkedIn?']},

{id:'a_lon',icon:'💰',title:'Löneförhandling',sub:'Vet du vad du är värd?',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Ta reda på rätt lönenivå',s:'Innan du förhandlar — känn marknaden.\n\n📊 Källor:\n• lonestatistik.se — gratis & pålitlig\n• SCB — branschdata\n• Ditt fackförbund\n• LinkedIn Salary\n• Fråga nätverket\n\nSkåne-löner ca 5-10% lägre än Stockholm.',a:'Kom med ett specifikt tal, inte ett spann — spann tolkas alltid mot den lägre siffran. Öppna 5-10% över ditt minimum.'},{t:'Timing och formulering',s:'NÄR: Efter att erbjudandet är på bordet.\n\nHUR:\n✅ "Baserat på min erfarenhet och marknadsdata tänkte jag mig runt X kr."\n\n❌ "Jag behöver minst X" (ultimatum)\n❌ "Vad brukar ni betala?" (svag)\n\nPausen är din vän.',a:'Förhandling förväntas — arbetsgivare räknar med motbud. Att inte förhandla kostar i snitt 100 000+ kr/år. Förbered 3 argument: marknadsdata, erfarenhet, mervärde.'},{t:'Hela paketet — inte bara lönen',s:'Om lönen är låst, förhandla:\n\n📅 Extra semesterdagar\n⏰ Flex / distans\n📚 Utbildningsbudget\n🏋️ Friskvårdsbidrag\n\nEn dag extra semester = ca 5 000 kr/år.',a:'Förmånsförhandling är ofta enklare. Prioritera: vad är värdefullt för dig men billigt för arbetsgivaren? Friskvård och hemarbete är ofta lätta att få.'}],ex:{type:'build',title:'Din förhandlingsplan',desc:'Förbered löneförhandlingen konkret.',fields:[{l:'Vilket jobb?',ph:'T.ex. Lagerarbetare på PostNord...'},{l:'Vad säger marknadsdata?',ph:'T.ex. Medianlön lagerarbetare Skåne: 28 000 kr',hint:'lonestatistik.se — gratis'},{l:'Ditt öppningsbud',ph:'T.ex. 31 000 kr — 10% över minimum',hint:'Lite över ditt minimum'},{l:'Dina 3 argument',ph:'1. X år erfarenhet WMS\n2. Marknadsdata visar Y\n3. Jag tillför Z...',ta:true}]},quiz:[{q:'När lyfter du lön?',o:['I första intervjun','När erbjudandet är på bordet','I CV:et','Aldrig'],c:1},{q:'Smartaste öppningsbudet?',o:['Exakt vad du vill ha','5-10% över ditt minimum','Så högt som möjligt','Ett spann'],c:1},{q:'Lönen är låst — vad gör du?',o:['Tacka nej direkt','Förhandla förmåner','Acceptera tyst','Be om skriftlig bekräftelse'],c:1},{q:'Vad kostar det att inte förhandla?',o:['Ingenting','100 000+ kr/år','5 000 kr','Bara prestige'],c:1}],pr:['Löneförhandling för [roll] Helsingborg.','Marknadslön [yrke] Skåne?','Tacka nej till för lågt erbjudande.']},

{id:'a_uppf',icon:'📬',title:'Uppföljning efter ansökan',sub:'De som följer upp får fler intervjuer',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Varför följa upp?',s:'De flesta söker och väntar passivt.\n\nUppföljning:\n✅ Visar genuint intresse\n✅ Håller dig top-of-mind\n✅ Ger info om processen\n✅ Skiljer dig från mängden\n\n20-30% högre chans till intervju!',a:'Uppföljning uppfattas som professionellt i Sverige om det görs rätt. Rätt ton: nyfiken och positiv — inte påträngande.'},{t:'När och hur?',s:'⏰ Timing:\n• 5-7 dagar efter ansökan\n• Inom 24h efter intervju (tackmejl)\n• Om deadline passerat\n\n📧 E-post är bäst.\n\n✅ 3-5 meningar\n✅ Referera till ansökan\n✅ Bekräfta intresset',a:'Max 2 uppföljningar totalt. Tackmejl inom 24h. Undvik att ringa om inte kontaktinfo anger det.'},{t:'Hantera tystnad',s:'Tystnad ≠ Nej.\n\nProcesser tar 2-6 veckor.\n\nVad du gör:\n1. Skicka en artig uppföljning\n2. Fortsätt söka parallellt\n3. Sätt en egen deadline\n\nAldrig vredgade meddelanden.',a:'Rekrytering försinkas ofta av interna processer och semester. Om du fått annat erbjudande — meddela omgående och tacka för processen.'}],ex:{type:'write',title:'Skriv ditt uppföljningsmejl',desc:'Skriv ett professionellt uppföljningsmejl för en ansökan du skickat.',tips:'Kort: Referera till ansökan, bekräfta intresse, fråga om status. Max 4-5 meningar.',ph:'Hej [namn],\n\nJag skickade ansökan till [tjänst] förra veckan och ville höra om ni hunnit titta igenom den.\n\nJag är fortsatt genuint intresserad och ser fram emot att höra om er process.\n\nMed vänliga hälsningar\n[Ditt namn]',min:60},quiz:[{q:'Timing för uppföljning?',o:['2 timmar','5-7 dagar','1 månad','Aldrig'],c:1},{q:'Bäst kanal?',o:['Ring alltid','E-post i de flesta fall','Brev','Besök'],c:1},{q:'Vad vid tystnad?',o:['Avbryt processen','Max 2 artiga uppföljningar + söka parallellt','Ring varje dag','Klagomål'],c:1},{q:'Tackmejl efter intervju?',o:['Nästa vecka','Inom 24 timmar','Behövs inte','Bara om du vill ha jobbet'],c:1}],pr:['Uppföljningsmejl: [tjänst, företag, datum].','Formulera att jag fått annat erbjudande.','Tackmejl efter intervju som [roll] på [företag].']},

{id:'a_ref',icon:'⭐',title:'Referenshantering',sub:'Dina referenser kan avgöra erbjudandet',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',lessons:[{t:'Vem väljer du?',s:'Bra referens:\n✅ Tidigare chef eller arbetsledare\n✅ Kollega som sett dig prestera\n✅ Lärare eller handledare\n\nUndvik:\n❌ Familj och vänner\n❌ Konfliktrelationer\n❌ Ingen kontakt på 5+ år\n\nFråga alltid om lov INNAN!',a:'Rekryterare kontaktar referenserna i slutskedet. En dålig referens kan stoppa erbjudandet. Ha alltid 2-3 referensers kontakt redo.'},{t:'Förbered dina referenser',s:'Ring eller mejla INNAN:\n\n1. Berätta om jobbet\n2. Påminn om gemensamma projekt\n3. Lyft styrkor du vill att de nämner\n4. Skicka ditt CV\n\nFörberedd referens = starkare svar!',a:'Oförberedda svarar generellt. Förberedda berättar specifika historier. Ge 3-5 nyckelord att lyfta. Tacka alltid din referens efteråt.'},{t:'Saknar du formella referenser?',s:'Ny i Sverige? Lång uppehåll?\n\n✅ Volontärarbete → ny referens snabbt\n✅ Praktik via AF\n✅ Lärare / SFI-lärare / handläggare\n✅ Kompetensintyg\n\nVara ärlig: "Mina referenser är från hemlandet."',a:'I internationell rekrytering är referensbrev (letter of recommendation) vanligt. Att ljuga om referenser är vanligaste orsaken till indragna erbjudanden.'}],ex:{type:'build',title:'Din referensplan',desc:'Förbered dina 3 bästa referenser.',fields:[{l:'Referens 1 — namn, relation, kontakt',ph:'T.ex. Maria Svensson, f.d. chef ICA, maria@... 070-XXX',hint:'Fråga om lov INNAN!'},{l:'Referens 2 — namn, relation, kontakt',ph:'T.ex. Ahmed Karim, kollega PostNord, ahmed@...'},{l:'Referens 3 — namn, relation, kontakt',ph:'T.ex. Anna Berg, handledare YH, anna@...'},{l:'Vad ska de lyfta? (2-3 styrkor)',ph:'T.ex. Pålitlighet, truckvana, samarbete...',ta:true,hint:'Skicka detta till dina referenser!'}]},quiz:[{q:'Bäst som referens?',o:['Bästa vännen','Mamma','Tidigare chef','Bekant som tycker om dig'],c:2},{q:'När förbereder du?',o:['När rekryteraren frågar','INNAN du anger dem','Behövs inte','Sista dagen'],c:1},{q:'Saknar formella? Vad gör du?',o:['Uppfinn kontakter','Neka','Volontärarbeta/praktik/fråga lärare','Ge familjens kontakt'],c:2},{q:'Efter att referens hjälpt dig?',o:['Ingenting','Tacka — oavsett utfall','Pengar','Undvik kontakt'],c:1}],pr:['Mejl för att förbereda referens inför [intervju].','Formulera att jag saknar referens från Sverige.','Referensbrev för min f.d. kollega.']},

{id:'a_plan',icon:'🗓️',title:'Din 30-dagarsplan',sub:'Från övningar till riktigt jobb',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[
{t:'Hela jobbsöket på en rad',
s:'Du har nu verktygen:\n\n📊 Marknad → Vet var jobben finns\n📄 CV → Byggt och matchat\n✉️ Brev → Fångar intresset\n🎤 Pitch → 30 sek som säljer\n🤝 Nätverk → Når dolda jobbet\n💬 Intervju → STAR + trygghet\n📬 Uppföljning → Top-of-mind\n💰 Förhandling → Vet ditt värde\n🛡️ A-kassa → Skyddsnätet klart\n\nNu är det dags att göra det på riktigt.',
a:'Forskning visar att strukturerade jobbsökare hittar jobb 40% snabbare än de som söker slumpmässigt. Kombinationen CV + brev + nätverk + uppföljning är kraftfullare än enbart ansökningar.'},
{t:'Prioritera rätt — i rätt ordning',
s:'Vecka 1 — Grunden:\n✅ CV klart i CVmatchen\n✅ A-kassa + facket ansökt\n✅ LinkedIn uppdaterad\n\nVecka 2-3 — Kanalerna:\n✅ 3 ansökningar/vecka\n✅ 1 spontanansökan/vecka\n✅ Nätverk 2 kontakter/vecka\n\nVecka 4+ — Följa upp:\n✅ Uppföljning på alla ansökningar\n✅ Justera CV efter feedback',
a:'De vanligaste misstagen: söka för brett, skicka samma CV till alla, inte följa upp, ge upp för tidigt. En riktad ansökan med anpassat CV + brev slår alltid 10 generiska ansökningar.'},
{t:'Hålla motivationen uppe',
s:'Jobbsöket är ett maraton — inte en sprint.\n\n💡 Tips:\n• Behandla jobbsöket som ett jobb (fasta tider)\n• Fira smårörelser (svar, intervjukallelse)\n• Blanda aktiviteter (söka + nätverka + lära)\n• Ta en dag ledigt i veckan\n• Prata med din handläggare regelbundet\n\nSnittid att hitta jobb: 3-6 månader.',
a:'Motivationstapp är normalt. Studier visar att jobbsökare som har en veckorutin och stöd från nätverk/handläggare är signifikant mer framgångsrika. Varje avslag är information — inte ett personligt misslyckande.'}
],
ex:{type:'job-plan-ai',title:'Generera din personliga 30-dagarsplan',desc:'Berätta om din situation och få en konkret vecka-för-vecka-plan anpassad till just dig.'},
quiz:[
{q:'Vad är smartaste ordningen att börja jobbsöket?',o:['Skicka 20 ansökningar dag 1','Grunden först — CV, A-kassa, LinkedIn — sedan ansökningar','Vänta på rätt annons','Ringa AF varje dag'],c:1},
{q:'Hur många riktade ansökningar slår 10 generiska?',o:['Ingen — kvantitet vinner','1 riktad ansökan med anpassat CV + brev','5 generiska','Det beror på bransch'],c:1},
{q:'Vad gör du när motivationen sviktar?',o:['Ge upp och vänta','Fast rutin + blanda aktiviteter + fira smårörelser','Söka ännu fler jobb','Söka vilka jobb som helst'],c:1},
{q:'Hur lång är snittiden att hitta jobb?',o:['1-2 veckor','3-6 månader','1 år','Omedelbart'],c:1}
],
pr:['Bygg min 30-dagarsplan baserat på: [situation, yrke, mål]','Hur prioriterar jag om jag har begränsat med tid?','Motiverande veckoplan för jobbsöket.']},
{id:'a_denmark',icon:'🇩🇰',title:'Jobba i Danmark',sub:'Öresund — din närmaste arbetsmarknad',color:'#f87171',bc:'rgba(248,113,113,.3)',bg:'rgba(248,113,113,.07)',
lessons:[{t:'Varför Danmark?',s:'Danmark har ~2,6% arbetslöshet — Sverige har 8,8%.\nHelsingborg har 11,3%.\n\nDet är 20 minuter med färja till en av Europas starkaste arbetsmarknader.\n\nCa 20 000 personer pendlar dagligen Sverige ↔ Danmark.\n\nPopulära branscher för helsingborgare:\n🏗️ Bygg & anläggning\n🏥 Vård & omsorg\n🚛 Lager & transport\n🍽️ Restaurang & hotell\n🏭 Industri & teknik\n\nDanska löner är ofta 20-40% högre än svenska.',a:'Danmark är ett av världens rikaste länder med stark arbetsmarknad. Bristen på arbetskraft är utbredd. Danska arbetsgivare rekryterar aktivt i Helsingborg via mässan "Tura till jobbet" (hålls varje år). EURES och Öresunddirekt hjälper med allt praktiskt kring gränsarbete.'},{t:'Vad krävs? EU-medborgare vs andra',s:'Som EU-medborgare har du fri rörlighet.\nDu behöver INGET arbetstillstånd.\n\nNär du fått jobbet:\n\n1️⃣ Danskt CPR-nummer\n(personnummer — söks på Borgerservice)\n\n2️⃣ NemKonto\n(danskt bankkonto för löneutbetalning)\n\n3️⃣ Registrera dig hos SKAT\n(danska Skatteverket — skattekort)\n\n4️⃣ Dansk A-kasse\n(om du vill ha dansk a-ersättning)\n\nÖresunddirekt hjälper med alla steg!\nGratis rådgivning: oresunddirekt.se',a:'CPR-nummer söks på Borgerservice i Helsingör — boka tid online. NemKonto = danskt bankkonto. Nordea och Handelsbanken har kontor på båda sidor. SKAT utfärdar skattekort (skattemyndigheten.dk). Utan skattekort dras 55% i skatt tills det är ordnat. Danska A-kassor (t.ex. ASE, Faglig Fælles Forbund 3F) — du väljer branschrelevant kasse.'},{t:'Öresunddirekt & skatt',s:'Öresunddirekt är en gratis tjänst som hjälper dig med allt kring att jobba i Danmark.\n\noresunddirekt.se — svenska och danska handläggare\n\nDe svarar på:\n✅ Skatt och pension\n✅ A-kasse och försäkringar\n✅ Barnbidrag och sociala förmåner\n✅ Hur du registrerar dig\n✅ Rättigheter som gränsarbetare\n\n⚠️ Skattefrågan:\nBor du i Sverige, jobbar i Danmark = betalar DANSK skatt på danska inkomster.\nDeklarerar i BÅDA länderna!\n\nÖresund-skatteöverenskommelsen reglerar detta.',a:'Gränsarbetare beskattas i arbetslandet (Danmark) för danska inkomster. Du deklarerar dock i Sverige som bosättningsland. Öresund-avtalet undviker dubbelbeskattning. Pension: du tjänar in dansk ATP-pension parallellt med din svenska. Sjukpenning: FK (Sverige) betalar om du bor i Sverige. Barnbidrag: betalas av det land där barnet bor (Sverige). Ring Öresunddirekt INNAN du börjar — det undviker dyra misstag.'},{t:'Inte EU-medborgare? Så här går det till',s:'Har du uppehållstillstånd i Sverige men är inte EU-medborgare?\n\n✅ Du KAN ha rätt att jobba i Danmark om:\nDu haft permanent uppehållstillstånd i Sverige i minst 5 år\n(= EG-uppehållstillstånd / EU:s långtidsboende-status)\n\n❌ Vanligt tidsbegränsat tillstånd (TUT) räcker INTE.\n\nFörsta steget alltid:\nRing Öresunddirekt: oresunddirekt.se\nEller EURES: eures.europa.eu\n\nDe utreder din specifika situation gratis.',a:'Regler för tredjelandsmedborgare (icke-EU) styrs av EU-direktiv 2003/109 om långtidsboende. 5 års sammanhangände lagligt boende i Sverige ger i regel rätt till rörlighet i andra EU-länder. Men Danmark har särskilda undantag inom EU (för rättsliga och inrikes frågor) och tillämpar reglerna strikt. Kontakta alltid Öresunddirekt eller en rådgivare före jobbansökan — det undviker besvikelse.'}],
ex:{type:'build',title:'Din danska jobbplan',desc:'Planera dina första steg mot ett jobb i Danmark.',fields:[{l:'Vilket yrke söker du i Danmark?',ph:'T.ex. truckförare, undersköterska, kock, lagerarbetare...',hint:'Samma yrke som i Sverige — men danska löner!'},{l:'Har du sökt på jobnet.dk eller EURES?',ph:'T.ex. Ja, hittade 3 annonser för truckförare nära Helsingör / Nej — gör det nu',hint:'jobnet.dk = Platsbanken i Danmark. Gratis.'},{l:'Vad är ditt första praktiska steg?',ph:'T.ex. Ringa Öresunddirekt, boka tid för CPR-nummer på Borgerservice...',ta:true,hint:'oresunddirekt.se — gratis rådgivning'},{l:'Har du koll på skattefrågan?',ph:'T.ex. Nej — ringer Öresunddirekt / Ja, förstår att jag betalar dansk skatt',hint:'Ring INNAN du börjar — undviker dyra misstag!'}]},
quiz:[{q:'Vad är Danmarks arbetslöshet 2025?',o:['~8%','~5%','~2,6%','~12%'],c:2},{q:'Vad behöver EU-medborgare för att jobba i Danmark?',o:['Arbetstillstånd','Ingenting — fri rörlighet gäller','Danskt pass','Visum'],c:1},{q:'Kan du jobba i Danmark med bara svenskt uppehållstillstånd?',o:['Å ja, uppehållstillstånd räcker','Öresunddirekt utreder — beror på om du haft PUT i 5+ år','Ja alltid om du bor i Sverige','Nej aldrig'],c:1},{q:'Vad är ett CPR-nummer?',o:['Danskt körkort','Danskt personnummer — krävs för lön och skatt','En a-kasse','Danskt ID-kort'],c:1},{q:'Vad gör Öresunddirekt?',o:['Söker jobb åt dig','Gratis rådgivning om gränsarbete Sverige-Danmark','Danskt BankID','Taxiservice över sundet'],c:1},{q:'Var betalar du skatt om du bor i Sverige och jobbar i Danmark?',o:['Bara i Sverige','Bara i Danmark — men deklarerar i båda','Ingen skatt alls','Bara i EU'],c:1},{q:'Vad är dansk A-kasse?',o:['Danskt personnummer','Dansk a-kassa — ger ersättning om du blir arbetslös i Danmark','En bank','Danskt Skatteverk'],c:1}],
pr:['Vilka jobb finns i Danmark för [yrke] nära Helsingör?','Förklara steg för steg hur jag börjar jobba i Danmark som svensk.','Vad tjänar en [yrke] i Danmark jämfört med Sverige?']}
];

var HALSA=[
{id:'h1',icon:'🧠',title:'Mental hälsa & stress',sub:'Hantera press och mående',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Stress — vän eller fiende?',s:'Lite stress är bra — det skärper fokus.\nFör mycket stress under för lång tid = skadligt.\n\nVarningssignaler:\n• Sömnsvårigheter\n• Irritation & oro\n• Koncentrationssvårigheter\n• Trötthet som inte går över\n• Ont i nacke/huvud/mage',a:'Kronisk stress påverkar immunsystemet, minnet och hjärtfunktionen. Kortisol (stresshormonet) är nödvändigt akut men skadligt långsiktigt. Ca 30% av sjukskrivningar i Sverige beror på psykisk ohälsa.'},
{t:'Vad hjälper faktiskt?',s:'✅ Rörelse — 30 min/dag räcker\n✅ Sömn — 7-9 timmar\n✅ Socialt stöd — prata med någon\n✅ Andningsövningar — 4-7-8-metoden\n✅ Naturvistelse — sänker kortisol\n\n❌ Alkohol — tillfällig lättnad, förvärrar\n❌ Skärm sent — stör melatonin',a:'Forskning visar att 30 min promenad om dagen är lika effektivt som antidepressiva vid mild till måttlig depression. Mindfulness 10 min/dag sänker kortisolnivåer mätbart efter 8 veckor.'},
{t:'Hjälp finns — ta den!',s:'I Sverige har du rätt till hjälp.\n\n📞 Vårdguiden: 1177\n💬 Mind Självmordslinjen: 90101\n🏥 Vårdcentral — remiss till kurator\n💻 1177.se — självhjälp online\n🤝 Jobbtorg & handläggare — stöd\n\nAtt söka hjälp är styrka — inte svaghet.',a:'Tidigt stöd förhindrar allvarligare ohälsa. Kurator på vårdcentral kostar samma som läkarbesök (200-300 kr). Psykologisk behandling via KBT-online är gratis via 1177 i många regioner.'}
],
ex:{type:'build',title:'Din stressanalys',desc:'Kartlägg din stress och planera motståndet.',
fields:[
{l:'Vad stressar dig mest just nu?',ph:'T.ex. Ekonomin, jobbsök, familjesituation...',ta:true},
{l:'Vilka varningssignaler känner du igen?',ph:'T.ex. Sömnsvårigheter, oroliga tankar...'},
{l:'Vad hjälper DIG? (minst 2 saker)',ph:'T.ex. Promenader, prata med vän, musik...',hint:'Vad vet du redan fungerar för dig?'},
{l:'En konkret sak du gör IDAG för att ta hand om dig',ph:'T.ex. Ringer en vän, går en promenad, lägger telefonen åt sidan 21.00',hint:'Litet steg — stor skillnad.'}
]},
quiz:[
{q:'Hur lång daglig rörelse räcker för positiv hälsoeffekt?',o:['2 timmar','30 minuter','1 timme','10 minuter'],c:1},
{q:'Vilket nummer ringer du för råd om hälsa dygnet runt?',o:['112','1177','90101','114 14'],c:1},
{q:'Vad är en varningssignal för för hög stress?',o:['Lite ökad puls','Sömn som fungerar bra','Sömnsvårigheter och ihållande trötthet','Att du är fokuserad'],c:2},
{q:'Att söka hjälp för sin psykiska hälsa är...',o:['Svaghet','Styrka','Onödigt','Dyrt'],c:1}
],
pr:['Ge mig en konkret stresshanteringsplan för en jobbsökare.','Vad är KBT och hur fungerar det?','Enkla andningsövningar mot ångest?']},

{id:'h2',icon:'😴',title:'Sömn & återhämtning',sub:'Grunden för allt annat',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Varför sömn är #1',s:'Under sömn:\n🧠 Hjärnan bearbetar information\n💪 Kroppen repareras\n🛡️ Immunsystemet stärks\n❤️ Hjärtat återhämtar sig\n\nVuxna behöver: 7-9 timmar/natt\n\nKronisk sömnbrist → sämre minne, humör, immunförsvar och beslutsfattande.',a:'Sömnbrist ger samma kognitivt nedsatt tillstånd som alkoholpåverkan. En vuxen som sover 6 tim/natt i 10 dagar presterar som om de vakat i 24 timmar. Sömnen är inte lyx — den är biologi.'},
{t:'Sömnhygien — 6 regler',s:'1. Lägg dig och vakna samma tid — varje dag\n2. Mörkt, svalt, tyst rum (18-20°C)\n3. Inga skärmar 1 tim innan\n4. Undvik koffein efter kl 14\n5. Lugn rutin: bok, stretching, dusch\n6. Sängen = bara sömn (inte skärmtid)',a:'Blåljus från skärmar hämmar melatoninproduktionen med upp till 50%. Sömnrummet bör vara 18-20°C — för varmt stör djupsömnen. Regelbunden läggtid är viktigare än sovtid.'},
{t:'Om du inte kan sova',s:'Lig inte vaken och kämp!\n\nGör istället:\n• Gå upp och gör något lugnt 20 min\n• Skriv ner oroliga tankar på papper\n• Prova 4-7-8-andning\n• Progressiv muskelavslappning\n\nUndvik:\n• Titta på klockan\n• Ta melatonin regelbundet utan läkarråd\n• "Sova ikapp" på helger',a:'Sömnrestriktion (paradoxal sovterapi) är mest effektiv behandling för insomni. Begränsa sängtiden initialt till faktisk sovtid — det bygger sömndriven. Remiss till sömnenhet via 1177 om problem kvarstår.'}
],
ex:{type:'build',title:'Din sömnplan',desc:'Bygg en sömnrutin som faktiskt fungerar.',
fields:[
{l:'Hur många timmar sover du nu i snitt?',ph:'T.ex. 5-6 timmar — ofta svårt att somna...'},
{l:'Vad stör din sömn mest?',ph:'T.ex. Oroliga tankar, telefon i sängen, oregelbundna tider...'},
{l:'Din ideala läggtid och uppvagningstid',ph:'T.ex. Sova 23:00, vakna 07:00 — 8 timmar',hint:'Håll tider — även helger!'},
{l:'En sömnregel du börjar med IKVÄLL',ph:'T.ex. Telefonen utanför sovrummet från och med ikväll',hint:'Börja med en — gör den till vana.'}
]},
quiz:[
{q:'Hur många timmar sömn behöver de flesta vuxna?',o:['5-6 timmar','7-9 timmar','4-5 timmar','10+ timmar'],c:1},
{q:'När bör du sluta dricka kaffe/te med koffein?',o:['Kl 18','Kl 14','Kl 20','Det spelar ingen roll'],c:1},
{q:'Vad gör du om du inte kan sova efter 20 min?',o:['Kämpa vidare i sängen','Gå upp och gör något lugnt','Ta en sömnpille','Titta på Netflix'],c:1},
{q:'Vilken rumstemperatur är bäst för sömn?',o:['22-24°C','18-20°C','25°C','Under 16°C'],c:1}
],
pr:['Kvällsrutin för bättre sömn under jobbsökperiod.','Vad är 4-7-8-andning?','Hur påverkar dålig sömn jobbsöket?']},

{id:'h3',icon:'🏃',title:'Rörelse & energi',sub:'Gratis medicin som fungerar',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Rörelse utan gym',s:'Du behöver inte gymkort för att röra dig.\n\n✅ Promenader — effektivast och enklast\n✅ Cykling — transport + rörelse\n✅ Trappor istället för hiss\n✅ YouTube-träning hemma (gratis)\n✅ Friluftsliv — skog & strand\n\nMålet: 150 min lätt rörelse/vecka\nOr: 75 min intensiv rörelse/vecka',a:'WHO:s rekommendation: 150-300 min måttlig intensitet/vecka. Stillasittande >8 tim/dag ökar risken för depression, diabetes och hjärtsjukdom — oavsett om du tränar. Ta rörelsepaus var 45 min.'},
{t:'Rörelse och mental hälsa',s:'Träning frigör:\n🧠 Endorfiner — naturlig smärtlindring\n😊 Dopamin — motivation och belöning\n😴 Serotonin — lugn och välmående\n\n30 min promenad = märkbar stämningsförbättring\n\nSärskilt viktigt under jobbsök — motverkar uppgivenhet.',a:'Studier visar att regelbunden träning minskar risk för depression med 26%. Effekten kvarstår i veckor. Utomhusrörelse ger extra effekt via dagsljus (reglerar dygnsrytm) och naturkontakt (sänker kortisol).'},
{t:'Kom igång — och håll igång',s:'Vanligaste misstaget: börja för hårt.\n\n✅ Börja med 10 min/dag\n✅ Koppla till något du redan gör (morgonkaffe → promenad)\n✅ Hitta en aktivitetskompis\n✅ Logga i kalender — bygg stolthet\n\n❌ Vänta tills du "orkar"\n❌ Allt eller inget-tänk\n❌ Skippa vid minsta hinder',a:'Beteendeforskning visar att aktivitet kopplad till befintliga rutiner (habit stacking) har 3x högre chans att bli bestående. 21 dagar är en myt — nya vanor tar i snitt 66 dagar att befästa.'}
],
ex:{type:'build',title:'Din rörelseplan',desc:'En realistisk plan för mer rörelse i vardagen.',
fields:[
{l:'Hur aktiv är du idag?',ph:'T.ex. Sitter mest, promenerar ibland, cyklar till AF...'},
{l:'Vilken typ av rörelse passar dig?',ph:'T.ex. Promenader utomhus, hemmaträning, simning...',hint:'Välj något du faktiskt tycker om!'},
{l:'När på dagen passar det bäst?',ph:'T.ex. Morgonpromenad kl 8 innan jobbsöket börjar'},
{l:'Ditt rörelsemål denna vecka (konkret)',ph:'T.ex. 3 promenader à 30 min: måndag, onsdag, fredag',hint:'Skriv i kalendern nu!'}
]},
quiz:[
{q:'Hur mycket rörelse rekommenderar WHO per vecka?',o:['30 min totalt','150 min lätt rörelse','600 min','1 timme intensiv'],c:1},
{q:'Vilka ämnen frigörs vid träning?',o:['Kortisol och adrenalin','Endorfiner, dopamin och serotonin','Melatonin','Insulin'],c:1},
{q:'Bästa strategin för att komma igång?',o:['Börja hårt för att se snabba resultat','Börja med 10 min och koppla till befintlig rutin','Vänta tills du känner för det','Köp gymkort'],c:1},
{q:'Hur länge tar det ungefär att bygga en ny vana?',o:['21 dagar','66 dagar','7 dagar','1 år'],c:1}
],
pr:['Ge mig en 30-dagars rörelseplan för nybörjare.','Gratis träningsprogram utan utrustning?','Hur kopplar jag rörelse till mitt jobbsök?']},

{id:'h4',icon:'🥦',title:'Mat & energi',sub:'Ät rätt utan att det kostar skjortan',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Hjärnmat för jobbsökare',s:'Din hjärna förbrukar 20% av kroppens energi.\n\nBra för fokus & energi:\n🐟 Fet fisk (omega-3) — 2 ggr/vecka\n🥚 Ägg — protein + B-vitaminer\n🫐 Bär — antioxidanter\n🥜 Nötter — snabb energi\n🌾 Fullkorn — stabilt blodsocker\n🥦 Grönsaker — allt!\n\nUndvik: socker-toppar → kraschlanda → orkar inte söka jobb.',a:'Blodsocker-variationer påverkar koncentration och humör direkt. Frukost med protein och fibrer ger stabil energi 4-5 timmar. Omega-3 har dokumenterad effekt på kognitiv funktion och minskar inflammationsmarkörer.'},
{t:'Billig och bra mat',s:'Budget: 40-50 kr/dag per person räcker.\n\n💰 Billiga proteiner:\n• Ägg (10-12 kr/6-pack)\n• Linser & bönor (15 kr/kg torkade)\n• Kycklingfilé fryst\n• Tonfisk på burk\n\n💰 Billiga grönsaker:\n• Fryst (lika nyttigt som färsk!)\n• Kål, morötter, lök — alltid billigt\n• Rotfrukter i säsong',a:'Matlajans viktigaste trick: laga stort — ät flera dagar. Planera veckomeny på söndagen. Handla med lista. Frysvaror är nutritionsmässigt lika bra som färska (oftast frysta vid skördemognad).'},
{t:'Enkla vanor som gör skillnad',s:'• Drick vatten — inte läsk (10-15 kr/dag sparas)\n• Ät frukost — startar ämnesomsättningen\n• Ta rörelsepaus vid lunch\n• Ät inte framför skärmen\n\n⚠️ Hoppar du över mat för att spara pengar?\nPrata med socialtjänsten eller AF — det finns stöd!',a:'Maten är direkt kopplad till koncentration och emotionell reglering. Vid ekonomisk stress är mat ofta det första som skärs ner — men det är kontraproduktivt. Matbanker finns i Helsingborg via Stadsmissionen.'}
],
ex:{type:'build',title:'Din matplan',desc:'Enkel veckoplan för bra mat på budget.',
fields:[
{l:'Vad äter du typiskt till frukost, lunch och middag?',ph:'T.ex. Hoppar frukost, smörgås till lunch, pasta till middag...',ta:true},
{l:'Vad är din ungefärliga matbudget per vecka?',ph:'T.ex. 300-400 kr för mig själv'},
{l:'Vilken är din svagaste måltid? (den du hoppar eller äter dåligt)',ph:'T.ex. Frukost — hinner aldrig, lunch — köper dyrt ute...'},
{l:'En konkret förbättring du gör denna vecka',ph:'T.ex. Handlar linser och lagar linsgryta på söndag',hint:'Liten förändring — stor skillnad'}
]},
quiz:[
{q:'Hur stor andel av kroppens energi använder hjärnan?',o:['5%','20%','50%','10%'],c:1},
{q:'Vilken mat ger stabil energi utan kraschlandning?',o:['Socker och vitt bröd','Fullkorn, protein och grönsaker','Energidrycker','Fruktjuice'],c:1},
{q:'Är fryst grönsaker sämre än färsk nutritionsmässigt?',o:['Ja, mycket sämre','Nej — ofta lika bra eller bättre','Bara hälften så nyttigt','Beror på grönsaken'],c:1},
{q:'Vad kostar en hälsosam dag mat ungefär på budget?',o:['200 kr','40-50 kr','100 kr','10 kr'],c:1}
],
pr:['Veckomeny för 300 kr för 1 person.','Snabba nyttiga recept på 20 minuter?','Vad kan jag äta för bättre fokus och koncentration?']},

{id:'h5',icon:'🏥',title:'Sjukvård i Sverige',sub:'Dina rättigheter och hur systemet funkar',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Hur sjukvården är uppbyggd',s:'Sverige har en av världens bästa sjukvård — och den är nästan gratis.\n\n🏥 Steg 1: Vårdcentral (husläkare)\n🏥 Steg 2: Specialistvård (remiss)\n🏥 Steg 3: Sjukhus (akut eller remiss)\n\nRing 1177 vid frågor — dygnet runt!\nRing 112 vid akuta tillstånd.',a:'Regionerna ansvarar för sjukvård i Sverige. Helsingborg tillhör Region Skåne. Frikort: 1 150 kr max per år för öppenvård (2024). Barn under 18 är avgiftsfria. Asylsökande har rätt till vård som inte kan anstå.'},
{t:'Kostnader och fri-kort',s:'Besöksavgift: ca 200-350 kr/besök\n\nFrikort beviljas när du betalat:\n• 1 150 kr (öppenvård) under 12 mån\n• Sedan gratis resten av perioden\n\nOrdna ditt frikort via:\n1177.se → Region Skåne → Frikort',a:'Frikortsystemet samlas automatiskt i Region Skåne. Spara kvittona! Läkemedel har eget högkostnadsskydd: max 1 300 kr/år. Tandvård: begränsat stöd för vuxna (tandvårdsstöd 600 kr/år).'},
{t:'Vård utan personnummer',s:'Ny i Sverige? Asylsökande? Papperslös?\n\n✅ Akutvård: alltid rätt till det\n✅ Barn under 18: full sjukvård\n✅ Gravida: mödravård\n✅ Psykiatrisk vård som inte kan anstå\n\nKontakta närmaste vårdcentral.\nI Helsingborg: ring 1177',a:'EU-medborgare har rätt till sjukvård med europeiskt sjukförsäkringskort (EHIC). Papperslösa har rätt till vård som inte kan anstå via Röda Korset kliniker. Asylsökande med LMA-kort: vård via Region Skåne.'}
],
ex:{type:'build',title:'Din vårdkontakt',desc:'Se till att du har rätt kontakter och vet hur systemet funkar.',
fields:[
{l:'Har du en fast vårdcentral i Helsingborg?',ph:'T.ex. Ja — Söderslätts VC / Nej — behöver lista mig'},
{l:'Vet du var närmaste akutmottagning är?',ph:'T.ex. Helsingborgs lasarett, Södra Storgatan 15'},
{l:'Har du frikort eller vet hur du ansöker?',ph:'T.ex. Nej — ska kolla 1177.se',hint:'1177.se → Region Skåne → Frikort'},
{l:'Finns det något hälsoproblem du skjutit upp att ta hand om?',ph:'T.ex. Ont i ryggen sedan 3 mån — ska boka tid denna vecka',hint:'Boka nu — lång väntetid!'}
]},
quiz:[
{q:'Vilket nummer ringer du vid frågor om hälsa och sjukvård?',o:['112','1177','114 14','118 118'],c:1},
{q:'Hur mycket betalar du max för öppenvård per år (frikort)?',o:['500 kr','1 150 kr','5 000 kr','Det varierar'],c:1},
{q:'Vad har barn under 18 rätt till?',o:['Bara akutvård','Full sjukvård utan avgift','Hälften av vuxenavgiften','Bara hos barnläkare'],c:1},
{q:'Vad har asylsökande rätt till i Sverige?',o:['Ingen vård alls','Akutvård och vård som inte kan anstå','Bara privatvård','Samma som medborgare'],c:1}
],
pr:['Hur listar jag mig på en vårdcentral i Helsingborg?','Vad täcker frikortet?','Tandvård på låg budget i Sverige?']},

{id:'h6',icon:'🤝',title:'Socialt stöd & ensamhet',sub:'Du behöver inte klara allt själv',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Ensamhet — en folksjukdom',s:'Ensamhet är en av vår tids största hälsoutmaningar.\n\nRisker med kronisk ensamhet:\n❤️ Hjärt-kärlsjukdom (+29%)\n🧠 Demens (+50%)\n😔 Depression\n⚰️ Kortare liv\n\nJobbsök förstärker ofta ensamhet — du tappar rutiner och social kontakt.',a:'WHO har utnämnt ensamhet till en global hälsokris. Socialt stöd är en av de starkaste skyddsfaktorerna för fysisk och mental hälsa. Kvalitet > kvantitet — 1-2 nära relationer skyddar mer än 20 ytliga.'},
{t:'Hitta gemenskap i Helsingborg',s:'Gratis och nära:\n\n🏛️ Biblioteket — öppet hus, evenemang\n⛪ Kyrkor & moskéer — öppna för alla\n🌳 Naturstödsprogram via kommunen\n🎭 Föreningsliv — idrott, kultur, språk\n🤝 Volontärnätverk (Stadsmissionen)\n🏃 Parkrun — gratis löpning lördag 9.00\n\nAF-aktiviteter ger också social kontakt!',a:'Forskning visar att volontärarbete är ett av de effektivaste sätten att bygga socialt nätverk och öka välmående. Det ger struktur, syfte och kontakter — tre saker som jobbsöket ofta tar ifrån en.'},
{t:'Prata om hur du mår',s:'Det är okej att inte vara okej.\n\nVem kan du prata med?\n• Vänner och familj\n• Handläggare på AF\n• Kurator på vårdcentral\n• Mind Stödlinje: 90101\n• Bris (om du är ung): 116 111\n\nDu behöver inte vänta tills det är kris.\n"Jag har det lite tungt just nu" räcker.',a:'Att verbalisera sina känslor (name it to tame it) sänker aktiviteten i amygdala (hjärnans larmsystem) mätbart. Att prata om hur man mår är alltså direkt terapeutiskt — inte bara symboliskt.'}
],
ex:{type:'build',title:'Ditt sociala stödnät',desc:'Kartlägg och stärk ditt sociala nätverk.',
fields:[
{l:'Tre personer du kan ringa om du har det tufft',ph:'T.ex. Systern, f.d. kollegan, grannen...',ta:true,hint:'Skriv ner dem — det är viktigt!'},
{l:'En aktivitet du kan göra med andra denna vecka',ph:'T.ex. Promenad med granne, möte i föreningen, volontärpass'},
{l:'Finns det en gemenskap du vill hitta?',ph:'T.ex. Löpgrupp, språkklubb, bouleklubb...',hint:'Googla föreningar i Helsingborg'},
{l:'Hur mår du just nu — ärligt?',ph:'T.ex. Ganska bra / Lite nere / Ganska tufft just nu...',hint:'Inga rätta svar — bara ärlighet.'}
]},
quiz:[
{q:'Hur stor är risken för hjärt-kärlsjukdom vid kronisk ensamhet?',o:['Ingen extra risk','+29%','+5%','+10%'],c:1},
{q:'Vad ger volontärarbete utöver att hjälpa andra?',o:['Lön','Struktur, syfte och socialt nätverk','Bara dåligt samvete om man slutar','Ingenting extra'],c:1},
{q:'Vilket nummer ringer du Mind Stödlinje på?',o:['1177','90101','112','116 111'],c:1},
{q:'Vad är effektivare — många ytliga kontakter eller få nära?',o:['Många ytliga','Få nära relationer','Det är exakt likvärdigt','Beror på personlighet'],c:1}
],
pr:['Föreningar och aktiviteter för nyanlända i Helsingborg?','Hur hanterar jag ensamhet under jobbsöket?','Tips för att bygga vänskap som vuxen?']},

{id:'h7',icon:'🚭',title:'Alkohol, rökning & vanor',sub:'Ärliga fakta utan pekpinnar',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Alkohol — risker och gränser',s:'Riskdrickning i Sverige:\n🚹 Män: mer än 14 glas/vecka\n🚺 Kvinnor: mer än 9 glas/vecka\n\nAkuta risker vid berusning:\n• Olyckor & skador\n• Dåliga beslut\n• Ökad ångest dagen efter\n\nAlkohol löser inte stress — det förstärker den på lång sikt.',a:'Alkohol är klassad som klass 1-karcinogen (cancerframkallande) av WHO. Det finns ingen "säker" mängd för cancer. Däremot finns sociala och kulturella aspekter av måttlig konsumtion. Systembolaget och 1177 har gratis rådgivning.'},
{t:'Rökning — kostnad och alternativ',s:'En ask om dagen = ca 4 000 kr/mån\n48 000 kr per år!\n\nSluta-resurser:\n✅ Sluta-röka-linjen: 020-84 00 00 (gratis)\n✅ Nikotinläkemedel: receptfria på apotek\n✅ Receptbelagd medicin via husläkare\n✅ Appen "Smoke Free"\n\nDin kropp börjar återhämta sig inom 20 min!',a:'70% av rökare vill sluta. De flesta försök misslyckas, men varje försök ökar chansen att lyckas nästa gång. Kombinationen beteendestöd + nikotinläkemedel har 3-4x högre framgångsrate än kall kalkon.'},
{t:'Bryta dåliga vanor — hur?',s:'Vanor följer ett mönster:\n⚡ Trigger → 🔄 Rutin → 🎁 Belöning\n\nFör att bryta:\n1. Identifiera triggern\n2. Byt rutin (håll belöningen)\n3. Bygg ny belöning\n\nExempel:\nTrigger: Stress → Rökning → Avslappning\nNy rutin: Stress → Andningsövning → Avslappning',a:'James Clear (Atomic Habits): miljödesign är kraftfullare än viljestyrka. Ta bort triggern ur miljön. Gör den nya vanor enklare än den gamla. Identitetsbaserade vanor ("Jag är en icke-rökare") håller längre än mål ("Jag ska sluta röka").'}
],
ex:{type:'build',title:'Din vanekartläggning',desc:'Ärlig analys av en vana du vill förändra.',
fields:[
{l:'Finns det en vana du vill ändra?',ph:'T.ex. Röka mindre, dricka mer vatten, minska skärmtid...'},
{l:'Vad är triggern? (vad startar vanor)',ph:'T.ex. Stress, tristess, sällskap, efter mat...'},
{l:'Vilken belöning ger vanor? (äkta behov bakom)',ph:'T.ex. Avslappning, socialt, paus, hantera ångest...'},
{l:'En alternativ rutin som ger samma belöning',ph:'T.ex. 5 min promenad vid stress istället för cigarrett',hint:'Håll belöningen — byt bara rutinen!'}
]},
quiz:[
{q:'Vad är riskdrickning för en man per vecka?',o:['Mer än 20 glas','Mer än 14 glas','Mer än 7 glas','Mer än 5 glas'],c:1},
{q:'Hur mycket kostar en ask cigarretter om dagen på ett år?',o:['10 000 kr','48 000 kr','5 000 kr','25 000 kr'],c:1},
{q:'Vilket nummer ringer du Sluta-röka-linjen?',o:['112','020-84 00 00','1177','90101'],c:1},
{q:'Vad är kraftfullare än viljestyrka vid vanebrytning?',o:['Belöningar','Miljödesign — ta bort triggern','Straff','Att tänka mer'],c:1}
],
pr:['Plan för att röka mindre utan att sluta direkt.','Hur minskar jag alkohol under stressiga perioder?','Atomic Habits-metoden på svenska?']},

{id:'h8',icon:'💊',title:'Läkemedel & egenvård',sub:'Rätt info om vanliga medel',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Receptfria läkemedel — vad gäller?',s:'På apoteket utan recept:\n💊 Paracetamol (Alvedon) — smärta & feber\n💊 Ibuprofen (Ipren) — inflammation & smärta\n💊 Antihistamin — allergi & snuva\n💊 Sår- och hudprodukter\n💊 Nikotinläkemedel\n\n⚠️ Råd: Fråga alltid apotekspersonalen!\nDe är utbildade farmaceuter — gratis rådgivning.',a:'Sverige har receptfri försäljning i dagligvaruhandeln sedan 2009 men apoteket ger alltid bäst rådgivning. Paracetamol är säkert vid normala doser men FARLIGT vid överdos (levertoxiskt). Ibuprofen bör undvikas vid magsår, njurproblem och graviditet.'},
{t:'Kroniska sjukdomar & högkostnadsskydd',s:'Har du en kronisk sjukdom?\n\n✅ Recept: Max 1 300 kr per år (sedan gratis)\n✅ Hjälpmedel: gratis via Region Skåne\n✅ Hemsjukvård om du inte kan ta dig till VC\n\nGlöm inte:\n• Ta mediciner regelbundet\n• Berätta om alla mediciner för alla läkare\n• Förnya recept i tid',a:'Läkemedelsförmånen täcker receptbelagda läkemedel med max 1 300 kr/år i patientavgift. Kroniska sjukdomar ger ofta rätt till sjukersättning via FK om arbetskapaciteten är nedsatt. Anmäl till Försäkringskassan.'},
{t:'1177 — din digitala vårdguide',s:'1177.se ger dig:\n\n🔍 Symtom-sök — vad kan det vara?\n📞 Sjuksköterskestöd per telefon\n📅 Boka tid på vårdcentral\n💊 Läkemedelsinformation\n📋 Dina journalhandlingar\n🏥 Hitta närmaste vård\n\nAllt gratis — dygnet runt på telefon.',a:'1177 Vårdguiden är Region Skånes (och alla regioners) digitala ingång till vården. Sjuksköterskan bedömer om du behöver söka vård, vilken nivå och hur snabbt. Rätt vård i rätt tid.'}
],
ex:{type:'build',title:'Din hälsöversikt',desc:'Koll på dina mediciner och vårdbehov.',
fields:[
{l:'Tar du några regelbundna mediciner?',ph:'T.ex. Ja — blodtrycksmedicin, astmapump / Nej',hint:'Om ja: har du tillräckligt? Recept förnyat?'},
{l:'Har du ett aktuellt hälsoproblem du bör söka vård för?',ph:'T.ex. Ryggsmärta sedan 6 mån, stress-symtom...'},
{l:'Vet du var närmaste apotek är?',ph:'T.ex. Apoteket på Kullagatan / Kronans apotek Väla'},
{l:'Vad är din plan om du plötsligt blir sjuk?',ph:'T.ex. Ring 1177 och följ deras råd',hint:'Ha numret sparat: 1177'}
]},
quiz:[
{q:'Vad heter Sveriges vårdtelefon?',o:['112','1177','90101','114 14'],c:1},
{q:'Hur mycket betalar du max för receptläkemedel per år?',o:['500 kr','1 300 kr','5 000 kr','Inga max-belopp'],c:1},
{q:'Vad bör du alltid fråga apotekspersonalen?',o:['Priset','Råd om rätt medicin och dosering — gratis!','Dina journaler','Om du kan sluta med medicinen'],c:1},
{q:'Vad kan du göra på 1177.se?',o:['Bara ringa sjuksköterska','Symtomkoll, boka tid, journaler och läkemedelsinformation','Bara boka tid','Köpa receptfria läkemedel'],c:1}
],
pr:['Vad gör 1177 och hur använder jag det bäst?','Vad är skillnaden Alvedon och Ipren?','Hur ansöker jag om sjukersättning via FK?']},

{id:'h9',icon:'🦷',title:'Tandvård & kroppen',sub:'Glöm inte resten av kroppen',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Tandvård — dyrt men viktigt',s:'Sverige har inget generellt tandvårdsstöd för vuxna.\n\nMen du har:\n✅ Tandvårdsstöd: 600 kr/år (bidrag)\n✅ Referenstaxan — reglerar max-priser\n✅ Jämför priser på 1177.se\n✅ Folktandvården — ofta billigast\n\nBarn upp till 23 år: gratis tandvård!\nSjuka/funktionsnedsatta: extra stöd finns.',a:'Munhälsa påverkar hela kroppen — dåliga tänder kopplas till hjärtsjukdom och diabetes. Förebyggande vård (putsning + fluorid 2 ggr/år) är alltid billigare än lagning. Folktandvårdens referenstaxa finns på 1177.se.'},
{t:'Syn & hörsel',s:'Glasögon:\n• Synundersökning: ca 200-400 kr\n• Glasögon: 500-3000 kr\n• Socialbidrag kan täcka glasögon\n\nHörsel:\n• Hörseltest gratis via hörcentralen\n• Hörapparat subventioneras kraftigt (100 kr)\n• Remiss via vårdcentral eller 1177\n\nFörsumma inte syn och hörsel — det påverkar livskvalitet och arbetsförmåga!',a:'Synproblem är en vanlig orsak till huvudvärk och koncentrationssvårigheter. Region Skåne subventionerar hörapparater kraftigt — patienten betalar ca 100 kr. Synhjälpmedel kan sökas via Synrehabiliteringen om nedsättningen är allvarlig.'},
{t:'Förebyggande hälsa',s:'Gratis hälsokontroller i Sverige:\n\n🩺 Hälsokontroll: via din VC\n🫀 BVC & MVC: barn och gravida\n🎗️ Mammografi: 40-74 år (kallas automatiskt)\n🔬 Cervixprov: 23-64 år (kallas automatiskt)\n🫁 KOL-screening: rökare 40+\n\nTa emot kallelserna — de räddar liv.',a:'Sverige har ett av världens mest effektiva screeningprogram. Bröstcancer hittad via mammografi har 95% 5-årsöverlevnad. Cervixcancer kan helt förebyggas via HPV-vaccin (gratis upp till 26 år via vaccination) och regelbundna cellprov.'}
],
ex:{type:'build',title:'Din kropp-checklista',desc:'Säkra att du tar hand om hela dig.',
fields:[
{l:'När var du senast hos tandläkaren?',ph:'T.ex. För 2 år sedan — ska boka Folktandvården',hint:'Folktandvården Helsingborg: 0770-17 70 00'},
{l:'Behöver du glasögon eller hörselhjälp?',ph:'T.ex. Nej / Ja — misstänker att synen försämrats'},
{l:'Finns det en hälsokallelse du missat?',ph:'T.ex. Fått brev om mammografi men inte bokat tid...'},
{l:'En hälsoåtgärd du tar tag i denna vecka',ph:'T.ex. Bokar tandläkartid på Folktandvården',hint:'Gör det nu!'}
]},
quiz:[
{q:'Hur mycket är tandvårdsstödet för vuxna per år?',o:['Gratis','600 kr','2 000 kr','5 000 kr'],c:1},
{q:'Hur mycket kostar en hörapparat för patienten med subvention?',o:['3 000 kr','Ca 100 kr','Gratis','1 000 kr'],c:1},
{q:'Vid vilken ålder kallas du automatiskt till mammografi?',o:['30-60 år','40-74 år','50-80 år','Alla vuxna'],c:1},
{q:'Vad är Folktandvårdens fördel?',o:['Bäst utrustning','Ofta billigast','Öppet dygnet runt','Inga väntetider'],c:1}
],
pr:['Hitta billig tandläkare i Helsingborg.','Hur ansöker jag om glasögonbidrag?','Vilka gratis hälsokontroller har jag rätt till?']},

{id:'h10',icon:'🌱',title:'Välmående under jobbsök',sub:'Ta hand om dig MEDAN du söker jobb',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Jobbsökets psykologi',s:'Jobbsök aktiverar samma hjärna som sorg:\n\n• Avvisning gör ont — bokstavligen\n• Tapet-sökning → uppgivenhet\n• Identitet kopplad till arbete → vapor\n• Ensamhet förstärker allt\n\nDet är NORMALT att ha det tufft.\nDet är INTE normalt att inte ta hand om sig.',a:'Hjärnskanningar visar att socialt avvisande aktiverar samma smärtcentra som fysisk smärta. Varje avslagsbrev triggar ett verkligt stresspåslag. Att förstå detta normaliserar reaktionen och gör det lättare att hantera.'},
{t:'Den hållbara jobbsökar-rutinen',s:'Behandla jobbsöket som ett jobb:\n\n🕗 08:00 — Börja (klä på dig!)\n📋 08-10 — Söka och skriva ansökningar\n☕ 10-10:15 — Paus (ej skärm)\n📞 10:15-12 — Nätverk & uppföljning\n🍽️ 12-13 — Lunch (lämna hemmet!)\n📚 13-14 — Lära och kompetensutveckla\n🏃 14-15 — Rörelse\n🔒 15:00 — SLUTA för dagen',a:'Struktur är inte tvång — det är frihet. Utan rutin smetas jobbsöket ut över hela dygnet och skapar skuld. Att ha en tydlig sluttid är lika viktigt som en starttid.'},
{t:'Du är mer än ditt jobb',s:'Jobbsöket är tillfälligt.\nDu är permanent.\n\n💡 Påminn dig om:\n• Vad du är bra på UTÖVER jobbet\n• Vad du gjort som du är stolt över\n• Vem som bryr sig om dig\n• Vad som väntar när jobbet är klart\n\n📓 Skriv 3 saker du är tacksam för — varje dag.\nForskning: kraftfullt mot depression.',a:'Gratitude journaling (tacksamhetsdagbok) sänker depressions-symtom och ökar välmående signifikant i RCT-studier. Det tar 2 min. Jobbidentitet är ett välkänt psykologiskt fenomen — extra vanligt i Sverige där arbete är starkt kulturellt kopplat till värde.'}
],
ex:{type:'build',title:'Min välmående-rutin under jobbsöket',desc:'En hållbar plan för att ta hand om dig MEDAN du söker.',
fields:[
{l:'Din startrutin imorgon bitti (konkret)',ph:'T.ex. Upp 07:30, duscha, klä på mig, frukost kl 08:00',hint:'Klä på dig — det gör skillnad psykologiskt!'},
{l:'Din sluttid för jobbsöket varje dag',ph:'T.ex. Avslutar kl 15:00 — sedan är det fritid',hint:'En sluttid är lika viktig som en starttid'},
{l:'Tre saker du är tacksam för just nu',ph:'1. \\n2. \\n3. ',ta:true,hint:'Inga rätta svar — bara äkta.'},
{l:'En sak du INTE ska göra under jobbsöket för att skona dig själv',ph:'T.ex. Läsa nyheter mer än 15 min/dag, jämföra mig med andra på LinkedIn...'}
]},
quiz:[
{q:'Vad aktiverar avvisning (t.ex. ett avslagsbrev) i hjärnan?',o:['Ingenting speciellt','Samma smärtcentra som fysisk smärta','Bara lätt irritation','Glädje (signal att försöka igen)'],c:1},
{q:'Varför är det viktigt att klä på sig när man jobbar hemifrån?',o:['Det är inte viktigt','Det påverkar psykologisk beredskap och fokus','Bara av social hänsyn','Bara om man har videomöte'],c:1},
{q:'Vad visar forskning om daglig tacksamhets-notering?',o:['Ingen effekt','Sänker depressionssymtom signifikant','Bara bra för optimister','Fungerar bara kortsiktigt'],c:1},
{q:'En hållbar jobbsökardag har...',o:['8 timmar ren jobbsökning','Tydlig start, pauser, rörelse och SLUTTID','Inga pauser — maximal effektivitet','Jobbsökning hela kvällen också'],c:1}
],
pr:['Bygg min personliga välmående-rutin under jobbsöket.','Hur hanterar jag avslagsbrev psykologiskt?','Tacksamhetsdagbok — hur gör jag det?']},

{id:'h11',icon:'🏥',title:'1177 & digital vård',sub:'Rätt vård på rätt ställe',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Vad är 1177?',s:'1177 är Sveriges nationella vårdguide.\n\n📞 Ring 1177 — sjuksköterska svarar dygnet runt\n💻 1177.se — boka tid, läsa om symtom, se recept\n📱 Appen 1177 — se journalanteckningar & prover\n\nDet är alltid gratis att ringa 1177.',
a:'1177 hjälper dig avgöra om du behöver söka vård, och var. Ca 40% av de som ringer behöver inte söka vård alls — de får råd per telefon. Appen kräver BankID-inloggning.'},
{t:'Vårdens nivåer — var söker du?',s:'1. 🏠 Egenvård — vila, Alvedon, näsdroppar\n2. 📞 Ring 1177 — osäker? Fråga sjuksköterska\n3. 🏥 Vårdcentral — de flesta sjukdomar\n4. 🚑 Akutmottagning — livshotande\n5. 📞 112 — nödläge\n\nFel nivå = lång väntetid och sämre vård.',
a:'Ca 30% av akutbesöken i Sverige är onödiga och kunde hanterats på vårdcentral eller av 1177. Akuten är för livshotande tillstånd. Närakut (om det finns lokalt) är för akuta men icke-livshotande besvär.'},
{t:'Digital vård — Kry, Min Doktor, Doktor24',s:'Digitala vårdtjänster:\n✅ Tillgängliga 7 dagar/vecka\n✅ Vanligtvis ingen väntetid\n✅ Kostar samma patientavgift\n✅ Bra för: förkylning, urinvägsinfektion, recept\n\n❌ Passar inte: allvarliga symtom, undersökning krävs',
a:'Kry, Min Doktor, Doktor24 och Helsa ingår i Region Skånes vårdval. Du betalar samma patientavgift (ca 200-350 kr) som på en fysisk vårdcentral. Recept skickas direkt till valfritt apotek.'}
],
ex:{type:'build',title:'Din vårdplan',desc:'Vet hur du söker rätt vård vid rätt tillfälle.',
fields:[
{l:'Var är din närmaste vårdcentral?',ph:'T.ex. Drottninghög Vårdcentral, Helsingborg',hint:'Lista inbyggd i 1177.se → Hitta vård'},
{l:'Har du 1177-appen installerad?',ph:'Ja/Nej — om nej, ladda ner och logga in med BankID'},
{l:'Vad söker du digital vård för och vad inte?',ph:'T.ex. Förkylning → digital vård. Bröstsmärta → 112',ta:true},
{l:'Lista 3 situationer och rätt åtgärd',ph:'1. Halsont → Ring 1177\n2. Benfraktur → Akuten\n3. Recept → Digital vård',ta:true}
]},
quiz:[
{q:'Vad kostar det att ringa 1177?',o:['50 kr','100 kr','Gratis','Samma som akuten'],c:2},
{q:'Vad är 1177 bäst för?',o:['Livshotande nödlägen','Råd om symtom + boka vård','Endast recept','Tandvård'],c:1},
{q:'Vilket nummer ringer du vid livshotande nödläge?',o:['1177','113 13','112','116 000'],c:2},
{q:'Vad passar digital vård (Kry etc) för?',o:['Benfraktur','Förkylning och recept','Hjärtinfarkt','Psykossjukdom'],c:1}
],
pr:['Vilken vård behöver jag för symtom X?','Hur bokar jag tid på vårdcentral i Helsingborg?','Vad gäller för utländska medborgare och sjukvård i Sverige?']},

{id:'h12',icon:'🛡️',title:'Försäkringskassan & sjukpenning',sub:'Ekonomin när du inte kan jobba',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Vad gör Försäkringskassan?',s:'Försäkringskassan (FK) betalar ut:\n\n🤒 Sjukpenning — om du inte kan jobba\n👶 Föräldrapenning — barnledighet\n💊 Aktivitetsersättning — ung med funktionsnedsättning\n🦯 Handikappersättning\n🏠 Bostadsbidrag\n\nAllt söks via forsakringskassan.se',
a:'Försäkringskassan hanterar över 40 förmåner och stöd. Sjukpenning kräver ett läkarintyg från dag 8 (arbetsgivaren betalar dag 1-7). För egenföretagare gäller andra regler.'},
{t:'Sjukskrivning steg för steg',s:'Dag 1: Sjukanmäl dig till arbetsgivaren\nDag 1-7: Arbetsgivaren betalar (sjuklön 80%)\nDag 8: Läkarintyg krävs\nDag 8+: Ansök om sjukpenning hos FK\n\n⚠️ Karensdag = dag 1 dras 20% av dagslön',
a:'Sjukpenning är ca 80% av lönen upp till ett tak (ca 43 900 kr/mån 2026). Utan kollektivavtal kan du förlora mycket. Facket kan hjälpa vid tvist. FK:s beslut kan överklagas.'},
{t:'Föräldrapenning & VAB',s:'Föräldrapenning:\n✅ 480 dagar per barn\n✅ Ca 80% av lönen\n✅ Båda föräldrar har rätt\n\nVAB (Vård av barn):\n✅ Om barnet är sjukt\n✅ Anmäl till FK samma dag\n✅ Ca 80% av lönen',
a:'Föräldrapenning är en av världens mest generösa — 480 dagar. 90 dagar är "pappamånader" och kan ej överlåtas. Anmäl på Mina sidor på forsakringskassan.se eller appen.'}
],
ex:{type:'build',title:'Din FK-plan',desc:'Koll på rättigheter om du inte kan jobba.',
fields:[
{l:'Har du installerat Försäkringskassans app?',ph:'Ja/Nej — ladda ner och logga in med BankID'},
{l:'Vad händer om du blir sjuk dag 1?',ph:'T.ex. Ring arbetsgivaren, anmäl sjukdom, dag 1-7 = sjuklön...',ta:true},
{l:'Vilken ersättning är aktuell för dig just nu?',ph:'T.ex. Föräldrapenning, bostadsbidrag, aktivitetsersättning...'},
{l:'Har du frågor om din situation? (kolla forsakringskassan.se)',ph:'T.ex. Vad gäller vid deltidssjukskrivning?',hint:'forsakringskassan.se → Mina sidor'}
]},
quiz:[
{q:'Vad är en karensdag?',o:['En ledig dag','Dag 1 av sjukdom — 20% av dagslön dras','En sjukintygsdag','FK:s handläggningstid'],c:1},
{q:'Från vilken dag krävs läkarintyg?',o:['Dag 1','Dag 3','Dag 8','Dag 14'],c:2},
{q:'Hur många dagar föräldrapenning finns per barn?',o:['180','365','480','720'],c:2},
{q:'Vad heter FK:s app?',o:['Mina sidor','Min FK','Försäkringskassan','1177'],c:2}
],
pr:['Hur ansöker jag om sjukpenning?','Vad gäller föräldrapenning om jag inte haft jobb?','Hur överklagar jag ett FK-beslut?']},

{id:'h13',icon:'🧬',title:'Kropp & fysisk hälsa',sub:'Förstå din kropp — ta hand om den',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Förebyggande hälsa — screening & kontroller',s:'Gratis hälsokontroller du har rätt till:\n\n🔬 Cellprov (cervix) — var 3-7 år\n🫀 Blodtrycks­kontroll — vart 5:e år\n🩸 Blodsocker (diabetes) — vid riskfaktorer\n🏥 Mammografi — från 40 år\n\nBokas via din vårdcentral eller 1177.',
a:'Screening räddar liv — framför allt för cancer och hjärt-kärlsjukdom. Boka proaktivt även om du mår bra. Kostnadsfritt inom ramen för patientavgiften.'},
{t:'Värk, smärta & muskuloskelettala besvär',s:'Vanligaste orsaker till sjukskrivning:\n🦴 Ryggvärk\n🦷 Nackspänningar\n🦵 Knäproblem\n\nHjälper:\n✅ Rörelse (inte vila)\n✅ Ergonomi — rätt stol & skärm\n✅ Fysioterapeut — remiss via vårdcentral\n✅ Värme eller kyla\n\n❌ Sängliggande förvärrar ryggvärk',
a:'Ca 30% av alla sjukskrivningar beror på muskel- och ledbesvär. Fysioterapeut kan bokas direkt utan läkarremiss på de flesta vårdcentraler. Naprapater och kiropraktorer kostar ca 400-700 kr.'},
{t:'Könsspecifik hälsa & sexuell hälsa',s:'Kostnadsfritt i Sverige:\n✅ STI-testning (klamydia, HIV etc)\n✅ Preventivmedelsrådgivning\n✅ Gynekologisk hälsokontroll\n✅ Prostatakontroll\n\nSöks via:\n• Ungdomsmottagning (upp till 25 år)\n• Din vårdcentral\n• 1177.se → Hitta vård',
a:'STI-testning är gratis och konfidentiell. Klamydia är den vanligaste STI i Sverige. Ungdomsmottagningar är kostnadsfria upp till 25 år och erbjuder preventivmedel, samtal och tester.'}
],
ex:{type:'build',title:'Din hälsokontrollplan',desc:'Planera förebyggande hälsokontroller.',
fields:[
{l:'Senaste gången du var på hälsokontroll?',ph:'T.ex. Aldrig / Förra året / Vet inte'},
{l:'Vilka kontroller är aktuella för dig?',ph:'T.ex. Blodtryck, cellprov, blodsocker...',ta:true,hint:'Fråga din vårdcentral om du är osäker'},
{l:'Har du kroniska besvär att hantera?',ph:'T.ex. Ryggvärk — ska boka fysioterapeut'},
{l:'Ditt nästa steg',ph:'T.ex. Ringa 1177 och boka hälsokontroll',hint:'Gör det nu!'}
]},
quiz:[
{q:'Hur ofta rekommenderas cellprov?',o:['Varje år','Var 3-7 år','Var 10 år','En gång i livet'],c:1},
{q:'Vad hjälper mot ryggvärk?',o:['Ligga still','Rörelse och rätt ergonomi','Starka smärtstillande','Ingenting'],c:1},
{q:'Var testar du dig gratis för STI?',o:['Apoteket','Akuten','Ungdomsmottagningen eller vårdcentralen','Privat klinik'],c:2},
{q:'Kan du boka fysioterapeut utan läkarremiss?',o:['Nej','Ja, ofta direkt via vårdcentral','Bara via akuten','Bara privatpraktiker'],c:1}
],
pr:['Hur bokar jag hälsokontroll i Helsingborg?','Vad ingår i STI-testning?','Hur hittar jag en fysioterapeut via 1177?']},

{id:'h14',icon:'🆘',title:'Kris & psykisk ohälsa',sub:'Veta när och var du söker hjälp',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Skillnad ångest, depression och kris',s:'Ångest = oro och rädsla — framtidsfokus\nDepression = nedstämdhet, hopplöshet — nutidsfokus\nKris = reaktion på ett svårt livsevent\n\nAlla tre är vanliga och behandlingsbara.\n\nEtt vanligt år i Sverige:\n• 25-30% upplever ångest\n• 10-15% drabbas av depression',
a:'Psykisk ohälsa är en av de vanligaste folksjukdomarna. Stigmat minskar men är fortfarande en barriär. Tidigt stöd är dramatiskt mer effektivt än sen behandling.'},
{t:'Var söker du hjälp?',s:'Akut kris just nu:\n📞 112 — livshotande\n📞 116 123 — Mind självmordslinjen (dygnet runt)\n📞 1177 — råd om psykisk hälsa\n\nVanlig psykisk ohälsa:\n🏥 Din vårdcentral — remiss till psykolog\n💻 Stödlinjen.se — chatt & telefon\n🧠 BUP (under 18) / Psykiatri (vuxen)',
a:'Mind självmordslinjen (116 123) är gratis och anonym. Stödlinjen.se erbjuder kostnadsfri chatt. Vårdcentralen kan remittera till psykolog (psykologprogrammet, begränsat antal sessioner). Privat psykolog kostar ca 900-1 500 kr/session.'},
{t:'Hur stödjer du någon annan?',s:'Om någon nära dig mår dåligt:\n\n✅ Fråga direkt: "Hur mår du egentligen?"\n✅ Lyssna — utan att fixa\n✅ Normalisera att söka hjälp\n✅ Följ med till vårdcentralen om de vill\n✅ Håll kontakten efteråt\n\n❌ Säg inte: "Det är inte så farligt" eller "Tänk positivt"',
a:'Att fråga direkt om självmordstankar minskar NOT risken — det öppnar en dörr. Att lyssna utan att ge råd är ofta mer hjälpsamt än att lösa problemet. Närstående till psykisk sjuka har rätt till eget stöd via socialtjänsten.'}
],
ex:{type:'build',title:'Din krishjälpsplan',desc:'Veta exakt vad du gör om du eller någon nära mår dåligt.',
fields:[
{l:'Spara dessa nummer i telefonen nu',ph:'116 123 (Mind), 1177, 112',hint:'Gör det nu — det tar 30 sekunder'},
{l:'Vad är ditt första steg om du mår dåligt?',ph:'T.ex. Ringa 1177, prata med min vän X, boka tid på vårdcentralen...'},
{l:'Finns det någon du litar på att kontakta?',ph:'T.ex. Ja — min syster. Eller: Min handläggare på AF.'},
{l:'Känner du igen någon i din omgivning som kan behöva stöd?',ph:'T.ex. Ja — ska höra av mig till X den här veckan.',ta:true}
]},
quiz:[
{q:'Vilket nummer ringer du vid psykisk kris, dygnet runt, gratis?',o:['112','1177','116 123 — Minds självmordslinje','116 000'],c:2},
{q:'Vad ska du INTE säga till någon som mår dåligt?',o:['"Hur mår du egentligen?"','"Det är inte så farligt — tänk positivt"','"Vill du att jag följer med?"','"Jag är här för dig"'],c:1},
{q:'Kan du fråga direkt om självmordstankar?',o:['Nej — det ökar risken','Ja — det öppnar en dörr och minskar inte risken','Bara läkare får fråga','Bara i nödläge'],c:1},
{q:'Vad erbjuder Stödlinjen.se?',o:['Medicinska diagnoser','Gratis chatt & telefonstöd','Boka psykolog','Sjukintyg'],c:1}
],
pr:['Hur söker jag psykologhjälp i Helsingborg?','Vad gäller om jag behöver psykiatrin akut?','Hur pratar jag med någon som mår dåligt?']},

{id:'h15',icon:'💊',title:'Beroende & riskbruk',sub:'Tidiga signaler och var du får hjälp',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Vad är ett riskbruk?',s:'Riskbruk = en konsumtionsnivå som ökar risken för hälsoskador — utan att vara ett beroende.\n\nAlkohol riskbruk:\n🚹 Män: >14 standardglas/vecka ELLER >4/tillfälle\n🚺 Kvinnor: >9 standardglas/vecka ELLER >3/tillfälle\n\nEtt standardglas = 33cl öl, 15cl vin, 4cl sprit',
a:'Ca 800 000 svenskar har ett riskbruk av alkohol. Riskbruk är inte beroende — men ökar risken för lever-, hjärt- och cancersjukdomar, samt psykisk ohälsa och olyckor.'},
{t:'Andra beroenden',s:'Beroende kan gälla:\n🎰 Spelberoende — vanligare än tros\n📱 Skärmberoende (underhållning, social media)\n☕ Koffein (mildare — men påverkar sömn)\n💊 Receptbelagda läkemedel\n🚬 Nikotin\n\nGemensamt: svårt att sluta trots vilja och negativa konsekvenser.',
a:'Spelberoende drabbar ca 2% av befolkningen, fler bland unga. Stödlinjen för spel: 020-81 91 00. Alla beroenden är behandlingsbara — tidig hjälp ger bäst resultat.'},
{t:'Var får du hjälp?',s:'Gratis hjälp i Sverige:\n🏥 Beroendecentrum — kostnadsfritt\n📞 Alkohollinjen: 020-84 44 48\n📞 Sluta-röka-linjen: 020-84 00 00\n📞 Spelberoende: 020-81 91 00\n💻 Stödlinjen.se\n\nAnonym och kostnadsfri hjälp finns alltid.',
a:'Beroendevård är en del av hälso- och sjukvården i Region Skåne. Remiss via vårdcentral eller direkt kontakt med Beroendecentrum. AA och NA (självhjälpsgrupper) finns i de flesta städer.'}
],
ex:{type:'build',title:'Min hälsovana-analys',desc:'Ärlig reflektion över egna vanor.',
fields:[
{l:'Hur ser ditt alkohol/tobaksbruk ut just nu?',ph:'T.ex. Röker 10 cig/dag / dricker varje helg / inget alls'},
{l:'Finns det en vana du vill förändra?',ph:'T.ex. Minska skärmtid på kvällen, röka mindre...'},
{l:'Vilket stöd finns tillgängligt?',ph:'T.ex. Sluta-röka-linjen 020-84 00 00, Beroendecentrum Helsingborg'},
{l:'Ditt mål och en konkret förändring',ph:'T.ex. Röker max 5/dag nästa vecka — ringer Sluta-röka-linjen imorgon',hint:'Litet steg > inget steg'}
]},
quiz:[
{q:'Vad är riskbruk?',o:['Beroende','Konsumtionsnivå som ökar risken för skador','Att dricka en gång','Spritdrickande'],c:1},
{q:'Hur många standardglas är riskgränsen per vecka för kvinnor?',o:['Fler än 5','Fler än 9','Fler än 14','Fler än 20'],c:1},
{q:'Vilket nummer ringer du för hjälp med spelberoende?',o:['112','020-84 44 48','020-81 91 00','1177'],c:2},
{q:'Är beroendevård gratis i Sverige?',o:['Nej','Ja — via Beroendecentrum och hälso- och sjukvård','Bara för alkohol','Bara med remiss'],c:1}
],
pr:['Var finns Beroendecentrum i Helsingborg?','Hur hjälper jag en närstående med alkoholproblem?','Tips för att minska skärmtid?']},

{id:'h16',icon:'🤰',title:'Graviditet, förlossning & barnhälsa',sub:'Vård för hela familjen',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Mödravård & förlossning i Sverige',s:'Mödravård (MVC) är gratis och inkluderar:\n✅ Regelbundna kontroller\n✅ Ultraljud\n✅ Förlossningsförberedande kurs\n✅ Stöd från barnmorska\n\nBokas via din vårdcentral eller 1177.\nFörlossning är kostnadsfri.',
a:'Sverige har en av världens lägsta mödradödligheter. Barnmorskemottagningar finns i alla kommuner. Förlossningsvård ingår i det allmänna hälso- och sjukvårdssystemet utan kostnad för patienten.'},
{t:'Barnavårdscentral (BVC)',s:'BVC erbjuder GRATIS till alla barn 0-6 år:\n✅ Regelbundna hälsokontroller\n✅ Vaccinationsprogram\n✅ Stöd vid amning\n✅ Barnhälsokontroller\n✅ Föräldrastöd\n\nRegistrera ditt barn hos din lokala BVC via 1177.',
a:'BVC-programmet innehåller ca 20 besök under de första 6 åren. Vaccinationsprogrammet är gratis och rekommenderat. BVC-sköterskan är ofta den bästa kontaktpersonen för frågor om barnets hälsa och utveckling.'},
{t:'Föräldrapenning & föräldrasupport',s:'Som ny förälder har du rätt till:\n\n📋 Föräldrapenning (FK) — 480 dagar/barn\n🏠 Bostadsbidrag kan öka med barn\n👨‍👩‍👧 Barnbidrag — 1 250 kr/mån/barn\n🎓 Öppen förskola — gratis aktiviteter\n\nAllt samordnas via FK och kommunen.',
a:'Barnbidrag betalas ut automatiskt från FK månaden efter födseln. Flerbarnstillägg tillkommer från barn nr 2. Öppen förskola är en kostnadsfri verksamhet som erbjuder aktiviteter för föräldrar och barn 0-5 år.'}
],
ex:{type:'build',title:'Familjens hälsoplan',desc:'Koll på vård och stöd för din familj.',
fields:[
{l:'Har du eller väntar du barn? Beskriv situationen',ph:'T.ex. Gravid v. 20, har barn 2 år, planerar barn...'},
{l:'Vilka kontakter har du etablerat?',ph:'T.ex. BVC i Drottninghög, barnmorska på MVC Helsingborg'},
{l:'Vilka förmåner är aktuella för dig?',ph:'T.ex. Barnbidrag, föräldrapenning, bostadsbidrag...'},
{l:'Ditt nästa steg',ph:'T.ex. Boka BVC-tid, ansöka om barnbidrag på FK'}
]},
quiz:[
{q:'Vad kostar förlossningsvård i Sverige?',o:['Ca 5 000 kr','Ca 20 000 kr','Ingenting — gratis','Patientavgift per dag'],c:2},
{q:'Till vilken ålder erbjuder BVC gratis kontroller?',o:['1 år','3 år','6 år','18 år'],c:2},
{q:'Hur mycket är barnbidraget per barn och månad?',o:['500 kr','1 000 kr','1 250 kr','2 000 kr'],c:2},
{q:'Hur länge pågår föräldrapenningen?',o:['90 dagar','180 dagar','365 dagar','480 dagar per barn'],c:3}
],
pr:['Var anmäler jag till MVC i Helsingborg?','Vad ingår i BVC-programmet?','Hur ansöker jag om barnbidrag?']},

{id:'h17',icon:'♿',title:'Funktionsnedsättning & stöd',sub:'Rättigheter och hjälpmedel',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'LSS — Lagen om stöd och service',s:'LSS ger rätt till insatser för personer med varaktiga funktionsnedsättningar:\n\n✅ Personlig assistans\n✅ Ledsagarservice\n✅ Daglig verksamhet\n✅ Boende med stöd\n✅ Kontaktperson\n\nAnsöks via kommunens socialförvaltning — kostnadsfritt.',
a:'LSS gäller personer med autism, intellektuell funktionsnedsättning, förvärvad hjärnskada och andra stora funktionsnedsättningar. Bedömning sker av kommunen. Insatserna är kostnadsfria för den enskilde.'},
{t:'Hjälpmedel & rehabilitering',s:'Region Skåne erbjuder hjälpmedel:\n🦽 Rullstol & rullator\n👂 Hörapparat\n👁️ Synhjälpmedel\n🖥️ Tekniska hjälpmedel\n\nFysioterapi & arbetsterapi:\nVia remiss från vårdcentral, kostnadsfritt eller låg kostnad.',
a:'Hjälpmedel förskrivs av arbetsterapeut eller fysioterapeut. Kostnaden varierar — vissa är gratis, andra kostar en egenavgift. Arbetsterapeuten kan också hjälpa med bostadsanpassning.'},
{t:'Arbete med funktionsnedsättning',s:'Stöd vid arbete:\n✅ Lönebidrag (AF betalar del av lön)\n✅ SIUS-konsulent (stöd på arbetsplatsen)\n✅ Anpassad utrustning\n✅ Trygghetsanställning\n\nAF har specialister för arbetslivsinriktad rehabilitering.',
a:'Lönebidrag ger arbetsgivare ekonomiskt stöd för att anställa person med nedsatt arbetsförmåga. Trygghetsanställning är en subventionerad anställningsform för de som har svårt att etablera sig. SIUS = Supported Employment.'}
],
ex:{type:'build',title:'Mitt stödbehov',desc:'Kartlägg vilket stöd du har rätt till.',
fields:[
{l:'Har du en diagnosticerad funktionsnedsättning?',ph:'T.ex. ADHD, autism, hörselnedsättning, rörelsehinder...'},
{l:'Vilket stöd har du idag?',ph:'T.ex. Inga hjälpmedel, personlig assistent, anpassad arbetsplats...'},
{l:'Vad saknar du?',ph:'T.ex. Hörapparat, arbetsanpassning, SIUS-konsulent...'},
{l:'Vem kontaktar du för mer info?',ph:'T.ex. Min handläggare på AF, kommunens LSS-handläggare, 1177',hint:'Börja med din nuvarande kontakt'}
]},
quiz:[
{q:'Vad är LSS?',o:['En bidragsform','Lagen om stöd och service — rätt till insatser','En medicin','En försäkring'],c:1},
{q:'Vem förskriver hjälpmedel?',o:['Apoteket','Läkaren alltid','Arbetsterapeut eller fysioterapeut','FK'],c:2},
{q:'Vad är lönebidrag?',o:['Stöd till arbetstagare','Ekonomiskt stöd till arbetsgivare som anställer person med nedsatt arbetsförmåga','En bidragsform från FK','Sommarjobbs-bidrag'],c:1},
{q:'Vad är SIUS?',o:['En diagnos','Stöd och vägledning på arbetsplatsen','En försäkring','En myndighet'],c:1}
],
pr:['Vad har jag rätt till med diagnosen [X]?','Hur ansöker jag om LSS-insatser?','Hur söker jag lönebidrag via AF?']},

{id:'h18',icon:'🏃',title:'Friskvård & förmåner',sub:'Rörelse som kostar lite men ger mycket',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Friskvårdsbidrag — vad är det?',s:'Friskvårdsbidraget är en skattefri förmån från arbetsgivaren.\n\nVanligtvis:\n💰 500-5 000 kr/år\n✅ Gym, simhall, yoga, massage\n✅ Skogsmulle, dans, kampsport\n\nFör arbetslösa:\n• Ingen arbetsgivare = inget bidrag\n• Men kommunen kan ha billiga aktiviteter!',
a:'Friskvårdsbidragets maxbelopp är reglerat av Skatteverket. Arbetsgivaren bestämmer nivån. Vid anställning — fråga alltid om friskvårdsbidragets storlek. Det kan vara värt 1 000-5 000 kr/år.'},
{t:'Gratis & billiga sätt att röra sig',s:'Utan bidrag:\n🌲 Friluftsliv — helt gratis\n🚴 Cykel — transport + träning\n💪 Kroppsvikt-träning hemma\n🏊 Kommunens simhallar — billigare än gym\n📺 YouTube-träning — gratis\n🤝 Spontanidrott i parker\n\nHelsingborg: Padelbanor, utegym, Stadsbiblioteket = gratis!',
a:'WHO rekommenderar 150 min måttlig aktivitet per vecka. En promenad 30 min 5 dagar/vecka uppfyller detta. Outdoorträning och hemmaträning är jämförbara med gymträning för de flesta hälsomål.'},
{t:'Rörelse och jobbsök',s:'Jobbsök utan rörelse = svårare.\n\n🧠 30 min promenad ökar fokus 2-3 timmar\n😴 Rörelse förbättrar sömn\n😊 Endorfiner motverkar jobbsökets stress\n⚡ Energinivån ökar\n\nTips: Lägg in promenaden i schemat — inte som "om jag hinner".',
a:'Fysisk aktivitet är ett av de mest evidensbaserade sätten att hantera stress och depression. Att sätta en bestämd tid (ex: 9-9:30 varje dag) ökar följsamheten dramatiskt. Grupp-aktiviteter ger dessutom social kontakt.'}
],
ex:{type:'build',title:'Din rörelseplan',desc:'Konkret och realistisk rörelserutin.',
fields:[
{l:'Vilken rörelse gillar du?',ph:'T.ex. Promenader, cykling, simning, yoga, fotboll...'},
{l:'Hur många minuter/dag är realistiskt?',ph:'T.ex. 30 min promenad vardag — 5 min stretch kvällstid',hint:'150 min/vecka är WHO:s rekommendation'},
{l:'Gratis aktiviteter i Helsingborg du kan använda',ph:'T.ex. Stadsparken, utegym vid Pålsjöbaden, cykel till AF...'},
{l:'Din rörelserutin — tid och dag',ph:'T.ex. Måndag-fredag 9:00-9:30: promenad via Stadsparken',ta:true}
]},
quiz:[
{q:'Vad är friskvårdsbidraget?',o:['Ett bidrag från FK','Skattefri förmån från arbetsgivare för hälsofrämjande aktiviteter','Rabatt på gym','Subventionerat sjukkort'],c:1},
{q:'Hur mycket rörelse rekommenderar WHO per vecka?',o:['30 min','60 min','150 min','300 min'],c:2},
{q:'Hur länge ökar fokus efter en 30 min promenad?',o:['15 min','30 min','2-3 timmar','Ingen effekt'],c:2},
{q:'Vilken träning är GRATIS?',o:['Gym','Gympa med instruktör','Friluftsliv och hemmaträning','Simhall alltid'],c:2}
],
pr:['Vad finns det för gratis aktiviteter i Helsingborg?','Bygg ett träningsprogram för 15 min hemma.','Hur motiverar jag mig att röra mer under jobbsök?']},

{id:'h19',icon:'🌍',title:'Hälsa för nyanlända',sub:'Vård och rättigheter i Sverige',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Rätten till vård i Sverige',s:'I Sverige har du rätt till sjukvård oavsett bakgrund.\n\n✅ Asylsökande: akut vård + vård som inte kan vänta\n✅ EU-medborgare: sjukvård med EU-kort\n✅ Permanent uppehållstillstånd: full sjukvård\n✅ Papperslösa: akut vård och vård för barn\n\nVård söks via vårdcentralen eller 1177.',
a:'Asylsökande vuxna har rätt till omedelbart nödvändig vård, mödravård, abort och preventivmedel. Barn har rätt till samma vård som folkbokförda barn. Region Skåne följer nationella riktlinjer.'},
{t:'Tolkhjälp & kulturell kompetens',s:'Du har rätt att begära tolk vid vårddbesök — gratis!\n\n📞 Ring vårdcentralen i förväg och begär tolk\n📱 Telefontolk om ingen finns på plats\n💻 Digitala tolkars — via skärm\n\nDu behöver ALDRIG ta med familjen som tolk vid medicinska samtal.',
a:'Tolkhjälp är en lagstadgad rättighet i svensk sjukvård. Att använda familjemedlemmar som tolkar är olämpligt — det äventyrar sekretesskyddet och kan leda till felaktig information.'},
{t:'Hälsoundersökning för nyanlända',s:'Nyanlända erbjuds en kostnadsfri hälsoundersökning:\n\n✅ Allmän hälsostatus\n✅ Smittskyddsprover (tuberkulos, hepatit)\n✅ Vaccinationskontroll\n✅ Psykisk hälsa (traumascreen)\n✅ Tandvårdsremiss\n\nBokas via din kommun eller 1177.',
a:'Hälsoundersökning för nyanlända är frivillig men starkt rekommenderad. Den ger en samlad bild och kan fånga upp hälsoproblem som behöver behandlas. Speciellt viktig för dem som kommit från länder med bristfällig sjukvård.'}
],
ex:{type:'build',title:'Min hälsostatus i Sverige',desc:'Kartlägg din sjukvårdssituation.',
fields:[
{l:'Vilken rätt till vård har du i Sverige?',ph:'T.ex. Permanent uppehållstillstånd = full sjukvård',hint:'Osäker? Ring 1177'},
{l:'Har du genomfört hälsoundersökning?',ph:'Ja/Nej — om nej, kontakta din kommun eller 1177'},
{l:'Har du en namngiven läkare på en vårdcentral?',ph:'T.ex. Ja — Dr Svensson på Drottninghög VC'},
{l:'Finns det hälsofrågor du vill ta upp?',ph:'T.ex. Kronisk smärta, psykiskt mående, vaccin...',ta:true}
]},
quiz:[
{q:'Har asylsökande rätt till vård i Sverige?',o:['Nej','Ja — akut vård och vård som inte kan vänta','Bara om de betalar','Bara barn'],c:1},
{q:'Vem har rätt till gratis tolk vid sjukvård?',o:['Bara flyktingar','Alla som behöver — tolkhjälp är lagstadgad','Bara vid akutbesök','Ingen — det kostar'],c:1},
{q:'Vad inkluderar hälsoundersökning för nyanlända?',o:['Bara blodprov','Hälsostatus, smittskydd, vaccin, psykisk hälsa och tandvård','Bara psykisk hälsa','Bara fysisk hälsa'],c:1},
{q:'Vad bör du INTE göra vid medicinska samtal?',o:['Begära tolk','Ange alla symtom','Använda familjen som tolk','Ställa frågor'],c:2}
],
pr:['Vad har jag rätt till i sjukvården med [uppehållsstatus]?','Hur begär jag tolk vid mitt läkarbesök?','Var genomgår jag hälsoundersökning för nyanlända i Helsingborg?']},

{id:'h20',icon:'🧭',title:'Din hälsokompass',sub:'Sammanfattning & personlig hälsoplan',color:'#fb923c',bc:'rgba(251,146,60,.3)',bg:'rgba(251,146,60,.07)',
lessons:[
{t:'Hälsa är mer än att inte vara sjuk',s:'WHO:s definition:\n"Hälsa är ett tillstånd av fullständigt fysiskt, psykiskt och socialt välbefinnande."\n\nDina 4 pelare:\n🏃 Rörelse\n🧠 Mental hälsa\n🥗 Mat & sömn\n🤝 Socialt\n\nSvagaste pelaren påverkar alla andra.',
a:'Forskning visar att de fyra pelarna (rörelse, kost, sömn, socialt) är mer prediktiva för hälsa och livslängd än genetik. Beteendeförändringar tar i snitt 66 dagar att bli vanor.'},
{t:'Hälsa under ekonomisk stress',s:'Jobbsök, ekonomisk stress och ohälsa hänger ihop.\n\n💡 Prioritera:\n✅ Sömn — kostar inget\n✅ Promenader — kostar inget\n✅ Socialt stöd — kostar inget\n✅ Röka/dricka MINDRE — sparar pengar\n✅ Natur — kostar inget\n\nMindre pengarna du spenderar — desto mer du vilar.',
a:'Ekonomisk stress aktiverar samma stressrespons som fysisk fara. Kronisk ekonomisk stress ökar risken för hjärt-kärlsjukdom, depression och sömnstörningar. Gratis hälsoinsatser har starkt evidensbaserat stöd.'},
{t:'Nästa steg — dina prioriteringar',s:'Välj en sak från varje pelare:\n\n🏃 Rörelse: 20 min promenad/dag\n🧠 Mental: Ring en vän i veckan\n🥗 Mat: Laga mat hemma 5 dagar/vecka\n💤 Sömn: Sova & vakna samma tid\n🤝 Socialt: Ett socialt event/vecka\n\nSmå steg konsekvent > stora steg sporadiskt.',
a:'Beteendevetenskap: Att välja ett konkret beteende (tid, plats, vad) ökar genomförandet med 300%. "Jag ska röra mer" = svagt. "Jag promenerar 20 min kl 9 varje vardag i Stadsparken" = starkt.'}
],
ex:{type:'ai-chat',title:'Din personliga hälsoplan'},
quiz:[
{q:'Hur många dagar tar det att bygga en ny vana?',o:['7 dagar','21 dagar','66 dagar i snitt','365 dagar'],c:2},
{q:'Vad är WHO:s hälsodefinition?',o:['Att inte ha sjukdom','Fysiskt, psykiskt och socialt välbefinnande','Att träna regelbundet','Att äta hälsosamt'],c:1},
{q:'Vilken hälsopelare kostar absolut inget?',o:['Gym','Privatvård','Promenader och sömn','Kosttillskott'],c:2},
{q:'Vad ökar genomförandet av ett hälsobeteende mest?',o:['Stark motivation','Konkret plan med tid och plats','Dyrt gym-medlemskap','Att berätta för alla'],c:1}
],
pr:['Bygg en personlig hälsoplan för min situation.','Hur förbättrar jag sömnen med enkla medel?','Gratis hälsoaktiviteter i Helsingborg?']}
];

var EKONOMI=[
{id:'e1',icon:'💳',title:'Budget & vardagsekonomi',sub:'Koll på pengarna — varje månad',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Varför budget?',s:'Budget = du bestämmer vart pengarna går.\n\nIngen budget = pengarna bestämmer själva.\n\nEnkel metod — 50/30/20:\n• 50% → Behov (hyra, mat, räkningar)\n• 30% → Vill ha (nöje, kläder, kaffe)\n• 20% → Spara & skulder\n\nAnpassa efter din situation!',a:'En budget behöver inte vara komplicerad. Grundprincipen: vet vad som kommer in, vet vad som går ut, ta beslut om resten. Digitala verktyg: Saldokollen (gratis app), bankens budget-funktion, enkelt Excel-ark.'},
{t:'Fasta vs rörliga kostnader',s:'Fasta kostnader (samma varje mån):\n🏠 Hyra\n📱 Telefon\n💡 El & försäkringar\n\nRörliga kostnader (varierar):\n🛒 Mat\n🚌 Transport\n🎬 Nöje\n\nFasta är svåra att påverka.\nRörliga kan du styra direkt.',a:'Genomsnittlig hushållsekonomi i Sverige: hyra ca 30-40% av inkomst, mat 15-20%, transport 10-15%. Rörliga kostnader är där beteendeförändringar ger direkt effekt. En kaffemaskin hemma = 1 500-3 000 kr/år sparat vs köpkaffe.'},
{t:'Kom igång på 10 minuter',s:'1. Räkna vad som kommer in (inkomst/mån)\n2. Lista alla fasta kostnader\n3. Kolla kontoutdrag — vad gick pengarna till?\n4. Sätt gränser per kategori\n5. Följ upp en gång i veckan (5 min)\n\nVerktyg: bankens app, Google Sheets, anteckningsbok.',a:'Saldoappen hämtar transaktioner automatiskt och kategoriserar dem. De flesta banker har inbyggd budgetfunktion. En pappersbudget med penna fungerar lika bra — det viktiga är att göra det, inte vilken teknik du använder.'}
],
ex:{type:'build',title:'Din månadsbudget',desc:'Räkna ut vad du har kvar när räkningarna är betalda.',
fields:[
{l:'Total inkomst per månad (efter skatt)',ph:'T.ex. Försörjningsstöd 8 000 kr, A-kassa 12 000 kr...'},
{l:'Fasta kostnader (hyra, el, telefon, försäkring...)',ph:'T.ex. Hyra 5 500 + El 600 + Telefon 350 = 6 450 kr'},
{l:'Rörliga kostnader (mat, transport, nöje...)',ph:'T.ex. Mat 2 500 + SL 650 + Övrigt 800 = 3 950 kr'},
{l:'Vad har du kvar? Vad vill du göra med det?',ph:'T.ex. 600 kr kvar — sparar 300 till buffert, 300 till nöje',hint:'Även liten buffert är guld!'}
]},
quiz:[
{q:'Vad betyder 50/30/20-regeln?',o:['50% spara, 30% nöje, 20% mat','50% behov, 30% vill ha, 20% spara','50% mat, 30% hyra, 20% nöje','50% nöje, 30% spara, 20% behov'],c:1},
{q:'Vilka kostnader är lättast att påverka direkt?',o:['Hyra och el','Rörliga — mat, nöje, transport','Försäkringar','Telefon-abonnemang'],c:1},
{q:'Hur ofta bör du följa upp din budget?',o:['En gång per år','En gång per vecka (5 min)','Aldrig — sätts en gång','Varje dag'],c:1},
{q:'Vad sparar du ungefär per år om du tar kaffemaskin hemma?',o:['100 kr','1 500-3 000 kr','10 000 kr','500 kr'],c:1}
],
pr:['Bygg en månadsbudget för mig med: inkomst X, hyra Y.','Vad kan jag skära ner på med 500 kr/mån?','Hur bygger jag en nödfond på låg inkomst?']},

{id:'e2',icon:'🏠',title:'Hyra & bostad',sub:'Dina rättigheter som hyresgäst',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Hyreskontrakt — vad gäller?',s:'När du skriver kontrakt ska du kontrollera:\n\n✅ Hyresbeloppet\n✅ Inkluderat (el, vatten, internet?)\n✅ Uppsägningstid (vanligt: 3 mån)\n✅ Deposition (max 3 månaders hyra)\n✅ Vad du ansvarar för\n\nSpara alltid kvitto på depositionsinbetalning!',a:'Hyreslagen (12 kap JB) skyddar hyresgäster i Sverige. Hyresvärden kan inte höja hyran godtyckligt — Hyresgästföreningens förhandlingsresultat gäller. Deposition ska återbetalas inom rimlig tid (normalt 1-2 mån) med specificerade avdrag.'},
{t:'Bostadsbidrag',s:'Låg inkomst + hyra = du kan ha rätt till bostadsbidrag!\n\nKan ges till:\n• Barnfamiljer\n• Ungdomar 18-29 år\n• Ensamstående med barn\n\nSöks via: Försäkringskassan (FK)\nfk.se → Bostadsbidrag\n\nBeloppet beror på hyra, inkomst och familjesituation.',a:'Bostadsbidrag är behovsprövat och söks av hushållet. Beloppet minskar med ökad inkomst. Det är ett av de mest underutnyttjade bidragen — många som har rätt söker inte. Retroaktiv ansökan möjlig 2 månader bakåt.'},
{t:'Problem med hyresvärden',s:'Om hyresvärden inte sköter sig:\n\n🔧 Underhåll: Anmäl skriftligt → vänta 14 dagar → kontakta Hyresnämnden\n💰 Omotiverat hög hyra: Prövning via Hyresnämnden\n🚪 Olaglig vräkning: Ring polisen + Hyresgästföreningen\n\nHyresgästföreningen Helsingborg:\n042-13 17 00',a:'Hyresnämnden (hyresnamnden.se) prövar tvister gratis. Vräkning kräver domstolsbeslut — hyresvärden kan aldrig själv vräka. Hyresgästföreningen erbjuder juridisk rådgivning till alla — även icke-medlemmar vid akuta situationer.'}
],
ex:{type:'build',title:'Din bostadssituation',desc:'Koll på din bostad och rättigheter.',
fields:[
{l:'Hur bor du idag?',ph:'T.ex. Hyresrätt förstahand, andrahand, hos familj, kompisar...'},
{l:'Vad betalar du i hyra? Vad ingår?',ph:'T.ex. 5 500 kr/mån, el separat, internet ingår'},
{l:'Har du koll på din uppsägningstid?',ph:'T.ex. Ja — 3 månader / Nej — behöver kolla kontraktet'},
{l:'Kan du ha rätt till bostadsbidrag? (kolla fk.se)',ph:'T.ex. Ska kolla — är 23 år och har låg inkomst',hint:'FK.se → Bostadsbidrag → Beräkna'}
]},
quiz:[
{q:'Hur stor deposition får hyresvärden maximalt ta?',o:['1 månads hyra','3 månaders hyra','6 månaders hyra','Inga regler'],c:1},
{q:'Var söker du bostadsbidrag?',o:['Kommunen','Försäkringskassan (fk.se)','AF','Hyresnämnden'],c:1},
{q:'Vad gör du om hyresvärden inte fixar fel i lägenheten?',o:['Acceptera det','Anmäl skriftligt → vänta 14 dagar → kontakta Hyresnämnden','Sluta betala hyra','Ring polisen direkt'],c:1},
{q:'Hur lång uppsägningstid är vanligast för hyresrätt?',o:['1 månad','3 månader','6 månader','12 månader'],c:1}
],
pr:['Har jag rätt till bostadsbidrag med inkomst X och hyra Y?','Vad gör jag om hyresvärden vill höja hyran?','Hur hittar jag lägenhet i Helsingborg utan kö?']},

{id:'e3',icon:'🆘',title:'Ekonomiskt bistånd & bidrag',sub:'Hjälp finns — ta reda på vad du har rätt till',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Ekonomiskt bistånd (försörjningsstöd)',s:'Om du inte kan försörja dig själv har du rätt till ekonomiskt bistånd från kommunen.\n\nVad täcks?\n✅ Mat\n✅ Hyra\n✅ El\n✅ Kläder\n✅ Hemförsäkring\n\nDu ansöker hos: Socialkontoret i Helsingborg\n\nDu måste stå till arbetsmarknadens förfogande!',a:'Ekonomiskt bistånd är behovsprövat och individbaserat. Riksnormen för 2024: ensamstående ca 4 700 kr/mån + hyra. Du måste söka alla andra bidrag du har rätt till. Krav: aktivt jobbsök, delta i insatser, inga omotiverade tillgångar.'},
{t:'Bidrag du kanske inte vet om',s:'📦 Barnbidrag: 1 250 kr/barn/mån (automatiskt)\n🏠 Bostadsbidrag: FK, inkomstbaserat\n👶 Föräldrapenning: 90% av lön (max 20 år)\n📚 Studiestöd (CSN): 11 300 kr/mån heltid\n🧑 Aktivitetsstöd: ca 80% av a-kassa vid AF-program\n♿ Assistansersättning: för funktionsnedsättning\n🎂 Äldreförsörjningsstöd: 65+ med låg pension',a:'Sverige har ca 50 olika bidragsformer. Många undersöker inte vad de har rätt till. Kollas via: fk.se (Försäkringskassan), af.se, kommunens socialtjänst, och 1177.se. Ekonomirådgivning gratis via kommunen (skuldsanering och budgetrådgivning).'},
{t:'Skulder & skuldsanering',s:'Har du skulder du inte kan betala?\n\nSteg 1: Budget — vad har du råd att betala?\nSteg 2: Kontakta borgenären — ofta går avbetalningsplan\nSteg 3: Kronofogden — bestrida felaktiga krav\nSteg 4: Skuldsanering — via ansökan till KFM\n\nKronofogden har gratis budget-rådgivning!\nKommunens budget-rådgivare: gratis!',a:'Skuldsanering ger skuldfrihet efter 5 år (3 år vid allvarliga omständigheter). Kräver att man har skulder man inte kan betala på överskådlig tid. Ansökan via Kronofogdemyndigheten. Konsumentverkets Hallå Konsument: 0771-42 33 00.'}
],
ex:{type:'build',title:'Din bidragsöversikt',desc:'Koll på vilka bidrag du kan ha rätt till.',
fields:[
{l:'Vilka bidrag får du idag?',ph:'T.ex. A-kassa 12 000 kr/mån, barnbidrag 1 250 kr...'},
{l:'Vilka bidrag tror du att du KAN ha rätt till? (kolla fk.se)',ph:'T.ex. Kanske bostadsbidrag — ska kolla'},
{l:'Har du skulder som stressar dig?',ph:'T.ex. Ja — kreditkort 15 000 kr / Nej'},
{l:'Ditt nästa steg kring ekonomin',ph:'T.ex. Bokar möte med budget-rådgivaren på kommunen',hint:'Kommunal budget-rådgivning är gratis!'}
]},
quiz:[
{q:'Vem ansöker du ekonomiskt bistånd hos?',o:['AF','FK','Kommunens socialkontor','Skattemyndigheten'],c:2},
{q:'Hur mycket är barnbidrag per barn och månad?',o:['500 kr','1 250 kr','2 000 kr','750 kr'],c:1},
{q:'Vad kostar kommunal budget-rådgivning?',o:['500 kr/timme','Gratis','1 000 kr','Beror på kommunen'],c:1},
{q:'Hur länge tar skuldsanering?',o:['1 år','5 år (3 vid allvarliga omständigheter)','10 år','Livstid'],c:1}
],
pr:['Vilka bidrag har ensamstående med 1 barn i Helsingborg rätt till?','Hur ansöker jag om skuldsanering?','Vad är riksnormen för försörjningsstöd 2026?']},

{id:'e4',icon:'📱',title:'Smarta abonnemang & avtal',sub:'Sluta betala för mycket',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Mobilavtal — sluta överbetala',s:'Genomsnittlig svensk betalar 250-450 kr/mån för mobil.\n\nBilligare alternativ:\n• Comviq, Vimla, Hallon: från 49-99 kr/mån\n• Kontantkort om du ringer lite\n• Dela mobildata med familj\n\nKolla jämförelsesidor:\n• prisjakt.nu\n• mobilabonnemang.se\n\nByta är gratis — numret följer med!',a:'Mobilbranschen är en av de med mest prisvariationer. Nätoperatörerna (Telia, Tele2, Tre, Telenor) säljer kapacitet till MVNO-operatörer (Comviq, Vimla etc.) som säljer billigare. Samma nät — lägre pris. Bindningstid bör undvikas.'},
{t:'Streaming & prenumerationer',s:'Räkna ihop dina prenumerationer:\n\n📺 Netflix, HBO, Disney+\n🎵 Spotify, Apple Music\n📰 Tidningar\n🎮 Spelabonnemang\n\nEnkelt sätt att hitta allt:\n→ Kolla kontoutdrag från senaste 2 månader\n\nTips: Dela med familj, pausa tillfälligt,\nbyta månadsvis istället för årsvis.',a:'Den genomsnittliga hushållet har 4-5 streaming-abonnemang och betalar ca 400-700 kr/mån. Biblioteket erbjuder gratis: e-böcker (Libby), tidningar (PressReader), film (Filmarkivet). Spotify har studentrabatt (halva priset) och familjepaket.'},
{t:'El & försäkringar — jämför!',s:'El:\n• Rörligt vs fast pris — jämför på elpriskollen.se\n• Byte kostar inget\n• Kollektivt byte via din förening\n\nHemförsäkring:\n• Obligatorisk om du hyr\n• Jämför på insplanet.se eller direktförsäkring.se\n• Kostnad: ca 150-400 kr/mån\n• Höj självrisken = lägre premie',a:'El-prisjämförelse: Energimarknadsinspektionens sajt elpriskollen.se är gratis och oberoende. Hemförsäkring täcker brand, inbrott, vattenskada och ansvar — viktig vid hyresrätt. Höj grundsjälvrisken till 5 000 kr om du sällan skadar saker.'}
],
ex:{type:'sort',title:'Behov eller lyx?',desc:'Sortera dina kostnader — vad kan du minska?',
catA:'✅ Behov (svårt att ta bort)',catB:'✂️ Kan minska eller ta bort',
items:[{l:'Hyra',c:'A'},{l:'Netflix + HBO + Disney+',c:'B'},{l:'Mat och el',c:'A'},{l:'3 streaming-tjänster parallellt',c:'B'},{l:'Mobiltelefon (bas)',c:'A'},{l:'Köpkaffe varje dag',c:'B'},{l:'Hemförsäkring',c:'A'},{l:'Gym-kort du inte använder',c:'B'}]},
quiz:[
{q:'Vad kostar billigaste mobilabonnemang ungefär?',o:['200 kr/mån','49-99 kr/mån','150 kr/mån','Minst 300 kr/mån'],c:1},
{q:'Var jämför du el-priser?',o:['Hos elleverantören','elpriskollen.se (gratis & oberoende)','Prisjakt','Google'],c:1},
{q:'Vad erbjuder biblioteket gratis?',o:['Ingenting digitalt','E-böcker, tidningar och film via apper','Bara fysiska böcker','Spotify'],c:1},
{q:'Vad täcker hemförsäkringen?',o:['Bara brand','Brand, inbrott, vattenskada och ansvar','Bara stöld','Bara din bil'],c:1}
],
pr:['Hitta billigaste mobilabonnemang för mitt behov.','Vad kan jag skära i min budget med 500 kr/mån?','Jämför hemförsäkringar för hyresrätt.']},

{id:'e5',icon:'🐷',title:'Spara & buffert',sub:'Trygghet börjar med 1000 kr',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Varför buffert?',s:'En buffert är pengar du ALDRIG rör — tills du MÅSTE.\n\nVad bufferten räddar dig från:\n🚗 Oväntad bilreparation\n🦷 Akut tandläkare\n🏠 Tvättmaskin går sönder\n📱 Mobilen tappas\n\nMål 1: 1 000 kr\nMål 2: 10 000 kr\nMål 3: 3 månaders levnadskostnader',a:'Finansforskare visar att ett hushåll med 10 000 kr i buffert har dramatiskt lägre sannolikhet att hamna i skuldfällan vid oförutsedda händelser. Buffert = förhindrar att en liten kris blir en stor.'},
{t:'Spara på låg inkomst',s:'Det spelar ingen roll om du sparar 100 kr/mån.\n\nStrategier:\n• Automatisk överföring på lönedagen\n• Spara myntet (avrunda till jämnt)\n• 52-veckors-utmaningen (1 kr vecka 1, 2 kr vecka 2...)\n• Sälj saker du inte behöver (Blocket)\n\n100 kr/mån = 1 200 kr om ett år',a:'Beteendeekonomi: automatiska sparöverföringar (pay yourself first) är den mest effektiva sparmetoden. Hjärnan behandlar pengar som gått till sparande annorlunda än kvar-pengar. Spara innan du konsumerar.'},
{t:'Ränta på ränta — tidens kraft',s:'Om du sparar 500 kr/mån i 30 år med 5% ränta:\n\n→ Totalt inbetalat: 180 000 kr\n→ Totalt sparat: ~416 000 kr!\n\nTiden är den viktigaste faktorn.\n\nBörja idag — inte när du har "råd".\n\nKontoformer:\n• Sparkonto: låg ränta, alltid tillgängligt\n• ISK: för fonder och aktier (schablonbeskattning)',a:'Compound interest (ränta på ränta) är Einsteins "åttonde underverk". Skillnaden mellan att börja spara 25 vs 35 är astronomisk. ISK (investeringssparkonto) är skattemässigt fördelaktigt för långsiktigt fondsparande — betalas schablonskatt på ~0.9% av värdet istället för 30% på vinst.'}
],
ex:{type:'build',title:'Din sparplan',desc:'Starta din buffert — oavsett hur liten.',
fields:[
{l:'Har du en buffert idag? Hur stor?',ph:'T.ex. Nej, 0 kr / Ja, ca 2 000 kr'},
{l:'Hur mycket kan du spara per månad? (var ärlig)',ph:'T.ex. 200 kr — det är vad jag kan just nu',hint:'100 kr är bättre än 0!'},
{l:'Var ska du sätta buffert-pengarna?',ph:'T.ex. Separat sparkonto på Klarna eller Avanza',hint:'Avanza och Klarna har höga räntor på sparkonton'},
{l:'Ditt sparande-startdatum',ph:'T.ex. Sätter upp automatisk överföring på måndag',hint:'Gör det nu — framtida du tackar dig!'}
]},
quiz:[
{q:'Vad är syftet med en buffert?',o:['Investera och tjäna pengar','Ha pengar för oförutsedda utgifter','Unna sig något','Låna ut till andra'],c:1},
{q:'Vilket är det effektivaste sättet att spara?',o:['Spara det som blir över','Automatisk överföring på lönedagen','Spara kontanter hemma','Investera i aktier direkt'],c:1},
{q:'Vad händer med 500 kr/mån i 30 år med 5% avkastning?',o:['Ca 180 000 kr (inbetalat)','Ca 416 000 kr (ränta på ränta!)','Ca 250 000 kr','Ca 600 000 kr'],c:1},
{q:'Vad är en ISK (investeringssparkonto)?',o:['Ett vanligt sparkonto','Konto med schablonbeskattning — bra för fonder','Ett låneprodukt','Ett konto utan ränta'],c:1}
],
pr:['Hur startar jag ett ISK-konto?','Beräkna ränta-på-ränta för mig: X kr/mån, Y år, Z%.','Bästa sparkonton med hög ränta 2026?']},

{id:'e6',icon:'📊',title:'Skatt & deklaration',sub:'Förstå vad du betalar och vad du kan få tillbaka',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Hur skatten fungerar',s:'I Sverige betalar du skatt på inkomster.\n\n• Kommunalskatt: ca 30-33% (Helsingborg: 30,84%)\n• Statlig skatt: +20% över 598 500 kr/år\n• Arbetsgivaren drar skatten direkt (PAYE)\n\nDu deklarerar varje år (april) — men mycket är förifyllt!',a:'Det svenska PAYE-systemet (Pay As You Earn) innebär att skatten dras vid källan. Skatteverket förifyllt deklarationen med uppgifter från arbetsgivare och banker. De flesta behöver bara kontrollera och godkänna — tar 5 minuter via BankID.'},
{t:'Deklarationen — steg för steg',s:'Varje år: April–maj\n\n1. Logga in på skatteverket.se med BankID\n2. Kontrollera förifyllda uppgifter\n3. Lägg till avdrag (ROT, RUT, resor)\n4. Godkänn\n5. Vänta på skatteåterbäring (juni–aug)\n\nBetala för lite = restskatt (påminnelse i september)',a:'Vanliga avdrag: tjänsteresor (om arbetsgivaren inte ersätter), dubbelt boende, hemresor, facklitteratur. ROT och RUT-avdrag ges för hushållsnära tjänster (30% av arbetskostnad). Skatteverket har gratis skatteupplysning: 0771-567 567.'},
{t:'Skatteåterbäring — vad gör du med den?',s:'De flesta får tillbaka pengar i juni!\n\n✅ Bra användning:\n• Buffert\n• Amortera skuld\n• Spara till nödfond\n\n⚠️ Undvik:\n• Spendera allt på en gång\n• "Unna sig" utan plan\n\nÅterbäringen är dina egna pengar — inte "gratis".',a:'Ca 7 av 10 svenska hushåll får skatteåterbäring, genomsnitt ca 6 000-8 000 kr. Psykologiskt upplevs det som en gåva trots att det är förbetald skatt. Att sätta återbäringen direkt till buffert/skuld är ett av de bästa finansiella besluten ett hushåll kan ta.'}
],
ex:{type:'build',title:'Din deklarationsplan',desc:'Förbered dig inför nästa deklaration.',
fields:[
{l:'Har du deklarerat i Sverige? Hur gick det?',ph:'T.ex. Nej — ny i Sverige / Ja, enkelt med BankID'},
{l:'Fick du skatteåterbäring eller restskatt förra året?',ph:'T.ex. Fick 3 200 kr tillbaka / Fick restskatt på 800 kr'},
{l:'Har du avdrag du kanske missar?',ph:'T.ex. Pendlar långt, fackmedlem, hemresor...',hint:'Skatteverket.se → Avdrag och förmåner'},
{l:'Vad gör du med eventuell skatteåterbäring?',ph:'T.ex. Direkt till buffert-kontot',hint:'Bestäm nu — annars spenderas det!'}
]},
quiz:[
{q:'Hur hög är kommunalskatten i Helsingborg ungefär?',o:['20%','30,84%','40%','25%'],c:1},
{q:'När ska du deklarera?',o:['Januari','April-maj','Oktober','Varje månad'],c:1},
{q:'Vad är ett bra sätt att använda skatteåterbäringen?',o:['Unna sig direkt','Buffert eller amortera skuld','Investera i aktier','Spendera på semester'],c:1},
{q:'Vad är ROT-avdrag?',o:['Rabatt på mat','30% avdrag på hushållsnära tjänster (bygg & renovering)','Avdrag för cykel','Gratis sjukvård'],c:1}
],
pr:['Förklara den svenska skattedeklarationen för mig.','Vilka avdrag kan jag göra som jobbsökare?','Hur ändrar jag min skattejämkning?']},

{id:'e7',icon:'🚌',title:'Transport & kollektivtrafik',sub:'Ta dig dit du behöver — billigt',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Skånetrafikens kort & rabatter',s:'Skånetrafiken har flera biljettalternativ:\n\n🎫 Periodbiljett: billigast om du reser dagligen\n📱 Digital biljett i app: 10% billigare\n👶 Barn under 7: gratis\n📚 Ungdomsrabatt: upp till 20 år\n🧓 65+: rabatterat\n\nHjälpmedelsresor: om du har funktionsnedsättning',a:'Skånetrafikens månadskort kostar ca 940-1 100 kr beroende på zon. Jämfört med bil (ca 4 000-6 000 kr/mån inkl. försäkring, drivmedel, parkering) är kollektivt dramatiskt billigare. Cykel som komplement till buss/tåg minskar kostnaden ytterligare.'},
{t:'Gratis och billig transport',s:'Alternativ till dyr transport:\n\n🚲 Cykel: gratis (köp begagnad för 500 kr)\n🚶 Promenera om möjligt (+ hälsa)\n🤝 Samåkning: skjuts.se, BlaBlaCar\n🚗 Hyrbil vid enstaka behov (Sunfleet)\n📱 Elsparkcyklar: Tier, Voi (per resa)\n\nHelsingborg → Köpenhamn: Öresundsbron med tåg',a:'Pendelbåten Helsingborg-Helsingör kostar ca 60 kr tur/retur och tar 20 min. Öresundstågkortet ger rabatt för regelbundna pendlare. Samåkning via Skjuts.se är nästan gratis och minskar miljöpåverkan.'},
{t:'Bil — äga, leasa eller avstå?',s:'Genomsnittlig bil i Sverige kostar:\n💰 Ca 4 000-8 000 kr/mån totalt:\n• Lån/leasing\n• Försäkring (1 500-3 000 kr)\n• Bensin/el\n• Service & reparationer\n• Parkering\n\nÄr bilen NÖDVÄNDIG eller bara bekväm?\n→ Kan du klara utan? Prova en månad!',a:'Bil är ofta den dyraste löpande kostnaden efter hyra. Leasing ger förutsägbara kostnader men ingen äganderätt. Om bilen krävs för jobbet: kolla om arbetsgivaren betalar milersättning. Elbilar har lägre driftkostnad men högre inköpspris.'}
],
ex:{type:'build',title:'Din resplan',desc:'Optimera din transport och spara pengar.',
fields:[
{l:'Hur tar du dig runt idag?',ph:'T.ex. Buss + cykel, bil, promenad...'},
{l:'Vad betalar du för transport per månad?',ph:'T.ex. Månadskort Skånetrafiken 940 kr + cykelreparation 50 kr'},
{l:'Kan du minska transportkostnaden? Hur?',ph:'T.ex. Cykla till stationen istället för ta taxi',hint:'Varje 100 kr sparad är 1200 kr/år'},
{l:'Behöver du bil? Varför / varför inte?',ph:'T.ex. Nej — bussen räcker / Ja — jobbet är inte kollektivt'}
]},
quiz:[
{q:'Hur mycket billigare är digital biljett i Skånetrafikens app?',o:['5%','10%','20%','Ingen rabatt'],c:1},
{q:'Vad kostar Helsingborg–Helsingör med pendelbåten ungefär?',o:['20 kr','60 kr tur/retur','200 kr','100 kr'],c:1},
{q:'Vad kostar en genomsnittlig bil per månad totalt?',o:['1 000-2 000 kr','4 000-8 000 kr','500-1 000 kr','10 000+ kr'],c:1},
{q:'Var hittar du samåknings-möjligheter?',o:['Platsbanken','Skjuts.se och BlaBlaCar','LinkedIn','AF'],c:1}
],
pr:['Billigaste sättet att pendla Helsingborg-Malmö?','Kan jag ta bil till Danmark med färjan?','Hur ansöker jag om färdtjänst i Helsingborg?']},

{id:'e8',icon:'🔐',title:'Digital ekonomi & säkerhet',sub:'Skydda dina pengar online',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Bedrägerier — se upp!',s:'Vanligaste bedrägerierna mot privatpersoner:\n\n📱 SMS-bluffar ("paket väntar — betala")\n📧 Phishing-mail (falsk bank/myndighet)\n📞 Vishing (telefonbluffar)\n💻 Falska jobbannonser (betala för utbildning)\n💰 Romansbedrägeri\n\nGrundregel: INGEN myndighet ber dig betala via presentkort!',a:'Bedrägerier kostar svenska hushåll ca 1 miljard kr/år. Skatteverket, Kronofogden och banker skickar aldrig länkar via SMS och ber dig aldrig bekräfta BankID utan att du själv initierat det. Vid minsta tvivel — lägg på och ring officiellt nummer.'},
{t:'BankID & digital säkerhet',s:'BankID skyddar du genom:\n\n✅ Dela aldrig din säkerhetskod\n✅ Godkänn ALDRIG BankID du inte initierat\n✅ Ha separat stark lösenord per tjänst\n✅ Aktivera tvåfaktorautentisering\n✅ Uppdatera mobilen regelbundet\n\n⚠️ Om du misstänker bedrägeri:\nRing din bank OMEDELBART',a:'BankID-kapning är vanligaste attackvektorn. Bluffaren ringer, låtsas vara bank/polis, ber dig "verifiera" via BankID — men skapar faktiskt transaktion. Regel: Avvisar du spontant kontakt = alltid rätt. Inga banker ber om BankID-kod via telefon.'},
{t:'Swish, Klarna & köp nu betala sen',s:'Swish:\n• Skicka bara till folk du känner\n• Kontrollera nummer — det kan inte ångras!\n\nKlarna / "Köp nu betala sen":\n• Är ett lån — inte gratis\n• Glömmer du → skuld → kronofogden\n• Farligt vid dålig budgetkontroll\n\n✅ Betala med kort eller direktbetalning\nif you can — undvik faktura-lösningar',a:'Klarna har 150 miljoner användare globalt men skapar också skuldsättning. "Köp nu betala sen" aktiverar överkonsumtion (studier visar 40% högre köpbelopp). Ränta vid sen betalning kan vara hög. Håll koll på dina fakturor i Klarna-appen.'}
],
ex:{type:'sort',title:'Säkert eller osäkert?',desc:'Sortera beteendena — vad är okej och vad är farligt?',
catA:'✅ Säkert',catB:'🚨 Osäkert — undvik!',
items:[{l:'Godkänna BankID du inte initierat',c:'B'},{l:'Betala räkning via bankens egna app',c:'A'},{l:'Klicka på SMS-länk om paket',c:'B'},{l:'Swisha bara till folk du känner',c:'A'},{l:'Ge bort BankID-koden per telefon',c:'B'},{l:'Kontrollera avsändarens e-postadress',c:'A'},{l:'"Köp nu betala sen" utan koll på fakturor',c:'B'},{l:'Tvåfaktorautentisering på alla konton',c:'A'}]},
quiz:[
{q:'Vad skickar ALDRIG en myndighet via SMS?',o:['Information','Betalningslänkar (det är alltid bedrägeri)','Kallelser','Bekräftelser'],c:1},
{q:'Vad gör du om BankID-appen poppar upp utan att du initierat?',o:['Godkänn — säkert','Avvisa alltid — ring din bank','Vänta och se','Godkänn om det ser officiellt ut'],c:1},
{q:'Varför är "köp nu betala sen" riskabelt?',o:['Det är det inte — helt säkert','Det är ett lån som kan leda till skuld om du glömmer','Bara för under 18','Tekniska problem'],c:1},
{q:'Om du misstänker bedrägeri — vad gör du?',o:['Vänta och se','Ring din bank OMEDELBART','Anmäl till polisen nästa vecka','Ignorera det'],c:1}
],
pr:['Hur skyddar jag mig mot bedrägerier?','Vad gör jag om jag blivit av med pengar via bedrägeri?','Är detta SMS på riktigt eller bluff?']},

{id:'e9',icon:'🎓',title:'Ekonomi för unga vuxna',sub:'Det de inte lärde dig i skolan',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Betalningsanmärkningar — undvik dem!',s:'En betalningsanmärkning innebär att du inte betalat en skuld i tid.\n\nKonsekvenser:\n❌ Svårt att hyra lägenhet\n❌ Svårt att teckna abonnemang\n❌ Sämre räntevillkor\n❌ Kvar i 3 år (privatperson)\n\nUndvik:\n✅ Betala räkningar i tid\n✅ Kontakta borgenären vid problem\n✅ Begär anstånd — bättre än miss',a:'Ca 400 000 svenskar har betalningsanmärkning. Kronofogdemyndigheten (KFM) registrerar anmärkningar. De syns i UC (kreditupplysning) och Bisnode. Att aktivt kontakta borgenären INNAN förfallodatum förhindrar i 80% av fall att det gå till KFM.'},
{t:'Räntor & lån — förstå avtalet',s:'Viktiga begrepp:\n\n📊 Nominell ränta — procentpåslag per år\n📊 Effektiv ränta — inkl. avgifter (jämför DETTA)\n📊 Amortering — du betalar ner skulden\n📊 Räntefri period — lockerbjudande (kolla vad som händer sen)\n\nSMS-lån: 30-600% effektiv ränta!\n→ Absolut sista utväg.',a:'Konsumentkreditlagen kräver att effektiv ränta anges i all marknadsföring. SMS-lån (snabblån) har hög ränta och kort löptid — ofta kombinerat med extra avgifter. Alternativ: låna av familj, renegotiera befintliga lån, Kronofogdens budget-rådgivning.'},
{t:'Pension — det börjar nu',s:'Varje år du jobbar i Sverige = pensionspoäng.\n\nDitt pensionssparande:\n🔵 Allmän pension — automatiskt via skatten\n🟢 Tjänstepension — via arbetsgivare (viktig!)\n🟡 Privat pension — frivillig (PPM)\n\nKolla ditt pensionssparande:\npensionsmyndigheten.se → Mina Sidor\n\nTidigt sparande = enorm skillnad!',a:'Sverige har ett av världens bästa pensionssystem men kräver förståelse. Tjänstepension är ofta 4-5% av lönen extra — välj fonder aktivt via min pension.se. Ju tidigare du börjar, desto kraftfullare är ränta-på-ränta-effekten. Jobbsökperioder påverkar pensionen — fyll på om möjligt.'}
],
ex:{type:'build',title:'Din ekonomiska grund',desc:'Säkra att du har koll på grunderna.',
fields:[
{l:'Har du några obetalda räkningar just nu?',ph:'T.ex. Nej / Ja — el-räkning från oktober...',hint:'Om ja — kontakta borgenären IDAG!'},
{l:'Vet du din kreditstatus? (kolla creditsafe.se gratis)',ph:'T.ex. Nej — ska kolla / Ja, inga anmärkningar'},
{l:'Har du koll på din tjänstepension?',ph:'T.ex. Nej — ska kolla pensionsmyndigheten.se',hint:'pensionsmyndigheten.se → Mina Sidor'},
{l:'En ekonomisk sak du ska fixa denna vecka',ph:'T.ex. Betalar den försenade räkningen idag',hint:'Gör det nu — det kostar att vänta!'}
]},
quiz:[
{q:'Hur länge sitter en betalningsanmärkning kvar?',o:['1 år','3 år','5 år','Alltid'],c:1},
{q:'Vilken ränta ska du ALLTID jämföra vid lån?',o:['Nominell ränta','Effektiv ränta (inkl. avgifter)','Månadsränta','Räntefri period'],c:1},
{q:'Vad är tjänstepension?',o:['Statlig pension','Extra pension via arbetsgivaren','Privat sparande','FK-ersättning'],c:1},
{q:'Hur hög kan effektiv ränta på SMS-lån vara?',o:['10%','30-600%','5%','20%'],c:1}
],
pr:['Förklara hur den svenska pensionen fungerar.','Hur kontrollerar jag om jag har betalningsanmärkningar?','Vad händer om jag inte kan betala mina räkningar?']},

{id:'e10',icon:'🌟',title:'Din ekonomiska framtidsplan',sub:'Från idag till ekonomisk stabilitet',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Ekonomisk återhämtning — det tar tid',s:'Ekonomisk stabilitet byggs steg för steg:\n\nFas 1: Täck grundbehov\n→ Mat, hyra, el, telefon\n\nFas 2: Stoppa blödningen\n→ Inga nya skulder, betala i tid\n\nFas 3: Buffert\n→ 1 000 kr → 10 000 kr\n\nFas 4: Frihet\n→ Spara, investera, välja',a:'Finansiell psykologi: pengar ger oss säkerhet, frihet och val — inte lycka i sig. Ekonomisk stress är en av de starkaste stressfaktorerna och påverkar hälsa och relationer. Att ha en plan — oavsett hur liten — sänker stressnivåerna mätbart.'},
{t:'Gratis ekonomistöd i Helsingborg',s:'Du behöver inte klara det själv!\n\n🏛️ Kommunal budget-rådgivare: gratis\n📞 Kronofogdens budget-rådgivning: gratis\n💻 Konsumentverket Hallå Konsument: 0771-42 33 00\n🏦 FK:s ekonomirådgivning\n📱 Zmarta, Compricer — jämförelsesajter\n\nAll rådgivning är konfidentiell.',a:'Budget- och skuldrådgivning är lagreglerat i Sverige — alla kommuner måste erbjuda det gratis. Helsingborgs stad: ring kommunens kontaktcenter 042-10 50 00. Kronofogdens budgetrådgivning är gratis och utan krav på att du ska göra skuldsanering.'},
{t:'Från bistånd till självförsörjning',s:'Vägen till ekonomisk självständighet:\n\n1. Stabil inkomst (jobb, studier, A-kassa)\n2. Budget som går ihop\n3. Skulder under kontroll\n4. Buffert 10 000 kr\n5. Spara regelbundet\n6. Förstå din pension\n\nVarje steg räknas.\nDu är redan på väg — du lär dig!',a:'Rörlighet på arbetsmarknaden och i ekonomin hänger ihop. Utbildning ökar inkomst med i snitt 15-20% per utbildningsnivå. Att ta sig från försörjningsstöd till arbete är en av de viktigaste livsförändringarna — och möjliggör allt annat.'}
],
ex:{type:'build',title:'Din ekonomiska 90-dagarsplan',desc:'Konkret plan för ekonomisk stabilitet — steg för steg.',
fields:[
{l:'Var är du nu? (ärlig nulägesbedömning)',ph:'T.ex. A-kassa 11 000 kr/mån, skulder 8 000 kr, ingen buffert...',ta:true},
{l:'Fas 1 — Vad måste du fixa DENNA MÅNAD?',ph:'T.ex. Betala hyra, el, ringa om skulden...',ta:true},
{l:'Fas 2 — Ditt 90-dagarsmål',ph:'T.ex. Budget i balans, buffert 2 000 kr, inga nya skulder',hint:'Realistiskt men ambitiöst.'},
{l:'Vem kan hjälpa dig? (rådgivare, nätverk, myndighet)',ph:'T.ex. Bokar möte med budget-rådgivaren + ringer FK',hint:'Gratis hjälp finns — ta den!'}
]},
quiz:[
{q:'Vad är Fas 1 i ekonomisk återhämtning?',o:['Investera i aktier','Täcka grundbehov — mat, hyra, el','Spara 10 000 kr','Amortera lån'],c:1},
{q:'Hur mycket kostar kommunal budget-rådgivning?',o:['500 kr/timme','Gratis','1 000 kr','Beror på inkomst'],c:1},
{q:'Vilket av dessa ökar snittinkomsten mest?',o:['Byta stad','Utbildning (ca +15-20% per nivå)','Byta bank','Förhandla lönen en gång'],c:1},
{q:'Vad är det viktigaste att göra om du har skulder?',o:['Ignorera dem','Kontakta borgenären aktivt — hellre tidigt','Vänta på kronofogden','Ta nytt lån'],c:1}
],
pr:['Gör en 90-dagars ekonomiplan för mig med: inkomst X, skulder Y.','Hur ansöker jag om kommunal budget-rådgivning i Helsingborg?','Vägen från försörjningsstöd till ekonomisk stabilitet?']},

{id:'e11',icon:'🏦',title:'Lån & krediter',sub:'Förstå kostnaden innan du skriver på',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Ränta — vad kostar ett lån egentligen?',s:'Ränta = priset för att låna pengar.\n\nEffektiv ränta = den verkliga kostnaden.\n\nExempel — 10 000 kr snabblån:\n📅 12 månader\n💰 24% effektiv ränta = betalar tillbaka 12 400 kr\n\nKreditkort 20% ränta på 5 000 kr i 6 mån = ca 500 kr extra.',
a:'Effektiv ränta inkluderar avgifter och är det enda jämförbara måttet. Snabblån har ofta 200-500% effektiv ränta. Konsumentverket kräver att effektiv ränta redovisas tydligt. Jämför alltid effektiv ränta — inte nominell.'},
{t:'Typer av lån',s:'Bolån: låg ränta (2-4%) — kräver kontantinsats 15%\nBlancolån: 5-15% — utan säkerhet\nKreditkort: 15-25% — rörlig skuld\nSnabblån: 100-500%+ — undvik!\nCSN: ca 1% — förmånligast\n\n🔑 Regel: Lån med lägst ränta ALLTID BÄST.',
a:'Blancolån kräver kreditprövning. Utan fast inkomst är det svårt att beviljas. Skuldsaldo på kreditkort är en av de dyraste skuldformerna. Bolån kräver 15% kontantinsats samt en buffert för driftskostnader.'},
{t:'Undvik skuldfällan',s:'Skuldfällan:\n1. Tar snabblån för att klara månaden\n2. Betalar ej i tid → inkasso\n3. Betalningsanmärkning → svårt låna\n4. Tar nytt lån för att betala gamla\n\nBryt mönstret:\n✅ Ring din bank om du inte kan betala\n✅ Skuldrådgivning via kommunen (gratis)\n✅ Kronofogden har en budget-tjänst',
a:'Kommunerna erbjuder gratis budget- och skuldrådgivning. Konsumentkredit­ombudsmannen (KKO) hanterar klagomål. Kronofogden erbjuder Skuldsanering för den som är skuldsatt bortom förmåga att betala.'}
],
ex:{type:'build',title:'Din lånsituation',desc:'Koll på dina lån och vad de kostar.',
fields:[
{l:'Vilka lån eller krediter har du?',ph:'T.ex. Studielån CSN, kreditkort 15 000 kr, blancolån...',ta:true},
{l:'Vad betalar du i månadsränta totalt (ungefär)?',ph:'T.ex. CSN 300 kr/mån, kreditkort 150 kr/mån...'},
{l:'Finns det ett lån du vill lösa eller refinansiera?',ph:'T.ex. Vill betala av kreditkortskulden först'},
{l:'Nästa steg',ph:'T.ex. Ring min bank om refinansiering, boka skuldrådgivning',hint:'Kommunal skuldrådgivning är gratis'}
]},
quiz:[
{q:'Vad är effektiv ränta?',o:['Räntan på lönedagen','Den verkliga totalkostnaden inklusive avgifter','Bankens interna ränta','Månatlig ränta'],c:1},
{q:'Vilken låneform är DYRAST?',o:['CSN-lån','Bolån','Snabblån 100-500%+','Blancolån'],c:2},
{q:'Vad gör du om du inte kan betala en skuld?',o:['Ignorera den','Ringa banken och kommunens skuldrådgivning','Ta ett nytt lån','Vänta och hoppas'],c:1},
{q:'Vad är kommunal skuldrådgivning?',o:['Betaltjänst 500 kr/tim','Gratis hjälp med skulder och budget','Kronofogdens tjänst','Bankens service'],c:1}
],
pr:['Hur räknar jag ut vad mitt lån kostar totalt?','Vilka lån bör jag betala av först?','Hur bokar jag skuldrådgivning i Helsingborg?']},

{id:'e12',icon:'⚖️',title:'Skulder & Kronofogden',sub:'Om du hamnar i skuldfällan',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Vad händer om du inte betalar?',s:'Processen:\n1. Påminnelse (15-60 kr avgift)\n2. Inkasso (250-750 kr avgift)\n3. Kronofogden ansöker om betalningsföreläggande\n4. Utmätning — lön, tillgångar\n5. Betalningsanmärkning 3 år\n\nVarje steg kostar mer och skadar mer.',
a:'Kronofogdemyndighetens databas är offentlig. Betalningsanmärkning gör det svårt att hyra bostad, teckna abonnemang och ibland få anställning. Det kan ta 3 år att bli skuldfri efter sanering.'},
{t:'Skuldsanering — sista utvägen',s:'Skuldsanering = juridisk process för att få skulder borttagna.\n\nKriterier:\n• Skuldsatt bortom alla möjligheter\n• Prövas av Kronofogden\n• Tar 3-5 år\n• Sparar bara ett existensminimum\n\nAnsöks via kronofogden.se — kostnadsfritt.',
a:'Skuldsanering beviljas inte alla — det kräver att du är skuldsatt utan realistisk möjlighet att betala. Under sanerings­perioden lever du på existensminimum (ca 5 500-6 500 kr/mån). Efter avslutad sanering är du skuldfri.'},
{t:'Förebygg — budget och dialog',s:'De flesta skuldsituationer kan förebyggas:\n\n✅ Budget som håller koll\n✅ Ring fordringsägaren TIDIGT\n✅ Kommunal skuldrådgivning\n✅ Dela upp skuld i avbetalningsplan\n\nDe flesta fordringsägare föredrar avbetalning över inkasso.',
a:'Tidigt kontakt med fordringsägare kan stoppa inkassoprocessen. Kommunens budget- och skuldrådgivare kan förhandla med fordringsägare på dina vägnar. Det är gratis och konfidentiellt.'}
],
ex:{type:'build',title:'Hantera skuldsituationen',desc:'Konkret plan om du har skulder.',
fields:[
{l:'Har du obetalda räkningar eller inkassokrav?',ph:'Ja/Nej — Beskriv kortfattat'},
{l:'Har du kontaktat fordringsägaren?',ph:'T.ex. Nej — ska ringa Telia imorgon och be om avbetalning'},
{l:'Vill du ha hjälp av kommunens skuldrådgivare?',ph:'T.ex. Ja — ska ringa kommunen för att boka tid',hint:'Helsingborg: ring kommunen och fråga efter budget- och skuldrådgivning'},
{l:'Ditt nästa steg idag',ph:'T.ex. Ringa Kronofogden för info, eller kommunens skuldrådgivning',ta:true}
]},
quiz:[
{q:'Hur länge sitter en betalningsanmärkning kvar?',o:['1 år','3 år','5 år','10 år'],c:1},
{q:'Vad är skuldsanering?',o:['En betalningsplan','Juridisk process för att ta bort skulder man inte kan betala','En inkassobyrå','Kronofogdens avgift'],c:1},
{q:'Vad bör du göra TIDIGT om du inte kan betala?',o:['Ignorera det','Kontakta fordringsägaren direkt och föreslå avbetalning','Ansök om skuldsanering direkt','Flytta'],c:1},
{q:'Vad kostar kommunal skuldrådgivning?',o:['500 kr','1 000 kr','Gratis','Beror på skuldens storlek'],c:2}
],
pr:['Hur ansöker jag om skuldsanering?','Hur pratar jag med en inkassobyrå?','Vad är existensminimum vid skuldsanering?']},

{id:'e13',icon:'🏠',title:'Försäkringar',sub:'Rätt skydd — inte för mycket, inte för lite',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Hemförsäkring — ett måste',s:'Hemförsäkring skyddar:\n\n🏠 Ditt hem vid brand, inbrott, vattenläcka\n💼 Dina saker (stöld, skada)\n🦺 Ansvarsskydd (om du råkar skada någon)\n⚖️ Rättsskydd (juridisk hjälp)\n\nKostnad: ca 100-250 kr/mån\nBOR DU UTAN = stor ekonomisk risk!',
a:'Hemförsäkringen är den viktigaste privatförsäkringen. Vid brand kan en enda incident kosta hundratusentals kronor. Rättsskyddet täcker vanligtvis 80% av advokatkostnader upp till ca 150 000 kr.'},
{t:'Olycksfalls & livförsäkring',s:'Olycksfallsförsäkring:\n• Skyddar vid olyckor utanför jobbet\n• Ca 50-150 kr/mån\n\nLivförsäkring:\n• Engångssumma till familjen om du dör\n• Viktigt med barn/skulder\n• Ca 100-300 kr/mån\n\nVia facket — ofta billigare!',
a:'Kollektivavtalet ger ofta Tjänstegrupplivförsäkring (TGL) automatiskt som anställd. Kolla med facket om du omfattas. Olycksfallsförsäkring via arbetsgivaren gäller bara arbetstid.'},
{t:'Jämför & spara',s:'Tjäna pengar på försäkringar:\n\n✅ Samla hos ett bolag — rabatt\n✅ Jämför på insplanet.com eller compricer.se\n✅ Ring och begär lojalitetsrabatt\n✅ Höj självrisken → lägre premie\n✅ Betala årsvis → billigare\n\nGenomsnittlig besparing vid jämförelse: 500-2 000 kr/år',
a:'Insplanet och Compricer jämför priser från många bolag. Lojalitetsrabatter ges sällan automatiskt — du måste begära dem. En hög självrisken (ex 5 000 kr istället för 1 500 kr) kan sänka premien 15-25%.'}
],
ex:{type:'build',title:'Din försäkringsöversikt',desc:'Koll på vad du har och vad du behöver.',
fields:[
{l:'Har du hemförsäkring? Vilket bolag och kostnad?',ph:'T.ex. Ja — Folksam, 150 kr/mån. Nej — ska kolla compricer.se'},
{l:'Har du olycksfalls- eller livförsäkring?',ph:'T.ex. Ja via facket. Nej — har inga anhöriga just nu...'},
{l:'Vad betalar du totalt för försäkringar/mån?',ph:'T.ex. 350 kr/mån — hemförsäkring + bil'},
{l:'Vad ska du kolla eller ändra?',ph:'T.ex. Jämföra hemförsäkring på compricer.se, fråga facket om TGL',hint:'compricer.se — enkelt att jämföra'}
]},
quiz:[
{q:'Vad täcker hemförsäkringen?',o:['Bara brand','Brand, stöld, ansvar och rättsskydd','Bara dina saker','Bara om du äger bostaden'],c:1},
{q:'Vad är TGL?',o:['En typ av bolån','Tjänstegrupplivförsäkring via kollektivavtal','En bankprodukt','En skatteförmån'],c:1},
{q:'Var jämför du försäkringspriser?',o:['Ringer runt manuellt','compricer.se eller insplanet.com','Bara via banken','Skatteverket'],c:1},
{q:'Hur sänker du försäkringspremien?',o:['Minska skyddet','Höj självrisken och betala årsvis','Byt bolag varje år','Ingenting hjälper'],c:1}
],
pr:['Vilka försäkringar behöver en ensamstående person?','Hur jämför jag hemförsäkringar?','Vad täcker rättsskyddet i hemförsäkringen?']},

{id:'e14',icon:'👴',title:'Pension & tjänstepension',sub:'Framtiden börjar nu',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Hur fungerar pension i Sverige?',s:'Svensk pension = tre delar:\n\n1. Allmän pension (staten) — 18,5% av lönen avsätts\n2. Tjänstepension (arbetsgivaren) — 4,5% extra\n3. Privat sparande (frivilligt)\n\nKolla din pension på minpension.se — gratis!',
a:'Allmän pension beräknas på livsinkomst — varje år och krona räknas. Utan inkomst (t.ex. vid långtidsarbetslöshet) minskar den framtida pensionen. SGI (sjukpenninggrundande inkomst) påverkas av inkomst.'},
{t:'Tjänstepension — arbetsgivarens del',s:'Om du har kollektivavtal:\n\n✅ Arbetsgivaren betalar 4,5-30% av lönen\n✅ Placeras i fonder\n✅ Du väljer fonder via valcentral\n\nUtan kollektivavtal:\n❌ Ingen garanti på tjänstepension\n\nKolla på minpension.se vad du har!',
a:'Tjänstepension är värdefull — för en normallöntagare kan den utgöra 25-35% av totalpensioen. Fondval spelar roll: historiskt ger aktietunga fonder bäst avkastning på lång sikt. Glöm inte att logga in och välja fonder!'},
{t:'Pension och jobbsök — vad händer?',s:'Under perioder utan arbete:\n\n⚠️ Allmän pension tjänas inte in (ingen lön)\n⚠️ Tjänstepension pausas\n✅ A-kassa ger viss pensionsgrundande inkomst\n✅ Föräldrapenning ger pensionsrätt\n✅ Studiemedel ger viss pensionsrätt\n\nDärför är snabbt tillbaka i arbete viktigt!',
a:'Varje år utan inkomst kostar ca 1 500-2 500 kr/mån i framtida pension beroende på din ålder och lönenivå. Premiepension (PPM) fortsätter växa med fondavkastning även utan inbetalning. Logga in på minpension.se för fullständig bild.'}
],
ex:{type:'build',title:'Din pensionsöversikt',desc:'Koll på din framtida ekonomi.',
fields:[
{l:'Har du loggat in på minpension.se?',ph:'Ja/Nej — logga in nu med BankID för full översikt',hint:'minpension.se — gratis och tar 5 min'},
{l:'Har du tjänstepension via din arbetsgivare?',ph:'T.ex. Ja — ITP via Collectum. Nej — saknar kollektivavtal.'},
{l:'Har du valt fonder för din tjänstepension?',ph:'T.ex. Nej — ska logga in på valcentralen och välja globala aktier'},
{l:'Vad gör du för att stärka din pension?',ph:'T.ex. Hitta jobb snabbare, spara 500 kr/mån extra',ta:true}
]},
quiz:[
{q:'Hur stor andel av lönen avsätts till allmän pension?',o:['10%','18,5%','25%','30%'],c:1},
{q:'Var kollar du din pension?',o:['Skatteverket','minpension.se med BankID','Din bank','FK'],c:1},
{q:'Vad händer med tjänstepensionen om du är arbetslös?',o:['Den fortsätter växa','Den pausas — ingen inbetalning','Den försvinner','FK betalar in istället'],c:1},
{q:'Varför är fondval viktigt för tjänstepension?',o:['Det är det inte','Aktietunga fonder ger historiskt bättre avkastning långsiktigt','Du måste välja statsobligationer','Fonderna är alltid samma'],c:1}
],
pr:['Hur ökar jag min pension?','Vad innebär det att jag saknar tjänstepension?','Förklara PPM och premiepension enkelt.']},

{id:'e15',icon:'🏧',title:'Bankkonto & BankID',sub:'Det digitala basverktyget i Sverige',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Bankkonto i Sverige — hur öppnar du?',s:'Du behöver ett bankkonto för att:\n• Få lön utbetald\n• Betala hyra\n• Söka bidrag\n• Ha BankID\n\nVad krävs:\n✅ ID-handling (pass, SIS-kort)\n✅ Personnummer\n✅ Personligen eller digitalt\n\nSverige har en s.k. kontorätt — alla har rätt till konto!',
a:'Kontorätten är inskriven i lag. Om en bank nekar konto kan du klaga till Finansinspektionen. Digitalbanker (Revolut, Wise) fungerar för internationella transfers men erkänns inte alltid av myndigheter.'},
{t:'BankID — Sveriges digitala legitimation',s:'BankID används för att:\n✅ Logga in på myndigheter (FK, AF, Skatteverket)\n✅ Signera avtal digitalt\n✅ Identifiera dig på 1177, bankerna\n✅ Deklarera\n✅ Söka bidrag\n\nFår du inte BankID = svårt att delta digitalt i Sverige.',
a:'BankID finns i mobil- och kortläsarversion. Mobilt BankID kräver ett aktivt bankförhållande. Utan personnummer är det svårare men inte omöjligt — kontakta din bank. BankID är gratis att använda.'},
{t:'Swish, Autogiro & betalningar',s:'Swish:\n📱 Snabba betalningar → kräver BankID + mobilnummer\n✅ Gratis att ta emot, ibland kostnad att skicka\n\nAutogiro:\n🔄 Automatisk månadsbetalning\n✅ Inga sena avgifter\n✅ Bra för hyra, abonnemang\n\nFaktura:\n📄 30 dagars betaltid standard',
a:'Sverige är ett av världens mest kontantfria samhällen — ca 90% av transaktioner är digitala. Utan Swish och BankID är vardagen svårare. Butiker har rätt att neka kontanter men det är ovanligt.'}
],
ex:{type:'build',title:'Din digitala bankplan',desc:'Se till att ha alla digitala verktyg på plats.',
fields:[
{l:'Har du ett svenskt bankkonto?',ph:'Ja — Handelsbanken. Nej — ska gå till banken med mitt pass.',hint:'Ta med pass + personnummer'},
{l:'Har du BankID installerat?',ph:'Ja. Nej — kontaktar min bank om BankID-aktivering.'},
{l:'Har du Swish installerat?',ph:'Ja. Nej — installerar via min bank efter BankID.',hint:'Swish kräver BankID och mobilnummer'},
{l:'Vilken bank har du och är du nöjd?',ph:'T.ex. Swedbank, ska jämföra med Nordea och Handelsbanken...'}
]},
quiz:[
{q:'Vad är kontorätten?',o:['Rätt att handla på kredit','Rätt att öppna bankkonto — alla har den','Rätt att låna pengar','Rätt till räntefritt konto'],c:1},
{q:'Vad används BankID till?',o:['Bara bankärenden','Digital legitimation för myndigheter, avtal och bank','Bara betala räkningar','Skattedeklaration'],c:1},
{q:'Vad krävs för att öppna bankkonto?',o:['Inkomst','ID-handling och personnummer','Fast adress','Körkort'],c:1},
{q:'Vad är autogiro?',o:['En typ av kredit','Automatisk månadsbetalning från kontot','En sparform','Swish för företag'],c:1}
],
pr:['Hur öppnar jag bankkonto utan personnummer?','Vilken bank är bäst för nyanlända i Sverige?','Hur aktiverar jag BankID?']},

{id:'e16',icon:'🛍️',title:'Konsumenträtt & reklamation',sub:'Dina rättigheter som köpare',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Konsumentköplagen — dina rättigheter',s:'När du köper en vara har du rätt till:\n\n✅ 3 års reklamationsrätt på fel\n✅ Reparation, omsyte eller prisavdrag\n✅ Pengarna tillbaka om felet inte åtgärdas\n\n⚠️ Garanti = säljarens eget löfte (kan vara kortare)\n✅ Reklamationsrätt > garanti alltid',
a:'Konsumentköplagen gäller köp från en näringsidkare (butik, nätbutik). Privatköp (Blocket etc) har svagare skydd. Felet måste finnas vid köptillfället. Bevisbördan är köparens efter 6 månader.'},
{t:'Ångerrätt & öppet köp',s:'Ångerrätt (14 dagar) gäller:\n✅ Köp på nätet\n✅ Telefonköp\n✅ Hemförsäljning\n\n❌ Gäller EJ i butik (bara om butiken erbjuder)\n❌ Personliga varor (underkläder, hygien)\n\nÖppet köp = butikens eget erbjudande.',
a:'Ångerrätten är EU-lagstiftning (14 dagar utan att ange skäl). Du betalar returfrakten om inte annat avtalats. Kontakta säljaren skriftligt inom 14 dagar — spara all kommunikation.'},
{t:'Om du inte är nöjd — steg för steg',s:'1. Kontakta säljaren — begär reklamation\n2. Spara kvitto/orderbekräftelse\n3. Dokumentera felet med foto\n4. Eskalera till Allmänna reklamationsnämnden (ARN)\n5. Konsumentverket — ytterligare stöd\n\nARN är gratis och tar 3-6 månader.',
a:'ARN (Allmänna reklamationsnämnden) löser tvister kostnadsfritt. De flesta företag följer ARN:s beslut. Konsumentguiden på konsumentverket.se ger gratis rådgivning via chatt och telefon.'}
],
ex:{type:'build',title:'Din konsumenträtt i praktiken',desc:'Vet hur du reklamerar och tar tillvara dina rättigheter.',
fields:[
{l:'Har du köpt något nyligen som inte fungerar?',ph:'T.ex. Telefon som krånglar efter 18 mån, jacka med trasig dragkedja...'},
{l:'Hur länge sedan köpte du det?',ph:'T.ex. 14 månader sedan — inom 3 år = reklamationsrätt'},
{l:'Vad vill du ha ut av reklamationen?',ph:'T.ex. Reparation, pengarna tillbaka, omsyte'},
{l:'Ditt nästa steg',ph:'T.ex. Ring butiken, skicka mejl med foto av felet',hint:'Spara alltid kvitto och kommunikation!'}
]},
quiz:[
{q:'Hur lång är reklamationsrätten i Sverige?',o:['1 år','2 år','3 år','6 månader'],c:2},
{q:'Vad gäller ångerrätten?',o:['Alla köp i butik','Köp på nätet och via telefon','Bara dyra varor','Bara elektronik'],c:1},
{q:'Vad är ARN?',o:['En konsumentbutik','Allmänna reklamationsnämnden — gratis tvistelösning','En myndighet som säljer varor','En inkassobyrå'],c:1},
{q:'Vad gäller om du köper av en privatperson på Blocket?',o:['Samma som butik','Svagare skydd — konsumentköplagen gäller ej','Bättre skydd','Inga regler alls'],c:1}
],
pr:['Hur skriver jag ett reklamationsbrev?','Vad gör jag om butiken nekar reklamation?','Hur anmäler jag ett företag till ARN?']},

{id:'e17',icon:'⚡',title:'El, energi & hushållskostnader',sub:'Sänk räkningarna med enkla åtgärder',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Förstå din elräkning',s:'Elräkning = tre delar:\n\n⚡ Elförbrukning (kWh) — ca 50-60% av kostnaden\n🔌 Nätavgift — fast avgift för kablar\n💰 Skatt — ca 30% av totalen\n\nGenomsnitt ensamhushåll: 2 000-4 500 kWh/år\nKostnad: ca 8 000-14 000 kr/år',
a:'Priset per kWh varierar kraftigt med elhandelsavtal. Timpris (spot) är billigast lågtrafik men dyrare högtrafik. Fast pris ger förutsägbarhet. Jämför på elpriskollen.se (Energimarknadsinspektionen).'},
{t:'Sänk din elanvändning',s:'Enkla åtgärder:\n🌡️ Sänk temperaturen 1 grad = 5% lägre elräkning\n💡 LED-lampor — 80% lägre än glödlampor\n🚿 Kortare duschar\n❄️ Full disk- och tvättmaskin\n🔌 Stäng av standby\n\nPotential: spara 1 000-3 000 kr/år',
a:'Uppvärmning är ofta 50-60% av hushållets energianvändning. Varje grad lägre inomhustemperatur minskar energianvändningen ca 5%. Standby-apparater kan kosta 500-1 000 kr/år om de aldrig stängs av.'},
{t:'Bostadsbidrag för energi & stöd',s:'Energistöd vid höga elkostnader:\n• Bostadsbidrag (FK) täcker del av hyran\n• Kommunen kan ge ekonomiskt bistånd för höga räkningar\n\nJämför elpriser:\n🌐 elpriskollen.se — gratis\n🌐 compricer.se\n\nByt elleverantör — spara 1 000-4 000 kr/år!',
a:'Elpriskollen.se drivs av Energimarknadsinspektionen och är den mest opartiska jämförelsetjänsten. Att byta elleverantör tar ca 15 min och kostar ingenting. Bindningstid varierar — kolla det noga.'}
],
ex:{type:'build',title:'Din energibesparing',desc:'Konkreta åtgärder för lägre räkningar.',
fields:[
{l:'Vad betalar du i el ungefär per månad?',ph:'T.ex. Ca 800 kr/mån (lägenhet), 1 500 kr/mån (villa)'},
{l:'Har du jämfört ditt elavtal?',ph:'T.ex. Nej — ska kolla elpriskollen.se idag',hint:'elpriskollen.se — tar 5 min'},
{l:'3 åtgärder du kan göra direkt',ph:'T.ex. Sänka temperaturen 1 grad, slå av standby-apparater, byta till LED',ta:true},
{l:'Potentiell besparing per år?',ph:'T.ex. ~1 500 kr om jag sänker tempen + byter elleverantör'}
]},
quiz:[
{q:'Vad innebär det att sänka inomhustemperaturen med 1 grad?',o:['Ingen märkbar skillnad','Ca 5% lägre energianvändning','Ca 20% lägre','Bara komfort'],c:1},
{q:'Var jämför du elpriser opartiskt?',o:['elhandelsbolagets hemsida','elpriskollen.se (Energimyndigheten)','compricer.se (bättre)','Din bank'],c:1},
{q:'Hur mycket kan standby-apparater kosta per år?',o:['Ingenting','Ca 50 kr','500-1 000 kr','10 000 kr'],c:2},
{q:'Vad är nätavgiften?',o:['Avgift för elen du förbrukar','Fast avgift för elnätet — kan ej byta','En skatt','Avgift för elmätaren'],c:1}
],
pr:['Hur sänker jag min elräkning i en hyresrätt?','Vilket elavtal är bäst just nu?','Hur söker jag bostadsbidrag för mina boendekostnader?']},

{id:'e18',icon:'📊',title:'Spara & investera smart',sub:'Från buffert till fonder',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'ISK — Investeringssparkonto',s:'ISK är Sveriges smidigaste sparform:\n\n✅ Ingen skatt på vinst när du säljer\n✅ Låg schablonskatt (ca 0,88%/år)\n✅ Kan äga aktier, fonder, ETF:er\n✅ Öppnas kostnadsfritt hos Avanza/Nordnet/banken\n\nBäst för: långsiktigt sparande 3+ år',
a:'ISK beskkattas med schablonskatt baserat på kontovärdet, oavsett om du säljer eller inte. Vid positiv avkastning är ISK skattemässigt överlägset vanligt konto. Avanza Zero är en gratis indexfond utan avgift.'},
{t:'Fonder — för nybörjaren',s:'Typer av fonder:\n📈 Indexfond — följer börsen, låg avgift\n📊 Aktiefond — aktiv förvaltning, högre avgift\n🛡️ Räntefond — lägre risk, lägre avkastning\n🌍 Blandfond — mix\n\nRegel: Välj indexfond med lägst avgift (TER <0,5%).',
a:'Historisk avkastning: Globalindex ca 10%/år (nominellt) över 30 år. Aktiva fonder slår sällan index efter avgifter. Avanza Global och Länsförsäkringar Global Indexnära är populära zero-avgiftsfonder.'},
{t:'Spara trots liten plånbok',s:'Börja litet — det spelar roll!\n\n💰 100 kr/mån i 30 år @ 7% = ca 113 000 kr\n💰 500 kr/mån i 30 år @ 7% = ca 567 000 kr\n\nAutomatiskt sparande:\n✅ Autogiro direkt vid lönedagen\n✅ Runt-upp-sparande (Klarna, Doktor Savings)\n\nTid i marknaden > tajming av marknaden.',
a:'Ränta-på-ränta-effekten är kraftfull. Den som börjar spara 100 kr/mån vid 25 har mer vid 65 än den som börjar spara 500 kr/mån vid 45. Automatisering tar bort beslutsfattning och ökar följsamheten.'}
],
ex:{type:'build',title:'Din sparplan',desc:'Kom igång med smart sparande.',
fields:[
{l:'Har du en buffert (3 månaders kostnader)?',ph:'T.ex. Delvis — 10 000 kr, behöver 30 000 kr',hint:'Buffert är alltid prioritet 1'},
{l:'Har du ett ISK-konto?',ph:'Ja — Avanza. Nej — ska öppna ett när bufferten är klar.'},
{l:'Hur mycket kan du spara per månad?',ph:'T.ex. 200 kr/mån — börjar litet med automatiskt sparande'},
{l:'Din sparplan',ph:'T.ex. Autogiro 200 kr/mån till Avanza Global indexfond',ta:true}
]},
quiz:[
{q:'Vad är fördelen med ISK?',o:['Ingen skatt alls','Schablonskatt — ingen skatt på försäljningsvinst','Statlig garanti','Bättre ränta'],c:1},
{q:'Vilken fondtyp rekommenderas nybörjare?',o:['Aktiv aktiefond','Indexfond med låg avgift','Hedgefond','Räntefond'],c:1},
{q:'Hur mycket ger 100 kr/mån i 30 år med 7% ränta?',o:['Ca 36 000 kr','Ca 113 000 kr','Ca 500 000 kr','Ca 10 000 kr'],c:1},
{q:'Vad är bäst tidpunkt att börja spara?',o:['När du har råd','Så tidigt som möjligt — ränta på ränta','Vid 40 år','Vid löneförhöjning'],c:1}
],
pr:['Hur öppnar jag ett ISK-konto?','Vilken indexfond ska jag välja?','Hur sparar jag smart med 200 kr/mån?']},

{id:'e19',icon:'👨‍👩‍👧',title:'Ekonomi & familj',sub:'Separation, barn och gemensam ekonomi',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Gemensam ekonomi i par',s:'Tips vid gemensam ekonomi:\n\n✅ Gemensamt hushållskonto + egna konton\n✅ Öppen dialog om utgifter\n✅ Skriftliga avtal vid samboende\n\nSambolagen: Om ni separerar delar ni lägenheten och bohag 50/50 — men inte sparkonton!\n\n⚠️ Utan äktenskapsförord delar ni allt vid äktenskapsskillnad.',
a:'Sambolagen gäller automatiskt vid samboende — men skyddar inte separat sparande. Ett samboavtal kan undanta egendom. Äktenskapsförord skrivs hos notarius publicus. Ca 40-50% av svenska äktenskap slutar i skilsmässa.'},
{t:'Underhållsbidrag & barnbidrag',s:'Vid separation med barn:\n\n📋 Underhållsbidrag: den som inte bor med barnet betalar\n• Fastställs av FK\n• Ca 1 500-2 500 kr/mån/barn (schablonbelopp)\n\n👶 Barnbidrag: 1 250 kr/mån/barn\n• Delas lika vid växelvis boende\n• FK betalar ut automatiskt',
a:'Underhållsbidraget beräknas baserat på barnets behov och föräldrarnas ekonomi. Om den betalningsskyldige inte betalar kan FK betala ut underhållsstöd istället och kräva föräldern. FK hanterar alla ansökningar.'},
{t:'Ensamstående ekonomi',s:'Som ensamstående har du rätt till:\n\n✅ Bostadsbidrag (högre vid barn)\n✅ Barnbidrag 1 250 kr/mån\n✅ Underhållsstöd (om ex ej betalar)\n✅ Flerbarnstillägg (från barn nr 2)\n✅ Försörjningsstöd vid behov\n\nKolla alla rättigheter på FK:s räkneverktyg.',
a:'Ensamstående föräldrar har rätt till flerbarnstillägg (400-2 400 kr/mån) från barn nr 2. Bostadsbidragets takbelopp är högre vid barn. Försörjningsstöd är kommunens sista skyddsnät.'}
],
ex:{type:'build',title:'Familjens ekonomiska plan',desc:'Koll på rättigheter och avtal.',
fields:[
{l:'Familjesituation (sambo, gift, ensamstående, barn)?',ph:'T.ex. Sambo sedan 2 år, ett barn 3 år'},
{l:'Har ni ett samboavtal eller äktenskapsförord?',ph:'Ja/Nej — om nej: ska vi diskutera detta?',hint:'Viktigt vid separation!'},
{l:'Vilka familjeförmåner har du rätt till?',ph:'T.ex. Barnbidrag, underhållsstöd, bostadsbidrag...'},
{l:'Finns en ekonomisk fråga du behöver lösa?',ph:'T.ex. Underhållsbidrag ej betalt — ska kontakta FK',ta:true}
]},
quiz:[
{q:'Vad gäller sambolagen vid separation?',o:['Ni delar allt 50/50','Ni delar gemensam lägenhet och bohag 50/50 — inte sparkonton','Bara gifta omfattes','Den som tjänar mer får mer'],c:1},
{q:'Hur stort är barnbidraget per barn och månad?',o:['800 kr','1 000 kr','1 250 kr','2 000 kr'],c:2},
{q:'Vad är underhållsstöd?',o:['Bidrag till alla barn','FK betalar ut om en förälder inte betalar underhåll','Bostadsbidrag för barn','Extra barnbidrag'],c:1},
{q:'Var ansöker du om underhållsbidrag?',o:['Tingsrätten','FK — Försäkringskassan','Kommunen','Socialtjänsten'],c:1}
],
pr:['Hur beräknas underhållsbidraget?','Vilka bidrag har jag rätt till som ensamstående förälder?','Ska vi skriva ett samboavtal?']},

{id:'e20',icon:'🎯',title:'Din finansiella frihet',sub:'Sätt upp mål och bygg ekonomin steg för steg',color:'#a78bfa',bc:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.07)',
lessons:[
{t:'Ekonomisk stabilitet — en trappa',s:'Bygg ekonomin i rätt ordning:\n\n🔴 Steg 1: Täck grundbehov (hyra, mat, el)\n🟠 Steg 2: Betala skulder med hög ränta\n🟡 Steg 3: Buffert — 3 månaders kostnader\n🟢 Steg 4: Pensionssparande\n🔵 Steg 5: Frivilligt investeringssparande\n\nHoppa aldrig över ett steg!',
a:'Att börja investera innan skulder är betalda ger sällan positiv avkastning — skuldräntan är oftast högre. Bufferten är skyddet som hindrar dig från att ta lån vid oväntade händelser.'},
{t:'Ekonomiska mål — SMARTA',s:'❌ "Jag vill spara mer"\n✅ "Jag ska spara 500 kr/mån från 1 juni i ISK på Avanza, automatiskt"\n\nDina mål:\n🎯 Kortfristigt: 0-12 mån (buffert)\n🎯 Medelfristigt: 1-5 år (bil, bostad)\n🎯 Långfristigt: 5+ år (pension, frihet)\n\nEtt mål per kategori — fokus är allt.',
a:'SMARTA finansiella mål ökar uppnåandegraden med 40-50% jämfört med vaga mål. Automatisering är nyckeln — det som sker utan beslut sker alltid. Sätt autogiro direkt vid lönedagen.'},
{t:'Din ekonomiska resa framåt',s:'Grattis — du har gått igenom hela Ekonomin!\n\nDu vet nu:\n✅ Budgetera och spåra kostnader\n✅ Förstå skulder och räntor\n✅ Skydda dig med försäkringar\n✅ Pension och tjänstepension\n✅ Konsumenträtt och reklamation\n✅ Spara och investera smart\n\nNästa steg: Gör det på riktigt!',
a:'Ekonomisk kunskap är en av de viktigaste färdigheterna — men den hjälper bara om du agerar. Ta ett steg per dag, inte allt på en gång. Kommunens budget- och skuldrådgivare, FK och Konsumentverket är alltid tillgängliga och gratis.'}
],
ex:{type:'ai-chat',title:'Chatta om din ekonomi'},
quiz:[
{q:'Vilket steg kommer ALLTID före investeringssparande?',o:['Pensionstänk','Buffert på 3 månaders kostnader','Bolån','ISK-konto'],c:1},
{q:'Vad är ett SMARTA ekonomiskt mål?',o:['"Spara mer"','"500 kr/mån från 1 juni till ISK automatiskt"','"Bli rik"','Alla är lika bra'],c:1},
{q:'Vilken skuld betalar du av FÖRST?',o:['Den äldsta','Den med högst ränta','Den med lägst belopp','Spelar ingen roll'],c:1},
{q:'Var finns gratis ekonomirådgivning?',o:['Banken (ej gratis)','Kommunens budget- och skuldrådgivning och Konsumentverket','Privatekonomisk rådgivare','Ingen gratis finns'],c:1}
],
pr:['Bygg min ekonomiska trappa baserat på min situation.','Hur sätter jag upp ett SMART sparmål?','Vilket är mitt nästa ekonomiska steg?']}
];

var DIGITAL=[
{id:'d1',icon:'🌐',title:'Digital närvaro',sub:'Ditt Google-fotavtryck',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad är digital närvaro?',s:'Digital närvaro är allt som finns om dig på internet.\n\nBilder, texter, profiler och kommentarer.',a:'Ditt samlade digitala fotavtryck: sociala medier, sökresultat, gamla konton. Arbetsgivare använder detta.'},{t:'Vad ser arbetsgivare?',s:'De söker ditt namn och ser bilder, profiler och gamla inlägg.',a:'Rekryterare gör en snabb bakgrundskoll. Professionalism, språkbruk, bilder.'},{t:'Städa ditt fotavtryck',s:'Ta bort gamla bilder, stäng gamla konton, ändra profilbilder.',a:'Uppdatera LinkedIn, skapa professionella profiler och radera olämpligt innehåll.'}],
ex:{type:'build',title:'Analysera ditt fotavtryck',desc:'Snabb analys + förbättringsplan.',fields:[{l:'Googla ditt namn — vad hittar du?',ph:'T.ex. Instagram, gammal blogg...',ta:true,hint:'Sök på ditt namn nu.'},{l:'Vad bör tas bort?',ph:'T.ex. Gamla partybilder...',ta:true},{l:'Vad bör läggas till?',ph:'T.ex. Uppdatera LinkedIn-bild...',ta:true},{l:'Ditt nästa steg',ph:'T.ex. Byt profilbild idag.',hint:'Gör det nu!'}]},
quiz:[{q:'Vad är digital närvaro?',o:['Att ha dator','Allt om dig på internet','En e-postadress'],c:1},{q:'Varför googlar arbetsgivare?',o:['Nyfikenhet','Professionell bakgrundskoll','Lag'],c:1},{q:'Vad ta bort?',o:['Yrkeshistorik','Stötande bilder och kommentarer','Profilbild'],c:1}],
pr:['Sammanfatta mitt fotavtryck: …','5 förbättringar för min närvaro.','Vad tittar arbetsgivare på?']},
{id:'d2',icon:'🔵',title:'LinkedIn-grunder',sub:'Din profil online',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Varför LinkedIn?',s:'LinkedIn är en jobbsida där arbetsgivare hittar dig.',a:'Världens största professionella nätverk. Rekryterare söker och verifierar kandidater där.'},{t:'5 viktigaste delar',s:'1. Profilbild\n2. Rubrik\n3. Om mig\n4. Erfarenhet\n5. Kompetenser',a:'Dessa påverkar hur ofta du visas i sökningar.'},{t:'Rubrik & Om mig',s:'Rubrik = vad du gör.\nOm mig = vem du är.',a:'Rubrik: yrkesroll + styrkor + bransch.\nOm mig: 3-5 meningar med pitch, erfarenhet och mål.'}],
ex:{type:'build',title:'Bygg din LinkedIn-profil',desc:'Skriv delarna — kopiera sedan direkt till LinkedIn.',fields:[{l:'Rubrik',ph:'T.ex. Lagerarbetare med truck-erfarenhet',hint:'Max 120 tecken.'},{l:'Om mig — pitch',ph:'T.ex. Engagerad med 4 år i logistik.',ta:true},{l:'Om mig — styrkor',ph:'T.ex. Struktur, effektivitet och teamarbete.',ta:true},{l:'Om mig — mål',ph:'T.ex. Söker utmaning i Helsingborg.',ta:true}]},
quiz:[{q:'Varför är LinkedIn viktigt?',o:['Nöjessida','Rekryterare söker där','Obligatoriskt'],c:1},{q:'Vad ska rubriken ha?',o:['Favoritfilm','Yrkesroll + styrkor + bransch','Alla utbildningar'],c:1},{q:'Vad ska Om mig ha?',o:['Familjebakgrund','Pitch, erfarenhet och mål','Lista med jobb'],c:1}],
pr:['LinkedIn-rubrik baserat på min erfarenhet.','Om mig i 3 meningar.','Förbättra min profil: …']},
{id:'d3',icon:'👤',title:'Bygg digital profil',sub:'Professionellt online',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad är en digital profil?',s:'Bild, text, kompetenser och kontaktuppgifter på ett ställe.',a:'Samlar din yrkesidentitet — vem du är, vad du kan och vad du söker, snabbt och professionellt.'},{t:'5 steg',s:'1. Profilbild\n2. Kort presentation\n3. Styrkor\n4. Erfarenhet\n5. Kontakt',a:'Varje del fyller en funktion. Bilden skapar förtroende, presentationen berättar vem du är.'},{t:'Koppla din pitch',s:'Din pitch är grunden för din digitala presentation.',a:'Konsekvent pitch i CV, LinkedIn och profil skapar ett starkt varumärke.'}],
ex:{type:'build',title:'Bygg din profil i 5 steg',desc:'Komplett digital profil med pitch och styrkor.',fields:[{l:'Profilbild — vad behöver förbättras?',ph:'T.ex. Selfie → professionell bild neutral bakgrund.',hint:'Neutral bakgrund, tydligt ansikte.'},{l:'Kort presentation',ph:'Skriv din pitch-text...',ta:true},{l:'5 viktigaste kompetenser',ph:'1. \n2. \n3. \n4. \n5. ',ta:true,hint:'Mixa hårda och mjuka.'},{l:'Erfarenhetssammanfattning',ph:'T.ex. 3 år lager hos X, 2 år butik hos Y...',ta:true},{l:'Vilka branscher?',ph:'T.ex. Lager, Handel, Transport...',hint:'Välj 2-4.'}]},
quiz:[{q:'Vad är en digital profil?',o:['Spelkonto','Professionell presentation online','E-post'],c:1},{q:'Varför pitch och profil ihop?',o:['Krav','Enhetligt professionellt intryck','Sparar tid'],c:1},{q:'Viktigaste delarna?',o:['Hobbies','Bild, presentation, styrkor, erfarenhet, kontakt','Vänner'],c:1}],
pr:['Digital profil baserat på min pitch.','Förbättra min presentation.','Vad saknas i min profil: …']}
,{id:'d4',icon:'📧',title:'E-post & professionell kommunikation',sub:'Skriv rätt från dag ett',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Din professionella e-postadress',s:'Din e-postadress är ditt digitala visitkort.\n\n❌ Undvik:\npartyking88@hotmail.com\ncoolboy_hbg@yahoo.com\n\n✅ Använd:\nfornamn.efternamn@gmail.com\nf.efternamn@gmail.com\n\nSkapa via Gmail — gratis och professionellt.',a:'Rekryterare ser din e-post på CV och ansökan. En oprofessionell adress ger dålig första intryck direkt. Gmail är standard i Sverige.'},{t:'Skriv ett professionellt mejl',s:'Struktur för jobbsökar-mejl:\n\n1. Ämnesrad: tydlig och specifik\n"Ansökan — Lagerarbetare ref 2024-456"\n\n2. Hälsning: "Hej [Namn],"\n\n3. Kärna: kort och konkret\n\n4. Avslutning: "Med vänliga hälsningar"\n\n5. Signatur: Namn + telefon',a:'Rekryterare läser mejl snabbt — max 30 sekunder. Ämnesraden avgör om det öppnas. Undvik: slang, för många utropstecken, VERSALER.'},{t:'Hantera inkorgen professionellt',s:'✅ Svara inom 24 timmar\n✅ Kontrollera stavning\n✅ Ha professionell signatur\n✅ Kolla skräppost regelbundet\n\n❌ Svara aldrig i affekt\n❌ Skriv aldrig i versaler',a:'E-postkompetens är undervärderat — rekryterare bedömer din kommunikationsförmåga i varje mejl. Sätt upp telefonnummer i signaturen.'}],
ex:{type:'build',title:'Din professionella mejl-setup',desc:'Skapa och testa din professionella kommunikation.',fields:[{l:'Din professionella e-postadress',ph:'T.ex. anna.karlsson@gmail.com',hint:'Skapa ny om din nuvarande ser oprofessionell ut'},{l:'Skriv en professionell ämnesrad',ph:'T.ex. Ansökan — Undersköterska, Region Skåne, ref 2024-123'},{l:'Din mejl-signatur',ph:'Namn, telefon, LinkedIn (valfritt)'}]},
quiz:[{q:'Vilken e-postadress är mest professionell?',o:['partygirl99@hotmail.com','anna.karlsson@gmail.com','coolguy@yahoo.se','anonymous123@mail.com'],c:1},{q:'Hur snabbt bör du svara på rekryterares mejl?',o:['Inom en vecka','Inom 24 timmar','Spelar ingen roll','Bara om du är intresserad'],c:1},{q:'Vad är viktigast i ämnesraden?',o:['Att den är lång','Tydlig och specifik — tjänst och ref-nr','Att den är kreativ','Börja med Hej'],c:1},{q:'Vad ska en professionell signatur ha?',o:['Bara namn','Namn och telefonnummer','Favoritcitat','Namn, telefon och gärna LinkedIn'],c:3}],
pr:['Skriv ansökningsmejl för [tjänst] till [företag].','Förbättra detta mejl: [klistra in]','Vad ska min mejl-signatur innehålla?']},
{id:'d5',icon:'🔑',title:'BankID & svenska e-tjänster',sub:'Det digitala nyckelsystemet i Sverige',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad är BankID?',s:'BankID är din digitala legitimation i Sverige.\n\nDu använder det för att:\n✅ Logga in på 1177, FK Mina sidor, Skatteverket\n✅ Signera dokument digitalt\n✅ Logga in på din bank\n✅ Ansöka om CSN, A-kassa, bidrag\n\nUtfärdas av din bank — gratis.',a:'BankID finns som app (Mobilt BankID) eller kortläsare. Utan BankID är många myndighetsärenden omöjliga att göra digitalt. Du måste ha ett svenskt personnummer och vara kund i en svensk bank.'},{t:'Viktiga svenska e-tjänster',s:'Med BankID når du:\n\n🏛️ Mina sidor (FK) — sjukpenning, bidrag\n📚 CSN — studiestöd\n🏥 1177 — sjukvård\n📋 Skatteverket — deklaration\n🏢 AF — Arbetsförmedlingen\n\nAktivera din digitala brevlåda på minmeddelanden.se!',a:'Sverige är ett av världens mest digitaliserade länder. Myndigheter kommunicerar via Mina meddelanden. Aktivera din digitala brevlåda — du missar annars viktig post från myndigheter.'},{t:'Digital säkerhet med BankID',s:'⚠️ ALDRIG:\n❌ Använd BankID om någon ringer och ber dig\n❌ Signera saker du inte förstår\n\n✅ ALLTID:\n✅ Du initierar inloggningen själv\n✅ Kontrollera vad du signerar\n\nVid misstanke: Ring banken DIREKT!',a:'BankID-bedrägerier ökar kraftigt. Vanligaste metod: telefonbluff där "banken" ber dig signera. Banker ringer ALDRIG och ber dig använda BankID. Avbryt och ring din bank på officiellt nummer.'}],
ex:{type:'build',title:'Din BankID-checklista',desc:'Säkerställ att du har BankID och vet hur du använder det.',fields:[{l:'Har du BankID? Vilken bank?',ph:'T.ex. Ja, Mobilt BankID via Swedbank / Nej, behöver ordna'},{l:'Vilka e-tjänster behöver du nu?',ph:'T.ex. FK Mina sidor, 1177, AF digitalt...',hint:'Logga in och testa var och en'},{l:'Har du aktiverat digital brevlåda?',ph:'T.ex. Ja via minmeddelanden.se / Nej — gör det nu',hint:'minmeddelanden.se — gratis'},{l:'Vad gör du om du kontaktas om BankID?',ph:'T.ex. Lägger på och ringer banken på officiellt nummer...',ta:true}]},
quiz:[{q:'Vad är BankID?',o:['Ett bankkort','Digital legitimation och signering i Sverige','En bank-app','Ett kreditkort'],c:1},{q:'Vad gör du om någon ringer och ber dig använda BankID?',o:['Gör som de säger om det låter trovärdigt','Lägg på och ring din bank direkt','Signera om det verkar okej','Fråga vad de vill'],c:1},{q:'Var ansöker du om BankID?',o:['Skatteverket','Din svenska bank','Polisen','Posten'],c:1},{q:'Vad är Mina meddelanden?',o:['E-post från vänner','Digital brevlåda för myndighetspost','SMS-tjänst','En app'],c:1}],
pr:['Vilka e-tjänster behöver jag som jobbsökare?','Förklara BankID för någon som aldrig hört talas om det.','Vad gör jag om jag inte har BankID ännu?']},
{id:'d6',icon:'🔍',title:'Söka jobb digitalt',sub:'Platsbanken, AF och jobboarderna',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'De viktigaste jobboarderna',s:'Sverige-specifika:\n🏛️ Platsbanken (AF) — störst, gratis\n💼 LinkedIn Jobs — nätverk + jobb\n🔵 Blocket Jobb — lokala jobb\n⭐ Indeed.se — aggregerar alla\n\nFiltrera ALLTID på ort!\n→ Helsingborg / Skåne',a:'Platsbanken är officiell och kopplad till AF. Alla arbetsgivare med lönestöd måste annonsera där. Indeed aggregerar alla sajter. Sätt upp jobbagenter — de sparar tid.'},{t:'Jobbagenter — din automatiska jobbsökare',s:'En jobbagent = en sökning som körs automatiskt.\n\nSå gör du:\n1. Sök på Platsbanken\n2. Klicka "Spara sökning"\n3. Välj daglig e-post\n4. Upprepa på LinkedIn och Indeed\n\nDu får nya jobb direkt i inkorgen — gratis!\n→ Sätt upp minst 3 agenter idag.',a:'Jobbagenter är ett av de mest underutnyttjade verktygen. Bästa inställning: sök på yrkestitlar, Helsingborg + Skåne. Justera löpande om du får för många/få träffar.'},{t:'Hitta rätt med sökfilter',s:'På Platsbanken, filtrera:\n📍 Ort: Helsingborg, Skåne\n💼 Yrkeskategori\n⏰ Heltid/deltid\n📅 Sista 7 dagarna\n\nSök på kompetensord:\n"truck", "undersköterska", "kundtjänst"\n\n💡 Sök tidigt — många jobb fylls inom 3 dagar!',a:'Platsbanken uppdateras kontinuerligt. Sök på kompetensnyckelord, inte bara titlar. "Truck" hittar alla jobb som nämner truckkompetens oavsett titel.'}],
ex:{type:'build',title:'Din digitala jobbsök-setup',desc:'Sätt upp en komplett digital jobbsökning idag.',fields:[{l:'Vilket yrke söker du? Skriv din sökterm',ph:'T.ex. lagerarbetare, undersköterska, kundtjänst...'},{l:'Har du satt upp jobbagenter? Var?',ph:'T.ex. Ja på Platsbanken och LinkedIn / Nej — gör det nu',hint:'Gör det nu — tar 5 min!'},{l:'Vilka 3 jobboarder ska du använda?',ph:'T.ex. Platsbanken, LinkedIn, Blocket Jobb'},{l:'Söktaktik — hur ofta och när?',ph:'T.ex. Kolla inkorgen varje morgon, ansök direkt vid match'}]},
quiz:[{q:'Vilken jobboard är störst och gratis i Sverige?',o:['LinkedIn','Platsbanken (AF)','Indeed','Monster'],c:1},{q:'Vad är en jobbagent?',o:['En person som söker jobb åt dig','Automatisk sökning som mailar nya jobb','En rekryterare','En app'],c:1},{q:'Hur snabbt bör du söka ett jobb du hittar?',o:['Vänta och tänk','Inom 3 dagar — många fylls snabbt','Samla och sök på fredag','Spelar ingen roll'],c:1},{q:'Vilket filter är viktigast på Platsbanken?',o:['Lön','Ort — annars drunknar du i annonser','Arbetsgivare','Publikationsdatum'],c:1}],
pr:['Hitta 5 bästa jobben för [yrke] i Helsingborg.','Hur sätter jag upp jobbagent på Platsbanken?','Vilken sökterm ger bäst träffar för [yrke]?']},
{id:'d7',icon:'🎥',title:'Digitala möten & videointervjuer',sub:'Se professionell ut på skärm',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Teams, Zoom och Google Meet',s:'De tre vanligaste:\n\n🔵 Microsoft Teams — vanligast i företag & myndigheter\n🟢 Zoom — vanligt vid rekrytering\n🔴 Google Meet — gratis, via Gmail\n\nAlla fungerar likadant:\n1. Klicka på länken du fått\n2. Testa mikrofon + kamera\n3. Delta\n\nLadda ner appen i förväg!',a:'Teams är standard i svenska myndigheter och större företag. Zoom dominerar i rekrytering. Du behöver inga konton för att delta — länken räcker. Men skapa konto om du ska ringa själv.'},{t:'Se professionell ut på skärm',s:'Bakgrund:\n✅ Neutral, ren vägg\n✅ Virtuell bakgrund\n❌ Rörig bakgrund\n\nBelysning:\n✅ Ljus FRAMFÖR dig\n❌ Fönster BAKOM dig\n\nKamera:\n✅ Ögonhöjd (laptop på böcker)\n❌ Nederifrån\n\nKlä överkroppen som till intervju!',a:'Belysning och bakgrund påverkar första intrycket lika mycket som klädsel. Med fönster bakom dig syns bara en siluett. En lampa framför ansiktet kostar 150-300 kr och gör stor skillnad. Testa alltid 10 min innan.'},{t:'Tekniska förberedelser',s:'Dagen innan:\n✅ Testa länken\n✅ Ladda enheten\n✅ Kontrollera internet\n\n15 min innan:\n✅ Stäng andra program\n✅ Stäng av notiser\n✅ Ha vatten nära\n✅ Ha anteckningar framme\n\n💡 Ring in 3-5 min tidigt!',a:'Tekniska problem är vanligaste orsaken till stress i digitala intervjuer. Ha alltid telefonnumret till rekryteraren redo — om tekniken fallerar ringer du in direkt. Stäng fönster och informera hushållsmedlemmar om bakgrundsljud.'}],
ex:{type:'build',title:'Din digitala intervju-setup',desc:'Förbered din tekniska setup för digitala möten.',fields:[{l:'Vilken enhet använder du?',ph:'T.ex. Laptop, telefon, surfplatta...'},{l:'Hur ser bakgrunden bakom dig ut?',ph:'T.ex. Neutral vägg / rörig — behöver rensas / virtuell bakgrund',hint:'Testa via kameran nu!'},{l:'Hur är belysningen framför dig?',ph:'T.ex. Fönster framför / lampa / mörkt — behöver fixas',hint:'Ljus framför = professionellt'},{l:'Din checklista — 3 saker att göra innan nästa möte',ph:'1. Testa länken\n2. Ladda enheten\n3. Stäng notiser',ta:true}]},
quiz:[{q:'Vilket program är vanligast i svenska myndigheter?',o:['Zoom','Skype','Microsoft Teams','Google Meet'],c:2},{q:'Var ska ljuskällan vara?',o:['Bakom dig','Vid sidan','Framför dig','Under dig'],c:2},{q:'Hur tidigt bör du ansluta till digital intervju?',o:['Precis i tid','3-5 min tidigt','10 min tidigt','Spelar ingen roll'],c:1},{q:'Tekniken fallerar under intervjun — vad gör du?',o:['Hoppas det löser sig','Ring rekryteraren direkt','Avbryt och mejla','Vänta tålmodigt'],c:1}],
pr:['Checklista för digitala intervjuer.','Hur installerar jag Teams/Zoom?','Tips för att se professionell ut på videomöte.']},
{id:'d8',icon:'💻',title:'Office & produktivitetsverktyg',sub:'Word, Excel och Google — gratis alternativ',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Microsoft Office vs Google Workspace',s:'Microsoft Office:\n• Word, Excel, PowerPoint\n• Standard på arbetsplatser\n• Office Online gratis på office.com\n• Microsoft 365 — gratis via biblioteket!\n\nGoogle Workspace:\n• Docs, Sheets, Slides\n• 100% gratis med Gmail\n• Sparas automatiskt i molnet',a:'Kompatibilitet: Google Docs exporterar till .docx utan problem. Office Online är identiskt med skrivbordsversionen för de flesta uppgifter. Biblioteket i Helsingborg ger gratis tillgång till datorer och Office.'},{t:'Word för CV och personligt brev',s:'Grunderna:\n\n📏 Marginaler: 2,5 cm\n🔤 Teckensnitt: Arial eller Calibri, storlek 11-12\n📄 Spara som PDF innan du skickar!\n\nGratis CV-mallar:\n• canva.com\n• Microsoft mallbibliotek\n• CVmatchen-appen',a:'PDF är standard att skicka CV i — det ser likadant ut på alla enheter. Word-filer kan se annorlunda ut beroende på mottagarens version. Filnamnet: CV_Förnamn_Efternamn.pdf'},{t:'Excel och enkla kalkylark',s:'Du behöver kalkylark för:\n📊 Budgetera ekonomin\n📋 Spåra jobbansökningar\n📅 Planera veckan\n\nGrunder:\n• Celler, rader, kolumner\n• =SUM(A1:A10) för summering\n• Filtrera och sortera\n\n💡 YouTube: "Excel nybörjare" — allt på 20 min!',a:'Excel-grundkunskaper nämns i ca 30% av kontorsjobb. Google Sheets fungerar identiskt och är gratis. GCFGlobal.org erbjuder gratis interaktiva Excel-kurser.'}],
ex:{type:'sort',title:'Microsoft Office eller Google?',desc:'Sortera rätt!',catA:'Microsoft Office',catB:'Google Workspace (gratis)',items:[{l:'Word — ordbehandling',c:'A'},{l:'Google Docs',c:'B'},{l:'Excel',c:'A'},{l:'Google Sheets',c:'B'},{l:'Kräver licens',c:'A'},{l:'Sparas automatiskt i molnet',c:'B'},{l:'Standard på arbetsplatser',c:'A'},{l:'Fungerar direkt i webbläsaren',c:'B'}]},
quiz:[{q:'Vilket format skickar du CV i?',o:['Word (.docx)','PDF','Excel','Bild (.jpg)'],c:1},{q:'Var kan du använda Office gratis?',o:['Kan inte','office.com och biblioteket','Bara med studentlicens','Aldrig gratis'],c:1},{q:'Vilken Excel-formel summerar A1 till A10?',o:['=ADD(A1,A10)','=SUM(A1:A10)','=TOTAL(A1-A10)','=COUNT(A1:A10)'],c:1},{q:'Googles gratis alternativ till Word?',o:['Google Word','Google Write','Google Docs','Google Text'],c:2}],
pr:['Hur skapar jag CV i Google Docs?','Grundläggande Excel-formler jag bör kunna.','Hur exporterar jag Google Docs till PDF?']},
{id:'d9',icon:'🔐',title:'Integritet & lösenordssäkerhet',sub:'Skydda dig själv online',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Starka lösenord',s:'❌ Svaga:\npassword123\nkatt\nförnamn+födelseår\n\n✅ Starka:\nMinst 12 tecken\nBland bokstäver, siffror, symboler\nUnikt per sajt\n\n💡 Använd en lösenordshanterare!\nBitwarden — gratis och säker\nGoogle Password Manager — inbyggt i Chrome',a:'Lösenordsåteranvändning är vanligaste orsaken till konto-intrång. 81% av dataintrång beror på svaga lösenord. En lösenordshanterare skapar och sparar unika lösenord automatiskt.'},{t:'Tvåstegsverifiering (2FA)',s:'2FA = extra säkerhetslager.\n\n1. Skriv lösenord\n2. Få en kod via SMS eller app\n3. Kontot säkert även om lösenordet är läckt\n\nAktivera på:\n✅ Gmail\n✅ LinkedIn\n✅ Bank-tjänster\n✅ AF och myndigheter\n\nGratis — tar 5 minuter!',a:'SMS-koder är bäst i praktiken. Om ditt LinkedIn-konto hackas kan rekryterare kontaktas i ditt namn. Med 2FA är det näst intill omöjligt. Google Authenticator är ännu säkrare än SMS.'},{t:'Phishing & bedrägerier',s:'Phishing = falska mejl/SMS som ser äkta ut.\n\nVarningssignaler:\n⚠️ Brådska ("Agera inom 24h!")\n⚠️ Felstavad avsändare\n⚠️ Begär lösenord eller BankID\n⚠️ Konstiga bilagor\n\nKontrollera alltid avsändarens mejladress!',a:'Vanligaste bluffar: falska Postnord-SMS, Skatteverket-mejl, Klarna-bluffar. Myndigheter ber ALDRIG om lösenord via mejl. Rapportera misstänkta mejl till CERT.se.'}],
ex:{type:'build',title:'Din digitala säkerhets-checklista',desc:'Säkra dina viktigaste konton.',fields:[{l:'Har du 2FA på Gmail/e-post?',ph:'T.ex. Ja / Nej — aktiverar nu',hint:'Gör det nu — tar 5 min!'},{l:'Använder du samma lösenord på flera sajter?',ph:'T.ex. Ja / Nej / Använder Bitwarden'},{l:'Hur känner du igen phishing-mejl?',ph:'T.ex. Kontrollerar avsändarens adress, hovrar över länken...',ta:true},{l:'Vilka 3 konton är viktigast att säkra?',ph:'T.ex. Gmail, LinkedIn, AF-profilen',hint:'Sätt 2FA på alla tre!'}]},
quiz:[{q:'Bästa sättet att hantera lösenord?',o:['Samma lösenord överallt','Lösenordshanterare med unika per sajt','Skriva upp på lapp','Använda födelsedag'],c:1},{q:'Vad är 2FA?',o:['Lösenord med 2 ord','Tvåstegsverifiering — extra säkerhetskod','Två separata konton','En typ av BankID'],c:1},{q:'Vad gör du med ett misstänkt mejl?',o:['Klickar på länken för att kolla','Svarar och frågar','Kontrollerar avsändarmejlen och raderar vid tvekan','Ignorerar'],c:2},{q:'Vilka myndigheter ber om lösenord via mejl?',o:['Skatteverket ibland','FK alltid','Inga — myndigheter ber ALDRIG om det','Bara AF'],c:2}],
pr:['Hur sätter jag upp 2FA på Gmail?','Rekommendera gratis lösenordshanterare.','Hur känner jag igen phishing-bluffar?']},
{id:'d10',icon:'📱',title:'Smartphone & appar för jobbet',sub:'Ditt mobilkontor i fickan',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Måste-appar för jobbsökare',s:'Jobbsök:\n• Arbetsförmedlingen-appen\n• LinkedIn\n• Indeed\n\nMyndigheter:\n• Mitt FK (Försäkringskassan)\n• 1177\n• Skatteverket\n\nKommunikation:\n• Gmail\n• Teams eller Zoom\n\nEkonomi:\n• Din banks app\n• Swish',a:'Alla myndigheters appar är gratis. AF-appen låter dig svara på aktiviteter direkt. FK-appen visar utbetalningar och ärenden realtid. Installera dem proaktivt — inte i en kris.'},{t:'Håll mobilen jobbredo',s:'Professionell röstbrevlåda:\n"Hej, du har nått [Namn]. Lämna ett meddelande."\n\nNotiser på:\n✅ E-post: direkt\n✅ LinkedIn: viktiga meddelanden\n✅ AF-appen: aktiviteter\n\n💡 Kontrollera att ditt telefonnummer stämmer på CV!',a:'Röstbrevlåda är underskattat — rekryterare lämnar meddelanden om du inte svarar. En professionell hälsning signalerar seriösitet. Svara alltid inom 2 timmar om möjligt.'},{t:'Gratis Wi-Fi och dataspara smart',s:'Gratis Wi-Fi:\n📚 Biblioteket Helsingborg — bäst!\n🏢 Arbetsförmedlingen\n☕ McDonald\'s, Espresso House\n\n⚠️ Undvik bankärenden på öppet Wi-Fi!\n\n💡 Biblioteket = gratis dator, Wi-Fi och skrivare för CV!',a:'Biblioteket i Helsingborg är ett av de bästa resurserna för jobbsökare utan dator hemma. Öppet vardagar — gratis utskrift av CV. Undvik bank och BankID på öppna Wi-Fi-nät.'}],
ex:{type:'build',title:'Din mobilsetup för jobbet',desc:'Gör telefonen till ett professionellt verktyg.',fields:[{l:'Vilka jobbsökar-appar har du?',ph:'T.ex. LinkedIn, AF-appen — saknar: Mitt FK',hint:'Installera de du saknar nu!'},{l:'Har du professionell röstbrevlåda?',ph:'T.ex. Ja / Nej — spelar in en nu',hint:'Testa: ring ditt eget nummer'},{l:'Var hittar du gratis Wi-Fi nära dig?',ph:'T.ex. Stadsbiblioteket, AF-kontoret, McDonald\'s centralen'},{l:'Stämmer ditt telefonnummer på LinkedIn och CV?',ph:'T.ex. Ja +46 70-XXX / Nej — uppdaterar nu',hint:'Rekryterare ringer — de måste nå dig!'}]},
quiz:[{q:'Vilken app ger info om AF-aktiviteter?',o:['LinkedIn','Arbetsförmedlingen-appen','Skatteverket','Gmail'],c:1},{q:'Var hittar du gratis dator och Wi-Fi i Helsingborg?',o:['AF-kontoret','Stadsbiblioteket','McDonald\'s','Alla stämmer'],c:1},{q:'Varför är professionell röstbrevlåda viktigt?',o:['Det är det inte','Rekryterare lämnar meddelanden om du inte svarar','Lagstadgat','Syns på CV'],c:1},{q:'Vad ska du undvika på öppet Wi-Fi?',o:['Streama video','Bank- och känsliga inloggningar utan VPN','Använda LinkedIn','Ladda ner appar'],c:1}],
pr:['Vilka appar behöver jag som jobbsökare i Sverige?','Hur sätter jag upp röstbrevlåda?','Var hittar jag gratis resurser för jobbsök i Helsingborg?']},
{id:'d11',icon:'🤖',title:'AI-verktyg i jobbet',sub:'Använd AI som en superkraft',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad kan AI göra för dig?',s:'AI hjälper dig:\n\n📄 Förbättra CV och brev\n🔍 Förklara jobbannonser\n💬 Träna intervjusvar\n📧 Skriva professionella mejl\n🌍 Översätta dokument\n\nGratis via claude.ai eller chatgpt.com',a:'AI ersätter inte din personlighet — det förstärker din förmåga att kommunicera. Arbetsgivare värdesätter äkta svar. Granska alltid det AI producerar.'},{t:'Bra prompts = bra resultat',s:'Dålig:\n"Hjälp mig med CV"\n\nBra:\n"Jag söker lagerarbetare i Helsingborg. 3 år PostNord, truck A+B, WMS. Förbättra min profiltext — max 4 meningar."\n\nFormeln: Vem + Vad + Mål',a:'Specifika prompts med kontext ger alltid bättre svar. Berätta yrke, stad, erfarenhet och vad du vill ha hjälp med.'},{t:'AI och äkthet',s:'AI är verktyg — inte din röst.\n\n✅ Rätt:\n1. Skriv ditt utkast\n2. Be AI förbättra\n3. Justera till din stil\n\n❌ Fel:\nKopiera rakt av utan att läsa\n\nDin personlighet ska synas!',a:'AI-text är ofta överdrivet formell och saknar specifika detaljer. Granska alltid: stämmer fakta? Låter det som du? Lägg till egna exempel och siffror.'}],
ex:{type:'build',title:'Din AI-verktygslåda',desc:'Träna på att använda AI för ditt jobbsök.',fields:[{l:'Vilket jobb söker du?',ph:'T.ex. Lagerarbetare Helsingborg, 3 år PostNord, truck A+B',hint:'Skriv detta — det är din AI-prompt!'},{l:'Skriv en prompt för din profiltext',ph:'T.ex. Förbättra min profiltext för lagerarbetare med...',ta:true,hint:'Specifik = bättre svar'},{l:'Vilka 3 AI-verktyg testar du?',ph:'T.ex. claude.ai, chatgpt.com, Google Translate',hint:'Alla gratis'}]},
quiz:[{q:'Vad är AI bäst på?',o:['Ersätta erfarenheter','Förbättra text du skrivit','Söka jobb åt dig','Skapa falskt CV'],c:1},{q:'Vad gör en bra prompt?',o:['Kort och vag','Specifik med yrke, stad, erfarenhet och mål','Så lång som möjligt','Börjar med Hej AI'],c:1},{q:'Vad ska du alltid göra med AI-text?',o:['Skicka direkt','Läsa och justera till din stil','Ta bort AI-ord','Fråga arbetsgivaren'],c:1},{q:'Var hittar du gratis AI?',o:['Måste köpa','claude.ai och chatgpt.com','Bara via arbetsgivaren','Biblioteket'],c:1}],
pr:['Förbättra min profiltext: [klistra in + yrke + stad]','Hjälp mig träna: Berätta om dig själv.','Förklara denna annons: [klistra in]']},
{id:'d12',icon:'📸',title:'Sociala medier & arbetsgivarbilden',sub:'Vad ser de när de googlar dig?',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Arbetsgivare googlar dig — alltid',s:'70% av rekryterare i Sverige googlar kandidater.\n\nDe ser:\n📸 Instagram (om publikt)\n🔵 Facebook\n🐦 X/Twitter\n📹 TikTok\n\nDu kan inte ta bort Google-träffar — men du kan kontrollera vad de hittar.',a:'Digitalt fotavtryck lever länge. Bilder du lade upp för 10 år sedan kan synas. Googla ditt namn nu — det är samma bild rekryteraren ser.'},{t:'Vad skadar och hjälper?',s:'Skadar:\n❌ Fest-bilder\n❌ Stötande kommentarer\n❌ Klagomål på ex-arbetsgivare\n\nHjälper:\n✅ Professionell LinkedIn\n✅ Branschrelaterade inlägg\n✅ Rekommendationer',a:'57% av rekryterare har hittat innehåll som påverkat beslutet negativt. LinkedIn är det enda sociala mediet som alltid hjälper.'},{t:'Hantera din profil proaktivt',s:'Gör nu:\n1. Googla ditt namn\n2. Privatisera Instagram och Facebook\n3. Ta bort gamla stötande bilder\n4. Uppdatera LinkedIn\n5. Lägg upp professionellt foto\n\n💡 Ditt namn på Google ska leda till LinkedIn!',a:'Du kan begära borttagning av Google-resultat via deras formulär (GDPR). LinkedIn är det enda sociala mediet rekryterare aktivt söker på.'}],
ex:{type:'build',title:'Din digitala ryktesanalys',desc:'Kontrollera vad arbetsgivare ser.',fields:[{l:'Googla ditt namn — vad hittar du?',ph:'T.ex. LinkedIn, gammal blogg...',ta:true,hint:'Gör det nu!'},{l:'Vad behöver privatas eller tas bort?',ph:'T.ex. Instagram: göra privat / Facebook: ta bort gamla bilder',ta:true},{l:'Vad lägger du till?',ph:'T.ex. Uppdatera LinkedIn-bild, dela ett branschinlägg'},{l:'Ditt mål: Vad ska Google visa?',ph:'T.ex. LinkedIn som första träff'}]},
quiz:[{q:'Hur många rekryterare googlar?',o:['10%','30%','70%','5%'],c:2},{q:'Vad hjälper mest digitalt?',o:['Många Instagram-följare','Professionell LinkedIn','Aktiv Twitter','Stor Facebook-vänkrets'],c:1},{q:'Vad gör du med stötande gamla bilder?',o:['Låta vara','Ta bort dem nu','Hoppas ingen ser','Lägga upp fler nya'],c:1},{q:'Ditt namn på Google ska leda till?',o:['Ingenting','LinkedIn-profilen som första träff','Facebook','TikTok'],c:1}],
pr:['Städa min digitala profil steg för steg.','Vad delar jag på LinkedIn för [bransch]?','Hur privatiserar jag Instagram?']},
{id:'d13',icon:'🌐',title:'Digitalt CV & portfolio',sub:'Synas online utöver LinkedIn',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Varför ett digitalt CV?',s:'Fördelar:\n✅ Alltid tillgängligt — dela en länk\n✅ Kan ha video och projekt\n✅ Visar digital kompetens\n✅ Sticker ut bland papper-CV\n\nEnklast:\n• LinkedIn (du har redan!)\n• Canva.com — gratis mallar\n• Google Sites — gratis hemsida',a:'Digitalt CV är standard i IT och kreativa yrken. Inom lager och vård är det ovanligt men positivt. En QR-kod på papper-CV som leder till LinkedIn är ett enkelt mellansteg.'},{t:'Bygg CV med Canva',s:'canva.com — gratis:\n1. Skapa konto med Gmail\n2. Sök CV i mallar\n3. Välj professionell mall\n4. Fyll i uppgifter\n5. Ladda ner som PDF\n\n✅ Neutral färg\n✅ Max 1 sida\n✅ Tydliga rubriker',a:'Canva är enklast för proffssiga CV utan grafikkompetens. Exportera alltid som PDF. Undvik: för färgglada templates och konstiga typsnitt.'},{t:'QR-kod till LinkedIn',s:'Lägg QR-kod på papper-CV:\n1. Gå till qr-code-generator.com\n2. Klistra in din LinkedIn-URL\n3. Ladda ner QR-koden\n4. Lägg längst ner på CV\n\nRekryteraren skannar → direkt till din LinkedIn.\nGratis, tar 5 minuter!',a:'QR-koder på CV ökar i Sverige. Alternativ: skriv LinkedIn-URL tydligt under kontaktuppgifterna — lika effektivt.'}],
ex:{type:'build',title:'Bygg ditt digitala CV',desc:'Skapa ett professionellt digitalt CV.',fields:[{l:'Har du Canva-konto?',ph:'T.ex. Ja / Nej — skapar ett nu med Gmail',hint:'Gratis med Gmail'},{l:'Vilken CV-mall väljer du?',ph:'T.ex. Minimalistisk marinblå med tydliga rubriker',hint:'Neutral och professionell'},{l:'Är din LinkedIn-URL anpassad?',ph:'T.ex. linkedin.com/in/anna-karlsson',hint:'Ändra: Inställningar > Offentlig profil'},{l:'Vad lägger du till som sticker ut?',ph:'T.ex. QR-kod till LinkedIn'}]},
quiz:[{q:'Vad är fördelen med digitalt CV?',o:['Snyggare','Alltid tillgängligt och visar digital kompetens','Arbetsgivare kräver det','Snabbare'],c:1},{q:'Enklaste verktyget för CV?',o:['Adobe InDesign','Publisher','Canva.com — gratis','Photoshop'],c:2},{q:'Vilket format skickar du CV i?',o:['Word','PDF','Excel','Bild'],c:1},{q:'Vad gör QR-koden på CV?',o:['Ser tekniskt ut','Länkar till LinkedIn direkt vid skanning','Obligatorisk trend','Tar för mycket plats'],c:1}],
pr:['Granska mitt CV: [klistra in] — ge 5 förslag.','Canva-mall för [yrke]?','Hur skriver jag LinkedIn-URL på CV?']},
{id:'d14',icon:'📚',title:'Onlinekurser & kompetensutveckling',sub:'Lär dig nytt — gratis och på distans',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Gratis plattformar med certifikat',s:'Bästa gratis:\n\n🟢 Google Career Certificates — jobbrelevanta\n🔵 Coursera — välj "audit" för gratis\n🟡 LinkedIn Learning — 1 mån gratis\n🔴 YouTube — allt finns här\n🇸🇪 UR.se — svenska kurser\n🌐 GCFGlobal.org — Office och matte',a:'Google Career Certificates är designade för att leda direkt till anställning. Google samarbetar med tusentals arbetsgivare. Kurser: IT-support, Dataanalys, Projektledning. Slutförs på 3-6 månader deltid.'},{t:'Vad ska du lära dig?',s:'Mest efterfrågat 2024:\n\n💻 IT-support\n📊 Excel & dataanalys\n🔐 Cybersäkerhet\n📱 Sociala medier\n🤖 AI-verktyg\n\nTips: Kolla 5 jobbannonser du vill ha → Vad nämns mest?',a:'Branschen avgör vad du bör lära dig. Lager: WMS, SAP. Vård: journalsystem. IT: Python, SQL. Identifiera luckan och fyll den med en kurs.'},{t:'Planera lärandet',s:'30 min/dag = 3,5 tim/vecka.\n1 certifikat per månad är möjligt!\n\n✅ Anteckna och testa direkt\n✅ Lägg certifikat på LinkedIn\n\n💡 Kvällarna är bäst!\n\nKombinera kurs + praktik + CV = maxeffekt!',a:'30-minuters sessioner med aktivt testande är effektivare än 3-timmarsmaraton. Sätt ett mål: Klart certifikat till [datum].'}],
ex:{type:'build',title:'Din kompetensplan',desc:'Identifiera luckan och planera kursen.',fields:[{l:'Vilken kompetens saknar du?',ph:'T.ex. Excel, SAP, IT-support...',hint:'Kolla 5 jobbannonser!'},{l:'Vilken kurs börjar du med?',ph:'T.ex. Google IT-support via Coursera'},{l:'Hur många timmar/vecka?',ph:'T.ex. 30 min varje kväll = 3,5 tim/vecka',hint:'30 min/dag räcker!'},{l:'Ditt deadline',ph:'T.ex. Klart 1 juni — lägger på LinkedIn direkt',hint:'Sätt datum nu!'}]},
quiz:[{q:'Vilket certifikat är mest arbetsmarknadsnära?',o:['Harvard Online','Google Career Certificates','Khan Academy','YouTube-kurs'],c:1},{q:'Hur lång studiesession?',o:['3 timmar','30 minuter med aktivt lärande','Hela dagen','Spelar ingen roll'],c:1},{q:'Var lägger du certifikatet?',o:['I en mapp','LinkedIn — Licenser och certifikat','Skriver ut','Berättar i intervjun'],c:1},{q:'Hur hittar du vilken kompetens du saknar?',o:['Gissar','Kollar 5 jobbannonser du vill ha','Frågar vänner','Tar billigaste kursen'],c:1}],
pr:['Rekommendera kurs för [yrke].','Studieplan för IT-support 3 månader?','Hur lägger jag till certifikat på LinkedIn?']},
{id:'d15',icon:'✍️',title:'Digitala kontrakt & e-signering',sub:'Förstå och signera digitalt',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad är ett digitalt kontrakt?',s:'Digitala kontrakt är juridiskt bindande i Sverige.\n\nDu signerar med:\n✅ BankID — vanligast\n✅ Scrive eller DocuSign\n\nAnställningskontrakt innehåller:\n• Arbetstid och lön\n• Prövotid (6 mån vanligt)\n• Uppsägningstid\n• Arbetsuppgifter',a:'Anställningsavtal ska vara skriftliga — be alltid om ett. Muntliga avtal gäller men är svåra att bevisa. BankID-signering är lika juridiskt bindande som penna på papper.'},{t:'Läs INNAN du signerar',s:'Kontrollera:\n\n💰 Lön: stämmer det vi kom överens om?\n⏰ Arbetstid: heltid/deltid?\n📅 Prövotid: hur lång?\n📢 Uppsägning: hur många månader?\n🏖️ Semester: 25 dagar = lag\n\nFråga om allt du inte förstår!',a:'Prövotid: arbetsgivaren kan avsluta utan skäl. 6 månader är standard. Sverige har ingen minimilön — kollektivavtal styr. Kolla ob-tillägg, övertid och friskvård.'},{t:'BankID-signering i praktiken',s:'1. Du får länk via e-post\n2. Öppnar dokumentet\n3. Läser noggrant\n4. Klickar Signera\n5. BankID öppnas\n6. Du godkänner i appen\n7. Kopia till din e-post\n\nSpara alltid en kopia!',a:'Signerat = bindande. Du kan inte ångra utan att bryta avtalet. Om något verkar fel — fråga innan du signerar. Du har rätt att be om betänketid.'}],
ex:{type:'build',title:'Din kontraktschecklista',desc:'Granska anställningskontrakt steg för steg.',fields:[{l:'Lön och arbetstid i kontraktet?',ph:'T.ex. 28 500 kr/mån, heltid 40 tim/vecka',hint:'Stämmer det ni kom överens om?'},{l:'Hur lång är prövotiden?',ph:'T.ex. 6 månader — standard',hint:'6 månader är standard'},{l:'Uppsägningstid?',ph:'T.ex. 1 månad från vardera sidan',hint:'Minst 1 månad = lag'},{l:'Vad frågar du om?',ph:'T.ex. Ob-tillägg? Friskvård? Övertid?',ta:true,hint:'Din rätt att fråga!'}]},
quiz:[{q:'Är digitala kontrakt bindande?',o:['Nej','Ja — BankID-signering gäller i lag','Bara stora summor','Beror på arbetsgivaren'],c:1},{q:'Vad gör du INNAN signering?',o:['Signerar snabbt','Läser noggrant och frågar om allt','Skannar','Frågar vänner'],c:1},{q:'Normal prövotid i Sverige?',o:['3 månader','6 månader','1 år','12 månader'],c:1},{q:'Vad om du inte förstår ett villkor?',o:['Signerar ändå','Frågar arbetsgivaren — du har rätt till betänketid','Googlar','Struntar i det'],c:1}],
pr:['Förklara detta villkor: [klistra in]','Vad kollar jag i anställningskontrakt?','Är denna prövotid rimlig?']},
{id:'d16',icon:'💸',title:'Digitala betalningar & fällorna',sub:'Swish, Klarna och köp nu betala sen',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Swish — Sveriges betalningsapp',s:'Swish är standard i Sverige.\n\nAnvänds för:\n✅ Betala privatpersoner\n✅ Marknader och småbutiker\n\n⚠️ Bedrägerier:\n❌ Swisha aldrig för att bekräfta konto\n❌ Acceptera inte betalning du inte begärt\n\nSwish = omedelbart och oåterkalleligt!',a:'Swish-bedrägerier ökar kraftigt. Vanligaste: okänd person "felswistar" och ber om tillbaka. Pengarna de skickade är stulna. Kontakta bank omedelbart vid misstanke.'},{t:'Klarna och köp nu betala sen',s:'Klarna:\n✅ Smidigt att dela betalning\n⚠️ Men:\n❌ Ränta vid utebliven betalning\n❌ Påverkar kreditvärdighet\n❌ Lätt att köpa mer än du har råd\n\nRegeln: Har du inte råd nu? Ha inte råd sen heller!\n\nAnvänd bara Klarna om du kan betala direkt.',a:'Kronofogden tar emot fler ansökningar kopplat till BNPL. Om du missat betalning — kontakta Klarna direkt innan inkasso.'},{t:'Trygg näthandel',s:'✅ Köp hos kända sajter\n✅ Kontrollera https://\n✅ Läs Trustpilot-omdömen\n✅ Betala med kort (ångersrätt)\n✅ Spara kvitton\n\n❌ Obekanta sajter\n❌ För bra för att vara sant\n❌ Betala med presentkort',a:'Konsumentköplagen: 14 dagars ångerrätt vid distansköp. Kortbetalning ger chargeback-möjlighet vid bedrägerier. PayPal ger liknande skydd.'}],
ex:{type:'sort',title:'Säkert eller riskabelt?',desc:'Sortera situationerna rätt.',catA:'Säkert',catB:'Riskabelt',items:[{l:'Swisha ett belopp ni kommit överens om',c:'A'},{l:'Acceptera swish från okänd som säger sig felswistat',c:'B'},{l:'Klarna om du kan betala direkt ändå',c:'A'},{l:'Klarna för att ha råd med något du inte har råd med',c:'B'},{l:'Handla på välkänd sajt med https://',c:'A'},{l:'Betala med presentkort till okänd säljare',c:'B'},{l:'Läsa Trustpilot innan köp',c:'A'},{l:'Klicka "du har vunnit ett pris"-länk',c:'B'}]},
quiz:[{q:'Vad är unikt med Swish-betalningar?',o:['Kan ångras 24h','Omedelbart och oåterkalleligt','Tar 3 dagar','Säkrare än kort'],c:1},{q:'Klarnas största risk?',o:['Dyrt','Lätt köpa mer än du har råd + ränta vid miss','Dålig app','Bara iPhone'],c:1},{q:'Ångerrätt vid nätköp?',o:['3 dagar','14 dagar','30 dagar','7 dagar'],c:1},{q:'Swish-bedrägeri — vad gör du?',o:['Swishar tillbaka','Kontaktar banken omedelbart','Ignorerar','Polisanmäler nästa dag'],c:1}],
pr:['Skydda mig mot Swish-bedrägerier.','Missad Klarna-betalning — vad händer?','Konsumenträttigheter vid näthandel i Sverige?']},
{id:'d17',icon:'🏛️',title:'Myndigheternas digitala tjänster',sub:'Allt du kan göra hemifrån',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Arbetsförmedlingen digitalt',s:'På af.se och AF-appen:\n\n✅ Se din aktivitetsplan\n✅ Rapportera jobbsök\n✅ Boka möten\n✅ Se handläggarens meddelanden\n\nLogga in med BankID.\nUppdatera regelbundet — handläggaren ser allt!',a:'AF:s digitala system heter Mina sidor. Aktivitetsrapportering krävs för ersättning. Appen fungerar bra på mobil — sätt på notiser.'},{t:'Försäkringskassan digitalt',s:'På fk.se och Mitt FK-appen:\n\n✅ Sjukanmälan dag 1\n✅ Se utbetalningar\n✅ Ansök om bidrag\n✅ Ladda upp intyg\n✅ Chatta med handläggare\n\n⚠️ Sjukanmälan SAMMA dag — annars riskerar du ersättning!',a:'FK hanterar ca 50 förmåner. De flesta ansökningar görs digitalt. Sjukanmälan dag 1 är krav.'},{t:'Skatteverket & deklaration',s:'skatteverket.se:\n\n✅ Deklarera — deadline 2 maj\n✅ Se skattsedel\n✅ Ändra skattejämkning\n✅ Ansök om ID-kort\n\nDeklaration med BankID:\n→ Öppna appen\n→ Godkänn\n→ Klart på 30 sekunder!',a:'Deklarationen är ifylld automatiskt för anställda. Kontrollera att alla inkomster stämmer. Deklarerar du inte = skattetillägg.'}],
ex:{type:'build',title:'Din myndighetsdigitala checklista',desc:'Kolla att du är inloggad rätt.',fields:[{l:'Inloggad på AF Mina sidor?',ph:'T.ex. Ja / Nej — loggar in nu',hint:'af.se → BankID'},{l:'Har du Mitt FK-appen?',ph:'T.ex. Ja / Nej — laddar ner nu',hint:'Gratis i App Store och Google Play'},{l:'Vet du hur du rapporterar jobbsök?',ph:'T.ex. Ja, via Mina sidor / Nej — frågar handläggaren'},{l:'Deklarationens deadline?',ph:'T.ex. 2 maj varje år',hint:'2 maj — missa inte!'}]},
quiz:[{q:'Vad gör du på AF Mina sidor?',o:['Söker jobb där','Rapporterar aktiviteter och jobbsök regelbundet','Bara tittar','Betalar avgift'],c:1},{q:'Sjukanmälan till FK — när?',o:['Nästa dag','Samma dag du är sjuk','Inom 3 dagar','Spelar ingen roll'],c:1},{q:'Deklarationsdeadline?',o:['1 april','2 maj','30 juni','31 december'],c:1},{q:'Vad behöver du för att logga in på myndighetssajter?',o:['Personnummer','BankID','E-post','Lösenord'],c:1}],
pr:['Hur rapporterar jag jobbsök på AF?','Vad ansöker jag om på FK om jag förlorar jobbet?','Hur ändrar jag skattejämkning?']},
{id:'d18',icon:'💬',title:'Digital kommunikation i arbetslivet',sub:'Slack, Teams och arbetslivets spelregler',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Verktyg du möter på jobbet',s:'Vanligaste:\n\n🔵 Microsoft Teams — möten, chatt, filer\n🟢 Slack — tech och startups\n📧 E-post — formella ärenden\n📱 WhatsApp — många mindre arbetsplatser\n\nDe flesta arbetsplatser har ett huvudverktyg — fråga i onboardingen!',a:'Teams har 300+ miljoner aktiva användare. Slack dominerar i tech. Grundprincipen är densamma: snabb chatt, möten och fildelning på ett ställe. Kan du Teams lär du dig Slack på en dag.'},{t:'Ton och etik i digital kommunikation',s:'✅ Svara inom 2-4 timmar\n✅ Skriv kortfattat och tydligt\n✅ Rätt kanal: chatt vs e-post\n\n❌ Skriv inte i affekt\n❌ VERSALER = skrika\n❌ Dela inte känslig info okrypterat',a:'Digital kommunikation missförstås lättare — emojis och ton är avgörande. En "bra." med punkt kan uppfattas som sarkasm. När tveksam: ring istället.'},{t:'Dela filer professionellt',s:'✅ Använd OneDrive/SharePoint\n✅ Google Drive\n✅ Dropbox\n\n❌ Skicka ALDRIG:\n• Lösenord i chatt\n• Personnummer okrypterat\n• Stora bilagor\n\nDela länk > Bilaga alltid!',a:'GDPR gäller på jobbet. Skicka aldrig personnummer eller hälsoinfo i okrypterade kanaler. IT-avdelningen bestämmer vilka verktyg som är godkända.'}],
ex:{type:'build',title:'Din kommunikationsprofil på jobbet',desc:'Förbered dig för digital kommunikation.',fields:[{l:'Vilka verktyg används i din bransch?',ph:'T.ex. Vård: TakeCare / IT: Slack / Lager: Teams',hint:'Googla [bransch] kommunikationsverktyg'},{l:'Hur svarar du inom rimlig tid?',ph:'T.ex. Kolla Teams morgon och eftermiddag'},{l:'Vad undviker du i jobbrelaterade chattar?',ph:'T.ex. Privata diskussioner, känslig info',ta:true},{l:'Hur delar du en stor fil?',ph:'T.ex. Laddar upp till OneDrive och delar länk',hint:'Länk > Bilaga alltid'}]},
quiz:[{q:'Standard i svenska myndigheter?',o:['Slack','Microsoft Teams','WhatsApp','E-post'],c:1},{q:'Vad betyder VERSALER i chatt?',o:['Viktigt meddelande','Att skrika/vara arg','Man är deaf','Inget'],c:1},{q:'Bäst sätt att dela stor fil?',o:['E-postbilaga','Länk via OneDrive/Drive','USB-minne','Skriva ut'],c:1},{q:'Hur snabbt svarar du på jobbchatt?',o:['Direkt alltid','Inom 2-4 arbetstimmar','Nästa dag','Bara om viktigt'],c:1}],
pr:['Hur lär jag mig Slack snabbt?','Skillnad Teams och Slack?','Dela filer säkert på jobbet?']},
{id:'d19',icon:'🛡️',title:'Digital hälsa & skärmbalans',sub:'Ta hand om dig i det digitala livet',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Skärmtid och produktivitet',s:'Snitt i Sverige: 6-8 timmar/dag.\n\nHantera det:\n✅ Pomodoro: 25 min fokus + 5 min paus\n✅ Telefonfri tid på kvällar och måltider\n✅ Stäng notiser under jobbsöket\n\nKolla din skärmtid:\n📱 iPhone: Skärm & Användningstid\n📱 Android: Digitalt välmående',a:'Mer än 4 tim social media/dag korrelerar med ökad ångest. Notiser fragmenterar koncentrationen — 23 minuter för att återfå fokus efter avbrott. Stäng notiser under jobbsöket.'},{t:'Negativa digitala miljöer',s:'Tecken:\n⚠️ Mår sämre efter scrolling\n⚠️ Jämför dig med andra\n⚠️ Sömnproblem pga skärm\n\nVad du gör:\n✅ Avfölj negativa konton\n✅ Använd tysta-funktionen\n✅ Rapportera trakasserier\n✅ Ta digitala pauser',a:'Nätmobbning anmäls till polisen om det är brottsligt. Plattformar har rapporteringsfunktioner. Kontakta Friends (friends.se) eller Brottsoffermyndigheten för stöd.'},{t:'Ergonomi och ögonhälsa',s:'20-20-20-regeln:\nVarje 20 min → titta 6 m bort i 20 sekunder\n\nSittställning:\n• Skärm i ögonhöjd\n• Rygg stödd\n• Fötter i golvet\n\n🌙 Natteläge efter kl 20!',a:'Digitalt ögonstress drabbar 65% av skärmanvändare. 20-20-20-regeln rekommenderas av ögonläkare. Skärmljus sent stör melatonin och sömnkvalitet.'}],
ex:{type:'build',title:'Din digitala hälsoplan',desc:'Ta kontroll över din skärmanvändning.',fields:[{l:'Din genomsnittliga skärmtid?',ph:'T.ex. 7 timmar — kolla i inställningarna',hint:'Inställningar > Skärm & Användningstid'},{l:'Vilket konto ger negativa känslor?',ph:'T.ex. Vissa Instagram-konton — avföljer nu',hint:'Avfölj utan dåligt samvete'},{l:'Telefon-rutin under jobbsöket?',ph:'T.ex. Stänger notiser, telefon upp-och-ned på bordet'},{l:'Din digitala paus-rutin?',ph:'T.ex. Inga skärmar efter kl 21'}]},
quiz:[{q:'Hur länge för att återfå fokus efter notis?',o:['1 minut','5 minuter','23 minuter','Omedelbart'],c:2},{q:'20-20-20-regeln?',o:['20 min träning','Varje 20 min: titta 6m bort i 20 sek','20 sek skärm','20 min paus'],c:1},{q:'Vad gör natteläge?',o:['Gör mörkare','Minskar blått ljus som stör sömnhormonet','Stänger notiser','Sparar batteri'],c:1},{q:'Nätmobbning — vad gör du?',o:['Svarar tillbaka','Rapporterar till plattform och vid brott till polisen','Ignorerar','Tar paus'],c:1}],
pr:['Minska skärmtid effektivt.','Rapportera nätmobbning på Instagram.','Ergonomi-tips för jobbsöket hemifrån?']},
{id:'d20',icon:'🚀',title:'Din digitala karriärplan',sub:'Sammanfattning och nästa steg',color:'#34d399',bc:'rgba(52,211,153,.3)',bg:'rgba(52,211,153,.07)',
lessons:[{t:'Vad du nu kan digitalt',s:'Du har gått igenom hela Digitalt!\n\nDu kan:\n✅ Bygga digital profil och LinkedIn\n✅ Söka jobb på alla plattformar\n✅ Kommunicera professionellt digitalt\n✅ Använda Office, AI och verktyg\n✅ Skydda dig online och hantera BankID\n✅ Förstå digitala avtal och betalningar\n\nDu är digitalt redo!',a:'Digital kompetens är en av de mest efterfrågade egenskaperna 2024-2030. Det är inte längre en bonus utan ett krav. Du har nu verktygen.'},{t:'Håll dig uppdaterad',s:'Tekniken förändras:\n\n📰 Följ: Di Digital, Computer Sweden\n🎓 En ny kurs per kvartal\n🔗 LinkedIn varje vecka\n🤖 Testa nya AI-verktyg\n\nMålet: Alltid bekväm med verktygen i din bransch.',a:'Branscher digitaliseras i olika takt — lager och vård är på väg in i digital transformation nu. Att ligga steget före märks på CV och i intervjun.'},{t:'Bygg ditt digitala varumärke',s:'1. LinkedIn: aktiv 2-3 ggr/vecka\n2. Dela branschrelevant innehåll\n3. Kommentera andras inlägg\n4. Lägg upp certifikat\n5. Be om rekommendationer\n\n→ Rekryterare hittar dig — inte tvärtom!\n\n"Ditt rykte online = ditt CV 24/7"',a:'40% av LinkedIn-rekryteringar sker utan att kandidaten sökt jobbet — de hittades. Personal branding online är inte bara för influencers.'}],
ex:{type:'ai-chat',title:'Chatta med AI-SYV om dina digitala nästa steg'},
quiz:[{q:'Vilka digitala kompetenser saknar du för drömjobbet?',o:['Vet inte','Googla + fråga rekryterare + kolla annonserna','Kolla LinkedIn','Alla alternativ'],c:1},{q:'Hur bygger du digitalt rykte?',o:['Posta privata saker','Aktiv LinkedIn med branschinnehåll och certifikat','Bara ha ett konto','Köpa följare'],c:1},{q:'Hur håller du dig uppdaterad?',o:['Behöver inte','En kurs per kvartal + följa branschnyheter','Lita på arbetsgivaren','Vänta på utbildning'],c:1},{q:'Digitalt redo jobbsökare?',o:['Kan bara sociala medier','Söker jobb, kommunicerar professionellt och använder arbetslivsverktyg','Bara IT-folk','Har iPhone'],c:2}],
pr:['Vilka digitala kompetenser saknar jag för [yrke]?','Bygg min digitala karriärplan för [bransch].','Hur syns jag bättre digitalt för rekryterare inom [bransch]?']}


];

var STUDIER=[
{id:'s0',icon:'🗺️',title:'Utbildningskartan',sub:'Vad finns i Studier-kategorin?',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Alla utbildningsformer på en blick',
s:'I Studier-kategorin hittar du 20 moduler som täcker hela det svenska utbildningssystemet:\n\n🇸🇪 SFI — Lär dig svenska gratis\n📚 Komvux — Komplettera betyg som vuxen\n🏡 Folkhögskola — Studera i gemenskap\n🎓 YH — Kortaste vägen till yrke (1-2 år)\n📝 HP — Högskoleprovet förbättrar antagning\n🏫 Gymnasiekomplettering — Öppna fler dörrar\n💰 CSN — Finansiera studierna\n🌍 Validering — Erkänn utländsk utbildning',
a:'Det svenska utbildningssystemet erbjuder fler ingångar för vuxna än de flesta länder. Fri rörlighet, avgiftsfria alternativ och generöst CSN-stöd gör det möjligt att byta bana i alla åldrar. Ca 15% av vuxna saknar gymnasieexamen — Komvux och folkhögskola är inkörsportarna.'},
{t:'Snabba vägar vs. längre satsningar',
s:'Vill du ut i arbete SNABBT?\n\n⚡ Korta certifieringskurser (1-8 veckor)\n🏗️ AMU via AF — gratis, behåll ersättning\n🔨 Lärling & YA — jobba och lär parallellt\n🎓 YH — 1-2 år med praktik (LIA) inbyggd\n\nVill du satsa längre?\n\n🏫 Gymn-komplettering → YH → Jobb\n🎓 Komvux → Uni → Karriär (3-5 år)\n📚 Folkhögskola → Hitta din riktning',
a:'Kortare praktiska utbildningar leder snabbare till arbete men ger lägre startlön. Akademiska utbildningar tar längre men ger bättre löneutveckling. YH är ofta den bästa kompromissen — praktisk, kort och direkt arbetsmarknadsanpassad.'},
{t:'Hitta din startpunkt',
s:'Hitta rätt modul med dessa frågor:\n\n1. Kan du svenska? Nej → Börja med SFI\n2. Har du gymnasieexamen? Nej → Komvux GY-vux\n3. Har du utl. utbildning? → Kolla Validering\n4. Vill ha jobb snabbt? → AMU eller Certifieringar\n5. Vet inte vad du vill? → Prata med SYV (gratis!)\n6. Allt klart? → Välj YH, Uni eller Folkhögskola\n\nGör övningen nedan så hjälper AI dig att hitta rätt.',
a:'SYV (Studie- och yrkesvägledare) finns gratis hos kommunen, Komvux och AF. Ett möte tar 30-60 min och är den effektivaste investeringen du kan göra. Boka via helsingborg.se eller studera.nu.'}
],
ex:{type:'ai-survey',title:'Kartlägg din startpunkt',desc:'Berätta om din situation och AI-SYV ger dig en personlig rekommendation om vilka moduler du ska börja med.'},
quiz:[
{q:'Vad är YH-utbildning?',o:['4-årig universitetsutbildning','1-2 år arbetsmarknadsanpassad utbildning med praktik','En gymnasiekurs'],c:1},
{q:'Vad är AMU?',o:['En avgiftsbelagd kurs','Gratis arbetsmarknadsutbildning via AF','En universitetsexamen'],c:1},
{q:'Vilka utbildningar är gratis för vuxna?',o:['Inga är gratis','Komvux, SFI, YH och folkhögskola','Bara SFI'],c:1},
{q:'Vad hjälper SYV med?',o:['Bara CV-skrivning','Utbildnings- och karriärplanering — gratis','Bara för gymnasieelever'],c:1},
{q:'Vad är CSN?',o:['En skola','Myndigheten för studiestöd — bidrag och lån','En utbildningsplattform'],c:1}
],
pr:['Vilken utbildning passar mig baserat på min bakgrund?','Hur snabbt kan jag nå arbete via utbildning?','Förklara skillnaden YH och Komvux på enkel svenska.']},

{id:'s1',icon:'🎓',title:'Vad är YH-utbildning?',sub:'Yrkeshögskola — snabbaste vägen till jobb',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är en YH-utbildning?',
s:'YH betyder Yrkeshögskola. Det är en utbildning som är skapad för arbetsmarknaden.\n\nDen är kortare än ett universitetet — oftast 1-2 år.\nDu studerar det du behöver för ett specifikt yrke.',
a:'Yrkeshögskolan (YH) är en eftergymnasial utbildningsform som styrs av arbetslivets behov. Utbildningarna är arbetsmarknadsanpassade, ofta med hög andel LIA (Lärande i Arbete) och leder direkt till kvalificerade yrkesroller.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Fördelar med YH',
s:'✅ Kortare tid än universitetet\n✅ Praktik ingår (LIA)\n✅ Bra chans till jobb efteråt\n✅ Du kan få studiemedel från CSN\n✅ Gratis att söka och studera',
a:'YH-utbildningar har hög arbetsmarknadsrelevans. Ca 85% av examinerade studenter är i arbete inom 6 månader. LIA (Lärande i Arbete) ger praktisk erfarenhet och ofta direktkontakt med framtida arbetsgivare.'},
{t:'Hitta en YH-utbildning',
s:'Gå till: yrkeshogskolan.se\n\nDär kan du söka på:\n• Ort (t.ex. Helsingborg)\n• Yrke (t.ex. lagerlogistik)\n• Starttid',
a:'På Myh.se (Myndigheten för yrkeshögskolan) hittar du alla godkända YH-utbildningar. Filtrera på ort, inriktning och distans/plats. Ansökan sker via antagning.se.'}
],
ex:{type:'build',title:'Hitta din YH-utbildning',desc:'Utforska YH och identifiera en utbildning som passar dig.',
fields:[
{l:'Vilket yrke är du intresserad av?',ph:'T.ex. logistiker, undersköterska, IT-tekniker...',hint:'Sök sedan på yrkeshogskolan.se'},
{l:'Hittade du en utbildning? Vilket namn?',ph:'T.ex. Logistik och Supply Chain Management'},
{l:'Hur lång är utbildningen och var?',ph:'T.ex. 2 år, Helsingborg, med LIA-perioder'},
{l:'Vad krävs för att söka?',ph:'T.ex. Gymnasieexamen och arbetslivserfarenhet...'}
]},
quiz:[
{q:'Vad är en YH-utbildning?',o:['En universitetsutbildning','En arbetsmarknadsanpassad yrkesutbildning','En gymnasieutbildning'],c:1},
{q:'Hur lång är en typisk YH-utbildning?',o:['4-5 år','1-2 år','6 månader'],c:1},
{q:'Vad är LIA?',o:['En typ av lärare','Lärande i Arbete — praktik','En ansökningssida'],c:1},
{q:'Var hittar du YH-utbildningar?',o:['arbetsformedlingen.se','yrkeshogskolan.se','csn.se'],c:1},
{q:'Kan du få CSN under YH?',o:['Nej','Ja, studiemedel betalas ut','Bara om du arbetar parallellt'],c:1}
],
pr:['Vilka YH-utbildningar finns inom logistik i Skåne?','Vad krävs för att söka till en YH inom IT?','Förklara skillnaden mellan YH och universitet.']},

{id:'s2',icon:'📚',title:'Komvux',sub:'Läsa in gymnasiebetyg som vuxen',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är Komvux?',
s:'Komvux = Kommunal Vuxenutbildning.\n\nDu kan läsa:\n• Grundläggande kurser (som grundskolan)\n• Gymnasiekurser\n• Yrkesutbildningar\n\nDet är gratis och du kan börja när som helst.',
a:'Komvux är en del av det offentliga skolväsendet. Det ger vuxna möjlighet att komplettera sin utbildning på grundläggande eller gymnasial nivå, eller läsa yrkesutbildningar. Utbildningen är avgiftsfri och du kan studera i din egen takt.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Varför läsa på Komvux?',
s:'Du kanske:\n• Saknar gymnasieexamen\n• Behöver ett bättre betyg\n• Vill byta yrke\n• Behöver lära dig svenska\n\nKomvux kan öppna dörrar till jobb och vidare studier.',
a:'Behörighet till YH, universitet och många arbeten kräver godkänd gymnasieutbildning. Komvux är det snabbaste sättet att komplettera betyg som vuxen och är anpassat för dem som jobbar eller har familj.'},
{t:'Hur ansöker du?',
s:'1. Gå till din kommuns hemsida\n2. Sök "Komvux ansökan"\n3. Fyll i formuläret\n4. Välj kurser du vill läsa\n\nI Helsingborg: helsingborg.se/komvux',
a:'Ansökan görs direkt till kommunen. I Skåne kan du också titta på Skanevux.se som samordnar vuxenutbildning i regionen. Ansökan är löpande — du kan börja vid nästa terminsstart.'}
],
ex:{type:'komvux-ai',title:'Din Komvux-plan',desc:'Berätta om din situation och få förslag på kurser.',
fields:[
{l:'Vilken utbildning har du sedan tidigare?',ph:'T.ex. Gymnasieexamen delvis, SFI C-klar, ingen gymnasieexamen...'},
{l:'Vad vill du uppnå med Komvux?',ph:'T.ex. Söka YH inom IT, förbättra betyg i matte, läsa klart gymnasiet...'},
{l:'Kan du studera heltid eller deltid?',ph:'T.ex. Deltid 50% — jag jobbar parallellt'},
{l:'När vill du börja?',ph:'T.ex. Höstterminen 2026',hint:'Kolla ansökningsdatum på din kommuns sida.'}
]},
quiz:[
{q:'Vad betyder Komvux?',o:['Kommunalt Vuxencenter','Kommunal Vuxenutbildning','Kompetens och Utbildning'],c:1},
{q:'Är Komvux gratis?',o:['Nej, det kostar','Ja, det är avgiftsfritt','Bara om du är arbetslös'],c:1},
{q:'Vad kan du läsa på Komvux?',o:['Bara matematik','Grundläggande, gymnasiekurser och yrkesutbildning','Bara universitetsförberedande'],c:1},
{q:'Var hittar du Komvux i Helsingborg?',o:['komvux.se','helsingborg.se/komvux','skanevux.se'],c:1}
],
pr:['Vilka Komvux-kurser behöver jag för att söka YH?','Hur snabbt kan jag läsa klart gymnasiet via Komvux?','Vad är skillnaden mellan Komvux och SFI?']},

{id:'s3',icon:'🇸🇪',title:'SFI — Svenska för invandrare',sub:'Lär dig svenska kostnadsfritt',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är SFI?',
s:'SFI = Svenska för invandrare.\n\nDet är en gratis kurs för dig som är ny i Sverige och inte kan svenska.\n\nDu lär dig:\n• Läsa och skriva svenska\n• Prata och förstå\n• Använda svenska i vardagen',
a:'SFI är en kommunal utbildning som ger grundläggande kunskaper i svenska. Det finns fyra studievägar (1-3) och kurserna A-D beroende på din bakgrund och tidigare utbildning.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Nivåer och studievägar',
s:'SFI har olika nivåer:\n\nStudieväg 1 — för dig med lite skolbakgrund\nStudieväg 2 — för dig med gymnasienivå\nStudieväg 3 — för dig med högskoleutbildning\n\nDu testas och placeras på rätt nivå.',
a:'SFI är indelad i kurserna A, B, C och D. Kurs D är den avancerade nivån. Avklarad SFI öppnar dörrar till Komvux Svenska som andraspråk och vidare studier på svenska.'},
{t:'Tips för att lära sig snabbare',
s:'💡 Prata svenska varje dag\n💡 Titta på TV och filmer på svenska\n💡 Läs enkla nyheter (t.ex. 8sidor.se)\n💡 Öva med appen Duolingo\n💡 Prata med grannar och kollegor',
a:'Forskning visar att kombinationen av formell undervisning och aktiv användning i vardagen ger snabbast resultat. Podcast "Lär dig svenska" och SVT Play med undertexter är utmärkta gratis resurser.'}
],
ex:{type:'build',title:'Din svenska-plan',desc:'Skapa en plan för att förbättra din svenska utanför klassrummet.',
fields:[
{l:'Vilken nivå är du på nu?',ph:'T.ex. SFI B, eller jag kan prata men inte skriva bra...'},
{l:'Hur många timmar per vecka kan du öva?',ph:'T.ex. 30 min varje dag — totalt 3.5 timmar/vecka'},
{l:'Vilka resurser ska du använda?',ph:'T.ex. Duolingo, SVT Play, prata med grannar...',hint:'Välj minst 2 metoder.'},
{l:'Ditt mål med svenska',ph:'T.ex. Klara SFI D, kommunicera på jobbet, hjälpa mina barn med läxor...'}
]},
quiz:[
{q:'Vad är SFI?',o:['En avgiftsbelagd privatskola','Gratis svenska för invandrare','En yrkesutbildning'],c:1},
{q:'Hur många studievägar finns det?',o:['2','3','5'],c:1},
{q:'Vilket är bra för att öva svenska hemma?',o:['Bara läsa böcker på arabiska','SVT Play, Duolingo och 8sidor.se','Undvika svenska'],c:1},
{q:'Vad händer när du klarar SFI D?',o:['Du måste sluta studera','Du kan läsa vidare på Komvux','Du måste ta ett nytt test'],c:1}
],
pr:['Hur snabbt kan jag lära mig svenska med SFI?','Vilka appar hjälper mig lära mig svenska snabbast?','Skriv ett enkelt brev på svenska åt mig som övning.']},

{id:'s4',icon:'🏡',title:'Folkhögskola',sub:'Lärande i gemenskap',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är folkhögskola?',
s:'Folkhögskolan är en unik skolform i Sverige.\n\nHär studerar du i grupp, ofta utan betyg.\nDu kan bo på skolan (internat) eller pendla.\n\nKurser finns inom:\n• Allmänt (komplettera betyg)\n• Kreativt (musik, konst, media)\n• Yrkesinriktade ämnen',
a:'Folkhögskolan är en fri och frivillig skolform med lång tradition. Den bedrivs av organisationer och rörelser. Det finns ca 150 folkhögskolor i Sverige. Studieomdöme (istället för betyg) används för vidare studier.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'För vem passar folkhögskola?',
s:'Folkhögskolan passar bra om du:\n• Vill studera i en lugn miljö\n• Behöver komplettera betyg\n• Har haft svårt i vanlig skola\n• Vill hitta din riktning i livet\n\nDu kan börja oavsett tidigare betyg.',
a:'Folkhögskolan är känd för sin inkluderande miljö. Den är särskilt värdefull för dem som haft svårigheter i traditionell skola, behöver struktur och gemenskap, eller söker en ny riktning.'},
{t:'CSN och folkh\u00f6gskola',
s:'Du kan få studiemedel från CSN när du studerar på folkhögskola.\n\nDet inkluderar:\n• Studiebidrag\n• Studielån (frivilligt)\n\nSöks via csn.se.',
a:'CSN-stöd ges normalt från och med första månaden om utbildningen är minst 15 veckor lång och 50% studietakt. Specifika regler gäller för folkhögskolans studieomdöme kontra betyg.'}
],
ex:{type:'build',title:'Hitta din folkhögskola',desc:'Utforska om folkhögskola passar dig.',
fields:[
{l:'Vilket ämne eller inriktning intresserar dig?',ph:'T.ex. Musik, media, allmän kurs, IT...'},
{l:'Vill du bo på skolan (internat) eller pendla?',ph:'T.ex. Pendla — jag bor i Helsingborg'},
{l:'Hittade du en folkhögskola? Vilket namn?',ph:'T.ex. Hvilan folkhögskola i Malmö'},
{l:'Vad vill du uppnå med folkhögskolestudier?',ph:'T.ex. Komplettera betyg och hitta min riktning...'}
]},
quiz:[
{q:'Vad är unikt med folkhögskola?',o:['Dyrt och exklusivt','Fri skolform, ofta utan traditionella betyg','Bara för unga under 20'],c:1},
{q:'Vad används istället för betyg?',o:['Poäng','Studieomdöme','Intyg'],c:1},
{q:'Kan du bo på folkhögskola?',o:['Aldrig','Ja, många har internat','Bara utländska studenter'],c:1},
{q:'Kan du få CSN på folkhögskola?',o:['Nej','Ja, studiemedel går att söka','Bara studiebidrag, inget lån'],c:1}
],
pr:['Vilka folkhögskolor finns nära Helsingborg?','Hur ansöker jag till folkhögskola?','Vad är skillnaden mellan folkhögskola och Komvux?']},

{id:'s5',icon:'💰',title:'CSN & studiebidrag',sub:'Finansiera dina studier',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är CSN?',
s:'CSN = Centrala studiestödsnämnden.\n\nDe betalar ut pengar till dig när du studerar.\n\nDet finns två delar:\n• Studiebidrag — pengar du inte behöver betala tillbaka\n• Studielån — pengar du lånar och betalar tillbaka senare',
a:'CSN administrerar det svenska studiestödssystemet. Studiemedel består av bidragsdelen (ca 1/3) och lånedelen (ca 2/3). Lånet betalas tillbaka med låg ränta under lång tid.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Vad kan du få?',
s:'2026 — ungefärliga belopp:\n\n📦 Heltid:\n• Bidrag: ca 3 400 kr/mån\n• Lån: ca 7 900 kr/mån\n• Totalt: ca 11 300 kr/mån\n\nDu väljer själv om du vill ta lånet.',
a:'Beloppet beror på ålder, studietakt och om du har barn. Du kan ta ut 1/4, 1/2, 3/4 eller heltid. Bidragsdelen kräver ingen återbetalning. Lånedelen återbetalas från det år du tjänar över gränsen.'},
{t:'Hur ansöker du?',
s:'1. Gå till csn.se\n2. Logga in med BankID\n3. Välj "Studiemedel"\n4. Fyll i uppgifter om din utbildning\n5. Skicka in\n\nDu ansöker per termin.',
a:'Ansökan öppnar normalt 2 månader innan terminsstart. Du behöver intyg från skolan. Pengarna betalas ut månadsvis. Viktigt: du måste studera i den takt du ansökt om — annars kan CSN kräva tillbaka pengar.'}
],
ex:{type:'build',title:'Räkna på din CSN',desc:'Beräkna vad du kan få och planera din ekonomi.',
fields:[
{l:'Vilken utbildning planerar du?',ph:'T.ex. YH-utbildning 2 år heltid i Helsingborg'},
{l:'Heltid eller deltid?',ph:'T.ex. Heltid 100% — jag kan inte jobba parallellt'},
{l:'Har du andra inkomster under studietiden?',ph:'T.ex. Nej / Ja, jobbar extra ca 2000 kr/mån',hint:'För mycket inkomst påverkar CSN!'},
{l:'Hur stor del av lånet vill du ta?',ph:'T.ex. Hela lånet, eller bara bidragsdelen...',hint:'Lånet återbetalas — tänk noga!'}
]},
quiz:[
{q:'Vad betyder CSN?',o:['Central Skolnämnd','Centrala studiestödsnämnden','Centrum för Studienätverk'],c:1},
{q:'Vilket måste du betala tillbaka?',o:['Bidraget','Lånet','Båda'],c:1},
{q:'Hur ansöker du om CSN?',o:['På kommunens kontor','Via csn.se med BankID','Via din skola'],c:1},
{q:'Vad händer om du inte studerar i rätt takt?',o:['Ingenting','CSN kan kräva tillbaka pengar','Du får mer bidrag'],c:1},
{q:'Kan du välja att bara ta bidraget?',o:['Nej, du måste ta båda','Ja, lånet är frivilligt','Bara om du är under 25'],c:1}
],
pr:['Hur mycket CSN kan jag få för en YH-utbildning heltid?','Vad händer med CSN om jag jobbar extra?','Förklara hur CSN-lånet återbetalas.']},

{id:'s6',icon:'📝',title:'Söka utbildning',sub:'Steg-för-steg ansökan',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Antagning.se',
s:'antagning.se är Sveriges officiella ansökningssajt.\n\nHär söker du till:\n• Universitet och högskola\n• YH-utbildningar\n• Många andra kurser\n\nDet är gratis att söka.',
a:'Antagning.se hanteras av Universitets- och högskolerådet (UHR). Du kan söka upp till 20 utbildningar per antagningsomgång. Urval sker via meritvärde (betyg eller högskoleprov).',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Ansökningsprocessen',
s:'Steg:\n1. Skapa konto på antagning.se\n2. Sök de utbildningar du vill ha\n3. Bifoga betyg och dokument\n4. Skicka in i tid\n5. Vänta på besked\n6. Svara JA eller NEJ till platsen',
a:'Viktiga datum: Vårens antagning — sista ansökan 15 april. Höstens antagning — sista ansökan 15 oktober. Kontrollera alltid specifika datum för varje utbildning.'},
{t:'Meritvärde och urval',
s:'Ditt meritvärde räknas ut från dina betyg.\n\nA = 20 poäng\nB = 17,5\nC = 15\nD = 12,5\nE = 10\nF = 0\n\nHögskoleprov (HP) kan ge extra poäng.',
a:'Urvalsgrupper: betygsurval (BG) och högskoleprovurval (HP). Poäng från arbetslivserfarenhet (MERITPOÄNG) kan addera upp till 2.5 extra poäng på betyget. Högskoleprov ger max 2.0 extra poäng.'}
],
ex:{type:'build',title:'Din ansökningsplan',desc:'Planera din utbildningsansökan steg för steg.',
fields:[
{l:'Vilken/vilka utbildningar söker du?',ph:'T.ex. YH Logistik i Helsingborg, Komvux Matte 1a...',ta:true},
{l:'Vad är sista ansökningsdatum?',ph:'T.ex. 15 april 2026',hint:'Kolla alltid datumet för just din utbildning!'},
{l:'Vilka dokument behöver du?',ph:'T.ex. Gymnasiebetyg, ID-handling, arbetsintygAnmälan...',ta:true},
{l:'Vad är din plan B om du inte kommer in?',ph:'T.ex. Söka till Komvux och förbättra betygen...'}
]},
quiz:[
{q:'Vad är antagning.se?',o:['En jobbsajt','Sveriges officiella ansökningssajt för utbildning','En betygssajt'],c:1},
{q:'Vad är sista ansökningsdag på våren?',o:['1 mars','15 april','30 maj'],c:1},
{q:'Vad ger betyget A i meritvärde?',o:['15 poäng','20 poäng','25 poäng'],c:1},
{q:'Hur många utbildningar kan du söka?',o:['5','20','Obegränsat'],c:1}
],
pr:['Hur räknar jag ut mitt meritvärde?','Vad krävs för att komma in på YH-utbildning i logistik?','Hjälp mig skriva ett personligt brev för min ansökan.']},

{id:'s7',icon:'🌍',title:'Validering av utbildning',sub:'Erkänn din utbildning från utlandet',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är validering?',
s:'Validering betyder att få din utbildning från ett annat land erkänd i Sverige.\n\nDetta är viktigt för att:\n• Söka jobb\n• Söka vidare studier\n• Bevisa din kompetens',
a:'Validering är en process för att kartlägga, bedöma och värdera kompetenser oavsett hur de förvärvats. I Sverige hanteras erkännande av utländsk utbildning av UHR (Universitets- och högskolerådet).',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'UHR — Universitets- och h\u00f6gskolerådet',
s:'UHR hjälper dig att:\n• Jämföra din utländska utbildning med svensk\n• Få ett officiellt utlåtande\n• Förstå vad som krävs för att komplettera\n\nGå till: uhr.se',
a:'UHR utfärdar officiella utlåtanden om utländsk utbildning. Det kostar en avgift men är nödvändigt för legitimationsyrken (t.ex. läkare, lärare). Processen tar normalt 4-12 veckor.'},
{t:'Reglerade och oreglerade yrken',
s:'Reglerade yrken (t.ex. läkare, sjuksköterska, lärare) kräver godkänd legitimation.\n\nOreglerade yrken (t.ex. kock, säljare, lagerarbetare) kräver inget formellt erkännande — men det hjälper!',
a:'Ca 200 yrken i Sverige är reglerade. Ansökan om legitimation görs till respektive tillsynsmyndighet (t.ex. Socialstyrelsen för vårdyrken). UHR bedömer den akademiska nivån.'}
],
ex:{type:'build',title:'Din valideringsplan',desc:'Kartlägg din utländska utbildning och planera nästa steg.',
fields:[
{l:'Vilken utbildning har du från ditt hemland?',ph:'T.ex. Kandidatexamen i ekonomi, 3 år, Syrien 2015'},
{l:'Vilket yrke vill du ha i Sverige?',ph:'T.ex. Ekonom, lärare, IT-tekniker...'},
{l:'Är ditt yrke reglerat i Sverige?',ph:'T.ex. Nej — inte lagerarbetare / Ja — sjuksköterska kräver legitimation',hint:'Kolla på uhr.se'},
{l:'Vad är ditt nästa steg?',ph:'T.ex. Ansöka om utlåtande från UHR, kontakta Socialstyrelsen...'}
]},
quiz:[
{q:'Vad är validering?',o:['Att lära sig svenska','Erkänna utländsk utbildning i Sverige','En typ av körkort'],c:1},
{q:'Vilken myndighet hanterar erkännande?',o:['Arbetsförmedlingen','UHR — Universitets- och högskolerådet','CSN'],c:1},
{q:'Vad är ett reglerat yrke?',o:['Ett välbetalt yrke','Yrke som kräver godkänd legitimation','Yrke utan utbildningskrav'],c:1},
{q:'Var hittar du mer info?',o:['csn.se','uhr.se','komvux.se'],c:1}
],
pr:['Hur erkänner jag min läkarexamen från Syrien i Sverige?','Vilka yrken är reglerade i Sverige?','Hjälp mig skriva till UHR om min utbildning.']},

{id:'s8',icon:'💻',title:'Distans & online-kurser',sub:'Studera var du vill och när du vill',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är distansutbildning?',
s:'Distansutbildning betyder att du studerar på nätet — inte i ett klassrum.\n\nFördelar:\n• Du väljer var du studerar\n• Du väljer när du studerar\n• Passar dig med familj eller jobb',
a:'Distansutbildning har exploderat i popularitet. Kvaliteten är nu likvärdig med campusutbildning. De flesta svenska lärosäten erbjuder distansvarianter. Viktiga plattformar: Studium, Canvas, Ping Pong.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Gratis resurser online',
s:'Det finns massor av gratis kurser:\n\n🔵 Coursera — internationella kurser\n🟢 edX — MIT, Harvard osv\n🟡 Khan Academy — matematik, naturvetenskap\n🔴 YouTube — nästan allt!\n🇸🇪 UR.se — svenska kurser\n\nMånga ger certifikat!',
a:'MOOC (Massive Open Online Courses) har demokratiserat utbildning globalt. LinkedIn Learning, Udemy och Coursera erbjuder branschrelevanta certifikat som arbetsgivare värdesätter. Google Career Certificates är ett framväxande alternativ.'},
{t:'Tips f\u00f6r att lyckas med distans',
s:'Distans kräver mer disciplin!\n\nTips:\n✅ Sätt tider för studier — behandla det som ett jobb\n✅ Skapa en studieplan\n✅ Ta pauser\n✅ Hitta en studiekompis\n✅ Stäng av telefonen',
a:'Forskning visar att framgångsfaktorer för distansstudenter är: tydlig struktur, regelbundna studietider, social interaktion med kurskamrater och tydliga delmål. Prokrastinering är den vanligaste orsaken till avhopp.'}
],
ex:{type:'build',title:'Din online-studieplan',desc:'Planera hur du lär dig nytt på distans.',
fields:[
{l:'Vad vill du lära dig online?',ph:'T.ex. Python-programmering, Excel, engelska, bokföring...'},
{l:'Vilken plattform ska du använda?',ph:'T.ex. YouTube + Coursera',hint:'Välj max 2 plattformar.'},
{l:'Hur många timmar per vecka?',ph:'T.ex. 5 timmar — 1 timme varje vardagskväll'},
{l:'Vilket är ditt mål och deadline?',ph:'T.ex. Klart certifikat inom 3 månader',hint:'Sätt ett konkret datum!'}
]},
quiz:[
{q:'Vad är distansutbildning?',o:['Utbildning utomlands','Studera online utan att vara på plats','Kvällsskola'],c:1},
{q:'Vilken är en gratis utbildningsplattform?',o:['LinkedIn','Khan Academy','Glassdoor'],c:1},
{q:'Vad är MOOC?',o:['En studieapp','Massive Open Online Courses','En typ av examen'],c:1},
{q:'Vad är viktigast för att lyckas med distans?',o:['Snabb dator','Disciplin och tydlig studieplan','Tyst miljö'],c:1}
],
pr:['Vilka gratis kurser rekommenderar du för [ämne]?','Skapa en 3-månaders studieplan för att lära mig Python.','Vad ger bäst chans till jobb — certifikat från Coursera eller Komvux?']},

{id:'s9',icon:'🏭',title:'Praktik & APL',sub:'Lär dig på jobbet',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är praktik och APL?',
s:'Praktik = du jobbar på ett riktigt företag för att lära dig.\n\nAPL = Arbetsplatsförlagt Lärande.\nDet är praktik som ingår i en utbildning.\n\nDu lär dig:\n• Hur det fungerar på riktiga jobb\n• Kontakter i branschen\n• Vad du verkligen gillar',
a:'APL är en obligatorisk del av många YH- och gymnasieutbildningar (kallas LIA i YH-sammanhang). Praktikperioder varierar från veckor till månader. De är ett utmärkt sätt att visa sin kompetens och ofta leder till anställning.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Hitta praktikplats',
s:'Sätt att hitta praktik:\n\n1. Fråga ditt nätverk\n2. Ring företag direkt\n3. LinkedIn — "praktik" eller "LIA"\n4. Platsbanken\n5. Via din skola/utbildare\n\nVara proaktiv — vänta inte!',
a:'Nätverket är den effektivaste kanalen. Spontanansökningar fungerar bra eftersom få söker LIA via traditionella kanaler. Ett välformulerat brev som visar din motivation har stor chans att lyckas.'},
{t:'Maximera din praktik',
s:'Under praktiken:\n\n✅ Kom i tid — alltid\n✅ Ställ frågor\n✅ Ta initiativ\n✅ Bygg relationer\n✅ Be om feedback\n✅ Be om referens i slutet',
a:'Praktiken är en förlängd jobbintervju. Studier visar att 40-60% av LIA-studenter erbjuds anställning av praktikföretaget. Att skriva dagbok eller portfolio under praktiken stärker din profil.'}
],
ex:{type:'build',title:'Din praktikansökan',desc:'Förbered dig för att hitta en praktikplats.',
fields:[
{l:'Vilket företag eller bransch vill du ha praktik i?',ph:'T.ex. Lagerföretag i Helsingborg, restaurang, IT-företag...'},
{l:'Skriv en kort motivering (varför just dem?)',ph:'T.ex. Jag är intresserad av er verksamhet och vill lära mig mer om logistik...',ta:true,hint:'Var specifik — nämn företaget!'},
{l:'Vad vill du lära dig under praktiken?',ph:'T.ex. Truckkörning, kundkontakt, programmeringsprojekt...'},
{l:'Vem i ditt nätverk kan hjälpa dig?',ph:'T.ex. Min granne jobbar på IKEA, min handläggare känner X...',hint:'Nätverket är guld!'}
]},
quiz:[
{q:'Vad är APL?',o:['En app','Arbetsplatsförlagt Lärande','Avancerad Praktisk Lektion'],c:1},
{q:'Vad heter APL i YH-utbildningar?',o:['LIA','APU','OPL'],c:1},
{q:'Hur hittar du praktik effektivt?',o:['Vänta på skolan','Nätverka och ta kontakt direkt','Bara Platsbanken'],c:1},
{q:'Vad bör du göra sist på praktiken?',o:['Ingenting','Be om referens och tacka','Skicka CV'],c:1}
],
pr:['Skriv ett spontanbrev för praktikansökan inom logistik.','Hur nätverkar jag för att hitta LIA-plats?','Vad ska jag säga när jag ringer ett företag för praktik?']},

{id:'s10',icon:'🗺️',title:'Din studieväg',sub:'Planera din utbildning smart',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Varför planera sin studieväg?',
s:'En plan hjälper dig att:\n• Välja rätt utbildning\n• Spara tid och pengar\n• Nå ditt mål snabbare\n• Undvika att börja om från början\n\nIngen plan = slumpen bestämmer.',
a:'Karriärplanering kombinerat med utbildningsplanering ökar sannolikheten att nå sitt mål med 3-4x. Tydliga mål, kartlagd bakgrund och konkret handlingsplan är grundelementen.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Kartl\u00e4gg din startpunkt',
s:'Ställ dig dessa frågor:\n\n1. Vilken utbildning har jag?\n2. Vad saknar jag?\n3. Vad vill jag jobba med?\n4. Hur lång tid har jag?\n5. Hur ser min ekonomi ut?',
a:'En kompetenskartläggning är grunden för all utbildningsplanering. Validering, CVmatchen och Arbetsförmedlingens verktyg kan hjälpa dig identifiera gap mellan din nuläge och önskad position.'},
{t:'Skapa din plan',
s:'Din studieväg kan se ut så:\n\nSteg 1: SFI (om nödvändigt)\nSteg 2: Komvux — komplettera betyg\nSteg 3: YH-utbildning 1-2 år\nSteg 4: Jobb + vidareutbildning\n\nAlla steg behövs inte — hoppa in där du passar!',
a:'Studievägen ska vara realistisk och anpassad till din livssituation. CSN, bostadsbidrag och kommunala stöd kan finansiera hela resan. Kontakta Studie- och yrkesvägledare (SYV) på din kommun — det är gratis!'}
],
ex:{type:'build',title:'Bygg din personliga studieväg',desc:'Skapa en konkret plan från idag till ditt drömjobb.',
fields:[
{l:'Var är du nu? (utbildning + situation)',ph:'T.ex. SFI C klar, söker jobb, vill bli undersköterska...',ta:true},
{l:'Var vill du vara om 3 år?',ph:'T.ex. Fast jobb som logistiker med YH-examen',hint:'Var konkret — titeln och branschen.'},
{l:'Vilka steg behöver du ta?',ph:'Steg 1: \nSteg 2: \nSteg 3: ',ta:true,hint:'Max 3-4 tydliga steg.'},
{l:'Vad är ditt första steg — den här veckan?',ph:'T.ex. Söka till Komvux Matte 1a och boka möte med SYV',hint:'Börja nu — ett litet steg!'}
]},
quiz:[
{q:'Varför planera sin studieväg?',o:['Det behövs inte','Sparar tid, pengar och ökar chansen att nå målet','Handläggaren kräver det'],c:1},
{q:'Vad är SYV?',o:['En studieapp','Studie- och yrkesvägledare','En YH-utbildning'],c:1},
{q:'Hur kan du finansiera din studieväg?',o:['Omöjligt som vuxen','CSN, bidrag och kommunalt stöd','Bara med eget sparande'],c:1},
{q:'Vad är en kompetenskartläggning?',o:['Ett betyg','Analys av vad du kan och vad du saknar','En ansökan'],c:1}
],
pr:['Skapa en 3-årig studieplan för att bli [yrke].','Vilken utbildningsväg är snabbast till undersköterska?','Vad erbjuder Arbetsförmedlingen för utbildningsstöd?']},
{id:'s11',icon:'HP',title:'Hogskoleprovet',sub:'Forbattra chanserna till hogskola',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad ar Hogskoleprovet?',
s:'Hogskoleprovet (HP) ar ett prov du kan gora for att forbattra dina chanser till universitetet.\n\n- Kostar 450 kr\n- Ges 2 ganger/ar (var + host)\n- Gor hur manga ganger du vill\n- Basta resultatet raknas alltid\n\nAnmal dig pa: studera.nu',
a:'HP ar ett nationellt urvalsprov (UHR). Provbetyg 0.00-2.00. Ca 30 procent av platser ga via HP-urval. Parallellt med betygsurval.',
yt:'https://www.youtube.com/embed/dQw4w9WgXcQ'},
{t:'Vad testas?',
s:'VERBAL (sprak):\n- ORD: ordfOrstaelse\n- LAS: lasforstaelse\n- SVT: svensk text\n- ELF: engelsk text\n\nKVANTITATIV (matte+logik):\n- KVA: jamforelser\n- XYZ: problemlosning\n- DTK: diagram/tabeller\n- NOG: logik\n\nMax: 2.00 poang',
a:'Mater allman studieformaga. Verbal och kvantitativ vager lika. Traning kan forbattra resultatet med 0.2-0.4 poang i snitt.'},
{t:'Forberedelse',
s:'Gratis:\n- hp.studera.nu (officiell ovningssida)\n- Gamla prov online\n- YouTube: sok HP-tips\n- Biblioteket har bocker\n\nBetalt:\n- Kurser, Hermods, appar\n\nBorja minst 3 manader i forvag!',
a:'Effektivaste: gamla prov under tidspress, analysera felsvar, ova svaga delar. Tidsstrategi avgOrande - hoppa svara fragor och aterkom.'}
],
ex:{type:'build',title:'Din HP-plan',desc:'Planera forberedelsen for Hogskoleprovet.',
fields:[
{l:'Nar gor du provet?',ph:'T.ex. Hostprovet oktober 2026',hint:'Anmal pa studera.nu - stanger ca 3 veckor innan!'},
{l:'Nulage och mal',ph:'T.ex. Vet inte nulage - vill na 1.2 for YH'},
{l:'Svagaste delmoment',ph:'T.ex. NOG och LAS',hint:'Lagg mest tid har!'},
{l:'Traningsplan',ph:'T.ex. 5 tim/vecka: 30 min varje kväll + gammalt prov pa lordag',ta:true},
{l:'Resurser',ph:'T.ex. hp.studera.nu, gamla prov, YouTube-forklaringar',hint:'Val 2-3 och hall dig till dem.'}
]},
quiz:[
{q:'Vad kostar HP-anmalan?',o:['Gratis','450 kr','1000 kr'],c:1},
{q:'Hur manga ganger kan du gora HP?',o:['Max 3','Max 5','Obegransat'],c:1},
{q:'Vilket resultat raknas?',o:['Sista','Snittet','Basta'],c:1},
{q:'Hur ofta ges HP?',o:['1 gang/ar','2 ganger/ar','Varje kvartal'],c:1},
{q:'Var anmaler du dig?',o:['antagning.se','studera.nu','csn.se'],c:1},
{q:'Max-poang pa HP?',o:['1.00','2.00','5.00'],c:1}
],
pr:['Ge mig ett 3-manadersschema for HP.','Forklara NOG pa enkel svenska med exempel.','Vilket HP-betyg kravs for [utbildning]?']},
{id:'s12',icon:'🏗️',title:'Arbetsmarknadsutbildning',sub:'Gratis utbildning via AF — direkt till jobb',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är AMU?',
s:'AMU = Arbetsmarknadsutbildning.\n\nDet är en gratis utbildning som du söker via Arbetsförmedlingen.\n\nViktigt:\n✅ Helt gratis\n✅ Du behåller din ersättning under utbildningen\n✅ Leder direkt till jobb inom branschen\n✅ Kortare än YH — ofta 4-24 veckor',
a:'AMU är upphandlade utbildningar som AF köper av privata utbildningsföretag. De styrs av arbetsmarknadens behov. Du måste vara inskriven på AF och ha en handläggare som bedömer att utbildningen är rätt för dig. Ersättning: aktivitetsstöd, etableringsersättning eller utvecklingsersättning utgår.'},
{t:'Vad kan du utbilda dig till?',
s:'Vanliga AMU-utbildningar:\n\n🚛 Truck A+B (3-6 veckor)\n🏥 Undersköterska/vårdbiträde\n🏗️ Bygg & anläggning\n💻 IT-support & nätverk\n🔒 Väktare & säkerhet\n🍳 Kök & livsmedelshygien\n🚗 Yrkestrafik/taxi\n\nTillgång beror på var du bor och vad AF bedömer.',
a:'Utbudet varierar per region och period. AF upphandlar utbildningar baserat på lokalt arbetsmarknadsbehov. Vissa utbildningar har krav på förkunskaper (t.ex. B-körkort för truck). Fråga din handläggare om vad som är tillgängligt i ditt område just nu.'},
{t:'Hur söker du AMU?',
s:'1. Prata med din handläggare på AF\n2. Be om en AMU-utbildning inom ditt mål-yrke\n3. Handläggaren bedömer och godkänner\n4. Du anvisas till utbildningen\n\n→ Du kan inte söka direkt själv — det går via AF.\n\nLänk: arbetsformedlingen.se',
a:'AMU är ett myndighetsbeslut, inte en vanlig ansökan. Handläggaren avgör om du är aktuell baserat på din situation, arbetsmarknadens behov och tillgängliga platser. Var proaktiv — fråga specifikt om AMU och nämn vilket yrke du siktar mot.'}
],
ex:{type:'build',title:'Förbered din AMU-ansökan',desc:'Planera vad du ska säga till din handläggare.',
fields:[
{l:'Vilket yrke/bransch vill du jobba inom?',ph:'T.ex. lager/truck, vård, bygg, IT...'},
{l:'Varför passar du för det yrket?',ph:'T.ex. Jag har tidigare jobbat med... och är intresserad av...',ta:true,hint:'Handläggaren behöver höra din motivation!'},
{l:'Har du några förkunskaper som hjälper?',ph:'T.ex. Körkort B, erfarenhet av tunga lyft, vana av kundkontakt...'},
{l:'Vad ska du säga på mötet med AF?',ph:'T.ex. Jag vill söka AMU inom truck eftersom...',ta:true,hint:'Öva meningen högt — var konkret och bestämd.'}
]},
quiz:[
{q:'Vad kostar en AMU-utbildning?',o:['Samma som YH','Gratis','Ca 5000 kr'],c:1},
{q:'Hur söker du AMU?',o:['Direkt på arbetsformedlingen.se','Via din handläggare på AF','Via antagning.se'],c:1},
{q:'Behåller du ersättningen under AMU?',o:['Nej, ingen ersättning','Ja, ersättningen fortsätter','Bara halv ersättning'],c:1},
{q:'Hur lång är en typisk AMU?',o:['3-5 år','4-24 veckor','2 dagar'],c:1},
{q:'Vad styr utbudet av AMU?',o:['Vad du vill','Arbetsmarknadens behov lokalt','Skolverket'],c:1}
],
pr:['Hjälp mig argumentera för AMU inom truck hos min handläggare.','Vilka AMU-utbildningar finns inom vård i Skåne?','Hur förbereder jag mig inför mötet med AF om AMU?']},

{id:'s13',icon:'🎓',title:'Universitet & Högskola',sub:'Kandidat, master och akademisk frihet',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är ett universitet?',
s:'Ett universitet är den högsta utbildningsnivån i Sverige.\n\nDu väljer själv:\n• Vilka kurser du läser\n• I vilken ordning\n• Hur snabbt du studerar\n\nDetta kallas "fri rörlighet" — du sätter ihop din egen utbildning.',
a:'Universitet och högskolor är statliga lärosäten. Skillnaden: universitet har rätt att utfärda doktorsexamen, högskolor vanligtvis inte. Fri rörlighet innebär att du kan byta program, pausa, återuppta och kombinera kurser från olika lärosäten.'},
{t:'Kandidat, magister och master',
s:'📘 Kandidatexamen = 3 år (180 hp)\nGrundnivå. Ditt första universitetsbevis.\n\n📗 Magisterexamen = 1 år på kandidat (60 hp)\nFördjupning i ett ämne.\n\n📙 Masterexamen = 2 år på kandidat (120 hp)\nDjupare forskning och analys.\n\n🔬 Doktorsexamen = 4-5 år forskning',
a:'HP = högskolepoäng. Heltidsstudier = 60 hp/år. Examenskrav: kandidat kräver minst 90 hp i huvudämnet, masterexamen kräver 60 hp fördjupningskurser. Många arbetsgivare kräver kandidat som lägsta nivå för kvalificerade tjänster.'},
{t:'Campus vs distans',
s:'🏫 Campus:\n• Du är på plats på universitetet\n• Föreläsningar & gruparbeten\n• Kräver att du bor nära\n\n💻 Distans:\n• Studerar hemifrån\n• Flexibelt, passar familjeliv\n• Kräver disciplin\n\nMånga program erbjuder BÅDE.',
a:'Hybridprogram kombinerar campus-träffar (1-3 ggr/termin) med distansstudier. Söks via antagning.se precis som campus. CSN gäller för båda. Distansprogram har ofta något lägre antagningspoäng.'}
],
ex:{type:'build',title:'Utforska din universitetsväg',desc:'Hitta ett program som matchar dina mål.',
fields:[
{l:'Vilket yrke eller ämne intresserar dig?',ph:'T.ex. socionom, ekonom, lärare, IT, psykolog...'},
{l:'Vilken examensnivå siktar du på?',ph:'T.ex. Kandidat 3 år — vill sedan jobba direkt'},
{l:'Campus eller distans?',ph:'T.ex. Distans — har barn och jobb',hint:'Kolla antagning.se och filtrera på "distans".'},
{l:'Hittade du ett program? Vilket?',ph:'T.ex. Socionomprogrammet, Malmö universitet, 3.5 år'},
{l:'Vad krävs för antagning?',ph:'T.ex. Gymnasieexamen med Sv3, Eng5 och SH1b...',hint:'Kolla behörighetskraven noga!'}
]},
quiz:[
{q:'Hur många år är en kandidatexamen?',o:['2 år','3 år','5 år'],c:1},
{q:'Vad är "fri rörlighet" på universitetet?',o:['Gratis buss till campus','Du väljer kurser och takt själv','Du kan flytta mellan städer'],c:1},
{q:'Vad är skillnaden uni vs högskola?',o:['Priset','Uni får utfärda doktorsexamen','Ingen skillnad'],c:1},
{q:'Vad är 60 hp?',o:['En termin deltid','Ett år heltidsstudier','En kurs'],c:1},
{q:'Var söker du universitetsutbildningar?',o:['csn.se','antagning.se','uhr.se'],c:1}
],
pr:['Vilket program passar mig om jag vill bli socionom?','Förklara skillnaden kandidat och master enkelt.','Vilka behörighetskrav finns för ekonomprogrammet?']},

{id:'s14',icon:'🏫',title:'Gymnasiekomplettering',sub:'Det är aldrig för sent att läsa klart',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Varför gymnasiekomplettering?',
s:'Utan gymnasieexamen stängs många dörrar:\n\n❌ Kan inte söka YH\n❌ Kan inte söka universitetet\n❌ Sämre chans på många jobb\n\n✅ Men det är ALDRIG för sent!\nDu kan läsa klart gymnasiet som vuxen — i din takt.',
a:'Ca 15-20% av den vuxna befolkningen saknar fullständig gymnasieexamen. Som vuxen kan du läsa via Komvux gymnasial nivå. Det räknas exakt likadant som ett vanligt gymnasiebetyg vid ansökan till YH och uni.'},
{t:'GY-vux via Komvux',
s:'GY-vux = gymnasieutbildning för vuxna.\n\nDu kan:\n• Läsa enstaka kurser du saknar\n• Läsa ett helt program om du vill\n• Kombinera gamla betyg med nya\n• Förbättra ett dåligt betyg\n\nDet är gratis och du kan börja nästa termin.',
a:'Komvux gymnasial nivå ger behörighet precis som vanlig gymnasieutbildning. Viktigt: dina gamla betyg från ungdomen kombineras med nya betyg — du behöver inte läsa om allt. En meritpoängsberäkning görs på de bästa betygen.'},
{t:'Vad behöver du för YH och uni?',
s:'För YH:\n• Gymnasieexamen (oftast)\n• Specifika kurser varierar per program\n\nFör universitetet (grundbehörighet):\n• Svenska 2 eller 3\n• Engelska 5 eller 6\n• Matte 1a/1b\n\nMer info: antagning.se/behörighet',
a:'Grundbehörighet till högskola: Sv3/SVA3, En6, Ma1 + 9 av 12 specifika poäng. Specialbehörighet varierar per program. Socionom kräver t.ex. SH1b. Ingenjör kräver Fy1, Ke1, Ma3c. Kolla alltid exakt behörighet på antagning.se för just ditt program.'}
],
ex:{type:'build',title:'Din gymnasieplan',desc:'Ta reda på vad du saknar och hur du kompletterar.',
fields:[
{l:'Har du gymnasieexamen? Vad saknas?',ph:'T.ex. Saknar svenska 3 och matte 2 / Ingen examen alls'},
{l:'Vilket är ditt slutmål?',ph:'T.ex. Söka YH-utbildning till undersköterska',hint:'Målet avgör vilka kurser du behöver.'},
{l:'Vilka kurser behöver du läsa?',ph:'T.ex. Svenska som andraspråk 3, Matematik 1a...',hint:'Kolla behörighetskrav på antagning.se'},
{l:'Kontakta Komvux — när börjar du?',ph:'T.ex. Ansöker till höstterminen, sista dag 30 april',hint:'helsingborg.se/komvux för ansökan'}
]},
quiz:[
{q:'Kan vuxna läsa gymnasiekurser?',o:['Nej, bara ungdomar','Ja, via Komvux GY-vux','Bara på folkhögskola'],c:1},
{q:'Räknas GY-vux betyg lika som vanliga?',o:['Nej, lägre värde','Ja, exakt likadant','Beror på utbildningen'],c:1},
{q:'Vad krävs för grundbehörighet till uni?',o:['Bara gymnasieexamen','Sv3, En6, Ma1 + poäng','Högskoleprovet'],c:1},
{q:'Kan du förbättra ett gammalt dåligt betyg?',o:['Nej','Ja, via Komvux','Bara om du är under 30'],c:1}
],
pr:['Vilka kurser behöver jag för att söka socionomprogrammet?','Hur räknar jag ut om jag har grundbehörighet?','Hjälp mig planera att läsa klart gymnasiet på 1 år.']},

{id:'s15',icon:'⚡',title:'Korta certifieringskurser',sub:'1–8 veckor och direkt anställningsbar',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är kortare certifieringskurser?',
s:'Det finns massor av korta kurser som:\n• Tar 1-8 veckor\n• Ger ett certifikat eller körkort\n• Direkt ökar din chans till jobb\n\nExempel:\n🚛 Truckkort A+B\n🔒 Väktarutbildning\n🏥 Vård- och omsorgsintroduktion\n❤️ HLR-certifikat\n🍳 Livsmedelshygien\n🔧 Heta arbeten',
a:'Korta certifieringskurser är inte del av det offentliga skolsystemet. De erbjuds av privata aktörer, branschorganisationer och ibland AF. Många arbetsgivare kräver dessa som minimikrav. De kan kombineras med andra utbildningar.'},
{t:'Truckkort — ett exempel',
s:'Truckkort A+B är ett av de vanligaste:\n\n• A = motviktstruck\n• B = skjutstativtruck\n\n⏱️ Ca 3-6 veckor\n💰 Kostar ca 8 000-15 000 kr (privat)\n🆓 Gratis via AMU (om AF anvisar)\n\nMed truckkort ökar din lön direkt.',
a:'Truckkort utfärdas av ATEX-godkända utbildare. Giltighetstid: 5 år (kräver förnyelse). Kursen innehåller teori, praktik och körprov. Söks via privata aktörer (t.ex. Lager och Terminal Akademin) eller via AF som AMU.'},
{t:'Var hittar du dessa kurser?',
s:'🔵 Via Arbetsförmedlingen (AF)\n→ Fråga om AMU — kan vara gratis!\n\n🟢 Kommunen / Komvux\n→ Vissa kommuner erbjuder kortare yrkes-kurser\n\n🔴 Privata aktörer\n→ Dyrt men snabbt\n\n🟡 Branschorganisationer\n→ T.ex. Bevakningsbranschen för väktare\n→ Sveriges Åkeriföretag för yrkestrafik',
a:'Väktarutbildning: söks via Bevakningsbranschen (bevakningsbranschen.se), kräver godkänt av polisen. HLR: Svenska Hjärt-Lungräddningsrådet (hlr.nu). Heta arbeten: Svetskommissionen. Livsmedelshygien: Livsmedelsverket godkända aktörer.'}
],
ex:{type:'sort',title:'Var söker du kursen?',desc:'Sortera kurserna till rätt kanal.',catA:'Via AF / Gratis',catB:'Privat aktör / Bransch',
items:[{l:'Truckkort via AMU',c:'A'},{l:'Väktarutbildning',c:'B'},{l:'HLR-certifikat',c:'B'},{l:'Truck via AF-anvisning',c:'A'},{l:'Heta arbeten',c:'B'},{l:'Livsmedelshygien via Komvux',c:'A'}]},
quiz:[
{q:'Hur lång är en typisk certifieringskurs?',o:['1-2 år','1-8 veckor','6 månader'],c:1},
{q:'Truckkort A — vad kör du?',o:['Skjutstativtruck','Motviktstruck','Bandtruck'],c:1},
{q:'Hur får du truckkort gratis?',o:['Går inte','Via AMU hos Arbetsförmedlingen','Via kommunen alltid'],c:1},
{q:'Hur länge gäller ett truckkort?',o:['Livstid','5 år','1 år'],c:1},
{q:'Var söker du väktarutbildning?',o:['Komvux','bevakningsbranschen.se','antagning.se'],c:1}
],
pr:['Vilka certifieringskurser ökar chansen till lagerjobb?','Hur söker jag AMU för truckkort i Helsingborg?','Vad kostar en väktarutbildning och hur lång är den?']},

{id:'s16',icon:'🔨',title:'Lärlingsprogram & YA',sub:'Jobba och utbilda dig samtidigt',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är lärlingsprogram?',
s:'Lärling = du lär dig yrket på ett riktigt jobb.\n\nArbetsgivaren:\n• Lär dig yrket i praktiken\n• Betalar din utbildning\n• Betalar dig lön\n\nDu:\n• Jobbar och studerar parallellt\n• Får branschkompetens direkt\n• Har ett avtal som skyddar dig',
a:'Lärlingsprogrammet är en del av gymnasiala yrkesutbildningar men kan också ske som vuxen. Stor på bygg, el, VVS, industri och hantverk. Mer vanligt i Europa men växande i Sverige.'},
{t:'YA — Yrkesintroduktionsavtal',
s:'YA är speciellt för dig som:\n• Är under 25 år\n• Saknar erfarenhet inom branschen\n\nSå fungerar det:\n1. Du anställs av ett företag\n2. Företaget får lönestöd av AF\n3. Du får utbildning + handledning\n4. Avtalet gäller 6-24 månader\n\nFinns inom: bygg, el, handel, transport, vård',
a:'YA-avtal är kollektivavtalade och hanteras av branschorganisationer. Lönestödet gör det billigare för arbetsgivaren att ta in oerfarna. Arbetsgivaren förbinder sig att ge handledning och kompetenshöjning. Bra ingång för unga utan erfarenhet.'},
{t:'Hur hittar du en lärlingstjänst?',
s:'1. Platsbanken — sök "lärling" eller "trainee"\n2. LinkedIn — "lärling" + bransch\n3. Direkt till företag — fråga om YA\n4. Via AF — fråga om lönestödstjänster\n5. Branschorganisationer\n   → Byggnads, Elektrikerna, Handels\n\nVara proaktiv — de flesta annonseras inte!',
a:'Spontanansökan fungerar bra för YA-tjänster. Skriv till HR-avdelningen och nämn YA-avtal och AF:s lönestöd — många arbetsgivare vet inte att de kan få stödet. LinkedIn är effektivt för att hitta kontakter inom branschen.'}
],
ex:{type:'build',title:'Din lärlingsstrategi',desc:'Planera hur du hittar ett lärlingsprogram eller YA.',
fields:[
{l:'Vilken bransch intresserar dig?',ph:'T.ex. Bygg, el, VVS, handel, transport...'},
{l:'Är du under 25 år? (relevant för YA)',ph:'T.ex. Ja, 23 år — passar YA-avtal'},
{l:'Vilket företag vill du kontakta?',ph:'T.ex. Skanska, Eltel, lokalt byggföretag...',hint:'Tänk lokalt — var finns de i ditt område?'},
{l:'Vad ska du skriva i ditt brev?',ph:'T.ex. Jag vet att ni kan få lönestöd via YA-avtal och jag...',ta:true,hint:'Nämn YA och AF — det är säljargument!'}
]},
quiz:[
{q:'Vad är YA?',o:['Yrkesanalys','Yrkesintroduktionsavtal','Yrkesakademi'],c:1},
{q:'För vem gäller YA?',o:['Alla åldrar','Under 25 år utan branscherfarenhet','Bara gymnasieelever'],c:1},
{q:'Vem betalar utbildningen i lärlingsprogram?',o:['Du själv','CSN','Arbetsgivaren'],c:1},
{q:'Hur hittar du YA-tjänster effektivt?',o:['Bara Platsbanken','Spontanansökan + nämna YA','Via antagning.se'],c:1}
],
pr:['Skriv ett brev för att söka YA-anställning inom bygg.','Vilka branscher har flest YA-avtal i Skåne?','Hur presenterar jag YA-fördelar för en arbetsgivare?']},

{id:'s17',icon:'🌍',title:'Etableringsinsatser via AF',sub:'För dig med etableringsplan',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är etableringsplanen?',
s:'Om du är nyanländ i Sverige kan du ha rätt till en etableringsplan.\n\nPlanen innehåller:\n• SFI (svenska)\n• Samhällsorientering\n• Aktiviteter mot jobb eller studier\n\nDu får etableringsersättning istället för försörjningsstöd.\n\nPlanen gäller max 24 månader.',
a:'Etableringsplanen handläggs av Arbetsförmedlingen. Rätt till plan: skyddsbehövande, kvotflyktingar och deras anhöriga i åldern 20-64. Etableringsersättning: ca 308 kr/dag heltid. Aktivitetsnivån påverkar ersättningens storlek.'},
{t:'Insatser du kan få',
s:'Under etableringstiden kan du:\n\n📚 Läsa SFI på heltid\n🏗️ Praktisera på ett riktigt företag\n📋 Göra yrkesvalidering\n🎓 Söka AMU-utbildning\n💼 Delta i matchningsinsatser\n\nAllt samtidigt som du får ersättning.',
a:'Viktiga insatser: Snabbspåret (validering + komplettering för akademiker), yrkesintroduktion, kommunens bosättningsstöd, BAS-utbildning (yrkesvägledning). Samordning sker ofta mellan AF, kommunen och CSN.'},
{t:'Snabbspåret',
s:'Om du har yrkesutbildning från ditt hemland:\n\n→ Snabbspåret kan hjälpa dig att validera och komplettera direkt i ditt yrke\n\nFinns inom:\n• Vård & omsorg\n• Bygg\n• IT\n• Lärare\n• Ingenjör\n• Kock\n\nKontakta AF direkt och fråga om snabbspåret!',
a:'Snabbspåret är en samverkan mellan AF, branschorganisationer och utbildningsanordnare. Tidslinje: 1-2 år inklusive validering, komplettering och handledning på arbetsplats. Resulterar ofta i legitimation eller anställning direkt.'}
],
ex:{type:'build',title:'Kolla din etableringssituation',desc:'Ta reda på vad du har rätt till.',
fields:[
{l:'Har du en etableringsplan via AF?',ph:'T.ex. Ja, startade jan 2024, slutar jan 2026'},
{l:'Vilken bakgrund/utbildning har du?',ph:'T.ex. Sjuksköterska 4 år från Syrien / Ingen formell utbildning'},
{l:'Är du intresserad av Snabbspåret?',ph:'T.ex. Ja, jag har jobbat som kock i 10 år',hint:'Fråga din handläggare om Snabbspåret finns för ditt yrke!'},
{l:'Vad är ditt nästa steg?',ph:'T.ex. Boka möte med AF och fråga om yrkesvalidering och AMU'}
]},
quiz:[
{q:'Hur länge gäller en etableringsplan?',o:['6 månader','Max 24 månader','5 år'],c:1},
{q:'Vad är etableringsersättning?',o:['Bostadsbidrag','Ersättning under etableringstiden','Lön från arbetsgivaren'],c:1},
{q:'Vad är Snabbspåret?',o:['Snabb SFI-kurs','Validering och komplettering i ditt yrke','En kurs på AF'],c:1},
{q:'Vem handlägger etableringsplanen?',o:['Kommunen','Arbetsförmedlingen','Migrationsverket'],c:1}
],
pr:['Vad kan jag göra under min etableringstid?','Finns Snabbspåret för sjuksköterskor?','Hur kombinerar jag SFI med AMU under etableringsplanen?']},

{id:'s18',icon:'🧭',title:'SYV — Studie- och yrkesvägledning',sub:'Gratis professionell vägledning',color:'#60a5fa',bc:'rgba(96,165,250,.3)',bg:'rgba(96,165,250,.07)',
lessons:[
{t:'Vad är SYV?',
s:'SYV = Studie- och yrkesvägledare.\n\nDe hjälper dig att:\n• Hitta rätt utbildning\n• Förstå arbetsmarknaden\n• Sätta upp en realistisk plan\n• Välja rätt mellan YH, uni, Komvux...\n\nDet är helt GRATIS.',
a:'SYV är legitimerade vägledare med specialistkompetens i utbildnings- och arbetsmarknadsfrågor. De är anställda på kommuner, skolor och Arbetsförmedlingen. De har tystnadsplikt och är oberoende — de säljer inget.'},
{t:'Var hittar du en SYV?',
s:'Du kan träffa SYV på flera ställen:\n\n🏢 Kommunens vuxenutbildning (Komvux)\n→ Kontakta direkt och boka tid\n\n🏛️ Arbetsförmedlingen\n→ Be din handläggare om SYV-möte\n\n🏫 Folkhögskola\n→ Har egen SYV\n\n📱 Studera.nu — digital vägledning\n→ Chat och telefon, gratis',
a:'I Helsingborg: kontakta Vuxenutbildningen via helsingborg.se. Studera.nu erbjuder kostnadsfri vägledning på distans via telefon, chatt eller video. UHR driver också vägledning för akademiska frågor via antagning.se.'},
{t:'Vad kan du ta upp på mötet?',
s:'Ta gärna upp:\n\n✅ "Vilket yrke passar mig?"\n✅ "Vilken utbildning behöver jag?"\n✅ "Hur lång tid tar det?"\n✅ "Kan jag försörja mig under studier?"\n✅ "Vilket är mitt nästa steg?"\n\nIngen fråga är för liten!',
a:'Förbered dig inför mötet: lista dina intressen, din utbildningsbakgrund och dina mål. Ju mer du berättar, desto bättre hjälp får du. Be om en skriftlig sammanfattning av planen efter mötet.'}
],
ex:{type:'build',title:'Förbered ditt SYV-möte',desc:'Formulera dina frågor och mål inför mötet.',
fields:[
{l:'Vad är ditt huvudmål? (jobb eller utbildning)',ph:'T.ex. Bli undersköterska inom 2 år'},
{l:'Vad vet du inte och behöver hjälp med?',ph:'T.ex. Vilka kurser jag saknar, om mina betyg räcker...',ta:true},
{l:'Dina 3 viktigaste frågor till SYV',ph:'1. Hur snabbt kan jag nå mitt mål?\n2. Vilket är enklaste vägen?\n3. Kan jag läsa deltid och jobba?',ta:true},
{l:'Var bokar du din SYV-tid?',ph:'T.ex. Ringer Komvux Helsingborg: 042-10 50 00',hint:'Gör det nu — det är gratis!'}
]},
quiz:[
{q:'Vad kostar SYV-vägledning?',o:['500 kr/timme','Gratis','100 kr via kommunen'],c:1},
{q:'Var hittar du SYV?',o:['Bara på gymnasiet','Komvux, AF, folkhögskola och studera.nu','Bara online'],c:1},
{q:'Vad hjälper SYV med?',o:['Bara CV-skrivning','Utbildnings- och karriärplanering','Bara universitetsansökan'],c:1},
{q:'Har SYV tystnadsplikt?',o:['Nej','Ja','Bara för känsliga ärenden'],c:1}
],
pr:['Hjälp mig formulera frågor till mitt SYV-möte.','Vilken utbildningsväg är snabbast till [yrke]?','Sammanfatta min situation och rekommendera nästa steg.']},,
{id:'s20',icon:'🤖',title:'Din AI-SYV',sub:'Chatta med en AI-vägledare',color:'#38bdf8',bc:'rgba(56,189,248,.3)',bg:'rgba(56,189,248,.07)',
lessons:[
{t:'Vad är AI-SYV?',
s:'AI-SYV är din personliga studiestöd-robot — tillgänglig dygnet runt, helt gratis.\n\nDu kan fråga om:\n💬 Vilka utbildningar som passar dig\n💬 Vad olika utbildningar leder till för jobb\n💬 Löner och arbetsmarknad\n💬 Behörighet och antagningspoäng\n💬 Utbildningar i Familjen Helsingborg\n💬 Hur du kombinerar CSN med jobb\n\nAI-SYV kompletterar — men ersätter inte — en riktig SYV.',
a:'AI-SYV är byggd på Claude (Anthropic) och har specialiserad kunskap om det svenska utbildningssystemet med fokus på Helsingborg och Skåne. Den ger snabb grundinfo men för komplexa beslut är ett möte med en riktig SYV alltid värt det.'},
{t:'Konsten att ställa bra frågor',
s:'Ju mer du berättar, desto bättre svar.\n\n❌ Dålig fråga:\n"Vad ska jag studera?"\n\n✅ Bra fråga:\n"Jag har arbetat som chaufför i 5 år, har SFI C-klart och vill byta till vård. Vilka utbildningar passar mig i Helsingborg?"\n\n❌ Dålig fråga:\n"Är YH bra?"\n\n✅ Bra fråga:\n"Vilka YH-utbildningar finns inom IT i Helsingborg och vad leder de till för startlön?"',
a:'Specifika frågor med kontext (bakgrund, ort, mål, tidsperspektiv, ekonomi) ger alltid mer relevanta svar. Berätta vad du redan vet — AI-SYV bygger vidare på det och undviker att upprepa saker.'}
],
ex:{type:'ai-chat',title:'Chatta med AI-SYV'},
quiz:[
{q:'Vad kan du fråga AI-SYV om?',o:['Bara YH-utbildningar','Utbildningar, löner, behörighet och arbetsmarknad','Bara Helsingborg'],c:1},
{q:'Vad ger bäst svar från AI-SYV?',o:['Korta enkla frågor','Specifika frågor med bakgrund och mål','Ja/nej-frågor'],c:1},
{q:'Ersätter AI-SYV en riktig SYV?',o:['Ja, helt','Nej — kompletterar och ger snabb grundinfo','Bara för enklare frågor'],c:1},
{q:'Var hittar du en riktig SYV gratis?',o:['Bara på universitetet','Komvux, AF, folkhögskola och studera.nu','Det kostar alltid pengar'],c:1}
],
pr:['Vilken utbildning passar mig baserat på [din bakgrund]?','Hitta YH-utbildningar inom vård i Helsingborg.','Hur ansöker jag till Komvux och vilka kurser behöver jag?']}
];

  // Kategori-definitioner (samma som mobilen)
  const TRAINING_CATS = [
    { id: 'intro',    label: 'Intro',     icon: '🚀', color: '#3eb489', mods: INTRO },
    { id: 'arbete',   label: 'Arbete',    icon: '💼', color: '#f87171', mods: ARBETE },
    { id: 'studier',  label: 'Studier',   icon: '📖', color: '#60a5fa', mods: STUDIER },
    { id: 'halsa',    label: 'Hälsa',     icon: '🫀', color: '#fb923c', mods: HALSA },
    { id: 'ekonomi',  label: 'Ekonomi',   icon: '💰', color: '#a78bfa', mods: EKONOMI },
    { id: 'digital',  label: 'Digitalt',  icon: '🌐', color: '#34d399', mods: DIGITAL },
  ];

  // Bakåtkompatibilitet: TRAINING_MODULES = alla moduler i en array
  const TRAINING_MODULES = [].concat(INTRO, ARBETE, STUDIER, HALSA, EKONOMI, DIGITAL);

  // ============================================================
  // STATE
  // ============================================================
  let cvData = createEmptyCV();
  let currentView = 'hej';
  let currentStep = 'profil';
  let trainingProgress = loadTrainingProgress();
  let _saveDebounce = null;

  function createEmptyCV() {
    return {
      name: '', title: '', email: '', phone: '', summary: '',
      jobs: [], education: [],
      languages: [], certifications: [], licenses: [],
      references: [], refOnRequest: false,
      skills: [],
      photoData: null, showPhoto: false,
      template: 'classic'
    };
  }

  // ============================================================
  // STORAGE
  // ============================================================
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch(e) { return false; }
  }

  function loadCV() {
    const raw = safeGet(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      cvData = Object.assign(createEmptyCV(), parsed);
      // Säkerställ arrays
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      // Normalisera språk: äldre data kan vara strings, vi vill ha {name,level}
      cvData.languages = cvData.languages.map(l => {
        if (typeof l === 'string') return { name: l, level: 'Flytande' };
        if (l && typeof l === 'object' && l.name) return { name: l.name, level: l.level || 'Flytande' };
        return null;
      }).filter(Boolean);
      // Auto-sortera jobb och utbildning kronologiskt (nyaste/pågående överst)
      if (typeof sortJobsByDate === 'function') sortJobsByDate();
      if (typeof sortEducationByDate === 'function') sortEducationByDate();
    } catch(e) {
      console.error('Kunde inte ladda CV', e);
    }
  }

  function saveCVLocal() {
    safeSet(STORAGE_KEY, JSON.stringify(cvData));
  }

  function loadTrainingProgress() {
    const raw = safeGet(TRAINING_PROGRESS_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch(e) { return {}; }
  }

  function saveTrainingProgress() {
    safeSet(TRAINING_PROGRESS_KEY, JSON.stringify(trainingProgress));
  }

  // ============================================================
  // AUTH (OTP-flöde — speglar mobilen)
  // ============================================================
  let authCurrentEmail = '';

  function getAuth() {
    const raw = safeGet(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }

  // ───── TOKEN-REFRESH (håller sessionen vid liv månadsvis) ─────
  // Returnerar uppdaterat accessToken (från refresh om nödvändigt), eller null vid fel.
  let _refreshInFlight = null; // dedupe: samtidiga anrop delar samma refresh
  async function ensureFreshToken() {
    const auth = getAuth();
    if (!auth || !auth.accessToken) return null;

    // Ingen expiry-info → anta att token fortfarande är giltig (backward-compat)
    if (!auth.expiresAt) return auth.accessToken;

    // Giltig med marginal (> 5 min kvar)? Återanvänd
    const now = Date.now();
    const FIVE_MIN = 5 * 60 * 1000;
    if (auth.expiresAt - now > FIVE_MIN) return auth.accessToken;

    // Nära utgång eller utgången → försök refresh
    if (!auth.refreshToken) {
      // Ingen refresh_token = sessionen är pre-nivå3, behöver re-login
      await handleAuthExpired();
      return null;
    }
    // Dedupe: om refresh redan pågår, vänta på den
    if (_refreshInFlight) return _refreshInFlight;

    _refreshInFlight = (async () => {
      try {
        const r = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'refresh_token', refreshToken: auth.refreshToken })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.access_token) throw new Error(data.error || 'refresh failed');
        // Uppdatera lagring
        const expiresIn = data.expires_in || 3600;
        const updated = Object.assign({}, auth, {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || auth.refreshToken,
          expiresAt: Date.now() + (expiresIn * 1000)
        });
        safeSet(AUTH_STORAGE_KEY, JSON.stringify(updated));
        window.authAccessToken = data.access_token;
        return data.access_token;
      } catch(e) {
        console.warn('Token refresh failed:', e);
        await handleAuthExpired();
        return null;
      } finally {
        _refreshInFlight = null;
      }
    })();
    return _refreshInFlight;
  }
  window.ensureFreshToken = ensureFreshToken;

  // ───── SESSIONEN HAR GÅTT UT — re-login flow ─────
  async function handleAuthExpired() {
    // Rensa auth men behåll CV-data (användaren vill ju bara logga in igen)
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(e) {}
    window.authUserId = null;
    window.authAccessToken = null;
    toast('Sessionen har gått ut — logga in igen', 'error');
    setTimeout(() => showAuthOverlay(), 100);
  }
  window.handleAuthExpired = handleAuthExpired;

  // ───── MAGIC LINK-REDIRECT HANDLER ─────
  // När användare klickar magic link hamnar de på /?#access_token=...&refresh_token=...
  // Parsa, logga in, städa URL.
  async function handleMagicLinkRedirect() {
    if (!window.location.hash) return false;
    const hash = window.location.hash.substring(1); // ta bort '#'
    if (!hash.includes('access_token=')) return false;
    const params = new URLSearchParams(hash);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token') || '';
    const expiresIn    = parseInt(params.get('expires_in') || '3600', 10);
    const error        = params.get('error_description');

    if (error) {
      toast('Inloggning misslyckades: ' + error, 'error');
      // Städa URL så inget känsligt ligger kvar
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return false;
    }
    if (!accessToken) return false;

    // Hämta user-info från Supabase så vi vet vilken email/userId det är
    showAiLoader('Loggar in...', 'Verifierar magic link');
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user', accessToken })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.user || !data.user.email) throw new Error(data.error || 'ogiltig länk');
      const email = data.user.email;
      const userId = data.user.id;
      // Rensa URL-hashen innan vi loggar in (säkerhet + rent utseende)
      history.replaceState(null, '', window.location.pathname + window.location.search);
      hideAiLoader();
      await authSetLoggedIn(email, false, userId, accessToken, refreshToken, expiresIn);
      return true;
    } catch(e) {
      hideAiLoader();
      console.error('Magic link fail:', e);
      toast('Kunde inte logga in via magic link — pröva OTP istället', 'error');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return false;
    }
  }
  window.handleMagicLinkRedirect = handleMagicLinkRedirect;

  function showAuthOverlay() {
    const o = document.getElementById('loginOverlay');
    if (o) o.classList.remove('hidden');
    // Återställ till steg 1
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    const s1 = document.getElementById('authStep1');
    if (s1) s1.classList.add('active');
  }
  function hideAuthOverlay() {
    const o = document.getElementById('loginOverlay');
    if (o) o.classList.add('hidden');
  }

  function checkAuth() {
    const auth = getAuth();
    if (!auth || !auth.email) {
      showAuthOverlay();
      return false;
    }
    hideAuthOverlay();
    const sbName = document.getElementById('sbUserName');
    if (sbName) sbName.textContent = auth.email;
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = auth.email;
    window.authUserId = auth.userId || null;
    window.authAccessToken = auth.accessToken || null;
    authCurrentEmail = auth.email;

    // Synka från molnet i bakgrunden — sbCall auto-refreshar token om nära expiry
    if (auth.userId && auth.accessToken) {
      loadAllFromSupabase(auth.userId, auth.accessToken).catch(() => {});
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }
    return true;
  }

  // ── STEG 1 → STEG 2: skicka OTP-kod ───────────────────────
  window.authSendOtp = async function() {
    const input = document.getElementById('authEmail');
    const email = (input && input.value || '').trim().toLowerCase();
    const errEl = document.getElementById('authStep1Error');
    if (errEl) errEl.classList.remove('visible');

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      if (errEl) {
        errEl.textContent = 'Ange en giltig e-postadress.';
        errEl.classList.add('visible');
      }
      return;
    }

    const btn = document.getElementById('authSendBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span>Skickar...';
    }

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Något gick fel');

      authCurrentEmail = email;
      const disp = document.getElementById('authEmailDisplay');
      if (disp) disp.textContent = email;

      // Gå till steg 2
      document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
      document.getElementById('authStep2').classList.add('active');
      // Fokusera första kodrutan
      setTimeout(() => {
        const first = document.querySelector('.code-digit');
        if (first) first.focus();
      }, 200);

    } catch(e) {
      if (errEl) {
        errEl.textContent = e.message || 'Något gick fel, försök igen.';
        errEl.classList.add('visible');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Skicka kod till min e-post';
      }
    }
  };

  // ── Kodinputs: tangent/input/paste ─────────────────────────
  window.codeKeydown = function(e, idx) {
    const digits = document.querySelectorAll('.code-digit');
    if (e.key === 'Backspace' && !digits[idx].value && idx > 0) {
      digits[idx - 1].focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) digits[idx - 1].focus();
    if (e.key === 'ArrowRight' && idx < 5) digits[idx + 1].focus();
    if (e.key === 'Enter') {
      const full = Array.from(digits).map(d => d.value).join('');
      if (full.length === 6) window.authVerifyCode();
    }
  };

  window.codeInput = function(e, idx) {
    const digits = document.querySelectorAll('.code-digit');
    const val = e.target.value.replace(/\D/g, '');
    e.target.value = val.slice(-1);
    if (val) {
      e.target.classList.add('filled');
      if (idx < 5) digits[idx + 1].focus();
      const full = Array.from(digits).map(d => d.value).join('');
      if (full.length === 6) window.authVerifyCode();
    } else {
      e.target.classList.remove('filled');
    }
  };

  window.codePaste = function(e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = document.querySelectorAll('.code-digit');
    pasted.split('').forEach((ch, i) => {
      if (digits[i]) { digits[i].value = ch; digits[i].classList.add('filled'); }
    });
    const nextEmpty = Array.from(digits).findIndex(d => !d.value);
    if (nextEmpty >= 0) digits[nextEmpty].focus(); else digits[5].focus();
    if (pasted.length === 6) setTimeout(() => window.authVerifyCode(), 100);
  };

  // ── STEG 2 → verifiera kod ─────────────────────────────────
  window.authVerifyCode = async function() {
    const digits = document.querySelectorAll('.code-digit');
    const entered = Array.from(digits).map(d => d.value).join('');
    const errEl = document.getElementById('authStep2Error');
    if (errEl) errEl.classList.remove('visible');

    if (entered.length < 6) {
      if (errEl) {
        errEl.textContent = 'Ange alla 6 siffror.';
        errEl.classList.add('visible');
      }
      return;
    }

    const btn = document.getElementById('authVerifyBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span>Verifierar...';
    }

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', email: authCurrentEmail, token: entered })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Felaktig kod');

      const userId = (data.user && data.user.id) || '';
      const accessToken = data.access_token || '';
      const refreshToken = data.refresh_token || '';
      const expiresIn = data.expires_in || 3600; // Supabase default 1h
      // Mobilen sätter isNew=true vid verify_otp → visar onboarding-steg
      authSetLoggedIn(authCurrentEmail, true, userId, accessToken, refreshToken, expiresIn);

    } catch(e) {
      if (errEl) {
        errEl.textContent = e.message || 'Felaktig eller utgången kod. Försök igen.';
        errEl.classList.add('visible');
      }
      // Skaka kodfälten
      const ci = document.getElementById('codeInputs');
      if (ci) { ci.style.animation = 'none'; setTimeout(() => { ci.style.animation = ''; }, 100); }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verifiera kod';
      }
    }
  };

  // ── Spara login-state + ladda från moln innan onboarding-beslut ─
  async function authSetLoggedIn(email, isNew, userId, accessToken, refreshToken, expiresIn) {
    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    safeSet(AUTH_STORAGE_KEY, JSON.stringify({
      email: email,
      loggedIn: true,
      userId: userId || null,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt,
      createdAt: Date.now()
    }));
    window.authUserId = userId || null;
    window.authAccessToken = accessToken || null;
    authCurrentEmail = email;
    logEvent('login');

    const sbName = document.getElementById('sbUserName');
    if (sbName) sbName.textContent = email;
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = email;

    // Försök ladda befintliga data från molnet INNAN vi beslutar onboarding.
    // Gör att användare inte behöver fylla i namn igen i inkognito / ny enhet.
    let hasCloudData = false;
    if (userId && accessToken) {
      showAiLoader('Hämtar din data...', 'Synkar CV från molnet');
      try {
        hasCloudData = await loadAllFromSupabase(userId, accessToken);
      } catch(e) {
        console.error('loadAll failed:', e);
      }
      hideAiLoader();
      // Hämta tilldelade uppgifter i bakgrunden (silent)
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }

    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));

    // Ny användare = inkomna från verify_otp OCH inget namn lokalt/moln
    const needsOnboarding = isNew && !cvData.name && !hasCloudData;

    if (needsOnboarding) {
      const onbEmail = document.getElementById('onbEmail');
      if (onbEmail) onbEmail.textContent = email;
      const s4 = document.getElementById('authStep4');
      if (s4) s4.classList.add('active');
    } else {
      const wel = document.getElementById('authWelcomeText');
      if (wel) wel.textContent = 'Du är inloggad som ' + email;
      const s3 = document.getElementById('authStep3');
      if (s3) s3.classList.add('active');
    }
  }

  // ───── CENTRAL API-HELPER: auto-refresh + 401-handling ─────
  // Använd denna för alla /api/supabase-anrop som behöver auth
  async function sbCall(body) {
    // Steg 1: säkerställ fräscht token
    const token = await ensureFreshToken();
    if (!token) return { error: 'not_authenticated' };

    const mergedBody = Object.assign({}, body, { accessToken: token });

    // Steg 2: gör anropet
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedBody)
      });
      // 401 = token invalid → tvinga re-login
      if (r.status === 401) {
        await handleAuthExpired();
        return { error: 'unauthorized' };
      }
      const result = await r.json().catch(() => ({}));
      // Supabase kan också returnera ok=200 med result.error='unauthorized'
      if (result && result.error && String(result.error).toLowerCase().includes('unauthoriz')) {
        await handleAuthExpired();
      }
      return result || {};
    } catch(e) {
      console.warn('sbCall fail:', e);
      return { error: 'network' };
    }
  }
  window.sbCall = sbCall;

  // Ladda all användardata från Supabase — matchar mobilens loadAllFromSupabase
  async function loadAllFromSupabase(userId, accessToken) {
    try {
      // Använd sbCall så vi får auto-refresh gratis (accessToken-param ignoreras,
      // sbCall tar senaste token från getAuth)
      const result = await sbCall({ action: 'load_all', userId });
      if (!result || result.error) return false;

      let foundSomething = false;

      // CV-huvuddata
      if (result.cv && typeof result.cv === 'object') {
        cvData = Object.assign(createEmptyCV(), result.cv);
        ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
          if (!Array.isArray(cvData[k])) cvData[k] = [];
        });
        saveCVLocal();
        if (typeof loadCVIntoForm === 'function') loadCVIntoForm();
        if (typeof renderJobs === 'function') renderJobs();
        if (typeof renderEducation === 'function') renderEducation();
        if (typeof renderSkillsChips === 'function') renderSkillsChips();
        if (typeof renderLanguages === 'function') renderLanguages();
        if (typeof renderLicenses === 'function') renderLicenses();
        if (typeof renderPreview === 'function') renderPreview();
        if (typeof renderHejView === 'function') renderHejView();
        if (cvData.name) foundSomething = true;
      }

      // Sparade CV:n
      if (Array.isArray(result.savedCvs)) {
        safeSet(SAVED_CVS_KEY, JSON.stringify(result.savedCvs));
      }
      // Matchade CV:n
      if (Array.isArray(result.matchedCvs)) {
        safeSet(MATCHED_CVS_KEY, JSON.stringify(result.matchedCvs));
      }
      // Övningsprogress
      if (result.progress && typeof result.progress === 'object') {
        safeSet(TRAINING_PROGRESS_KEY, JSON.stringify(result.progress));
        trainingProgress = result.progress;
      }
      // Sparade utbildningar
      if (Array.isArray(result.savedEdu)) {
        safeSet('pf_saved_edu', JSON.stringify(result.savedEdu));
      }
      // Jobbdagbok
      if (Array.isArray(result.jobDiary)) {
        safeSet('pathfinder_job_diary', JSON.stringify(result.jobDiary));
      }

      return foundSomething;
    } catch(e) {
      console.error('loadAllFromSupabase error:', e);
      return false;
    }
  }

  window.authEnterApp = function() {
    hideAuthOverlay();
    toast('✅ Välkommen tillbaka!');
    // Rendera om aktuell vy
    if (currentView === 'profil') renderProfilView();
  };

  window.authCompleteOnboarding = function() {
    const firstName = (document.getElementById('onbFirstName').value || '').trim();
    const lastName  = (document.getElementById('onbLastName').value  || '').trim();
    const phone     = (document.getElementById('onbPhone').value     || '').trim();
    const email     = authCurrentEmail || '';
    const errEl     = document.getElementById('onbErr');

    if (!firstName) {
      errEl.textContent = 'Förnamn krävs.';
      errEl.classList.add('visible');
      return;
    }
    if (!lastName) {
      errEl.textContent = 'Efternamn krävs.';
      errEl.classList.add('visible');
      return;
    }

    cvData.name = (firstName + ' ' + lastName).trim();
    if (phone) cvData.phone = phone;
    if (email) cvData.email = email;
    saveCVLocal();

    // Synka med desktop-CV-fält
    const f = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    f('cv-name',  cvData.name);
    f('cv-email', email);
    f('cv-phone', phone);

    renderPreview();
    if (typeof renderHejView === 'function') renderHejView();
    hideAuthOverlay();
    toast('✅ Välkommen ' + firstName + '!');
    switchView('cv');
  };

  window.authGoBack = function() {
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    document.getElementById('authStep1').classList.add('active');
    document.querySelectorAll('.code-digit').forEach(d => {
      d.value = '';
      d.classList.remove('filled');
    });
  };

  window.authLoginMicrosoft = function() {
    const input = document.getElementById('authEmail');
    const email = input ? input.value.trim() : '';
    const url = email
      ? '/api/v1/auth/microsoft?e=' + encodeURIComponent(email)
      : '/api/v1/auth/microsoft';
    window.location.href = url;
  };

  // Bakåtkompat: om något i app.js fortfarande råkar kalla dessa
  window.loginMagicLink = window.authSendOtp;
  window.loginMicrosoft = window.authLoginMicrosoft;

  window.logout = function() {
    if (!confirm('Logga ut?')) return;
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(e) {}
    window.location.reload();
  };

  // ── Microsoft OAuth callback (läser ?ms_token=... / ?ms_error=... ur URL) ──
  function checkMicrosoftCallback() {
    const params = new URLSearchParams(window.location.search);
    const msToken = params.get('ms_token');
    const msError = params.get('ms_error');
    const msInfo  = params.get('ms_info');

    function cleanUrl() {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (msError) {
      const errorMessages = {
        'cancelled': 'Inloggningen avbröts.',
        'unauthorized': msInfo
          ? 'Emailen ' + msInfo + ' är inte registrerad som handläggare. Kontakta support.'
          : 'Din email är inte registrerad som handläggare.',
        'invalid_state': 'Säkerhetsfel vid inloggning. Försök igen.',
        'token_exchange_failed': 'Kunde inte verifiera Microsoft-inloggning. Försök igen.',
        'graph_failed': 'Kunde inte hämta din profilinfo från Microsoft. Försök igen.',
        'no_email': 'Din Microsoft-profil har ingen email. Kontakta IT-support.',
        'config_missing': 'Serverkonfiguration saknas. Kontakta administratör.',
        'admin_check_failed': 'Kunde inte verifiera behörighet. Försök igen.',
        'missing_code': 'Ofullständig inloggning från Microsoft. Försök igen.',
        'ms_error': 'Microsoft returnerade ett fel. Försök igen.',
        'unexpected': 'Ett oväntat fel inträffade. Försök igen.'
      };
      const msg = errorMessages[msError] || ('Inloggningsfel: ' + msError);
      cleanUrl();
      showAuthOverlay();
      const errEl = document.getElementById('authStep1Error');
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('visible');
      }
      return false;
    }

    if (msToken) {
      try {
        const parts = msToken.split('.');
        if (parts.length !== 2) throw new Error('Invalid token format');
        let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const payload = JSON.parse(atob(b64));

        safeSet(AUTH_STORAGE_KEY, JSON.stringify({
          email: payload.email,
          name: payload.name,
          role: payload.role,
          loggedIn: true,
          accessToken: msToken,
          loginMethod: 'microsoft',
          createdAt: Date.now(),
          expiresAt: payload.expiresAt
        }));
        window.authAccessToken = msToken;
        window.authUserEmail = payload.email;
        authCurrentEmail = payload.email;

        cleanUrl();
        hideAuthOverlay();
        const sbName = document.getElementById('sbUserName');
        if (sbName) sbName.textContent = payload.email;
        const pfEmail = document.getElementById('pfUserEmail');
        if (pfEmail) pfEmail.textContent = payload.email;
        logEvent('login');
        toast('✅ Inloggad som ' + payload.email);
        return true;
      } catch(e) {
        console.error('Microsoft token parse failed:', e);
        cleanUrl();
      }
    }
    return false;
  }

  // ============================================================
  // ACTIVITY LOG
  // ============================================================
  function logEvent(eventType, metadata) {
    if (!window.authUserId || !window.authAccessToken) return;
    fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_event',
        accessToken: window.authAccessToken,
        userId: window.authUserId,
        event_type: eventType,
        metadata: metadata || {}
      })
    }).catch(() => {});
  }

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = type === 'error' ? 'show error' : 'show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = ''; }, 3500);
  }

  // ============================================================
  // AI LOADER
  // ============================================================
  function showAiLoader(title, sub) {
    document.getElementById('aiLoaderTitle').textContent = title || 'Laddar...';
    document.getElementById('aiLoaderSub').textContent = sub || '';
    document.getElementById('aiLoader').classList.add('show');
  }
  function hideAiLoader() {
    document.getElementById('aiLoader').classList.remove('show');
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  window.openSettings = function() {
    // apiKeyInput är borttagen — AI går via backend-proxy, inte egen nyckel
    const keyInput = document.getElementById('apiKeyInput');
    if (keyInput) keyInput.value = safeGet(API_KEY_STORAGE) || '';
    document.getElementById('settingsModal').classList.add('open');
  };
  window.closeSettings = function() {
    document.getElementById('settingsModal').classList.remove('open');
  };
  window.saveApiKey = function() {
    // Legacy stub — API-nyckel används inte längre (backend hanterar AI)
    const keyInput = document.getElementById('apiKeyInput');
    if (keyInput) {
      const key = keyInput.value.trim();
      if (key) safeSet(API_KEY_STORAGE, key);
    }
    closeSettings();
  };
  function getApiKey() {
    return safeGet(API_KEY_STORAGE) || '';
  }

  // ============================================================
  // VIEW SWITCHING
  // ============================================================
  window.switchView = function(view) {
    // Städa upp ev. pågående intervju-session när vi lämnar intervju-vyn
    if (currentView === 'intervju' && view !== 'intervju' && typeof window.ivCleanup === 'function') {
      try { window.ivCleanup(); } catch(e) {}
    }

    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    const tabEl = document.querySelector('.sb-tab[data-view="' + view + '"]');
    if (tabEl) tabEl.classList.add('active');

    if (view === 'hej') {
      renderHejView();
    }
    if (view === 'cv') {
      cvSwitchStep(currentStep);
      renderPreview();
    }
    if (view === 'matcha') {
      if (typeof renderMatchaView === 'function') renderMatchaView();
    }
    if (view === 'intervju') {
      if (typeof window.ivInit === 'function') {
        try { window.ivInit(); } catch(e) { console.warn('Intervju init fail:', e); }
      }
    }
    if (view === 'aisyv') {
      // Alltid börja på AI-SYV startsidan (inte fastna i tidigare chat)
      if (typeof window.showHome === 'function') {
        try { window.showHome(); } catch(e) { console.warn('AI-SYV showHome fail:', e); }
      }
      if (typeof window.syvUpdateSavedBtn === 'function') {
        try { window.syvUpdateSavedBtn(); } catch(e) {}
      }
    }
    if (view === 'ovningar') {
      currentTrainCat = null;
      renderTrainingHome();
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }
    if (view === 'profil') {
      renderProfilView();
    }
  };

  // ============================================================
  // HEJ-VYN: personlig hälsning
  // ============================================================
  function renderHejView() {
    const el = document.getElementById('hejGreet');
    if (!el) return;
    const name = (cvData && cvData.name ? String(cvData.name).trim() : '');
    if (name) {
      const firstName = name.split(/\s+/)[0];
      el.textContent = 'Hej ' + firstName + ' 👋';
      el.style.display = 'block';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  // ============================================================
  // CV: STEP SWITCHING
  // ============================================================
  window.cvSwitchStep = function(step) {
    currentStep = step;
    document.querySelectorAll('.cv-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.cv-step-content').forEach(c => c.style.display = 'none');
    const stepBtn = document.querySelector('.cv-step[data-step="' + step + '"]');
    if (stepBtn) stepBtn.classList.add('active');
    const stepContent = document.getElementById('step-' + step);
    if (stepContent) stepContent.style.display = 'block';

    // Göm preview på alla steg utom Visa — edit-panelen tar då hela bredden
    const layout = document.querySelector('#view-cv .cv-layout');
    if (layout) {
      layout.classList.toggle('preview-hidden', step !== 'visa');
    }

    // Render step-specific content
    if (step === 'profil') { if (typeof syncPhotoUI === 'function') syncPhotoUI(); }
    if (step === 'jobb') { renderJobs(); renderEducation(); }
    if (step === 'mer')  {
      renderSkillsChips(); renderLanguages(); renderLicenses();
      if (typeof renderCerts === 'function') renderCerts();
      if (typeof renderRefs === 'function')  renderRefs();
    }
    if (step === 'visa') { renderTemplates(); }

    renderPreview();
    markStepDone(step);
    updateStepNav();

    // Skrolla upp till toppen av edit-panelen
    const panel = document.querySelector('.cv-edit-panel');
    if (panel) panel.scrollTop = 0;
    // Skrolla även vyn till toppen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const CV_STEP_ORDER = ['profil', 'jobb', 'mer', 'text', 'visa'];

  window.cvStepBack = function() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    if (i > 0) cvSwitchStep(CV_STEP_ORDER[i - 1]);
  };
  window.cvStepNext = function() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    if (i >= 0 && i < CV_STEP_ORDER.length - 1) cvSwitchStep(CV_STEP_ORDER[i + 1]);
  };

  function updateStepNav() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    const backBtn = document.getElementById('cvStepNavBack');
    const nextBtn = document.getElementById('cvStepNavNext');
    const nav = document.getElementById('cvStepNav');
    if (backBtn) {
      const hasPrev = i > 0;
      backBtn.style.display = hasPrev ? '' : 'none';
      const prev = hasPrev ? CV_STEP_ORDER[i - 1] : '';
      const labels = { profil:'Profil', jobb:'Jobb & Utb', mer:'Mer', text:'Text', visa:'Visa' };
      backBtn.textContent = prev ? '← ' + labels[prev] : '← Tillbaka';
    }
    if (nextBtn) {
      const hasNext = (i >= 0 && i < CV_STEP_ORDER.length - 1);
      // Dölj helt på sista steget (Visa) istället för disabled
      nextBtn.style.display = hasNext ? '' : 'none';
      const next = hasNext ? CV_STEP_ORDER[i + 1] : '';
      const labels = { profil:'Profil', jobb:'Jobb & Utb', mer:'Mer', text:'Text', visa:'Visa' };
      nextBtn.textContent = next ? labels[next] + ' →' : 'Nästa →';
    }
    // Om både är dolda → dölj hela navigationsraden
    if (nav) {
      const anyVisible = (backBtn && backBtn.style.display !== 'none') || (nextBtn && nextBtn.style.display !== 'none');
      nav.style.display = anyVisible ? '' : 'none';
      // På sista steget: om bara tillbaka syns, centrera den vänster
      nav.style.justifyContent = (nextBtn && nextBtn.style.display === 'none') ? 'flex-start' : 'space-between';
    }
  }

  function markStepDone(step) {
    // En enkel "done"-indikator: profilen är ifylld om name+title finns
    const done = {
      profil: !!(cvData.name && cvData.title),
      jobb:   cvData.jobs.length > 0 || cvData.education.length > 0,
      mer:    cvData.skills.length > 0,
      text:   !!cvData.summary,
      visa:   !!cvData.template,
    };
    Object.keys(done).forEach(s => {
      const btn = document.querySelector('.cv-step[data-step="' + s + '"]');
      if (!btn) return;
      btn.classList.toggle('done', done[s] && currentStep !== s);
    });
  }

  // ============================================================
  // CV: FIELD UPDATE
  // ============================================================
  window.cvUpdate = function(field, value) {
    cvData[field] = value;
    saveCVLocal();
    renderPreview();
    markStepDone(currentStep);
    // Debounce auto-save till Supabase
    clearTimeout(_saveDebounce);
    _saveDebounce = setTimeout(() => {
      // Bara auto-spara om CV redan har varit sparat
      // (annars triggar varje knapptryck en spara)
    }, 3000);
  };

  function loadCVIntoForm() {
    document.getElementById('cv-name').value    = cvData.name    || '';
    document.getElementById('cv-title').value   = cvData.title   || '';
    document.getElementById('cv-email').value   = cvData.email   || '';
    document.getElementById('cv-phone').value   = cvData.phone   || '';
    document.getElementById('cv-summary').value = cvData.summary || '';
    // Säkerställ arrays som kan saknas i äldre data
    if (!Array.isArray(cvData.certifications)) cvData.certifications = [];
    if (!Array.isArray(cvData.references))     cvData.references     = [];
    // Synka foto/cert/ref-UI om de finns
    if (typeof syncPhotoUI === 'function') syncPhotoUI();
    if (typeof renderCerts === 'function') renderCerts();
    if (typeof renderRefs  === 'function') renderRefs();
  }

  // ============================================================
  // CV: JOBS & EDUCATION
  // ============================================================
  function renderJobs() {
    const list = document.getElementById('jobsList');
    if (!cvData.jobs.length) {
      list.innerHTML = '<div class="empty">Inga jobb tillagda än</div>';
      return;
    }
    list.innerHTML = cvData.jobs.map((j, i) => {
      const period = formatJobPeriod(j) || ((j.startYear || '') + '–' + (j.endYear || 'nu'));
      const loc = j.location ? ' · ' + escape(j.location) : '';
      const descs = [j.desc1, j.desc2, j.desc3].filter(Boolean);
      const descHtml = descs.length
        ? `<div class="item-card-desc">${descs.map(d => '• ' + escape(d)).join('<br>')}</div>`
        : (j.desc ? `<div class="item-card-desc">${escape(j.desc)}</div>` : '');
      return `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(j.title || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(j.company || '')} · ${escape(period)}${loc}</div>
          ${descHtml}
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditJob(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteJob(${i})" title="Ta bort">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderEducation() {
    const list = document.getElementById('eduList');
    if (!cvData.education.length) {
      list.innerHTML = '<div class="empty">Ingen utbildning tillagd än</div>';
      return;
    }
    list.innerHTML = cvData.education.map((e, i) => {
      const from = formatPeriod(e.startMonth, e.startYear);
      const to = (e.ongoing || e.endYear === 'Pågående' || e.endYear === 'nu') ? 'nu' : formatPeriod(e.endMonth, e.endYear);
      const period = (from || to) ? (from || '') + '–' + (to || '') : '';
      const school = e.schoolName || e.school || '';
      const form = e.schoolForm ? ' · ' + escape(e.schoolForm) : '';
      return `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(e.degree || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(school)}${period ? ' · ' + escape(period) : ''}${form}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditEdu(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteEdu(${i})" title="Ta bort">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  // ============================================================
  // CV: JOBB — riktig modal matchande mobilen
  // ============================================================
  const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

  // Fyll år-dropdowns (40 år tillbaka + 10 framåt)
  function populateYearDropdowns() {
    const now = new Date().getFullYear();
    const options = ['<option value="">År</option>'];
    for (let y = now + 5; y >= now - 50; y--) {
      options.push(`<option value="${y}">${y}</option>`);
    }
    const html = options.join('');
    ['jobStartYear','jobEndYear','eduStartYear','eduEndYear'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  window.cvAddJob = function() { openJobModal(); };
  window.cvEditJob = function(i) { openJobModal(i); };

  window.cvDeleteJob = function(i) {
    if (!confirm('Ta bort detta jobb?')) return;
    cvData.jobs.splice(i, 1);
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
  };

  window.openJobModal = function(idx) {
    populateYearDropdowns();
    const modal = document.getElementById('jobModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('jobModalTitle').textContent = isEdit ? 'Redigera arbetslivserfarenhet' : 'Lägg till arbetslivserfarenhet';

    // Visa befintliga jobb ovanför formuläret — bara vid "Lägg till" när det redan finns jobb
    const existingBox = document.getElementById('jobModalExisting');
    const existingList = document.getElementById('jobModalExistingList');
    if (existingBox && existingList) {
      const otherJobs = (cvData.jobs || []).filter((_, i) => i !== idx);
      if (otherJobs.length > 0) {
        existingList.innerHTML = otherJobs.map(j => {
          const period = formatJobPeriod(j) || '(ingen period)';
          const label = (j.title || '(ingen titel)') + (j.company ? ' · ' + j.company : '');
          return '<div style="display:flex; justify-content:space-between; gap:10px; font-size:12px; color:rgba(255,255,255,0.75);">' +
            '<span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escape(label) + '</span>' +
            '<span style="color:var(--accent2); font-weight:600; flex-shrink:0;">' + escape(period) + '</span>' +
          '</div>';
        }).join('');
        existingBox.style.display = 'block';
      } else {
        existingBox.style.display = 'none';
      }
    }

    const e = isEdit ? (cvData.jobs[idx] || {}) : {};

    document.getElementById('jobTitle').value    = e.title    || '';
    document.getElementById('jobCompany').value  = e.company  || '';
    document.getElementById('jobLocation').value = e.location || '';

    document.getElementById('jobStartMonth').value = e.startMonth || '';
    document.getElementById('jobStartYear').value  = e.startYear  || '';

    // Pågående: backward-compat med 'nu' / 'Pågående' / ongoing:true
    const ongoing = (e.ongoing === true || e.endYear === 'nu' || e.endYear === 'Pågående');
    document.getElementById('jobOngoing').checked = !!ongoing;
    document.getElementById('jobEndMonth').value = ongoing ? '' : (e.endMonth || '');
    document.getElementById('jobEndYear').value  = ongoing ? '' : (e.endYear  || '');
    toggleJobOngoing(document.getElementById('jobOngoing'));

    // Arbetsuppgifter (backward-compat: gammal data kan ha bara `desc`)
    const desc1 = e.desc1 != null ? e.desc1 : (e.desc ? String(e.desc).split('\n')[0] || '' : '');
    const desc2 = e.desc2 != null ? e.desc2 : (e.desc ? String(e.desc).split('\n')[1] || '' : '');
    const desc3 = e.desc3 != null ? e.desc3 : (e.desc ? String(e.desc).split('\n')[2] || '' : '');
    document.getElementById('jobDesc1').value = desc1;
    document.getElementById('jobDesc2').value = desc2;
    document.getElementById('jobDesc3').value = desc3;

    modal.classList.add('open');
    setTimeout(() => document.getElementById('jobTitle').focus(), 100);
  };

  window.closeJobModal = function() {
    document.getElementById('jobModal').classList.remove('open');
  };

  window.toggleJobOngoing = function(cb) {
    const m = document.getElementById('jobEndMonth');
    const y = document.getElementById('jobEndYear');
    if (cb.checked) {
      m.value = ''; y.value = '';
      m.disabled = true; y.disabled = true;
      m.style.opacity = '0.4'; y.style.opacity = '0.4';
    } else {
      m.disabled = false; y.disabled = false;
      m.style.opacity = '1'; y.style.opacity = '1';
    }
  };

  window.clearJobDesc = function() {
    document.getElementById('jobDesc1').value = '';
    document.getElementById('jobDesc2').value = '';
    document.getElementById('jobDesc3').value = '';
  };

  window.saveJobFromModal = function() {
    const title      = document.getElementById('jobTitle').value.trim();
    const company    = document.getElementById('jobCompany').value.trim();
    const location   = document.getElementById('jobLocation').value.trim();
    const startMonth = document.getElementById('jobStartMonth').value;
    const startYear  = document.getElementById('jobStartYear').value;
    const ongoing    = document.getElementById('jobOngoing').checked;
    const endMonth   = ongoing ? '' : document.getElementById('jobEndMonth').value;
    const endYear    = ongoing ? 'Pågående' : document.getElementById('jobEndYear').value;
    const desc1      = document.getElementById('jobDesc1').value.trim();
    const desc2      = document.getElementById('jobDesc2').value.trim();
    const desc3      = document.getElementById('jobDesc3').value.trim();

    if (!title)   { toast('Fyll i jobbtitel', 'error'); document.getElementById('jobTitle').focus(); return; }
    if (!company) { toast('Fyll i företag',   'error'); document.getElementById('jobCompany').focus(); return; }

    const job = {
      title, company, location,
      startMonth, startYear,
      endMonth, endYear,
      ongoing,
      desc1, desc2, desc3
    };

    const idx = parseInt(document.getElementById('jobModal').dataset.editIdx);
    if (idx >= 0 && cvData.jobs[idx]) {
      cvData.jobs[idx] = job;
    } else {
      cvData.jobs.push(job);
    }
    sortJobsByDate();
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
    closeJobModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Arbetslivserfarenhet sparad'));
  };

  // ── AI Autofyll för arbetsuppgifter (matchar mobilens aiAutofillJobDesc) ──
  window.aiAutofillJobDesc = async function() {
    const title    = document.getElementById('jobTitle').value.trim();
    const company  = document.getElementById('jobCompany').value.trim();
    const location = document.getElementById('jobLocation').value.trim();
    const startY   = document.getElementById('jobStartYear').value.trim();
    const endY     = document.getElementById('jobEndYear').value.trim();

    if (!title) {
      toast('⚠️ Skriv in en jobbtitel först', 'error');
      return;
    }

    // Räkna dubbletter med samma titel → AI ska generera unika meningar
    const existingWithSameTitle = (cvData.jobs || []).filter(j =>
      j.title && j.title.toLowerCase().trim() === title.toLowerCase().trim()
    );
    const duplicateCount = existingWithSameTitle.length;
    const allExistingTasks = (cvData.jobs || [])
      .flatMap(j => [j.desc1, j.desc2, j.desc3].filter(Boolean));

    const periodStr = startY ? (startY + (endY ? '–' + endY : '–nu')) : '';

    const uniquenessInstruction = duplicateCount > 0
      ? `OBS: Det finns redan ${duplicateCount} jobb med titeln "${title}". Arbetsuppgifterna MÅSTE vara helt annorlunda. Fokusera på ${company ? company + ':s specifika miljö' : 'en annan aspekt av rollen'}.`
      : '';

    const forbiddenList = allExistingTasks.length > 0
      ? '\n\nFöljande meningar finns REDAN — använd INTE dessa eller liknande:\n' +
        allExistingTasks.map((t, i) => (i+1) + '. ' + t).join('\n')
      : '';

    const prompt = [
      'Skriv 3 korta, konkreta arbetsuppgiftsmeningar på svenska för:',
      'Titel: ' + title,
      company  ? 'Arbetsgivare: ' + company  : '',
      location ? 'Ort: ' + location          : '',
      periodStr ? 'Period: ' + periodStr     : '',
      uniquenessInstruction,
      forbiddenList,
      '',
      'Regler:',
      '- Varje mening unik och specifik för denna arbetsplats',
      '- Börja varje mening med ett starkt verb (Ansvarade, Ledde, Utvecklade, Samordnade)',
      '- Inga generiska fraser',
      '- Svenska, professionell ton',
      '',
      'Svara BARA med JSON: {"arbetsuppgifter": ["mening1", "mening2", "mening3"]}'
    ].filter(Boolean).join('\n');

    const btn = document.getElementById('jobAutofillBtn');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ AI genererar...'; }
    showAiLoader('Genererar arbetsuppgifter...', 'AI skriver unika meningar');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) throw new Error('API-fel: ' + response.status);
      const data = await response.json();
      const rawText = (data.content && data.content[0] && data.content[0].text || '').trim().replace(/```json|```/g, '').trim();
      let parsed;
      try { parsed = JSON.parse(rawText); } catch(e) { parsed = { arbetsuppgifter: [] }; }

      const tasks = parsed.arbetsuppgifter || [];
      if (tasks[0]) document.getElementById('jobDesc1').value = tasks[0];
      if (tasks[1]) document.getElementById('jobDesc2').value = tasks[1];
      if (tasks[2]) document.getElementById('jobDesc3').value = tasks[2];

      hideAiLoader();
      toast('✨ AI-förslag klara!');
      logEvent('ai_cv_analysis', { context: 'job_autofill' });
    } catch(e) {
      hideAiLoader();
      toast('AI-fel: ' + (e.message || 'okänt'), 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText || '✨ AI Autofyll'; }
    }
  };

  // ============================================================
  // CV: UTBILDNING — riktig modal matchande mobilen
  // ============================================================
  window.cvAddEdu = function() { openEduModal(); };
  window.cvEditEdu = function(i) { openEduModal(i); };

  window.cvDeleteEdu = function(i) {
    if (!confirm('Ta bort denna utbildning?')) return;
    cvData.education.splice(i, 1);
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
  };

  window.openEduModal = function(idx) {
    populateYearDropdowns();
    const modal = document.getElementById('eduModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('eduModalTitle').textContent = isEdit ? 'Redigera utbildning' : 'Lägg till utbildning';

    const e = isEdit ? (cvData.education[idx] || {}) : {};
    document.getElementById('eduDegree').value     = e.degree     || '';
    document.getElementById('eduSchoolName').value = e.schoolName || e.school || '';
    document.getElementById('eduSchoolForm').value = e.schoolForm || '';
    document.getElementById('eduStartMonth').value = e.startMonth || '';
    document.getElementById('eduStartYear').value  = e.startYear  || '';

    const ongoing = (e.ongoing === true || e.endYear === 'Pågående' || e.endYear === 'nu');
    document.getElementById('eduOngoing').checked = !!ongoing;
    document.getElementById('eduEndMonth').value = ongoing ? '' : (e.endMonth || '');
    document.getElementById('eduEndYear').value  = ongoing ? '' : (e.endYear  || '');
    toggleEduOngoing(document.getElementById('eduOngoing'));

    modal.classList.add('open');
    setTimeout(() => document.getElementById('eduDegree').focus(), 100);
  };

  window.closeEduModal = function() {
    document.getElementById('eduModal').classList.remove('open');
  };

  window.toggleEduOngoing = function(cb) {
    const m = document.getElementById('eduEndMonth');
    const y = document.getElementById('eduEndYear');
    if (cb.checked) {
      m.value = ''; y.value = '';
      m.disabled = true; y.disabled = true;
      m.style.opacity = '0.4'; y.style.opacity = '0.4';
    } else {
      m.disabled = false; y.disabled = false;
      m.style.opacity = '1'; y.style.opacity = '1';
    }
  };

  window.saveEduFromModal = function() {
    const degree     = document.getElementById('eduDegree').value.trim();
    const schoolName = document.getElementById('eduSchoolName').value.trim();
    const schoolForm = document.getElementById('eduSchoolForm').value;
    const startMonth = document.getElementById('eduStartMonth').value;
    const startYear  = document.getElementById('eduStartYear').value;
    const ongoing    = document.getElementById('eduOngoing').checked;
    const endMonth   = ongoing ? '' : document.getElementById('eduEndMonth').value;
    const endYear    = ongoing ? 'Pågående' : document.getElementById('eduEndYear').value;

    if (!degree)     { toast('Fyll i examen/utbildning', 'error'); document.getElementById('eduDegree').focus(); return; }
    if (!schoolName) { toast('Fyll i skola',             'error'); document.getElementById('eduSchoolName').focus(); return; }

    const edu = {
      degree,
      schoolName,
      school: schoolName, // alias för backward-compat med preview
      schoolForm,
      startMonth, startYear,
      endMonth, endYear,
      ongoing
    };

    const idx = parseInt(document.getElementById('eduModal').dataset.editIdx);
    if (idx >= 0 && cvData.education[idx]) {
      cvData.education[idx] = edu;
    } else {
      cvData.education.push(edu);
    }
    sortEducationByDate();
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
    closeEduModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Utbildning sparad'));
  };

  // Stäng modal vid klick på backdrop
  // Bakåtkompat: backdrop-click stänger INTE modalen — endast Spara/Avbryt/Escape.
  // (tidigare fanns en click-handler som stängde vid klick utanför, men det förstörde UX)

  // Escape-tangent stänger öppen modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.edit-modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Hjälpare: formatera period för visning
  function formatPeriod(month, year) {
    if (!year) return '';
    return month ? (month + ' ' + year) : year;
  }
  function formatJobPeriod(j) {
    const from = formatPeriod(j.startMonth, j.startYear);
    const toYear = (j.ongoing || j.endYear === 'Pågående' || j.endYear === 'nu') ? 'nu' : (j.endYear || '');
    const toMonth = (j.ongoing || j.endYear === 'Pågående' || j.endYear === 'nu') ? '' : (j.endMonth || '');
    const to = (toYear === 'nu') ? 'nu' : formatPeriod(toMonth, toYear);
    if (!from && !to) return '';
    return (from || '') + ' – ' + (to || '');
  }
  window.formatJobPeriod = formatJobPeriod;

  // ============================================================
  // KRONOLOGISK SORTERING — nyaste/pågående överst
  // ============================================================
  const MONTH_MAP = { Jan:1, Feb:2, Mar:3, Apr:4, Maj:5, Jun:6, Jul:7, Aug:8, Sep:9, Okt:10, Nov:11, Dec:12 };

  // Returnerar en numerisk "sort-vikt" där högre = nyare
  // Pågående/ongoing jobb = Infinity (hamnar alltid överst)
  function entryEndWeight(e) {
    if (!e) return 0;
    const isOngoing = (e.ongoing === true || e.endYear === 'Pågående' || e.endYear === 'nu' || !e.endYear);
    if (isOngoing) return Infinity;
    const y = parseInt(e.endYear, 10) || 0;
    const m = MONTH_MAP[e.endMonth] || 0;
    return y * 100 + m;
  }
  // Fallback om två har samma slutdatum → sortera på start (nyaste start först)
  function entryStartWeight(e) {
    if (!e) return 0;
    const y = parseInt(e.startYear, 10) || 0;
    const m = MONTH_MAP[e.startMonth] || 0;
    return y * 100 + m;
  }

  function sortJobsByDate() {
    if (!Array.isArray(cvData.jobs)) return;
    cvData.jobs.sort((a, b) => {
      const ae = entryEndWeight(a), be = entryEndWeight(b);
      if (ae !== be) return be - ae;            // senast avslutat överst
      return entryStartWeight(b) - entryStartWeight(a); // tie: senaste start överst
    });
  }
  function sortEducationByDate() {
    if (!Array.isArray(cvData.education)) return;
    cvData.education.sort((a, b) => {
      const ae = entryEndWeight(a), be = entryEndWeight(b);
      if (ae !== be) return be - ae;
      return entryStartWeight(b) - entryStartWeight(a);
    });
  }
  window.sortJobsByDate = sortJobsByDate;
  window.sortEducationByDate = sortEducationByDate;

  // ============================================================
  // PROFILBILD
  // ============================================================
  window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Filstorleks-kontroll (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('Bilden är för stor (max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      cvData.photoData = e.target.result;
      const img = document.getElementById('profilePhoto');
      const ph  = document.getElementById('photoPreviewPlaceholder');
      img.src = cvData.photoData;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
      const removeBtn = document.getElementById('removePhotoBtn');
      if (removeBtn) removeBtn.disabled = false;
      saveCVLocal();
      renderPreview();
      toast('✅ Profilbild sparad');
    };
    reader.readAsDataURL(file);
  };

  window.removeProfilePhoto = function() {
    cvData.photoData = null;
    const img = document.getElementById('profilePhoto');
    const ph  = document.getElementById('photoPreviewPlaceholder');
    const upload = document.getElementById('photoUpload');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (ph)  ph.style.display = '';
    if (upload) upload.value = '';
    const removeBtn = document.getElementById('removePhotoBtn');
    if (removeBtn) removeBtn.disabled = true;
    saveCVLocal();
    renderPreview();
    toast('🗑️ Profilbild borttagen');
  };

  window.setShowPhoto = function(show) {
    cvData.showPhoto = !!show;
    const yes = document.getElementById('photoYesBtn');
    const no  = document.getElementById('photoNoBtn');
    const sec = document.getElementById('photoUploadSection');
    if (yes) yes.classList.toggle('active', !!show);
    if (no)  no.classList.toggle('active', !show);
    if (sec) sec.style.display = show ? 'block' : 'none';
    saveCVLocal();
    renderPreview();
  };

  function syncPhotoUI() {
    // Kör när cvData laddats in (form init eller moln-synk)
    const show = cvData.showPhoto === true;
    const yes = document.getElementById('photoYesBtn');
    const no  = document.getElementById('photoNoBtn');
    const sec = document.getElementById('photoUploadSection');
    if (yes) yes.classList.toggle('active', show);
    if (no)  no.classList.toggle('active', !show);
    if (sec) sec.style.display = show ? 'block' : 'none';

    const img = document.getElementById('profilePhoto');
    const ph  = document.getElementById('photoPreviewPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (cvData.photoData) {
      if (img) { img.src = cvData.photoData; img.style.display = 'block'; }
      if (ph)  ph.style.display = 'none';
      if (removeBtn) removeBtn.disabled = false;
    } else {
      if (img) { img.src = ''; img.style.display = 'none'; }
      if (ph)  ph.style.display = '';
      if (removeBtn) removeBtn.disabled = true;
    }
  }
  window.syncPhotoUI = syncPhotoUI;

  // ============================================================
  // CERTIFIKAT
  // ============================================================
  window.openCertModal = function(idx) {
    const modal = document.getElementById('certModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('certModalTitle').textContent = isEdit ? 'Redigera certifikat' : 'Lägg till certifikat';

    const c = isEdit ? (cvData.certifications[idx] || {}) : {};
    document.getElementById('certName').value   = c.name   || '';
    document.getElementById('certIssuer').value = c.issuer || '';
    document.getElementById('certDate').value   = c.date   || '';

    modal.classList.add('open');
    setTimeout(() => document.getElementById('certName').focus(), 100);
  };

  window.closeCertModal = function() {
    document.getElementById('certModal').classList.remove('open');
  };

  window.saveCertFromModal = function() {
    const name   = document.getElementById('certName').value.trim();
    const issuer = document.getElementById('certIssuer').value.trim();
    const date   = document.getElementById('certDate').value.trim();

    if (!name)   { toast('Fyll i certifikatets namn', 'error'); document.getElementById('certName').focus(); return; }
    if (!issuer) { toast('Fyll i utfärdare',         'error'); document.getElementById('certIssuer').focus(); return; }

    const cert = { name, issuer, date };
    const idx = parseInt(document.getElementById('certModal').dataset.editIdx);
    if (!Array.isArray(cvData.certifications)) cvData.certifications = [];
    if (idx >= 0 && cvData.certifications[idx]) {
      cvData.certifications[idx] = cert;
    } else {
      cvData.certifications.push(cert);
    }
    saveCVLocal();
    renderCerts();
    renderPreview();
    closeCertModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Certifikat sparat'));
  };

  window.cvDeleteCert = function(i) {
    if (!confirm('Ta bort detta certifikat?')) return;
    cvData.certifications.splice(i, 1);
    saveCVLocal();
    renderCerts();
    renderPreview();
  };

  function renderCerts() {
    const list = document.getElementById('certsList');
    if (!list) return;
    if (!Array.isArray(cvData.certifications) || !cvData.certifications.length) {
      list.innerHTML = '<div class="empty">Inga certifikat tillagda än</div>';
      return;
    }
    list.innerHTML = cvData.certifications.map((c, i) => `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(c.name || 'Utan namn')}</div>
          <div class="item-card-meta">${escape(c.issuer || '')}${c.date ? ' · ' + escape(c.date) : ''}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="openCertModal(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteCert(${i})" title="Ta bort">✕</button>
        </div>
      </div>`).join('');
  }
  window.renderCerts = renderCerts;

  // ============================================================
  // REFERENSER
  // ============================================================
  window.openRefModal = function(idx) {
    const modal = document.getElementById('refModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('refModalTitle').textContent = isEdit ? 'Redigera referens' : 'Lägg till referens';

    const r = isEdit ? (cvData.references[idx] || {}) : {};
    document.getElementById('refName').value  = r.name  || '';
    document.getElementById('refTitle').value = r.title || '';
    document.getElementById('refEmail').value = r.email || '';
    document.getElementById('refPhone').value = r.phone || '';

    modal.classList.add('open');
    setTimeout(() => document.getElementById('refName').focus(), 100);
  };

  window.closeRefModal = function() {
    document.getElementById('refModal').classList.remove('open');
  };

  window.saveRefFromModal = function() {
    const name  = document.getElementById('refName').value.trim();
    const title = document.getElementById('refTitle').value.trim();
    const email = document.getElementById('refEmail').value.trim();
    const phone = document.getElementById('refPhone').value.trim();

    if (!name)  { toast('Fyll i namn',  'error'); document.getElementById('refName').focus(); return; }
    if (!title) { toast('Fyll i titel', 'error'); document.getElementById('refTitle').focus(); return; }

    const ref = { name, title, email, phone };
    const idx = parseInt(document.getElementById('refModal').dataset.editIdx);
    if (!Array.isArray(cvData.references)) cvData.references = [];
    if (idx >= 0 && cvData.references[idx]) {
      cvData.references[idx] = ref;
    } else {
      cvData.references.push(ref);
    }
    // Om man lägger till en referens, slå automatiskt av "på begäran"
    if (cvData.refOnRequest) {
      // Om användaren lägger till riktig referens, stäng av "på begäran" automatiskt
      cvData.refOnRequest = false;
    }
    saveCVLocal();
    renderRefs();
    renderPreview();
    closeRefModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Referens sparad'));
  };

  window.cvDeleteRef = function(i) {
    if (!confirm('Ta bort denna referens?')) return;
    cvData.references.splice(i, 1);
    saveCVLocal();
    renderRefs();
    renderPreview();
  };

  window.toggleRefOnRequest = function() {
    cvData.refOnRequest = !cvData.refOnRequest;
    saveCVLocal();
    renderRefs();
    renderPreview();
    toast(cvData.refOnRequest ? '✅ Referenser lämnas på begäran' : 'Borttagen', cvData.refOnRequest ? 'success' : 'info');
  };

  window.removeRefOnRequest = function() {
    cvData.refOnRequest = false;
    saveCVLocal();
    renderRefs();
    renderPreview();
  };

  function renderRefs() {
    const list = document.getElementById('refsList');
    if (!list) return;

    // Uppdatera knappens active-state
    const btn = document.getElementById('refOnRequestBtn');
    if (btn) {
      if (cvData.refOnRequest) {
        btn.classList.add('active');
        btn.textContent = '✓ På begäran';
      } else {
        btn.classList.remove('active');
        btn.textContent = '+ På begäran';
      }
    }

    let html = '';

    // Visa "Referenser lämnas på begäran" som ett eget kort (matchar mobilen)
    if (cvData.refOnRequest) {
      html += '<div class="ref-on-request-card">' +
        '<div class="ref-on-request-card-text">✨ Referenser lämnas på begäran</div>' +
        '<button class="icon-btn danger" onclick="removeRefOnRequest()" title="Ta bort">✕</button>' +
      '</div>';
    }

    // Faktiska referenser (kan existera samtidigt som "på begäran")
    if (Array.isArray(cvData.references) && cvData.references.length) {
      html += cvData.references.map((r, i) => {
        const contact = [r.email, r.phone].filter(Boolean).join(' · ');
        return '<div class="item-card">' +
          '<div class="item-card-body">' +
            '<div class="item-card-title">' + escape(r.name || 'Utan namn') + '</div>' +
            '<div class="item-card-meta">' + escape(r.title || '') + (contact ? ' · ' + escape(contact) : '') + '</div>' +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="icon-btn" onclick="openRefModal(' + i + ')" title="Redigera">✎</button>' +
            '<button class="icon-btn danger" onclick="cvDeleteRef(' + i + ')" title="Ta bort">✕</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Tom state
    if (!html) {
      html = '<div class="empty">Inga referenser tillagda än</div>';
    }

    list.innerHTML = html;
  }
  window.renderRefs = renderRefs;

  // ============================================================
  // UPPGIFTER FRÅN HANDLÄGGARE (Supabase tasks)
  // Hämtar via action='my_tasks', visar i Profil + Övningar
  // ============================================================
  let assignedTasks = [];        // Senaste hämtade uppgifter
  let taskTimers = {};           // taskId → {startedAt, intervalId, elapsedSec}
  let tasksLoadedOnce = false;

  function tasksActive()    { return assignedTasks.filter(t => t.status === 'active');    }
  function tasksPending()   { return assignedTasks.filter(t => t.status === 'pending');   }
  function tasksOpen()      { return assignedTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled'); }
  function tasksCompleted() { return assignedTasks.filter(t => t.status === 'completed'); }

  // Ladda mina uppgifter från Supabase
  async function loadMyTasks(silent) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      assignedTasks = [];
      updateTaskBadges();
      return;
    }
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'my_tasks',
          accessToken: auth.accessToken,
          userId: auth.userId
        })
      });
      const data = await r.json().catch(() => ({}));
      assignedTasks = Array.isArray(data.data) ? data.data : [];
      tasksLoadedOnce = true;
      updateTaskBadges();
      // Re-render om användaren just nu tittar på en av vyerna
      if (currentView === 'profil') renderTasksInProfil();
      if (currentView === 'ovningar' && !currentTrainCat && typeof renderTrainingHome === 'function') {
        renderTrainingHome();
      }
      if (currentView === 'ovningar' && currentTrainCat === 'uppg') {
        renderTasksCategoryView();
      }
    } catch(e) {
      console.error('Kunde inte hämta uppgifter:', e);
      if (!silent) toast('Kunde inte hämta uppgifter', 'error');
    }
  }
  window.loadMyTasks = loadMyTasks;

  function updateTaskBadges() {
    const openCount = tasksOpen().length;
    const ovBadge = document.getElementById('sbOvningarBadge');
    const pfBadge = document.getElementById('sbProfilBadge');
    [ovBadge, pfBadge].forEach(el => {
      if (!el) return;
      if (openCount > 0) {
        el.textContent = String(openCount);
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // ── Formatering av deadlines ──────────────────────────────
  function formatDeadline(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const ms = d.getTime() - now.getTime();
    const days = Math.round(ms / (24 * 3600 * 1000));
    const isOver = ms < 0;
    let text;
    if (isOver) {
      const overDays = Math.abs(days);
      text = overDays === 0 ? 'Deadline idag (försenad)' : (overDays + ' dagar försenad');
    } else if (days === 0) {
      text = 'Deadline idag';
    } else if (days === 1) {
      text = 'Deadline imorgon';
    } else if (days <= 7) {
      text = 'Deadline om ' + days + ' dagar';
    } else {
      text = 'Deadline ' + d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return { text, isOver, soon: !isOver && days <= 3 };
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    return (h > 0 ? h + ':' : '') + pad(m) + ':' + pad(s);
  }

  // ── Render: uppgiftskort ──────────────────────────────────
  function buildTaskCard(task) {
    const isDone = task.status === 'completed';
    const isActive = task.status === 'active';
    const isOngoing = !!taskTimers[task.id];
    const dl = formatDeadline(task.deadline);
    const overdue = dl && dl.isOver && !isDone;

    let classes = 'task-card';
    if (isDone) classes += ' done';
    if (overdue) classes += ' overdue';

    const type = task.type || 'manual';
    const typeLabel = type === 'timed' ? '⏱ Tidsuppgift' : type === 'auto' ? '✓ Auto' : '📝 Manuell';

    const dlCls  = overdue ? 'over' : (dl && dl.soon ? 'soon' : '');
    const dlHtml = dl ? `<span class="task-deadline ${dlCls}">📅 ${escape(dl.text)}</span>` : '';

    // Progress för tidsuppgift
    let progressHtml = '';
    if (type === 'timed' && task.duration_minutes) {
      const targetSec = task.duration_minutes * 60;
      const spentSec  = (task.time_spent_sec || 0) + ((isOngoing && taskTimers[task.id]) ? taskTimers[task.id].elapsedSec : 0);
      const pct = Math.min(100, Math.round((spentSec / targetSec) * 100));
      progressHtml = `
        <div class="task-progress"><div class="task-progress-fill" style="width:${pct}%;"></div></div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">
          ${formatTime(spentSec)} / ${task.duration_minutes} min (${pct}%)
        </div>`;
    }

    // Actions
    let actions = '';
    if (!isDone) {
      if (type === 'timed') {
        if (isOngoing) {
          actions = `
            <button class="task-btn active" onclick="stopTaskSession('${escape(String(task.id))}')">
              ⏸ Pausa session
            </button>
            <span class="task-timer" id="taskTimer_${escape(String(task.id))}">${formatTime(taskTimers[task.id].elapsedSec)}</span>`;
        } else {
          actions = `
            <button class="task-btn primary" onclick="startTaskSession('${escape(String(task.id))}')">
              ▶ Starta session
            </button>
            <button class="task-btn secondary" onclick="completeTask('${escape(String(task.id))}')">
              ✓ Markera klar
            </button>`;
        }
      } else {
        actions = `
          <button class="task-btn primary" onclick="completeTask('${escape(String(task.id))}')">
            ✓ Markera som slutförd
          </button>`;
      }
    } else {
      const completedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('sv-SE') : '';
      actions = `<span style="font-size:11px;color:var(--accent2);font-weight:700;">✅ Slutförd ${completedAt ? escape(completedAt) : ''}</span>`;
    }

    return `
      <div class="${classes}" data-task-id="${escape(String(task.id))}">
        <div class="task-check">${isDone ? '✓' : ''}</div>
        <div class="task-body">
          <div class="task-title">${escape(task.title || 'Uppgift')}</div>
          ${task.description ? `<div class="task-desc">${escape(task.description)}</div>` : ''}
          <div class="task-meta">
            <span class="task-tag ${type}">${typeLabel}</span>
            ${task.category ? `<span class="task-tag">${escape(task.category)}</span>` : ''}
            ${dlHtml}
          </div>
          ${progressHtml}
          <div class="task-actions">${actions}</div>
        </div>
      </div>`;
  }

  // ── Render: Profil-sektion ────────────────────────────────
  function renderTasksInProfil() {
    const list = document.getElementById('pfTasksList');
    const countEl = document.getElementById('pfTasksCount');
    if (!list) return;

    const open = tasksOpen();
    const done = tasksCompleted();

    if (countEl) {
      countEl.textContent = String(open.length);
      countEl.classList.toggle('warn', open.length > 0);
    }

    if (!open.length && !done.length) {
      list.innerHTML = `
        <div class="task-empty">
          <div class="task-empty-icon">✅</div>
          <div style="font-size:13px;line-height:1.5;">
            Du har inga uppgifter just nu.<br>
            <span style="font-size:11px;opacity:0.7;">Uppgifter från din handläggare dyker upp här.</span>
          </div>
        </div>`;
      return;
    }

    let html = '';
    if (open.length) {
      html += open.map(buildTaskCard).join('');
    }
    if (done.length) {
      html += `<div style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:16px 0 8px;">Slutförda (${done.length})</div>`;
      html += done.slice(0, 5).map(buildTaskCard).join('');
    }
    list.innerHTML = html;
  }
  window.renderTasksInProfil = renderTasksInProfil;

  // ── Render: Uppgifter-kategori i Övningar ─────────────────
  function renderTasksCategoryView() {
    document.getElementById('ov-home').style.display = 'block';
    document.getElementById('ov-detail').style.display = 'none';
    const grid = document.getElementById('ovGrid');
    if (!grid) return;

    const open = tasksOpen();
    const done = tasksCompleted();

    const header = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <button class="ov-back" onclick="trainBackToCats()" style="margin: 0;">← Alla kategorier</button>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">✅</span>
          <div>
            <div style="font-size: 17px; font-weight: 800; color: #fff;">Uppgifter från handläggare</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.45);">
              ${open.length} öppna · ${done.length} slutförda
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="loadMyTasks()" style="font-size:12px;">🔄 Uppdatera</button>
      </div>`;

    let body;
    if (!open.length && !done.length) {
      body = `
        <div style="grid-column: 1 / -1;">
          <div class="task-empty">
            <div class="task-empty-icon">✅</div>
            <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">Inga uppgifter just nu</div>
            <div style="font-size:12px;line-height:1.5;">
              När din handläggare tilldelar dig en uppgift dyker den upp här.
            </div>
          </div>
        </div>`;
    } else {
      body = '<div style="grid-column: 1 / -1;" class="task-list">';
      body += open.map(buildTaskCard).join('');
      if (done.length) {
        body += `<div style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:16px 0 8px;">Slutförda (${done.length})</div>`;
        body += done.slice(0, 10).map(buildTaskCard).join('');
      }
      body += '</div>';
    }

    grid.innerHTML = header + body;
  }
  window.renderTasksCategoryView = renderTasksCategoryView;

  // ── Åtgärder ──────────────────────────────────────────────
  window.startTaskSession = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      toast('Logga in först', 'error');
      return;
    }
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_task_session',
          accessToken: auth.accessToken,
          userId: auth.userId,
          taskId: taskId
        })
      });
      if (!r.ok) throw new Error('Backend-fel');

      // Starta lokal timer för UI-feedback
      const startAt = Date.now();
      const task = assignedTasks.find(t => String(t.id) === String(taskId));
      const alreadySpent = (task && task.time_spent_sec) || 0;
      taskTimers[taskId] = {
        startedAt: startAt,
        elapsedSec: 0,
        intervalId: setInterval(() => {
          if (!taskTimers[taskId]) return;
          taskTimers[taskId].elapsedSec = Math.floor((Date.now() - taskTimers[taskId].startedAt) / 1000);
          const el = document.getElementById('taskTimer_' + taskId);
          if (el) el.textContent = formatTime(alreadySpent + taskTimers[taskId].elapsedSec);
        }, 1000)
      };
      toast('▶ Session startad');
      if (task) task.status = 'active';
      refreshTaskViews();
    } catch(e) {
      toast('Kunde inte starta session', 'error');
    }
  };

  window.stopTaskSession = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;

    const timer = taskTimers[taskId];
    if (timer && timer.intervalId) clearInterval(timer.intervalId);
    delete taskTimers[taskId];

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop_task_session',
          accessToken: auth.accessToken,
          userId: auth.userId,
          taskId: taskId
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('Backend-fel');

      if (data.completed) {
        toast('✅ Uppgift slutförd!');
      } else {
        toast('⏸ Session pausad — ' + formatTime(data.duration_sec) + ' loggad');
      }
      await loadMyTasks(true);
    } catch(e) {
      toast('Kunde inte pausa session', 'error');
    }
  };

  window.completeTask = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;
    if (!confirm('Markera uppgiften som slutförd?')) return;

    // Stoppa eventuell timer
    const timer = taskTimers[taskId];
    if (timer && timer.intervalId) clearInterval(timer.intervalId);
    delete taskTimers[taskId];

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_task',
          accessToken: auth.accessToken,
          userId: auth.userId,
          taskId: taskId
        })
      });
      if (!r.ok) throw new Error('Backend-fel');
      toast('✅ Uppgift slutförd!');
      logEvent('task_completed', { task_id: taskId });
      await loadMyTasks(true);
    } catch(e) {
      toast('Kunde inte slutföra uppgift', 'error');
    }
  };

  function refreshTaskViews() {
    updateTaskBadges();
    if (currentView === 'profil') renderTasksInProfil();
    if (currentView === 'ovningar') {
      if (currentTrainCat === 'uppg') renderTasksCategoryView();
      else if (!currentTrainCat && typeof renderTrainingHome === 'function') renderTrainingHome();
    }
  }
  window.refreshTaskViews = refreshTaskViews;

  // ──────────────────────────────────────────────────────────

  // ============================================================
  // MATCHA — 3-stegs flow (Välj CV → Sök jobb → AI-matcha)
  // ============================================================
  let matchaCurrentStep    = 1;
  let matchaSelectedCvId   = null;          // id från pathfinder_saved_cvs, eller 'current' för pågående
  let matchaSelectedAds    = [];            // valda jobbannonser (max 3)
  let matchaSearchQ        = '';
  let matchaOrtFilter      = 'all';
  let matchaTidFilter      = '';
  let matchaSearchOffset   = 0;
  let matchaSearchDebounceT = null;

  const MATCHA_ORT = {
    all: '',
    skane: 'Skåne',
    hbg: 'Helsingborg',
    sthlm: 'Stockholm',
    gbg: 'Göteborg',
    malmo: 'Malmö',
    uppsala: 'Uppsala',
    linkoping: 'Linköping'
  };

  // ── Entry point från switchView('matcha') ─────────────────
  function renderMatchaView() {
    // Återgå alltid till steg 1 vid intåg
    matchaSwitchStep(1);
    renderMatchaCvGrid();
  }
  window.renderMatchaView = renderMatchaView;

  // ── Stegnavigering ────────────────────────────────────────
  window.matchaSwitchStep = function(n) {
    // Validering
    if (n === 2 && !matchaSelectedCvId) {
      toast('Välj ett CV först', 'error');
      return;
    }
    if (n === 3 && matchaSelectedAds.length === 0) {
      toast('Välj minst en annons först', 'error');
      return;
    }

    matchaCurrentStep = n;
    document.querySelectorAll('.matcha-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.matcha-tab').forEach(t => t.classList.remove('active'));
    const stepEl = document.getElementById('matchaStep' + n);
    const tabEl  = document.getElementById('matchaTab' + n);
    if (stepEl) stepEl.classList.add('active');
    if (tabEl)  tabEl.classList.add('active');

    // Enable/disable tabs
    document.getElementById('matchaTab2').disabled = !matchaSelectedCvId;
    document.getElementById('matchaTab3').disabled = matchaSelectedAds.length === 0;

    if (n === 2) {
      updateMatchaStickyBar();
    }
    if (n === 3) {
      matchaRenderStep3Cards();
    }
  };

  // ── STEG 1: Välj CV ───────────────────────────────────────
  function renderMatchaCvGrid() {
    const grid = document.getElementById('matchaCvGrid');
    if (!grid) return;
    const saved = pfGetSaved();

    // Inkludera pågående CV som första alternativ om det har namn
    const cards = [];
    if (cvData.name) {
      cards.push({
        id: 'current',
        title: (cvData.title || 'Pågående CV'),
        meta: cvData.name + (cvData.jobs.length ? ' · ' + cvData.jobs.length + ' jobb' : ''),
        isCurrent: true
      });
    }
    saved.forEach(cv => {
      cards.push({
        id: cv.id,
        title: cv.title || 'Utan titel',
        meta: ((cv.data && cv.data.name) || '') + ' · sparat ' + (pfFormatDate(cv.savedAt) || ''),
        isCurrent: false
      });
    });

    if (!cards.length) {
      grid.innerHTML = `
        <div class="pf-empty" style="grid-column: 1 / -1;">
          <div class="pf-empty-icon">📄</div>
          <div class="pf-empty-text">Du har inga CV:n ännu.<br>Bygg ett CV först så kan du matcha det mot jobb.</div>
          <button class="pf-empty-cta" onclick="switchView('cv')">Bygg ditt första CV →</button>
        </div>`;
      return;
    }

    grid.innerHTML = cards.map(c => `
      <div class="matcha-cv-card ${matchaSelectedCvId === c.id ? 'selected' : ''}"
           onclick="matchaSelectCv('${c.id}')">
        <div class="matcha-cv-card-title">${escape(c.title)}</div>
        <div class="matcha-cv-card-meta">${escape(c.meta)}</div>
      </div>`).join('');

    // Om inget är valt och det finns kort, välj första automatiskt
    if (!matchaSelectedCvId && cards.length === 1) {
      matchaSelectCv(cards[0].id);
    }
  }

  window.matchaSelectCv = function(id) {
    matchaSelectedCvId = id;
    renderMatchaCvGrid();
    document.getElementById('matchaToStep2Btn').disabled = false;
    document.getElementById('matchaTab2').disabled = false;
  };

  // Returnerar { name, title, summary, jobs, education, skills } för valt CV
  function matchaGetSelectedCVData() {
    if (matchaSelectedCvId === 'current') return cvData;
    const saved = pfGetSaved();
    const found = saved.find(c => c.id === matchaSelectedCvId);
    return (found && found.data) || cvData;
  }

  // ── STEG 2: Sök på Platsbanken/Jobtech ────────────────────
  window.matchaSetOrt = function(val) {
    matchaOrtFilter = val;
    if (matchaSearchQ) matchaDoSearch();
  };
  window.matchaSetTid = function(val) {
    matchaTidFilter = val;
    if (matchaSearchQ) matchaDoSearch();
  };

  window.matchaSearchDebounce = function() {
    clearTimeout(matchaSearchDebounceT);
    // Avaktivera CV-titel-knappen när användaren skriver egen sökterm
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.matcha-quick-chip').forEach(c => c.classList.remove('active'));
    matchaSearchDebounceT = setTimeout(matchaDoSearch, 350);
  };

  // ── Snabbsök via branschchip ──────────────────────────────
  window.matchaQuickSearch = function(query) {
    const input = document.getElementById('matchaSearch');
    if (!input) return;
    input.value = query;

    // Markera vald chip
    document.querySelectorAll('.matcha-quick-chip').forEach(chip => {
      chip.classList.remove('active');
      const chipQ = chip.getAttribute('onclick') || '';
      if (chipQ.includes("'" + query + "'")) chip.classList.add('active');
    });
    // Avaktivera CV-titel-knappen eftersom användaren valt annan strategi
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.remove('active'));

    if (query) {
      matchaDoSearch();
    } else {
      // Tom query = "Alla jobb" — sök brett på populära yrken
      input.value = 'jobb';
      matchaDoSearch();
    }
  };

  // ── Sök jobb som matchar CV-titeln ────────────────────────
  window.matchaSearchByCvTitle = function() {
    const selectedCV = matchaGetSelectedCVData();
    const title = (selectedCV && selectedCV.title || '').trim();
    if (!title) {
      toast('Du har ingen yrkestitel i CV:t. Fyll i den på CV-fliken först.', 'error');
      return;
    }
    const input = document.getElementById('matchaSearch');
    if (input) input.value = title;
    document.querySelectorAll('.matcha-quick-chip').forEach(c => c.classList.remove('active'));
    // Markera CV-titel-knappen som aktiv
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.add('active'));
    matchaDoSearch();
    toast('🎯 Söker efter: ' + title);
  };

  window.matchaDoSearch = async function() {
    const input = document.getElementById('matchaSearch');
    const rawQ = (input && input.value || '').trim();
    const resultsEl = document.getElementById('matchaSearchResults');
    const skeleton  = document.getElementById('matchaSkeleton');
    const visaFler  = document.getElementById('matchaVisaFler');

    if (rawQ.length < 2) {
      if (resultsEl) resultsEl.innerHTML = '';
      if (skeleton)  skeleton.style.display = 'none';
      if (visaFler)  visaFler.style.display = 'none';
      return;
    }

    const locSuffix = MATCHA_ORT[matchaOrtFilter] ? ' ' + MATCHA_ORT[matchaOrtFilter] : '';
    matchaSearchQ = rawQ + locSuffix;
    matchaSearchOffset = 0;

    if (skeleton)  skeleton.style.display = 'block';
    if (resultsEl) resultsEl.innerHTML = '';
    if (visaFler)  visaFler.style.display = 'none';

    logEvent('job_search', { query: rawQ, source: 'jobtech' });

    try {
      const data = await matchaFetchJobtech(matchaSearchQ, 0);
      if (skeleton) skeleton.style.display = 'none';
      const hits = data.hits || [];
      const total = (data.total && data.total.value) || 0;

      if (!hits.length) {
        resultsEl.innerHTML = '<div class="matcha-skeleton">Inga annonser hittades. Prova ett annat sökord.</div>';
        return;
      }

      resultsEl.innerHTML =
        `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:10px;">
          Visar ${hits.length} av ${total} annonser · ${escape(MATCHA_ORT[matchaOrtFilter] || 'Hela Sverige')}
        </div>`;

      hits.forEach(hit => resultsEl.appendChild(matchaBuildJobCard(hit)));
      matchaSearchOffset = hits.length;
      if (visaFler) visaFler.style.display = matchaSearchOffset < total ? 'block' : 'none';
    } catch(e) {
      console.error('Sökfel:', e);
      if (skeleton)  skeleton.style.display = 'none';
      if (resultsEl) resultsEl.innerHTML = '<div class="matcha-skeleton" style="color:#ff8fa3;">Kunde inte hämta annonser just nu. Försök igen om en stund.</div>';
    }
  };

  window.matchaVisaFler = async function() {
    const visaFlerEl = document.getElementById('matchaVisaFler');
    const btn = visaFlerEl && visaFlerEl.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Hämtar...'; }
    try {
      const data = await matchaFetchJobtech(matchaSearchQ, matchaSearchOffset);
      const hits = data.hits || [];
      const total = (data.total && data.total.value) || 0;
      const resultsEl = document.getElementById('matchaSearchResults');
      hits.forEach(hit => resultsEl.appendChild(matchaBuildJobCard(hit)));
      matchaSearchOffset += hits.length;
      if (matchaSearchOffset >= total) visaFlerEl.style.display = 'none';
    } catch(e) {
      toast('Kunde inte hämta fler annonser', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Visa fler annonser'; }
    }
  };

  async function matchaFetchJobtech(q, offset) {
    let url = 'https://jobsearch.api.jobtechdev.se/search?q=' + encodeURIComponent(q) + '&limit=20&offset=' + offset;
    if (matchaTidFilter) url += '&working-hours-type=' + encodeURIComponent(matchaTidFilter);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Jobtech API-fel');
    return resp.json();
  }

  // Bygg ett jobbkort
  function matchaBuildJobCard(hit) {
    const title   = hit.headline || 'Okänd titel';
    const company = (hit.employer && hit.employer.name) || 'Okänd arbetsgivare';
    const muni    = (hit.workplace_address && hit.workplace_address.municipality) || '';
    const url     = hit.webpage_url || '';
    const initials = company.split(' ').slice(0,2).map(w => (w[0] || '')).join('').toUpperCase() || '?';
    const [bg, fg] = matchaAvatarColor(company);

    const card = document.createElement('div');
    card.className = 'matcha-job-card';
    if (matchaSelectedAds.find(a => a.id === hit.id)) card.classList.add('selected');

    const isPicked = !!matchaSelectedAds.find(a => a.id === hit.id);
    const pickIdx  = matchaSelectedAds.findIndex(a => a.id === hit.id);

    // ── Bygg chips-HTML (arbetstid, anställningstyp, körkort, lön, varaktighet) ──
    // Identiskt med steg 3 för konsistent UX
    const chips = [];
    const chipBase = 'display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;color:rgba(255,255,255,0.7);';
    const chipBg = 'rgba(255,255,255,0.07)';
    const chipBgWarn = 'rgba(240,192,64,0.25)';

    const hoursType = (hit.working_hours_type && hit.working_hours_type.label) || '';
    if (hoursType) chips.push(`<span style="${chipBase}background:${chipBg};">⏱ ${escape(hoursType)}</span>`);

    const empType = (hit.employment_type && hit.employment_type.label) || '';
    if (empType) chips.push(`<span style="${chipBase}background:${chipBg};">📋 ${escape(empType)}</span>`);

    const licRequired = hit.driving_license_required;
    const licTypes = (hit.driving_license || []).map(l => l.label).filter(Boolean).join(', ');
    if (licRequired) {
      chips.push(`<span style="${chipBase}background:${chipBgWarn};">🚗 Körkort krävs${licTypes ? ': ' + escape(licTypes) : ''}</span>`);
    } else if (licRequired === false) {
      chips.push(`<span style="${chipBase}background:${chipBg};">🚗 Inget körkort</span>`);
    }

    const salDesc = hit.salary_description || '';
    const salType = (hit.salary_type && hit.salary_type.label) || '';
    chips.push(`<span style="${chipBase}background:${chipBg};">💰 ${escape(salDesc.substring(0, 40) || salType || 'Lön ej uppgiven')}</span>`);

    const duration = (hit.duration && hit.duration.label) || '';
    if (duration && duration !== 'Tillsvidare') {
      chips.push(`<span style="${chipBase}background:${chipBg};">📅 ${escape(duration)}</span>`);
    }

    const chipsHtml = chips.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;margin-bottom:4px;">${chips.join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="matcha-job-head">
        <div class="matcha-job-avatar" style="background:${bg};color:${fg};">${initials}</div>
        <div class="matcha-job-info">
          <div class="matcha-job-title">${escape(title)}</div>
          <div class="matcha-job-meta">
            <span>🏢 ${escape(company)}</span>
            ${muni ? `<span>📍 ${escape(muni)}</span>` : ''}
          </div>
        </div>
      </div>
      ${chipsHtml}
      <div class="matcha-job-actions">
        <button class="matcha-job-btn ${isPicked ? 'picked' : 'pick'}"
                data-hitid="${escape(hit.id)}">
          ${isPicked ? '✓ Vald (' + (pickIdx+1) + '/3)' : '+ Välj jobb'}
        </button>
        ${url ? `<a class="matcha-job-btn link" href="${escape(url)}" target="_blank" rel="noopener">Läs annons ↗</a>` : ''}
      </div>
    `;

    const pickBtn = card.querySelector('.matcha-job-btn');
    if (pickBtn) {
      pickBtn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        matchaToggleAd(hit);
      });
    }

    return card;
  }

  function matchaAvatarColor(name) {
    const colors = [
      ['rgba(62,180,137,0.2)',  '#3eb489'],
      ['rgba(124,58,237,0.2)',  '#c4b5fd'],
      ['rgba(240,192,64,0.2)',  '#f0c040'],
      ['rgba(232,93,38,0.2)',   '#e85d26'],
      ['rgba(59,130,246,0.2)',  '#93c5fd'],
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (hash + name.charCodeAt(i)) % colors.length;
    return colors[hash];
  }

  window.matchaToggleAd = function(hit) {
    const idx = matchaSelectedAds.findIndex(a => a.id === hit.id);
    if (idx >= 0) {
      matchaSelectedAds.splice(idx, 1);
    } else if (matchaSelectedAds.length >= 3) {
      toast('Max 3 annonser åt gången', 'error');
      return;
    } else {
      matchaSelectedAds.push(hit);
    }
    updateMatchaStickyBar();
    // Re-render för att uppdatera button-state
    matchaDoSearchFromCache();
  };

  function matchaDoSearchFromCache() {
    // Uppdatera pick-buttons på alla kort utan att göra nytt API-anrop
    const cards = document.querySelectorAll('#matchaSearchResults .matcha-job-card');
    cards.forEach(card => {
      const btn = card.querySelector('.matcha-job-btn[data-hitid]');
      if (!btn) return;
      const hitId = btn.getAttribute('data-hitid');
      const idx = matchaSelectedAds.findIndex(a => String(a.id) === hitId);
      const isPicked = idx >= 0;
      btn.className = 'matcha-job-btn ' + (isPicked ? 'picked' : 'pick');
      btn.textContent = isPicked ? ('✓ Vald (' + (idx+1) + '/3)') : '+ Välj jobb';
      card.classList.toggle('selected', isPicked);
    });
  }

  function updateMatchaStickyBar() {
    const bar = document.getElementById('matchaStickyBar');
    const cnt = document.getElementById('matchaStickyCount');
    if (!bar) return;
    if (matchaSelectedAds.length) {
      bar.style.display = 'flex';
      if (cnt) cnt.textContent = matchaSelectedAds.length + '/3 valda';
    } else {
      bar.style.display = 'none';
    }
    const tab3 = document.getElementById('matchaTab3');
    if (tab3) tab3.disabled = matchaSelectedAds.length === 0;
  }

  // ── STEG 3: Rendera annons-kort med chips + manuell "Matcha"-knapp ──
  // Matchar mobilens UX: användaren ser kort med all metadata (chips för
  // arbetstid, körkort, lön etc.), klickar "Matcha mot CV" per kort, och
  // får loading-state med timglas medan AI:n jobbar.
  function matchaRenderStep3Cards() {
    const container = document.getElementById('matchaAdsContainer');
    if (!container) return;

    if (!matchaSelectedAds.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);font-size:13px;">Välj annonser i steg 2 först</div>';
      return;
    }

    container.innerHTML = '';

    matchaSelectedAds.forEach((hit, i) => {
      const title   = hit.headline || '';
      const company = (hit.employer && hit.employer.name) || '';
      const muni    = (hit.workplace_address && hit.workplace_address.municipality) || '';
      const url     = hit.webpage_url || '';
      const adId    = String(hit.id);

      const section = document.createElement('div');
      section.className = 'matcha-ad-card-s3';
      section.dataset.adId = adId;
      section.style.cssText = 'position:relative;background:rgba(62,180,137,0.06);border:1.5px solid rgba(62,180,137,0.2);border-radius:14px;padding:16px;margin-bottom:16px;transition:all 0.2s;';

      // ── Header rad: "Annons X av Y" + ta bort-knapp ──
      const hdr = document.createElement('div');
      hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
      const hdrLabel = document.createElement('div');
      hdrLabel.style.cssText = 'font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(62,180,137,0.6);';
      hdrLabel.textContent = 'Annons ' + (i + 1) + ' av ' + matchaSelectedAds.length;
      const rmBtn = document.createElement('button');
      rmBtn.innerHTML = '✕ Ta bort';
      rmBtn.style.cssText = 'background:rgba(220,50,50,0.25);border:1.5px solid rgba(220,50,50,0.6);color:#ff6b6b;font-size:11px;font-weight:800;cursor:pointer;padding:4px 10px;border-radius:8px;line-height:1;letter-spacing:0.3px;font-family:inherit;';
      rmBtn.onclick = () => matchaRemoveAdS3(adId);
      hdr.appendChild(hdrLabel);
      hdr.appendChild(rmBtn);
      section.appendChild(hdr);

      // ── Titel + bolag/ort ──
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-size:15px;font-weight:700;color:#fff;margin-bottom:2px;';
      titleEl.textContent = title;
      section.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.45);';
      metaEl.textContent = company + (muni ? ' · ' + muni : '');
      section.appendChild(metaEl);

      // ── Chips med metadata-symboler (matchar mobilens design) ──
      function makeChip(label, color) {
        const c = document.createElement('span');
        c.style.cssText = 'display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;background:' + (color || 'rgba(255,255,255,0.07)') + ';color:rgba(255,255,255,0.7);';
        c.textContent = label;
        return c;
      }

      const chipsRow = document.createElement('div');
      chipsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;';

      // ⏱ Arbetstid (heltid/deltid)
      const hoursType = (hit.working_hours_type && hit.working_hours_type.label) || '';
      if (hoursType) chipsRow.appendChild(makeChip('⏱ ' + hoursType));

      // 📋 Anställningstyp
      const empType = (hit.employment_type && hit.employment_type.label) || '';
      if (empType) chipsRow.appendChild(makeChip('📋 ' + empType));

      // 🚗 Körkort
      const licRequired = hit.driving_license_required;
      const licTypes = (hit.driving_license || []).map(l => l.label).filter(Boolean).join(', ');
      if (licRequired) {
        chipsRow.appendChild(makeChip('🚗 Körkort krävs' + (licTypes ? ': ' + licTypes : ''), 'rgba(240,192,64,0.25)'));
      } else if (licRequired === false) {
        chipsRow.appendChild(makeChip('🚗 Inget körkort'));
      }

      // 💰 Lön
      const salDesc = hit.salary_description || '';
      const salType = (hit.salary_type && hit.salary_type.label) || '';
      chipsRow.appendChild(makeChip('💰 ' + (salDesc.substring(0, 40) || salType || 'Lön ej uppgiven')));

      // 📅 Varaktighet (om annan än Tillsvidare)
      const duration = (hit.duration && hit.duration.label) || '';
      if (duration && duration !== 'Tillsvidare') chipsRow.appendChild(makeChip('📅 ' + duration));

      if (chipsRow.children.length) section.appendChild(chipsRow);

      // ── Annonstext-snippet ──
      const rawDesc = (hit.description && hit.description.text) || '';
      const adSnippet = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 140);
      if (adSnippet) {
        const snipEl = document.createElement('div');
        snipEl.style.cssText = 'margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;';
        snipEl.textContent = adSnippet + (rawDesc.length > 140 ? '…' : '');
        section.appendChild(snipEl);
      }

      // ── Läs annons-länk ──
      if (url) {
        const readLink = document.createElement('a');
        readLink.href = url;
        readLink.target = '_blank';
        readLink.rel = 'noopener';
        readLink.onclick = (e) => e.stopPropagation();
        readLink.style.cssText = 'display:inline-block;margin-top:10px;font-size:11px;font-weight:700;color:#3eb489;text-decoration:none;padding:6px 12px;border:1px solid rgba(62,180,137,0.4);border-radius:8px;background:rgba(62,180,137,0.08);';
        readLink.textContent = 'Läs annons ↗';
        section.appendChild(readLink);
      }

      // ── "Matcha mot CV"-knapp (eller "redan matchad"-badge) ──
      const extrasDiv = document.createElement('div');
      extrasDiv.id = 'matchaExtras_' + adId;

      const alreadyMatched = matchaIsAdAlreadyMatched(hit);
      const genBtn = document.createElement('button');
      if (alreadyMatched) {
        genBtn.textContent = '✅ CV redan matchat mot detta jobb';
        genBtn.disabled = true;
        genBtn.style.cssText = 'margin-top:14px;width:100%;padding:13px;background:rgba(62,180,137,0.1);border:1.5px solid rgba(62,180,137,0.35);color:#3eb489;font-size:13px;font-weight:700;border-radius:10px;cursor:default;font-family:inherit;opacity:0.8;';
      } else {
        genBtn.id = 'matchaGenBtn_' + adId;
        genBtn.textContent = '✨ Matcha mot CV';
        genBtn.style.cssText = 'margin-top:14px;width:100%;padding:13px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;color:#fff;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;transition:transform 0.15s, box-shadow 0.15s;';
        genBtn.onmouseenter = () => { genBtn.style.transform = 'translateY(-1px)'; genBtn.style.boxShadow = '0 4px 12px rgba(108,92,231,0.3)'; };
        genBtn.onmouseleave = () => { genBtn.style.transform = ''; genBtn.style.boxShadow = ''; };
        genBtn.onclick = (e) => {
          e.stopPropagation();
          // Dimma andra kort medan denna jobbar
          const allSections = document.querySelectorAll('#matchaAdsContainer > div[data-ad-id]');
          allSections.forEach(s => {
            if (s.dataset.adId !== adId) {
              s.style.opacity = '0.2';
              s.style.pointerEvents = 'none';
            }
          });
          matchaRunAiForAd(hit).finally(() => {
            // "Visa alla annonser"-knapp efteråt
            const existingReset = document.getElementById('matchaResetFocus');
            if (!existingReset) {
              const resetBtn = document.createElement('button');
              resetBtn.id = 'matchaResetFocus';
              resetBtn.textContent = '← Visa alla annonser';
              resetBtn.style.cssText = 'display:block;margin:0 auto 16px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;padding:7px 14px;border-radius:20px;cursor:pointer;font-family:inherit;';
              resetBtn.onclick = () => {
                allSections.forEach(s => { s.style.opacity = ''; s.style.pointerEvents = ''; });
                resetBtn.remove();
              };
              container.parentNode.insertBefore(resetBtn, container);
            }
          });
        };
      }
      extrasDiv.appendChild(genBtn);
      section.appendChild(extrasDiv);

      // ── Loading-state (timglas, dold tills click) ──
      const loadingEl = document.createElement('div');
      loadingEl.id = 'matchaAdLoading_' + adId;
      loadingEl.className = 'matcha-skeleton';
      loadingEl.style.cssText = 'display:none;margin-top:14px;padding:20px;background:rgba(108,92,231,0.08);border:1.5px solid rgba(108,92,231,0.3);border-radius:12px;text-align:center;color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;';
      loadingEl.innerHTML = '<span style="display:inline-block;animation:matchaHourglassSpin 2s linear infinite;font-size:24px;">⏳</span><div style="margin-top:8px;">AI analyserar och skriver 3 profiltexter...</div>';
      section.appendChild(loadingEl);

      // ── Resultat-container (dold tills AI:n returnerat) ──
      const resultDiv = document.createElement('div');
      resultDiv.id = 'matchaAdBody_' + adId;
      resultDiv.style.cssText = 'display:none;margin-top:14px;';
      section.appendChild(resultDiv);

      container.appendChild(section);
    });
  }

  // Ta bort en annons från step 3-listan
  function matchaRemoveAdS3(adId) {
    matchaSelectedAds = matchaSelectedAds.filter(a => String(a.id) !== String(adId));
    matchaRenderStep3Cards();
    updateMatchaStickyBar();
    if (!matchaSelectedAds.length) {
      // Tillbaka till step 2 om inga annonser kvar
      window.matchaSwitchTab(2);
    }
  }

  // Kollar om hit redan finns som "matchat CV" i sparade
  function matchaIsAdAlreadyMatched(hit) {
    if (!hit) return false;
    const list = pfGetSaved();
    return list.some(c => {
      if (!c || c.id.indexOf('match_') !== 0) return false;
      const sameUrl = c.jobUrl && hit.webpage_url && c.jobUrl === hit.webpage_url;
      const sameTitle = c._hit && hit.headline && c._hit.headline === hit.headline
        && (c._hit.employer && hit.employer && c._hit.employer.name === hit.employer.name);
      return sameUrl || sameTitle;
    });
  }

  async function matchaRunAiForAd(hit) {
    const loadEl = document.getElementById('matchaAdLoading_' + hit.id);
    const bodyEl = document.getElementById('matchaAdBody_' + hit.id);
    const genBtn = document.getElementById('matchaGenBtn_' + hit.id);
    if (!loadEl || !bodyEl) return;

    // Visa timglas-loading, dölj knappen
    loadEl.style.display = 'block';
    if (genBtn) genBtn.style.display = 'none';

    const selectedCV = matchaGetSelectedCVData();
    const role    = hit.headline || '';
    const company = (hit.employer && hit.employer.name) || '';
    const adText  = (hit.description && hit.description.text) || '';

    const cvSummary = [
      selectedCV.name    ? 'Namn: '     + selectedCV.name    : '',
      selectedCV.title   ? 'Yrke: '     + selectedCV.title   : '',
      selectedCV.summary ? 'Profil: '   + selectedCV.summary : '',
      selectedCV.jobs && selectedCV.jobs.length
        ? 'Jobb: ' + selectedCV.jobs.map(j => j.title + (j.company ? ' hos ' + j.company : '')).join(', ')
        : '',
      selectedCV.education && selectedCV.education.length
        ? 'Utbildning: ' + selectedCV.education.map(e => (e.degree || '') + (e.school || e.schoolName ? ' vid ' + (e.school || e.schoolName) : '')).join('; ')
        : '',
      selectedCV.skills && selectedCV.skills.length
        ? 'Kompetenser: ' + selectedCV.skills.join(', ')
        : ''
    ].filter(Boolean).join('\n');

    const prompt = 'CV:\n' + cvSummary +
      '\n\nSöker: ' + role + ' hos ' + company +
      (adText ? '\nAnnonsinfo: ' + adText.substring(0, 800) : '') +
      '\n\nSvara med JSON: {"keywords": [{"word": "nyckelord", "status": "match|partial|missing"}], "alternatives": ["alt1", "alt2", "alt3"]}' +
      '\n\nAlternativen ska vara personliga profiltexter (3-5 meningar) riktade mot ' + company + ' och rollen som ' + role +
      '. Texterna ska vara i TVÅ stycken separerade med \\n\\n. Stycke 1 (3-4 meningar): bakgrund och styrkor. Stycke 2 (3-4 meningar): motivation och bidrag — avsluta ALLTID med: "Jag ser fram emot att berätta mer om mig själv på en intervju, bli en del av ert team eller få höra mer om ert företag och jobbmöjligheterna." Tre vinklar: 1) erfarenhetsfokus, 2) motivationsfokus, 3) kompetens och resultat. Max 6 keywords.';

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: 'Du ar en CV-expert. Svara ALLTID med giltig JSON och inget annat.',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!resp.ok) throw new Error('API-fel ' + resp.status);
      const data = await resp.json();
      const raw = (data.content && data.content[0] && data.content[0].text) || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

      // Dölj loading + visa resultat
      loadEl.style.display = 'none';
      renderMatchaAiResult(hit, parsed);
      logEvent('cv_matched', { role: role, company: company });
    } catch(err) {
      console.error('AI-match fel:', err);
      loadEl.style.color = '#ff8fa3';
      loadEl.innerHTML = '<span style="font-size:24px;">❌</span><div style="margin-top:8px;">AI kunde inte matcha just nu. Försök igen om en stund.</div>';
      // Återställ knappen så användaren kan försöka igen
      if (genBtn) {
        genBtn.style.display = '';
        genBtn.textContent = '🔄 Försök igen';
      }
    }
  }

  function renderMatchaAiResult(hit, parsed) {
    const loadEl = document.getElementById('matchaAdLoading_' + hit.id);
    const bodyEl = document.getElementById('matchaAdBody_' + hit.id);
    if (loadEl) loadEl.style.display = 'none';
    if (!bodyEl) return;

    const keywords     = parsed.keywords     || [];
    const alternatives = parsed.alternatives || [];

    // Spara alts globalt så knappen kan hämta dem
    if (!window._matchaAlts) window._matchaAlts = {};
    window._matchaAlts[hit.id] = alternatives;

    const labels = ['🎯 Erfarenhetsfokus', '💫 Motivationsfokus', '⭐ Kompetens & resultat'];

    bodyEl.style.display = 'block';
    bodyEl.innerHTML = `
      ${keywords.length ? `
        <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
          Nyckelord i annonsen
        </div>
        <div class="matcha-keywords">
          ${keywords.map(k => {
            const status = (k.status || 'partial').toLowerCase();
            const icon = status === 'match' ? '✓ ' : status === 'partial' ? '◐ ' : '✕ ';
            return `<span class="matcha-kw ${escape(status)}">${icon}${escape(k.word || '')}</span>`;
          }).join('')}
        </div>
      ` : ''}

      <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">
        Välj en profiltext att använda
      </div>
      ${alternatives.map((text, i) => `
        <div class="matcha-alt">
          <div class="matcha-alt-title">${escape(labels[i] || 'Alternativ ' + (i+1))}</div>
          <div class="matcha-alt-text">${escape(text)}</div>
          <button class="matcha-alt-btn" onclick="matchaApplyText('${escape(String(hit.id))}', ${i})">
            ✨ Använd denna text
          </button>
        </div>
      `).join('')}
    `;
  }

  window.matchaApplyText = function(hitId, altIdx) {
    const alts = window._matchaAlts && window._matchaAlts[hitId];
    if (!alts || !alts[altIdx]) {
      toast('Kunde inte hitta texten', 'error');
      return;
    }
    const text = alts[altIdx];
    const hit  = matchaSelectedAds.find(a => String(a.id) === String(hitId));

    // Applicera på pågående CV
    cvData.summary = text;
    const summaryEl = document.getElementById('cv-summary');
    if (summaryEl) summaryEl.value = text;
    saveCVLocal();
    renderPreview();

    // Spara som matchat CV (14 dagars TTL)
    const jobTitle = (hit && hit.headline) || cvData.title || 'Okänt yrke';
    const matchTitle = 'Matchat CV – ' + jobTitle;
    const snapshot = {
      id: 'match_' + Date.now(),
      title: matchTitle,
      savedAt: Date.now(),
      jobUrl: (hit && hit.webpage_url) || '',
      company: (hit && hit.employer && hit.employer.name) || '',
      adText: (hit && hit.description && hit.description.text) || '',
      _hit: hit ? JSON.parse(JSON.stringify(hit)) : null,
      data: JSON.parse(JSON.stringify(cvData))
    };
    const mlist = pfGetMatched();
    const ei = mlist.findIndex(c => c.title === matchTitle);
    if (ei >= 0) mlist[ei] = snapshot;
    else mlist.unshift(snapshot);
    pfPutMatched(mlist);

    logEvent('cv_saved_from_match', {
      title: matchTitle,
      role: (hit && hit.headline) || '',
      company: (hit && hit.employer && hit.employer.name) || ''
    });

    toast('✅ Sparat! Ditt matchade CV finns nu under 👤 Profil');
  };

  // ──────────────────────────────────────────────────────────

  // ============================================================
  // CV: SKILLS
  // ============================================================
  function renderSkillsChips() {
    const grid = document.getElementById('skillsChips');
    if (!cvData.skills.length) {
      grid.innerHTML = '<div class="empty">Inga kompetenser tillagda än — skriv eller klicka på AI</div>';
      return;
    }
    grid.innerHTML = cvData.skills.map((s, i) => `
      <span class="chip">
        ${escape(s)}
        <button class="chip-remove" onclick="cvRemoveSkill(${i})" title="Ta bort">×</button>
      </span>
    `).join('');
  }

  window.cvAddSkill = function() {
    const inp = document.getElementById('newSkill');
    const v = inp.value.trim();
    if (!v) return;
    if (cvData.skills.includes(v)) {
      toast('Den kompetensen finns redan');
      inp.value = '';
      return;
    }
    cvData.skills.push(v);
    inp.value = '';
    saveCVLocal();
    renderSkillsChips();
    renderPreview();
    markStepDone('mer');
  };

  window.cvRemoveSkill = function(i) {
    cvData.skills.splice(i, 1);
    saveCVLocal();
    renderSkillsChips();
    renderPreview();
  };

  window.cvAiSkills = async function() {
    const title = (cvData.title || document.getElementById('cv-title').value || '').trim();
    const jobs = (cvData.jobs || []);

    if (!title && !jobs.length) {
      toast('Fyll i en jobbtitel (Profil) eller lägg till minst ett jobb först', 'error');
      return;
    }

    // Bygg en sammanfattning av CV-kontext för AI:n
    const jobSummary = jobs.slice(0, 5).map(j => {
      const bullets = [j.desc1, j.desc2, j.desc3].filter(Boolean).join(' | ');
      return '- ' + (j.title || '') + (j.company ? ' på ' + j.company : '') + (bullets ? ': ' + bullets : '');
    }).join('\n');

    const educationSummary = (cvData.education || []).slice(0, 3).map(e =>
      '- ' + (e.degree || '') + (e.schoolName || e.school ? ' (' + (e.schoolName || e.school) + ')' : '')
    ).join('\n');

    showAiLoader('Hämtar kompetenser...', 'AI analyserar dina jobb och utbildning');
    try {
      const userContent =
        'Baserat på följande CV, föreslå 6 relevanta yrkeskompetenser. Basera dig FRÄMST på användarens faktiska arbetslivserfarenhet — inte bara yrkestiteln.\n\n' +
        (title ? 'Önskad/nuvarande yrkestitel: ' + title + '\n\n' : '') +
        (jobSummary ? 'Arbetslivserfarenhet:\n' + jobSummary + '\n\n' : '') +
        (educationSummary ? 'Utbildning:\n' + educationSummary + '\n\n' : '') +
        'Ge 6 konkreta yrkeskompetenser (1-3 ord vardera) som direkt matchar jobberfarenheten ovan. Välj kompetenser som framgår TYDLIGT av arbetsuppgifterna. Svara ENBART med JSON: {"kompetenser": ["k1","k2","k3","k4","k5","k6"]}';

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: 'Du är en CV-expert. Svara ALLTID med giltig JSON och inget annat. Basera kompetenser på användarens faktiska arbetslivserfarenhet.',
          messages: [{ role: 'user', content: userContent }]
        })
      });
      if (!r.ok) throw new Error('API-fel ' + r.status);
      const data = await r.json();
      const raw = (data.content && data.content[0] && data.content[0].text || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      const skills = (parsed.kompetenser || []).slice(0, 6);
      if (!skills.length) throw new Error('Inga kompetenser');
      // Slå ihop med existerande, dedupe
      skills.forEach(s => { if (!cvData.skills.includes(s)) cvData.skills.push(s); });
      saveCVLocal();
      renderSkillsChips();
      renderPreview();
      markStepDone('mer');
      hideAiLoader();
      toast('✨ ' + skills.length + ' kompetenser tillagda');
      logEvent('ai_skill_match', { title, source: 'ai', count: skills.length });
    } catch(e) {
      hideAiLoader();
      toast('Kunde inte hämta kompetenser: ' + e.message, 'error');
    }
  };

  // ============================================================
  // ============================================================
  // CV: LANGUAGES & LICENSES (chip-baserat + nivåer)
  // ============================================================

  // Normalisera cvData.languages — backward-compat med gamla string-arrays
  function normalizeLanguages() {
    if (!Array.isArray(cvData.languages)) cvData.languages = [];
    cvData.languages = cvData.languages.map(l => {
      if (typeof l === 'string') return { name: l, level: 'Flytande' };
      if (l && typeof l === 'object' && l.name) return { name: l.name, level: l.level || 'Flytande' };
      return null;
    }).filter(Boolean);
  }

  function renderLanguages() {
    normalizeLanguages();
    const chips = document.getElementById('languagesChips');
    if (!chips) return;
    if (!cvData.languages.length) { chips.innerHTML = ''; return; }
    chips.innerHTML = cvData.languages.map((l, idx) =>
      '<span class="lang-chip" data-level="' + escapeAttr(l.level) + '" onclick="cvEditLanguage(' + idx + ')">' +
        '<span class="lang-chip-dot"></span>' +
        '<span>' + escape(l.name) + '</span>' +
        '<span class="lang-chip-level">' + escape(l.level) + '</span>' +
        '<button class="chip-remove" onclick="event.stopPropagation(); cvRemoveLanguage(' + idx + ')">✕</button>' +
      '</span>'
    ).join('');
  }

  let _pendingLangName = null; // språk som väntar på nivå-val
  let _editingLangIdx = -1;    // -1 = lägger till, annars index som redigeras

  window.openLanguagePicker = function() {
    normalizeLanguages();
    const list = document.getElementById('languagePickerList');
    if (!list) return;
    const taken = new Set(cvData.languages.map(l => l.name));
    list.innerHTML = ALL_LANGUAGES.map(lang => {
      const isTaken = taken.has(lang);
      return '<div class="picker-option' + (isTaken ? ' selected' : '') + '" onclick="cvPickLanguage(\'' + escapeAttr(lang) + '\')">' +
        '<div class="picker-option-check"></div>' +
        '<span>' + escape(lang) + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('languagePicker').classList.add('open');
  };
  window.closeLanguagePicker = function() {
    document.getElementById('languagePicker').classList.remove('open');
  };

  window.cvPickLanguage = function(lang) {
    normalizeLanguages();
    const existingIdx = cvData.languages.findIndex(l => l.name === lang);
    if (existingIdx >= 0) {
      // Redan tillagt → ta bort
      cvData.languages.splice(existingIdx, 1);
      saveCVLocal();
      renderLanguages();
      renderPreview();
      // Uppdatera picker-lista
      openLanguagePicker();
      return;
    }
    // Nytt språk → öppna nivå-väljare
    _pendingLangName = lang;
    _editingLangIdx = -1;
    document.getElementById('languageLevelTitle').textContent = 'Välj nivå för ' + lang;
    document.getElementById('languagePicker').classList.remove('open');
    document.getElementById('languageLevelPicker').classList.add('open');
  };

  window.cvEditLanguage = function(idx) {
    normalizeLanguages();
    const l = cvData.languages[idx];
    if (!l) return;
    _pendingLangName = l.name;
    _editingLangIdx = idx;
    document.getElementById('languageLevelTitle').textContent = 'Ändra nivå för ' + l.name;
    document.getElementById('languageLevelPicker').classList.add('open');
  };

  window.setLanguageLevel = function(level) {
    if (!_pendingLangName) return;
    if (_editingLangIdx >= 0) {
      // Uppdatera befintligt språk
      cvData.languages[_editingLangIdx].level = level;
    } else {
      // Nytt språk
      cvData.languages.push({ name: _pendingLangName, level: level });
    }
    _pendingLangName = null;
    _editingLangIdx = -1;
    saveCVLocal();
    renderLanguages();
    renderPreview();
    closeLanguageLevelPicker();
    markStepDone('mer');
  };
  window.closeLanguageLevelPicker = function() {
    _pendingLangName = null;
    _editingLangIdx = -1;
    document.getElementById('languageLevelPicker').classList.remove('open');
  };

  window.cvRemoveLanguage = function(idx) {
    normalizeLanguages();
    cvData.languages.splice(idx, 1);
    saveCVLocal();
    renderLanguages();
    renderPreview();
  };

  // Gammal API för bakåtkompatibilitet — används av annan kod som kanske anropar det
  window.cvToggleLanguage = function(lang) {
    cvPickLanguage(lang);
  };

  // ───── KÖRKORT (utan nivåer, bara val) ─────
  function renderLicenses() {
    const chips = document.getElementById('licensesChips');
    if (!chips) return;
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    if (!cvData.licenses.length) { chips.innerHTML = ''; return; }
    chips.innerHTML = cvData.licenses.map((lic, idx) =>
      '<span class="chip">' +
        '<span>🚗 ' + escape(lic) + '</span>' +
        '<button class="chip-remove" onclick="cvRemoveLicense(' + idx + ')">✕</button>' +
      '</span>'
    ).join('');
  }

  window.openLicensePicker = function() {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    const list = document.getElementById('licensePickerList');
    if (!list) return;
    const taken = new Set(cvData.licenses);
    list.innerHTML = ALL_LICENSES.map(lic => {
      const isTaken = taken.has(lic);
      return '<div class="picker-option' + (isTaken ? ' selected' : '') + '" onclick="cvPickLicense(\'' + escapeAttr(lic) + '\')">' +
        '<div class="picker-option-check"></div>' +
        '<span>' + escape(lic) + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('licensePicker').classList.add('open');
  };
  window.closeLicensePicker = function() {
    document.getElementById('licensePicker').classList.remove('open');
  };

  window.cvPickLicense = function(lic) {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    const i = cvData.licenses.indexOf(lic);
    if (i >= 0) cvData.licenses.splice(i, 1);
    else cvData.licenses.push(lic);
    saveCVLocal();
    renderLicenses();
    renderPreview();
    // Uppdatera picker-vyn så kryss/avkryss syns direkt
    openLicensePicker();
    markStepDone('mer');
  };
  window.cvRemoveLicense = function(idx) {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    cvData.licenses.splice(idx, 1);
    saveCVLocal();
    renderLicenses();
    renderPreview();
  };

  window.cvToggleLicense = function(lic) { cvPickLicense(lic); };

  // ============================================================
  // CV: PROFILTEXT (AI)
  // ============================================================
  window.cvClearSummary = function() {
    cvData.summary = '';
    document.getElementById('cv-summary').value = '';
    saveCVLocal();
    renderPreview();
    toast('Profiltext rensad');
  };

  window.cvAiSummary = async function() {
    const name = cvData.name || '';
    const title = cvData.title || '';
    const skills = (cvData.skills || []).join(', ');
    const jobs = (cvData.jobs || []);
    const education = (cvData.education || []);

    if (!title && !jobs.length) {
      toast('Fyll i en jobbtitel (Profil) eller lägg till minst ett jobb först', 'error');
      return;
    }

    // Bygg ett detaljerat kontext av alla jobb
    const jobSummary = jobs.slice(0, 5).map(j => {
      const bullets = [j.desc1, j.desc2, j.desc3].filter(Boolean).join(' | ');
      return '- ' + (j.title || '') + (j.company ? ' på ' + j.company : '') +
             (j.startYear ? ' (' + j.startYear + (j.endYear ? '–' + j.endYear : '') + ')' : '') +
             (bullets ? ': ' + bullets : '');
    }).join('\n');

    const educationSummary = education.slice(0, 3).map(e =>
      '- ' + (e.degree || '') + (e.schoolName || e.school ? ' (' + (e.schoolName || e.school) + ')' : '')
    ).join('\n');

    showAiLoader('Skriver profiltext...', 'AI bygger en personlig presentation baserat på din bakgrund');
    try {
      const userContent =
        'Skriv en professionell CV-profiltext (3-5 meningar, max 80 ord) på svenska. Basera texten FRÄMST på personens faktiska arbetslivserfarenhet — inte bara yrkestiteln.\n\n' +
        'Namn: ' + (name || '(okänt)') + '\n' +
        (title ? 'Önskad/nuvarande yrkestitel: ' + title + '\n' : '') +
        (jobSummary ? '\nArbetslivserfarenhet:\n' + jobSummary + '\n' : '') +
        (educationSummary ? '\nUtbildning:\n' + educationSummary + '\n' : '') +
        (skills ? '\nKompetenser: ' + skills + '\n' : '') +
        '\nKRITISKT: Skriv ALLTID i FÖRSTA PERSON ("Jag har...", "Jag arbetar...", "Min erfarenhet..."). ALDRIG i tredje person ("Oliver har...", "Han arbetar..."). Det är personen själv som presenterar sig.\n\n' +
        'Returnera ENBART profiltexten, inga rubriker, inga bullets, ingen markdown. Gör den personlig och specifik — nämn konkreta styrkor som framgår av erfarenheterna ovan.';

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: 'Du skriver professionella, personliga CV-profiltexter på svenska. Du skriver ALLTID i FÖRSTA PERSON — aldrig i tredje person. Basera alltid texten på personens faktiska arbetslivserfarenhet. Aldrig generiska.',
          messages: [{ role: 'user', content: userContent }]
        })
      });
      if (!r.ok) throw new Error('API-fel ' + r.status);
      const data = await r.json();
      const text = (data.content && data.content[0] && data.content[0].text || '').trim();
      if (!text) throw new Error('Tomt svar');

      cvData.summary = text;
      document.getElementById('cv-summary').value = text;
      saveCVLocal();
      renderPreview();
      markStepDone('text');
      hideAiLoader();
      toast('✨ Profiltext genererad');
      logEvent('profile_generated');
    } catch(e) {
      hideAiLoader();
      toast('Kunde inte generera: ' + e.message, 'error');
    }
  };

  // ============================================================
  // CV: TEMPLATES
  // ============================================================
  function renderTemplates() {
    const sel = document.getElementById('templateSelect');
    if (!sel) return;
    sel.innerHTML = TEMPLATES.map(t =>
      '<option value="' + t.id + '"' + (cvData.template === t.id ? ' selected' : '') + '>' +
        t.icon + '  ' + t.name +
      '</option>'
    ).join('');
    sel.value = cvData.template || 'classic';
  }

  window.cvSelectTemplate = function(id) {
    cvData.template = id;
    saveCVLocal();
    renderTemplates();
    renderPreview();
  };

  // ============================================================
  // CV: PREVIEW (live) — bygger EXAKT samma DOM som mobilen
  // så alla 10 mallar funkar pixelperfect.
  // ============================================================
  function renderPreview() {
    const doc = document.getElementById('cvDocument');
    if (!doc) return;
    // Mall-klass: alla mallar prefixas med "cv-" för att matcha mobilens CSS
    //   classic    → cv-classic
    //   minimal    → cv-minimal
    //   template-3 → cv-template-3
    //   template-N → cv-template-N
    const tpl = cvData.template || 'classic';
    const tplClass = 'cv-' + tpl;
    doc.className = 'cv-document ' + tplClass;

    const html = [];

    // ── HEADER ──
    const hasPhoto = cvData.showPhoto === true && !!cvData.photoData;
    html.push('<div class="cv-header">');
    // Foto-container finns alltid i DOM (för CSS som stylar header) men döljs om inget foto
    html.push('<div class="cv-header-photo" style="' + (hasPhoto ? 'display:block;' : 'display:none;') + '">');
    if (hasPhoto) {
      html.push('<img src="' + cvData.photoData + '" alt="Foto" style="display:block;">');
    }
    html.push('</div>');
    // Text-innehåll
    html.push('<div class="cv-header-content">');
    html.push('<div class="cv-name">' + escape(cvData.name || 'Ditt namn') + '</div>');
    if (cvData.title) html.push('<div class="cv-title">' + escape(cvData.title) + '</div>');
    const contact = [];
    if (cvData.email) contact.push('✉ ' + escape(cvData.email));
    if (cvData.phone) contact.push('📞 ' + escape(cvData.phone));
    if (contact.length) html.push('<div class="cv-contact">' + contact.join(' · ') + '</div>');
    html.push('</div>'); // end cv-header-content
    html.push('</div>'); // end cv-header

    // ── BODY ──
    html.push('<div class="cv-body">');

    // Summary
    if (cvData.summary) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Profil</div>');
      html.push('<div class="cv-summary">' + escape(cvData.summary) + '</div>');
      html.push('</div>');
    }

    // Jobs
    if (cvData.jobs.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Arbetslivserfarenhet</div>');
      cvData.jobs.forEach(j => {
        const period = formatJobPeriod(j) || ((j.startYear || '') + '–' + (j.endYear || 'nu'));
        const loc = j.location ? ' · ' + escape(j.location) : '';
        const descs = [j.desc1, j.desc2, j.desc3].filter(Boolean);
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(j.title || '') + '</div>');
        html.push('<div class="cv-entry-subtitle">' + escape(j.company || '') + ' · ' + escape(period) + loc + '</div>');
        if (descs.length) {
          html.push('<ul style="margin:8px 0 0 0; padding-left:16px; font-size:12px; color:#555; line-height:1.6;">');
          descs.forEach(d => html.push('<li style="margin-bottom:4px;">' + escape(d) + '</li>'));
          html.push('</ul>');
        } else if (j.desc) {
          html.push('<div style="font-size:12px; color:#555; line-height:1.6; margin-top:6px;">' + escape(j.desc) + '</div>');
        }
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Education
    if (cvData.education.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Utbildning</div>');
      cvData.education.forEach(e => {
        const from = formatPeriod(e.startMonth, e.startYear);
        const to = (e.ongoing || e.endYear === 'Pågående' || e.endYear === 'nu') ? 'nu' : formatPeriod(e.endMonth, e.endYear);
        const period = (from || to) ? (from || '') + '–' + (to || '') : '';
        const school = e.schoolName || e.school || '';
        const form = e.schoolForm ? ' (' + escape(e.schoolForm) + ')' : '';
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(e.degree || '') + '</div>');
        html.push('<div class="cv-entry-subtitle">' + escape(school) + form + (period ? ' · ' + escape(period) : '') + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Skills — chip-stil matchar mobilen
    if (cvData.skills.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Kompetenser</div>');
      html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
      cvData.skills.forEach(s => {
        html.push('<span style="display:inline-block; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' + escape(s) + '</span>');
      });
      html.push('</div>');
      html.push('</div>');
    }

    // Languages — chip-stil med formatet "Svenska – Modersmål"
    if (cvData.languages.length) {
      const langs = cvData.languages.map(l =>
        typeof l === 'string' ? { name: l, level: 'Flytande' } : l
      ).filter(l => l && l.name);
      if (langs.length) {
        html.push('<div class="cv-section">');
        html.push('<div class="cv-section-title">Språk</div>');
        html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
        langs.forEach(l => {
          const lvl = l.level || 'Flytande';
          html.push('<span style="display:inline-flex; align-items:baseline; gap:4px; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' +
            '<strong style="font-weight:700;">' + escape(l.name) + '</strong>' +
            '<span style="font-weight:500; opacity:0.7; font-style:italic;"> – ' + escape(lvl) + '</span>' +
          '</span>');
        });
        html.push('</div>');
        html.push('</div>');
      }
    }

    // Licenses — chip-stil
    if (cvData.licenses.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Körkort</div>');
      html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
      cvData.licenses.forEach(lic => {
        html.push('<span style="display:inline-block; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' + escape(lic) + '</span>');
      });
      html.push('</div>');
      html.push('</div>');
    }

    // Certifikat
    if (Array.isArray(cvData.certifications) && cvData.certifications.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Certifikat</div>');
      cvData.certifications.forEach(c => {
        const meta = [c.issuer, c.date].filter(Boolean).map(escape).join(' · ');
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(c.name || '') + '</div>');
        if (meta) html.push('<div class="cv-entry-subtitle">' + meta + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Referenser
    const hasRefs = Array.isArray(cvData.references) && cvData.references.length;
    if (hasRefs || cvData.refOnRequest) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Referenser</div>');
      if (cvData.refOnRequest && !hasRefs) {
        html.push('<div style="font-style:italic; color:#666; font-size:12.5px;">Referenser lämnas på begäran</div>');
      } else if (hasRefs) {
        cvData.references.forEach(r => {
          const contactLine = [r.email, r.phone].filter(Boolean).map(escape).join(' · ');
          html.push('<div class="cv-entry">');
          html.push('<div class="cv-entry-title">' + escape(r.name || '') + '</div>');
          if (r.title) html.push('<div class="cv-entry-subtitle">' + escape(r.title) + '</div>');
          if (contactLine) html.push('<div class="cv-entry-subtitle" style="opacity:0.85;">' + contactLine + '</div>');
          html.push('</div>');
        });
        if (cvData.refOnRequest) {
          html.push('<div style="font-style:italic; color:#666; font-size:12px; margin-top:8px;">Ytterligare referenser lämnas på begäran</div>');
        }
      }
      html.push('</div>');
    }

    html.push('</div>'); // end cv-body

    doc.innerHTML = html.join('');
  }

  // ============================================================
  // CV: SAVE
  // ============================================================
  window.cvSaveAndStore = async function() {
    saveCVLocal();

    // Validera innan vi sparar version till listan
    const title = (cvData.title || '').trim();
    if (!cvData.name) {
      toast('Fyll i ditt namn först', 'error');
      cvSwitchStep('profil');
      return;
    }
    if (!title) {
      toast('Fyll i en yrkestitel först', 'error');
      cvSwitchStep('profil');
      return;
    }

    // Lägg till / uppdatera i listan över sparade CV:n (max 3, samma logik som mobilen)
    const list = pfGetSaved();
    const existing = list.findIndex(c => c.title === title);
    const snapshot = {
      id: existing >= 0 ? list[existing].id : 'cv_' + Date.now(),
      title: title,
      savedAt: Date.now(),
      data: JSON.parse(JSON.stringify(cvData))
    };

    if (existing >= 0) {
      list[existing] = snapshot;
      pfPutSaved(list);
    } else if (list.length >= MAX_SAVED_CVS) {
      // Lista full — fråga om äldsta ska ersättas
      list.sort((a, b) => a.savedAt - b.savedAt);
      const oldest = list[0];
      const oldestDate = new Date(oldest.savedAt).toLocaleDateString('sv-SE',
        { day: 'numeric', month: 'long' });
      const ok = confirm(
        'Du har redan ' + MAX_SAVED_CVS + ' sparade CV:n.\n\n' +
        'Vill du ersätta det äldsta ("' + oldest.title + '" sparat ' + oldestDate + ') ' +
        'med detta nya?'
      );
      if (!ok) {
        toast('CV inte sparat', 'error');
        return;
      }
      const filtered = list.filter(c => c.id !== oldest.id);
      filtered.push(snapshot);
      pfPutSaved(filtered);
    } else {
      list.push(snapshot);
      pfPutSaved(list);
    }

    logEvent('cv_saved', { title: title });

    // Synka till molnet
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      toast('✅ CV sparat lokalt. Logga in för molnsynk.');
      if (currentView === 'profil') renderProfilView();
      return;
    }

    showAiLoader('Sparar i molnet...', 'Synkar med dina enheter');
    try {
      // Använd sbCall så token auto-refreshas + 401 hanteras snyggt
      const result = await sbCall({
        action: 'saveCV',
        userId: auth.userId,
        cvData: cvData
      });

      // Synka även listan över sparade CV:n (kan failsafe ignoreras om den funktionen saknas)
      try { sbSync('saved_cvs', pfGetSaved()); } catch(_) {}

      hideAiLoader();
      if (result && !result.error) {
        toast('✅ CV sparat — synligt på alla enheter');
      } else if (result && result.error === 'not_authenticated') {
        toast('Sparat lokalt — logga in igen för molnsynk', 'error');
      } else {
        // Logga vad servern faktiskt returnerade så det går att debugga
        console.warn('saveCV cloud-fel:', result);
        toast('Sparat lokalt, molnsynk misslyckades', 'error');
      }
    } catch(e) {
      hideAiLoader();
      console.error('saveCV exception:', e);
      toast('Sparat lokalt, nätverksfel', 'error');
    }

    if (currentView === 'profil') renderProfilView();
  };

  // ============================================================
  // CV: PDF EXPORT
  // ============================================================
  window.cvExportPDF = async function() {
    if (!window.jspdf) {
      toast('PDF-bibliotek laddar fortfarande, försök igen', 'error');
      return;
    }
    if (!cvData.name) {
      toast('Lägg till åtminstone ditt namn först', 'error');
      cvSwitchStep('profil');
      return;
    }

    showAiLoader('Genererar PDF...', 'Detta tar några sekunder');
    try {
      const { jsPDF } = window.jspdf;
      const cvDoc = document.getElementById('cvDocument');

      // Klona för att rendera fritt utan layout-begränsningar
      const clone = cvDoc.cloneNode(true);
      clone.style.cssText = 'position:absolute; left:-9999px; top:0; width:794px; padding:0; background:#fff; color:#1a1a2e; font-size:13px; line-height:1.5; border-radius:0; box-shadow:none; overflow:hidden;';
      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 400));

      // ─────────────────────────────────────────────────────────────
      // STEG 1: KARTLÄGG SÄKRA BRYTPUNKTER
      // En säker brytpunkt är toppen av en .cv-section (rubrik följer med sitt
      // innehåll) eller en .cv-entry (hel jobbpost hålls intakt). Vi samlar
      // Y-koordinaten i clone-koordinatsystemet för varje sådant element.
      // ─────────────────────────────────────────────────────────────
      const cloneRect = clone.getBoundingClientRect();
      const safePointsDomPx = [];
      clone.querySelectorAll('.cv-section, .cv-entry').forEach(el => {
        const rect = el.getBoundingClientRect();
        const y = Math.round(rect.top - cloneRect.top);
        if (y > 0) safePointsDomPx.push(y);
      });
      // Dedupe + sortera stigande
      const uniqueDomPoints = [...new Set(safePointsDomPx)].sort((a, b) => a - b);

      // ─────────────────────────────────────────────────────────────
      // STEG 2: RENDERA TILL CANVAS
      // ─────────────────────────────────────────────────────────────
      const scale = 2;
      const canvas = await html2canvas(clone, {
        scale: scale, useCORS: true, backgroundColor: '#ffffff', logging: false,
        width: 794, windowHeight: clone.scrollHeight
      });

      // Konvertera brytpunkter till canvas-pixlar (skalade)
      const canvasBreakPoints = uniqueDomPoints.map(p => p * scale);

      document.body.removeChild(clone);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageW = 210, pageH = 297, margin = 0;
      const imgW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const pageHpx = (contentH * canvas.width) / imgW;

      const imgH = canvas.height * imgW / canvas.width;
      const fullImgData = canvas.toDataURL('image/jpeg', 0.92);

      if (imgH <= contentH) {
        // Allt får plats på en sida
        pdf.addImage(fullImgData, 'JPEG', margin, margin, imgW, imgH);
      } else {
        // ─────────────────────────────────────────────────────────
        // STEG 3: SMART MULTI-PAGE SLICING
        // Bryt vid närmaste säkra brytpunkt (rubrik/post-start) istället
        // för vid fast höjd. Regler:
        //   - Aldrig mitt i en .cv-entry
        //   - Aldrig en ensam rubrik (break FÖRE .cv-section håller ihop)
        //   - OK att bryta mellan två .cv-entry i samma sektion
        // ─────────────────────────────────────────────────────────
        let srcY = 0;
        let pageNum = 0;
        const MIN_PAGE_CONTENT = 50; // undviker oändlig loop om brytpunkt ligger direkt vid srcY

        while (srcY < canvas.height - 1) {
          const theoreticalEnd = srcY + pageHpx;
          let pageEnd;

          if (theoreticalEnd >= canvas.height) {
            // Sista sidan — ta resten
            pageEnd = canvas.height;
          } else {
            // Hitta största säkra brytpunkt som är:
            //   - tillräckligt efter srcY (inte bara en pixel senare)
            //   - före eller vid teoretisk sid-slut
            const validBreaks = canvasBreakPoints.filter(
              p => p > srcY + MIN_PAGE_CONTENT && p <= theoreticalEnd
            );
            if (validBreaks.length > 0) {
              // Välj LARGEST — packa så mycket som möjligt på sidan
              pageEnd = validBreaks[validBreaks.length - 1];
            } else {
              // Ingen säker brytpunkt inom rimligt avstånd → hård brytning.
              // Händer bara om en enskild post är större än en A4-sida.
              pageEnd = theoreticalEnd;
              console.warn('[PDF] Ingen säker brytpunkt hittad för sida ' + (pageNum + 1) + ', hårdbryts');
            }
          }

          const sliceH = pageEnd - srcY;

          if (pageNum > 0) pdf.addPage();

          const tmp = document.createElement('canvas');
          tmp.width = canvas.width;
          tmp.height = sliceH;
          const ctx = tmp.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, tmp.width, tmp.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceImg = tmp.toDataURL('image/jpeg', 0.92);
          const sliceMm = (sliceH / canvas.width) * imgW;
          pdf.addImage(sliceImg, 'JPEG', margin, margin, imgW, sliceMm);

          srcY = pageEnd;
          pageNum++;

          // Säkerhet: avbryt om något gått fel och vi loopar i evighet
          if (pageNum > 20) {
            console.error('[PDF] Abort: >20 sidor — fel i pagineringen');
            break;
          }
        }
      }

      const fileName = (cvData.name || 'CV').replace(/\s+/g, '_') + '_' + new Date().getFullYear() + '.pdf';
      pdf.save(fileName);
      hideAiLoader();
      toast('📥 PDF nedladdad: ' + fileName);
      logEvent('cv_exported');
    } catch(e) {
      hideAiLoader();
      toast('Export misslyckades: ' + e.message, 'error');
      console.error(e);
    }
  };

  // ============================================================
  // PROFIL — sparade & matchade CV:n
  // (samma datastrukturer som mobilen: pathfinder_saved_cvs / pathfinder_matched_cvs)
  // ============================================================
  function pfGetSaved() {
    try {
      const raw = safeGet(SAVED_CVS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function pfPutSaved(list) {
    safeSet(SAVED_CVS_KEY, JSON.stringify(list));
    sbSync('saved_cvs', list);
  }

  function pfGetMatched() {
    try {
      const raw = safeGet(MATCHED_CVS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function pfPutMatched(list) {
    safeSet(MATCHED_CVS_KEY, JSON.stringify(list));
    sbSync('matched_cvs', list);
  }

  function pfMatchedActiveList() {
    const now = Date.now();
    return pfGetMatched().filter(cv => now - (cv.savedAt || 0) < MATCHED_TTL_MS);
  }

  function pfMatchedDaysLeft(cv) {
    const ms = MATCHED_TTL_MS - (Date.now() - (cv.savedAt || 0));
    return Math.max(1, Math.ceil(ms / (24 * 3600 * 1000)));
  }

  // Supabase-synk för listor (saved_cvs, matched_cvs).
  // Mobilen använder samma action 'save_table' med {table, data}.
  // Tystfailar om ej inloggad eller nätverksfel.
  let _sbSyncTimers = {};
  function sbSync(table, data) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;
    clearTimeout(_sbSyncTimers[table]);
    _sbSyncTimers[table] = setTimeout(() => {
      fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_table',
          accessToken: auth.accessToken,
          userId: auth.userId,
          table: table,
          data: data
        })
      }).catch(() => {});
    }, 1500);
  }

  // ── Format & escape ────────────────────────────────────────
  function pfFormatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0,0,0,0);
    const that = new Date(ts); that.setHours(0,0,0,0);
    const diff = Math.round((today - that) / (24*3600*1000));
    if (diff === 0) return 'Idag';
    if (diff === 1) return 'Igår';
    if (diff < 7)   return diff + ' dagar sedan';
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Render ─────────────────────────────────────────────────
  function renderProfilView() {
    // Email
    const auth = getAuth();
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = (auth && auth.email) ? auth.email : 'Inte inloggad';

    // Tasks — rendera direkt om vi redan har data, ladda annars om
    if (typeof renderTasksInProfil === 'function') renderTasksInProfil();
    if (!tasksLoadedOnce && typeof loadMyTasks === 'function') loadMyTasks(true);
    // Lätt auto-refresh varje gång profil-vyn öppnas
    else if (typeof loadMyTasks === 'function') loadMyTasks(true);

    pfRenderSavedList();
    pfRenderMatchedList();
  }

  function pfRenderSavedList() {
    const container = document.getElementById('pfSavedList');
    const countEl   = document.getElementById('pfSavedCount');
    if (!container) return;

    const list = pfGetSaved();
    if (countEl) {
      countEl.textContent = list.length + '/' + MAX_SAVED_CVS;
      countEl.classList.toggle('warn', list.length >= MAX_SAVED_CVS);
    }

    if (!list.length) {
      container.innerHTML =
        '<div class="pf-empty">' +
          '<div class="pf-empty-icon">📄</div>' +
          '<div class="pf-empty-text">Du har inga sparade CV:n än.<br>Bygg ett CV och tryck <strong>Spara CV</strong> för att lägga till det här.</div>' +
          '<button class="pf-empty-cta" onclick="switchView(\'cv\')">Bygg ditt första CV →</button>' +
        '</div>';
      return;
    }

    // Sortera: nyaste först
    const sorted = list.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    container.innerHTML = sorted.map(cv => {
      const title = escape(cv.title || 'Utan titel');
      const name  = escape((cv.data && cv.data.name) || '');
      const date  = pfFormatDate(cv.savedAt);
      return `
        <div class="pf-card">
          <div class="pf-card-head">
            <div class="pf-card-icon">📄</div>
            <div class="pf-card-info">
              <div class="pf-card-title">${title}</div>
              <div class="pf-card-meta">${name ? name + ' · ' : ''}${escape(date)}</div>
            </div>
          </div>
          <div class="pf-card-actions">
            <button class="pf-card-btn primary" onclick="pfOpenSaved('${cv.id}')">Öppna</button>
            <button class="pf-card-btn" onclick="pfExportSaved('${cv.id}')">📤 PDF</button>
            <button class="pf-card-btn danger" onclick="pfDeleteSaved('${cv.id}')" title="Ta bort">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  function pfRenderMatchedList() {
    const container = document.getElementById('pfMatchedList');
    const countEl   = document.getElementById('pfMatchedCount');
    if (!container) return;

    // Rensa utgångna i bakgrunden
    const all = pfGetMatched();
    const active = pfMatchedActiveList();
    if (active.length !== all.length) {
      pfPutMatched(active);
    }

    if (countEl) countEl.textContent = String(active.length);

    if (!active.length) {
      container.innerHTML =
        '<div class="pf-empty">' +
          '<div class="pf-empty-icon">🎯</div>' +
          '<div class="pf-empty-text">Inga matchade CV:n än.<br>Använd <strong>Matcha</strong> för att skräddarsy ett CV mot en jobbannons.<br><span style="font-size:11px;opacity:0.6;">Matchade CV:n sparas i 14 dagar.</span></div>' +
        '</div>';
      return;
    }

    const sorted = active.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    container.innerHTML = sorted.map(cv => {
      const title   = escape(cv.title || 'Utan titel');
      const company = escape(cv.company || '');
      const days    = pfMatchedDaysLeft(cv);
      let badgeCls  = 'ok';
      if (days <= 3) badgeCls = 'danger';
      else if (days <= 7) badgeCls = 'warn';
      const jobUrlBtn = cv.jobUrl
        ? `<a href="${escape(cv.jobUrl)}" target="_blank" rel="noopener" class="pf-card-btn" style="text-decoration:none; text-align:center;" onclick="event.stopPropagation()">↗ Annons</a>`
        : '';
      return `
        <div class="pf-card matched">
          <div class="pf-card-head">
            <div class="pf-card-icon">🎯</div>
            <div class="pf-card-info">
              <div class="pf-card-title">${title}</div>
              <div class="pf-card-meta">${company ? company + ' · ' : ''}${pfFormatDate(cv.savedAt)}</div>
            </div>
          </div>
          <div class="pf-card-badge ${badgeCls}">⏳ ${days} dag${days === 1 ? '' : 'ar'} kvar</div>
          <div class="pf-card-actions">
            <button class="pf-card-btn primary" onclick="pfOpenMatched('${cv.id}')">Öppna</button>
            <button class="pf-card-btn" onclick="pfExportMatched('${cv.id}')">📤 PDF</button>
            ${jobUrlBtn}
            <button class="pf-card-btn danger" onclick="pfDeleteMatched('${cv.id}')" title="Ta bort">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  // ── Actions: Sparade CV ───────────────────────────────────
  window.pfOpenSaved = function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('CV hittades inte', 'error'); return; }

    cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
    ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
      if (!Array.isArray(cvData[k])) cvData[k] = [];
    });
    saveCVLocal();
    switchView('cv');
    cvSwitchStep('profil');
    loadCVIntoForm();
    renderJobs(); renderEducation();
    renderSkillsChips(); renderLanguages(); renderLicenses();
    renderTemplates();
    renderPreview();
    toast('✅ ' + (entry.title || 'CV') + ' öppnat');
  };

  window.pfDeleteSaved = function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) return;
    if (!confirm('Ta bort "' + (entry.title || 'CV') + '"?\nDetta kan inte ångras.')) return;
    pfPutSaved(list.filter(c => c.id !== id));
    pfRenderSavedList();
    toast('🗑️ ' + (entry.title || 'CV') + ' borttaget');
  };

  window.pfExportSaved = async function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('CV hittades inte', 'error'); return; }

    // Spara nuvarande state, ladda in det sparade tillfälligt, exportera, återställ
    const prev = JSON.parse(JSON.stringify(cvData));
    try {
      cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      renderPreview();
      await new Promise(r => setTimeout(r, 100));
      await window.cvExportPDF();
    } finally {
      cvData = prev;
      renderPreview();
    }
  };

  // ── Actions: Matchade CV ──────────────────────────────────
  window.pfOpenMatched = function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('Matchat CV hittades inte', 'error'); return; }

    cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
    ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
      if (!Array.isArray(cvData[k])) cvData[k] = [];
    });
    saveCVLocal();
    switchView('cv');
    cvSwitchStep('profil');
    loadCVIntoForm();
    renderJobs(); renderEducation();
    renderSkillsChips(); renderLanguages(); renderLicenses();
    renderTemplates();
    renderPreview();
    toast('✅ ' + (entry.title || 'Matchat CV') + ' öppnat');
  };

  window.pfDeleteMatched = function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) return;
    if (!confirm('Ta bort matchat CV "' + (entry.title || 'Utan titel') + '"?')) return;
    pfPutMatched(list.filter(c => c.id !== id));
    pfRenderMatchedList();
    toast('🗑️ Borttaget');
  };

  window.pfExportMatched = async function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('Matchat CV hittades inte', 'error'); return; }
    const prev = JSON.parse(JSON.stringify(cvData));
    try {
      cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      renderPreview();
      await new Promise(r => setTimeout(r, 100));
      await window.cvExportPDF();
    } finally {
      cvData = prev;
      renderPreview();
    }
  };

  // ============================================================
  // ÖVNINGAR (TRAINING)
  // ============================================================
  function getTrainingPct(modId) {
    const p = trainingProgress[modId];
    if (!p) return 0;
    const mod = TRAINING_MODULES.find(m => m.id === modId);
    if (!mod) return 0;
    const lessonsLen = (mod.lessons || []).length;
    const quizLen    = (mod.quiz    || []).length;
    const total = lessonsLen + quizLen;
    if (!total) return 0;
    const done = (p.lessonsRead || 0) + (p.quizCorrect || 0);
    return Math.min(100, Math.round((done / total) * 100));
  }

  function getCatPct(cat) {
    if (!cat.mods || !cat.mods.length) return 0;
    let tot = 0, done = 0;
    cat.mods.forEach(m => {
      const lessonsLen = (m.lessons || []).length;
      const quizLen    = (m.quiz    || []).length;
      tot += lessonsLen + quizLen;
      const p = trainingProgress[m.id];
      if (p) done += (p.lessonsRead || 0) + (p.quizCorrect || 0);
    });
    return tot > 0 ? Math.round((done / tot) * 100) : 0;
  }

  // State för att veta om vi visar kategori-grid eller en specifik kategori
  let currentTrainCat = null; // null = kategori-hem, annars ett cat-id

  function renderTrainingHome() {
    document.getElementById('ov-home').style.display = 'block';
    document.getElementById('ov-detail').style.display = 'none';

    const grid = document.getElementById('ovGrid');

    // Om ingen kategori vald: visa 6 stora kategori-kort
    if (!currentTrainCat) {
      const openTaskCount = (typeof tasksOpen === 'function') ? tasksOpen().length : 0;
      const totalTasks    = assignedTasks.length;

      const catsHtml = TRAINING_CATS.map(c => {
        const pct = getCatPct(c);
        return `
          <div class="ov-card train-cat-card" onclick="trainOpenCat('${c.id}')"
               style="border-color: ${c.color}40; background: ${c.color}0d;">
            <div class="ov-card-icon" style="background: ${c.color}20; color: ${c.color};">${c.icon}</div>
            <div class="ov-card-title" style="color: #fff;">${escape(c.label)}</div>
            <div class="ov-card-desc">${c.mods.length} moduler</div>
            <div class="ov-card-meta">
              <span style="color: ${c.color}; font-weight: 700;">${pct > 0 ? pct + '% klart' : 'Starta'}</span>
              <div style="width: 80px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: ${c.color}; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // 7:e kategori: Uppgifter från handläggare
      const taskColor = '#f0c040';
      const taskCard = `
        <div class="ov-card train-cat-card" onclick="trainOpenCat('uppg')"
             style="border-color: ${taskColor}40; background: ${taskColor}0d; position: relative;">
          ${openTaskCount > 0 ? `<div style="position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;border-radius:12px;padding:2px 9px;">${openTaskCount}</div>` : ''}
          <div class="ov-card-icon" style="background: ${taskColor}20; color: ${taskColor};">✅</div>
          <div class="ov-card-title" style="color: #fff;">Uppgifter</div>
          <div class="ov-card-desc">${totalTasks > 0 ? 'Från din handläggare' : 'Väntar på tilldelning'}</div>
          <div class="ov-card-meta">
            <span style="color: ${taskColor}; font-weight: 700;">
              ${openTaskCount > 0 ? openTaskCount + ' att göra' : (totalTasks > 0 ? 'Alla klara!' : 'Inga ännu')}
            </span>
          </div>
        </div>`;

      grid.innerHTML = catsHtml + taskCard;
      return;
    }

    // Specialfall: uppgifter-kategorin
    if (currentTrainCat === 'uppg') {
      renderTasksCategoryView();
      return;
    }

    // Visa modulerna inom vald kategori
    const cat = TRAINING_CATS.find(c => c.id === currentTrainCat);
    if (!cat) { currentTrainCat = null; renderTrainingHome(); return; }

    const catHeader = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <button class="ov-back" onclick="trainBackToCats()" style="margin: 0;">← Alla kategorier</button>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">${cat.icon}</span>
          <div>
            <div style="font-size: 17px; font-weight: 800; color: #fff;">${escape(cat.label)}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.45);">${cat.mods.length} moduler · ${getCatPct(cat)}% klart</div>
          </div>
        </div>
      </div>
    `;

    const moduleCards = cat.mods.map(m => {
      const pct = getTrainingPct(m.id);
      const desc = m.sub || m.desc || '';
      const lessonsLen = (m.lessons || []).length;
      const quizLen    = (m.quiz    || []).length;
      return `
        <div class="ov-card" onclick="trainOpen('${escape(m.id)}')">
          <div class="ov-card-icon">${m.icon || '📘'}</div>
          <div class="ov-card-title">${escape(m.title || '')}</div>
          <div class="ov-card-desc">${escape(desc)}</div>
          <div class="ov-card-meta">
            <span>${lessonsLen} lektioner${quizLen ? ' · ' + quizLen + ' quiz' : ''}</span>
            <span class="ov-card-pct">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = catHeader + moduleCards;
  }

  window.trainOpenCat = function(catId) {
    currentTrainCat = catId;
    renderTrainingHome();
  };

  window.trainBackToCats = function() {
    currentTrainCat = null;
    renderTrainingHome();
  };

  window.trainOpen = function(modId) {
    const mod = TRAINING_MODULES.find(m => m.id === modId);
    if (!mod) return;

    document.getElementById('ov-home').style.display = 'none';
    const det = document.getElementById('ov-detail');
    det.style.display = 'block';

    const desc = mod.sub || mod.desc || '';
    const lessons = mod.lessons || [];
    const quiz    = mod.quiz    || [];

    // Backnav: om vi kom från en kategori → tillbaka dit, annars till kategori-hem
    const backLabel = currentTrainCat
      ? ('← Tillbaka till ' + (TRAINING_CATS.find(c => c.id === currentTrainCat) || {}).label)
      : '← Tillbaka till alla kategorier';

    let html = '<button class="ov-back" onclick="trainBack()">' + escape(backLabel) + '</button>';
    html += '<div class="ov-hero" style="text-align:left; padding:0 0 24px;">';
    html += '<div class="ov-title">' + (mod.icon || '📘') + ' ' + escape(mod.title || '') + '</div>';
    if (desc) html += '<div class="ov-sub" style="margin:0;">' + escape(desc) + '</div>';
    html += '</div>';

    // Lektioner
    if (lessons.length) {
      html += '<div class="cv-section-title" style="margin-bottom:12px;">Lektioner</div>';
      lessons.forEach((l, i) => {
        const text = l.s || '';
        const deep = l.a || '';
        html += `
          <div class="lesson-card">
            <div class="lesson-title">${i+1}. ${escape(l.t || '')}</div>
            <div class="lesson-text">${escape(text)}</div>
            ${deep ? `<details style="margin-top:12px;">
              <summary style="cursor:pointer; color:rgba(255,255,255,0.5); font-size:12px; font-weight:700;">Visa fördjupning</summary>
              <div class="lesson-deep">${escape(deep)}</div>
            </details>` : ''}
          </div>
        `;
      });
    }

    // Quiz
    if (quiz.length) {
      html += '<div class="cv-section-title" style="margin:28px 0 12px;">Quiz — testa dina kunskaper</div>';
      quiz.forEach((q, i) => {
        html += `<div class="quiz-card" data-quiz-idx="${i}">
          <div class="quiz-q">${i+1}. ${escape(q.q || '')}</div>`;
        (q.o || []).forEach((opt, oi) => {
          html += `<button class="quiz-opt" onclick="trainAnswer('${escape(modId)}', ${i}, ${oi}, ${q.c}, this)">${escape(opt)}</button>`;
        });
        html += '</div>';
      });
    }

    det.innerHTML = html;

    // Markera lektioner som lästa när de öppnas (enklast: alla på en gång)
    if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
    trainingProgress[modId].lessonsRead = lessons.length;
    saveTrainingProgress();
  };

  window.trainBack = function() {
    renderTrainingHome();
  };

  window.trainAnswer = function(modId, qIdx, optIdx, correctIdx, btn) {
    const card = btn.closest('.quiz-card');
    if (card.dataset.answered) return; // bara ett svar per fråga

    card.dataset.answered = 'true';
    if (optIdx === correctIdx) {
      btn.classList.add('correct');
      if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
      trainingProgress[modId].quizCorrect = (trainingProgress[modId].quizCorrect || 0) + 1;
      saveTrainingProgress();
    } else {
      btn.classList.add('wrong');
      // Markera även rätt svar
      card.querySelectorAll('.quiz-opt').forEach((b, i) => {
        if (i === correctIdx) b.classList.add('correct');
      });
    }
  };

  // ============================================================
  // UTILITIES
  // ============================================================
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', async () => {
    loadCV();
    loadCVIntoForm();
    renderPreview();
    renderHejView();

    // Steg 1: kolla magic link-redirect (#access_token=... i URL-hashen)
    let magicHandled = false;
    try {
      magicHandled = await handleMagicLinkRedirect();
    } catch(e) {
      console.warn('Magic link check failed:', e);
    }

    // Steg 2: kolla Microsoft OAuth callback (?ms_token=... eller ?ms_error=...)
    const msHandled = magicHandled ? false : checkMicrosoftCallback();

    // Steg 3: om inget externt callback, kör normal auth-check
    if (!magicHandled && !msHandled) {
      checkAuth();
    }

    // Steg 4: kör initial token-refresh om det är nära expiry (håller session alltid fräsch)
    setTimeout(() => { ensureFreshToken().catch(() => {}); }, 2000);

    // Steg 5: schemalagt token-refresh var 45:e minut så användaren aldrig blir utkastad
    setInterval(() => {
      ensureFreshToken().catch(() => {});
    }, 45 * 60 * 1000);
  });

  // Borttagen: gammal magic link-delegation till mobilen — desktop hanterar det själv nu
  // (se handleMagicLinkRedirect ovan)

})();
