"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertCircle, CheckCircle2, User as UserIcon } from "lucide-react";

interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  author: CommentAuthor;
}

interface CommentSectionProps {
  postId: string;
  postSlug: string;
}

export function CommentSection({ postId, postSlug }: CommentSectionProps) {
  const { data: session, status: authStatus } = useSession();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successNotice, setSuccessNotice] = React.useState(false);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);

  const fetchComments = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorNotice(null);
    setSuccessNotice(false);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit comment");
      }

      setContent("");
      setSuccessNotice(true);
    } catch (err: any) {
      setErrorNotice(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-16 pt-10 border-t space-y-8" id="comments">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          Comments ({comments.length})
        </h2>
      </div>

      {/* Submission Status Alerts */}
      {successNotice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="font-medium">
            Your comment has been submitted and is pending moderation.
          </p>
        </div>
      )}

      {errorNotice && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{errorNotice}</p>
        </div>
      )}

      {/* Comment Form or Sign-in Prompt */}
      {authStatus === "loading" ? (
        <div className="py-4 text-sm text-muted-foreground">Loading user state...</div>
      ) : session?.user ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {session.user.name ? session.user.name[0] : <UserIcon className="h-4 w-4" />}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold leading-none">{session.user.name || "User"}</p>
              <p className="text-xs text-muted-foreground mt-1">{session.user.email}</p>
            </div>
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Leave your thoughts or reply..."
              rows={4}
              required
              className="w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center space-y-3">
          <p className="font-serif text-lg font-semibold">Join the discussion</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sign in with GitHub, Google, or your account to leave a comment on this article.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href={`/auth/signin?callbackUrl=/post/${postSlug}`}>
                Sign in to Comment
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Approved Comments List */}
      <div className="space-y-4 pt-4">
        {isLoadingComments ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border bg-card p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {comment.author.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={comment.author.image}
                      alt={comment.author.name || "Guest"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                      {comment.author.name ? comment.author.name[0] : "G"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{comment.author.name || "Guest"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
