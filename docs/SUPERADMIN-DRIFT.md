# SuperAdmin-onboarding, drift och verifiering

Detta dokument beskriver hur SeniorHub onboardar organisationer och administratörer via **SuperAdmin** (steg 1–7 i arkitekturplanen). Det påverkar **inte** `/bli-arrangor`, befintligt org-admin-flöde eller statistikaggregation i kod.

## Roller och data modell

| Koncept | Firestore / Auth |
|--------|-------------------|
| SuperAdmin | `admins/{uid}` med `role: superadmin` (plattform, t.ex. `organizationId: seniorhub`) |
| Org-admin / organizer | `admins/{uid}` med `role: admin` och `organizationId` = tenant |
| Publik organisation | `organizations/{organizationId}` (läsbar för alla) |
| Publik profil-URL | `/organizer/[slug]` — slug från organisationsnamn / legacy organizers |

Flera **separata** Auth-konton kan ha `admins/{uid}` med **samma** `organizationId`. Varje dokument har unikt `uid`; de skriver inte över varandra. Inbjudan till samma org igen är **idempotent** (befintlig admin i samma org: ingen tyst flytt).

Org-admin **A** kan inte via regler ändra aktiviteters `organizationId` till org **B** (`adminCanAccessActivityData` jämför `data.organizationId` med `adminOrgId()`). Inbjudan **avvisar** användare som redan är admin i **annan** organisation.

## SuperAdmin-flöde (UI)

1. **Inloggning** som användare med `admins/{uid}` och `role: superadmin`.
2. **Admin-fliken** → länk till plattform (syns endast för superadmin).
3. **Plattformsstart:** `/admin/platform` — skyddad av `SuperAdminGuard` (Firestore-verifierad roll). Här finns inget ”Kommer snart”; tydliga genvägar till **Organisationer** och **Skapa organisation** plus kort guide (`src/app/admin/platform/index.tsx`).
4. **Skapa organisation:** `/admin/platform/create-organization` → callable **`createOrganization`**. Efter lyckat skapande kan SuperAdmin gå tillbaka till listan.
5. **Lista organisationer:** `/admin/platform/organizations`. Listan **uppdateras vid fokus** (`useFocusEffect` → `refreshOrganizations`) så att nyligen skapade organisationer syns utan omstart. Tom lista → länk **Skapa organisation**; Firestore-fel → **Försök igen** (`organizations-context` + list-skärm).
6. **Organisationsprofil:** `/admin/platform/organization/[organizationId]` — samma **`OrganizationProfileForm`** som org-admin använder på `/admin/organization`, men med SuperAdmin-routes. Profil sparas direkt mot Firestore (superadmin tillåten i regler). Länk **Hantera administratörer** leder till admins-skärmen. Längst ned: **Radera organisation** (se avsnittet om radering).
7. **Administratörer:** `/admin/platform/organization/[organizationId]/admins` — panel **`SuperAdminOrganizationAdminsPanel`**: lista via callable, formulär för inbjudan, knapp **Ta bort administratör** per rad (revoke).

Alla callable-anrop går via **`prepareCallableRequest`** (App Check + Functions-instans).

## Organisationshantering i detalj

### Skapa och redigera tenant

- **Skapa:** endast SuperAdmin via **`createOrganization`** (nytt `organizations/{organizationId}` + slug).
- **Redigera profil:** namn, beskrivning, kontakt, logotyp m.m. via `OrganizationProfileForm`. Deltagare ser resultatet på **`/organizer/[slug]`** (publik läsning av `organizations`).
- **Org-admin:** redigerar **egen** tenant-profil på `/admin/organization` (samma formulär, låst `organizationId` från `admins/{uid}`).

### Bjud in och lista organisationsadministratörer

1. SuperAdmin öppnar organisationens admins-route (steg 7 ovan).
2. **`listOrganizationAdmins`** hämtar `admins` där `organizationId` matchar tenant och `role == admin` (superadmin-konton listas inte som org-admin).
3. **Inbjudan:** e-post (+ valfritt visningsnamn) → **`inviteOrganizerAdmin`**. Callable skapar eller återanvänder Firebase Auth, skriver `admins/{uid}` med `role: admin` och tenant-`organizationId`, skickar lösenordslänk (Resend). Befintlig admin i **samma** org är idempotent; admin i **annan** org flyttas inte tyst.
4. **Klient:** success/fel visas i panelen; listan laddas om efter lyckad inbjudan. `organizationId` i anrop kommer alltid från **låst route** (`lockedOrganizationId`), inte fri text.
5. **Efter invite:** ny admin behöver e-post i **`EXPO_PUBLIC_ADMIN_EMAIL_ALLOWLIST`** (klient) och vid behov **`ADMIN_EMAIL_ALLOWLIST`** (Functions push) — se avsnittet om allowlist nedan.

