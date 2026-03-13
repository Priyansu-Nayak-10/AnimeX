const fs = require('fs');
const path = require('path');

const pwaTags = `
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#111116">
    <link rel="apple-touch-icon" href="/images/favicon.png">
</head>`;

const files = [
  'apps/web/index.html',
  'apps/web/pages/app.html',
  'apps/web/pages/reset-password.html',
  'apps/web/pages/signin.html',
  'apps/web/pages/signup.html'
];

for (const file of files) {
  const filepath = path.resolve(__dirname, '..', file);
  try {
    let html = fs.readFileSync(filepath, 'utf8');
    if (!html.includes('manifest.json')) {
      html = html.replace('</head>', pwaTags);
      fs.writeFileSync(filepath, html, 'utf8');
      console.log(`Injected PWA tags into ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}
