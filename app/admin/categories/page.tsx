"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  _count?: {
    posts: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // New category form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isCreating, setIsCreating] = React.useState(false);

  // Editing state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editSort, setEditSort] = React.useState(0);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
      if (data.length > 0) {
        const maxSort = Math.max(...data.map((c: Category) => c.sortOrder));
        setSortOrder(maxSort + 1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          sortOrder: Number(sortOrder),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create category");
      }

      setName("");
      setDescription("");
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
    setEditSort(cat.sortOrder);
  }

  async function saveEditing(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          sortOrder: Number(editSort),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update category");
      }

      setEditingId(null);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(cat: Category) {
    const postCount = cat._count?.posts || 0;
    let force = false;

    if (postCount > 0) {
      const confirmed = window.confirm(
        `This category has ${postCount} post(s) associated with it. Are you sure you want to delete it? The posts will become uncategorized.`
      );
      if (!confirmed) return;
      force = true;
    } else {
      const confirmed = window.confirm(`Delete category "${cat.name}"?`);
      if (!confirmed) return;
    }

    try {
      const url = `/api/categories/${cat.id}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete category");
      }
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;

    // Assign new sequential sort orders
    const items = newCats.map((c, i) => ({ id: c.id, sortOrder: i }));
    setCategories(newCats.map((c, i) => ({ ...c, sortOrder: i })));

    try {
      await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch (err: any) {
      setError("Failed to save reordered categories");
      await fetchCategories();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-1">
          Organize your blog posts into categories for readers to explore.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Category</CardTitle>
          <CardDescription>
            Add a new category with an auto-generated URL slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Technical Tutorials"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Short description of this category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <Button type="submit" disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Categories</CardTitle>
          <CardDescription>
            {categories.length} categories available. Reorder using arrows or edit details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories created yet. Create one above to get started.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {categories.map((cat, idx) => {
                const isEditing = editingId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center bg-accent/20"
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Category name"
                        />
                        <Input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={editSort}
                          onChange={(e) => setEditSort(Number(e.target.value))}
                          placeholder="Order"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEditing(cat.id)}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, "up")}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === categories.length - 1}
                          onClick={() => handleMove(idx, "down")}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{cat.name}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            /{cat.slug}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {cat.description}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {cat._count?.posts ?? 0} post(s)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(cat)}
                        aria-label="Edit category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cat)}
                        aria-label="Delete category"
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
