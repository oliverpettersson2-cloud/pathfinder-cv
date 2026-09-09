# DPIA — pilot CVmatchen, Perstorps kommun

**Konsekvensbedömning avseende dataskydd (GDPR art. 35)**

Personuppgiftsansvarig: Perstorps kommun, arbetsmarknadsenheten
Personuppgiftsbiträde: PathfinderAI (enskild firma) — tjänsten CVmatchen
Underlag framtaget av: Oliver Pettersson · Datum: 2026-09-09

> **Ägs och slutförs av kommunens dataskyddsombud (DSO).** Detta är ett
> leverantörsförberett underlag. **Piloten får inte starta med skarpa
> personuppgifter förrän DPIA:n är godkänd av DSO och PUB är signerat.**

---

## 1. Omfattning
Tidsbegränsad pilot (3 mån) inom arbetsmarknadsenheten: ca 15–30 deltagare
och 2–3 handläggare. CV-skapande, jobbmatchning, intervjuträning, uppföljning.

## 2. Behövs DPIA? — Ja
Träffar flera riskkriterier: profilering (AI-matchning), **sårbar målgrupp**
(arbetssökande, delvis unga), **potentiellt känsliga uppgifter i fritext**
(art. 9), och **innovativ teknik** (generativ AI). Liten skala (pilot) men
DPIA krävs ändå.

## 3. Automatiserat beslutsfattande (art. 22) — nej
AI:n föreslår, människan beslutar. Matchningar/profiltexter/feedback är
förslag som deltagare och handläggare godkänner. Aktivitetsloggen är
underlag — aldrig ensamt beslut som påverkar försörjningsstöd.

## 4. Laglig grund
- Behandlingen: kommunens uppgift av allmänt intresse (**art. 6.1.e**).
- Ev. känsliga uppgifter (art. 9): grund fastställs av **DSO** (t.ex. 9.2.b
  social trygghet eller 9.2.g viktigt allmänt intresse med stöd i svensk lag).

## 5. Registrerades rättigheter
Information (integritetspolicy + AI-samtycke), tillgång/portabilitet
(dataexport i appen), rättelse (deltagaren redigerar själv), radering
(kontoradering — se åtgärd 1), återkallat samtycke (art. 7.3).

## 6. Riskanalys (urval)
| Risk | Nivå | Skydd | Restrisk |
|------|------|-------|----------|
| Obehörig åtkomst | Medel | RLS, tenant-isolation, TLS, kryptering | Låg–Medel |
| Cross-tenant-läcka | Medel | Serverside verifyAdmin, deny-by-default | Låg |
| Känsliga uppgifter i fritext | Hög | AI-samtycke + varningstext + människa-i-loopen | Medel |
| AI-text felaktig | Medel | Deltagaren granskar/godkänner allt | Låg |
| AI-data lämnar EU | Låg–Medel | Bedrock EU, ingen lagring/träning | Låg |
| Aktivitetslogg → försörjningsstöd | Medel | Logg = underlag, ej beslut; handläggarrutin | Låg–Medel |

## 7. Åtgärder före start (måste vara klara)
| # | Åtgärd | Ansvarig | Status |
|---|--------|----------|--------|
| 1 | GDPR-radering av deltagare (`admin_delete_user` + `user_delete_self`, kaskad 13 tabeller + auth) | PathfinderAI | ✅ |
| 2 | PUB-avtal signerat (två parter) | Kommun + PathfinderAI | ⏳ |
| 3 | Beslut att köra piloten fattat + diariefört av kommunen | Kommun | ⏳ |
| 4 | Fastställ laglig grund för ev. art. 9-data | DSO | ⏳ |
| 5 | Fastställ lagringstid (förslag: radering vid pilotens slut) | DSO | ⏳ |
| 6 | Mejlleverans (invite) verifierad | PathfinderAI | ⏳ |
| 7 | Invite-kedjan testad end-to-end | Båda | ⏳ |
| 8 | Varningstext känslig fritext | PathfinderAI | ✅ |
| 9 | AI-samtycke live | PathfinderAI | ✅ |
| 10 | Bedrock-EU aktiv | PathfinderAI | ✅ |
| 11 | DPIA godkänd av DSO | DSO | ⏳ |

## 8. Samråd
DSO granskar och godkänner. Förhandssamråd med IMY (art. 36) bedöms troligen
ej nödvändigt givet skyddsåtgärderna — men DSO avgör.

## 9. Godkännande (DSO)
Namn: ______________________  Datum: __________

Bedömning: ☐ Godkänd ☐ Godkänd med villkor ☐ Kräver förhandssamråd IMY

Villkor: __________________________________________________
