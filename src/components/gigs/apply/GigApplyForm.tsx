"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GigDetail } from "@/types/gigs";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import type {
  ApplyToGigInput,
  ApplyToGigResult,
} from "@/app/app/gigs/[gigId]/apply/actions";
import type {
  ApplicationStatus,
  ApplicationStatusSummary,
} from "@/types/applications";
import { APPLICATION_STATUS_LABELS } from "@/types/applications";
import type { Id } from "convex/_generated/dataModel";

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
  applyAction: (input: ApplyToGigInput) => Promise<ApplyToGigResult>;
  existingApplication?: ApplicationStatusSummary | null;
}

const APPLICATION_VIEW_PATH = "/app/profile/applications";

export function GigApplyForm({
  gig,
  applyAction,
  existingApplication,
}: GigApplyFormProps) {
  const form = useForm<GigApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      coverLetter: "",
      portfolioUrl: "",
    },
  });

  const characterCount = form.watch("coverLetter").length;
  const [isPending, startTransition] = useTransition();
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatusSummary | null>(existingApplication ?? null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setApplicationStatus(existingApplication ?? null);
  }, [existingApplication]);

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  const helperText = useMemo(() => {
    if (characterCount < 50) {
      return `${50 - characterCount} more characters required for a strong first impression.`;
    }
    if (characterCount > 1800) {
      return "Consider trimming to keep your message focused.";
    }
    return "Highlight relevant experience, recent wins, and why you're the right partner.";
  }, [characterCount]);

  const statusLabel = applicationStatus?.status
    ? (APPLICATION_STATUS_LABELS[applicationStatus.status] ??
      applicationStatus.status)
    : null;

  const isApplicationLocked = applicationStatus?.hasApplied;

  const navigateToApplications = () => {
    window.location.assign(APPLICATION_VIEW_PATH);
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (isApplicationLocked) {
      toast.info("You already submitted an application for this gig.", {
        description: statusLabel
          ? `Current status: ${statusLabel}.`
          : undefined,
        action: {
          label: "View application",
          onClick: navigateToApplications,
        },
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const result = await applyAction({
            gigId: gig._id,
            ...values,
          });

          if (result.success) {
            setApplicationStatus({
              hasApplied: true,
              applicationId: (result.applicationId ??
                null) as Id<"applications"> | null,
              status: (result.status ?? null) as ApplicationStatus | null,
            });
            toast.success(
              result.message || "Your application has been submitted!",
              {
                action: {
                  label: "View application",
                  onClick: navigateToApplications,
                },
              },
            );
            setShowConfetti(true);
            if (confettiTimeoutRef.current) {
              clearTimeout(confettiTimeoutRef.current);
            }
            confettiTimeoutRef.current = setTimeout(
              () => setShowConfetti(false),
              1600,
            );
            form.reset();
            return;
          }

          if (result.isDuplicate) {
            setApplicationStatus({
              hasApplied: true,
              applicationId: (result.applicationId ??
                null) as Id<"applications"> | null,
              status: (result.status ?? null) as ApplicationStatus | null,
            });
            toast.info(result.message, {
              description: result.duplicateMessage,
              action: {
                label: "View application",
                onClick: navigateToApplications,
              },
            });
            return;
          }

          toast.error(result.message || "Unable to submit application.");
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unexpected error while submitting.";
          toast.error(message);
        }
      })();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="relative space-y-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-foreground text-lg font-semibold">
              Tell {gig.employerId ? "the employer" : "the team"} why
              you&apos;re a fit
            </h2>
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
                  <span className="text-muted-foreground text-xs">
                    {characterCount}/2000
                  </span>
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
                <p className="text-muted-foreground text-xs">{helperText}</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-foreground text-lg font-semibold">
              Share the strongest example of your work
            </h2>
            <p className="text-muted-foreground text-sm">
              Paste a link to a case study, live site, or repo that best
              demonstrates your ability to deliver.
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

        <footer className="border-border bg-background/80 sticky right-0 bottom-4 left-0 z-10 rounded-2xl border p-4 shadow-lg backdrop-blur">
          <ConfettiBurst active={showConfetti} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                You&apos;re about to apply to {gig.title}
              </p>
              <p className="text-muted-foreground text-xs">
                You&apos;ll receive a confirmation once we release the employer
                workflow.
              </p>
              {isApplicationLocked && (
                <p className="text-success text-xs font-medium">
                  {statusLabel
                    ? `Application already submitted (${statusLabel}).`
                    : "Application already submitted."}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="sm:min-w-[220px]"
              disabled={isPending || isApplicationLocked}
            >
              {isApplicationLocked ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2
                    className="text-success h-4 w-4"
                    aria-hidden="true"
                  />
                  Application submitted
                </span>
              ) : isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Submitting...
                </span>
              ) : (
                "Submit application"
              )}
            </Button>
          </div>
        </footer>
      </form>
    </Form>
  );
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

const CONFETTI_COLORS = ["#4ade80", "#38bdf8", "#facc15", "#fb7185", "#a855f7"];

function ConfettiBurst({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const generated = Array.from({ length: 14 }).map((_, index) => {
        const color =
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ??
          "#38bdf8";

        return {
          id: index,
          left: Math.random() * 100,
          delay: Math.random() * 150,
          duration: 900 + Math.random() * 600,
          color,
        } satisfies ConfettiPiece;
      });
      setPieces(generated);
    } else {
      setPieces([]);
    }
  }, [active]);

  if (!active || pieces.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            backgroundColor: piece.color,
          }}
        />
      ))}

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          opacity: 0;
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(140px) rotate(240deg) scale(0.9);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
