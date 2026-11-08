import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";

export async function PublicHeader() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            whois-blog
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            {categories.slice(0, 5).map((category) => (
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

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-2 hidden sm:inline-block"
          >
            Search
          </Link>
          <ThemeToggle />
          <Link
            href="/admin"
            className="text-xs border rounded px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
      {/* Category sub-bar if there are many categories */}
      {categories.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-2 overflow-x-auto flex gap-4 text-xs md:hidden">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="whitespace-nowrap hover:underline text-muted-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
