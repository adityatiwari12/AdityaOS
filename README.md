# AdityaOS — Aditya Tiwari's Portfolio

An interactive portfolio reimagined as a macOS-style desktop operating system ("AdityaOS"), built with Astro, React, and Tailwind CSS. It features draggable app windows, a dock and menu bar, and an **AI Copilot** that answers questions as Aditya — offline-first, with a cheap LLM fallback, behind a bypass-proof server-side auth gate and rate limiter.

> **📐 Full technical architecture:** see [`docs/CONTEXT.md`](docs/CONTEXT.md) — the deep dive on the OS kernel, the two-tier copilot, the server-side guard (auth/daily cap/burst), OAuth, and the Neon database.

Live: https://adityatiwari.work

## 🚀 Features

- Modern Stack: Astro 5 (SSR on Vercel), React 19, Tailwind CSS, Zustand, framer-motion
- macOS-style UI: boot sequence, dock, menu bar, draggable/resizable windows, tiling & fullscreen
- AI Copilot: **offline NLP engine first** (free), Groq `llama-3.1-8b-instant` fallback only on low confidence
- Bypass-proof limits: server-side auth gate after 3 prompts, 8/day cap, burst limit — keyed by a hash of IP+UA (not cookies)
- OAuth sign-in: Google + GitHub for the copilot gate
- Lead capture: contact form + copilot sign-ins stored in **Neon Postgres**
- Spotlight: fuzzy global search (Fuse.js); Mission Control window switcher (Ctrl/Cmd+↑ or F3)
- Modular configuration: edit content via files in `src/config/` (no code changes required)
- SEO: sitemap, Twitter cards, JSON-LD, canonical from `PUBLIC_SITE_URL`
- TypeScript first; Vercel-ready

## 🛠️ Tech Stack

