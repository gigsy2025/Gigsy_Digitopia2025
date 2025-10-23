import "@/styles/globals.css";

import { Providers } from "@/components/jotai-provider";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gigsy.com"),
  title: {
    default: "Gigsy | Talent Operating System",
    template: "%s | Gigsy",
  },
  description:
    "Gigsy orchestrates global talent, learning, and delivery workflows so teams scale with confidence and measurable impact.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body
        className="bg-slate-950 text-slate-100 antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
