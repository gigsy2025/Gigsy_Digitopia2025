import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProfileSidebarProps } from "./types";

export type ProfileSidebarUIProps = ProfileSidebarProps;

export function ProfileSidebarUI({ sidebar }: ProfileSidebarUIProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sidebar.badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {sidebar.badges.map((badge) => (
                <Badge
                  key={badge}
                  variant="secondary"
                  className="rounded-full uppercase"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
          {sidebar.contactEmail ? (
            <Button asChild size="sm" className="w-full">
              <a href={`mailto:${sidebar.contactEmail}`}>Contact</a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {sidebar.qrCodeUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Share Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-lg border border-dashed p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sidebar.qrCodeUrl}
                alt="Profile QR code"
                className="h-32 w-32"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Scan to view this profile on mobile.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {sidebar.featuredLogos?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Featured In</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {sidebar.featuredLogos.map((logoUrl, index) => (
              <div
                key={`${logoUrl}-${index}`}
                className="bg-muted relative h-12 w-12 overflow-hidden rounded-full"
              >
                <Image
                  src={logoUrl}
                  alt="Featured logo"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {sidebar.gigs?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {sidebar.gigs.map((gig) => (
              <div key={gig.id} className="space-y-2">
                <div>
                  <p className="font-medium">{gig.title}</p>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {gig.company}
                    {gig.location ? ` · ${gig.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gig.commitment ? (
                    <Badge variant="outline" className="rounded-full">
                      {gig.commitment}
                    </Badge>
                  ) : null}
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="px-0 text-xs"
                  >
                    <a href={gig.url} target="_blank" rel="noreferrer">
                      View Role
                    </a>
                  </Button>
                </div>
                <Separator className="my-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
