import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Eye } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isLive } from "@/lib/post-status";
import { PostArticle } from "@/components/post-article";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview | whois-blog",
  robots: { index: false, follow: false },
};

function statusLabel(post: { status: string; scheduledAt: Date | null }) {
  if (post.status === "SCHEDULED" && post.scheduledAt) {
    const when = post.scheduledAt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Scheduled for ${when}`;
  }
  return post.status === "PUBLISHED" ? "Published" : "Draft — not visible to readers";
}

/** Admin-only preview of any post, rendered with the same article component readers see. */
export default async function PostPreviewPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    redirect(`/auth/signin?callbackUrl=/preview/${params.id}`);
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { category: true, author: true },
  });
  if (!post) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-40 border-b bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        <div className="container flex h-12 items-center justify-between gap-4 px-4 sm:px-8 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Eye className="h-4 w-4" />
            Preview · {statusLabel(post)}
          </span>
          <div className="flex items-center gap-4">
            {isLive(post) && (
              <Link href={`/post/${post.slug}`} className="hover:underline">
                View live
              </Link>
            )}
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="inline-flex items-center gap-1 font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to editor
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
        <PostArticle post={{ ...post, publishedAt: post.publishedAt ?? post.scheduledAt ?? new Date() }} />
      </main>
    </div>
  );
}
