# Master Prompt Library

A public library where anyone can submit AI "master prompts" with an image, and you (plus invited admins) approve or delete everything before it goes live.

## What visitors see

**Home / Prompts**
- Grid of approved prompt cards: image, prompt title, category badge, tags, like count.
- Search box, category filter, tag filter, sort by newest / most liked.
- Click a card to open the full prompt: large image, full prompt text, "Copy prompt" button, competitor page/channel links, tags, like and save buttons.

**Submit a prompt** (no account needed)
- Image upload — required.
- Prompt text — required. Title — required.
- Category — required, chosen from a fixed list.
- Tags — optional, free text.
- Competitor page/channel links — optional, add several.
- After submitting: "Thanks, your prompt is waiting for review."

**Links library**
- Public list of useful links with a title, the URL, a link-type label (tool, tutorial, dataset, community, etc.) and a note. Anyone can submit; approval required.

**Image library**
- Public gallery of reference images with a caption and category. Anyone can submit; approval required.

Likes are anonymous (counted per device). Saves are stored on the visitor's own device so no account is needed.

## Categories

Animal & Pets, Art & Animation, ASMR & Satisfying, Comedy & Entertainment, Dark Psychology, DIY & Crafts, Emotional & Inspirational, Fantasy & Sci-Fi, Finance & Business, Food & Cooking, Health & Fitness, Historical & Nostalgia, Horror, Kids & Family, Luxury & Lifestyle, Motivational, Nature & Wildlife, Science & Education, Sports & Action, Technology & AI, Travel, True Crime.

## Admin area

Sign-in page for admins only (email + password). Admins are invited from the admin panel; nobody can self-register into admin rights.

- **Pending queue** — one place showing pending prompts, links and images. Approve or reject each, with the image preview inline.
- **Manage** — search all published items, edit or delete any prompt, link, or image.
- **Admins** — invite a new admin by email, see the admin list, remove an admin.

## Things worth adding (my suggestions)

1. Approval queue counts in the admin header so nothing is missed.
2. A short "why rejected" note kept internally, so you remember the reason.
3. Basic spam protection on submissions: rate limit per visitor, image size/type limits, text length limits.
4. Duplicate detection warning when a submitted prompt text closely matches an existing one.
5. Per-item view counter so you can see what's popular beyond likes.
6. Copy button also on the card, not just the detail page.

Say if you want any of these dropped.

## Technical notes

- Lovable Cloud provides the database, image storage and admin authentication.
- Tables: `prompts`, `prompt_links` (competitor links), `links`, `images`, `tags`/`prompt_tags`, `likes`, `user_roles`. Every item carries a `status` of pending / approved / rejected.
- Roles live in a separate `user_roles` table checked by a security-definer function — never on a profile row.
- Row-level security: anonymous visitors can read only `status = 'approved'` rows and insert pending rows; only admins can update, approve, or delete. Public storage bucket for approved images with size/MIME limits.
- Submissions and admin actions go through server functions with Zod validation; admin actions verify the admin role server-side, not in the browser.
- Admin pages live behind an authenticated route group; the public site stays server-rendered for search engines with per-page titles and descriptions.
