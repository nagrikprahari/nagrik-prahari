
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
  }
});

const MAX_AGE_HOURS = 24;
const MAX_AGE_MS = MAX_AGE_HOURS * 60 * 60 * 1000;

const SOURCES = [
  {
    name: "BBC Hindi",
    url: "https://feeds.bbci.co.uk/hindi/rss.xml"
  },
  {
    name: "Google News India",
    url: "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi"
  },
  {
    name: "ANI (Google News)",
    url: "https://news.google.com/rss/search?q=site%3Aaninews.in&hl=hi&gl=IN&ceid=IN:hi"
  },
  {
    name: "PIB Hindi",
    url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3&reg=3"
  },
  {
    name: "DD News",
    url: "https://ddnews.gov.in/rss-feeds/"
  },
  {
    name: "à¤–à¥‡à¤² à¤œà¤—à¤¤ (Google News)",
    url: "https://news.google.com/rss/search?q=%28cricket+OR+%E0%A4%95%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%87%E0%A4%9F+OR+%E0%A4%96%E0%A5%87%E0%A4%B2+OR+football+OR+%E0%A4%AB%E0%A5%81%E0%A4%9F%E0%A4%AC%E0%A5%89%E0%A4%B2+OR+%E0%A4%B9%E0%A5%89%E0%A4%95%E0%A5%80+OR+%E0%A4%B5%E0%A5%88%E0%A4%AD%E0%A4%B5+%E0%A4%B8%E0%A5%82%E0%A4%B0%E0%A5%8D%E0%A4%AF%E0%A4%B5%E0%A4%82%E0%A4%B6%E0%A5%80%29&hl=hi&gl=IN&ceid=IN:hi"
  },
  {
    name: "à¤«à¤¿à¤²à¥à¤®à¥€ à¤¦à¥à¤¨à¤¿à¤¯à¤¾ (Google News)",
    url: "https://news.google.com/rss/search?q=Bollywood+OR+film+OR+cinema+OR+entertainment+OR+actor+OR+actress+OR+movie&hl=hi&gl=IN&ceid=IN:hi"
  }
];

const DATA_FILE = path.join(
  __dirname,
  "../news-data/pending-news.json"
);

function isRecent(dateValue) {
  if (!dateValue) return false;

  const date = Date.parse(dateValue);

  if (!Number.isFinite(date)) return false;

  const age = Date.now() - date;

  return age >= -5 * 60 * 1000 && age <= MAX_AGE_MS;
}



