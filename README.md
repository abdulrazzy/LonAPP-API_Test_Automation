# LonApp API tests

Playwright TypeScript API suite for LonApp covering **Account**, **Business**, **Tenants**, and **Required Documents**.

## Setup

```bash
npm install
copy .env.example .env
```

Fill `.env` (never commit it):

| Variable | Purpose |
| --- | --- |
| `PLATFORM_ADMIN_EMAIL` | Platform admin login |
| `PLATFORM_ADMIN_PASSWORD` | Platform admin password |
| `GMAIL_CLIENT_ID` | Google OAuth client id |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token with Gmail read access |
| `GMAIL_REDIRECT_URI` | Defaults to `https://google.com` |

## Environments

| Script | Base URL |
| --- | --- |
| `npm run test:dev` | `https://api.dev.lon-app.mindsprings.io` |
| `npm run test:staging` | `https://api.lon-app.mindsprings.io` |

Filtered run:

```bash
npx playwright test tests/account --project=dev
```

Workers are set to `1` so tenant OTP polls stay serial.

## Allure report

Results are written to `allure-results/` on every Playwright run.

```bash
npm run test:staging
npm run allure:serve
```

Or generate a static report and open it:

```bash
npm run allure:report
```

## GitHub Actions

On every **push**, [`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml) runs three jobs against **staging** (manual `workflow_dispatch` can choose `dev` or `staging`):

1. **Run API tests** — Playwright + upload raw results / Playwright report  
2. **Generate Allure report** — build HTML, publish to **GitHub Pages**, keep artifact backup  
3. **Email stakeholders** — status summary + **clickable Allure report URL**  

Published report URL (also in the email): `https://abdulrazzy.github.io/LonAPP-API_Test_Automation/`  

**One-time setup** (needed so the link opens in a browser):  
**Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `/ (root)` → Save.**  
CI publishes the Allure HTML to the `gh-pages` branch on every run.

Add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Required |
| --- | --- |
| `PLATFORM_ADMIN_EMAIL` | Yes — CI fails fast if missing (most tests need it) |
| `PLATFORM_ADMIN_PASSWORD` | Yes — CI fails fast if missing |
| `SMTP_USER` | Yes — set to `razaqyaro@gmail.com` |
| `SMTP_PASSWORD` | Yes — Gmail App Password for that account (enter without spaces) |
| `GMAIL_CLIENT_ID` | Only if OTP tests are enabled |
| `GMAIL_CLIENT_SECRET` | Only if OTP tests are enabled |
| `GMAIL_REFRESH_TOKEN` | Only if OTP tests are enabled |
| `GMAIL_REDIRECT_URI` | Optional (defaults to `https://google.com`) |

After each run the workflow:

1. Publishes the Allure HTML report to GitHub Pages (same URL every time — latest run)
2. Uploads Playwright HTML / Allure artifacts as a backup
3. Emails stakeholders with a direct link to open the Allure report:
   - `jackie.botchway@gmail.com`
   - `boakye@gmail.com`
   - `wuudof@gmail.com`
   - `jayphadit@gmail.com`

## OTP mail (currently skipped)

OTP-dependent tests are skipped via `SKIP_OTP_TESTS` in [`src/config/flags.ts`](src/config/flags.ts). That includes tenant registration OTP, customer OTP endpoints, and any test that needs the `businessOwnerTenant` fixture (which registers via OTP).

Set `SKIP_OTP_TESTS` to `false` to re-enable. Tenant OTP uses `jayphadit@gmail.com` and [`src/mail/otp.ts`](src/mail/otp.ts).

## Scope notes

- Social login/register tests are **negative only** (missing or garbage tokens). No real Google/Facebook/Apple user tokens.
- Never change or reset the platform admin password.
- Test data is prefixed with `api-test-`. Tenant fixtures deactivate or delete created tenants when possible.
- Prefer **dev** for day-to-day runs; staging uses the same suite but creates real tenants there too.

## Layout

```
playwright.config.ts
src/
  client/api.ts
  auth/platformAdmin.ts
  mail/otp.ts
  data/
  fixtures/base.ts
tests/
  account/
  administration/   # platform-admin Administration API suite
  tenants/
  business/
  required-documents/
  security/
```

Administration tests run as the platform admin and cover departments, units, positions, channels, roles, accounts lists, platform services, and auth security.
