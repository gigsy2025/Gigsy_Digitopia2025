export const cacheTags = {
  gigs: {
    list: "gigs:list",
    detail: (gigId: string) => `gigs:detail:${gigId}`,
    related: (gigId: string) => `gigs:related:${gigId}`,
  },
  profiles: {
    bySlug: (slug: string) => `profiles:slug:${slug}`,
    byUserId: (userId: string) => `profiles:user:${userId}`,
  },
} as const;
