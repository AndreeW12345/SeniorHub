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
3. **Route:** `/admin/platform` — skyddad av `SuperAdminGuard` (Firestore-verifierad roll).
4. **Skapa organisation:** `/admin/platform/create-organization` → callable **`createOrganization`**.
5. **Lista organisationer:** `/admin/platform/organizations`.
6. **Organisationsprofil:** `/admin/platform/organization/[organizationId]` — sparar via befintlig org-profil (Firestore direkt, superadmin tillåten i regler).
7. **Administratörer:** `/admin/platform/organization/[organizationId]/admins` — lista, inbjudan och ta bort org-admin.

Alla callable-anrop går via **`prepareCallableRequest`** (App Check + Functions-instans).

### Cloud Functions (callables) som SuperAdmin använder

| Callable | Syfte | Klient-service |
|----------|--------|----------------|
| `createOrganization` | Skapa `organizations/{id}` + slug | `src/services/super-admin/create-organization.ts` |
| `listOrganizationAdmins` | Lista `admins` med `organizationId` + `role == admin` | `src/services/super-admin/list-organization-admins.ts` |
| `inviteOrganizerAdmin` | Skapa/återanvänd Auth, skriv `admins/{uid}`, skicka lösenordslänk (Resend) | `src/services/super-admin/invite-organizer-admin.ts` |
| `revokeOrganizerAdmin` | Ta bort `admins/{uid}` för org-admin i angiven tenant (Auth-konto kvar) | `src/services/super-admin/revoke-organizer-admin.ts` |
| `deleteOrganization` | Radera tenant: org-admins, aktiviteter (+ underdokument), `organizations/{id}` (Auth kvar) | `src/services/super-admin/delete-organization.ts` |

**Säkerhetsgräns på servern:** `assertSuperAdmin` i varje callable ovan. Klienten skickar `organizationId` från **låst route**; manipulation av payload ska fortfarande nekas eller begränsas av servervalidering och org-existens.

**Revoke:** `revokeOrganizerAdmin` kräver `organizationId` + `targetAdminUid`. Servern tillåter endast mål med `role: admin` och matchande `organizationId`. Superadmin-konton, self-revoke och fel org nekas. Endast `admins/{uid}` raderas — Firebase Auth påverkas inte.

**Radera organisation:** `deleteOrganization` kräver `organizationId` + `confirmOrganizationId` (måste matcha exakt). `seniorhub` blockeras. Callable raderar org-admins (`role: admin`), alla aktiviteter för org (registrations, announcements, reminderDeliveries, sedan aktivitet), därefter `organizations/{id}`. Superadmin-`admins`-dokument rörs inte. Auth-konton rörs inte. Firestore-regler: `organizations` **delete** endast superadmin (produktflöde via callable).

**Deploy:** Callables måste vara deployade till projektet (region enligt `europeWest1CallableOptions`) innan UI fungerar i produktion. Detta dokument inkluderar ingen deploy.

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

### SuperAdmin → organisation → admins/inbjudan

- UI: `SuperAdminGuard`, routes under `src/app/admin/platform/**`, panel `super-admin-organization-admins-panel.tsx`.
- `organizationId` från route via `resolveSuperAdminOrganizationRouteId`; invite/list services tar `lockedOrganizationId`.

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

1. SuperAdmin: skapa org → redigera profil → lista admins → bjud in admin → (valfritt) ta bort org-admin med bekräftelse.
2. Ny admin: allowlist i klient + Functions, lösenord via mail, login, skapa aktivitet.
3. Andra admin samma org: separat invite, båda syns i `listOrganizationAdmins`.
4. Publik sida: öppna `/organizer/{slug}` för org.
5. Statistik: båda admins ser samma siffror för org.
6. `/bli-arrangor`: skicka testansökan (staging).

## Relaterade tester

| Scenario | Testfil |
|----------|---------|
| Flera admins samma org, filtrering annan org | `tests/list-organization-admins.test.mjs` |
| Ingen tyst flytt mellan org vid invite | `tests/invite-organizer-admin.test.mjs` |
| Revoke org-admin (policy, payload, self/superadmin nekas) | `tests/revoke-organizer-admin.test.mjs` |
| Radera organisation (policy, confirm, cascade-plan) | `tests/delete-organization.test.mjs` |
| SuperAdmin guard / org-admin nekas plattform | `tests/super-admin-access.test.mjs`, `tests/super-admin-organization-admins.test.mjs` |
| Org-admin kan inte byta aktivitetens org | `tests/firestore-rules.test.mjs` |
| Bli arrangör (ansökan) | `tests/firestore-rules.test.mjs` (`organizerApplications`) |
| Publik organizer-slug + statistik org-filter | `tests/step8-operational-verification.test.mjs` |
