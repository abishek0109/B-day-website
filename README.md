# A Little Book of You

A scrapbook-inspired digital birthday memory book. The existing React/Vite interface keeps its warm paper textures, serif typography, Polaroid framing, washi tape, and pressed-flower decorations. Personal memories and media are intentionally left empty until the owner adds real content.

## Run locally

Requires Node.js and npm.

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/`. The public book is viewable without a backend, with empty states for content that has not been added. Owner editing and guest wish submissions remain disabled until Supabase is configured. There is no insecure local-password fallback.

## Features

- Eight linked chapters: cover, dedication, photo scrapbook, timeline, cinema, wishes, personal letter, and closing.
- Polaroid photo gallery with category filters and a keyboard-operable lightbox.
- Chronological timeline, video playback, approved birthday wishes, and an editable personal letter.
- Optional background music; the sound control is disabled until a URL is configured.
- Supabase-backed owner dashboard for editing content, managing publication status, and uploading media.
- Published/unpublished content separation and moderation for guest wishes.

## Supabase setup for owner management

The repository includes a Supabase client, local project configuration, and schema. To enable content management:

1. Create a Supabase project.
2. Run [`supabase_schema.sql`](./supabase_schema.sql) in the Supabase SQL Editor. It creates missing tables, updates the named RLS policies, and creates the `memories-media` storage bucket; it does not delete content or seed names, memories, photos, videos, wishes, or a letter.
3. Ensure the Supabase Auth account with UID `5d237790-3b23-46b0-8941-3f3a41a5cd62` exists.
4. In the SQL Editor, grant that account the trusted owner role. This statement changes only that user's trusted app metadata; it raises an error if the UID does not exist:

   ```sql
   DO $$
   BEGIN
     UPDATE auth.users
     SET raw_app_meta_data =
       COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
     WHERE id = '5d237790-3b23-46b0-8941-3f3a41a5cd62'::uuid;

     IF NOT FOUND THEN
       RAISE EXCEPTION 'Owner user UID does not exist in auth.users';
     END IF;
   END $$;
   ```

   Do not put this role in user-editable `user_metadata`. The frontend and database/storage RLS both require the trusted claim and exact UID.
5. Set `VITE_SUPABASE_URL` and the project's public anon/publishable key in `.env`:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

6. Restart the development server, then visit `/admin` and sign in as that account. If a session was already active, sign out and back in so the refreshed JWT includes `app_metadata.role`.

Only the public Supabase anon/publishable key belongs in frontend configuration. **Never** use a Supabase service-role key in a `VITE_*` variable. The schema makes uploaded media publicly readable, so only upload content intended to be public once its URL is shared.

## Add your content

After Supabase setup, use the dashboard:

- **Landing & Settings:** edit names, cover text/photo, dedication, closing message, and optional background-audio URL.
- **Photos:** upload real photos, add captions, dates, locations, and choose whether to publish.
- **Timeline:** add dated stories and optional photos.
- **Videos:** upload MP4/WebM/Ogg files or configure direct video, YouTube, or Vimeo URLs.
- **Wishes:** review, edit, approve, unpublish, or delete submissions. Pending wishes are not shown publicly.
- **Personal Letter:** edit the greeting, paragraphs, date, sign-off, and signature.

Do not enter personal content until you are ready to publish it. Public pages intentionally show clear empty states instead of invented memories or substitute stock media.

## Validation

```powershell
npm run build
npm run lint
```
