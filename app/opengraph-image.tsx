import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ASCII-only: Next mirrors this into an HTTP Link preload header for the
// generated image, and non-Latin1 characters there throw a ByteString error.
export const alt = 'CIC - Creativity & Innovation Conference';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  // Satori (which ImageResponse uses) has no built-in Arabic glyphs — without
  // an explicit Arabic-capable font the Arabic text below would render as boxes.
  const thmanyah = await readFile(
    join(process.cwd(), 'public/fonts/ar/thmanyahserifdisplay-Bold.otf'),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0f',
          backgroundImage: 'linear-gradient(135deg, #0d0d0f 0%, #14141a 60%, #1a1424 100%)',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            backgroundImage: 'linear-gradient(90deg, #67e8f9, #60a5fa 50%, #8b5cf6)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}
        >
          CIC
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: 'rgba(255,255,255,0.85)', display: 'flex', fontFamily: 'Thmanyah' }}>
          مؤتمر الإبداع والابتكار
        </div>
        <div style={{ marginTop: 20, fontSize: 26, color: 'rgba(255,255,255,0.45)', display: 'flex', fontFamily: 'Thmanyah' }}>
          2–3 أكتوبر 2026 · إسطنبول
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Thmanyah', data: thmanyah, style: 'normal', weight: 700 }],
    },
  );
}