function classifyCategory(title, description, sourceName) {
  const text = ((title || "") + " " + (description || "")).toLowerCase();
  const source = (sourceName || "").toLowerCase();

  // ANI à¤•à¤¾ à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯ à¤ªà¤°à¤¿à¤šà¤¯
  if (/asia's premier news agency|about us|à¤¹à¤®à¤¾à¤°à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚/.test(text)) {
    return "à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯";
  }

  // à¤¸à¥‹à¤¶à¤² à¤®à¥€à¤¡à¤¿à¤¯à¤¾ à¤¸à¥‡ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤–à¤¬à¤°à¥‡à¤‚
  if (/facebook|instagram|twitter|x\.com|social media|à¤¸à¥‹à¤¶à¤² à¤®à¥€à¤¡à¤¿à¤¯à¤¾/.test(source)) {
    return "à¤¸à¥‹à¤¶à¤² à¤®à¥€à¤¡à¤¿à¤¯à¤¾";
  }

  

  // à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿
  if (/à¤šà¥à¤¨à¤¾à¤µ|à¤²à¥‹à¤•à¤¸à¤­à¤¾|à¤µà¤¿à¤§à¤¾à¤¨à¤¸à¤­à¤¾|à¤¸à¤‚à¤¸à¤¦|à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿|à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿à¤•|à¤ªà¥à¤°à¤§à¤¾à¤¨à¤®à¤‚à¤¤à¥à¤°à¥€|à¤®à¥à¤–à¥à¤¯à¤®à¤‚à¤¤à¥à¤°à¥€|à¤®à¤‚à¤¤à¥à¤°à¥€|à¤µà¤¿à¤ªà¤•à¥à¤·|à¤­à¤¾à¤œà¤ªà¤¾|à¤•à¤¾à¤‚à¤—à¥à¤°à¥‡à¤¸|à¤¸à¤ªà¤¾|à¤°à¤¾à¤œà¤¦|à¤œà¤¦à¤¯à¥‚|à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿à¤• à¤¦à¤²|politics|election|bjp|congress/.test(text)) {
    return "à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿";
  }

  // à¤•à¤¾à¤¨à¥‚à¤¨
  if (/à¤…à¤¦à¤¾à¤²à¤¤|à¤¸à¥à¤ªà¥à¤°à¥€à¤® à¤•à¥‹à¤°à¥à¤Ÿ|à¤¹à¤¾à¤ˆ à¤•à¥‹à¤°à¥à¤Ÿ|à¤•à¤¾à¤¨à¥‚à¤¨|à¤¨à¥à¤¯à¤¾à¤¯à¤¾à¤²à¤¯|à¤«à¥ˆà¤¸à¤²à¤¾|à¤¸à¤‚à¤µà¤¿à¤§à¤¾à¤¨|à¤•à¥‹à¤°à¥à¤Ÿ|à¤µà¤•à¥€à¤²|à¤•à¤¾à¤¨à¥‚à¤¨à¥€|à¤œà¤®à¤¾à¤¨à¤¤|à¤¯à¤¾à¤šà¤¿à¤•à¤¾/.test(text)) {
    return "à¤•à¤¾à¤¨à¥‚à¤¨";
  }

  // à¤–à¥‡à¤²
  if (/à¤•à¥à¤°à¤¿à¤•à¥‡à¤Ÿ|à¤«à¥à¤Ÿà¤¬à¥‰à¤²|à¤¹à¥‰à¤•à¥€|à¤Ÿà¥‡à¤¨à¤¿à¤¸|à¤¬à¥ˆà¤¡à¤®à¤¿à¤‚à¤Ÿà¤¨|à¤µà¥ˆà¤­à¤µ à¤¸à¥‚à¤°à¥à¤¯à¤µà¤‚à¤¶à¥€|ipl|à¤†à¤ˆà¤ªà¥€à¤à¤²|à¤–à¤¿à¤²à¤¾à¤¡à¤¼à¥€|à¤µà¤¿à¤¶à¥à¤µ à¤•à¤ª|à¤•à¤¬à¤¡à¥à¤¡à¥€|olympics|football|cricket|sports|à¤®à¥ˆà¤š/.test(text)) {
    return "à¤–à¥‡à¤² à¤œà¤—à¤¤";
  }

  // à¤«à¤¿à¤²à¥à¤® à¤”à¤° à¤®à¤¨à¥‹à¤°à¤‚à¤œà¤¨
  if (/à¤¬à¥‰à¤²à¥€à¤µà¥à¤¡|à¤«à¤¿à¤²à¥à¤®|à¤¸à¤¿à¤¨à¥‡à¤®à¤¾|à¤®à¤¨à¥‹à¤°à¤‚à¤œà¤¨|à¤…à¤­à¤¿à¤¨à¥‡à¤¤à¤¾|à¤…à¤­à¤¿à¤¨à¥‡à¤¤à¥à¤°à¥€|à¤®à¥‚à¤µà¥€|à¤µà¥‡à¤¬ à¤¸à¥€à¤°à¥€à¤œ|à¤¹à¥‰à¤²à¥€à¤µà¥à¤¡|à¤Ÿà¥à¤°à¥‡à¤²à¤°|box office|bollywood|movie|à¤à¤•à¥à¤Ÿà¥à¤°à¥‡à¤¸|à¤à¤•à¥à¤Ÿà¤°/.test(text)) {
    return "à¤«à¤¿à¤²à¥à¤®à¥€ à¤¦à¥à¤¨à¤¿à¤¯à¤¾";
  }
// à¤µà¤¿à¤¦à¥‡à¤¶ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥€ à¤–à¤¬à¤°à¥‡à¤‚
  if (/à¤ªà¤¾à¤•à¤¿à¤¸à¥à¤¤à¤¾à¤¨|à¤šà¥€à¤¨|à¤¨à¥‡à¤ªà¤¾à¤²|à¤¬à¤¾à¤‚à¤—à¥à¤²à¤¾à¤¦à¥‡à¤¶|à¤°à¥‚à¤¸|à¤¬à¥à¤°à¤¿à¤Ÿà¥‡à¤¨|à¤‡à¤œà¤°à¤¾à¤¯à¤²|à¤ˆà¤°à¤¾à¤¨|à¤¯à¥‚à¤•à¥à¤°à¥‡à¤¨|à¤…à¤®à¥‡à¤°à¤¿à¤•à¤¾|à¤¸à¤Šà¤¦à¥€ à¤…à¤°à¤¬|à¤¯à¤®à¤¨|à¤µà¤¿à¤¦à¥‡à¤¶|à¤…à¤‚à¤¤à¤°à¤°à¤¾à¤·à¥à¤Ÿà¥à¤°à¥€à¤¯|world news|international/.test(text)) {
    return "à¤µà¤¿à¤¦à¥‡à¤¶";
  }
  // à¤¶à¤¿à¤•à¥à¤·à¤¾
  if (/à¤¶à¤¿à¤•à¥à¤·à¤¾|à¤ªà¤°à¥€à¤•à¥à¤·à¤¾|à¤¸à¥à¤•à¥‚à¤²|à¤•à¥‰à¤²à¥‡à¤œ|à¤µà¤¿à¤¶à¥à¤µà¤µà¤¿à¤¦à¥à¤¯à¤¾à¤²à¤¯|à¤¯à¥‚à¤¨à¤¿à¤µà¤°à¥à¤¸à¤¿à¤Ÿà¥€|à¤°à¤¿à¤œà¤²à¥à¤Ÿ|education/.test(text)) {
    return "à¤¶à¤¿à¤•à¥à¤·à¤¾";
  }

  // à¤¬à¤¾à¤•à¥€ à¤–à¤¬à¤°à¥‡à¤‚
  return "à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯";
}



