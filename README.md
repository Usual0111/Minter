# Bountera — Node Hub prototype

The app uses the supplied black/graphite/green palette. The main CR balance and Home's next bonus stay white. Navigation: Home → Node → Tasks → Friends → Wallet. Home remains an outline icon.

## Open the prototype

Open index.html after extracting the ZIP, or open the standalone Bountera.html. All Node features work in the offline demo, with browser storage. The device image is embedded in the single HTML; no external assets or libraries are needed. Farm-Zone-Bot.html remains a compatibility copy.

For persistent server demo accounts, install Node.js 24+ and run npm start from the extracted project. Open http://127.0.0.1:4173. No npm dependencies are required. State, ledger and request records are stored in .data/bountera.sqlite. Keep that directory across restarts. File and HTTP previews use separate storage; server demo identity uses a browser cookie.

## Node mechanics

Node Hub replaces the old timed Farm screen. A new demo node starts with Bandwidth 3, Storage 2, CPU 1, GPU locked, four simulated active friends, a five-day streak and a three-quarter-full buffer. This does not change the existing main CR balance.

- Base income: 1.5 CR/hour. Resources, demand, region, uptime, certification, streak and traffic boosts modify the rate.
- Buffer: four hours of regular income; eight hours after expansion. Income stops at capacity. When temporary capacity expires, already buffered income is retained.
- Collection moves whole integer cents into the existing CR balance and History. Sub-cent remainder stays buffered. Each collection is a node ping. Accumulation resumes automatically.
- Seven consecutive UTC days with qualifying pings at ≥90% uptime unlock ×1.5. Missing a full day drops uptime to 60% and clears the streak. A normal collection does not bypass restoration. A rewarded preview or 10 CR restores 90% and starts a new qualifying streak.
- Upgrades spend CR, with increasing costs and Lv.5 caps. GPU unlocks at Node Lv.10 or five active invited friends and contributes up to +50% of base income.
- Every five confirmed Home ads adds one percentage point of stability that day. The third confirmed task of a day gives +10% income for 24 hours. Replayed confirmations do not count again.
- The user plus four active friends gives +15% region income. Ten active invited friends gives +25% and the regional pool preview. The Friends screen can simulate arrivals.
- Node level sets Wallet queue priority. New demo withdrawal requests retain the node tier and a processing estimate.

Farm rewarded previews take three seconds and require explicit completion. Closing early gives nothing. They do not increment Home ad progress. The combined cap is ten rewarded Farm ads per UTC day:

| Reward | Rule |
|---|---|
| Traffic Package | ×2 income for 30 minutes; every 3 hours; 4/day |
| Buffer expansion | 8 hours of capacity for 24 hours; once/day |
| Uptime recovery | Available below 90%; restores 90% |
| Instant Harvest | Below 50% buffer; +10%; once/hour |
| Double collection | ×2 collected amount; 2/day |
| Network Overload | +50% on next collection; two daily 10-minute windows; at most 2/day |

Collection bonuses multiply if combined. These are editable demo defaults where exact rules were unspecified.

Open Node → Demo controls to advance node-only time by 1 hour, 4 hours, 1 day or 2 days; add an active friend; trigger an overload; or set network demand from 0.7× to 1.3×. Home and Wallet clocks do not move with this control.

## Implementation and limits

assets/app-config.js contains Node defaults. assets/node-engine.js implements exact accumulation, upgrade costs, reward eligibility and progression. Buffer arithmetic uses integer micro-CR and BigInt division/remainders; the shared balance remains integer cents. Accrual integrates boost, certification, day and capacity boundaries without a background job.

assets/node-ui.js contains the screen. assets/node.css follows the screenshot composition. assets/theme.css recolors all screens. The Home layout and existing motion code remain underneath the theme. Home animations work in file, static HTTP and server demo previews. Zero ad progress has no highlight. Hidden visual updates stop; Node respects reduced motion.

SQLite transactions, collection request IDs and a unique ledger index protect server demo credits. Offline HTML intentionally uses local time/storage and is not a secure source of real-money balances. Production APIs refuse Node demo actions until real integrations are connected. Existing Farm data/history are preserved as legacy data, but its old interface is not loaded.

Network logs, bandwidth, peers, region members, ad playback and withdrawal estimates are simulated. No real bandwidth, CPU or GPU is used. Push delivery, real ad callbacks, a funded shared regional pool, referrals from real users and blockchain transfers are not connected. The regional pool is an unlock preview, not an additional funded balance.

## Test and deploy

Run npm test for accounting, motion, authentication, persistence, legacy compatibility and Node tests. Node checks cover fractional display clocks, offline accrual/caps, exact collection, four concurrent SQLite retries, rollback, upgrades/GPU, rewarded ad cancellation/duplicates/limits, boost and buffer expiry, streak loss/restoration, Home/Tasks links and demo controls.

For GitHub upload the extracted project contents. Exclude .env, .data, database files and credentials. Netlify: build command npm run build; publish directory public; Node 24. This publishes the complete interactive local demo. Persistent server accounts require a Node host with persistent disk, HTTPS and frontend/API at one origin.

The device image was generated with the built-in image generator using the imagegen skill. Asset and exact prompt: docs/node-artwork.md.

