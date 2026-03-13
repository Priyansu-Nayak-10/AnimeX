const fs = require('fs');
const path = require('path');

const files = [
    'apps/web/index.html', 
    'apps/web/pages/signin.html', 
    'apps/web/pages/signup.html', 
    'apps/web/pages/app.html', 
    'apps/web/pages/reset-password.html'
];

files.forEach(f => {
    const fullPath = path.resolve(f);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/<meta name="theme-color" content="[^"]+">/g, '<meta name="theme-color" content="#0B0C13">');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${f}`);
    }
});
