"use client";

import { PostForm } from "@/components/post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
        <p className="text-muted-foreground mt-1">
          Write and publish your article.
        </p>
      </div>
      <PostForm />
    </div>
  );
}
