-- roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TYPE public.item_status AS ENUM ('pending', 'approved', 'rejected');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- prompts
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  prompt_text text NOT NULL CHECK (char_length(prompt_text) BETWEEN 10 AND 12000),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 60),
  tags text[] NOT NULL DEFAULT '{}',
  image_path text NOT NULL,
  status public.item_status NOT NULL DEFAULT 'pending',
  rejection_note text,
  likes_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.prompts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can view approved prompts" ON public.prompts
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can view all prompts" ON public.prompts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit prompts" ON public.prompts
  FOR INSERT WITH CHECK (status = 'pending' AND rejection_note IS NULL AND likes_count = 0 AND views_count = 0);
CREATE POLICY "Admins can update prompts" ON public.prompts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete prompts" ON public.prompts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- competitor links on a prompt
CREATE TABLE public.prompt_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  label text,
  url text NOT NULL CHECK (char_length(url) BETWEEN 5 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.prompt_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_links TO authenticated;
GRANT ALL ON public.prompt_links TO service_role;
ALTER TABLE public.prompt_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view links of approved prompts" ON public.prompt_links
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.status = 'approved'));
CREATE POLICY "Admins can view all prompt links" ON public.prompt_links
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can add links to pending prompts" ON public.prompt_links
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.status = 'pending'));
CREATE POLICY "Admins can update prompt links" ON public.prompt_links
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete prompt links" ON public.prompt_links
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- links library
CREATE TABLE public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  url text NOT NULL CHECK (char_length(url) BETWEEN 5 AND 2000),
  link_type text NOT NULL CHECK (char_length(link_type) BETWEEN 2 AND 60),
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  status public.item_status NOT NULL DEFAULT 'pending',
  rejection_note text,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links TO authenticated;
GRANT ALL ON public.links TO service_role;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can view approved links" ON public.links
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can view all links" ON public.links
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit links" ON public.links
  FOR INSERT WITH CHECK (status = 'pending' AND rejection_note IS NULL AND likes_count = 0);
CREATE POLICY "Admins can update links" ON public.links
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete links" ON public.links
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- image library
CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caption text NOT NULL CHECK (char_length(caption) BETWEEN 2 AND 200),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 60),
  image_path text NOT NULL,
  status public.item_status NOT NULL DEFAULT 'pending',
  rejection_note text,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.images TO authenticated;
GRANT ALL ON public.images TO service_role;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER images_updated_at BEFORE UPDATE ON public.images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can view approved images" ON public.images
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can view all images" ON public.images
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit images" ON public.images
  FOR INSERT WITH CHECK (status = 'pending' AND rejection_note IS NULL AND likes_count = 0);
CREATE POLICY "Admins can update images" ON public.images
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete images" ON public.images
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- likes
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('prompt', 'link', 'image')),
  item_id uuid NOT NULL,
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 8 AND 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_type, item_id, visitor_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unlike" ON public.likes FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.sync_like_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN r := NEW; delta := 1; ELSE r := OLD; delta := -1; END IF;
  IF r.item_type = 'prompt' THEN
    UPDATE public.prompts SET likes_count = GREATEST(0, likes_count + delta) WHERE id = r.item_id;
  ELSIF r.item_type = 'link' THEN
    UPDATE public.links SET likes_count = GREATEST(0, likes_count + delta) WHERE id = r.item_id;
  ELSE
    UPDATE public.images SET likes_count = GREATEST(0, likes_count + delta) WHERE id = r.item_id;
  END IF;
  RETURN r;
END; $$;

CREATE TRIGGER likes_sync AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.sync_like_counts();

-- view counter
CREATE OR REPLACE FUNCTION public.increment_prompt_views(_prompt_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.prompts SET views_count = views_count + 1 WHERE id = _prompt_id AND status = 'approved';
$$;
GRANT EXECUTE ON FUNCTION public.increment_prompt_views(uuid) TO anon, authenticated;

CREATE INDEX prompts_status_created_idx ON public.prompts (status, created_at DESC);
CREATE INDEX prompts_category_idx ON public.prompts (category);
CREATE INDEX links_status_idx ON public.links (status, created_at DESC);
CREATE INDEX images_status_idx ON public.images (status, created_at DESC);