import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostCard } from "@/components/post-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} | whois-blog`,
    description: category.description || `Browse articles in ${category.name}`,
  };
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    notFound();
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      categoryId: category.id,
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", scheduledAt: { lte: now } },
      ],
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      category: true,
      author: true,
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> All Articles
        </Link>

        <header className="mb-10 pb-6 border-b space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Category
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground text-lg pt-1">
              {category.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            {posts.length} {posts.length === 1 ? "article" : "articles"} published
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-serif">No articles published in this category yet.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
