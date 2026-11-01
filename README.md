# KHAAKA — Architecture + Design

A full-stack website and CMS for a residential architecture studio. Next.js 15 (App Router) with TypeScript throughout, PostgreSQL with Prisma, Auth.js v5, Resend, Zod and Upstash.

The signature moment is the homepage hero. It is a **real-time 3D house** (Three.js), not a video or a stack of renders. The same building is drawn as a blueprint, laid out in colour, raised and cut open as an aerial axonometric, then roofed and lit at dusk at eye level, all scrubbed by scroll. One parametric model (`components/hero/house-data.ts`) drives the 3D scene, the blueprint, the zoomable plan viewer and every project image on the site.

> "KHAAKA" (Urdu خاکہ, *sketch / outline*) and all copy, people and contact details are placeholders. Change them in **/admin/settings**. Nothing is hard-coded.

---

## Quick start

```bash
cp .env.example .env            # then fill in DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate              # creates tables (prisma/migrations)
npm run db:seed                 # admin user, 7 projects, services, team, testimonials, journal
npm run dev                     # http://localhost:3000
```

**Admin:** http://localhost:3000/admin

| Role   | Email                 | Password         |
| ------ | --------------------- | ---------------- |
| Admin  | `admin@studio.local`  | `ChangeMe-2026!` |
| Editor | `editor@studio.local` | `Editor-2026!`   |

The admin login comes from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Change both before seeding production.

Local Postgres in one line (Docker):

```bash
docker run -d --name studio-db -e POSTGRES_USER=studio -e POSTGRES_PASSWORD=studio -e POSTGRES_DB=studio -p 5432:5432 postgres:16
```

## Environment variables

Every variable is documented in [`.env.example`](.env.example). Only `DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET` are required to run locally.

| Variable | Purpose | Without it |
| --- | --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Supabase pooled / direct, or Neon) | required |
| `AUTH_SECRET` | Signs admin sessions (`openssl rand -base64 32`) | required |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for emails, sitemap, OG, JSON-LD | `http://localhost:3000` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `STUDIO_NOTIFY_EMAIL` | Transactional email | Emails are printed to the server console |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Distributed rate limiting | In-memory limiter (one process only) |
| `STORAGE_DRIVER`, `SUPABASE_*` | `local` (disk) or `supabase` (Storage) | `local` |
| `NEXT_PUBLIC_HERO_FRAMES` | Use a pre-rendered image sequence for the hero | Real-time 3D hero |

## What's inside

```
app/
  (site)/            public pages: home, projects, projects/[slug], services, approach,
                     studio, journal, journal/[slug], contact, privacy, terms, 404
  admin/             login + dashboard (overview, enquiries, projects, services, team,
                     testimonials, journal, subscribers, settings, users), server actions
  api/               public REST + admin routes (upload, files, CSV export)
  render/            internal page used to render project imagery from the 3D model
  sitemap.ts robots.ts
components/
  hero/              3D scene (scene.ts), house model, blueprint/plan drawing, frame-sequence fallback
  home/              homepage sections
  site/              header, footer, preloader, cursor, Lenis, page transitions, scroll FX
  enquiry/           7-step enquiry overlay
  project/           before/after slider, plan viewer, next-project footer
  admin/             CMS components (Tiptap, dnd-kit, toasts, confirm dialogs, drawers)
lib/                 db, auth guard, zod schemas, settings, queries, storage, email, rate limit
emails/              React Email templates
prisma/              schema, migrations, seed
scripts/             render-stills.mjs (imagery), extract-frames.sh (video → hero frames)
```

### Front end
- **Hero:** pinned for 400vh of scroll (250vh on mobile). Four stages, each with its own camera, lighting and geometry timeline: an animated pen-drawn blueprint, a furnished colour plan, a cutaway aerial with the landscape growing in, and an eye-level dusk view where the roof drops into place and the windows glow (bloom). It has a subtle pointer parallax and a word-masked headline that changes at each stage. The stage tabs fill as you scroll and you can click them to jump. At the end the frame shrinks into a framed image as the page wipes from ink to paper.
  - Fallbacks: `prefers-reduced-motion` (no pin; the tabs switch stages instead), no WebGL (vector plan), and optionally an image sequence via `NEXT_PUBLIC_HERO_FRAMES`.
