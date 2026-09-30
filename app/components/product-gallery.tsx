"use client";

import { useEffect, useRef, useState } from "react";
import { optimizedImage } from "@/app/lib/images";

const hideScrollbar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const SWIPE_PX = 50;

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const count = images.length;
  const many = count > 1;
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  // While a thumbnail/arrow click is smooth-scrolling, ignore the in-between scroll
  // events so the counter and highlight jump straight to the target photo.
  const targetRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; swiped: boolean }>({ x: 0, swiped: false });

  // Never leave the page scroll-locked if we unmount while the zoom is open.
  useEffect(() => () => {
    document.body.style.overflow = "";
  }, []);

  function goTo(i: number, instant = false) {
    const el = stripRef.current;
    if (!el || count === 0) return;
    const next = (i + count) % count;
    setIndex(next);
    const left = next * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 1) return;
    if (instant) {
      el.scrollTo({ left, behavior: "auto" });
      return;
    }
    targetRef.current = next;
    el.scrollTo({ left, behavior: "smooth" });
  }

  function handleScroll() {
    const el = stripRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (targetRef.current !== null) {
      if (i === targetRef.current) targetRef.current = null;
      return;
    }
    if (i !== index) setIndex(i);
  }

  function openZoom() {
    setZoomed(false);
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function closeZoom() {
    dialogRef.current?.close();
  }

  // Fires for the close button and for Esc alike.
  function handleClosed() {
    setZoomed(false);
    document.body.style.overflow = "";
  }

  function zoomTo(i: number) {
    setZoomed(false);
    goTo(i, true);
  }

  function toggleZoom() {
    setZoomed(!zoomed);
    // Once the bigger image has laid out, start in the middle of it.
    requestAnimationFrame(() => {
      const el = panRef.current;
      if (!el) return;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, swiped: false };
  }

  function handlePointerUp(e: React.PointerEvent) {
    const dx = e.clientX - dragRef.current.x;
    if (!zoomed && many && Math.abs(dx) > SWIPE_PX) {
      dragRef.current.swiped = true;
      zoomTo(dx < 0 ? index + 1 : index - 1);
    }
  }

  function handleZoomClick() {
    if (dragRef.current.swiped) {
      dragRef.current.swiped = false; // that gesture was a swipe, not a tap
      return;
    }
    toggleZoom();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!many) return;
    if (e.key === "ArrowRight") zoomTo(index + 1);
    if (e.key === "ArrowLeft") zoomTo(index - 1);
  }

  function altFor(i: number) {
    return many ? `${name}, photo ${i + 1} of ${count}` : name;
  }

  const thumbs = (
    <>
      {images.map((url, i) => (
        <button
          key={url}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`Show photo ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 ${
            i === index ? "border-rose-600" : "border-transparent opacity-80 hover:opacity-100"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimizedImage(url, 160)} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </>
  );

  const arrowBase = "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center";
  const arrow = `${arrowBase} bg-white/90 text-gray-900 shadow`;
  const arrowDark = `${arrowBase} bg-white/20 text-white`;
  const chevronProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  return (
    <div className="md:flex md:gap-4 md:items-start">
      {many && (
        <div className={`hidden md:flex md:flex-col gap-3 max-h-[36rem] overflow-y-auto ${hideScrollbar}`}>
          {thumbs}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="relative rounded-xl overflow-hidden bg-rose-50">
          <div
            ref={stripRef}
            onScroll={handleScroll}
            onPointerDown={() => {
              targetRef.current = null;
            }}
            className={`flex overflow-x-auto snap-x snap-mandatory ${hideScrollbar}`}
          >
            {images.map((url, i) => (
              <div key={url} className="min-w-full snap-center aspect-[4/5]">
                <button
                  type="button"
                  onClick={openZoom}
                  aria-label={`Open photo ${i + 1} full screen`}
                  className="block w-full h-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizedImage(url, 900)}
                    alt={altFor(i)}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:flex absolute bottom-3 right-3 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-gray-900 text-sm font-medium pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
            </svg>
            Click to zoom
          </div>

          {many && (
            <>
              <div
                aria-live="polite"
                className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gray-900/80 text-white text-sm font-semibold"
              >
                {index + 1} / {count}
              </div>
              <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous photo" className={`${arrow} left-3`}>
                <svg {...chevronProps}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button type="button" onClick={() => goTo(index + 1)} aria-label="Next photo" className={`${arrow} right-3`}>
                <svg {...chevronProps}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
                {images.map((url, i) => (
                  <span
                    key={url}
                    className={`w-2 h-2 rounded-full ${i === index ? "bg-gray-900" : "bg-white/80"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {many && (
          <div className={`md:hidden flex gap-2 mt-3 overflow-x-auto pb-1 ${hideScrollbar}`}>{thumbs}</div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        onClose={handleClosed}
        onKeyDown={handleKeyDown}
        aria-label={`${name} photos`}
        className="fixed inset-0 m-0 p-0 w-screen h-dvh max-w-none max-h-none bg-gray-950 text-white overscroll-contain backdrop:bg-black"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3">
            <div aria-live="polite" className="px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">
              {many ? `${index + 1} / ${count}` : "Photo"}
            </div>
            <button
              type="button"
              onClick={closeZoom}
              aria-label="Close"
              className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="relative flex-1 min-h-0">
            <div
              ref={panRef}
              className={`absolute inset-0 overflow-auto ${hideScrollbar}`}
              style={{ touchAction: zoomed ? "auto" : "pan-y pinch-zoom" }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            >
              <button
                type="button"
                onClick={handleZoomClick}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
                className={`block ${zoomed ? "w-[200%] cursor-zoom-out" : "w-full h-full cursor-zoom-in"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={images[index]}
                  // Fit-to-screen reuses the 900 px version the page already loaded; only real zoom fetches 1600 px.
                  src={optimizedImage(images[index], zoomed ? 1600 : 900)}
                  alt={altFor(index)}
                  draggable={false}
                  className={zoomed ? "w-full h-auto max-w-none" : "w-full h-full object-contain"}
                />
              </button>
            </div>
            {many && !zoomed && (
              <>
                <button type="button" onClick={() => zoomTo(index - 1)} aria-label="Previous photo" className={`${arrowDark} left-3`}>
                  <svg {...chevronProps}>
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button type="button" onClick={() => zoomTo(index + 1)} aria-label="Next photo" className={`${arrowDark} right-3`}>
                  <svg {...chevronProps}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="p-3 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-300">
              {zoomed ? "Scroll to look around. Tap to zoom out." : "Tap the photo to zoom in."}
              {many ? " Swipe for the next photo." : ""}
            </p>
            {many && (
              <div className={`flex gap-2 max-w-full overflow-x-auto ${hideScrollbar}`}>
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => zoomTo(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 ${
                      i === index ? "border-white" : "border-transparent opacity-60"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={optimizedImage(url, 120)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
