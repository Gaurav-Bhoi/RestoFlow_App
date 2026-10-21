# Localization maintenance

`src/localization/locales/en.json` is the canonical English UI catalog. Every
screen uses `useTranslation()`; LanguageManager owns discovery, downloads,
i18next resources, AsyncStorage, saved preferences, failures and RTL changes.
English and complete manual Marathi are bundled. Other languages are discovered
from our Hono API; Argos takes precedence unless `forceBundled` is configured.

After adding an English key, call `t('namespace.key')` and run, in the backend:

```sh
npm run i18n:sync
npm run i18n:check
```

Use `-- --source /path/to/mobile` for a different checkout location. Commit both
the canonical catalog and generated backend export/mobile metadata together.

For a manual language, add its JSON and one entry in
`src/localization/config/bundledLanguages.ts` with native name/direction. For a
new Argos language, deploy its models on the selected server; no app allowlist
change is needed. Quality overrides and protected terms are configured in the
backend's `src/modules/i18n/translationPolicy.json`, then deployed.

Configure only our deployed Hono origins before a build:

```sh
RESTOFLOW_DEV_API_URL="$DEV_HONO_ORIGIN" \
RESTOFLOW_PROD_API_URL="$PROD_HONO_ORIGIN" npm run i18n:configure
```

API origins live in `.env.development` and `.env.production` and are pinned in
`config/environments.json`. Development uses
`https://restoflow-backend-dev.gauravbhoiofficial.workers.dev`; production uses
`https://restoflow-backend.gauravbhoiofficial.workers.dev`. Runtime and build
validation reject local origins, the other environment, and Preview URLs.
Native configuration selects the environment, including release bundles.
There is no mock mode or development fallback. Cache namespaces use native
environment plus API origin. Translation port 5000 remains server-side.

Never add a translation server URL or secret to this repository. Cached languages
start offline, missing keys fall back to English, and RTL changes request a normal
app restart after saving the selection. Restaurant data and printed invoices stay
unchanged. A newer server catalog is compatible with an older app release.
The client respects `no-store` even when it appears with other HTTP cache directives or different casing.
If the backend temporarily returns a previous valid catalog (`stale: true`),
LanguageManager preserves the existing disk bundle, displays a normal retry
message and tries for the current version again. A first-time fallback can render
in memory; stale/no-store responses never become valid persistent downloads.

Run `npm run typecheck`, `npm run lint`, and `npm test -- --runInBand`.
The app's existing print dependency requires the existing `--legacy-peer-deps`
installation convention; install using `npm ci --legacy-peer-deps`.
The infrastructure integration adds native dependencies. Run `npm run native:configure` and reinstall pods on macOS before using either iOS scheme.

Server installation, runtime API contract, deployment validation, health,
pre-generation, monitoring and rollback are documented in the backend's
`docs/I18N.md`. Remote production rollout remains gated on real DEV/PROD server
setup and Android/iOS acceptance checks.
