"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

export function useSafeGigId(): string | null {
  const params = useParams<Record<string, string | string[]>>();
  const rawGigId = params?.gigId;

  return useMemo(() => {
    if (!rawGigId) {
      return null;
    }

    return Array.isArray(rawGigId) ? rawGigId[0] ?? null : rawGigId;
  }, [rawGigId]);
}
