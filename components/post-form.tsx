"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Upload, ArrowLeft, Pin, Globe, ChevronDown, ChevronUp } from "lucide-react";
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
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
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

  // SEO fields
  const [metaTitle, setMetaTitle] = React.useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = React.useState(initialData?.metaDescription || "");
  const [ogImage, setOgImage] = React.useState(initialData?.ogImage || "");
  const [showSeo, setShowSeo] = React.useState(
    Boolean(initialData?.metaTitle || initialData?.metaDescription || initialData?.ogImage)
  );

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ogFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload image");
      }

      const media = await res.json();
      setCoverImage(media.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload cover image");
    }
  }

  async function handleOgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload image");
      }

      const media = await res.json();
      setOgImage(media.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload Open Graph image");
    }
  }

  async function handleSubmit(actionStatus?: string) {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const statusToSet = actionStatus || status;

    if (statusToSet === "SCHEDULED") {
      if (!scheduledAt) {
        setError("Please choose a date and time for scheduled publication");
        return;
      }
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        setError("Scheduled date must be in the future");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      title,
      content,
      excerpt,
      coverImage,
      categoryId: categoryId || null,
      isPinned,
      status: statusToSet,
      scheduledAt: statusToSet === "SCHEDULED" ? new Date(scheduledAt).toISOString() : undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
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
    <div className="space-y-6 w-full max-w-4xl mx-auto">
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
              {isSubmitting ? "Scheduling..." : "Schedule Post"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("PUBLISHED")}
            >
              {isSubmitting ? "Publishing..." : isEditing ? "Update & Publish" : "Publish Now"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="text-lg font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Collapsible SEO Settings Section */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="flex w-full items-center justify-between text-sm font-semibold hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              SEO Settings (Meta Title, Description, Open Graph)
            </span>
            {showSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showSeo && (
            <div className="pt-3 border-t space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <Label htmlFor="metaTitle">Custom Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Defaults to post title if blank"
                />
                <p className="text-xs text-muted-foreground">
                  Overrides standard page title for search engines. Recommended under 60 characters.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="metaDescription">Custom Meta Description</Label>
                <textarea
                  id="metaDescription"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Defaults to post excerpt if blank"
                  className="w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground">
                  Brief description snippet for Google search results and link previews.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ogImage">Custom Open Graph Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="ogImage"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="Defaults to cover image if blank"
                  />
                  <input
                    type="file"
                    ref={ogFileInputRef}
                    onChange={handleOgImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => ogFileInputRef.current?.click()}
                    title="Upload Open Graph image"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Image used for Twitter/X cards and Facebook/LinkedIn social shares.
                </p>
              </div>
            </div>
          )}
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
