"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  ArrowLeft,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col justify-between h-full">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                active
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t space-y-3">
        {session?.user && (
          <div className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/40">
            <div className="flex items-center gap-2 overflow-hidden">
              {session.user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={session.user.image}
                  alt={session.user.name || "Admin"}
                  className="h-7 w-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {session.user.name ? session.user.name[0] : <UserIcon className="h-3.5 w-3.5" />}
                </div>
              )}
              <div className="truncate text-xs">
                <p className="font-semibold truncate leading-tight">
                  {session.user.name || "Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">
                  {session.user.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Blog
        </Link>
      </div>
    </div>
  );
}
