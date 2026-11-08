"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Edit2, Trash2, Pin, PinOff, Clock } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  readingTime: number;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchPosts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter) params.append("categoryId", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Categories fetch failed:", err));
  }, []);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleDelete(post: Post) {
    const confirmed = window.confirm(`Delete post "${post.title}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      await fetchPosts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function togglePin(post: Post) {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });
      if (!res.ok) throw new Error("Failed to update post pin status");
      await fetchPosts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and organize articles for your blog.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Drafts</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Posts</CardTitle>
          <CardDescription>
            {posts.length} {posts.length === 1 ? "post" : "posts"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="font-medium">No posts found</p>
              <p className="text-xs mt-1">
                {searchQuery || statusFilter !== "ALL" || categoryFilter
                  ? "Try clearing filters to see more posts."
                  : "Click 'New Post' above to create your first article."}
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {posts.map((post) => {
                const statusColor =
                  post.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : post.status === "SCHEDULED"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";

                return (
                  <div
                    key={post.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <span className="flex items-center text-xs font-semibold text-primary">
                            <Pin className="h-3 w-3 mr-1" /> Pinned
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor}`}
                        >
                          {post.status}
                        </span>
                        {post.category && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-semibold text-base hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> {post.readingTime} min read
                        </span>
                        <span>
                          {post.publishedAt
                            ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(post.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end md:self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(post)}
                        title={post.isPinned ? "Unpin post" : "Pin post"}
                      >
                        {post.isPinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Edit post">
                        <Link href={`/admin/posts/${post.id}/edit`}>
                          <Edit2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post)}
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