- [Astro](https://astro.build/) — SSR web framework (`@astrojs/vercel`)
- [React](https://reactjs.org/) — UI islands
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Zustand](https://github.com/pmndrs/zustand) — window-manager state
- [Groq](https://groq.com/) — LLM fallback for the copilot
- [Neon](https://neon.tech/) — serverless Postgres (leads, copilot usage, verified identities)
- [Vercel](https://vercel.com/) — hosting/analytics

## 📦 Installation

1) Clone the repository

```bash
git clone https://github.com/adityatiwari12/portfolio
cd portfolio
```

2) Install dependencies

```bash
npm install
```

3) Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
# AI Copilot LLM tier (optional — the offline engine works without it)
GROQ_API_KEY=your_groq_api_key_here

# Database (Neon) — required for lead capture + server-side limits/auth
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# OAuth (copilot gate)
PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Guard secret — salts the IP+UA identity hash (falls back to DATABASE_URL)
APP_SECRET=generate_a_long_random_string

# Site
# PUBLIC_SITE_URL=https://your-domain.tld
```

4) Create the database tables (Neon)

With `DATABASE_URL` set in `.env`, run the one-off setup scripts:

```bash
node scripts/init-db.mjs        # leads table
node scripts/migrate-oauth.mjs  # provider/verified columns
node scripts/migrate-guard.mjs  # copilot_usage + copilot_identity tables
```

This creates `leads` (contact + copilot sign-ins), `copilot_usage` (per-identity daily + burst counters), and `copilot_identity` (verified visitors). See [`docs/CONTEXT.md` §10](docs/CONTEXT.md) for the schema.

5) Add your content

Configuration is modular under `src/config/`:

- `personal.ts` — Name, role, website, brief focus
- `social.ts` — GitHub, LinkedIn links
- `contact.ts` — Email, phone, Calendly
- `education.ts`, `experience.ts`, `skills.ts` — Main profile content
- `extracurricular.ts`, `competitions.ts` — Optional extras
- `projects.ts` — Portfolio projects (structure, screenshots, repo links)
- `apps.ts` — Resume and Spotify playlist IDs/URLs
- `site.ts` — SEO (title/description/keywords) and theme colors

All types are defined in `src/types` and aggregated as `userConfig` in `src/config/index.ts`.

6) (Optional) Generate project JSON from GitHub

See `util/github_repo_parser.py`. To reduce rate limiting, pass a token in the script (personal access token):

```python
def main():
    parser = GitHubRepoParser('ghp_YOUR_TOKEN_HERE')
```

## 🚀 Development

To start the development server:

```bash
npm run dev
```

This will start the development server at `http://localhost:4321`.

## 🏗️ Building for Production

To build the project for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Deploy to vercel:
```bash
npx vercel deploy --prod
```
or 
```bash
npx vercel deploy
```
and select the image from the vercel dashboard.

There is a bug with direct deployment from github, i can't seem to figure it out tbf, so for the time being use the above commands after running ```npm run build```.

Tips:
- In Vercel Project Settings → Environment Variables, set `PUBLIC_SITE_URL` (e.g., `https://your-domain.tld`) so canonical/OG links are correct.
- Set `DATABASE_URL` (Neon) and `APP_SECRET` so lead capture and the server-side copilot limits work.
- Set `GROQ_API_KEY` for the LLM fallback, and the OAuth envs (`PUBLIC_GOOGLE_CLIENT_ID`, `PUBLIC_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) for the copilot sign-in gate.

## 📁 Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── layouts/         # Astro/React layouts
│   ├── pages/           # Astro pages (includes API routes)
│   ├── styles/          # Global styles
│   ├── config/          # Modular user/site config (see files listed above)
│   ├── types/           # Shared TypeScript types
│   └── assets/          # Images and static assets
├── public/             # Public assets
├── .astro/             # Astro build files
├── util/               # Utility functions
└── astro.config.mjs    # Astro configuration
```

## 🔧 Configuration & Architecture

- `astro.config.mjs`: Astro config; `site` can be set via `PUBLIC_SITE_URL`
- `src/components/global/BaseHead.astro`: Central SEO (AstroSeo) + JSON-LD and OG defaults
- `src/config/*`: All user content and site/theme config
- `src/types`: Shared types for config and components
- `src/pages/api/copilot.ts`: **authoritative** copilot endpoint (server-side guard → offline engine → Groq LLM)
- `src/lib/copilotGuard.ts`: server-side auth gate, daily cap, and burst limit keyed by a hash of IP+UA
- `src/lib/copilot/`: offline NLP engine (intents, entities, knowledge base) — answers most prompts for free
- `src/lib/groqClient.ts`: centralized Groq call (model, token cap, retry, JSON parsing)
- `src/lib/db.ts` + `src/pages/api/{lead,contact}.ts`: lead capture to Neon Postgres
- `src/pages/api/auth/{google,github/callback}.ts`: Google + GitHub OAuth for the copilot gate
- `src/pages/api/weather.ts`: server-side IP geolocation + Open-Meteo (avoids client CORS)

State management:
- `src/stores/osStore.ts` (Zustand) is the window manager: open `windows`, boot state, wallpaper/weather, and `executeCopilotActions`.

Shortcuts:
- Cmd/Ctrl+K: Spotlight search
- ?: Shortcuts overlay
- Ctrl/Cmd+↑ or F3: Mission Control
- Cmd/Ctrl+C: Open Contact form

Accessibility:
- Menubar, dialog, tree, and toolbar semantics; keyboard activation for dock/menu; labelled controls; `aria-live` for terminal/messages.

SEO:
- `@astrolib/seo` provides meta, Twitter cards, openGraph with a safe fallback image; JSON-LD for WebSite and Person.

## 🚀 Deployment

The project is configured for deployment on Vercel.

1. Push to GitHub and connect the repo in Vercel
2. In Project Settings → Environment Variables set:
    - `PUBLIC_SITE_URL` = your production URL (e.g., https://your-domain.tld)
    - `DATABASE_URL` = your Neon connection string, `APP_SECRET` = long random string
    - `GROQ_API_KEY` = your Groq key (optional LLM fallback)
    - `PUBLIC_GOOGLE_CLIENT_ID`, `PUBLIC_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` = OAuth gate
3. Vercel will deploy automatically. If auto-deploy fails, use the CLI commands above.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by macOS terminal interface
- Built with modern web technologies
- Thanks to all contributors and maintainers of the open-source tools used in this project

## 📞 Contact

For questions or support, please open an issue on GitHub.

Data & security notes:
- The contact form and copilot sign-ins store leads in **Neon Postgres** via server-only API routes (`DATABASE_URL` is never exposed to the client).
- The AI Copilot's auth gate, daily cap (8/day), and burst limit are enforced **server-side** and keyed by a hash of IP+User-Agent — clearing cookies/localStorage or using incognito does not reset quota. See [`docs/CONTEXT.md` §8](docs/CONTEXT.md).

Built and maintained with ❤️ in Indore, India by Aditya Tiwari.

Based on an open-source macOS-style portfolio template (original concept by Johnny Culbreth; earlier fork by aabdoo23). Thanks to the upstream authors.
