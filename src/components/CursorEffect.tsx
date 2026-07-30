import { useEffect, useRef, useState } from 'react';

export function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Never enable on touch devices — a trailing cursor effect makes no sense
    // without a mouse, and could otherwise interfere with tap interactions.
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    const onDown = () => ringRef.current?.classList.add('klaso-cursor-active');
    const onUp = () => ringRef.current?.classList.remove('klaso-cursor-active');

    const animate = () => {
      // Smoothly ease the ring toward the dot's true position — the trailing effect.
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        .klaso-cursor-dot, .klaso-cursor-ring {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999;
          border-radius: 9999px;
          will-change: transform;
        }
        .klaso-cursor-dot {
          width: 6px;
          height: 6px;
          margin: -3px 0 0 -3px;
          background: #009CDE;
          box-shadow: 0 0 8px 2px rgba(0, 156, 222, 0.55);
        }
        .klaso-cursor-ring {
          width: 32px;
          height: 32px;
          margin: -16px 0 0 -16px;
          border: 1.5px solid rgba(0, 156, 222, 0.45);
          box-shadow: 0 0 14px 2px rgba(0, 156, 222, 0.18);
          transition: width 0.2s ease, height 0.2s ease, margin 0.2s ease, border-color 0.2s ease;
        }
        .klaso-cursor-ring.klaso-cursor-active {
          width: 24px;
          height: 24px;
          margin: -12px 0 0 -12px;
          border-color: rgba(0, 48, 135, 0.6);
        }
        @media (prefers-reduced-motion: reduce) {
          .klaso-cursor-dot, .klaso-cursor-ring { display: none; }
        }
      `}</style>
      <div ref={dotRef} className="klaso-cursor-dot" />
      <div ref={ringRef} className="klaso-cursor-ring" />
    </>
  );
}
