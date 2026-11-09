import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Image as ImageIcon,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r bg-card flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between px-2 py-4 mb-4 border-b">
            <Link href="/admin" className="text-xl font-bold tracking-tight">
              whois-admin
            </Link>
            <ThemeToggle />
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      {/* The window scrolls (no overflow here), so `sticky` children such as the editor bars work. */}
      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
