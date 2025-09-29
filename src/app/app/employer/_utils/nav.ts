import type { EmployerNavItem } from "@/components/layouts/EmployerLayout";

const BASE_PATH = "/app/employer" as const;
const NAV_ITEMS: Array<Pick<EmployerNavItem, "href" | "label" | "icon">> = [
  { href: `${BASE_PATH}`, label: "Overview" },
  { href: `${BASE_PATH}/gigs`, label: "Gigs" },
  { href: `${BASE_PATH}/gigs/create`, label: "Create gig" },
];

interface NavMetrics {
  activeGigs?: number;
  totalApplicants?: number;
}

export function buildEmployerNavItems(
  currentPath: string,
  metrics: NavMetrics = {},
): EmployerNavItem[] {
  return NAV_ITEMS.map((item) => ({
    ...item,
    active: isActive(item.href, currentPath),
    badge: resolveBadge(item.href, metrics),
  }));
}

function isActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === BASE_PATH) {
    return currentPath === itemHref;
  }

  if (itemHref === `${BASE_PATH}/gigs/create`) {
    return currentPath === itemHref;
  }

  if (itemHref === `${BASE_PATH}/gigs`) {
    return (
      currentPath === itemHref || currentPath.startsWith(`${BASE_PATH}/gigs/`)
    );
  }

  return false;
}

function resolveBadge(itemHref: string, metrics: NavMetrics) {
  if (itemHref === `${BASE_PATH}/gigs` && metrics.activeGigs !== undefined) {
    return metrics.activeGigs.toString();
  }

  if (itemHref === BASE_PATH && metrics.totalApplicants !== undefined) {
    return metrics.totalApplicants.toString();
  }

  return undefined;
}
