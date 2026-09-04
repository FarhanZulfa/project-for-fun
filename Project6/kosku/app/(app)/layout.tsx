import { AppNavigation } from "@/components/shared/app-navigation";
import { UserProvider } from "@/lib/context/user-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="min-h-screen">
        <AppNavigation />

        {/* Konten utama — geser kanan di desktop untuk sidebar */}
        <main className="pb-20 lg:pb-0 lg:pl-56">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
}

