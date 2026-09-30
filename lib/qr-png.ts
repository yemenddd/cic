import { deflateSync } from 'node:zlib';
import { qrMatrix, type ErrorCorrection } from '@/lib/qr';

/**
 * A QR symbol as a PNG.
 *
 * The platform draws QR codes as inline SVG everywhere else, which is the
 * right choice on a page — it is geometry, it scales, it costs no request.
 * Mail is the exception: Gmail does not render SVG in an <img> at all, and an
 * inline <svg> element is stripped outright. A scanner at the door reads what
 * the mail client actually drew, so the badge in an email has to be a raster.
 *
 * Written here rather than pulled from a package. A QR is a grid of black and
 * white squares, PNG is a filtered bitmap wrapped in zlib, and node has zlib —
 * so this is about fifty lines against a dependency that would ship a whole
 * image library to render eight colours' worth of nothing.
 */

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** CRC-32, which every PNG chunk ends with. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export interface QrPngOptions {
  /** Error correction. 'Q' for anything printed or photographed off a screen. */
  correction?: ErrorCorrection;
  /** Pixels per QR module. */
  scale?: number;
  /** Quiet zone in modules — below 2 the symbol starts failing against a busy background. */
  margin?: number;
}

export function qrPng(value: string, opts: QrPngOptions = {}): Buffer {
  const { correction = 'Q', scale = 8, margin = 3 } = opts;

  const matrix = qrMatrix(value, correction);
  const modules = matrix.size + margin * 2;
  const side = modules * scale;

  // 8-bit greyscale, one byte per pixel, each row prefixed with filter type 0.
  const stride = side + 1;
  const raw = Buffer.alloc(stride * side, 0xff);
  for (let y = 0; y < side; y++) raw[y * stride] = 0;

  for (let my = 0; my < matrix.size; my++) {
    for (let mx = 0; mx < matrix.size; mx++) {
      if (!matrix.dark[my][mx]) continue;
      const x0 = (mx + margin) * scale;
      const y0 = (my + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        const row = (y0 + dy) * stride + 1 + x0;
        raw.fill(0x00, row, row + scale);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0);
  ihdr.writeUInt32BE(side, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // colour type: greyscale
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
