
import fs from "node:fs";

const inputFile = "./legal-library/constitution-extracted.txt";
const outputFile = "./legal-library/constitution-full-preview.json";

const lines = fs.readFileSync(inputFile, "utf8").split(/\r?\n/);

const firstArticleLine = lines.findIndex(
  line =>
    line.includes("1. Name and territory of the Union") &&
    line.includes("India, that is Bharat")
);

const startLine =
  firstArticleLine === -1
    ? -1
    : lines.slice(0, firstArticleLine).findLastIndex(
        line => line.trim() === "PART I"
      );

const endLine = lines.findIndex(
  (line, index) =>
    index > startLine &&
    /^\s*1?\[?FIRST SCHEDULE\s*$/i.test(line.trim())
);

if (startLine === -1 || endLine === -1) {
  throw new Error("मुख्य संविधान का हिस्सा नहीं मिला।");
}

const mainLines = lines.slice(startLine, endLine);

const articles = [];
let currentPart = "";
let currentArticle = null;



function cleanLine(line) {
  return line
    // PDF page footer: -- 34 of 402 --
    .replace(/--\s*\d+\s+of\s+402\s*--[\s\S]*$/i, "")

    // Page number followed by Constitution header
    .replace(/\s+\d{1,3}(?:\s+\d{1,3})?\s+THE CONSTITUTION OF INDIA\b[\s\S]*$/i, "")
.replace(/\s*\(Part\s+[IVX]+[A-Z]?(?:[.—-][^)]*)?\)/g, "")
    // Header appearing at the beginning of a line
    .replace(/^\s*\d{1,3}\s+THE CONSTITUTION OF INDIA\b.*$/i, "")
    .replace(/^\s*THE CONSTITUTION OF INDIA\b.*$/i, "")

    // IndiaCode footer
    .replace(/^\s*IndiaCode\s*$/i, "")
    .trim();
}



function isFootnote(line) {
    return /^\s*\d+\.\s*(?:Subs\.|Sub-clause\b|Ins\.|The words\b|Omitted\b|Added\b|Inserted\b|For\b|See\b|Explanation\b|Art\b|In exercise\b|Paragraph\b|The first proviso\b)/i.test(line);
}

function saveArticle() {
  if (!currentArticle) return;

  currentArticle.text = currentArticle.text
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  articles.push(currentArticle);
  currentArticle = null;
}

function isArticleHeading(line) {
  if (isFootnote(line)) return null;

  const match = line.match(
    /^\s*(?:\d+\[)?\[?(\d+[A-Z]{0,2})\.\s+(.+)$/
  );

  if (!match) return null;

  const corrections = {
    "731D": "31D",
    "4268A": "268A",
    "3329A": "329A",
    "3359A": "359A"
  };

  match[1] = corrections[match[1]] || match[1];

  return match;
}
  

for (let i = 0; i < mainLines.length; i++) {
  const line = cleanLine(mainLines[i]);

  if (!line) continue;

  const partMatch = line.match(/^\s*(?:\d+\[)?PART\s+([IVX]+[AB]?)\s*$/i);

  if (partMatch) {
    saveArticle();
    currentPart = partMatch[1];
    continue;
  }

  if (isFootnote(line)) {
    if (currentArticle?.number === "395") {
      saveArticle();
      break;
    }
    continue;
  }

  const candidate = isArticleHeading(line);

  if (candidate) {
    saveArticle();

    let heading = candidate[2];
    let dashMatch = heading.match(/^(.*?)(?:—|ΓÇö|–)\s*(.*)$/);

    while (!dashMatch && i + 1 < mainLines.length) {
      const nextLine = cleanLine(mainLines[i + 1]);

      if (
        !nextLine ||
        isArticleHeading(nextLine) ||
        /^PART\s+[IVX]+$/i.test(nextLine) ||
        isFootnote(nextLine)
      ) {
        break;
      }

      i++;
      heading += " " + nextLine;
      dashMatch = heading.match(/^(.*?)(?:—|ΓÇö|–)\s*(.*)$/);
    }

    if (dashMatch) {
      currentArticle = {
        number: candidate[1],
        part: currentPart,
        title: dashMatch[1].trim(),
        text: dashMatch[2] ? [dashMatch[2].trim()] : []
      };
    }

    continue;
  }

  if (currentArticle) {
    currentArticle.text.push(line);
  }
}

saveArticle();

const result = {
  title: "The Constitution of India",
  source: "Official India Code PDF",
  extraction_status: "preview_requires_verification",
  total_articles_found: articles.length,
  parts: [...new Set(articles.map(a => a.part))],
  articles
};

fs.writeFileSync(
  outputFile,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log("नया Preview तैयार हो गया!");
console.log("कुल अनुच्छेद:", articles.length);
console.log("पहले 30 अनुच्छेद:");

console.log(
  articles.slice(0, 30)
    .map(a => a.number + ". " + a.title)
    .join("\n")
);