export function initSeasonTabs(mainNavContainer, subNavContainer, onTabChange) {
  const mainBtns = Array.from(mainNavContainer.querySelectorAll('button[data-tab]'));
  const stripEl = subNavContainer.querySelector('[data-season-strip]');
  const yearToggle = document.getElementById('season-dropdown-toggle');
  const yearMenu = document.getElementById('season-dropdown-menu');

  const seasons = ['winter', 'spring', 'summer', 'fall'];

  function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month <= 2) return 'winter';
    if (month <= 5) return 'spring';
    if (month <= 8) return 'summer';
    return 'fall';
  }

  let selectedYear = new Date().getFullYear();
  let selectedSeason = getCurrentSeason();
  let activeTab = 'season';

  function setYearLabel(year) {
    if (!yearToggle) return;
    yearToggle.innerHTML = `Year ${year} <span class="chevron">&#9662;</span>`;
  }

  function renderYearMenu() {
    if (!yearMenu) return;
    yearMenu.innerHTML = '';
    const current = new Date().getFullYear();
    const years = [];
    for (let yr = current + 1; yr >= current - 6; yr--) years.push(yr);

    years.forEach((yr) => {
      const btn = document.createElement('button');
      btn.className = 'season-dropdown-item';
      btn.textContent = `${yr}`;
      if (yr === selectedYear) btn.classList.add('active');
      btn.addEventListener('click', () => {
        selectedYear = yr;
        setYearLabel(selectedYear);
        yearMenu.classList.remove('open');
        yearToggle?.setAttribute('aria-expanded', 'false');
        renderSeasons();
        if (activeTab === 'season') {
          onTabChange('season_spec', { year: selectedYear, season: selectedSeason });
        }
      });
      yearMenu.appendChild(btn);
    });
  }

  function renderSeasons() {
    if (!stripEl) return;
    stripEl.innerHTML = '';
    stripEl.classList.add('animate-shift');
    requestAnimationFrame(() => stripEl.classList.remove('animate-shift'));
    seasons.forEach((season) => {
      const btn = document.createElement('button');
      btn.className = `season-pill season-${season}`;
      btn.textContent = `${season.charAt(0).toUpperCase() + season.slice(1)} ${selectedYear}`;
      if (season === selectedSeason) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (selectedSeason === season) return;
        selectedSeason = season;
        renderSeasons();
        if (activeTab === 'season') {
          onTabChange('season_spec', { year: selectedYear, season: selectedSeason });
        }
      });
      stripEl.appendChild(btn);
    });
  }

  function bindYearDropdown() {
    if (!yearToggle || !yearMenu) return;
    yearToggle.addEventListener('click', () => {
      const isOpen = yearMenu.classList.toggle('open');
      yearToggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!yearMenu.classList.contains('open')) return;
      if (yearToggle.contains(e.target) || yearMenu.contains(e.target)) return;
      yearMenu.classList.remove('open');
      yearToggle.setAttribute('aria-expanded', 'false');
    });
  }

  function activateSeasonTab() {
    subNavContainer.style.display = 'grid';
    renderSeasons();
    renderYearMenu();
    onTabChange('season_spec', { year: selectedYear, season: selectedSeason });
  }

  mainBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mainBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab || 'season';

      if (activeTab === 'season') {
        activateSeasonTab();
      } else {
        subNavContainer.style.display = 'none';
        onTabChange(activeTab, null);
      }
    });
  });

  bindYearDropdown();
  setYearLabel(selectedYear);
  renderYearMenu();
  renderSeasons();
  onTabChange('season_spec', { year: selectedYear, season: selectedSeason });
}
