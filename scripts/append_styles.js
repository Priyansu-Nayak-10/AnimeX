const fs = require('fs');

const cssAdditions = `
/* --- Genre Badge & Chart Colors System --- */
[data-genre="Action"] { --genre-color: var(--genre-action); }
[data-genre="Adventure"] { --genre-color: var(--genre-adventure); }
[data-genre="Comedy"] { --genre-color: var(--genre-comedy); }
[data-genre="Drama"] { --genre-color: var(--genre-drama); }
[data-genre="Fantasy"] { --genre-color: var(--genre-fantasy); }
[data-genre="Romance"] { --genre-color: var(--genre-romance); }
[data-genre="Sci-Fi"] { --genre-color: var(--genre-scifi); }
[data-genre="Mystery"] { --genre-color: var(--genre-mystery); }
[data-genre="Horror"] { --genre-color: var(--genre-horror); }
[data-genre="Slice of Life"] { --genre-color: var(--genre-slicelife); }
[data-genre="Sports"] { --genre-color: var(--genre-sports); }

.genre-badge, .hero-genre-chip, .preview-tag {
    border: 1px solid var(--genre-color, var(--brand-primary));
    background-color: color-mix(in srgb, var(--genre-color, var(--brand-primary)) 15%, transparent);
    color: var(--genre-color, var(--brand-primary));
    border-radius: 9999px;
    font-size: 0.70rem;
    font-weight: 600;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
}

/* Button Refactor */
.btn-primary, .hero-btn {
    background: var(--brand-primary) !important;
    color: white !important;
    box-shadow: 0 0 15px rgba(124,58,237,0.35) !important;
    border: none !important;
    transition: all 0.3s ease;
}

.btn-primary:hover, .hero-btn:hover {
    background: var(--brand-secondary) !important;
    box-shadow: 0 0 20px rgba(124,58,237,0.5) !important;
}

/* Cards Refactor */
.card {
    background: var(--bg-card);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.35);
}

.anime-card-progress { /* progress bars specifically */
    background: linear-gradient(90deg, #7C3AED, #C084FC) !important;
}
`;

function applyStyles() {
    let css = fs.readFileSync('e:/VS CODE/ANIMEX/apps/web/public/css/style.css', 'utf8');
    css += '\n' + cssAdditions;
    fs.writeFileSync('e:/VS CODE/ANIMEX/apps/web/public/css/style.css', css);
    console.log('Added CSS additions.');
}
applyStyles();
