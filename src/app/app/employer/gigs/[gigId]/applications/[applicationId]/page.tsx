import { notFound } from "next/navigation";
import Link from "next/link";

import { EmployerLayout } from "@/components/layouts/EmployerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationActions } from "../../../_components/ApplicationActions";
import {
  addEmployerApplicationNote,
  fetchEmployerApplicationDetail,
  fetchEmployerGigDetail,
  fetchEmployerMetrics,
  markEmployerApplicationViewed,
} from "@/utils/fetchers-server";
import type { ApplicationStatus } from "@/types/applications";
import { APPLICATION_STATUS_LABELS } from "@/types/applications";
import type { Id } from "convex/_generated/dataModel";
import { formatDistanceToNowStrict } from "date-fns";
import { buildEmployerNavItems } from "../../../../_utils/nav";
import { clerkClient } from "@clerk/nextjs/server";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

interface EmployerApplicationDetailPageProps {
  params: Promise<{
    gigId: string;
    applicationId: string;
  }>;
}

export const metadata = {
  title: "Application detail",
};

export default async function EmployerApplicationDetailPage({
  params,
}: EmployerApplicationDetailPageProps) {
  const { gigId: gigIdParam, applicationId: applicationIdParam } = await params;

  const gigId = gigIdParam as Id<"gigs">;
  const applicationId = applicationIdParam as Id<"applications">;

  const [metrics, gig, detail] = await Promise.all([
    fetchEmployerMetrics(),
    fetchEmployerGigDetail(gigId),
    fetchEmployerApplicationDetail({ gigId, applicationId }),
  ]);

  if (!gig || !detail) {
    notFound();
  }

  const clerkAuthorIds = Array.from(
    new Set(
      detail.notes
        .map((note) => note.authorClerkId)
        .filter((clerkId): clerkId is string => Boolean(clerkId)),
    ),
  );

  const client = await clerkClient();
  const clerkUsers = clerkAuthorIds.length
    ? await client.users.getUserList({ userId: clerkAuthorIds })
    : { data: [] };

  type AuthorProfile = {
    name: string;
    imageUrl: string | null;
  };

  const authorProfiles = new Map<string, AuthorProfile>(
    clerkUsers.data.map((user) => {
      const fullName = [user.firstName, user.lastName]
        .filter((part): part is string => Boolean(part))
        .join(" ");
      const fallbackEmail = user.emailAddresses?.[0]?.emailAddress;
      const fallbackUsername = user.username;
      const name =
        (fullName || fallbackUsername) ??
        fallbackEmail ??
        "Unknown team member";

      return [user.id, { name, imageUrl: user.imageUrl ?? null }];
    }),
  );

  const notesWithAuthors = detail.notes.map((note) => {
    const profile = note.authorClerkId
      ? authorProfiles.get(note.authorClerkId)
      : undefined;
    const authorName = profile?.name ?? `User ${note.authorId}`;
    return {
      ...note,
      authorName,
      authorImageUrl: profile?.imageUrl ?? null,
      authorInitials: deriveInitials(authorName),
    };
  });

  await markEmployerApplicationViewed(applicationId);

  const navItems = buildEmployerNavItems(
    `${GIGS_PATH}/${gigIdParam}/applications/${applicationIdParam}`,
    {
      activeGigs: metrics.activeGigs,
      totalApplicants: metrics.totalApplicants,
    },
  );

  return (
    <EmployerLayout
      title={detail.candidate?.name ?? "Application"}
      description={gig.title}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`${GIGS_PATH}/${gigIdParam}/applications`}>
              Back to applications
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`${GIGS_PATH}/${gigIdParam}`}>View gig</Link>
          </Button>
        </div>
      }
      navItems={navItems}
    >
      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <article className="border-border bg-card space-y-6 rounded-xl border p-6 shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">
                {detail.candidate?.name ?? "Unknown candidate"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {detail.candidate?.profile?.headline ?? "No headline provided"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.application.status} />
                <Badge variant="outline">
                  Applied {formatDistance(detail.application._creationTime)} ago
                </Badge>
                {detail.application.expectedBudget ? (
                  <BudgetBadge amount={detail.application.expectedBudget} />
                ) : null}
              </div>
            </div>
            <ApplicationActions
              applicationId={detail.application._id}
              currentStatus={detail.application.status}
            />
          </header>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Cover letter</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {detail.application.coverLetter ?? "No cover letter provided."}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="border-border divide-y rounded-lg border">
              {detail.events.length === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">
                  No status changes recorded yet.
                </p>
              ) : (
                detail.events.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatStatus(event.status)}
                      </p>
                      {event.reason ? (
                        <p className="text-muted-foreground text-xs">
                          {event.reason}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDistance(event.createdAt)} ago
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Private notes</h3>
                <p className="text-muted-foreground text-sm">
                  Notes are shared with your hiring team only.
                </p>
              </div>
              <AddNoteForm applicationId={detail.application._id} />
            </header>
            <div className="border-border space-y-4 rounded-lg border p-4">
              {notesWithAuthors.length === 0 ? (
                <p className="text-muted-foreground text-sm">No notes yet.</p>
              ) : (
                notesWithAuthors.map((note) => (
                  <div key={note._id} className="space-y-2">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={note.authorImageUrl ?? undefined}
                            alt={note.authorName}
                          />
                          <AvatarFallback>{note.authorInitials}</AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-sm font-medium">
                          {note.authorName}
                        </span>
                      </div>
                      <span>{formatDistance(note.createdAt)} ago</span>
                    </div>
                    <p className="text-sm">{note.body}</p>
                    <Separator />
                  </div>
                ))
              )}
            </div>
          </section>
        </article>

        <aside className="border-border space-y-6 rounded-xl border p-6 shadow-sm">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Applicant snapshot</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{detail.candidate?.email ?? "Not provided"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location</dt>
                <dd>
                  {formatCandidateLocation(detail.candidate) ?? "Not provided"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Reputation score</dt>
                <dd>
                  {detail.application.applicantSnapshot?.reputationScore ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Attachments</h3>
            <div className="space-y-2 text-sm">
              {detail.application.attachments?.length ? (
                detail.application.attachments.map((attachment) => (
                  <Link
                    key={attachment.url}
                    href={attachment.url}
                    className="text-primary hover:underline"
                  >
                    {attachment.name}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No attachments uploaded.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Portfolio links</h3>
            <div className="space-y-2 text-sm">
              {detail.application.portfolioLinks?.length ? (
                detail.application.portfolioLinks.map((link) => (
                  <Link
                    key={link}
                    href={link}
                    className="text-primary hover:underline"
                  >
                    {link}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No portfolio links shared.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </EmployerLayout>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const variant = statusVariant(status);
  return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}

function statusVariant(
  status: ApplicationStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "pending":
    case "submitted":
    case "viewed":
    case "in_review":
      return "secondary";
    case "shortlisted":
    case "interview_requested":
    case "hired":
    case "assigned":
      return "default";
    case "rejected":
    case "withdrawn":
    case "closed":
      return "destructive";
    default:
      return "outline";
  }
}

function formatStatus(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

function formatDistance(timestamp: number): string {
  try {
    return formatDistanceToNowStrict(timestamp, { addSuffix: false });
  } catch (error) {
    console.error("Failed to format distance", error);
    return "unknown";
  }
}

function formatCandidateLocation(
  candidate:
    | {
        profile?: {
          location?: { city: string; country: string; timezone: string };
        };
      }
    | null
    | undefined,
): string | null {
  const location = candidate?.profile?.location;
  if (!location) {
    return null;
  }
  const parts = [location.city, location.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function deriveInitials(name: string): string {
  const normalized = name.trim();
  if (!normalized) {
    return "?";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  const firstInitial = parts[0]?.charAt(0) ?? "";
  const lastInitial = parts[parts.length - 1]?.charAt(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials
    ? initials.toUpperCase()
    : parts[0]!.slice(0, 2).toUpperCase();
}

function BudgetBadge({ amount }: { amount: number }) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  return <Badge variant="outline">Bid: {formatted}</Badge>;
}

function AddNoteForm({ applicationId }: { applicationId: Id<"applications"> }) {
  async function submit(data: FormData) {
    "use server";
    const body = (data.get("body") as string | null)?.trim();
    if (!body) {
      return;
    }

    await addEmployerApplicationNote({ applicationId, body });
  }

  return (
    <form action={submit} className="flex items-start gap-2">
      <Textarea
        name="body"
        placeholder="Add a private note"
        className="min-h-[80px] flex-1"
        required
      />
      <Button type="submit" variant="secondary">
        Add note
      </Button>
    </form>
  );
}
