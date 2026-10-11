# A Little Book of You

Source repository: https://github.com/abishek0109/B-day-website

Live website: https://abishek0109.github.io/B-day-website/

A scrapbook-inspired multi-person birthday website manager. The existing React/Vite memory-book interface keeps its warm paper textures, serif typography, Polaroid framing, washi tape, and pressed-flower decorations while the main URL acts as the protected owner dashboard for creating separate birthday websites.

## Run locally

Requires Node.js and npm.

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/`. The main route is the owner dashboard. Public birthday websites live at `/birthday/:slug`, for example `/birthday/ananya`. Owner editing and guest wish submissions remain disabled until Supabase is configured. There is no insecure local-password fallback.

## Features

- Owner dashboard at the existing main URL for creating, searching, publishing, previewing, copying, and deleting friend birthday websites.
- Unique public birthday website URLs under `/birthday/:slug`.
- One reusable eight-chapter birthday book template: cover, dedication, photo scrapbook, timeline, cinema, wishes, personal letter, and closing.
- Polaroid photo gallery with category filters and a keyboard-operable lightbox.
- Chronological timeline, video playback, approved birthday wishes, and an editable personal letter.
- Optional background music; the sound control is disabled until a URL is configured.
- Supabase-backed page-scoped content editing, publication status, media uploads, and wish moderation.
- Published/unpublished content separation and Row Level Security policies that scope public reads to the selected published birthday page.

## Supabase setup for owner management

The repository includes a Supabase client, local project configuration, and schema. To enable content management:

1. Create or use the existing Supabase project.
2. Run the migration files in [`supabase/migrations`](./supabase/migrations) in timestamp order. The multi-person upgrade is [`supabase/migrations/20261011143000_multi_person_birthday_platform.sql`](./supabase/migrations/20261011143000_multi_person_birthday_platform.sql). It creates `birthday_pages`, migrates existing one-person records into `legacy-birthday-page`, adds `birthday_page_id` scopes, updates RLS policies, and keeps existing content intact.

   GitHub Pages builds only the frontend; it does not apply Supabase migrations. For an existing project that has the initial schema but not the multi-person schema, run `20261011143000_multi_person_birthday_platform.sql` in the Supabase SQL Editor before using the owner dashboard. The migration assigns existing unscoped content to the legacy page and does not delete content.
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

6. Restart the development server, then visit `/` and sign in as that account. If a session was already active, sign out and back in so the refreshed JWT includes `app_metadata.role`.

Only the public Supabase anon/publishable key belongs in frontend configuration. Never use a Supabase service-role key in a `VITE_*` variable. The current storage bucket remains publicly readable, so only upload content intended to be public once its URL is shared.

## Deployment

The website is deployed to GitHub Pages by [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) whenever `main` or `version_2` is updated. Set the repository Actions variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings -> Secrets and variables -> Actions -> Variables** before deployment. The Pages build uses the `/B-day-website/` base path, and the included 404 fallback supports direct links and browser refreshes.

## Add a new birthday website

After Supabase setup, use the dashboard at `/`:

1. Create a friend website with the friend's name. A draft page and unique slug are generated.
2. Select that friend in the left panel.
3. Edit the slug, publication toggle, hero content, intro content, closing text, and optional audio.
4. Add photos, timeline stories, videos, approved wishes, and the personal letter in their tabs.
5. Preview with the Preview button. Draft/unpublished pages are visible to the owner in the dashboard but are not readable through public Supabase policies.
6. Publish the website and use Copy Link to share the `/birthday/:slug` URL.

Do not enter personal content until you are ready to publish it. Public pages intentionally show clear empty states instead of invented memories or substitute stock media.

## Validation

```powershell
npx.cmd tsc -b
npm.cmd run lint
npm.cmd run build
```

On this Windows machine, `npm.cmd run build` may fail before app bundling if the native Tailwind package `@tailwindcss/oxide-win32-x64-msvc` cannot be loaded. The GitHub Actions Pages build runs on Linux and should be used as the deployment verification source.
