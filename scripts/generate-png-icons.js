const fs = require('fs');
const path = require('path');

// Create a minimal valid PNG with a solid orange color and "AS" text
// Since we don't have canvas, we'll create a 1x1 orange PNG and use it as placeholder
// The real icons should be designed properly

function createMinimalPNG(size) {
  // BMP-style approach: create a simple PNG
  // Using the simplest possible valid PNG format

  const { Buffer } = require('buffer');
  const zlib = require('zlib');

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([length, typeBytes, data, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(2, 9);        // color type (RGB)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace

  // Image data: orange (#EA580C) with a white circle and text area
  const rowBytes = 1 + size * 3; // filter byte + RGB
  const rawData = Buffer.alloc(rowBytes * size);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const innerRadius = size * 0.25;
  const cornerRadius = size * 0.2;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if within rounded rectangle
      const inRect = x >= cornerRadius && x < size - cornerRadius && y >= 0 && y < size ||
                     y >= cornerRadius && y < size - cornerRadius && x >= 0 && x < size ||
                     Math.sqrt(Math.pow(x - cornerRadius, 2) + Math.pow(y - cornerRadius, 2)) <= cornerRadius ||
                     Math.sqrt(Math.pow(x - (size - cornerRadius), 2) + Math.pow(y - cornerRadius, 2)) <= cornerRadius ||
                     Math.sqrt(Math.pow(x - cornerRadius, 2) + Math.pow(y - (size - cornerRadius), 2)) <= cornerRadius ||
                     Math.sqrt(Math.pow(x - (size - cornerRadius), 2) + Math.pow(y - (size - cornerRadius), 2)) <= cornerRadius;

      if (!inRect) {
        // Transparent (but PNG RGB, so just use the bg color)
        rawData[px] = 255;
        rawData[px + 1] = 247;
        rawData[px + 2] = 237;
      } else if (Math.abs(dist - radius) < size * 0.02) {
        // White circle outline
        rawData[px] = 255;
        rawData[px + 1] = 255;
        rawData[px + 2] = 255;
      } else if (Math.abs(dist - innerRadius) < size * 0.012) {
        // Inner white circle (thinner)
        rawData[px] = 255;
        rawData[px + 1] = 230;
        rawData[px + 2] = 220;
      } else {
        // Orange background (#EA580C)
        rawData[px] = 234;
        rawData[px + 1] = 88;
        rawData[px + 2] = 12;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idat, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Generate smaller icons (192 would be too big for pure JS PNG generation, let's do it)
[192, 512].forEach(size => {
  const png = createMinimalPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
});

// Also a small favicon
const favicon = createMinimalPNG(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), favicon);
console.log('Generated favicon.ico');
