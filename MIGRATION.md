# Moving this project to another GitHub account

Written 2026-08-23, while the site is live at
`https://seraph26.github.io/SportsDashboard/` with the worker at
`https://sportsdashboard.seraph0226.workers.dev`.

Pushing the code to a new account is the easy part. Four things break silently
if they are missed, and three of them fail in a way that looks like the site is
broken rather than misconfigured.

## 1. The worker's origin allowlist — this one breaks everything

`ALLOWED_ORIGINS` in `worker/src/index.js` names the exact origins allowed to
use the proxy:

    https://seraph26.github.io
    http://localhost:8777

A new account means a new origin — `https://<newuser>.github.io`. Until it is
added there, **every ESPN request 403s** and the site renders as a shell with no
data. The origin is the scheme and host only; the `/SportsDashboard` path is not
part of it, so a repo rename does not matter but an account rename does.

Add the new origin *before* switching the site over, and leave the old one in
place until the old site is retired — both can be allowed at once.

## 2. Cloudflare Workers Builds is connected to the old repository

The worker deploys from a Git connection made in the Cloudflare dashboard, not
from anything in this repo. Pushing to a new GitHub account does not move it:
the old repo keeps deploying the worker, and pushes to the new one deploy
nothing.

In the Cloudflare dashboard: Workers & Pages → the `sportsdashboard` worker →
Settings → Build, and repoint it at the new repository. Keep the settings that
are already there:

    Build command    (empty)
    Deploy command   npx wrangler deploy
    Root directory   /

If the Cloudflare account is also changing, the worker URL changes with it, and
then `WORKER_BASE` in `js/config.js` has to be updated to match. If only GitHub
changes, `WORKER_BASE` stays as it is.

## 3. GitHub Pages has to be enabled again

`.github/workflows/pages.yml` is committed and will run, but Pages itself is a
repository setting. On the new repo: Settings → Pages → Source → GitHub Actions.
Without it the workflow succeeds and nothing is served.

## 4. The git identity here is repo-local

This repository has `user.name` and `user.email` set locally, not globally:

```bash
git config user.name
git config user.email
```

They carry the old account's address. Set them to whatever the new account
should attribute commits to, or the new repo's history will point at the old
identity.

## Rollback while migrating

`WORKER_BASE = ""` in `js/config.js` makes the browser call ESPN directly and
skips the worker entirely. Everything except edge caching still works — including
news, which is why it was moved to ESPN. That is the fastest way to get a
working site up on a new account before the Cloudflare side is sorted out.

## What does not live in this repository

- **The field guide** — a published artifact on the Claude account, not on
  GitHub. It holds the full reconstruction, every measured ESPN quirk, and the
  build log. Moving GitHub accounts does not affect it, but moving Claude
  accounts would.
- **`Sports Dashboard_OG/`** — the scratch extraction of the USB zip, ignored on
  purpose. The committed copy is `legacy-nextjs/`, so nothing is lost.

## Local development after a move

`serve.ps1` hardcodes its root:

    $root = "C:\Users\<user>\Desktop\SportsDashboard"

Move the folder and the dev server serves the wrong directory, or nothing, with
no useful error. Update that line, and remember `http://localhost:8777` is
already in the worker's origin allowlist.
