# CVmatchen — Funktionsöversikt

**AI-driven jobb- och CV-plattform för deltagare i ekonomiskt bistånd, aktivitetskrav och arbetsmarknadsinsatser.**

PathfinderAI (enskild firma) · www.cvmatchen.com · oliver@cvmatchen.se

---

## 1. Översikt

CVmatchen är en webbaserad SaaS-tjänst (responsiv för telefon, surfplatta och
dator) byggd för svensk kommunal arbetsmarknadsverksamhet. Plattformen
hjälper deltagaren att bygga och skräddarsy CV, träna inför intervju, söka
och matcha jobb, samt arbeta sig genom strukturerade utbildningsmoduler.
Handläggaren får löpande insyn, kan tilldela uppgifter, ladda ned deltagarens
CV och följa progress per enhet.

Plattformen är utvecklad av en studie- och yrkesvägledare med daglig
verksamhet inom svensk arbetsmarknadsförvaltning. Det innebär att
träningsinnehåll, terminologi och flöden är anpassade efter svensk
kontext: ekonomiskt bistånd, aktivitetskrav, närvaroregler, SoL, YH, Komvux,
SFI, CSN och studie- och yrkesvägledning.

---

## 2. Deltagar-vyn

### CV-byggare
- Tio designmallar (klassisk, minimalistisk, modern i flera färgkombinationer)
- Stegvis editor: kontakt → arbetslivserfarenhet → utbildning → språk → körkort/licenser → sammanfattning → mallval → export
- Export som PDF (serverside via Puppeteer, klientside-fallback via jsPDF)
- Automatisk lagring vid varje ändring — både lokalt och till databas

### AI-funktioner
Drivs av Claude (Anthropic) via AWS Bedrock i Frankfurt.

- **AI-coach:** chat med CV-kontext för förberedelse inför intervju eller ansökan
- **Intervjuträning:** AI-simulerad jobbintervju i tre svårighetsgrader, röst eller text, med feedback efter avslutad session
- **CV-AI:** förslag på profiltext, översättning, omskrivning, rättstavning
- **Personligt brev:** AI-genererat utifrån CV och annons

### Jobbmatchning
- Live-sök mot Arbetsförmedlingens Jobtech (Platsbanken) och Jobnet
- Sortering efter relevans och geografi
- Funktion för att spara en annons och låta AI skräddarsy CV mot just den tjänsten
- Jobbdagbok: registrera sökta jobb, intervjuer och utfall

### Träningsmoduler
105 moduler i sex kategorier:

- **Introduktion** — regler, aktivitetskrav, närvaro, AI som verktyg
- **Arbete** — CV, matchning, intervju, personligt brev, arbetsmarknaden
- **Studier** — YH, Komvux, SFI, CSN, SYV, söka utbildning
- **Digital** — LinkedIn, digitalt jobbsökande
- **Ekonomi** — budget, ekonomiskt bistånd, sparande
- **Hälsa** — mental hälsa, stress, sömn

Varje modul innehåller video, lektioner med kort och quiz, samt
skrivövningar. Progress sparas per deltagare och syns för handläggare.

### Utbildningssök
Kurerad katalog kombinerad med dynamisk hämtning från Myndigheten för
yrkeshögskolan (MYH). Täcker YH-utbildningar, yrkesutbildningar, Komvux,
universitet, AF-utbildningar och folkhögskolor.

### Tillgänglighet och mobil
Responsiv design (mobil, surfplatta, dator). Arbetar mot WCAG 2 enligt
DOS-lagen. Tillgänglighetsredogörelse publicerad.

---

## 3. Handläggar-vyn

### Inloggning
- Microsoft EntraID (OAuth 2.0 multitenant) — fungerar med kommunens befintliga AD
- MFA via Microsoft
- Endast e-post som finns i admin-tabellen får tillgång

### Multi-tenant och behörighet
- Fyra roller: superadmin, kommunadmin, enhetsadmin, handläggare
- Kommun- och enhets-isolering på databasnivå (Row Level Security + backend-filtrering)
- En handläggare ser endast deltagare inom egen enhet
- Säkerhetsgranskning av tenant-isolering genomförd 2026-06-09

### Deltagar-överblick
- Sökbar tabell med kolumnsortering: namn, handläggare, enhet, senast aktiv, CV-status, övningar, uppgifter, sökta jobb, status
- Filter på enhet och status (aktiv, ny, nyligen aktiv, inaktiv)
- Stjärnmärk "mina deltagare"
- Stat-kort: antal deltagare, antal aktiva, antal med CV, antal med påbörjade övningar

