"use client";

import Link from "next/link";
import { useState } from "react";
import { removeProduct, toggleProductStatus } from "@/app/admin/actions";

export function ProductRowActions({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: "live" | "hidden";
}) {
  const [confirming, setConfirming] = useState(false);
  const btn = "min-h-11 px-3 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50";

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Delete ${name}?`}>
        <span className="text-sm text-gray-700">Delete permanently?</span>
        <form action={removeProduct}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="min-h-11 px-3 rounded-lg text-sm font-semibold bg-rose-600 text-white">
            Yes, delete
          </button>
        </form>
        <button type="button" onClick={() => setConfirming(false)} className={btn}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/${id}/edit`} className={`${btn} inline-flex items-center`}>
        Edit
      </Link>
      <form action={toggleProductStatus}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="next" value={status === "live" ? "hidden" : "live"} />
        <button type="submit" className={btn}>
          {status === "live" ? "Hide" : "Show"}
        </button>
      </form>
      <button type="button" onClick={() => setConfirming(true)} className={`${btn} text-rose-700`}>
        Delete
      </button>
    </div>
  );
}
