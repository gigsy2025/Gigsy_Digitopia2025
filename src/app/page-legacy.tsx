import Badge from "@/components/Badge";
import AuthDisplay from "@/components/AuthDisplay";
import ButtonFetcher from "@/components/ButtonFetcher";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Welcome to <span className="text-[hsl(280,100%,70%)]">Gigsy</span>
        </h1>

        {/* Authentication Demo Component */}
        <AuthDisplay />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Getting Started →</h3>
            <div className="text-lg">
              Authentication is handled in the layout. Sign in to see
              personalized content.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Real-time Features →</h3>
            <div className="text-lg">
              Powered by Convex for real-time data synchronization.
            </div>
          </div>
        </div>
        <Badge />
        <ButtonFetcher />
      </div>
    </main>
  );
}
