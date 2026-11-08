import Link from "next/link";
import { Clock, Pin } from "lucide-react";

export interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    readingTime: number;
    publishedAt?: Date | string | null;
    isPinned?: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    author?: {
      name?: string | null;
      image?: string | null;
    } | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="group flex flex-col md:flex-row gap-6 py-6 border-b transition-colors">
      {post.coverImage && (
        <Link
          href={`/post/${post.slug}`}
          className="md:w-1/3 aspect-[16/10] overflow-hidden rounded-lg bg-muted flex-shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {post.isPinned && (
              <span className="inline-flex items-center text-primary font-semibold">
                <Pin className="h-3 w-3 mr-1" /> Pinned
              </span>
            )}
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {post.category.name}
              </Link>
            )}
            {publishedDate && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{publishedDate}</span>
              </>
            )}
          </div>

          <Link href={`/post/${post.slug}`} className="block group-hover:text-primary transition-colors">
            <h2 className="font-serif text-2xl font-bold tracking-tight leading-snug">
              {post.title}
            </h2>
          </Link>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2">
          <div className="flex items-center gap-2">
            {post.author?.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.author.image}
                alt={post.author.name || "Author"}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            {post.author?.name && <span>{post.author.name}</span>}
          </div>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" /> {post.readingTime} min read
          </span>
        </div>
      </div>
    </article>
  );
}
