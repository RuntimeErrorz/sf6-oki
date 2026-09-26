import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 1. Build project
console.log('Building dist...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Ensure .nojekyll in dist
fs.writeFileSync(path.join('dist', '.nojekyll'), '');

// 3. Init git inside dist and push to gh-pages branch
const distDir = path.resolve('dist');
process.chdir(distDir);

execSync('git init -b gh-pages', { stdio: 'inherit' });
execSync('git add -A', { stdio: 'inherit' });
execSync('git commit -m "deploy: GitHub Pages release"', { stdio: 'inherit' });
execSync('git remote add origin https://github.com/RuntimeErrorz/sf6-oki.git', { stdio: 'inherit' });
execSync('git push -f origin gh-pages', { stdio: 'inherit' });

console.log('Successfully deployed to gh-pages branch!');