- Lenis smooth scroll synced to GSAP ScrollTrigger. All animations live in `gsap.context` and are reverted on every route change.
- A first-visit preloader draws the plan and counts 000 to 100, then splits open (stored in sessionStorage).
- Page transitions: an ink panel wipes up, the destination title flashes in mono, then the panel wipes away.
- A custom cursor that becomes VIEW, DRAG or NEXT over images, sliders and the next-project footer. The Enquire button is magnetic.
- Text reveals use line masks. The intro is a word-by-word scrub, the stats count up, images reveal with a clip-path wipe, and parallax stays at 15% or less.
- The header goes from transparent to solid, inverts over light sections, hides on scroll down, and becomes a full-screen menu on mobile (with focus trap).
- The projects index has filters, list and grid views, and a cursor-following preview with lerp lag (inline thumbnails on touch). `/projects` loads more as you scroll.
- Case studies have a sticky metadata sidebar, a figure gallery with drawing-sheet annotations, a before/after slider (drag or keyboard), a plan viewer (wheel, pinch, drag, buttons, keyboard) and a next-project footer you scroll into to navigate.

### Back end
- **Enquiries** (`POST /api/enquiries`): multipart form, Zod validation shared with the client, honeypot and minimum-time bot checks, and rate limiting (5 per hour per IP). Uploads are checked by magic bytes, not just extension (PDF, JPG, PNG, WebP, max 5 files of 10 MB each) and stored **privately**. Each enquiry gets a sequential reference (`ENQ-2026-0042`, safe under concurrent requests), and the client and studio both get an email.
- **Newsletter:** double opt-in with a token link, no account enumeration, rate-limited.
- **Admin auth:** Auth.js credentials with bcrypt (cost 12), JWT sessions, middleware on `/admin` and `/api/admin`, **plus** a server-side `requireUser(role)` in every server action and route. Logins are rate-limited per IP and email, with timing-equalised failures.
- **Roles:** editors can edit content and enquiries. Admins can also delete, change settings and manage users.
- **CMS:** drag-to-reorder for projects, images, services, team and testimonials. A Tiptap rich-text editor whose output is rendered through a whitelist renderer (no raw HTML is ever stored or injected). Multi-image upload with required alt text, which re-encodes images to WebP with sharp and strips metadata. Set-cover, featured and published toggles. Draft preview via Next draft mode. Optimistic UI, toasts and confirm dialogs.
- **Enquiries board:** status filters, search, a detail drawer with status changes and notes (`PATCH /api/enquiries/[id]`), private attachment downloads, and CSV export (with formula-injection escaping).
- **SEO:** a Metadata API entry on every page, a generated Open Graph image per project, `sitemap.xml`, `robots.txt`, and JSON-LD for Organization, LocalBusiness, CreativeWork and Article.

### Public API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/projects?type=&page=` | paginated, 12 per page |
| GET | `/api/projects/[slug]` | |
| GET | `/api/services` · `/api/team` · `/api/testimonials` · `/api/posts?limit=` | testimonials: approved only |
| POST | `/api/enquiries` | multipart; returns `{ reference }` |
| POST | `/api/newsletter` | `{ email }`, double opt-in |
| PATCH | `/api/enquiries/[id]` | staff only: `{ status?, notes? }` |
| GET | `/api/admin/enquiries/export?status=` | staff only, CSV |

## Imagery

Every project image in the seed was rendered from the house model:

```bash
npm run dev                               # terminal 1
npx playwright install chromium           # once
npm run render:stills                     # terminal 2, writes public/renders/*.jpg
RENDER_ONLY=lake-house-dusk npm run render:stills
```

Edit the `SHOTS` list in `scripts/render-stills.mjs` to add camera angles, times of day or house variants (roof, facade, ground, trees, pool). To use real photography, upload it in **/admin/projects**.

To use a pre-rendered hero video instead of the live 3D scene:

```bash
npm run frames -- hero.mp4      # → public/frames/0001.webp …
# then set NEXT_PUBLIC_HERO_FRAMES=<count> in .env
```

AI image prompts for generating that video are in the original brief (§11).

## Deploying to Vercel

1. Create a Postgres database (Supabase or Neon). Put the pooled URL in `DATABASE_URL` and the direct URL in `DIRECT_URL`.
2. Create two Supabase Storage buckets: `media` (public) and `enquiries` (private). Set `STORAGE_DRIVER=supabase`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Vercel's filesystem is read-only, so `local` storage will not work there.
3. Add `RESEND_API_KEY` (verify your sending domain), `EMAIL_FROM` and `STUDIO_NOTIFY_EMAIL`.
4. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
5. Set `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
6. Build command: `npm run build`. Run `npm run db:deploy && npm run db:seed` once against production, then change the admin password in **/admin/users**.

## Scripts

| Script | |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `typecheck` | `tsc --noEmit` |
| `db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma |
| `render:stills` | Render project imagery from the 3D model |
| `frames` | Video to WebP hero frames |
