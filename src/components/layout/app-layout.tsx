
import { AppShell } from "./app-shell";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto w-full max-w-none">{children}</div>
      </main>
    </AppShell>
  );
}
