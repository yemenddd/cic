'use client';

import type React from 'react';
import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
  fadeIn: { start: number; end: number };
  fadeOut: { start: number; end: number };
}
interface BlurSettings {
  blurIn: { start: number; end: number };
  blurOut: { start: number; end: number };
  maxBlur: number;
}
interface InfiniteGalleryProps {
  images: ImageItem[];
  speed?: number;
  zSpacing?: number;
  visibleCount?: number;
  falloff?: { near: number; far: number };
  fadeSettings?: FadeSettings;
  blurSettings?: BlurSettings;
  className?: string;
  style?: React.CSSProperties;
}
interface PlaneData {
  index: number;
  z: number;
  imageIndex: number;
  x: number;
  y: number;
}

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;

const createClothMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normal;
        vec3 pos = position;
        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = sin(wavePhase) * 0.1 * dampening;
          flagWave += sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
        }
        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(map, vUv);
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        color.rgb += vec3(abs(scrollForce) * 0.05 * 0.1);
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  });

function ImagePlane({ texture, position, scale, material }: {
  texture: THREE.Texture;
  position: [number, number, number];
  scale: [number, number, number];
  material: THREE.ShaderMaterial;
}) {
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => { if (material) material.uniforms.map.value = texture; }, [material, texture]);
  useEffect(() => { if (material?.uniforms) material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0; }, [material, isHovered]);
  return (
    <mesh position={position} scale={scale} material={material}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}>
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  );
}

