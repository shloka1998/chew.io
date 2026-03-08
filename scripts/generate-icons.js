// Generate simple PWA icons using canvas
const { createCanvas } = (() => {
  try {
    return require('canvas');
  } catch {
    return { createCanvas: null };
  }
})();
const fs = require('fs');
const path = require('path');

function generateSVGIcon(size) {
  const padding = size * 0.15;
  const plateR = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#EA580C"/>
  <circle cx="${cx}" cy="${cy}" r="${plateR}" fill="none" stroke="white" stroke-width="${size * 0.03}"/>
  <circle cx="${cx}" cy="${cy}" r="${plateR * 0.6}" fill="none" stroke="white" stroke-width="${size * 0.02}" opacity="0.6"/>
  <text x="${cx}" y="${cy + size * 0.03}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white">C</text>
  <text x="${cx}" y="${cy + plateR + size * 0.08}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.06}" fill="white" opacity="0.9">chew.io</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Generate SVG icons (will be served as-is, or we can convert)
[192, 512].forEach(size => {
  const svg = generateSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});

// Also create a simple HTML-renderable favicon
const faviconSvg = generateSVGIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('Generated favicon.svg');
