
const LIBRARY_DATA_URL = "./legal-library/index.json";

let legalLibrary = null;
let currentLanguage = "hi";
let selectedCategory = "all";

async function loadLegalLibrary() {
  const status = document.getElementById("legalStatus");

  try {
    const response = await fetch(LIBRARY_DATA_URL);

    if (!response.ok) {
      throw new Error("Database loading failed");
    }

    legalLibrary = await response.json();

    renderCategories();
    renderLaws();

    if (status) {
      status.textContent =
        "Legal Library सफलतापूर्वक लोड हो गई।";
    }
  } catch (error) {
    console.error(error);

    if (status) {
      status.textContent =
        "डेटाबेस लोड नहीं हुआ। वेबसाइट को Live Server से खोलें।";
    }
  }
}

function renderCategories() {
  const container =
    document.getElementById("legalCategories");

  if (!container || !legalLibrary) return;

  container.replaceChildren();

  legalLibrary.categories.forEach(category => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = currentLanguage === "hi"
      ? category.name_hi
      : category.name_en;

    button.className = "legal-category";

    button.setAttribute(
      "aria-pressed",
      selectedCategory === category.id
    );

    button.addEventListener("click", () => {
      selectedCategory =
        selectedCategory === category.id
          ? "all"
          : category.id;

      renderCategories();
      renderLaws();
    });

    container.appendChild(button);
  });
}

function openLawReader(law) {
  const container =
    document.getElementById("legalResults");

  if (!container) return;

  container.replaceChildren();

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.textContent = "← वापस कानूनों की सूची में जाएँ";
  backButton.className = "legal-category";

  backButton.addEventListener("click", renderLaws);

  container.appendChild(backButton);

  const heading = document.createElement("h2");

  heading.textContent = currentLanguage === "hi"
    ? law.name_hi || law.name_en
    : law.name_en || law.name_hi;

  container.appendChild(heading);

  if (law.year) {
    const year = document.createElement("p");
    year.textContent = "वर्ष: " + law.year;
    container.appendChild(year);
  }

  if (law.description) {
    const description = document.createElement("p");
    description.textContent = law.description;
    container.appendChild(description);
  }

  if (
  law.id === "constitution-of-india" ||
  law.sections?.length ||
  law.provisions?.length
) {
    const readerContent = document.createElement("div");
    readerContent.className = "law-reader-content";

    if (window.NagrikPrahariReader) {
      window.NagrikPrahariReader.renderLawReader(
        law,
        readerContent
      );
    }

    container.appendChild(readerContent);
  } else {
    const message = document.createElement("p");
    message.textContent =
      "इस कानून का पूरा पाठ अभी उपलब्ध नहीं है।";
    container.appendChild(message);
  }

  if (law.official_url) {
    const link = document.createElement("a");

    link.href = law.official_url;
    link.textContent = "आधिकारिक कानून देखें";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    container.appendChild(link);
  }

  window.scrollTo({
    top: container.getBoundingClientRect().top +
      window.scrollY - 80,
    behavior: "smooth"
  });
}

function renderLaws() {
  const container =
    document.getElementById("legalResults");

  if (!container || !legalLibrary) return;

  container.replaceChildren();

  const input = document.getElementById("lawSearch");
  const query = (input?.value || "").trim().toLowerCase();

  const results = legalLibrary.laws.filter(law => {
    const text = [
      law.name_hi,
      law.name_en,
      law.short_name,
      law.description
    ].filter(Boolean).join(" ").toLowerCase();

    const matchesSearch = text.includes(query);

    const matchesCategory =
      selectedCategory === "all" ||
      law.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (results.length === 0) {
    const message = document.createElement("p");
    message.textContent = "अभी कोई कानून उपलब्ध नहीं है।";
    container.appendChild(message);
    return;
  }

  results.forEach(law => {
    const article = document.createElement("article");
    article.className = "law-card";

    const heading = document.createElement("h3");

    const openButton = document.createElement("button");
    openButton.type = "button";

    openButton.textContent = currentLanguage === "hi"
      ? law.name_hi || law.name_en
      : law.name_en || law.name_hi;

    openButton.addEventListener("click", () => {
      openLawReader(law);
    });

    heading.appendChild(openButton);
    article.appendChild(heading);

    if (law.description) {
      const description = document.createElement("p");
      description.textContent = law.description;
      article.appendChild(description);
    }

    const readButton = document.createElement("button");
    readButton.type = "button";
    readButton.textContent = "कानून पढ़ें →";

    readButton.addEventListener("click", () => {
      openLawReader(law);
    });

    article.appendChild(readButton);
    container.appendChild(article);
  });
}

function setLibraryLanguage(language) {
  if (language !== "hi" && language !== "en") return;

  currentLanguage = language;
  renderCategories();
  renderLaws();
}

document.getElementById("lawSearch")
  ?.addEventListener("input", renderLaws);

document.querySelectorAll("[data-language]")
  .forEach(button => {
    button.addEventListener("click", () => {
      setLibraryLanguage(button.dataset.language);
    });
  });

window.NagrikPrahariLibrary = {
  loadLegalLibrary,
  setLibraryLanguage,
  renderCategories,
  renderLaws,
  openLawReader
};

loadLegalLibrary();