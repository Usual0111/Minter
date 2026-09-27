# Bountera: restrained game UI motion

The 2026 direction used here combines tactile responses, clear action feedback and layered translucent surfaces. References are platform guidance, not a claim that every 2026 app uses the same style:

- [Apple: Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) — layered materials and accessibility adaptations.
- [Google: Material 3 Expressive](https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/) — natural, spring-like feedback and expressive motion.
- [web.dev: high-performance CSS animation](https://web.dev/articles/animations-guide) — prefer transform/opacity; avoid unnecessary layers.

## Implementation

- Buttons press to 96.5% scale; release in 160 ms. Navigation settles in 240 ms. Page changes fade/translate over 220 ms.
- Dialog opening: 230 ms; closing: 120 ms. Existing-dialog content switches use a 130 ms fade. No animated blur, layout morphing or particle emitter.
- CR confirmation: one short-lived floating amount, only after a successful mutation. Balance counts to the confirmed integer-cents target over 550 ms.
- DATA and equivalent CR interpolate toward the latest known amount in 145 ms, without predicting future earnings. Tabular digits hold the number width. DATA is truncated to four decimal places; the balance keeps its existing precision.
- A shared requestAnimationFrame loop updates counters at most roughly 30 times/second. DOM text changes only when its formatted value changes. It does not recompute the economy, add server polling, or run when there are no pending counters. Counter motion is suppressed while a dialog covers Home.
- All new motion respects Reduce Motion. Counters stop on document visibility changes; CSS scene animation is paused in the background. The permanent Claim shimmer was removed.
- Home refreshes replace the header, controls and navigation while leaving the planet DOM attached. Claim no longer recreates its CSS animation.
- Dialog bounds start at least 10 px below the DePIN header, include the app's system inset and visual viewport, and leave 16 px at the bottom. Long dialogs scroll internally, with a sticky close/title row. Bounds update on viewport/keyboard resize.
- Galaxy selector and status use the same gray-blue glass, inset edge and restrained cyan details as the header and action dock.

## Validation and limits

Regression checks cover planet-container preservation after Claim, numerical interpolation, no overshoot, background/reduced-motion behavior and dialog bounds. Existing economy tests remain unchanged in behavior. At 390×844, the seasonal dialog was measured at y=162.4, below the header ending at y=152.4, and ended at y=828.

The preview browser currently reports reduced motion, so its screenshots show static end states. Animation scheduling and counter progression were additionally checked with a controlled clock. No FPS or battery measurements on a physical iPhone/Android were performed; zero performance cost cannot be guaranteed. New effects introduce no animation library, canvas, WebGL, or extra image assets.

Files: `assets/motion.js`, `assets/app.js`, `assets/home-ui.js`, `assets/app.css`.

## Claim card and confirmed reward feedback

Home keeps a 48 px footer inside the Collect DATA card. The first-reward offer,
ad cooldown, welcome-boost countdown and idle hint use this same reserved row.
The old standalone collected-DATA-reserve link is no longer rendered on Home;
the underlying DATA balance and exchange accounting are unchanged.

The CTA uses the active tier accent. Its ready state breathes with one opacity
animation; an unavailable claim does not pulse. A confirmed Home claim uses the
operation's `collected` DATA amount for the floating label, six short-lived
particles and lens/exhaust flashes. The device pulses to 103% using the separate
scale property, preserving its idle transform. The confirmed CR balance counts
up and briefly pulses. Failed/pending requests show no claim reward effects.
Effects finish in 220–760 ms and clean up on completion, reduced-motion changes
or app hiding. Planet DOM remains mounted through claims.

Checks: Home offer/cooldown/boost/idle rendering, exact confirmed feedback,
particle bounds/cleanup, reduced motion/background behavior and the existing
mining/economy tests. Browser checks compare activity-dock geometry across
first claim and rewarded-ad completion, including a narrow mobile viewport.
