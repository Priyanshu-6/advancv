# AdvanCV

A resume builder with a live A4 preview, five templates, PDF export, public share links, and AI help that tailors your resume to a specific job description.

MERN stack: React 19 + Vite + Tailwind CSS 4 on the front end, Express + MongoDB (Mongoose) on the back end, Google sign-in for auth, and Google Gemini for the AI features.

## What it does

You sign in with Google, create a resume, and fill in the form on the left while the right-hand pane renders a real A4 page that matches what will print. Everything autosaves about a second after you stop typing.

The AI features are opt-in per field rather than automatic. "Write for me" on the summary returns three options you pick from; "Improve" on an experience or project entry turns a rough description into bullet points. Nothing overwrites your text until you choose an option.

The job-match panel is the part most builders don't have. Paste a job posting and it returns a 0–100 match score, which of the posting's keywords you already cover and which you're missing, four to six suggested bullet points grounded in the experience you actually listed, a retargeted summary, and a short list of what to emphasise. Missing keywords are clickable — one tap adds them to your skills. Every prompt sent to Gemini forbids inventing employers, dates, credentials, metrics, or technologies that aren't in your input, so suggestions are rephrasings of your real history rather than fabrications.

PDF export uses the browser's own print pipeline instead of rasterising the page, so the resulting file has selectable text and parses correctly in applicant tracking systems.

Share links are off by default. Turning one on makes the resume readable at `/view/:id` without auth; turning it off breaks the link immediately.

## Requirements

- Node.js 20 or newer
- MongoDB — a local `mongod` or a free MongoDB Atlas cluster
- A Google OAuth client ID (free)
- A Google Gemini API key (free tier available)

## Setup

### 1. Install

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Then fill in `.env`:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/advancv` locally, or your Atlas connection string |
| `JWT_SECRET` | Required. Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` | From the Google Cloud console — see below |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `CLIENT_ORIGINS` | Comma-separated list of browser origins allowed to call the API |

`.env` is gitignored. Keep real keys out of commits.

The API boots without `GOOGLE_CLIENT_ID` or `GEMINI_API_KEY` — it just logs a warning and the affected routes return 503, with the UI showing why. Without `JWT_SECRET` nothing can sign in.

**Getting a Google client ID:** in the [Google Cloud console](https://console.cloud.google.com/apis/credentials) create an OAuth 2.0 Client ID of type "Web application", and add `http://localhost:5173` under *Authorised JavaScript origins*. You only need the client ID; the client secret isn't used, because sign-in happens through Google Identity Services in the browser and the resulting ID token is verified server-side.

### 3. Configure the client

```bash
cd client
cp .env.example .env
```

`VITE_API_URL` defaults to `http://localhost:5001`. Setting `VITE_GOOGLE_CLIENT_ID` is optional — the client fetches it from `GET /api/auth/config` at startup.

### 4. Run

Two terminals:

```bash
cd server && npm run dev    # http://localhost:5001
cd client && npm run dev    # http://localhost:5173
```

## Project layout

```
server/src
  config/       env parsing + feature flags, Mongo connection
  models/       User, Resume (schema mirrors the builder's form shape)
  controllers/  auth, resume CRUD, AI endpoints
  services/     Gemini REST calls, JWT signing
  middleware/   requireAuth, rate limiting, error translation
  routes/       /api/auth, /api/resumes, /api/ai

client/src
  pages/        Home, Login, Dashboard, ResumeBuilder, Preview, Layout
  components/
    builder/    ResumeForm, JobMatchPanel, SkillsEditor, AI popovers
    templates/  the five resume layouts + registry
    ui/         Button, Field, Modal, Spinner
  context/      AuthContext, ToastContext
  hooks/        useAutosave, useGoogleSignIn
  lib/          api client, pdfExport, resume helpers
```

## API

Auth uses a bearer JWT in the `Authorization` header.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Status and feature flags |
| GET | `/api/auth/config` | — | Client ID + which features are configured |
| POST | `/api/auth/google` | — | Exchange a Google ID token for a session |
| GET | `/api/auth/me` | ✓ | Restore the session |
| GET | `/api/resumes` | ✓ | List your resumes |
| POST | `/api/resumes` | ✓ | Create |
| GET/PATCH/DELETE | `/api/resumes/:id` | ✓ | Read, update, delete |
| POST | `/api/resumes/:id/duplicate` | ✓ | Copy |
| POST | `/api/resumes/:id/share` | ✓ | Toggle the public link |
| GET | `/api/resumes/public/:id` | — | Read a shared resume |
| POST | `/api/ai/summary` | ✓ | Three summary options |
| POST | `/api/ai/improve` | ✓ | Rewrite a description as bullets |
| POST | `/api/ai/skills` | ✓ | Suggest skills |
| POST | `/api/ai/match` | ✓ | Job-description analysis |

AI routes are rate limited to 15 requests per minute per user, everything else to 300.

## Security notes

Writes go through an explicit field allowlist, so a request can't reassign a resume to another account or overwrite server-managed fields by adding them to the body. Requesting a private resume through the public endpoint returns 404 rather than 403, so ids can't be probed. Contact details are stripped from resume data before it's sent to Gemini — the model doesn't need PII to write copy. The `accent_color` field is validated against a hex pattern before it reaches an inline style.

## Adding a template

Create a component in `client/src/components/templates/` that takes `{ resume, accent }`, register it in `templates/index.js`, and add its id to `TEMPLATE_IDS` in `server/src/models/Resume.js`. The server validates against that list, so both sides have to agree.

## Deploying

Build the client with `npm run build` in `client/` and serve `dist/` from any static host. Run the server with `npm start`. In production set `NODE_ENV=production` (this stops stack traces appearing in error responses), point `CLIENT_ORIGINS` and `CLIENT_URL` at your deployed frontend, and add that origin to the authorised origins on your Google OAuth client. Since the app uses client-side routing, configure your host to rewrite unknown paths to `index.html`, otherwise share links will 404 on refresh.
