ALTER TABLE public.prompts DROP CONSTRAINT prompts_prompt_text_check;
ALTER TABLE public.prompts ADD CONSTRAINT prompts_prompt_text_check CHECK (char_length(prompt_text) >= 10);
ALTER TABLE public.links DROP CONSTRAINT links_note_check;
ALTER TABLE public.links ADD CONSTRAINT links_note_check CHECK (note IS NULL OR char_length(note) <= 20000);