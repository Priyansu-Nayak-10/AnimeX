export function bindHoverPreviews(containerElement, getAnimeDataFn) {
  let previewEl = document.getElementById('global-anime-preview');
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.id = 'global-anime-preview';
    document.body.appendChild(previewEl);

    // Inject styles dynamically for this module
    const style = document.createElement('style');
    style.textContent = `
      #global-anime-preview {
        position: absolute;
        width: 320px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        padding: 16px;
        z-index: 99999;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px) scale(0.95);
        transition: opacity 0.2s ease, transform 0.2s ease;
        color: #f1f5f9;
        font-family: 'Outfit', sans-serif;
      }
      #global-anime-preview.active {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }
      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        gap: 8px;
      }
      .preview-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
        color: #fff;
      }
      .preview-year {
        font-size: 0.85rem;
        color: #a855f7;
        font-weight: 600;
        white-space: nowrap;
      }
      .preview-meta {
        font-size: 0.8rem;
        color: #94a3b8;
        margin-bottom: 12px;
        font-weight: 500;
      }
      .preview-synopsis {
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .preview-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .preview-tag {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        color: #e2e8f0;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  let hideTimeout;

  containerElement.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.anime-card');
    if (!card) return;

    clearTimeout(hideTimeout);
    const malId = String(card.dataset.id);
    const data = getAnimeDataFn(malId);
    if (!data) return;

    // Build inner HTML
    let title = data.title_english;
    if (!title && Array.isArray(data.titles)) {
      const eng = data.titles.find(t => t.type === 'English');
      if (eng) title = eng.title;
    }
    title = title || 'Unknown Title';

    const year = data.year || (data.aired?.prop?.from?.year) || '';
    const type = data.type || 'TV';
    const studio = data.studios?.[0]?.name || 'Unknown Studio';
    const score = data.score ? `⭐ ${data.score}` : 'N/A';
    const synopsis = data.synopsis ? data.synopsis.replace('[Written by MAL Rewrite]', '').trim() : 'No synopsis available.';
    const tags = (data.genres || []).slice(0, 4).map(g => `<span class="preview-tag" data-genre="${g.name}">${g.name}</span>`).join('');

    previewEl.innerHTML = `
      <div class="preview-header">
        <h4 class="preview-title">${title}</h4>
        <span class="preview-year">${year}</span>
      </div>
      <div class="preview-meta">
        <span>${type}</span> &bull; <span>${studio}</span> &bull; ${score}
      </div>
      <div class="preview-synopsis">${synopsis}</div>
      <div class="preview-tags">${tags}</div>
    `;

    // Position calc
    const rect = card.getBoundingClientRect();
    let left = rect.right + 15;
    let top = rect.top;

    // Flip if offscreen right
    if (left + 350 > window.innerWidth) {
      left = rect.left - 335;
    }
    // Prevent top being cut off
    if (top < 10) top = 10;

    // Prevent bottom overflow
    if (top + previewEl.offsetHeight > window.innerHeight) {
      top = window.innerHeight - previewEl.offsetHeight - 10;
    }

    previewEl.style.left = `${left + window.scrollX}px`;
    previewEl.style.top = `${top + window.scrollY}px`;
    previewEl.classList.add('active');
  });

  containerElement.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.anime-card');
    if (!card) return;
    hideTimeout = setTimeout(() => {
      previewEl.classList.remove('active');
    }, 150);
  });

  previewEl.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
  previewEl.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(() => previewEl.classList.remove('active'), 150);
  });
}