### Deltagar-detaljvy
Fyra flikar:

- **CV** — full visning av deltagarens CV med nedladdning som PDF
- **Matcha** — sökta jobb, matchningar och AI-genererade CV-varianter
- **Utbilda dig** — sparade utbildningar och utbildningar i CV
- **Träning och uppgifter** — alla 105 moduler med progress, plus tilldelade uppgifter

Polling var 20:e sekund för realtidssynk när deltagaren slutför uppgifter
eller markerar jobb som sökta.

### Uppgift-tilldelning
Åtta uppgiftstyper:

1. Genomför intervjuträning (AI-verifierad)
2. Lägg till profilbild i CV
3. Spara N utbildningar
4. Sök N jobb (verifierat mot jobbdagbok)
5. Matcha CV mot N annonser
6. Bygg klart CV
7. Skriv personligt brev
8. Fri uppgift (egen titel och beskrivning)

Plus möjlighet att tilldela vilken av de 105 träningsmodulerna som helst
som en uppgift med deadline.

### Pilot-översikt
Per-kommun-kort med aktiva deltagare, slutförda uppgifter, klar-rate och
kvarvarande pilotdagar. CSV-export för rapportering.

### Inbjudningsflöden
- Admin till admin: kopierbar magic-länk, fyra rollnivåer med behörighetsregler
- Admin till deltagare: magic-länk via e-post, klick öppnar onboarding, automatisk koppling till rätt enhet

### Säkerhetskontroller
- Rate-limit på känsliga endpoints (inloggning, invite, radering, OTP)
- JWT-verifiering på alla data-anrop
- XSS-escape i alla render-funktioner
- Audit-loggning vid invite, uppgift-tilldelning och radering
- GDPR-radering inbyggd (admin_delete_user)

---

## 4. Teknisk infrastruktur

| Komponent | Tjänst | Region |
|---|---|---|
| Webbserver och API | Vercel | Stockholm (arn1) |
| Databas | Supabase Postgres | Irland / Frankfurt |
| AI-inferens | Claude via AWS Bedrock (EU-inferensprofil) | Frankfurt (eu-central-1) |
| E-post | Resend via Supabase SMTP | EU |
| Inloggning | Microsoft EntraID | EU |
| Felövervakning | Sentry (PII-maskad) | EU |
| Typsnitt | Självhostat (systemfonter) | Lokalt |
| Spårning / analytics | Används ej | — |

All databehandling sker inom EU/EES. Inga tredjelandsöverföringar under
normal drift. Mer information i separat säkerhetsdokument.

---

## 5. Uppfyllelse mot kommunala IT-krav

Nedan ett urval av typiska kommunala IT-krav och hur CVmatchen uppfyller dem.
Detaljerad genomgång lämnas på begäran för respektive upphandling.

### Inloggning och identitet
- Microsoft EntraID / OpenID Connect — i drift
- MFA via Microsoft för administrativ åtkomst
- Rollbaserad åtkomstkontroll med multi-tenant-isolering
- Personliga konton, all aktivitet loggas

### Användbarhet och UX
- Webbaserad SaaS — fungerar i alla moderna webbläsare
- Responsiv design för telefon, surfplatta och dator
- WCAG 2-anpassad, tillgänglighetsredogörelse publicerad
- Svarstid normalt under 500 ms vid normal belastning

### Statistik och export
- Inbyggd dashboard med statistik per kommun, enhet och deltagare
- CSV-export utan extra kostnad
- All deltagardata kan exporteras av kommunen vid avtalsslut

### Säkerhet
- Sårbarhetsövervakning via Sentry
- TLS 1.3 / HTTPS med HSTS preload
- Strikt Content Security Policy
- Daglig backup (Supabase PITR) med återställningsförmåga
- Säkerhetsloggning av admin-aktivitet
- Kommunen har rätt att genomföra säkerhetsrevision

### Informationshantering
- Kommunen är personuppgiftsansvarig, PathfinderAI (enskild firma) är biträde
- All data inom EU/EES
- Permanent radering på begäran
- Personuppgiftsbiträdesavtal tecknas inför pilot

### Dokumentation
- Arkitekturbeskrivning, säkerhetsdokumentation och drift-dokumentation tillgänglig
- Allt på svenska
- Versionshistorik via Git

---

## 6. Kontakt

PathfinderAI (enskild firma)
Oliver Pettersson — grundare och utvecklare
oliver@cvmatchen.se
www.cvmatchen.com
