# Artist Commission Queue

A public queue page backed by Notion, served from a Cloudflare Worker (API)
and Cloudflare Pages (static frontend).

```
artist-queue/
├── worker/            Cloudflare Worker — talks to Notion, exposes a public API
│   ├── src/index.js
│   └── wrangler.toml
└── public/            Cloudflare Pages — the queue UI + commission form
    ├── index.html
    ├── style.css
    └── app.js
```

## How it fits together

- **Notion** is the source of truth. Each row in your database is one queue
  item. The page *body* (blocks) of each row is the "Description" — that's
  where you paste in text and images for a commission. The database
  *properties* hold the fields shown on the card itself.
- **Worker** reads the database for the public list, reads a page's blocks
  for the detail view, and writes a new page when someone submits the
  commission form (always with Status = Inbox).
- **Pages** is the static site people actually visit — it only ever talks to
  your Worker, never to Notion directly (so your Notion token never reaches
  a browser).

## 1. Notion setup

1. Create a database with these properties (names must match exactly, or
   edit the `PROPS` object at the top of `worker/src/index.js`):
   - `Customer Name` — **Title** type
   - `Order Name` — Text
   - `Notes` — Text
   - `Status` — Select, with at least an `Inbox` option (add others like
     `In Progress`, `Ready`, `Completed`, `Archived` as you like)
2. Create an integration at notion.so/my-integrations, copy its **Internal
   Integration Secret**.
3. Share your database with that integration (`···` menu → *Connect to* →
   your integration name).
4. Copy the database ID out of its URL:
   `notion.so/yourworkspace/<DATABASE_ID>?v=...`

By default the queue hides anything with Status `Archived` or `Declined` —
change `HIDDEN_STATUSES` in `worker/src/index.js` if you want different
rules.

## 2. Worker setup

From `worker/`:

```bash
npm install -g wrangler   # if you don't have it
wrangler login
wrangler secret put NOTION_TOKEN
wrangler secret put NOTION_DATABASE_ID
wrangler deploy
```

Note the `*.workers.dev` URL wrangler prints out (or your custom route if
you've set one up) — you'll need it in the next step. Once you know your
Pages URL, tighten CORS by setting `ALLOWED_ORIGIN` in `wrangler.toml` (or
as a var) to that exact origin instead of `*`.

## 3. Frontend setup

Open `public/app.js` and set `API_BASE` to your deployed Worker URL:

```js
const API_BASE = 'https://artist-queue-api.your-subdomain.workers.dev';
```

Then deploy `public/` to Cloudflare Pages (via the dashboard's "connect to
GitHub" flow, or `wrangler pages deploy public`).

## 4. Using it day to day

- **New commission requests** land in Notion automatically with
  `Status = Inbox` and the customer's message as the first paragraph of the
  page body. You'll fill in `Order Name` / adjust `Status` yourself once you
  triage it.
- **To add description content**, open the page in Notion and add
  paragraphs and images directly to the page body — they'll show up in the
  public detail view next time someone opens that card. Uploaded Notion
  images are served through short-lived signed URLs, which is why the
  detail endpoint always fetches fresh from Notion rather than caching.
- **To hide an item from the public queue**, set its Status to `Archived`
  (or add more statuses to `HIDDEN_STATUSES`).

## Notes / things worth knowing

- The commission form is intentionally text-only — customers can't upload
  images through it. If you ever want that, it needs separate file storage
  (e.g. Cloudflare R2) since the public form shouldn't write files straight
  into Notion; ask if you want that added later.
- There's a hidden honeypot field (`website`) on the form for basic bot
  filtering. Submissions that fill it in are silently dropped.
- The Worker never exposes your Notion token or database ID to the browser
  — only the Worker's own JSON responses are public.
- If you rename any Notion properties, update the `PROPS` object at the top
  of `worker/src/index.js` to match.
