"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProfilePortfolioProps } from "./types";

export type ProfilePortfolioUIProps = ProfilePortfolioProps;

export function ProfilePortfolioUI({ projects }: ProfilePortfolioUIProps) {
  if (!projects.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Portfolio</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Dialog key={project.id}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer overflow-hidden transition hover:shadow-lg">
                <div className="bg-muted relative h-48 w-full overflow-hidden">
                  {project.screenshots?.[0] ? (
                    <Image
                      src={project.screenshots[0]}
                      alt={`${project.title} screenshot`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
                </div>
                <CardHeader className="group-hover:bg-muted/40 transition">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  {project.summary ? (
                    <p className="text-muted-foreground text-sm">
                      {project.summary}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {project.description ? (
                    <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {project.technologies?.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="rounded-full text-xs uppercase"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{project.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {project.description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                ) : null}
                {project.technologies?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {project.url ? (
                  <Button asChild variant="outline">
                    <a href={project.url} target="_blank" rel="noreferrer">
                      Visit Project
                    </a>
                  </Button>
                ) : null}
                {project.screenshots?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {project.screenshots.map((screenshot) => (
                      <div
                        key={screenshot}
                        className="bg-muted relative h-48 w-full overflow-hidden rounded-lg"
                      >
                        <Image
                          src={screenshot}
                          alt={`${project.title} preview`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </section>
  );
}
