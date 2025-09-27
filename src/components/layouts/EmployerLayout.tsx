"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export type EmployerNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: ReactNode;
};

export type EmployerLayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  navItems?: EmployerNavItem[];
  footer?: ReactNode;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
};

export function EmployerLayout({
  children,
  title,
  description,
  actions,
  navItems,
  footer,
  className,
  sidebarClassName,
  contentClassName,
}: EmployerLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
    >
      <aside
        className={cn(
          "border-border bg-card hidden w-64 shrink-0 flex-col gap-6 rounded-2xl border p-4 lg:flex",
          sidebarClassName,
        )}
      >
        <div className="space-y-2">
          <h2 className="text-muted-foreground text-sm font-semibold">
            Navigation
          </h2>
          <Separator />
        </div>

        <nav>
          <ul className="space-y-1">
            {navItems?.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={item.active ? "page" : undefined}
                >
                  <span className="flex items-center gap-2">
                    {item.icon ? (
                      <span className="text-muted-foreground group-hover:text-foreground text-base">
                        {item.icon}
                      </span>
                    ) : null}
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span className="text-muted-foreground group-hover:text-foreground text-xs">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {footer ? (
          <div className="text-muted-foreground mt-auto pt-4 text-xs">
            {footer}
          </div>
        ) : null}
      </aside>

      <section className={cn("flex flex-1 flex-col gap-6", contentClassName)}>
        <header className="border-border bg-card rounded-2xl border p-6 shadow-sm">
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
        </header>

        <main className="flex-1 space-y-6">{children}</main>
      </section>
    </div>
  );
}
