import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostArticle } from "@/components/post-article";
import { CommentSection } from "@/components/comment-section";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const now = new Date();
  const post = await prisma.post.findFirst({
    where: {
      slug: params.slug,
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
    },
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  const image = post.ogImage || post.coverImage || undefined;

  return {
    title: `${title} | whois-blog`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/post/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const now = new Date();

  const post = await prisma.post.findFirst({
    where: {
      slug: params.slug,
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
    },
    include: {
      category: true,
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Increment view count asynchronously
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // Fetch up to 3 related posts in same category
  let relatedPosts: any[] = [];
  if (post.categoryId) {
    relatedPosts = await prisma.post.findMany({
      where: {
        categoryId: post.categoryId,
        id: { not: post.id },
        OR: [
          { status: "PUBLISHED" },
          { status: "SCHEDULED", scheduledAt: { lte: now } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: {
        category: true,
        author: true,
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to articles
        </Link>

        <PostArticle post={post} views={post.viewCount + 1} />

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-10 border-t space-y-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Related Articles in {post.category?.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <div
                  key={related.id}
                  className="rounded-lg border bg-card p-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {related.coverImage && (
                      <Link
                        href={`/post/${related.slug}`}
                        className="aspect-video block overflow-hidden rounded bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    )}
                    <Link
                      href={`/post/${related.slug}`}
                      className="font-serif font-bold text-base hover:underline line-clamp-2"
                    >
                      {related.title}
                    </Link>
                    {related.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-3">
                    {related.readingTime} min read
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Comments Section */}
        <CommentSection postId={post.id} postSlug={post.slug} />
      </main>

      <PublicFooter />
    </div>
  );
}
