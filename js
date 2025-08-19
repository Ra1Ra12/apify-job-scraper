import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";

const { TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID } = process.env;
if (!TRELLO_KEY || !TRELLO_TOKEN || !TRELLO_LIST_ID) { console.error("Missing Trello secrets."); process.exit(1); }

const parser = new Parser();
const trello = axios.create({ baseURL: "https://api.trello.com/1", params: { key: TRELLO_KEY, token: TRELLO_TOKEN } });

const feeds = fs.readFileSync("feeds.txt","utf-8").split("\n").map(s=>s.trim()).filter(Boolean);

async function existingLinks() {
  const { data } = await trello.get(`/lists/${TRELLO_LIST_ID}/cards`, { params:{ fields:"name,desc,id" }});
  const set = new Set();
  for (const c of data) (c.desc.match(/https?:\/\/\S+/g) || []).forEach(u => set.add(u));
  return set;
}

async function createCard(item) {
  const name = (item.title || "Job").slice(0,180);
  const link = item.link || item.guid || "";
  const when = item.isoDate || item.pubDate || "";
  const desc = [item.contentSnippet || "", "", link ? `🔗 ${link}` : "", when ? `🗓️ ${when}` : ""].join("\n").trim();
  await trello.post("/cards", null, { params: { idList: TRELLO_LIST_ID, name, desc, pos:"top" }});
  console.log(`✅ Posted: ${name}`);
}

(async () => {
  const seen = await existingLinks();
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      for (const it of (feed.items || [])) {
        const link = it.link || it.guid;
        if (!link || seen.has(link)) continue;
        await createCard(it);
        seen.add(link);
      }
    } catch (e) {
      console.error(`❌ Failed ${url}:`, e.message);
    }
  }
})();