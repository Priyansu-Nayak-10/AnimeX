const fs = require('fs');
const path = require('path');

const ROOT = 'e:/VS CODE/ANIMEX 2.0';

// Helper to create dirs safely
function ensureDir(dir) {
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
}

const dirs = [
    'apps/api/src/routes',
    'apps/api/src/services',
    'apps/api/src/middleware',
    'apps/api/src/jobs',
    'apps/api/src/config',
    'apps/api/src/database/migrations',
    'apps/api/src/database/functions',
    'apps/api/src/utils',
    'apps/api/tests',
    'apps/api/logs',
    'apps/web/public/images',
    'apps/web/public/css',
    'apps/web/src/components',
    'apps/web/src/core',
    'apps/web/src/features',
    'apps/web/src/styles',
    'apps/web/pages',
    'packages/shared-ui',
    'packages/shared-config',
    'packages/shared-utils',
    'scripts',
    'docs'
];

dirs.forEach(ensureDir);

function moveFile(src, dest) {
    const fullSrc = path.join(ROOT, src);
    const fullDest = path.join(ROOT, dest);
    if (fs.existsSync(fullSrc)) {
        fs.renameSync(fullSrc, fullDest);
    }
}

function moveDirContents(srcDir, destDir) {
    const fullSrc = path.join(ROOT, srcDir);
    const fullDest = path.join(ROOT, destDir);
    if (fs.existsSync(fullSrc)) {
        const files = fs.readdirSync(fullSrc);
        files.forEach(f => {
            fs.renameSync(path.join(fullSrc, f), path.join(fullDest, f));
        });
    }
}

// -----------------
// 1. BACKEND FILES
// -----------------
moveDirContents('animex-backend/src/api', 'apps/api/src/routes');
moveDirContents('animex-backend/src/middleware', 'apps/api/src/middleware');
moveDirContents('animex-backend/src/jobs', 'apps/api/src/jobs');
moveDirContents('animex-backend/src/config', 'apps/api/src/config');
moveDirContents('animex-backend/src/utils', 'apps/api/src/utils');
moveFile('animex-backend/src/server.js', 'apps/api/src/server.js');

ensureDir('apps/api/src/database/functions');
moveDirContents('animex-backend/src/database/functions', 'apps/api/src/database/functions');
moveFile('animex-backend/src/database/supabase.js', 'apps/api/src/database/supabase.js');

// Remaining database files
const dbDir = path.join(ROOT, 'animex-backend/src/database');
if (fs.existsSync(dbDir)) {
    fs.readdirSync(dbDir).forEach(f => {
        const fullPath = path.join(dbDir, f);
        if (!fs.statSync(fullPath).isDirectory() && f !== 'supabase.js') {
            moveFile(path.join('animex-backend/src/database', f), path.join('apps/api/src/database', f));
        }
    });
}

moveDirContents('animex-backend/tests', 'apps/api/tests');
moveFile('animex-backend/package.json', 'apps/api/package.json');
moveFile('animex-backend/package-lock.json', 'apps/api/package-lock.json');
moveFile('server.log', 'apps/api/logs/server.log');
moveFile('animex-backend/err.log', 'apps/api/logs/err.log');
moveFile('animex-backend/error.log', 'apps/api/logs/error.log');

// -----------------
// 2. FRONTEND FILES
// -----------------
moveDirContents('public/css', 'apps/web/public/css');
moveDirContents('public/images', 'apps/web/public/images');
moveDirContents('public/src/components', 'apps/web/src/components');
moveDirContents('public/src/core', 'apps/web/src/core');
moveDirContents('public/src/modules', 'apps/web/src/features');
moveDirContents('public/src/styles', 'apps/web/src/styles');

['app.js', 'main.js', 'config.js', 'store.js', 'syncService.js', 'socket.js', 'selectors.js'].forEach(f => {
    moveFile(path.join('public/src', f), path.join('apps/web/src', f));
});

['index.html', 'signin.html', 'signup.html', 'reset-password.html', 'app.html'].forEach(f => {
    moveFile(path.join('public', f), path.join('apps/web/pages', f));
});
moveFile('public/sw.js', 'apps/web/sw.js');
moveFile('public/env.js', 'apps/web/env.js');

// -----------------
// 3. ROOT FILES
// -----------------
moveFile('fix.js', 'scripts/fix.js');
moveFile('tree.js', 'scripts/tree.js');

fs.writeFileSync(path.join(ROOT, 'docs/architecture.md'), '# Architecture\n');
fs.writeFileSync(path.join(ROOT, 'docs/api.md'), '# API Documentation\n');
fs.writeFileSync(path.join(ROOT, 'docs/deployment.md'), '# Deployment Guide\n');

