# Mötesförberedelse — AMF Helsingborg

> **🔒 INTERN ANTECKNING — får inte delas eller skrivas ut för annan part.**
> Detta är dina egna förberedelser inför mötet. Lämna den på din egen
> enhet. Dokumenten som får visas och delas externt heter
> `pilot-erbjudande-helsingborg`, `cvmatchen-funktionsoversikt` och
> `sakerhet-cvmatchen`.

---

## Din roll och utgångspunkt

Du är studie- och yrkesvägledare i Helsingborg som byggt CVmatchen för att
lösa problem du själv möter i din vardag. Det är en stark utgångspunkt —
nämn det rakt och tidigt.

> *"Jag är SYV här i Helsingborg och byggde CVmatchen för att vår egen
> vardag behövde det."*

---

## Tre saker att ta med dig fysiskt

1. **Laptop och telefon** — laddade, konton redan inloggade, demon redo.
2. **Pilot-erbjudande** (utskrivet eller på laptopen) — lämnas eller mejlas efter mötet.
3. **Säkerhetsdokument** (på laptopen, eller mejlas på begäran).

Funktionsöversikten kan skickas i efterhand om hon vill ha en längre beskrivning.

---

## Förslag på upplägg

1. **Börja med en öppen fråga** om hur de jobbar idag och vilka utmaningar
   de ser i deltagarflödet. Lyssna ordentligt innan demon.
2. **Demo** med utgångspunkt i det hon precis berättat — först deltagar-vyn,
   sedan handläggar-vyn.
3. **Nämn datalokalitet** kort när det passar — all data inom EU/EES,
   ingen tredjelandsöverföring, GDPR-radering inbyggd.
4. **Pilot-villkoren** kommer mot slutet — 3 månader, 5 000 kr/månad,
   utvärdering tillsammans, eventuell direktupphandling efter pilot.
5. **Avsluta med ett konkret nästa steg** — vilka kontaktpersoner, när
   kan inloggningar provisioneras, när tecknas PuB-avtal.

---

## Vanliga frågor du kan förvänta dig

### Dataskydd och GDPR
- **Var lagras data?** Vercel Stockholm, Supabase Frankfurt/Irland, AWS Bedrock Frankfurt. Allt inom EU/EES.
- **Tränas AI på vår data?** Nej. Zero data retention via AWS Bedrock.
- **PuB-avtal?** Ja, tecknas innan pilot startar. PathfinderAI är biträde, kommunen är ansvarig.
- **Hur raderar vi en deltagare?** Inbyggd GDPR-radering via admin-funktion.

### Funktion och passform
- **Vad löser plattformen?** Kortare tid till jobb, mindre administration för handläggare, deltagaren äger sin egen process, mätbart i realtid.
- **Hur integrerar det med våra system?** Idag fristående SaaS med Microsoft-inloggning. Inga befintliga integrationer krävs. API finns för framtida behov.
- **Vad gör handläggaren konkret?** Loggar in via Microsoft, ser sin enhets deltagare, kan tilldela uppgifter, ladda ner CV, följa progress.

### Bevis och uppföljning
- **Har ni resultat?** Vi startar pilot nu — Helsingborg kan bli först.
- **Hur mäter vi effekt?** Inbyggd pilot-översikt: aktiva deltagare, slutförda uppgifter, sökta jobb, klar-rate per enhet. CSV-export för rapportering.

### Pris och avtal
- **Vad kostar piloten?** 5 000 kr/månad i 3 månader, totalt 15 000 kr.
- **Vad händer efter pilot?** Gemensam utvärdering. Om värdet finns där diskuterar vi direktupphandling för bredare införande.
- **Tillgänglighet?** WCAG 2-anpassad, tillgänglighetsredogörelse publicerad.

### Säkerhet och revision
- **Säkerhetsrevision?** Kommunen har rätt att granska. Kod, dokumentation och loggar tillgängliga.
- **Bolagsrevision?** PathfinderAI är ett mindre bolag — formell tredjepartsrevision planerad under pilotår 1. Kommunens egen IT-säkerhet kan granska under pilot.

---

## Demo-checklista (testa kvällen innan)

- [ ] Deltagar-konto inloggat på telefon, CV med data
- [ ] Handläggar-konto inloggat på laptop
- [ ] Testa: bygga eller redigera CV
- [ ] Testa: söka jobb och matcha CV mot annons
- [ ] Testa: starta intervjuträning
- [ ] Testa: handläggarvyn — öppna deltagare, tilldela uppgift, se framsteg
- [ ] Sparade skärmdumpar som backup ifall wifi krånglar
- [ ] Pilot-erbjudande utskrivet eller redo att mejla
- [ ] Säkerhetsdokument redo på laptop
- [ ] Telefon och laptop laddade

---

## Avslutande mening

> *"Vill ni starta en 3-månaders pilot med Arbetsmarknadsenheten för
> 5 000 kr/månad? Jag kan provisionera inloggningar inom en vecka. Efter
> pilot för vi en gemensam diskussion om fortsatt samarbete."*

---

*Internt minnesdokument. Avsedd endast för Oliver Pettersson, PathfinderAI (enskild firma).*
