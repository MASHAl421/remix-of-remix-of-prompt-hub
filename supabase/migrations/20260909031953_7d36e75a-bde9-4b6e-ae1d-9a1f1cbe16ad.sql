ALTER TABLE public.links ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.images ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- prompts: table readable only by admins; public reads go through masked view
DROP POLICY IF EXISTS "Anyone can view approved public prompts" ON public.prompts;
DROP POLICY IF EXISTS "Anyone can view approved prompts" ON public.prompts;

DROP POLICY IF EXISTS "Anyone can submit prompts" ON public.prompts;
CREATE POLICY "Anyone can submit prompts"
ON public.prompts FOR INSERT TO public
WITH CHECK (status = 'pending'::item_status AND rejection_note IS NULL AND likes_count = 0 AND views_count = 0 AND is_premium = false);

CREATE OR REPLACE VIEW public.public_prompts AS
SELECT id, title,
  CASE WHEN is_premium THEN '' ELSE prompt_text END AS prompt_text,
  category, tags, image_path, status, NULL::text AS rejection_note,
  likes_count, views_count, is_premium, created_at
FROM public.prompts
WHERE status = 'approved'::item_status;

GRANT SELECT ON public.public_prompts TO anon, authenticated;

-- prompt links of approved prompts: visible, url masked when the prompt is premium
DROP POLICY IF EXISTS "Anyone can view links of approved prompts" ON public.prompt_links;

CREATE OR REPLACE VIEW public.public_prompt_links AS
SELECT pl.id, pl.prompt_id, pl.label,
  CASE WHEN p.is_premium THEN '' ELSE pl.url END AS url,
  p.is_premium
FROM public.prompt_links pl
JOIN public.prompts p ON p.id = pl.prompt_id
WHERE p.status = 'approved'::item_status;

GRANT SELECT ON public.public_prompt_links TO anon, authenticated;

-- links: table readable only by admins; public reads go through masked view
DROP POLICY IF EXISTS "Anyone can view approved links" ON public.links;
DROP POLICY IF EXISTS "Anyone can submit links" ON public.links;
CREATE POLICY "Anyone can submit links"
ON public.links FOR INSERT TO public
WITH CHECK (status = 'pending'::item_status AND rejection_note IS NULL AND likes_count = 0 AND is_premium = false);

CREATE OR REPLACE VIEW public.public_links AS
SELECT id, title,
  CASE WHEN is_premium THEN '' ELSE url END AS url,
  link_type, note, status, NULL::text AS rejection_note, likes_count, is_premium, created_at
FROM public.links
WHERE status = 'approved'::item_status;

GRANT SELECT ON public.public_links TO anon, authenticated;

-- images stay publicly viewable; premium only limits the full-size view in the UI
DROP POLICY IF EXISTS "Anyone can submit images" ON public.images;
CREATE POLICY "Anyone can submit images"
ON public.images FOR INSERT TO public
WITH CHECK (status = 'pending'::item_status AND rejection_note IS NULL AND likes_count = 0 AND is_premium = false);