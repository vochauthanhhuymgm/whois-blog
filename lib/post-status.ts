export type PostStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

interface PostVisibilityFields {
  status: string;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
}

/** True when readers can currently see the post (published, or scheduled time has passed). */
export function isLive(post: PostVisibilityFields, now: Date = new Date()): boolean {
  if (post.status === "PUBLISHED") return true;
  if (post.status === "SCHEDULED" && post.scheduledAt) {
    return new Date(post.scheduledAt).getTime() <= now.getTime();
  }
  return false;
}

/**
 * True once the post has ever been visible to readers. Its URL may be shared or indexed,
 * so the slug must no longer follow title edits automatically.
 */
export function hasBeenPublic(post: PostVisibilityFields, now: Date = new Date()): boolean {
  return Boolean(post.publishedAt) || isLive(post, now);
}
