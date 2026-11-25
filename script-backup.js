const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle?.addEventListener('click', () => mainNav.classList.toggle('open'));
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mainNav.classList.remove('open')));

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const newsCards = [...document.querySelectorAll('.news-card')];
const emptyState = document.getElementById('emptyState');

function filterNews() {
  const query = (searchInput.value || '').trim().toLocaleLowerCase('hi');
  const category = categoryFilter.value;
  let visible = 0;
  newsCards.forEach(card => {
    const matchesText = card.innerText.toLocaleLowerCase('hi').includes(query);
    const matchesCategory = category === 'all' || card.dataset.category === category;
    const show = matchesText && matchesCategory;
    card.hidden = !show;
    if (show) visible++;
  });
  emptyState.hidden = visible !== 0;
}
searchInput?.addEventListener('input', filterNews);
categoryFilter?.addEventListener('change', filterNews);
document.getElementById('year').textContent = new Date().getFullYear();
