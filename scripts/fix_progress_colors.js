const fs = require('fs');
const path = require('path');

const filePath = 'e:/VS CODE/ANIMEX/apps/web/src/features/library/libraryUI.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/stop-color="#5bb3ff"/g, 'stop-color="var(--chart-blue)"');
content = content.replace(/stop-color="#a78bfa"/g, 'stop-color="var(--chart-purple)"');
content = content.replace(/stop-color="#34d399"/g, 'stop-color="var(--chart-green)"');

fs.writeFileSync(filePath, content);
console.log('Progress ring colors updated.');
