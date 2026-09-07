# Move competitor links into a sidebar on the prompt detail page

## Goal
On the prompt detail page (`/prompts/$promptId`), show the "Competitor pages & channels" links in a dedicated sidebar alongside the prompt content instead of at the bottom, so visitors can reach them without scrolling.

## Current state (verified)
- `src/routes/prompts.$promptId.tsx` renders links in a bottom `<section>` (lines 148–167), only after the prompt text, image, tags, and like/save buttons.
- The page is a single-column `max-w-4xl` layout.
- Links come from `promptLinksQuery(promptId)` and already render with external-link icons.

## Change (single file: `src/routes/prompts.$promptId.tsx`)
1. Replace the single-column `<article>` with a two-column responsive grid:
   - Left/main column (wider): image, category/views/tags, title, master-prompt text box (with Copy button at top), like/save buttons.
   - Right sidebar (narrower, sticky on desktop): "Competitor pages & channels" heading + the link list, shown in a bordered card.
2. Layout breakpoints:
   - Desktop (`lg:`): two columns (`lg:grid-cols-[1fr_320px]`), sidebar `sticky top-24`.
   - Mobile/tablet: single column; sidebar appears right after the prompt text box (before like/save or after — keep it high so it's easy to reach).
3. Remove the old bottom `<section>` that listed the links.
4. When there are no links, hide the sidebar column entirely (no empty card).
5. Keep the existing link markup (external-link icon, `target="_blank"`, `rel="noopener noreferrer nofollow"`).

No database, API, or other route changes needed — `promptLinksQuery` already returns the data.

## Notes
- This is a content sidebar (sticky aside), not the shadcn app-navigation Sidebar component — simpler and appropriate for a detail page.
- Desktop max width may widen slightly (e.g. `max-w-5xl`) to give the sidebar room without squeezing the prompt text.
