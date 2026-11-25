
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle?.addEventListener('click', () => {
  mainNav?.classList.toggle('open');
});

mainNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
  });
});

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const newsGrid = document.getElementById('newsGrid');
const emptyState = document.getElementById('emptyState');

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isRecent(dateValue) {
  if (!dateValue) return false;

  const date = Date.parse(dateValue);
  if (!Number.isFinite(date)) return false;

  const age = Date.now() - date;
  return age >= -5 * 60 * 1000 && age <= MAX_AGE_MS;
}

let newsCards = [];

function renderNews(items) {
  newsGrid.innerHTML = '';
  newsCards = [];

  const freshNews = items.filter(item =>
    item.status === 'approved' &&
    isRecent(item.publishedAt) &&
    item.title &&
    item.link
  );

  freshNews.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.dataset.category = item.category || 'देश';

    const title = document.createElement('h3');
    title.textContent = item.title;

    const description = document.createElement('p');
    description.textContent = item.description || '';

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent =
      'स्रोत: ' + (item.source || 'समाचार स्रोत') +
      ' | तारीख: ' + new Date(item.publishedAt).toLocaleString('hi-IN');

    const link = document.createElement('a');
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'पूरी खबर पढ़ें';

    card.append(title, description, meta, link);
    newsGrid.appendChild(card);
    newsCards.push(card);
  });

  filterNews();
}

function filterNews() {
  const query = (searchInput?.value || '').trim().toLocaleLowerCase('hi');
  const category = categoryFilter?.value || 'all';

  let visible = 0;

  newsCards.forEach(card => {
    const matchesText = card.innerText.toLocaleLowerCase('hi').includes(query);
    const matchesCategory =
      category === 'all' || card.dataset.category === category;

    const show = matchesText && matchesCategory;
    card.hidden = !show;

    if (show) visible++;
  });

  if (emptyState) {
    emptyState.hidden = visible !== 0;
  }
}

async function loadPublishedNews() {
  try {
    const response = await fetch('./news-data/published-news.json');

    if (!response.ok) {
      throw new Error('समाचार फाइल उपलब्ध नहीं है');
    }

    const items = await response.json();
    renderNews(Array.isArray(items) ? items : []);
  } catch (error) {
    newsGrid.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = 'अभी कोई ताजा मंजूर खबर उपलब्ध नहीं है।';
    }
  }
}

searchInput?.addEventListener('input', filterNews);
categoryFilter?.addEventListener('change', filterNews);

const year = document.getElementById('year');
if (year) {
  year.textContent = new Date().getFullYear();
}

loadPublishedNews();
