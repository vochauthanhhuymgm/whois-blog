import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { TableOfContents } from "@/components/table-of-contents";
import { PostCard } from "@/components/post-card";
import { injectHeadingIds } from "@/lib/heading-utils";
import Link from "next/link";
import { Clock, Eye, Calendar, ArrowLeft } from "lucide-react";
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

  const contentWithHeadingIds = injectHeadingIds(post.content);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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

        <article className="space-y-8">
          {/* Post Header */}
          <header className="space-y-4">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="inline-block text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                {post.category.name}
              </Link>
            )}

            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground font-serif leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Author Byline & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                {post.author?.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">
                    {post.author?.name ? post.author.name[0] : "A"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {post.author?.name || "Admin"}
                  </p>
                  {post.author?.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {post.author.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {formattedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formattedDate}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.viewCount + 1} views
                </span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Body Content & Table of Contents */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
            <div className="lg:col-span-3">
              <div
                className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-relaxed"
                dangerouslySetInnerHTML={{ __html: contentWithHeadingIds }}
              />
            </div>

            {/* Sidebar Table of Contents */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <TableOfContents htmlContent={post.content} />
              </div>
            </div>
          </div>
        </article>

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
      </main>

      <PublicFooter />
    </div>
  );
}
