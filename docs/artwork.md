# Bountera artwork

## Current Home scene — 2026-09-21

Home uses the user-supplied planet and space images, plus a transparent cutout of the supplied device:

- `assets/survey-sonde-cutout.png`: transparent cutout of Modular_survey_sonde_in_space_2K_20260921185421.jpeg, prepared with imagegen on 2026-09-21. The original is retained as `assets/survey-sonde.jpg`.
- `assets/frozen-planet.jpg`: Frozen_exoplanet_in_deep_space_2K_20260921190849.jpeg
- `assets/deep-space.jpg`: Distant_galaxy_cluster_in_space_2K_20260921191521.jpeg

CSS composes the probe over the starfield and clips the rotating planet to its upper cap. The starfield extends behind the header and reserved system area, ending with a soft fade at the original boundary above Claim. Layer order is space, planet, then probe. The probe PNG uses normal compositing, so the planet does not shine through its body. The planet diameter is 96% of the scene width (previously 132%); the original planet JPEG uses CSS blending. Rotation takes 90 seconds, or 360 seconds with reduced motion, and pauses while the page is hidden. The standalone package embeds all three images. The former orbital hero below is retained only as historical artwork; it is no longer displayed on Home.

Generated with the built-in `image_gen` tool on 2026-09-20. Reference: the user-provided orbital-probe screenshot. The original generated images remain intact; copies are included as application assets. No phone frame, hand or screenshot text is baked into the app.

## Orbital hero

File: `assets/orbital-hero.png`

Prompt:

Use case: product-mockup. Project asset: Bountera Telegram mining-game hero illustration. Input screenshot is a visual reference ONLY. Recreate the SAME orbital probe from the screenshot: large three-quarter view of a heavy silver graphite cuboid satellite, front-left black octagonal face surrounding a circular iris lens/shutter, detailed metallic aperture blades and dark glass optical lens, small turquoise cyan status LEDs, dark blue solar panel wings on both sides and a small solar panel on top, rear heatsink ridges and two short cylindrical thrusters. Earth with blue atmospheric curved horizon below, sparse tiny stars on nearly black background above. Same orientation and industrial realistic materials, match device silhouette as closely as possible. Device centered and fully inside frame, fills 85 percent width, at upper-middle. Earth at lower quarter. Portrait 4:5 composition with dark lower edge for an HTML button overlay. No phone, no hands, no interface, no lettering, no numbers, no logos, no text. Replace green light accents with turquoise cyan to match Bountera. Polished photorealistic 3D product render.

## Equipment atlas

File: `assets/node-catalog.png`. Four quadrants are displayed using CSS background positions.

Prompt:

Use case: product-mockup. Asset for Bountera DePIN mining game equipment catalog. Create one perfectly aligned 2 by 2 sprite atlas, four equal square quadrants, no gutters, no borders, no text or labels. Each quadrant has the exact same solid nearly black #131c22 background, each device fully inside its quadrant with generous 15% empty margins. Top left: small graphite ribbed relay computer with two antennas and cyan LED. Top right: silver rectangular storage server module with front row of four drives and cyan indicators. Bottom left: imposing GPU compute tower with three circular fans, vented metallic panels and soft cyan lighting. Bottom right: advanced orbital compute core, octagonal compact lens-faced silver graphite satellite with tiny folded solar panels and cyan LEDs. Consistent photoreal 3D product rendering, three-quarter view from above, brushed steel and graphite, subtle floor shadow, cyan accents only. No green, no glow clouds, no coins, no logo, no extra UI. The four panels will be displayed separately using CSS background-position. Square overall composition.
