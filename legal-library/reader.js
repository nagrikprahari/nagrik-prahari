
async function renderLawReader(law, container) {
  if (!law || !container) return;

  container.replaceChildren();

  // भारतीय संविधान के लिए अलग Reader
  if (law.id === "constitution-of-india") {
    const loading = document.createElement("p");
    loading.textContent = "संविधान लोड हो रहा है...";
    container.appendChild(loading);

    try {
      const response = await fetch("./legal-library/constitution.json");

      if (!response.ok) {
        throw new Error("Constitution file not found");
      }

      const constitution = await response.json();
      container.replaceChildren();

      // प्रस्तावना
      const preamble = document.createElement("details");
      preamble.className = "law-chapter-item";
      preamble.open = true;

      const preambleTitle = document.createElement("summary");
      preambleTitle.textContent =
        constitution.preamble.name_hi + " / " +
        constitution.preamble.name_en;
      preamble.appendChild(preambleTitle);

      const explanation = document.createElement("p");
      explanation.textContent =
        constitution.preamble.explanation_hi;
      preamble.appendChild(explanation);

      container.appendChild(preamble);

      // संविधान के भाग और अनुच्छेद
      (constitution.parts || []).forEach(part => {
        const partDetails = document.createElement("details");
        partDetails.className = "law-chapter-item";

        const partTitle = document.createElement("summary");
        partTitle.textContent =
          "भाग " + part.part + " – " +
          part.name_hi + " / " + part.name_en;

        partDetails.appendChild(partTitle);

        (part.articles || []).forEach(article => {
          const articleDetails = document.createElement("details");
          articleDetails.className = "law-section-item";

          const articleTitle = document.createElement("summary");
          articleTitle.textContent =
            "अनुच्छेद " + article.number + " – " +
            article.name_hi + " / " + article.name_en;

          articleDetails.appendChild(articleTitle);

          if (article.explanation_hi) {
            const articleExplanation = document.createElement("p");
            articleExplanation.textContent =
              article.explanation_hi;
            articleDetails.appendChild(articleExplanation);
          }

          articleDetails.appendChild(
            createSourceNotice()
          );

          partDetails.appendChild(articleDetails);
        });

        container.appendChild(partDetails);
      });

      const source = document.createElement("a");
      source.href = constitution.source.english_current_version;
      source.textContent = "आधिकारिक संविधान का पूरा पाठ पढ़ें";
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      container.appendChild(source);

    } catch (error) {
      console.error(error);
      container.textContent =
        "संविधान की फाइल लोड नहीं हो सकी।";
    }

    return;
  }

  // अन्य कानूनों का सामान्य Reader
  const provisions = law.sections || law.provisions || [];

  if (!provisions.length) {
    const message = document.createElement("p");
    message.textContent =
      "इस कानून की धाराएँ अभी उपलब्ध नहीं हैं।";
    container.appendChild(message);
    return;
  }

  const getChapter = section =>
    section.chapterTitle ||
    section.chapter_title ||
    section.chapter ||
    section.partTitle ||
    section.part ||
    "";

  const groups = new Map();

  provisions.forEach(section => {
    const chapter = getChapter(section) || "direct";
    if (!groups.has(chapter)) groups.set(chapter, []);
    groups.get(chapter).push(section);
  });

  function createSection(section) {
    const details = document.createElement("details");
    details.className = "law-section-item";

    const summary = document.createElement("summary");
    summary.textContent =
      "धारा " + (section.num || section.number || "") +
      " – " + (section.title || "विवरण");

    details.appendChild(summary);

    if (section.text) {
      const text = document.createElement("p");
      text.textContent = section.text;
      details.appendChild(text);
    }

    if (section.rules && section.rules.length) {
      const heading = document.createElement("h4");
      heading.textContent = "संबंधित नियम और निर्देश";
      details.appendChild(heading);

      const list = document.createElement("ul");

      section.rules.forEach(rule => {
        const item = document.createElement("li");
        item.textContent = rule;
        list.appendChild(item);
      });

      details.appendChild(list);
    }

    return details;
  }

  groups.forEach((sections, chapter) => {
    if (chapter === "direct") {
      sections.forEach(section => {
        container.appendChild(createSection(section));
      });
    } else {
      const chapterDetails = document.createElement("details");
      chapterDetails.className = "law-chapter-item";

      const heading = document.createElement("summary");
      heading.textContent = chapter;
      chapterDetails.appendChild(heading);

      sections.forEach(section => {
        chapterDetails.appendChild(createSection(section));
      });

      container.appendChild(chapterDetails);
    }
  });
}

function createSourceNotice() {
  const notice = document.createElement("p");
  notice.textContent =
    "यह सरल हिंदी व्याख्या है। आधिकारिक अनुच्छेद का मूल पाठ अभी इस डेटाबेस में जोड़ना बाकी है।";
  return notice;
}

window.NagrikPrahariReader = {
  renderLawReader
};
