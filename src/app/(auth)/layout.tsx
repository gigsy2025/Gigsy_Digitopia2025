import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gigsy - Auth",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        {children}
      </div>
    </>
  );
}
