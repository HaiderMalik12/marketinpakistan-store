"use client";

import { useRef, useState } from "react";
import { optimizedImage } from "@/app/lib/images";

const hideScrollbar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const count = images.length;
  const many = count > 1;
  const [index, setIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  // While a thumbnail/arrow click is smooth-scrolling, ignore the in-between scroll
  // events so the counter and highlight jump straight to the target photo.
  const targetRef = useRef<number | null>(null);

  function goTo(i: number) {
    const el = stripRef.current;
    if (!el || count === 0) return;
    const next = (i + count) % count;
    setIndex(next);
    const left = next * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 1) return;
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

  const arrow =
    "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-900 shadow flex items-center justify-center";

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizedImage(url, 900)}
                  alt={altFor(i)}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button type="button" onClick={() => goTo(index + 1)} aria-label="Next photo" className={`${arrow} right-3`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    </div>
  );
}
