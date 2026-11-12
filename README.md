# Jaden’s portfolio — gallery redesign

React + Vite portfolio with a two-column gallery, focused animated previews, and a case-study reader. Based on the original jpsnido02/Jadens-Portfolio source.

## Run locally

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite (port 5175 by default). `npm run build` runs TypeScript checking and creates the production build in dist/. The existing GitHub Pages deployment workflow and standalone case-study entries remain available.

## Edit the gallery

- `src/content.ts`: project list, artwork, links, and introduction link destinations. Adding projects creates more grid rows automatically; no placeholder work was added.
- `src/App.tsx`: gallery introduction, short card titles and summaries, navigation, reader state, and About content.
- `src/GalleryPreviews.tsx`: five gallery sequences: the original Uber phone flow with a close-up and App Store pullback, a second-shirt / unlock / third-shirt Macy’s sequence, the original agent script in a readable bento presentation with code typing, the full branded phone carousel and six partner logos on a fixed neutral gray backdrop, with dark progress fills, and a live builder with uncropped product imagery.
- `src/ProjectCover.tsx`: gallery previews and full prototype stages in the reader.
- `src/gallery.css`: layout, project-specific surfaces, neutral gray/white foundations, and personal tangerine/raspberry/violet accents, heavier typography, entrance/hover/reader transitions, responsive behavior, and reduced-motion handling.
- `src/caseStudies.ts` and `src/CaseStudyPage.tsx`: existing case-study content and rendering. The renderer also supports embedding in the new reader.

## Click-word interaction

The intro reads “I design things that click.” `src/ClickWord.tsx` and `src/click-word.css` implement a 3.8-second interaction. The underline uses three solid blocks of tangerine, raspberry, and violet and exits left over roughly 680ms with an ease-out. Letters begin filling after 160ms, hop individually as their color arrives, and land without a rotation or squash. The word grows 7.5% and gains a 0.5px stroke, holds, then resets left-to-right. A tiny finishing nudge replaces the stronger shake. The underline returns from the right as the letters settle back to their original size and weight. Keyboard activation works with the native button. Reduced-motion users receive a brief static color response.

## Offer handoffs

`src/UberOfferCard.tsx` retains the original four offer layouts inside one measured card. Each change uses a coordinated 156ms content exit, 351ms shell resize, and 273ms entrance. Copy, image, badge, and controls share one motion layer. The pager advances when the incoming offer starts entering, and button widths settle during the resize. The branded carousel keeps a fixed neutral gray background with charcoal logos and progress fills. The Uber gallery loop ends by fading the App Store screen to black within the original phone bezel (520ms), zooming back to the offer (900ms), resetting the Uber state behind black, and fading Uber Eats back in (700ms).

## Navigation and motion

Click a tile to open the reader; use the left rail to switch projects, All work / Close / Escape to return, or browser Back/Forward. Gallery links use `?project=<slug>` for reloadable, shareable reader state. Existing `/work/<slug>/` pages still work separately. Modified clicks can open a project in another tab.

Desktop shows two large gallery columns, with client and project context revealed inside each preview on hover or keyboard focus. Touch devices keep the bottom overlay visible. The reader has independent gallery-rail and article scrolling. Mobile uses one gallery column and a full-width reader. Focused previews autoplay in visible cards; the Motion control pauses them, and reduced-motion preferences are respected. Decorative pointer graphics and simulated mouse pointers have been removed. The native mouse cursor is unchanged.

## Content inherited from the original repository

Several case studies contain placeholder prose, +00% metrics, generic visuals, and references to missing project-01.jpg/project-05.jpg/project-06.jpg assets. Those claims were not rewritten or invented. Missing images now show a neutral “Visual coming soon” placeholder. The agent card now has its own design-operations case study and a task dashboard with Queue, Building, For review, and Complete. Task data is illustrative and interactions stay local to the browser.

## Status

The production source is deployed through the existing GitHub Pages workflow on pushes to `main`. `npm run build` validates TypeScript and creates all standalone case-study pages.

## Gallery framing refinements

The Uber and agent gallery modes reuse their original scripts. Client/project summaries appear in a dark bottom overlay on hover/focus, with no labels outside the media containers. Backdrops relate to each project’s imagery: lavender for Uber, blush for Macy’s, warm charcoal for the agent, fixed neutral gray for Branded Layouts, warm straw for the builder, yellow for McDonald’s, and periwinkle for Expedia. The original full case-study prototypes remain available in the reader.

## Personal interaction studies

`src/ConceptStudies.tsx` coordinates three original autoplay studies. Pantry Notes and Thought Atlas have dedicated components and styles; `src/useStudySequence.ts` manages their timed states and `src/brainNetwork.ts` supplies the graph geometry. `src/personalProjects.ts` supplies their gallery metadata and case-study text.

- Pantry Notes: a portrait app inside the original Uber phone artwork. Camera capture → loading → three recipe Post-its over matching ingredients → press cue → the selected yellow Post-it expands into a recipe modal → collapse back to the photo. The same note element animates its bounds, preserving its origin. The real Trader Joe’s haul photograph is credited to Sam / The Kitchn.
- Thought Atlas: six content-weighted regions contain 252 sample file nodes, over a faint 430-point brain silhouette. Selection highlights one region, then a 2.15× camera move reveals linked file cards and a technical note editor. Region area grows sublinearly with collection count, making larger collections both larger and denser.
- Build View: BB-8’s single black antenna tip from step 118. The real bare-rod before-view is paired with a recognizable full-droid view from page 87. One part slides into place; there is no invented connector or ground shadow. The step number is the only header; vector chevrons are centered in soft navigation buttons.

These are visual interaction concepts with sample data. The gallery and reader pause controls stop the loops. Offscreen gallery previews stop advancing; reduced-motion users get static frames. Asset sources, initial image-generation prompts, and references are documented in `public/projects/personal-study-credits.txt`. The initial brain and X-wing raster renders remain as unused exploration assets.

## Macy’s attention sequence

The gallery version holds context, presses the upper CTA, confirms the addition while the lower offer stays locked, reveals the lower offer, holds for reading, then adds the third shirt and holds the result. There is no progress bar or item counter. Pointer entry or keyboard focus restarts the gallery sequence. Each beat has its own duration in `MACYS_BEATS` in `src/GalleryPreviews.tsx`.

The Macy’s sequence includes a single opening button pulse and a measured demo cursor. Cubic and quadratic paths add curved approaches, small corrections, reading drifts and post-click retreats. Cursor targets are measured from the actual CTA bounds in scene coordinates. Cursor motion and the cue are hidden for reduced-motion preferences; the existing pause control pauses the sequence.

## Dashboard previews and site icons

The agent preview includes a task table, board, stage filters, search, feedback, and approval. Shoppable includes settings switches and a playable payment → loading → offer → confirmation journey. These are portfolio prototypes and do not control production systems or process payments. Thought Atlas opens a structured collection with aligned note cards, categories, and metadata.

Site navigation, social links, and dashboard controls use the official Font Awesome React packages. Icons within the original animated illustrations retain their existing artwork.
