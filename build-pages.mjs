import fs from 'node:fs';
fs.mkdirSync('docs',{recursive:true});
fs.cpSync('dist','docs',{recursive:true});
fs.writeFileSync('docs/.nojekyll','');
console.log('GitHub Pages output ready in docs/');
