import Link from "next/link";
import { Clock, Eye, Calendar } from "lucide-react";
import { TableOfContents } from "@/components/table-of-contents";
import { injectHeadingIds } from "@/lib/heading-utils";

export interface PostArticleData {
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  readingTime: number;
  publishedAt?: Date | string | null;
  category?: { name: string; slug: string } | null;
  author?: { name?: string | null; image?: string | null; bio?: string | null } | null;
}

/**
 * The article as readers see it: header, byline, cover, body and table of contents.
 * Shared by the public post page and the admin draft preview so they cannot drift apart.
 */
export function PostArticle({ post, views }: { post: PostArticleData; views?: number }) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="space-y-8">
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
          <p className="text-xl text-muted-foreground font-serif leading-relaxed">{post.excerpt}</p>
        )}

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
              <p className="font-semibold text-foreground">{post.author?.name || "Admin"}</p>
              {post.author?.bio && (
                <p className="text-xs text-muted-foreground line-clamp-1">{post.author.bio}</p>
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
            {views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {views} views
              </span>
            )}
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        <div className="lg:col-span-3">
          <div
            className="prose prose-lg prose-stone dark:prose-invert max-w-[68ch] font-serif prose-headings:scroll-mt-24"
            dangerouslySetInnerHTML={{ __html: injectHeadingIds(post.content) }}
          />
        </div>

        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <TableOfContents htmlContent={post.content} />
          </div>
        </div>
      </div>
    </article>
  );
}
