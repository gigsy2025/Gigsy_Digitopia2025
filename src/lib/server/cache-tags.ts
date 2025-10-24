export type CacheTagValue = string | number | boolean;
export type CacheTag = string | readonly CacheTagValue[];

export function serializeCacheTag(tag: CacheTag): string {
  return typeof tag === "string"
    ? tag
    : tag.map((value) => `${value}`).join(":");
}

export function serializeCacheTags(tags: ReadonlyArray<CacheTag>): string[] {
  return tags.map(serializeCacheTag);
}

export function resolveGigDataSource(): string {
  return (process.env.NEXT_PUBLIC_GIGS_DATASOURCE ?? "mock").toLowerCase();
}

export const cacheTags = {
  gigs: {
    list: (dataSource: string) => ["gigs", "list", dataSource] as const,
    detail: (gigId: string) => ["gigs", "detail", gigId] as const,
    related: (gigId: string) => ["gigs", "related", gigId] as const,
  },
  profiles: {
    bySlug: (slug: string) => ["profiles", "slug", slug] as const,
    byUserId: (userId: string) => ["profiles", "user", userId] as const,
  },
} as const;