function GalleryScene({ images, speed = 1, visibleCount = 8, fadeSettings, blurSettings }: Omit<InfiniteGalleryProps, 'className' | 'style'> & { fadeSettings: FadeSettings; blurSettings: BlurSettings }) {
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const lastInteraction = useRef(Date.now());

  const normalizedImages = useMemo(
    () => images.map((img) => typeof img === 'string' ? { src: img, alt: '' } : img),
    [images]
  );
  const textures = useTexture(normalizedImages.map((img) => img.src));
  const materials = useMemo(
    () => Array.from({ length: visibleCount! }, () => createClothMaterial()),
    [visibleCount]
  );

  const spatialPositions = useMemo(() => {
    return Array.from({ length: visibleCount! }, (_, i) => {
      const hAngle = (i * 2.618) % (Math.PI * 2);
      const vAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);
      const hRadius = (i % 3) * 1.2;
      const vRadius = ((i + 1) % 4) * 0.8;
      return {
        x: (Math.sin(hAngle) * hRadius * MAX_HORIZONTAL_OFFSET) / 3,
        y: (Math.cos(vAngle) * vRadius * MAX_VERTICAL_OFFSET) / 4,
      };
    });
  }, [visibleCount]);

  const totalImages = normalizedImages.length;
  const depthRange = DEFAULT_DEPTH_RANGE;

  const planesData = useRef<PlaneData[]>(
    Array.from({ length: visibleCount! }, (_, i) => ({
      index: i,
      z: visibleCount! > 0 ? ((depthRange / visibleCount!) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }))
  );

  const touchStartY = useRef(0);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScrollVelocity((p) => p + e.deltaY * 0.01 * speed!);
    setAutoPlay(false);
    lastInteraction.current = Date.now();
  }, [speed]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      setScrollVelocity((p) => p - 2 * speed!);
      setAutoPlay(false); lastInteraction.current = Date.now();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      setScrollVelocity((p) => p + 2 * speed!);
      setAutoPlay(false); lastInteraction.current = Date.now();
    }
  }, [speed]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const deltaY = touchStartY.current - e.touches[0].clientY;
    touchStartY.current = e.touches[0].clientY;
    setScrollVelocity((p) => p + deltaY * 0.06 * speed!);
    setAutoPlay(false);
    lastInteraction.current = Date.now();
  }, [speed]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchMove]);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastInteraction.current > 3000) setAutoPlay(true);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useFrame((state, delta) => {
    if (autoPlay) setScrollVelocity((p) => p + 0.3 * delta);
    setScrollVelocity((p) => p * 0.95);
    const time = state.clock.getElapsedTime();
    materials.forEach((m) => { if (m?.uniforms) { m.uniforms.time.value = time; m.uniforms.scrollForce.value = scrollVelocity; } });

    const imageAdvance = totalImages > 0 ? visibleCount! % totalImages || totalImages : 0;
    const halfRange = depthRange / 2;

    planesData.current.forEach((plane, i) => {
      let newZ = plane.z + scrollVelocity * delta * 10;
      let wrapsForward = 0; let wrapsBackward = 0;
      if (newZ >= depthRange) { wrapsForward = Math.floor(newZ / depthRange); newZ -= depthRange * wrapsForward; }
      else if (newZ < 0) { wrapsBackward = Math.ceil(-newZ / depthRange); newZ += depthRange * wrapsBackward; }
      if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) plane.imageIndex = (plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
      if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) { const s = plane.imageIndex - wrapsBackward * imageAdvance; plane.imageIndex = ((s % totalImages) + totalImages) % totalImages; }
      plane.z = ((newZ % depthRange) + depthRange) % depthRange;
      plane.x = spatialPositions[i]?.x ?? 0;
      plane.y = spatialPositions[i]?.y ?? 0;

      const normalizedPosition = plane.z / depthRange;
      let opacity = 1;
      if (normalizedPosition >= fadeSettings.fadeIn.start && normalizedPosition <= fadeSettings.fadeIn.end) {
        opacity = (normalizedPosition - fadeSettings.fadeIn.start) / (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
      } else if (normalizedPosition < fadeSettings.fadeIn.start) {
        opacity = 0;
      } else if (normalizedPosition >= fadeSettings.fadeOut.start && normalizedPosition <= fadeSettings.fadeOut.end) {
        opacity = 1 - (normalizedPosition - fadeSettings.fadeOut.start) / (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
      } else if (normalizedPosition > fadeSettings.fadeOut.end) {
        opacity = 0;
      }
      opacity = Math.max(0, Math.min(1, opacity));

      let blur = 0;
      if (normalizedPosition >= blurSettings.blurIn.start && normalizedPosition <= blurSettings.blurIn.end) {
        blur = blurSettings.maxBlur * (1 - (normalizedPosition - blurSettings.blurIn.start) / (blurSettings.blurIn.end - blurSettings.blurIn.start));
      } else if (normalizedPosition < blurSettings.blurIn.start) {
        blur = blurSettings.maxBlur;
      } else if (normalizedPosition >= blurSettings.blurOut.start && normalizedPosition <= blurSettings.blurOut.end) {
        blur = blurSettings.maxBlur * ((normalizedPosition - blurSettings.blurOut.start) / (blurSettings.blurOut.end - blurSettings.blurOut.start));
      } else if (normalizedPosition > blurSettings.blurOut.end) {
        blur = blurSettings.maxBlur;
      }
      blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

      const m = materials[i];
      if (m?.uniforms) { m.uniforms.opacity.value = opacity; m.uniforms.blurAmount.value = blur; }
    });
  });

  if (normalizedImages.length === 0) return null;

  return (
    <>
      {planesData.current.map((plane, i) => {
        const texture = textures[plane.imageIndex];
        const material = materials[i];
        if (!texture || !material) return null;
        const aspect = texture.image ? (texture.image as any).width / (texture.image as any).height : 1;
        const scale: [number, number, number] = aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1];
        return (
          <ImagePlane key={plane.index} texture={texture}
            position={[plane.x, plane.y, plane.z - depthRange / 2]}
            scale={scale} material={material} />
        );
      })}
    </>
  );
}

function FallbackGallery({ images }: { images: ImageItem[] }) {
  const items = useMemo(() => images.map((img) => typeof img === 'string' ? { src: img, alt: '' } : img), [images]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto h-full">
      {items.map((img, i) => <img key={i} src={img.src} alt={img.alt} className="w-full h-40 object-cover rounded-xl" />)}
    </div>
  );
}

export default function InfiniteGallery({
  images,
  className = 'h-screen w-full',
  style,
  speed = 1,
  visibleCount = 10,
  fadeSettings = { fadeIn: { start: 0.05, end: 0.25 }, fadeOut: { start: 0.4, end: 0.43 } },
  blurSettings = { blurIn: { start: 0.0, end: 0.1 }, blurOut: { start: 0.4, end: 0.43 }, maxBlur: 8.0 },
}: InfiniteGalleryProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch { setWebglSupported(false); }
  }, []);

  if (!webglSupported) return <div className={className} style={style}><FallbackGallery images={images} /></div>;

  return (
    <div className={className} style={style}>
      <Canvas camera={{ position: [0, 0, 0], fov: 55 }} gl={{ antialias: true, alpha: true }}>
        <GalleryScene images={images} speed={speed} visibleCount={visibleCount} fadeSettings={fadeSettings} blurSettings={blurSettings} />
      </Canvas>
    </div>
  );
}
