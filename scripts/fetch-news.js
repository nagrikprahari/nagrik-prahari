
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
    name: "खेल जगत (Google News)",
    url: "https://news.google.com/rss/search?q=%28cricket+OR+%E0%A4%95%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%95%E0%A5%87%E0%A4%9F+OR+%E0%A4%96%E0%A5%87%E0%A4%B2+OR+football+OR+%E0%A4%AB%E0%A5%81%E0%A4%9F%E0%A4%AC%E0%A5%89%E0%A4%B2+OR+%E0%A4%B9%E0%A5%89%E0%A4%95%E0%A5%80+OR+%E0%A4%B5%E0%A5%88%E0%A4%AD%E0%A4%B5+%E0%A4%B8%E0%A5%82%E0%A4%B0%E0%A5%8D%E0%A4%AF%E0%A4%B5%E0%A4%82%E0%A4%B6%E0%A5%80%29&hl=hi&gl=IN&ceid=IN:hi"
  },
  {
    name: "फिल्मी दुनिया (Google News)",
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

  // ANI का सामान्य परिचय
  if (/asia's premier news agency|about us|हमारे बारे में/.test(text)) {
    return "सामान्य";
  }

  // सोशल मीडिया से प्रकाशित खबरें
  if (/facebook|instagram|twitter|x\.com|social media|सोशल मीडिया/.test(source)) {
    return "सोशल मीडिया";
  }

  

  // राजनीति
  if (/चुनाव|लोकसभा|विधानसभा|संसद|राजनीति|राजनीतिक|प्रधानमंत्री|मुख्यमंत्री|मंत्री|विपक्ष|भाजपा|कांग्रेस|सपा|राजद|जदयू|राजनीतिक दल|politics|election|bjp|congress/.test(text)) {
    return "राजनीति";
  }

  // कानून
  if (/अदालत|सुप्रीम कोर्ट|हाई कोर्ट|कानून|न्यायालय|फैसला|संविधान|कोर्ट|वकील|कानूनी|जमानत|याचिका/.test(text)) {
    return "कानून";
  }

  // खेल
  if (/क्रिकेट|फुटबॉल|हॉकी|टेनिस|बैडमिंटन|वैभव सूर्यवंशी|ipl|आईपीएल|खिलाड़ी|विश्व कप|कबड्डी|olympics|football|cricket|sports|मैच/.test(text)) {
    return "खेल जगत";
  }

  // फिल्म और मनोरंजन
  if (/बॉलीवुड|फिल्म|सिनेमा|मनोरंजन|अभिनेता|अभिनेत्री|मूवी|वेब सीरीज|हॉलीवुड|ट्रेलर|box office|bollywood|movie|एक्ट्रेस|एक्टर/.test(text)) {
    return "फिल्मी दुनिया";
  }
// विदेश से जुड़ी खबरें
  if (/पाकिस्तान|चीन|नेपाल|बांग्लादेश|रूस|ब्रिटेन|इजरायल|ईरान|यूक्रेन|अमेरिका|सऊदी अरब|यमन|विदेश|अंतरराष्ट्रीय|world news|international/.test(text)) {
    return "विदेश";
  }
  // शिक्षा
  if (/शिक्षा|परीक्षा|स्कूल|कॉलेज|विश्वविद्यालय|यूनिवर्सिटी|रिजल्ट|education/.test(text)) {
    return "शिक्षा";
  }

  // बाकी खबरें
  return "सामान्य";
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
      console.log("पुरानी JSON फाइल पढ़ने में समस्या।");
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
      console.log("स्रोत पढ़ रहे हैं:", source.name);

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

        const description = item.contentSnippet || "";

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

      console.log("नई ताजा खबरें:", sourceCount);

    } catch (error) {
      console.log(
        source.name + " से खबर नहीं मिली:",
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
  console.log("नई खबरें:", newNews.length);
  console.log("पुरानी खबरें हटाई गईं:", existingNews.length - recentExisting.length);
  console.log("कुल ताजा खबरें:", combinedNews.length);
  console.log("नियम: अधिकतम 24 घंटे पुरानी खबरें");
  console.log("बिना तारीख वाली खबरें शामिल नहीं हैं।");
  console.log("सभी नई खबरें Admin Review में जाएँगी।");
  console.log("कोई खबर अपने आप प्रकाशित नहीं हुई।");
}

fetchNews();
