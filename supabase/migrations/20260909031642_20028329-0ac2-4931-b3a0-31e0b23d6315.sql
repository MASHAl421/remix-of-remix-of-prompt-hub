ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can view approved prompts" ON public.prompts;
CREATE POLICY "Anyone can view approved public prompts"
ON public.prompts FOR SELECT TO public
USING (status = 'approved'::item_status AND is_premium = false);

DROP POLICY IF EXISTS "Anyone can submit prompts" ON public.prompts;
CREATE POLICY "Anyone can submit prompts"
ON public.prompts FOR INSERT TO public
WITH CHECK (status = 'pending'::item_status AND rejection_note IS NULL AND likes_count = 0 AND views_count = 0 AND is_premium = false);

DROP POLICY IF EXISTS "Anyone can view links of approved prompts" ON public.prompt_links;
CREATE POLICY "Anyone can view links of approved prompts"
ON public.prompt_links FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_links.prompt_id AND p.status = 'approved'::item_status AND p.is_premium = false));