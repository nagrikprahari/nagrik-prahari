
const fs = require("fs");

const libraryPath = "./legal-library/index.json";
const rawPath = "./scripts/nyaykosh-raw.json";
const outputPath = "./legal-library/index.preview.json";

const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
const imported = JSON.parse(fs.readFileSync(rawPath, "utf8"));

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

let added = 0;
let skipped = 0;

for (const law of imported) {
  const title = law.title || "";
  const normalizedTitle = normalize(title);

  const exists = library.laws.some(existing => {
    return (
      normalize(existing.id) === normalize(law.id) ||
      normalize(existing.name_en) === normalizedTitle ||
      normalize(existing.short_name) === normalizedTitle ||
      (
        normalizedTitle.includes("informationtechnologyact") &&
        normalize(existing.name_en).includes("informationtechnologyact")
      )
    );
  });

  if (exists) {
    console.log("पहले से मौजूद:", title);
    skipped++;
    continue;
  }

  const newLaw = {
    id: law.id,
    category: "central-acts",
    name_hi: "",
    name_en: title,
    year: law.year,
    status: "verification-required",
    description: law.shortDesc || "",
    official_url: "",
    source: "Nyaykosh API - सत्यापन आवश्यक",
    sections: law.provisions || [],
    penalties: law.penalties || [],
    nyaykosh_metadata: {
      authority: law.authority,
      reported_status: law.status,
      lastUpdated: law.lastUpdated,
      apiSlug: law.apiSlug
    }
  };

  library.laws.push(newLaw);
  console.log("जोड़ा गया:", title);
  added++;
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(library, null, 2),
  "utf8"
);

console.log("\nआयात पूरा!");
console.log("नए कानून:", added);
console.log("पहले से मौजूद:", skipped);
console.log("कुल कानून:", library.laws.length);
console.log("नई Preview फाइल:", outputPath);