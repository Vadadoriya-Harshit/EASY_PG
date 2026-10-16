const fs = require('fs');
const zlib = require('zlib');

function readPng(filepath) {
  const buf = fs.readFileSync(filepath);
  let pos = 8;
  let idatChunks = [];
  let width, height, bitDepth, colorType;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  
  // Unfilter scanlines (type 6 = RGBA)
  const bpp = 4;
  const stride = 1 + width * bpp;
  const rawData = Buffer.alloc(width * height * 4);
  
  let prevRow = Buffer.alloc(width * bpp);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    const filter = decompressed[rowStart];
    const currentRow = Buffer.alloc(width * bpp);
    
    for (let x = 0; x < width * bpp; x++) {
      const orig = decompressed[rowStart + 1 + x];
      const a = x >= bpp ? currentRow[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      
      let val = 0;
      if (filter === 0) val = orig;
      else if (filter === 1) val = (orig + a) & 0xff;
      else if (filter === 2) val = (orig + b) & 0xff;
      else if (filter === 3) val = (orig + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
        val = (orig + pr) & 0xff;
      }
      currentRow[x] = val;
      rawData[y * width * 4 + x] = val;
    }
    prevRow = currentRow;
  }
  
  return { width, height, data: rawData };
}

function writePng(filepath, width, height, rgbaBuffer) {
  // Simple uncompressed / deflated filter=0 PNG
  const stride = 1 + width * 4;
  const scanlines = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    scanlines[y * stride] = 0; // Filter None
    rgbaBuffer.copy(scanlines, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  
  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }
  
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const outBuf = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
  
  fs.writeFileSync(filepath, outBuf);
}

const { width, height, data } = readPng('public/images/luxora-logo.png');

// 1. Transparent version (light mode / neutral)
const transparentData = Buffer.from(data);
for (let i = 0; i < transparentData.length; i += 4) {
  const r = transparentData[i];
  const g = transparentData[i + 1];
  const b = transparentData[i + 2];
  
  // Measure distance from pure white (255, 255, 255)
  const minC = Math.min(r, g, b);
  if (minC > 240) {
    // Smooth alpha fade
    const diff = 255 - minC;
    transparentData[i + 3] = Math.min(255, Math.max(0, Math.round((diff / 15) * 255)));
  }
}
writePng('public/images/luxora-logo-transparent.png', width, height, transparentData);

// 2. Dark mode transparent version:
// Dark pixels (navy/black) become pure crisp white / platinum (#F8FAFC), gold stays golden!
const darkData = Buffer.from(transparentData);
for (let i = 0; i < darkData.length; i += 4) {
  const a = darkData[i + 3];
  if (a > 0) {
    const r = darkData[i];
    const g = darkData[i + 1];
    const b = darkData[i + 2];
    
    // Check if it's dark navy/charcoal (L and LUXORA PG) vs Gold (G and tagline)
    // Gold has noticeably higher R and G than B (e.g. R ~ 180-210, G ~ 140-170, B ~ 40-70)
    const isGold = (r > 130 && g > 100 && r > b + 40);
    if (!isGold) {
      // Dark text -> brighten to luxury crisp titanium/white (#F1F5F9)
      const brightness = (r + g + b) / 3;
      if (brightness < 120) {
        darkData[i] = 248;
        darkData[i + 1] = 250;
        darkData[i + 2] = 252;
      }
    } else {
      // Boost gold glow slightly for dark mode vibrancy
      darkData[i] = Math.min(255, Math.round(r * 1.15));
      darkData[i + 1] = Math.min(255, Math.round(g * 1.1));
      darkData[i + 2] = Math.max(0, Math.round(b * 0.9));
    }
  }
}
writePng('public/images/luxora-logo-dark.png', width, height, darkData);

console.log('Successfully generated transparent and dark mode logos!');

// Find bounds of the emblem (top section)
let top = height, bottom = 0, left = width, right = 0;
// We know emblem is in the upper half (e.g. y: 200 to 550)
for (let y = 150; y < 550; y++) {
  for (let x = 0; x < width; x++) {
    const alpha = transparentData[(y * width + x) * 4 + 3];
    if (alpha > 30) {
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
}

console.log('Emblem bounds:', { top, bottom, left, right, w: right - left, h: bottom - top });

// Create square emblem with padding
const pad = 24;
const emblemW = (right - left) + pad * 2;
const emblemH = (bottom - top) + pad * 2;
const size = Math.max(emblemW, emblemH);
const offX = Math.round((size - (right - left)) / 2);
const offY = Math.round((size - (bottom - top)) / 2);

function cropEmblem(srcBuffer, outPath) {
  const emblemBuf = Buffer.alloc(size * size * 4);
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const srcIdx = (y * width + x) * 4;
      const destX = (x - left) + offX;
      const destY = (y - top) + offY;
      const destIdx = (destY * size + destX) * 4;
      srcBuffer.copy(emblemBuf, destIdx, srcIdx, srcIdx + 4);
    }
  }
  writePng(outPath, size, size, emblemBuf);
}

cropEmblem(transparentData, 'public/images/luxora-emblem.png');
cropEmblem(darkData, 'public/images/luxora-emblem-dark.png');
console.log('Cropped emblem generated at size:', size);

// Also crop the entire full logo (emblem + text + tagline) without excessive whitespace padding!
let fTop = height, fBottom = 0, fLeft = width, fRight = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const alpha = transparentData[(y * width + x) * 4 + 3];
    if (alpha > 30) {
      if (y < fTop) fTop = y;
      if (y > fBottom) fBottom = y;
      if (x < fLeft) fLeft = x;
      if (x > fRight) fRight = x;
    }
  }
}
console.log('Full logo bounds:', { fTop, fBottom, fLeft, fRight, w: fRight - fLeft, h: fBottom - fTop });

const fPadX = 16;
const fPadY = 16;
const fullW = (fRight - fLeft) + fPadX * 2;
const fullH = (fBottom - fTop) + fPadY * 2;

function cropFull(srcBuffer, outPath) {
  const fullBuf = Buffer.alloc(fullW * fullH * 4);
  for (let y = fTop; y <= fBottom; y++) {
    for (let x = fLeft; x <= fRight; x++) {
      const srcIdx = (y * width + x) * 4;
      const destX = (x - fLeft) + fPadX;
      const destY = (y - fTop) + fPadY;
      const destIdx = (destY * fullW + destX) * 4;
      srcBuffer.copy(fullBuf, destIdx, srcIdx, srcIdx + 4);
    }
  }
  writePng(outPath, fullW, fullH, fullBuf);
}

cropFull(transparentData, 'public/images/luxora-logo-clean.png');
cropFull(darkData, 'public/images/luxora-logo-clean-dark.png');
console.log('Clean full logos generated: size', fullW, 'x', fullH);


