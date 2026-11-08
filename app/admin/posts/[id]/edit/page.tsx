"use client";

import * as React from "react";
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
    return <p className="text-sm text-muted-foreground p-4">Loading post...</p>;
  }

  if (error || !post) {
    return (
      <div role="alert" className="p-4 text-sm text-destructive">
        {error || "Post not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Post</h1>
        <p className="text-muted-foreground mt-1">
          Make updates to &ldquo;{post.title}&rdquo;
        </p>
      </div>
      <PostForm initialData={post} />
    </div>
  );
}
