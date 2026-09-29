# DePIN glass redesign — 2026-09-21

Reference: Mobile_game_UI_UX_design_2K_20260921210928.jpeg supplied by the user. The phone frame and reference-only statistics cards are intentionally excluded.

Current Home assets:
- assets/depin-space.jpg: original Distant_galaxy_cluster_in_space_2K_20260921223753.jpeg.
- assets/depin-planet.jpg: original Exoplanet_in_space_2K_20260921212459.jpeg.
- assets/depin-probe.png: transparent extraction of Spherical_robotic_device_rendered_2K_20260921223050.jpeg, prepared using imagegen. The shell uses normal compositing, not screen blending.

Visual stack: full-screen starfield, large shaded planet offset to the right, orbital light trails, opaque probe, interaction controls. The planet rotates slowly; visual animations pause in the background. A reserved top area remains for phone / Telegram controls.

The shared header is now DEPIN MINING, live CR balance and profile. Back returns Home; pressing the title opens the menu, including the language selector. CR and DATA are the existing game units; the reference's fictional DPN balances are not inserted.

All six original side actions remain. Daily bonus, Mining boost, Seasonal missions and Seasonal shop are circular buttons in one glass dock. The original five navigation destinations and their behavior remain unchanged.

Verified in-browser: 390 x 844 and 320 x 640 layouts, separated scene layers, successful image loading, menu/language entry, boost dialog, seasonal missions and Nodes navigation. Standalone packaging embeds all current scene assets.

## Geometry refinement

The latest phone reference is measured inside its display, excluding the physical frame. The planet rim now sits approximately 11% of the screen width from the left and 15% of the screen height from the top. Its layer is anchored to the whole Home screen and may extend behind the header. Probe image width is 62% rather than 70%; its center is 53.5% across the scene and 58% down the hero. Existing header, side buttons, claim button, activity dock, navigation and game state are unchanged.

## Continuous backdrop and compact Claim

Removed the old vertical planet mask and the hero's bottom fade. The planet continues behind the Claim button and activity dock. Its fixed shadow is concentrated on the lower-right hemisphere, leaving the upper-right and lower-left limbs brighter. Claim width is 70% of the screen and its two decorative icons have been removed. Existing Claim validation and rewards are unchanged.
