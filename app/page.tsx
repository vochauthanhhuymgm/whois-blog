import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = 10;
  const now = new Date();

  const where = {
    OR: [
      { status: "PUBLISHED" },
      { status: "SCHEDULED", scheduledAt: { lte: now } },
    ],
  };

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        author: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
        <div className="mb-10 pb-6 border-b">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
            Latest Articles
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Thoughts, technical write-ups, and stories.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-serif">No articles published yet.</p>
            <p className="text-sm mt-1">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-10 mt-6 border-t text-sm">
            {page > 1 ? (
              <Button variant="outline" asChild>
                <Link href={`/?page=${page - 1}`}>← Previous</Link>
              </Button>
            ) : (
              <div />
            )}

            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Button variant="outline" asChild>
                <Link href={`/?page=${page + 1}`}>Next →</Link>
              </Button>
            ) : (
              <div />
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
