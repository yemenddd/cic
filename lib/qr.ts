import qrcode from 'qrcode-generator';

/**
 * QR generation, reduced to the one thing the platform needs: a grid of
 * dark/light modules that a component can draw as SVG.
 *
 * SVG rather than a PNG data URL because the badge is printed as often as it
 * is shown on a phone, and a rasterised QR blurs at print resolution — a blur
 * in a finder pattern is a badge that will not scan at the door. Vector
 * modules stay square at any size, and cost nothing to embed.
 *
 * Byte mode is the encoder's default and assumes latin-1, so everything passed
 * through here must be ASCII. That holds: the only thing encoded is a badge
 * token, which is `CICT1.<cuid>.<base64url>`.
 */

export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QRMatrix {
  /** Modules per side, excluding the quiet zone. */
  size: number;
  /** `dark[row][col]` — true where a module is painted. */
  dark: boolean[][];
}

/**
 * Level M by default: ~15% of the symbol can be obscured and still decode,
 * which covers a thumb over one corner and the print smudges a badge picks up
 * in a lanyard. Level H would tolerate more but grows the symbol, and a bigger
 * symbol is harder for a phone camera to resolve at arm's length.
 */
export function qrMatrix(text: string, correction: ErrorCorrection = 'M'): QRMatrix {
  // 0 lets the encoder pick the smallest version that fits the payload.
  const qr = qrcode(0, correction);
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  const dark = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => qr.isDark(row, col)),
  );

  return { size, dark };
}

/**
 * The whole symbol as one SVG path, in a 1-unit-per-module coordinate space.
 *
 * Horizontally adjacent modules are merged into a single run before being
 * emitted. One path with ~200 sub-paths renders as one element; 700 separate
 * `<rect>`s is the same picture at several times the DOM cost, on a page the
 * admin panel re-renders for every row of a scan feed.
 */
export function qrPath({ size, dark }: QRMatrix): string {
  const parts: string[] = [];

  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!dark[row][col]) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < size && dark[row][col + run]) run++;
      parts.push(`M${col} ${row}h${run}v1h-${run}z`);
      col += run;
    }
  }

  return parts.join('');
}
