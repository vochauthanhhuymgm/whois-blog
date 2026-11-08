"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  MessageSquare,
  Eye,
  PlusCircle,
  FolderOpen,
  Image as ImageIcon,
  Settings,
  ArrowUpRight,
} from "lucide-react";

interface Stats {
  totalPublishedPosts: number;
  totalApprovedComments: number;
  totalViews: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching admin stats:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your blog content, readership, and community engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/admin/posts/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Write New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalPublishedPosts ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live articles available to readers
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalApprovedComments ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active reader discussions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.totalViews ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative post page views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Quick Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/posts"
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Posts</p>
                <p className="text-xs text-muted-foreground">Manage drafts & published articles</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/admin/categories"
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Categories</p>
                <p className="text-xs text-muted-foreground">Organize topic tags & navigation</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/admin/comments"
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Comments</p>
                <p className="text-xs text-muted-foreground">Moderate reader submissions</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/admin/media"
            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Media</p>
                <p className="text-xs text-muted-foreground">Upload & manage image assets</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
