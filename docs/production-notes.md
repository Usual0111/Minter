# Server and integration contract

## Accounting

server/store.cjs uses SQLite WAL and BEGIN IMMEDIATE transactions. Integer CR cents are authoritative on the server. Account state, ad confirmation, view count, separate base/bonus ledger rows, and saved request response are committed together. Unique indexes enforce one reward per source and one milestone per user/series/threshold. Repeated confirmations return the stored outcome; response state is read fresh so an old retry cannot overwrite newer progress.

All business time is server time. Browser time only presents countdowns. The production API never accepts client-set balances, reward amounts, ad confirmations, task approvals or demo administrator commands. A client may request an action, but only a verified provider callback confirms an ad or task. Unfinished or expired ads earn nothing. There is one active session per account. No ad starts automatically.

## Deployment

Use Node 24+, one persistent writable SQLite disk, a same-origin HTTPS reverse proxy, and backups. Configure .env from .env.example:

- BOUNTERA_MODE=production
- PUBLIC_ORIGIN=https://your-domain.example (exact origin, no trailing slash)
- TELEGRAM_BOT_TOKEN=your bot token
- AD_PROVIDER=your adapter identifier
- PROVIDER_CALLBACK_SECRET=a strong secret shared only by your trusted callback adapter
- DATABASE_PATH=an absolute path on persistent storage
- HOST and PORT as required by your host

Run npm start. The backend loads .env. Configure the HTTPS address in your Telegram bot. Telegram initData is verified with the WebAppData HMAC algorithm, a maximum age of one hour and duplicate-field rejection. The same Telegram ID restores the same account. Session cookies are HttpOnly, SameSite=Strict, and Secure on HTTPS. Mutations require exact Origin, a CSRF token and an Idempotency-Key. Secrets belong only in the server environment, never assets/app-config.js.

The built-in static server serves only index.html and whitelisted assets. The Netlify build exports only frontend assets; SQLite and server files must not be published as static files. Production mode does not turn missing external services into simulated success.

## Advertising adapter

assets/ad-provider.js exposes BounteraAds.register({ async show(session) { ... } }). Implement this using your advertising provider's SDK. Attach the server-issued session.id and authenticated account identifier to the provider's signed completion context. Resolving show() only means that display finished; it never grants CR. Rejections surface Try again. While awaiting confirmation, the UI polls saved server state and displays Checking….

Your trusted server adapter must validate the actual provider's signature, placement and paid completion criteria, then send POST /api/provider/callback. The bundled endpoint is an internal adapter contract, not a claimed integration with any named vendor. Never give its shared secret to a browser. Re-signing arbitrary client reports is not verification.

Ad JSON body:

    {"eventId":"provider-unique-event","userId":"telegram-1234","kind":"ad","sessionId":"ad-000002"}

Task JSON body:

    {"eventId":"provider-unique-task-event","userId":"telegram-1234","kind":"task","taskId":"community"}

Headers: X-Provider-Timestamp (Unix seconds or milliseconds), X-Provider-Signature (hex HMAC-SHA256 of timestamp + '.' + exact raw JSON body, using PROVIDER_CALLBACK_SECRET). Timestamps must be within five minutes. eventId is unique per provider and may be safely retried with a new timestamp/signature and the same JSON. Conflicting reuse is rejected. A second event for the same completed session/task returns the saved reward without paying again.

The provider adapter must bind the account, session, task and completion together. Configure tasks' actual links and verification before enabling real offers. Current task URLs are empty demo placeholders. The default confirmation timeout is 120 seconds; configure it to your provider's callback SLA. The default 3-second demo minimum is also applied to sessions; adjust for the selected provider before launch.

## API

- GET /api/bootstrap: mode, server time, authenticated account snapshot.
- POST /api/login: signed Telegram initData in production, fresh browser account in demo.
- GET /api/state: latest account state.
- POST /api/action: action and payload; mandatory Idempotency-Key and X-CSRF-Token.
- POST /api/provider/callback: trusted signed completion events.

Live actions: refresh, claimDaily, startAd, awaitAd, cancelAd, startTask. Demo-only actions include confirmAd, verifyTask, wallet/exchange simulation and administrator previews. Production wallet, payouts, promo campaigns, referral attribution and operational admin authorization are intentionally unconnected and rejected by the API. This delivery implements the attached direct-CR mechanism, not the earlier entire financial-platform specification.

## Migration and limitations

Version-2 snapshots retain energy and cycle verbatim plus a legacy archive; energy is never turned into credits. Existing task completion history remains completed. New ad series start independently of old energy cycles. Browser demo data is not trusted for production credit import. Same-origin browser storage is retained when opening the updated standalone demo; HTTP and file origins do not share storage.

The SQLite implementation targets a single persistent host. Add operational rate limiting, monitoring, backup recovery and a transactional shared database before scaling across hosts. Large production ledgers should be paginated and queried directly rather than returned as complete account JSON. Provider backpressure and arbitrary vendor-specific limits require that provider's adapter. Only the configured daily limit and cooldown are implemented here.

## Verification

Run npm test. Tests cover direct rewards, early closure, duplicate confirmation, callbacks before UI acknowledgement, 10/25/50 thresholds, repeat series, no date reset, independent provider limit, tasks/daily/promos not moving the ring, energy preservation, snapshots, restart, lost-response retry, transactional rollback and four concurrent SQLite connections. Production API tests cover Telegram identity restoration, invalid signatures, client credit rejection and signed callbacks. DOM template checks in the preparation workspace cover all routes but do not replace a visual browser review.

Reference protocols: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app and https://nodejs.org/api/sqlite.html.
