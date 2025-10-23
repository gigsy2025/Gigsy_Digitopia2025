import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { getClerkPublishableKey } from "@/lib/clerk/publishable-key";

export const metadata: Metadata = {
  title: "Gigsy - Auth",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = getClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        {children}
      </div>
    </ClerkProvider>
  );
}
