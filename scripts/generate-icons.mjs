import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Simple CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk("IHDR", ihdr);

  // Raw image data: scanline format: 1 byte filter type (0) + width * 4 bytes RGBA
  const rawBytes = Buffer.alloc(height * (1 + width * 4));

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * (isMaskable ? 0.48 : 0.42);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background
      let r = 23, g = 43, b = 98, a = 255; // #172b62 (UTT Navy)

      if (isMaskable) {
        // Full bleed background for maskable icons
        r = 23; g = 43; b = 98; a = 255;
      } else {
        // Rounded squircle/circle for standard icon
        const cornerRadius = width * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (width * 0.45 - cornerRadius));
        const qy = Math.max(0, Math.abs(dy) - (height * 0.45 - cornerRadius));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);

        if (cornerDist > cornerRadius) {
          // Transparent outside squircle
          r = 0; g = 0; b = 0; a = 0;
        }
      }

      if (a > 0) {
        // Inner badge: rounded shield / clipboard
        const cardW = width * 0.48;
        const cardH = height * 0.55;
        const cardLeft = centerX - cardW / 2;
        const cardRight = centerX + cardW / 2;
        const cardTop = centerY - cardH / 2 + (height * 0.04);
        const cardBottom = centerY + cardH / 2 + (height * 0.04);

        if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
          // Inner card background: #3156d3
          r = 49; g = 86; b = 211;

          // Border highlight
          if (x <= cardLeft + 2 || x >= cardRight - 2 || y <= cardTop + 2 || y >= cardBottom - 2) {
            r = 138; g = 180; b = 248;
          }

          // Clipboard clip at the top
          const clipW = width * 0.22;
          const clipH = height * 0.1;
          const clipLeft = centerX - clipW / 2;
          const clipRight = centerX + clipW / 2;
          const clipTop = cardTop - height * 0.05;
          const clipBottom = cardTop + height * 0.05;

          if (x >= clipLeft && x <= clipRight && y >= clipTop && y <= clipBottom) {
            r = 255; g = 255; b = 255;
          }

          // Checkmark / lines inside clipboard
          // Inspection checklist lines:
          const line1Y = cardTop + cardH * 0.32;
          const line2Y = cardTop + cardH * 0.52;
          const line3Y = cardTop + cardH * 0.72;

          const checkW = width * 0.28;
          if (Math.abs(y - line1Y) <= width * 0.02 && x >= centerX - checkW / 2 && x <= centerX + checkW / 2) {
            r = 255; g = 255; b = 255; // white line
          }
          if (Math.abs(y - line2Y) <= width * 0.02 && x >= centerX - checkW / 2 && x <= centerX + checkW / 2) {
            r = 255; g = 255; b = 255; // white line
          }
          if (Math.abs(y - line3Y) <= width * 0.02 && x >= centerX - checkW / 2 && x <= centerX + checkW / 2) {
            r = 230; g = 235; b = 255; // lighter line
          }

          // Checkmark accent on first line
          const checkX = centerX - checkW / 2 - width * 0.04;
          if (Math.abs(x - checkX) <= width * 0.02 && Math.abs(y - line1Y) <= height * 0.02) {
            r = 52; g = 211; b = 153; // green checkmark (#34d399)
          }
          if (Math.abs(x - checkX) <= width * 0.02 && Math.abs(y - line2Y) <= height * 0.02) {
            r = 52; g = 211; b = 153; // green checkmark (#34d399)
          }
        }
      }

      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const idatData = deflateSync(rawBytes);
  const idatChunk = createChunk("IDAT", idatData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = resolve(process.cwd(), "public/icons");
mkdirSync(iconsDir, { recursive: true });

const icon192 = createPng(192, 192, false);
writeFileSync(resolve(iconsDir, "icon-192x192.png"), icon192);

const icon192Maskable = createPng(192, 192, true);
writeFileSync(resolve(iconsDir, "icon-192x192-maskable.png"), icon192Maskable);

const icon512 = createPng(512, 512, false);
writeFileSync(resolve(iconsDir, "icon-512x512.png"), icon512);

const icon512Maskable = createPng(512, 512, true);
writeFileSync(resolve(iconsDir, "icon-512x512-maskable.png"), icon512Maskable);

const appleTouchIcon = createPng(180, 180, false);
writeFileSync(resolve(iconsDir, "apple-touch-icon.png"), appleTouchIcon);

console.log("Icons generated successfully in public/icons/");