### Återkalla (revoke) org-admin

**Syfte:** ta bort **adminbehörighet** för en person i en tenant utan att radera inloggningskontot.

**UI:** på admins-skärmen, **Ta bort administratör** → bekräftelsedialog → anrop till klienten `revokeOrganizerAdminViaCallable` (`src/services/super-admin/revoke-organizer-admin.ts`). SuperAdmin kan inte ta bort **sig själv** via panelen (klientblockering). Success/fel och omladdad lista visas i panelen.

**Server:** callable **`revokeOrganizerAdmin`** (`functions/src/callable/revoke-organizer-admin.ts`):

- **`assertSuperAdmin`** — endast SuperAdmin.
- Payload: `organizationId` + `targetAdminUid` (valideras i `parseRevokeOrganizerAdminInput`).
- Organisationen måste finnas.
- Policy (`resolveRevokeOrganizerAdminDecision`): nekas vid self-revoke, saknat admin-dokument, mål med `role: superadmin`, fel roll, eller `organizationId` som inte matchar tenant.
- Vid godkänt beslut: **endast** `admins/{targetAdminUid}` raderas i Firestore.
- **Firebase Auth** rörs inte — personen kan fortfarande ha användarkonto men förlorar org-admin i den tenant.

### Radera organisation

**Syfte:** ta bort en hel tenant och tillhörande Firestore-data för org-admins och aktiviteter. **Inte** en soft delete.

**UI:** `/admin/platform/organization/[organizationId]` → **Radera organisation** → modal med varning och textfält. SuperAdmin måste **skriva organisations-id** (samma id som i routen) för att knappen **Radera** ska aktiveras. Bekräftelse skickas via `deleteOrganizationViaCallable` (`src/services/super-admin/delete-organization.ts`). Modalen använder **`KeyboardAwareModal`** så bekräftelsefältet och knappar syns ovanför tangentbordet (iOS testat).

**Server:** callable **`deleteOrganization`** (`functions/src/callable/delete-organization.ts`):

- **`assertSuperAdmin`** — endast SuperAdmin.
- Rate limit per superadmin (`assertRateLimit`).
- Payload: `organizationId` + **`confirmOrganizationId`** — båda normaliseras; **`confirmOrganizationId` måste matcha `organizationId` exakt** efter normalisering (`parseDeleteOrganizationInput`). Annars nekas anropet.
- Reserverade organisationer (t.ex. **`seniorhub`**) blockeras (`assertOrganizationIdDeletable`).
- Organisationen måste finnas innan cascade körs.

**Cascade** (`deleteOrganizationCascade` i `functions/src/utils/delete-organization-cascade.ts`), i ordning:

1. **Org-admins:** `admins/{uid}` med `role: admin` och matchande `organizationId`. Superadmin-`admins`-dokument **raderas inte**.
2. **Aktiviteter** för organisationen: för varje aktivitet raderas underdokument **`registrations`**, **`announcements`**, **`reminderDeliveries`**, därefter aktivitetsdokumentet.
3. **`organizations/{organizationId}`** raderas sist.

**Firebase Auth:** inga Auth-användare raderas — vare sig org-admins eller deltagare. Borttagna personer kan ha kvar Auth-konton utan motsvarande `admins`-dokument eller tenant-data.

**Firestore-regler:** direkt **delete** på `organizations/{organizationId}` är **`allow delete: if isSuperAdmin()`** (`src/firebase/firestore.rules`). Org-admin kan uppdatera profil men **inte** radera organisation via regler. Produktflödet går via callable (superadmin + servervalidering + cascade); regeln är extra skydd mot klient-side delete.

Efter lyckad radering navigerar UI tillbaka till organisationslistan och anropar `refreshOrganizations`.

### Cloud Functions (callables) som SuperAdmin använder

