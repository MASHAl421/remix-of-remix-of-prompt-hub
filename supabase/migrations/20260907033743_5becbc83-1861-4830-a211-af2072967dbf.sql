GRANT SELECT, INSERT ON public.prompts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;

GRANT SELECT, INSERT ON public.prompt_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_links TO authenticated;
GRANT ALL ON public.prompt_links TO service_role;

GRANT SELECT, INSERT ON public.links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links TO authenticated;
GRANT ALL ON public.links TO service_role;

GRANT SELECT, INSERT ON public.images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.images TO authenticated;
GRANT ALL ON public.images TO service_role;

GRANT SELECT, INSERT, DELETE ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;