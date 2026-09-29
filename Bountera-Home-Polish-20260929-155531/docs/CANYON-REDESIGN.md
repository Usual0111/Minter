# Canyon Home redesign

Source of truth: root `assets/`, `index.html`, `server/`. `public/` is rebuilt by `npm run build`; the legacy `dist/assets/` folder is not loaded by the app.

The 2026-09-29 reference is recreated with live HTML controls, a graphite palette,
a cyan circular Collect DATA button, four activity shortcuts and a gray selected
navigation tab. Balances, hash rate, tier and mining amounts use the existing
engine. The decorative arc is not a capacity indicator. First-reward ads retain
a fixed small offer slot below the ring. Galaxies, Soc Hub, Combo and Gifts remain
available from the DEPIN menu. Carrier/Station onboarding is preserved.

New imagery was generated with the built-in image_gen tool from the user's screenshot:
- `assets/canyon-world.png`: background without UI or device.
- `assets/canyon-probe.png`: silver survey device with alpha transparency.

Generation prompts:

Background: Create a production game background asset by editing the supplied
screenshot. Preserve the exact background scene from its upper half: dark deep
blue black starfield, small crescent moon at upper left, luminous blue pink galaxy
upper right, curved cyan horizon, warm taupe canyon mesas with deep blue chasms
and fine cyan data streams. Remove the large silver spacecraft entirely and
seamlessly reconstruct terrain and sky behind it. Remove all UI, text, headings,
balance, circle, buttons, navigation. Output only background scenery, landscape
4:3 composition, sky upper 45%, canyon landscape lower 55%. No spacecraft,
interface, lettering or frame. High fidelity to reference colors.

Device: Extract/recreate only the silver spacecraft in the screenshot as a
transparent-background production game sprite. Match its silhouette, camera
angle, proportions, materials, details and pose: broad rounded triangular
manta-shaped corporate survey drone, brushed satin silver upper shell, raised
tapered central ridge extending upper right, black underside/front lower left,
large circular blue-black sensor lens and small side sensors, thin icy-white LED
strips, tiny engraved technical marks. Complete silhouette with 5% transparent
padding. Points lower left, three-quarter view from above, width about 1.6 times
height. No canyon, sky, shadow rectangle, background or interface. Genuine alpha.

Checks: full economy/UI tests; 390×700 browser view, confirmed Claim, persistence,
Nodes navigation. Output: `outputs/Bountera.html`, with embedded artwork.