| Callable | Syfte | Klient-service |
|----------|--------|----------------|
| `createOrganization` | Skapa `organizations/{id}` + slug | `src/services/super-admin/create-organization.ts` |
| `listOrganizationAdmins` | Lista `admins` med `organizationId` + `role == admin` | `src/services/super-admin/list-organization-admins.ts` |
| `inviteOrganizerAdmin` | Skapa/återanvänd Auth, skriv `admins/{uid}`, skicka lösenordslänk (Resend) | `src/services/super-admin/invite-organizer-admin.ts` |
| `revokeOrganizerAdmin` | Ta bort `admins/{uid}` för org-admin i angiven tenant (Auth-konto kvar) | `src/services/super-admin/revoke-organizer-admin.ts` |
| `deleteOrganization` | Radera tenant: org-admins, aktiviteter (+ underdokument), `organizations/{id}` (Auth kvar) | `src/services/super-admin/delete-organization.ts` |

**Säkerhetsgräns på servern:** `assertSuperAdmin` i varje callable ovan. Klienten skickar `organizationId` från **låst route**; manipulation av payload ska fortfarande nekas eller begränsas av servervalidering och org-existens. Detaljer för **revoke** och **radera organisation** finns i avsnittet *Organisationshantering i detalj* ovan.

**Deploy:** `revokeOrganizerAdmin` och `deleteOrganization` måste vara deployade tillsammans med övriga SuperAdmin-callables (region enligt `europeWest1CallableOptions`). Firestore-regler som tillåter superadmin-delete på `organizations` måste vara deployade i samma miljö. Detta dokument beskriver inte deploy-kommandon.

### Vad SuperAdmin **inte** ersätter

- **`/bli-arrangor`** — ansökningar + e-post till plattform; manuell/handläggning oförändrad.
- **Org-admin** — inloggning via allowlist + befintligt `admins/{uid}`; aktiviteter, statistik och profil för **egen** `organizationId`.

## E-post allowlist (nya administratörer)

Allowlisten är **inte** samma sak som att skapa ett admin-konto. Admin-dokument skapas av **`inviteOrganizerAdmin`** (eller manuellt i Console). Allowlist styr **vem som får använda admin-UI** och **vem som får boknings-push som organizer**.

### 1. Klient — admin-inloggning / bootstrap

- **Variabel:** `EXPO_PUBLIC_ADMIN_EMAIL_ALLOWLIST` (kommaseparerade e-postadresser, gemener efter trim).
- **Fil:** `.env` / EAS secrets; dokumenterat i `.env.example`.
- **Kod:** `src/services/admin/admin-email-allowlist.ts` → `ensureDefaultAdminAccount` returnerar `null` om e-post **inte** finns i listan (även om `admins/{uid}` finns).
- **Firestore-regler** är den egentliga skrivskyddet; allowlist är ett **extra klientfilter**.

**Process när SuperAdmin bjudit in ny org-admin:**

1. SuperAdmin kör **invite** (callable skapar Auth + `admins/{uid}`).
2. Lägg till personens e-post i **`EXPO_PUBLIC_ADMIN_EMAIL_ALLOWLIST`** i rätt miljö (dev/staging/prod) och bygg om klienten vid behov.
3. Personen sätter lösenord via e-postlänk och loggar in i admin.

### 2. Functions — organizer-notiser vid bokning

- **Parameter:** `ADMIN_EMAIL_ALLOWLIST` (kommaseparerat), se `functions/.env.example`.
- **Kod:** `functions/src/notifications/admin-allowlist.ts` — används t.ex. i `fetchOrganizerUserIds` (`deliver-events.ts`): alla `admins` för aktivitetens `organizationId` vars **e-post** finns i allowlist får push.

**Process för ny admin som ska få bokningsnotiser:**

1. E-post ska finnas i **`ADMIN_EMAIL_ALLOWLIST`** i Functions-miljön (Firebase params / `.env` emulator).
2. Uppdatera utan kodändring: sätt param i Firebase Console eller `firebase functions:config`/params enligt projektets setup.
3. Flera admins i samma org: **varje** e-post som ska få notiser måste listas (query hämtar alla admins för org, filtrerar på allowlist).

SuperAdmin-plattformens e-post behöver allowlist om den också ska använda admin-UI; vanliga org-admins behöver **sin** e-post i båda listorna för UI respektive push.

## Verifiering (read-only genomgång)

### SuperAdmin → organisation → admins / revoke / radera

- UI: `SuperAdminGuard`, routes under `src/app/admin/platform/**`.
- Profil + radera: `src/app/admin/platform/organization/[organizationId].tsx` (`OrganizationProfileForm`, `KeyboardAwareModal`, `deleteOrganizationViaCallable`).
- Admins + invite + revoke: `super-admin-organization-admins-panel.tsx`, route `.../organization/[organizationId]/admins`.
- `organizationId` från route via `resolveSuperAdminOrganizationRouteId`; invite/list/revoke/delete services tar `lockedOrganizationId` (delete även typed confirm i UI).

