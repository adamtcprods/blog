#!/usr/bin/env node
// Zero-dependency static blog builder.
// Reads content/posts/*.md -> writes public/index.html + public/posts/<slug>.html

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, "content/posts");
const PUBLIC_DIR = path.join(ROOT, "public");
const TEMPLATES_DIR = path.join(ROOT, "templates");

// ---------- tiny frontmatter parser ----------
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, fmBlock, body] = match;
  const data = {};
  fmBlock.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    data[key] = val;
  });
  return { data, body };
}

// ---------- tiny markdown -> html ----------
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inCode = false;
  let inList = false;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      html += `<p>${inline(para.join(" "))}</p>\n`;
      para = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushPara();
      if (!inCode) {
        html += "<pre><code>";
        inCode = true;
      } else {
        html += "</code></pre>\n";
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      html += line.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\n";
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flushPara();
      const level = line.match(/^(#{1,3})/)[1].length;
      html += `<h${level}>${inline(line.replace(/^#{1,3}\s/, ""))}</h${level}>\n`;
      continue;
    }
    if (/^-\s/.test(line)) {
      flushPara();
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }
      html += `<li>${inline(line.replace(/^-\s/, ""))}</li>\n`;
      continue;
    } else if (inList) {
      html += "</ul>\n";
      inList = false;
    }
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  if (inList) html += "</ul>\n";
  return html;
}

// ---------- helpers ----------
function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents/diacritics
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function shortId(dateStr, slug) {
  // deterministic short hex "log id", cosmetic only
  let hash = 0;
  const s = dateStr + slug;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).slice(0, 7);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------- load templates ----------
const layout = fs.readFileSync(path.join(TEMPLATES_DIR, "layout.html"), "utf8");
const postTpl = fs.readFileSync(path.join(TEMPLATES_DIR, "post.html"), "utf8");
const indexTpl = fs.readFileSync(path.join(TEMPLATES_DIR, "index.html"), "utf8");

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : ""));
}

// ---------- build ----------
function build() {
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(PUBLIC_DIR, "posts"), { recursive: true });

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || slugify(data.title || file.replace(/\.md$/, ""));
    const html = markdownToHtml(body);
    const tags = Array.isArray(data.tags) ? data.tags : [];
    return {
      title: data.title || slug,
      date: data.date || "",
      dateLabel: formatDate(data.date || ""),
      excerpt: data.excerpt || "",
      tags,
      tagsHtml: tags.map((t) => `<span class="tag">${t}</span>`).join(""),
      slug,
      id: shortId(data.date || "", slug),
      html,
    };
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // write each post page
  for (const post of posts) {
    const body = render(postTpl, {
      title: post.title,
      dateLabel: post.dateLabel,
      id: post.id,
      tagsHtml: post.tagsHtml,
      content: post.html,
    });
    const page = render(layout, {
      title: `${post.title} — Log`,
      body,
      base: "../",
    });
    fs.writeFileSync(path.join(PUBLIC_DIR, "posts", `${post.slug}.html`), page);
  }

  // write index
  const entriesHtml = posts
    .map(
      (p) => `
      <a class="entry" href="posts/${p.slug}.html">
        <div class="entry-id">${p.id}</div>
        <div class="entry-body">
          <div class="entry-meta"><time>${p.dateLabel}</time>${p.tagsHtml}</div>
          <h2 class="entry-title">${p.title}</h2>
          <p class="entry-excerpt">${p.excerpt}</p>
        </div>
      </a>`
    )
    .join("\n");

  const indexBody = render(indexTpl, { entries: entriesHtml });
  const indexPage = render(layout, { title: "Log", body: indexBody, base: "" });
  fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), indexPage);

  // copy static assets
  fs.copyFileSync(path.join(ROOT, "style.css"), path.join(PUBLIC_DIR, "style.css"));

  console.log(`Built ${posts.length} post(s) -> public/`);
}

build();
