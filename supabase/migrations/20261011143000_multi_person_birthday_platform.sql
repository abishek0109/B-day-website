-- Multi-person birthday website platform.
-- Preserves existing one-person records by assigning them to legacy-birthday-page.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.is_birthday_owner()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner';
$$;

CREATE TABLE IF NOT EXISTS public.birthday_pages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  owner_id UUID NOT NULL DEFAULT '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid,
  slug TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'A Little Book of You',
  subtitle TEXT NOT NULL DEFAULT 'For all the little moments that became our big memories.',
  hero_tagline TEXT NOT NULL DEFAULT 'A BIRTHDAY MEMORY BOOK',
  hero_note TEXT NOT NULL DEFAULT 'a little birthday something, just for you',
  hero_intro TEXT NOT NULL DEFAULT 'A little corner of the internet for photographs, stories, and birthday wishes.',
  hero_button_caption TEXT NOT NULL DEFAULT 'Turn the page when you are ready.',
  hero_photo_url TEXT NOT NULL DEFAULT '',
  hero_photo_caption TEXT NOT NULL DEFAULT '',
  hero_photo_date TEXT DEFAULT '',
  intro_dedication TEXT NOT NULL DEFAULT '',
  intro_message TEXT NOT NULL DEFAULT '',
  intro_photo_url TEXT NOT NULL DEFAULT '',
  intro_note TEXT NOT NULL DEFAULT '',
  closing_message TEXT NOT NULL DEFAULT 'Here''s to the memories still waiting to be made.',
  background_audio_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT birthday_pages_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS birthday_pages_slug_unique_idx ON public.birthday_pages (lower(slug));
CREATE INDEX IF NOT EXISTS birthday_pages_owner_idx ON public.birthday_pages (owner_id);
CREATE INDEX IF NOT EXISTS birthday_pages_published_idx ON public.birthday_pages (is_published);

INSERT INTO public.birthday_pages (
  id, slug, recipient_name, sender_name, title, subtitle, hero_tagline, hero_note,
  hero_intro, hero_button_caption, hero_photo_url, hero_photo_caption,
  hero_photo_date, intro_dedication, intro_message, intro_photo_url, intro_note,
  closing_message, background_audio_url, is_published
)
SELECT
  'legacy-birthday-page',
  'birthday-memory-book',
  COALESCE(NULLIF(recipient_name, ''), 'Birthday Friend'),
  COALESCE(sender_name, ''),
  title,
  subtitle,
  hero_tagline,
  hero_note,
  hero_intro,
  hero_button_caption,
  hero_photo_url,
  hero_photo_caption,
  hero_photo_date,
  intro_dedication,
  intro_message,
  intro_photo_url,
  intro_note,
  closing_message,
  background_audio_url,
  true
FROM public.site_settings
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.birthday_pages (id, slug, recipient_name, is_published)
SELECT 'legacy-birthday-page', 'birthday-memory-book', 'Birthday Friend', true
WHERE NOT EXISTS (SELECT 1 FROM public.birthday_pages WHERE id = 'legacy-birthday-page');

ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS birthday_page_id TEXT;
UPDATE public.photos SET birthday_page_id = 'legacy-birthday-page' WHERE birthday_page_id IS NULL;
ALTER TABLE public.photos ALTER COLUMN birthday_page_id SET NOT NULL;
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_birthday_page_fk;
ALTER TABLE public.photos ADD CONSTRAINT photos_birthday_page_fk FOREIGN KEY (birthday_page_id) REFERENCES public.birthday_pages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS photos_birthday_page_sort_idx ON public.photos (birthday_page_id, sort_order);

ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS birthday_page_id TEXT;
UPDATE public.memories SET birthday_page_id = 'legacy-birthday-page' WHERE birthday_page_id IS NULL;
ALTER TABLE public.memories ALTER COLUMN birthday_page_id SET NOT NULL;
ALTER TABLE public.memories DROP CONSTRAINT IF EXISTS memories_birthday_page_fk;
ALTER TABLE public.memories ADD CONSTRAINT memories_birthday_page_fk FOREIGN KEY (birthday_page_id) REFERENCES public.birthday_pages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS memories_birthday_page_sort_idx ON public.memories (birthday_page_id, sort_order);

ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS birthday_page_id TEXT;
UPDATE public.videos SET birthday_page_id = 'legacy-birthday-page' WHERE birthday_page_id IS NULL;
ALTER TABLE public.videos ALTER COLUMN birthday_page_id SET NOT NULL;
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_birthday_page_fk;
ALTER TABLE public.videos ADD CONSTRAINT videos_birthday_page_fk FOREIGN KEY (birthday_page_id) REFERENCES public.birthday_pages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS videos_birthday_page_sort_idx ON public.videos (birthday_page_id, sort_order);