async function fetchNews() {
  let existingNews = [];

  if (fs.existsSync(DATA_FILE)) {
    try {
      existingNews = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      if (!Array.isArray(existingNews)) {
        existingNews = [];
      }
    } catch {
      console.log("à¤ªà¥à¤°à¤¾à¤¨à¥€ JSON à¤«à¤¾à¤‡à¤² à¤ªà¤¢à¤¼à¤¨à¥‡ à¤®à¥‡à¤‚ à¤¸à¤®à¤¸à¥à¤¯à¤¾à¥¤");
      return;
    }
  }

  const recentExisting = existingNews
    .filter(item => isRecent(item.publishedAt))
    .map(item => ({
      ...item,
      category: item.category || classifyCategory(
        item.title,
        item.description,
        item.source || ""
      )
    }));

  const knownLinks = new Set(
    recentExisting.map(item => item.link)
  );

  const newNews = [];

  for (const source of SOURCES) {
    try {
      console.log("à¤¸à¥à¤°à¥‹à¤¤ à¤ªà¤¢à¤¼ à¤°à¤¹à¥‡ à¤¹à¥ˆà¤‚:", source.name);

      const feed = source.name === "DD News"
        ? await fetch(source.url, {
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "application/rss+xml, application/xml, text/xml, */*"
            }
          }).then(async response => {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return parser.parseString(await response.text());
          })
        : await parser.parseURL(source.url);

      let sourceCount = 0;

      for (const item of feed.items || []) {
        const link = item.link?.trim();
        const title = item.title?.trim();
        const published = item.isoDate || item.pubDate || null;

        if (!link || !title) continue;
        if (!isRecent(published)) continue;
        if (knownLinks.has(link)) continue;

        const description = source.name.startsWith("Google News") ? "" : (item.contentSnippet || "");

        newNews.push({
          id: Buffer.from(link).toString("base64url"),
          title,
          description,
          link,
          source: source.name,
          category: classifyCategory(
            title,
            description,
            source.name
          ),
          publishedAt: published,
          status: "pending",
          fetchedAt: new Date().toISOString()
        });

        knownLinks.add(link);
        sourceCount++;
      }

      console.log("à¤¨à¤ˆ à¤¤à¤¾à¤œà¤¾ à¤–à¤¬à¤°à¥‡à¤‚:", sourceCount);

    } catch (error) {
      console.log(
        source.name + " à¤¸à¥‡ à¤–à¤¬à¤° à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¥€:",
        error.message
      );
    }
  }

  const combinedNews = [...newNews, ...recentExisting];

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(combinedNews, null, 2),
    "utf8"
  );

  console.log("--------------------------------");
  console.log("à¤¨à¤ˆ à¤–à¤¬à¤°à¥‡à¤‚:", newNews.length);
  console.log("à¤ªà¥à¤°à¤¾à¤¨à¥€ à¤–à¤¬à¤°à¥‡à¤‚ à¤¹à¤Ÿà¤¾à¤ˆ à¤—à¤ˆà¤‚:", existingNews.length - recentExisting.length);
  console.log("à¤•à¥à¤² à¤¤à¤¾à¤œà¤¾ à¤–à¤¬à¤°à¥‡à¤‚:", combinedNews.length);
  console.log("à¤¨à¤¿à¤¯à¤®: à¤…à¤§à¤¿à¤•à¤¤à¤® 24 à¤˜à¤‚à¤Ÿà¥‡ à¤ªà¥à¤°à¤¾à¤¨à¥€ à¤–à¤¬à¤°à¥‡à¤‚");
  console.log("à¤¬à¤¿à¤¨à¤¾ à¤¤à¤¾à¤°à¥€à¤– à¤µà¤¾à¤²à¥€ à¤–à¤¬à¤°à¥‡à¤‚ à¤¶à¤¾à¤®à¤¿à¤² à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¤‚à¥¤");
  console.log("à¤¸à¤­à¥€ à¤¨à¤ˆ à¤–à¤¬à¤°à¥‡à¤‚ Admin Review à¤®à¥‡à¤‚ à¤œà¤¾à¤à¤à¤—à¥€à¥¤");
  console.log("à¤•à¥‹à¤ˆ à¤–à¤¬à¤° à¤…à¤ªà¤¨à¥‡ à¤†à¤ª à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤¨à¤¹à¥€à¤‚ à¤¹à¥à¤ˆà¥¤");
}

fetchNews();
