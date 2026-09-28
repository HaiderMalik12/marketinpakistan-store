"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storeSource } from "@/app/lib/attribution";

// Captures ?src=... on any page landing (e.g. src=yt-video123, src=wa-broadcast)
// and persists it so it survives internal navigation to a page without the param.
export function SourceTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const src = searchParams.get("src");
    if (src) {
      storeSource(src);
    }
  }, [searchParams]);

  return null;
}
