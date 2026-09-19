import { qrMatrix, qrPath, type ErrorCorrection } from '@/lib/qr';

/**
 * A QR symbol as inline SVG. No 'use client' — it is pure geometry, so it
 * renders on the server and ships as markup rather than as a script that has
 * to run before the attendee's badge has a code on it.
 *
 * Deliberately fixed to black on white regardless of theme. A QR reader looks
 * for contrast between dark and light modules, and a symbol tinted to match a
 * dark UI is one a scanner may refuse outright — the badge has to work at the
 * door, not match the page it is shown on.
 */
export default function QRCode({
  value,
  size = 160,
  correction = 'M',
  /** Quiet zone, in modules. Below 2 the symbol starts failing on busy pages. */
  margin = 2,
  title,
  className,
}: {
  value: string;
  size?: number;
  correction?: ErrorCorrection;
  margin?: number;
  title?: string;
  className?: string;
}) {
  const matrix = qrMatrix(value, correction);
  const extent = matrix.size + margin * 2;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${extent} ${extent}`}
      // Modules are whole units in this space, so anti-aliasing between them
      // is nothing but blur at the exact place a decoder measures.
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? 'رمز QR'}
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      <g transform={`translate(${margin} ${margin})`}>
        <path d={qrPath(matrix)} fill="#0f172a" />
      </g>
    </svg>
  );
}
