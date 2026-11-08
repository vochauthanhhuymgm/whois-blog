import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Archive | whois-blog",
  description: "Browse all published articles by month and year.",
};

interface GroupedPosts {
  [key: string]: {
    monthYear: string;
    posts: any[];
  };
}

export default async function ArchivePage() {
  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: true,
    },
  });

  // Group by "Month Year" (e.g., "November 2026")
  const groups: GroupedPosts = {};

  posts.forEach((post) => {
    const date = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthYear = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!groups[key]) {
      groups[key] = { monthYear, posts: [] };
    }
    groups[key].posts.push(post);
  });

  // Sort groups descending
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
        <header className="mb-10 pb-6 border-b">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
            Article Archive
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Chronological archive of all {posts.length} published stories.
          </p>
        </header>

        {sortedGroupKeys.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-serif">No articles archived yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedGroupKeys.map((key) => {
              const group = groups[key];
              return (
                <section key={key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-2xl font-bold tracking-tight">
                      {group.monthYear}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({group.posts.length})
                    </span>
                  </div>

                  <div className="divide-y border rounded-lg bg-card">
                    {group.posts.map((post) => {
                      const day = post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          })
                        : "";

                      return (
                        <div
                          key={post.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-accent/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {post.category && (
                                <Link
                                  href={`/category/${post.category.slug}`}
                                  className="text-xs text-primary font-medium hover:underline"
                                >
                                  {post.category.name}
                                </Link>
                              )}
                            </div>
                            <Link
                              href={`/post/${post.slug}`}
                              className="font-serif font-bold text-base sm:text-lg hover:underline block"
                            >
                              {post.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                            <span>{day}</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {post.readingTime}m
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
