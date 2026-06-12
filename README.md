# danae-web

다나에 플레이리스트 — React PWA port of the Danae iOS app. A launcher and
player for one YouTube channel (UCs1M00zBz7AjeOE1rNfoLZQ): daily pick,
Surprise Me, sortable grid, quote + tracklist parsing, mini player, and an
EmailJS feedback sheet. Dark, Paperlogy-typeset, installable as a PWA.

## Stack

- React 18 + Vite
- Tailwind CSS
- YouTube Data API v3 + YouTube IFrame Player API
- PWA (manifest + service worker)

## Local development

```sh
npm install
cp .env.example .env   # then fill in the two keys below
npm run dev
```

`.env`:

| Variable | Where to get it |
|---|---|
| `VITE_YOUTUBE_API_KEY` | Google Cloud Console → APIs & Services → Credentials (YouTube Data API v3 enabled) |
| `VITE_EMAILJS_PUBLIC_KEY` | dashboard.emailjs.com → Account → General → Public Key |

In the EmailJS dashboard, **Allow EmailJS API for non-browser applications**
can stay OFF — this app sends requests from the browser. If the account
restricts requests to allowed origins, add the Vercel domain (and
`http://localhost:5173` for local dev) to the allowed origins list.

## Deploying to Vercel

1. Push this folder to GitHub (see below).
2. On [vercel.com](https://vercel.com), **Add New → Project** and import
   `JayPark56/danae-web`.
3. Vercel auto-detects Vite. Defaults are correct:
   - Build command: `vite build`
   - Output directory: `dist`
4. Under **Settings → Environment Variables**, add
   `VITE_YOUTUBE_API_KEY` and `VITE_EMAILJS_PUBLIC_KEY`.
5. **Restrict the API key before sharing the URL** — Vite inlines both keys
   into the public JS bundle, so they are visible to anyone once deployed.
   In Google Cloud Console → Credentials → the API key, set *Application
   restrictions* to **HTTP referrers** with your domains
   (`https://<project>.vercel.app/*` and any custom domain), and *API
   restrictions* to **YouTube Data API v3** only. The EmailJS public key is
   designed to be public.
6. Deploy. The PWA is installable from the deployed URL (Safari: 공유 →
   홈 화면에 추가).

## GitHub

```sh
git remote add origin https://github.com/JayPark56/danae-web.git
git push -u origin main
```

(Create the empty `danae-web` repository on GitHub first.)

## Structure

```
danae-web/
├── public/            # manifest.json, sw.js, icons
└── src/
    ├── components/    # VideoCard, MiniPlayer, TracklistRow, QuoteSection, FeedbackModal
    ├── pages/         # OnboardingPage, HomePage, PlayerPage
    ├── utils/         # youtubeService, descriptionParser, dailyPick, constants
    └── styles/        # fonts.css (Paperlogy @font-face), globals.css
```
