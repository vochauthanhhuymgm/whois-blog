"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Upload, ArrowLeft, Pin } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface PostData {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  status?: string;
  categoryId?: string;
  isPinned?: boolean;
  scheduledAt?: string | Date;
}

export function PostForm({ initialData }: { initialData?: PostData }) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [content, setContent] = React.useState(initialData?.content || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = React.useState(initialData?.coverImage || "");
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || "");
  const [isPinned, setIsPinned] = React.useState(initialData?.isPinned || false);
  const [status, setStatus] = React.useState(initialData?.status || "DRAFT");
  const [scheduledAt, setScheduledAt] = React.useState(
    initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : ""
  );

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
      } else {
        alert("Failed to upload cover image");
      }
    } catch (err) {
      alert("Error uploading cover image");
    }
  }

  async function handleSubmit(statusToSet: "DRAFT" | "PUBLISHED" | "SCHEDULED") {
    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }

    if (statusToSet === "SCHEDULED") {
      if (!scheduledAt) {
        setError("Please choose a future date/time for scheduled publishing");
        return;
      }
      const schedDate = new Date(scheduledAt);
      if (isNaN(schedDate.getTime()) || schedDate.getTime() <= Date.now()) {
        setError("Scheduled date must be in the future");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content,
      excerpt: excerpt.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      categoryId: categoryId || undefined,
      isPinned,
      status: statusToSet,
      scheduledAt: statusToSet === "SCHEDULED" ? new Date(scheduledAt).toISOString() : undefined,
    };

    try {
      const url = isEditing ? `/api/posts/${initialData.id}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save post");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/posts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to posts
        </Link>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit("DRAFT")}
          >
            Save Draft
          </Button>

          {status === "SCHEDULED" ? (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("SCHEDULED")}
            >
              Save Schedule
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("PUBLISHED")}
            >
              {isEditing ? "Save & Publish" : "Publish Now"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Main post fields */}
      <div className="space-y-4">
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="text-2xl font-bold py-6 px-4"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusChoice">Status</Label>
            <select
              id="statusChoice"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm font-medium h-10 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="flex items-center gap-1">
                <Pin className="h-4 w-4" /> Pin post to top of feed
              </span>
            </label>
          </div>
        </div>

        {status === "SCHEDULED" && (
          <div className="p-4 border rounded-md bg-muted/30 space-y-2 animate-in fade-in">
            <Label htmlFor="scheduledAt">Publish Date and Time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              This post will become automatically visible to readers after this date.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="coverImage">Cover Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://... or upload"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Upload cover image"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {coverImage && (
          <div className="relative aspect-video max-h-52 w-full overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover Preview"
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary of the post (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your article story here..."
          />
        </div>
      </div>
    </div>
  );
}
