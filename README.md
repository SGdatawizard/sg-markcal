# 📅 Campaign Flow — Marketing Calendar Planner

A fully client-side marketing calendar app. Plan, drag, and manage campaign activities across channels and team members — no backend required.

## Features

- **Drag-to-move** activities across dates and channels
- **Resize** activity blocks by dragging left/right edges
- **Channels** — add, rename, reorder, recolour, and remove channels
- **Team members** — track owners and workload at a glance
- **Activity drawer** — edit title, channel, owner, dates, status, priority, category, notes, and attachments
- **Recurring activities** — weekly or monthly repeats when creating
- **Filters** — search by title/owner, filter by category and tier
- **Infinite scroll** — scroll left/right to navigate through time
- **Undo** — up to 30 steps
- **Persistent** — all data saved to `localStorage`; works offline

## Getting Started

No build step needed. Just open `index.html` in a browser:

```bash
# Option 1 — open directly
open index.html

# Option 2 — serve locally (avoids any file:// quirks)
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploying

Because it's a single HTML file with no dependencies, it can be hosted anywhere:

- **GitHub Pages** — push to a repo, enable Pages, done
- **Netlify / Vercel** — drag-and-drop the file or connect the repo
- **Any static host** — upload `index.html`

> ⚠️ Data is stored in the browser's `localStorage`. Each device/browser has its own data. For shared team use, a backend or cloud sync layer would be needed.

## Customising

| What | Where in `index.html` |
|---|---|
| Categories | `ACTIVITY_CATEGORIES` array |
| Tiers | `ACTIVITY_TIERS` array |
| Statuses | `STATUS_OPTIONS` array |
| Default channel colours | `CHANNEL_COLOURS` array |
| Default view width (days) | `VIEW_DAYS` constant |
| Day column width (px) | `DAY_WIDTH` constant |

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.

## License

MIT — free to use, modify, and distribute.
