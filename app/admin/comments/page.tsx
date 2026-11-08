"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Check,
  X,
  Trash2,
  ExternalLink,
  User as UserIcon,
} from "lucide-react";

interface CommentAuthor {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface CommentPost {
  id: string;
  title: string;
  slug: string;
}

interface CommentItem {
  id: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  author: CommentAuthor;
  post: CommentPost;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = React.useState<CommentItem[]>([]);
  const [filter, setFilter] = React.useState<string>("PENDING");
  const [loading, setLoading] = React.useState(true);
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);

  const fetchComments = React.useCallback(async (statusFilter: string) => {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? "/api/admin/comments"
          : `/api/admin/comments?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchComments(filter);
  }, [filter, fetchComments]);

  async function handleApprove(id: string) {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        fetchComments(filter);
      }
    } catch (err) {
      console.error("Failed to approve comment:", err);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(id: string) {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}/reject`, {
        method: "PUT",
      });
      if (res.ok) {
        fetchComments(filter);
      }
    } catch (err) {
      console.error("Failed to reject comment:", err);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this comment?")) return;
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comment Moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review, approve, reject, or remove guest comments.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs capitalize"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-lg">No comments found</h3>
          <p className="text-sm text-muted-foreground">
            There are no {filter.toLowerCase()} comments to display.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border bg-card p-5 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  {comment.author.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={comment.author.image}
                      alt={comment.author.name || "User"}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {comment.author.name ? comment.author.name[0] : <UserIcon className="h-4 w-4" />}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.author.name || "Guest"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({comment.author.email})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      comment.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : comment.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {comment.status}
                  </span>

                  {comment.post && (
                    <Link
                      href={`/post/${comment.post.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-2"
                    >
                      <span className="max-w-[200px] truncate">{comment.post.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                {comment.status !== "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 text-xs flex items-center gap-1"
                    disabled={actionInProgress === comment.id}
                    onClick={() => handleApprove(comment.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}

                {comment.status !== "REJECTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs flex items-center gap-1"
                    disabled={actionInProgress === comment.id}
                    onClick={() => handleReject(comment.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 text-xs flex items-center gap-1"
                  disabled={actionInProgress === comment.id}
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
