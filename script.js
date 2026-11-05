const projectGrid = document.querySelector('#project-grid');
const emptyMessage = document.querySelector('#project-empty');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let projectMotionObserver;

function observeProjectCards() {
  projectMotionObserver?.disconnect();
  const cards = [...projectGrid.querySelectorAll('.project-card')];
  if (reduceMotion || !window.anime || !('IntersectionObserver' in window)) return;

  projectMotionObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const card = entry.target;
    card.classList.remove('motion-pending');
    card.classList.add('is-scanned');
    window.anime({
      targets: card,
      opacity: [0, 1],
      translateX: [64, 0],
      duration: 720,
      delay: (Number(card.dataset.motionIndex) % 3) * 70,
      easing: 'easeOutCubic',
      complete: () => { card.style.removeProperty('opacity'); card.style.removeProperty('transform'); },
    });
    observer.unobserve(card);
  }), { threshold: .12 });

  cards.forEach((card, index) => {
    card.dataset.motionIndex = index;
    card.classList.add('motion-pending');
    projectMotionObserver.observe(card);
  });
}

function renderProjects(filter = 'all') {
  const visible = projects.filter(({ year }) => {
    if (filter === 'all') return true;
    if (filter === '2024') return year >= 2024;
    if (filter === '2022') return year >= 2022 && year <= 2023;
    return year < 2022;
  });
  projectGrid.innerHTML = visible.map((project) => {
    const number = String(projects.indexOf(project) + 1).padStart(2, '0');
    const href = `./projects/${project.id}.html`;
    return `
    <article class="project-card${project.image ? ' is-featured-project' : ''}">
      ${project.image ? `<a class="project-media has-image${project.imageFit === 'contain' ? ' is-slide' : ''}" href="${href}" tabindex="-1" aria-hidden="true"><img src="${project.image}" alt="" loading="lazy" /></a>` : ''}
      <span class="project-index">과제 ${number}</span>
      <h3><a href="${href}">${project.title}</a></h3>
      <p>${project.funder}</p>
      <div class="project-meta"><strong>${project.period || project.year}</strong><a class="card-link" href="${href}">자세히 보기 <span aria-hidden="true">↗</span></a></div>
    </article>`;
  }).join('');
  emptyMessage.hidden = visible.length !== 0;
  observeProjectCards();
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    renderProjects(button.dataset.filter);
  });
});
renderProjects('2024');

const publicationList = document.querySelector('#publication-list');
const publicationSearch = document.querySelector('#publication-search');
const publicationYear = document.querySelector('#publication-year');
const publicationCount = document.querySelector('#publication-count');
const publicationEmpty = document.querySelector('#publication-empty');
const publicationTypeButtons = [...document.querySelectorAll('[data-pub-type]')];
const publicationGroups = Object.entries(publications);
let publicationType = 'all';

document.querySelector('#publication-range').textContent = `${publicationGroups.map(([name]) => `${name} ${publicationRange[name] ? `${publicationRange[name]}년 이후` : '전체'}`).join(' · ')} 실적을 싣는다.`;
publicationYear.innerHTML = `<option value="">전체 연도</option>${[...new Set(publicationGroups.flatMap(([, items]) => items.map((item) => item.year)))].sort((a, b) => b - a).map((year) => `<option value="${year}">${year}</option>`).join('')}`;

function renderPublication(item, number) {
  const href = `./publications/${item.id}.html`;
  const media = item.image ? `<a class="publication-media has-image" href="${href}" tabindex="-1" aria-hidden="true"><img src="${item.image}" alt="" loading="lazy" /></a>` : '';
  const links = [
    item.doi ? `<a class="publication-link doi-icon-link" href="https://doi.org/${item.doi}" target="_blank" rel="noopener" title="doi.org/${item.doi}"><img class="publication-link-icon" src="./newDOIicon.jpg" alt="" />DOI</a>` : '',
    item.pdf ? `<a class="publication-link pdf-icon-link" href="${item.pdf}" target="_blank" rel="noopener"><img class="publication-link-icon" src="./PDF대체icon.jpg" alt="" />PDF</a>` : (item.url && !item.doi ? `<a class="publication-link" href="${item.url}" target="_blank" rel="noopener">원문 페이지 ↗</a>` : ''),
    `<a class="card-link" href="${href}">자세히 보기 <span aria-hidden="true">↗</span></a>`,
  ].join('');
  return `<article class="publication-item${item.image ? '' : ' no-media'}"><span>${String(number).padStart(2, '0')}</span>${media}<div class="publication-item-content"><p class="publication-title"><a href="${href}">${item.title}</a></p><p class="publication-meta">${item.cite}</p><div class="publication-links">${links}</div></div></article>`;
}

function renderPublications() {
  const query = publicationSearch.value.trim().toLowerCase().replace(/\s+/g, '');
  const year = publicationYear.value;
  const filtering = Boolean(query || year || publicationType !== 'all');
  let shown = 0;
  let total = 0;
  publicationList.innerHTML = publicationGroups.map(([name, items], groupIndex) => {
    total += items.length;
    if (publicationType !== 'all' && name !== publicationType) return '';
    const visible = items.filter((item) => (!year || item.year === year) && (!query || `${item.title} ${item.cite}`.toLowerCase().replace(/\s+/g, '').includes(query)));
    if (!visible.length) return '';
    shown += visible.length;
    return `
  <details class="publication-group" ${filtering || groupIndex === 0 ? 'open' : ''}>
    <summary>${name}<span>${visible.length}건${visible.length !== items.length ? ` / ${items.length}건` : ''}</span></summary>
    <div class="publication-items">${visible.map((item) => renderPublication(item, items.indexOf(item) + 1)).join('')}</div>
  </details>`;
  }).join('');
  publicationCount.textContent = filtering ? `${shown}건 표시 · 전체 ${total}건` : `전체 ${total}건`;
  publicationEmpty.hidden = shown !== 0;
}

publicationSearch.addEventListener('input', renderPublications);
publicationYear.addEventListener('change', renderPublications);
publicationTypeButtons.forEach((button) => button.addEventListener('click', () => {
  publicationType = button.dataset.pubType;
  publicationTypeButtons.forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
  renderPublications();
}));
renderPublications();

const mobileMenu = document.querySelector('.mobile-menu');
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { mobileMenu.open = false; }));

const revealItems = document.querySelectorAll('.reveal');
const reveal = (element, index = 0) => {
  element.classList.add('is-visible');
  if (window.anime && !reduceMotion) {
    window.anime({ targets: element, opacity: [0, 1], translateY: [16, 0], duration: 620, delay: Math.min(index * 45, 180), easing: 'easeOutCubic' });
  }
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
    if (entry.isIntersecting) { reveal(entry.target, [...revealItems].indexOf(entry.target)); instance.unobserve(entry.target); }
  }), { threshold: .1 });
  revealItems.forEach((item) => observer.observe(item));
} else revealItems.forEach(reveal);

const sectionLinks = [...document.querySelectorAll('.desktop-nav a')];
const sections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) sectionLinks.forEach((link) => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
  }), { rootMargin: '-18% 0px -70% 0px', threshold: 0 });
  [document.querySelector('.hero'), ...sections].filter(Boolean).forEach((section) => navObserver.observe(section)); // .hero: 맨 위로 오면 강조 해제
}
