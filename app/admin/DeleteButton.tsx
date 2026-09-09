"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteChildProfile } from "./actions";

export default function DeleteButton({
  id,
  redirectTo,
  label = "Delete",
}: {
  id: string;
  redirectTo?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("Delete this customer record permanently? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteChildProfile(id);
      if (!res.ok) {
        setError(res.error ?? "Delete failed.");
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "Deleting…" : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