ALTER TABLE public.birthday_wishes ADD COLUMN IF NOT EXISTS birthday_page_id TEXT;
UPDATE public.birthday_wishes SET birthday_page_id = 'legacy-birthday-page' WHERE birthday_page_id IS NULL;
ALTER TABLE public.birthday_wishes ALTER COLUMN birthday_page_id SET NOT NULL;
ALTER TABLE public.birthday_wishes DROP CONSTRAINT IF EXISTS birthday_wishes_birthday_page_fk;
ALTER TABLE public.birthday_wishes ADD CONSTRAINT birthday_wishes_birthday_page_fk FOREIGN KEY (birthday_page_id) REFERENCES public.birthday_pages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS birthday_wishes_birthday_page_status_idx ON public.birthday_wishes (birthday_page_id, status, created_at DESC);

ALTER TABLE public.personal_letter ADD COLUMN IF NOT EXISTS birthday_page_id TEXT;
UPDATE public.personal_letter SET birthday_page_id = 'legacy-birthday-page' WHERE birthday_page_id IS NULL;
ALTER TABLE public.personal_letter ALTER COLUMN birthday_page_id SET NOT NULL;
ALTER TABLE public.personal_letter DROP CONSTRAINT IF EXISTS personal_letter_birthday_page_fk;
ALTER TABLE public.personal_letter ADD CONSTRAINT personal_letter_birthday_page_fk FOREIGN KEY (birthday_page_id) REFERENCES public.birthday_pages(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS personal_letter_one_per_page_idx ON public.personal_letter (birthday_page_id);

ALTER TABLE public.birthday_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_letter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view birthday pages" ON public.birthday_pages;
DROP POLICY IF EXISTS "Authenticated owner can manage birthday pages" ON public.birthday_pages;
CREATE POLICY "Public can view birthday pages" ON public.birthday_pages FOR SELECT USING (is_published = true OR public.is_birthday_owner());
CREATE POLICY "Authenticated owner can manage birthday pages" ON public.birthday_pages FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view published photos" ON public.photos;
DROP POLICY IF EXISTS "Authenticated owner can manage all photos" ON public.photos;
CREATE POLICY "Public can view published photos" ON public.photos FOR SELECT USING (
  is_published = true AND EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = photos.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Authenticated owner can manage all photos" ON public.photos FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view published memories" ON public.memories;
DROP POLICY IF EXISTS "Authenticated owner can manage all memories" ON public.memories;
CREATE POLICY "Public can view published memories" ON public.memories FOR SELECT USING (
  is_published = true AND EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = memories.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Authenticated owner can manage all memories" ON public.memories FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated owner can manage all videos" ON public.videos;
CREATE POLICY "Public can view published videos" ON public.videos FOR SELECT USING (
  is_published = true AND EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = videos.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Authenticated owner can manage all videos" ON public.videos FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view approved wishes" ON public.birthday_wishes;
DROP POLICY IF EXISTS "Public can submit pending wishes" ON public.birthday_wishes;
DROP POLICY IF EXISTS "Authenticated owner can manage all wishes" ON public.birthday_wishes;
CREATE POLICY "Public can view approved wishes" ON public.birthday_wishes FOR SELECT USING (
  status = 'approved' AND EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = birthday_wishes.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Public can submit pending wishes" ON public.birthday_wishes FOR INSERT WITH CHECK (
  status = 'pending' AND EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = birthday_wishes.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Authenticated owner can manage all wishes" ON public.birthday_wishes FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view personal letter" ON public.personal_letter;
DROP POLICY IF EXISTS "Authenticated owner can update personal letter" ON public.personal_letter;
CREATE POLICY "Public can view personal letter" ON public.personal_letter FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.birthday_pages page WHERE page.id = personal_letter.birthday_page_id AND page.is_published = true)
);
CREATE POLICY "Authenticated owner can update personal letter" ON public.personal_letter FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated owner can update site settings" ON public.site_settings;
CREATE POLICY "Authenticated owner can update site settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_birthday_owner()) WITH CHECK (public.is_birthday_owner());

INSERT INTO storage.buckets (id, name, public) VALUES ('memories-media', 'memories-media', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner Media Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Media Modify Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Media Delete Access" ON storage.objects;
CREATE POLICY "Owner Media Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memories-media' AND public.is_birthday_owner());
CREATE POLICY "Owner Media Modify Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'memories-media' AND public.is_birthday_owner()) WITH CHECK (bucket_id = 'memories-media' AND public.is_birthday_owner());
CREATE POLICY "Owner Media Delete Access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memories-media' AND public.is_birthday_owner());
