# Separate scanner projection

Built-in image_gen edits:

assets/aurora-planet-clean.png
Prompt: Precise cleanup of this existing planet background. Remove ALL holographic scanner projection lines, grids, circular rings, cyan/white glowing dots and digital glyphs from the center of the planet. Reconstruct natural rocky terrain in their place. Preserve all other pixels/composition as closely as possible: same planet horizon position, peach atmosphere, teal basins, cratered taupe terrain, dark sky, lighting, portrait dimensions. No spacecraft, no scanner, no UI. Only natural planet and sky.

assets/aurora-scanner-hologram.png
Reference: user IMG_4713.JPG.
Prompt: Remove the white background from this exact cyan scanning cone hologram. Preserve its cone shape, top point, elliptical bottom rings, fine vertical rays, circular grid and cyan glowing dots. Produce true transparent alpha PNG. Also make dark interior fills transparent/translucent so terrain can show through the hologram: keep luminous cyan lines, but no opaque dark triangular body. No white halo, no solid background, no added objects. Full cone entirely inside canvas, small 2% padding. This is a subtle light projection sprite over a planet.

Home layers: clean planet background, hologram at 18% opacity with screen blend, craft above it, UI in front. Craft and projection share a persistent flight wrapper so their motion stays synchronized across session updates. PNG alpha verified. Reduced motion and hidden-tab pause retained.
