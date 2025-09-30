"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GIG_EDITOR_LOCATION_TYPES,
  type GigEditorFormValues,
} from "@/lib/validations/gigEditor";

export function GigLocationVisibilitySection() {
  const form = useFormContext<GigEditorFormValues>();

  return (
    <section className="border-border rounded-2xl border p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Location &amp; visibility</h2>
        <p className="text-muted-foreground text-sm">
          Control where work happens and how the gig is promoted.
        </p>
      </header>

      <div className="mt-6 space-y-6">
        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor={field.name}>Location type</Label>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GIG_EDITOR_LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="locationCity"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor={field.name}>City</Label>
                <FormControl>
                  <Input
                    {...field}
                    disabled={form.watch("locationType") === "remote"}
                    placeholder="Cairo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationCountry"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor={field.name}>Country</Label>
                <FormControl>
                  <Input
                    {...field}
                    disabled={form.watch("locationType") === "remote"}
                    placeholder="Egypt"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="isRemoteOnly"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                </FormControl>
                <div>
                  <Label className="text-sm">Remote only</Label>
                  <p className="text-muted-foreground text-xs">
                    Prioritize distribution to remote candidates.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isUrgent"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                </FormControl>
                <div>
                  <Label className="text-sm">Urgent hire</Label>
                  <p className="text-muted-foreground text-xs">
                    Highlight this gig in candidate dashboards.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </section>
  );
}
