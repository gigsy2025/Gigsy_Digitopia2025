"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type CandidateNavItem = {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
};

export type CandidateLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  navItems?: CandidateNavItem[];
  className?: string;
  contentClassName?: string;
};

export function CandidateLayout({
  children,
  title,
  description,
  actions,
  navItems,
  className,
  contentClassName,
}: CandidateLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
    >
      <header className="space-y-4">
        {(title ?? description ?? actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              {title ? (
                <h1 className="text-foreground text-2xl font-semibold">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="text-muted-foreground text-sm">{description}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>
        )}

        {navItems?.length ? (
          <nav className="overflow-x-auto">
            <ul className="border-border flex items-center gap-2 border-b pb-1 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors",
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.icon ? (
                      <span className="text-base">{item.icon}</span>
                    ) : null}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <Separator />
        )}
      </header>

      <main className={cn("min-h-[50vh] space-y-6", contentClassName)}>
        {children}
      </main>
    </div>
  );
}
