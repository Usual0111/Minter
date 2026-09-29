# Separate artwork layers and motion

Built-in image_gen used for two edits of assets/aurora-manta-scene.png:

1. assets/aurora-planet-layer.png
Prompt: Edit this game background: remove ONLY the silver spacecraft completely, reconstruct the planet terrain and atmosphere behind it. Keep the exact portrait framing, horizon position, planet geology, colors, sky, lighting and subtle scan projection below the former craft. No device remains, no text or UI. Output same portrait composition.

2. assets/aurora-device-layer.png (verified RGBA, corner alpha 0)
Prompt: Extract ONLY the silver manta-shaped spacecraft from this image as a clean transparent PNG sprite. Preserve its exact identity, orientation, white edge lights, camera, brushed silver top and black lower hull. Remove planet, sky, ground, scan beams and all background entirely. Tight landscape canvas around the spacecraft with 3% transparent padding. Actual alpha transparency, not black or checkerboard backdrop. Do not redesign or rotate the spacecraft.

Device layer persists outside Home main content across claims and session transitions. Its six-second transform-only animation moves from +2 to -4px with +/-0.35 degree roll. Active indicator uses a fixed 68% rounded arc rotating clockwise every 3.6 seconds, plus synchronized text opacity. Real elapsed progress stays in the segmented bar. Animations pause while hidden and respect reduced motion. Glass opacity lowered; reduced transparency and low-performance settings retain an unblurred translucent alternative.
