
import { PDFParse } from "pdf-parse";
import { readFile, writeFile } from "node:fs/promises";

async function extractConstitution() {
  const file = await readFile(
    "./legal-library/englishconstitution.pdf"
  );

  const parser = new PDFParse({
    data: new Uint8Array(file)
  });

  try {
    const result = await parser.getText();

    await writeFile(
      "./legal-library/constitution-extracted.txt",
      result.text,
      "utf8"
    );

    console.log("PDF से टेक्स्ट निकालना पूरा हुआ!");
    console.log("कुल अक्षर:", result.text.length);
    console.log("फाइल: legal-library/constitution-extracted.txt");
    console.log("\nशुरुआती टेक्स्ट:\n");
    console.log(result.text.slice(0, 1000));

  } finally {
    await parser.destroy();
  }
}

extractConstitution().catch(error => {
  console.error("त्रुटि:", error);
});