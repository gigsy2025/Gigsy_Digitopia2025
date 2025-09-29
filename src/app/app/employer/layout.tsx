import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/requireUser";

export const metadata = {
  title: "Employer portal",
};

export default async function EmployerRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser({ returnTo: "/app/employer" });
  return <>{children}</>;
}