fs.writeFileSync(path.join(ROOT, 'packages/shared-ui/animeCard.js'), '// Shared AnimeCard\n');
fs.writeFileSync(path.join(ROOT, 'packages/shared-config/constants.js'), '// Constants\n');
fs.writeFileSync(path.join(ROOT, 'packages/shared-utils/format.js'), '// Format\n');

// Try deleting old empty directories
function removeEmptyDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch (e) {}
    }
}
removeEmptyDir(path.join(ROOT, 'animex-backend'));
removeEmptyDir(path.join(ROOT, 'public'));


// -----------------
// 4. REWRITE IMPORTS & PATHS
// -----------------
function replaceInFiles(dir, replacer, filterExt = ['.js', '.html', '.css', '.sql']) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath, replacer, filterExt);
        } else {
            const ext = path.extname(fullPath);
            if (filterExt.includes(ext) || ext === '') {
                const content = fs.readFileSync(fullPath, 'utf8');
                const newContent = replacer(content, fullPath);
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                }
            }
        }
    });
}

// Backend rewrites
replaceInFiles(path.join(ROOT, 'apps/api/src'), (content, filePath) => {
    let replaced = content;
    replaced = replaced.replace(/['"]\.\/api\//g, "'./routes/");
    replaced = replaced.replace(/['"]\.\.\/api\//g, "'../routes/");
    
    if (filePath.endsWith('server.js')) {
        // Change PUBLIC_DIR resolution
        // Before: path.resolve(__dirname, '..', '..', 'public');  (from src/server.js -> root/public)
        // Now: path.resolve(__dirname, '..', '..', '..', 'web'); (from apps/api/src/server.js -> apps/web)
        replaced = replaced.replace(
            /(PUBLIC_DIR = path\.resolve\(__dirname,.*?'public'\);)/g,
            "WEB_DIR = path.resolve(__dirname, '..', '..', '..', 'apps', 'web');"
        );
        replaced = replaced.replace(/PUBLIC_DIR/g, 'WEB_DIR');
        replaced = replaced.replace(/res\.redirect\(['"]\/signin\.html['"]\)/g, "res.redirect('/pages/signin.html')");
        
        // Ensure /api/ routes are required from ./routes/
        replaced = replaced.replace(/require\(['"]\.\/api\//g, "require('./routes/");
    }
    
    return replaced;
});

// Frontend JS rewrites
replaceInFiles(path.join(ROOT, 'apps/web/src'), (content) => {
    let replaced = content;
    replaced = replaced.replace(/modules\//g, 'features/');
    
    // Redirect replacements
    replaced = replaced.replace(/window\.location\.href\s*=\s*['"]\/signin\.html['"]/g, "window.location.href = '/pages/signin.html'");
    replaced = replaced.replace(/window\.location\.replace\(['"]\/signin\.html['"]\)/g, "window.location.replace('/pages/signin.html')");
    
    replaced = replaced.replace(/window\.location\.href\s*=\s*['"]\/app\.html['"]/g, "window.location.href = '/pages/app.html'");
    replaced = replaced.replace(/window\.location\.replace\(['"]\/app\.html['"]\)/g, "window.location.replace('/pages/app.html')");
    
    replaced = replaced.replace(/window\.location\.href\s*=\s*['"]\/reset-password\.html['"]/g, "window.location.href = '/pages/reset-password.html'");
    replaced = replaced.replace(/window\.location\.replace\(['"]\/reset-password\.html['"]\)/g, "window.location.replace('/pages/reset-password.html')");

    // Fix paths using endsWith checking
    replaced = replaced.replace(/endsWith\(['"]\/signin\.html['"]\)/g, "endsWith('/pages/signin.html')");
    replaced = replaced.replace(/endsWith\(['"]\/app\.html['"]\)/g, "endsWith('/pages/app.html')");

    return replaced;
});

// HTML rewrites
replaceInFiles(path.join(ROOT, 'apps/web/pages'), (content) => {
    let replaced = content;
    replaced = replaced.replace(/href="css\//g, 'href="../public/css/');
    replaced = replaced.replace(/src="images\//g, 'src="../public/images/');
    replaced = replaced.replace(/src="src\//g, 'src="../src/');
    replaced = replaced.replace(/src="sw\.js"/g, 'src="../sw.js"');
    replaced = replaced.replace(/src="env\.js"/g, 'src="../env.js"');
    
    // Update modules -> features in any type="module" tags
    replaced = replaced.replace(/src="..\/src\/modules\//g, 'src="../src/features/');
    
    return replaced;
});

console.log("Migration complete!");
