-- Dynamic Section Builder Schema & Migration
-- Supports dynamic adding, editing, hiding, restoring, reordering, and deleting sections per friend

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.birthday_sections (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  birthday_page_id TEXT NOT NULL REFERENCES public.birthday_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT birthday_sections_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS birthday_sections_page_order_idx ON public.birthday_sections (birthday_page_id, display_order);
CREATE INDEX IF NOT EXISTS birthday_sections_visible_idx ON public.birthday_sections (birthday_page_id, is_visible);
CREATE INDEX IF NOT EXISTS birthday_sections_page_slug_idx ON public.birthday_sections (birthday_page_id, slug);

ALTER TABLE public.birthday_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view visible sections" ON public.birthday_sections;
DROP POLICY IF EXISTS "Authenticated owner can manage all sections" ON public.birthday_sections;

CREATE POLICY "Public can view visible sections" ON public.birthday_sections FOR SELECT USING (
  is_visible = true AND EXISTS (
    SELECT 1 FROM public.birthday_pages page 
    WHERE page.id = birthday_sections.birthday_page_id AND page.is_published = true
  )
);

CREATE POLICY "Authenticated owner can manage all sections" ON public.birthday_sections FOR ALL TO authenticated 
USING (public.is_birthday_owner()) 
WITH CHECK (public.is_birthday_owner());

-- Backward-compatibility: Seed default sections for existing pages that do not yet have section records
DO $$
DECLARE
  page_record RECORD;
BEGIN
  FOR page_record IN SELECT id, recipient_name, intro_dedication, intro_message, intro_note, intro_photo_url FROM public.birthday_pages LOOP
    IF NOT EXISTS (SELECT 1 FROM public.birthday_sections WHERE birthday_page_id = page_record.id) THEN
      
      -- Chapter 1: Dedication
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-dedication-' || page_record.id,
        page_record.id,
        'dedication',
        'The Dedication',
        'A page dedicated to you',
        'intro',
        0,
        true,
        jsonb_build_object(
          'recipient_name', page_record.recipient_name,
          'dedication_title', COALESCE(NULLIF(page_record.intro_dedication, ''), 'A page dedicated to you'),
          'message', COALESCE(page_record.intro_message, ''),
          'note', COALESCE(page_record.intro_note, ''),
          'photo_url', COALESCE(page_record.intro_photo_url, '')
        )
      ) ON CONFLICT (id) DO NOTHING;

      -- Chapter 2: Photos
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-photos-' || page_record.id,
        page_record.id,
        'photos',
        'Photo Scrapbook',
        'Our Favourite Memories',
        'photos',
        1,
        true,
        jsonb_build_object('description', 'Click any photograph to step closer and relive the moment in full view.')
      ) ON CONFLICT (id) DO NOTHING;

      -- Chapter 3: Timeline
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-timeline-' || page_record.id,
        page_record.id,
        'timeline',
        'The Timeline',
        'Little Moments, Big Memories',
        'timeline',
        2,
        true,
        jsonb_build_object('description', 'From the very first hello to the adventures that defined us.')
      ) ON CONFLICT (id) DO NOTHING;

      -- Chapter 4: Videos
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-videos-' || page_record.id,
        page_record.id,
        'videos',
        'Moments in Motion',
        'Our little cinema reel',
        'videos',
        3,
        true,
        jsonb_build_object('description', 'Short clips, spontaneous laughter, and genuine living.')
      ) ON CONFLICT (id) DO NOTHING;

      -- Chapter 5: Wishes
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-wishes-' || page_record.id,
        page_record.id,
        'wishes',
        'Words From Your People',
        'Birthday notes and messages',
        'wishes',
        4,
        true,
        jsonb_build_object('description', 'Warm notes and birthday love gathered from friends and family.')
      ) ON CONFLICT (id) DO NOTHING;

      -- Chapter 6: Personal Letter
      INSERT INTO public.birthday_sections (id, birthday_page_id, section_type, title, subtitle, slug, display_order, is_visible, content)
      VALUES (
        'sec-letter-' || page_record.id,
        page_record.id,
        'letter',
        'Personal Letter',
        'A letter just for you',
        'letter',
        5,
        true,
        jsonb_build_object('description', 'From my heart to yours.')
      ) ON CONFLICT (id) DO NOTHING;

    END IF;
  END LOOP;
END $$;