### Publik `/organizer/[slug]`

- Route: `src/app/organizer/[slug].tsx`, registrerad i `src/app/_layout.tsx`.
- Läser organisationer/organizers från context; aktiviteter filtreras med `getActivitiesByOrganizerSlug` (`src/constants/organizers.ts`).
- Firestore: `organizations` **`allow read: if true`** — publik data oförändrad av SuperAdmin-onboarding.

### Gemensam statistik per organisation

- `AdminStatisticsView` anropar `fetchAdminStatistics(..., { organizationId: adminAccount.organizationId })`.
- `fetch-admin-statistics.ts` filtrerar aktiviteter där `activity.organizationId === organizationId`; alla org-admins med samma `organizationId` ser **samma** aggregat (delad tenant-statistik).

### Bli arrangör

- `organizerApplications` i Firestore-regler och `/bli-arrangor`-flöde har **inte** ändrats i onboarding-stegen; ansökningar testas i `tests/firestore-rules.test.mjs`.

## Manuell checklista efter deploy (referens)

Organisationsdelen (SuperAdmin) är **färdigtestad på iPhone** för revoke, radera organisation (inkl. skriva organisations-id i bekräftelsemodalen) och tangentbord i raderingsdialogen. Kör nedan i målmiljö efter deploy av callables + regler.

1. SuperAdmin: skapa org → redigera profil → **Hantera administratörer** → lista admins → bjud in admin → (valfritt) **Ta bort administratör** med bekräftelse.
2. Ny admin: allowlist i klient + Functions, lösenord via mail, login, skapa aktivitet.
3. Andra admin samma org: separat invite, båda syns i `listOrganizationAdmins`.
4. Publik sida: öppna `/organizer/{slug}` efter profilsparande.
5. Statistik: båda admins ser samma siffror för org.
6. **Radera organisation (endast test-tenant):** öppna profil → **Radera organisation** → skriv exakt organisations-id → bekräfta → tenant försvinner ur listan; Auth-konton för tidigare admins ska finnas kvar utan adminbehörighet.
7. `/bli-arrangor`: skicka testansökan (staging).

## Relaterade tester

### Automatiska tester (Node)

Kör från repo-root. Bygg Functions först om du ändrat serverkod: `cd functions && npm run build`.

```bash
node --test tests/revoke-organizer-admin.test.mjs tests/delete-organization.test.mjs
```

**Organisationsrelaterade tester (senaste read-only audit): 80/80 gröna.**

| Scenario | Testfil | Status (senaste körning i repo) |
|----------|---------|----------------------------------|
| Revoke org-admin: auth gate, payload, policy (self/superadmin/fel org/roll), rate limit | `tests/revoke-organizer-admin.test.mjs` | policy/enhet, ingen live Firestore-cascade |
| Radera organisation: auth gate, confirm match, seniorhub block, admin-filter, activity-subcollections, cascade-ordning, Auth orörd, rate limit | `tests/delete-organization.test.mjs` | policy/enhet + cascade-plan; ingen full emulator-integration |
| Flera admins samma org, filtrering annan org | `tests/list-organization-admins.test.mjs` | Kör separat (`node --test tests/list-organization-admins.test.mjs`) |
| Ingen tyst flytt mellan org vid invite | `tests/invite-organizer-admin.test.mjs` | Kör separat |
| SuperAdmin guard / org-admin nekas plattform | `tests/super-admin-access.test.mjs`, `tests/super-admin-organization-admins.test.mjs` | Kör separat |
| Org-admin kan inte byta aktivitetens org | `tests/firestore-rules.test.mjs` | Kräver Firestore-emulator (`npm run test:firestore-rules`) |
| Bli arrangör (ansökan) | `tests/firestore-rules.test.mjs` (`organizerApplications`) | Kräver emulator |
| Publik organizer-slug + statistik org-filter | `tests/step8-operational-verification.test.mjs` | Kör separat |

### Manuell verifiering (Organisationsdelen)

| Område | Status |
|--------|--------|
| Revoke org-admin (UI + callable) | **Verifierad på iPhone** |
| Radera organisation (typed ID, callable, lista uppdateras) | **Verifierad på iPhone** |
| Tangentbord i raderingsmodal (`KeyboardAwareModal`) | **Verifierad på iPhone** |
| Android (samma flöden) | Rekommenderas vid behov; ingår inte i ovan |
| Full invite-kedja (Resend, allowlist, login) | Följ checklista punkt 1–3 ovan per miljö |
