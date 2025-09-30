"use client";

import { Button } from "@/components/ui/button";

interface GigPublishingControlsProps {
  isSaving: boolean;
}

export function GigPublishingControls({
  isSaving,
}: GigPublishingControlsProps) {
  return (
    <section className="border-border rounded-2xl border p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Publishing controls</h2>
        <p className="text-muted-foreground text-sm">
          Save your changes to update what candidates see.
        </p>
      </header>

      <div className="mt-6 space-y-3">
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </section>
  );
}
