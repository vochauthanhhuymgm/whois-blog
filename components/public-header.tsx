"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function PublicHeader() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: session } = useSession();

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error("Header categories fetch failed:", err));
  }, []);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            whois-blog
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
            <Link href="/archive" className="transition-colors hover:text-foreground">
              Archive
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild title="Search posts">
            <Link href="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />

          {/* User Auth State */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/60 text-xs">
                {session.user.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {session.user.name ? session.user.name[0] : <UserIcon className="h-3 w-3" />}
                  </div>
                )}
                <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                  {session.user.name || session.user.email}
                </span>
              </div>

              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex text-xs">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" asChild className="text-xs">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-6 py-4 space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              Home
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-primary text-muted-foreground transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/archive"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              Archive
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-primary transition-colors"
            >
              About
            </Link>

            {session?.user ? (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                  <span>Signed in as <strong className="text-foreground">{session.user.name || session.user.email}</strong></span>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-primary font-semibold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block text-left text-sm text-destructive hover:underline pt-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-primary font-semibold text-primary pt-2 border-t"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
