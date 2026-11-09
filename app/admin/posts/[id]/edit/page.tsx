"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PostForm } from "@/components/post-form";

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    fetch(`/api/posts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load post");
        return res.json();
      })
      .then((data) => setPost(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4" aria-busy="true" aria-label="Loading post">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div role="alert" className="mx-auto max-w-6xl space-y-3 text-sm">
        <p className="text-destructive">{error || "Post not found"}</p>
        <Link href="/admin/posts" className="underline underline-offset-2">
          Back to posts
        </Link>
      </div>
    );
  }

  return <PostForm initialData={post} />;
}
