import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-card flex flex-col p-4">
        <div className="flex items-center justify-between px-2 pb-4 mb-4 border-b">
          <Link href="/admin" className="text-xl font-bold tracking-tight">
            whois-admin
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex flex-col">
          <AdminNav />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
