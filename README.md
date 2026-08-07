# Blog

A zero-dependency static blog. Write posts in Markdown, run one build script, get plain HTML/CSS — no framework, no build tool to configure.

## Write a post

Add a `.md` file to `content/posts/`:

```markdown
---
title: Your post title
date: 2026-08-07
tags: [tag1, tag2]
excerpt: One sentence shown on the index page.
---

Your post content in Markdown. Supports headers (# ## ###), **bold**,
*italic*, `inline code`, ```code blocks```, lists, and [links](url).
```

The filename doesn't matter — the URL slug comes from the title (or set `slug:` in the frontmatter yourself).

## Build

```bash
node build.js
```

This regenerates the whole `public/` folder from `content/posts/`. Nothing to install — pure Node, no dependencies.

## Preview locally

```bash
npm run serve
```

Builds the site and serves `public/` at a local URL (uses `npx serve`, only needed for local preview).

## Deploy to GitHub Pages (free)

1. Create a new GitHub repo and push this folder to it.
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. That's it. `.github/workflows/deploy.yml` is already set up — every push to `main` rebuilds the site and publishes `public/` automatically.

Your site will be live at `https://<username>.github.io/<repo-name>/`.

## Project structure

```
content/posts/     Markdown source for each post
templates/          HTML templates (layout, index, post) with {{placeholders}}
style.css           All styling — one file, CSS variables at the top for the palette
build.js            The whole build pipeline (frontmatter parse -> markdown -> HTML)
public/             Generated output (git-ignored is optional, or commit it — your call)
```

To change the palette or fonts, edit the `:root` variables at the top of `style.css`.
