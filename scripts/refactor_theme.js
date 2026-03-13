const fs = require('fs');
const path = require('path');

const cssRoot = `:root {
    /* Brand */
    --brand-primary: #7C3AED;
    --brand-secondary: #9333EA;
    --brand-accent: #A855F7;
    --brand-glow: #C084FC;

    /* Backgrounds */
    --bg-main: #0B0C13;
    --bg-surface: #121420;
    --bg-card: #181A2A;
    --bg-sidebar: #0E0F18;

    /* Text */
    --text-primary: #F5F5F7;
    --text-secondary: #A1A1AA;
    --text-muted: #71717A;

    /* Borders / Glass */
    --border-glass: rgba(255,255,255,0.06);
    --glass-bg: rgba(255,255,255,0.03);

    /* Charts */
    --chart-purple: #7C3AED;
    --chart-blue: #3B82F6;
    --chart-cyan: #06B6D4;
    --chart-green: #22C55E;
    --chart-orange: #F59E0B;
    --chart-pink: #EC4899;

    /* Genres */
    --genre-action: #EF4444;
    --genre-adventure: #F97316;
    --genre-comedy: #F59E0B;
    --genre-drama: #EC4899;
    --genre-fantasy: #8B5CF6;
    --genre-romance: #FB7185;
    --genre-scifi: #06B6D4;
    --genre-mystery: #6366F1;
    --genre-horror: #991B1B;
    --genre-slicelife: #22C55E;
    --genre-sports: #10B981;
}`;

function replaceColors(content) {
    let result = content;
    const replacements = {
        '--primary': '--brand-primary',
        '--accent-purple': '--brand-accent',
        '--background-light': '--bg-main',
        '--background-dark': '--bg-main',
        '--card-dark': '--bg-card',
        '--card-light': '--bg-surface',
        '--sidebar-dark': '--bg-sidebar',
        '--sidebar-light': '--bg-sidebar',
        '--text-gray-900': '--text-primary',
        '--text-gray-800': '--text-primary',
        '--text-gray-600': '--text-secondary',
        '--text-gray-500': '--text-muted',
        '--text-gray-400': '--text-secondary',
        '--text-gray-300': '--text-secondary',
        '--text-gray-200': '--text-primary',
        '--border-gray-200': '--border-glass',
        '--border-gray-800': '--border-glass',
        'rgba(255, 255, 255, 0.05)': 'var(--border-glass)',
        'rgba(255, 255, 255, 0.03)': 'var(--glass-bg)',
        'rgba(0, 0, 0, 0.05)': 'var(--glass-bg)',
        'rgba(255, 255, 255, 0.08)': 'var(--glass-bg)',
        'rgba(0, 0, 0, 0.1)': 'var(--glass-bg)',
        '#6366f1': 'var(--brand-primary)',
        '#a855f7': 'var(--brand-accent)',
        '#3b82f6': 'var(--chart-blue)',
        '#22c55e': 'var(--chart-green)',
        '#0f111a': 'var(--bg-main)',
        '#1a1d2d': 'var(--bg-card)',
        '#0b0d14': 'var(--bg-sidebar)',
        '#1f2937': 'var(--border-glass)',
        'rgba(99, 102, 241': 'rgba(124, 58, 237',
        'rgba(168, 85, 247': 'rgba(168, 85, 247',
        '--accent-blue': '--chart-blue',
        '--accent-green': '--chart-green'
    };
    
    for (const [oldVal, newVal] of Object.entries(replacements)) {
        result = result.split(oldVal).join(newVal);
    }
    
    const authReplacements = {
        '--auth-bg': '--bg-main',
        '--auth-panel-dark': '--bg-sidebar',
        '--auth-card-bg': '--bg-card',
        '--auth-card-border': '--border-glass',
        '--auth-primary:': '--brand-primary:',
        '--auth-primary-2': '--brand-secondary',
        '--auth-accent:': '--brand-accent:',
        '--auth-accent-2': '--chart-cyan',
        '--auth-glow': '--brand-glow',
        '--auth-glow-cyan': '--chart-cyan',
        '--auth-text': '--text-primary',
        '--auth-text-muted': '--text-secondary',
        '--auth-error': '--genre-action',
        '--auth-success': '--chart-green',
        '--auth-input-bg': '--glass-bg',
        '--auth-input-border': '--border-glass',
        '--auth-divider': '--border-glass'
    };
    for (const [oldVal, newVal] of Object.entries(authReplacements)) {
        result = result.split(oldVal).join(newVal);
    }

    return result;
}

const stylePath = path.resolve('apps/web/public/css/style.css');
let styleContent = fs.readFileSync(stylePath, 'utf8');

const rootRegex = /:root\s*\{[^}]+\}/m;
styleContent = styleContent.replace(rootRegex, cssRoot);
styleContent = replaceColors(styleContent);

// Specific rules for navbar
styleContent = styleContent.replace(/background: rgba\(15, 17, 26, 0\.7\);/g, 'background: rgba(11,12,19,0.7);');
styleContent = styleContent.replace(/backdrop-filter: blur\(10px\) saturate\(180%\);/g, 'backdrop-filter: blur(12px) saturate(180%);');

// Generic rule applied to all
styleContent = styleContent.replace(/border-radius: var\(--radius-lg\);/g, 'border-radius: 16px;');
styleContent = styleContent.replace(/border-radius: 12px;/g, 'border-radius: 16px;');

fs.writeFileSync(stylePath, styleContent, 'utf8');

const authPath = path.resolve('apps/web/public/css/auth.css');
let authContent = fs.readFileSync(authPath, 'utf8');
const authRootRegex = /:root\s*\{[^}]+\}/m;
authContent = authContent.replace(authRootRegex, '');
authContent = replaceColors(authContent);
fs.writeFileSync(authPath, authContent, 'utf8');

console.log('Script executed successfully');
