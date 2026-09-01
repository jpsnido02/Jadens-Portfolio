# Portfolio

A standalone React + Vite port of the Framer `PortfolioScroll` code component.
The Framer-only pieces (`addPropertyControls`, `RenderTarget`,
`useIsStaticRenderer`) are gone; everything that was a Framer property control is
now a typed prop with a default in `src/PortfolioScroll.tsx`.

## Run it

```bash
npm run dev      # http://localhost:5175
npm run build    # typecheck + production build into dist/
npm run preview  # serve the built site
```

## Editing content

Everything you'd normally change lives in `src/content.ts` — the intro
(`headline`, `tagline`, `status`), the links, and the project list. Artwork goes
in `public/projects/` and is referenced as `/projects/<file>`. A project can use
a video instead of an image with `mediaType: "video"` and `videoUrl`.

Link icons are inferred from the label and URL (mail, linkedin, twitter, x,
instagram, github, dribbble, behance, or a globe). Set `icon: "github"` on a
link to force one. Brand marks are the official single-path glyphs from
Simple Icons, in `src/icons.tsx`.

`statusLogo: "rokt"` renders the Rokt wordmark at the end of the status line
instead of the word. It is filled with `currentColor`, so it follows the theme.
Drop the field for plain text.

The placeholder gradients and the `example.com` links are stand-ins; swap them
before publishing.

## Theming

`src/theme.ts` holds the light and dark palettes; `src/App.tsx` owns the theme
state, renders the toggle, and passes the palette down. The initial theme comes
from `prefers-color-scheme` and the choice persists in `localStorage`.

The dark card colours are the light pastels taken to a near-black surface at the
same hue, so the four cards stay distinguishable against the dark page:

| | light | dark |
| --- | --- | --- |
| mint | `#DDF7E5` | `#182D1E` |
| butter | `#FFF1B8` | `#302B18` |
| powder | `#DCEBFF` | `#1B2634` |
| blush | `#FDE2E8` | `#321B20` |

## Interaction

One scroller drives both columns: the hero media and the card track always move
together, whichever one you scroll over. Wheel, touch drag, and arrow /
page-up-down / space keys all feed the same position, which eases to the nearest
project when it settles.

## Tuning

Layout constants sit in `CONFIG` at the top of `src/PortfolioScroll.tsx`:
card pitch, how far the far gaps tighten, the unfocused-card opacity lift, the
hover headroom, and the corner shape. Motion props (`scrollSpeed`, `lerpFactor`,
`snapDuration`, `maxVelocity`, `bufferSize`, `imageScale`) and colours are props
on the component, set in `src/main.tsx`.

Card and thumbnail radii are concentric: the thumbnail radius is the card radius
minus the card padding, and both use `superellipse(1.6)` (Chromium 139+; other
browsers fall back to a plain rounded corner).

Type is Plus Jakarta Sans from Google Fonts (400/500/700/800), loaded in
`index.html`. The intro sets 800 — the heaviest weight the family ships.
