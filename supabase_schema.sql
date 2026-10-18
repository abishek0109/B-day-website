-- =========================================================================
-- A LITTLE BOOK OF YOU — DIGITAL BIRTHDAY MEMORY BOOK
-- SUPABASE DATABASE SCHEMA, STORAGE CONFIGURATION & RLS SECURITY POLICIES
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- -------------------------------------------------------------------------

-- A. Site Settings & Landing Page Content
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    closing_message TEXT NOT NULL DEFAULT 'Here’s to the memories still waiting to be made.',
    background_audio_url TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings
    ADD COLUMN IF NOT EXISTS closing_message TEXT NOT NULL DEFAULT 'Here’s to the memories still waiting to be made.',
    ADD COLUMN IF NOT EXISTS background_audio_url TEXT NOT NULL DEFAULT '';

-- B. Photo Memories (Photo Scrapbook)
CREATE TABLE IF NOT EXISTS public.photos (
    id TEXT PRIMARY KEY,
    title TEXT,
    caption TEXT,
    image_url TEXT NOT NULL,
    date TEXT,
    location TEXT,
    category TEXT DEFAULT 'Little Moments',
    rotation NUMERIC DEFAULT 0,
    tape_style TEXT DEFAULT 'rose',
    sort_order INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Timeline Memories ("Little Moments, Big Memories")
CREATE TABLE IF NOT EXISTS public.memories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    story TEXT NOT NULL,
    location TEXT,
    image_url TEXT,
    tag TEXT,
    sort_order INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Video Memories ("Moments in Motion")
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT,
    date TEXT,
    sort_order INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Birthday Wishes ("Words From Your People")
CREATE TABLE IF NOT EXISTS public.birthday_wishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_name TEXT NOT NULL,
    relationship TEXT,
    message TEXT NOT NULL,
    photo_url TEXT,
    paper_color TEXT DEFAULT 'cream',
    rotation NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Personal Birthday Letter ("A Letter Just for You")
CREATE TABLE IF NOT EXISTS public.personal_letter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greeting TEXT NOT NULL DEFAULT '',
    paragraphs TEXT[] NOT NULL,
    sign_off TEXT NOT NULL DEFAULT '',
    sender_signature TEXT NOT NULL DEFAULT '',
    letter_date TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.personal_letter
    ALTER COLUMN greeting SET DEFAULT '',
    ALTER COLUMN sign_off SET DEFAULT '',
    ALTER COLUMN sender_signature SET DEFAULT '',
    ALTER COLUMN letter_date SET DEFAULT '';

-- G. Dynamic Birthday Sections (Section Builder)
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
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT birthday_sections_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS birthday_sections_page_order_idx ON public.birthday_sections (birthday_page_id, display_order);
CREATE INDEX IF NOT EXISTS birthday_sections_visible_idx ON public.birthday_sections (birthday_page_id, is_visible);
CREATE INDEX IF NOT EXISTS birthday_sections_page_slug_idx ON public.birthday_sections (birthday_page_id, slug);

-- -------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

-- Owner access is restricted to this Supabase Auth user ID and requires the
-- trusted app_metadata role. Never assign the role through user_metadata.
-- Keep this UUID in sync with OWNER_USER_ID in src/lib/authService.ts.
-- 5d237790-3b23-46b0-8941-3f3a41a5cd62

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_letter ENABLE ROW LEVEL SECURITY;
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

-- Site Settings Policies
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated owner can update site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" 
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated owner can update site settings" 
ON public.site_settings FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Photos Policies
DROP POLICY IF EXISTS "Public can view published photos" ON public.photos;
DROP POLICY IF EXISTS "Authenticated owner can manage all photos" ON public.photos;
CREATE POLICY "Public can view published photos" 
ON public.photos FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated owner can manage all photos" 
ON public.photos FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Memories Timeline Policies
DROP POLICY IF EXISTS "Public can view published memories" ON public.memories;
DROP POLICY IF EXISTS "Authenticated owner can manage all memories" ON public.memories;
CREATE POLICY "Public can view published memories" 
ON public.memories FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated owner can manage all memories" 
ON public.memories FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Videos Policies
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Authenticated owner can manage all videos" ON public.videos;
CREATE POLICY "Public can view published videos" 
ON public.videos FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated owner can manage all videos" 
ON public.videos FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Birthday Wishes Moderation Policies
-- Public can ONLY view approved wishes
DROP POLICY IF EXISTS "Public can view approved wishes" ON public.birthday_wishes;
DROP POLICY IF EXISTS "Public can submit pending wishes" ON public.birthday_wishes;
DROP POLICY IF EXISTS "Authenticated owner can manage all wishes" ON public.birthday_wishes;
CREATE POLICY "Public can view approved wishes" 
ON public.birthday_wishes FOR SELECT USING (status = 'approved');

-- Public can submit wishes, but status MUST BE 'pending'
CREATE POLICY "Public can submit pending wishes" 
ON public.birthday_wishes FOR INSERT WITH CHECK (status = 'pending');

-- Authenticated owner can view, approve, edit, and delete all wishes
CREATE POLICY "Authenticated owner can manage all wishes" 
ON public.birthday_wishes FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- Personal Letter Policies
DROP POLICY IF EXISTS "Public can view personal letter" ON public.personal_letter;
DROP POLICY IF EXISTS "Authenticated owner can update personal letter" ON public.personal_letter;
CREATE POLICY "Public can view personal letter" 
ON public.personal_letter FOR SELECT USING (true);

CREATE POLICY "Authenticated owner can update personal letter" 
ON public.personal_letter FOR ALL TO authenticated
USING (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- -------------------------------------------------------------------------
-- 4. STORAGE BUCKET CONFIGURATION
-- -------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) 
VALUES ('memories-media', 'memories-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public can view images/videos
DROP POLICY IF EXISTS "Public Media Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Media Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Media Modify Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Media Delete Access" ON storage.objects;
CREATE POLICY "Public Media Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories-media');

-- Storage RLS: Only authenticated owner can upload or delete media
CREATE POLICY "Owner Media Upload Access"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'memories-media'
    AND auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

CREATE POLICY "Owner Media Modify Access"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'memories-media'
    AND auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
)
WITH CHECK (
    bucket_id = 'memories-media'
    AND auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

CREATE POLICY "Owner Media Delete Access"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'memories-media'
    AND auth.uid() = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
);

-- -------------------------------------------------------------------------
-- 5. CONTENT
-- -------------------------------------------------------------------------
-- Personal names, memories, media, wishes, and letters are intentionally not
-- seeded. The application displays scrapbook-style empty states until the
-- owner adds real content.
