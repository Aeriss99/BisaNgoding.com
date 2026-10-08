const fs = require('fs');

let css = fs.readFileSync('src/styles/ikon-api.css', 'utf8');

// I need to extract SVG from designs to wrap them properly
const file = 'src/styles/progres-baru.css';
let baseCss = fs.readFileSync(file, 'utf8');

// Add the colors for icons
baseCss += '\n' + css;

// Write it back
fs.writeFileSync(file, baseCss);
