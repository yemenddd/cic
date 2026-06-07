'use client';

import React, { HTMLAttributes } from 'react';

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

export interface GalleryItem {
  label:    string;
  sublabel: string;
  photo: {
    url:  string;
    text: string;
    pos?: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items:    GalleryItem[];
  radius?:  number;
  /** Rotation angle in degrees — driven externally by scroll */
  rotation: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 520, rotation, ...props }, ref) => {
    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn('relative w-full h-full flex items-center justify-center', className)}
        style={{ perspective: '1800px' }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle    = i * anglePerItem;
            const totalRot     = rotation % 360;
            const relAngle     = (itemAngle + totalRot + 360) % 360;
            const normAngle    = relAngle > 180 ? 360 - relAngle : relAngle;
            const opacity      = Math.max(0.15, 1 - normAngle / 180);
            const isVisible    = normAngle < 90;

            return (
              <div
                key={item.photo.url + i}
                role="group"
                aria-label={item.label}
                className="absolute w-[270px] h-[360px]"
                style={{
                  transform:   `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left:        '50%',
                  top:         '50%',
                  marginLeft:  '-135px',
                  marginTop:   '-180px',
                  opacity,
                  transition:  'opacity 0.25s linear',
                  pointerEvents: isVisible ? 'auto' : 'none',
                }}
              >
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* Photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: item.photo.pos ?? 'center' }}
                  />

                  {/* Ambient dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[15px] font-bold text-white leading-snug">{item.label}</h3>
                    <p className="text-[11px] text-white/60 mt-0.5 italic">{item.sublabel}</p>
                  </div>

                  {/* Shine on front-facing cards */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      opacity: Math.max(0, 1 - normAngle / 60) * 0.12,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';
export { CircularGallery };
