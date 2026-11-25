
const fs = require("fs");
const path = require("path");

const oldPath = path.join(__dirname, "../legal-library/constitution.json");
const previewPath = path.join(__dirname, "../legal-library/constitution-full-preview.json");
const outputPath = path.join(__dirname, "../legal-library/constitution-merged.json");

const oldData = JSON.parse(fs.readFileSync(oldPath, "utf8"));
const preview = JSON.parse(fs.readFileSync(previewPath, "utf8"));

// पुराने हिंदी विवरण सुरक्षित रखें
const oldArticles = new Map();

(oldData.parts || []).forEach(part => {
  (part.articles || []).forEach(article => {
    oldArticles.set(String(article.number), article);
  });
});

// पुराने Part की जानकारी सुरक्षित रखें
const oldParts = new Map(
  (oldData.parts || []).map(part => [part.part, part])
);

// सभी नए अनुच्छेदों को Part के अनुसार व्यवस्थित करें
const mergedParts = (preview.parts || []).map(partNumber => {
  const previousPart = oldParts.get(partNumber);

  return {
    part: partNumber,
    name_hi: previousPart?.name_hi || "",
    name_en: previousPart?.name_en || "",
    articles: preview.articles
      .filter(article => article.part === partNumber)
      .map(article => {
        const previous = oldArticles.get(String(article.number));

        return {
          number: article.number,
          name_hi: previous?.name_hi || "",
          name_en: article.title.replace(/^\d+[A-Z]?\.\s*/, ""),
          explanation_hi: previous?.explanation_hi || "",
          text_en: article.text
        };
      })
  };
});

// पुरानी प्रस्तावना और स्रोत जानकारी सुरक्षित रखें
const merged = {
  ...oldData,
  source: {
    ...oldData.source,
    extraction_source: preview.source,
    extraction_status: preview.extraction_status
  },
  parts: mergedParts,
  total_articles: preview.articles.length
};

fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), "utf8");

console.log("नई संयुक्त फाइल तैयार!");
console.log("कुल अनुच्छेद:", preview.articles.length);
console.log("कुल Parts:", mergedParts.length);
console.log("पुरानी हिंदी व्याख्याएँ सुरक्षित:", oldArticles.size);
console.log("फाइल:", outputPath);
