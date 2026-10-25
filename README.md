# J Creative Studio — concept catalog and design brief builder

**Status:** Functional browser-based concept catalog, not a production store. This site previews three original design directions using CSS illustration (not licensed artwork, actual product photography or proven physical samples).

## Implemented
- Filterable concepts: Shattered Horizon, Cosmos Forge, Solar/Lunar Bloom
- Visual concept panels with distinct CSS illustrations
- Concept shortlisting stored on this device
- Editable production notes and downloadable Markdown creative brief
- Responsive, accessible keyboard-operated controls
- Zero-dependency business-logic unit tests

## Run
Serve this folder with `python -m http.server 8000` and open http://localhost:8000. Direct `file://` opening may be blocked by browser ES-module security. For phone access, enable a public static host when ready; a hosted deployment has not been verified. Tests: `node --test tests/*.test.mjs` (Node 22+).

## Reality check
No purchase/cart/payment flow exists; no print service, 3D printer, inventory, verified costs, sales, rights-clearance, or sample-quality validation is implied. No third-party brand logos or copyrighted anime assets are included.

## Next release milestone
Choose one concept and one physical medium, create the real production-ready art, check ownership and printable dimensions, order one proof, photograph it, calculate landed costs, then publish a genuine storefront **after** proof checks. Protect private design source and customer info in private storage.
