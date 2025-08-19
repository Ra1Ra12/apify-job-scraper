// Reads sources.json (RSS + simple HTML) and posts NEW items to Trello
import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";
import cheerio from "cheerio";

const { TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID } = process.env;
if (!TRELLO_KEY || !TRELLO_TOKEN || !TRELLO_LIST_ID) {
  console.error("Missing Trello secrets"); process.exit(1);
}

const trello = axios.create({
  baseURL: "https://api.trello.com/1",
  params: { key: TRELLO_KEY, token: TRELLO_TOKEN },
  timeout: 30000
});

async function existingLinks() {
  const { data } = await trello.get(`/lists/${TRELLO_LIST_ID}/cards`, {
    params: { fields: "name,desc,id" }
  });
  const set = new Set();
  for (const c of data) (c.desc.match(/https?:\/\/\S+/g) || []).forEach(u => set.add(u));
  return set;
}

async function createCard({ title, link, date, summary }) {
  const name = (title || "Job").slice(0,180);
  const desc = [summary || "", "", link ? `🔗 ${link}` : "", date ? `🗓️ ${date}` : ""]
    .join("\n").trim();
  await trello.post("/cards", null, { params: { idList: TRELLO_LIST_ID, name, desc, pos:"top" }});
  console.log(`✅ Posted: ${name}`);
}

function matchFilter(text, filterArr) {
  if (!filterArr || filterArr.length === 0) return true;
  const t = (text || "").toLowerCase();
  return filterArr.some(f => t.includes(f.toLowerCase()));
}

async function handleRSS(url, filter, seen) {
  const parser = new Parser();
  const feed = await parser.parseURL(url);
  for (const it of feed.items || []) {
    const link = it.link || it.guid || "";
    if (!link || seen.has(link)) continue;
    if (!matchFilter(it.title, filter)) continue;
    await createCard({
      title: it.title,
      link,
      date: it.isoDate || it.pubDate || "",
      summary: it.contentSnippet || ""
    });
    seen.add(link);
  }
}

function absolutize(href, base) {
  if (!href) return "";
  try {
    if (href.startsWith("http")) return href;
    const u = new URL(base);
    return new URL(href, u.origin).toString();
  } catch { return href; }
}

async function handleHTML(cfg, filter, seen) {
  const { data: html } = await axios.get(cfg.url, { timeout: 30000 });
  const $ = cheerio.load(html);
  $(cfg.item).each(async (_, el) => {
    const $el = $(el);
    const title = cfg.title ? $el.find(cfg.title).first().text().trim() : $el.text().trim();
    let link = cfg.link ? $el.find(cfg.link).first().attr("href") : $el.attr("href");
    link = absolutize(link, cfg.url);
    const date = cfg.date ? $el.find(cfg.date).first().text().trim() : "";
    if (!title || !link) return;
    if (!matchFilter(title, filter)) return;
    if (seen.has(link)) return;
    await createCard({ title, link, date, summary: "" });
    seen.add(link);
  });
}

(async () => {
  const sources = JSON.parse(fs.readFileSync("sources.json","utf-8"));
  const seen = await existingLinks();
  for (const s of sources) {
    try {
      if (s.type === "rss") await handleRSS(s.url, s.filter, seen);
      else if (s.type === "html") await handleHTML(s, s.filter, seen);
      else console.log(`ℹ️ Unknown type: ${s.type}`);
    } catch (e) {
      console.error(`❌ Failed ${s.url}: ${e.message}`);
    }
  }
})();