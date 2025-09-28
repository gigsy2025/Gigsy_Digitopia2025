"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GigDetail } from "@/types/gigs";

const applySchema = z.object({
  coverLetter: z
    .string()
    .min(50, "Cover letter should be at least 50 characters")
    .max(2000, "Cover letter should be at most 2000 characters"),
  portfolioUrl: z
    .string()
    .url("Please enter a valid URL")
    .max(200, "URL should be at most 200 characters"),
});

export type GigApplyFormValues = z.infer<typeof applySchema>;

export interface GigApplyFormProps {
  gig: GigDetail;
  onSubmit?: (values: GigApplyFormValues) => Promise<void> | void;
}

export function GigApplyForm({ gig, onSubmit }: GigApplyFormProps) {
  const form = useForm<GigApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      coverLetter: "",
      portfolioUrl: "",
    },
  });

  const characterCount = form.watch("coverLetter").length;

  const helperText = useMemo(() => {
    if (characterCount < 50) {
      return `${50 - characterCount} more characters required for a strong first impression.`;
    }
    if (characterCount > 1800) {
      return "Consider trimming to keep your message focused.";
    }
    return "Highlight relevant experience, recent wins, and why you're the right partner.";
  }, [characterCount]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Tell {gig.employerId ? "the employer" : "the team"} why you're a fit</h2>
          </div>

          <FormField
            control={form.control}
            name="coverLetter"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name} className="text-sm font-medium">
                    Cover letter
                  </Label>
                  <span className="text-xs text-muted-foreground">{characterCount}/2000</span>
                </div>
                <FormControl>
                  <Textarea
                    {...field}
                    id={field.name}
                    minLength={50}
                    maxLength={2000}
                    rows={8}
                    placeholder={`Explain how you'll tackle "${gig.title}" and the results we can expect.`}
                    className="resize-none"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">{helperText}</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Share the strongest example of your work</h2>
            <p className="text-sm text-muted-foreground">
              Paste a link to a case study, live site, or repo that best demonstrates your ability to deliver.
            </p>
          </div>

          <FormField
            control={form.control}
            name="portfolioUrl"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  Portfolio URL
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    id={field.name}
                    type="url"
                    placeholder="https://portfolio.example.com/case-study"
                    inputMode="url"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <footer className="sticky bottom-4 left-0 right-0 z-10 rounded-2xl border border-border bg-background/80 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">You're about to apply to {gig.title}</p>
              <p className="text-xs text-muted-foreground">
                You'll receive a confirmation once we release the employer workflow.
              </p>
            </div>
            <Button type="submit" size="lg" className="sm:min-w-[220px]">
              Submit application
            </Button>
          </div>
        </footer>
      </form>
    </Form>
  );
}
