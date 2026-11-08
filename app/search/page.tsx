"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(queryParam);
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const performSearch = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam, performSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    performSearch(searchQuery);
  }

  function handleClear() {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    router.push("/search");
  }

  return (
    <main className="flex-1 container max-w-4xl px-4 sm:px-8 py-10">
      <div className="mb-10 pb-6 border-b">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
          Search Articles
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Find stories and write-ups across the entire blog.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 relative max-w-xl">
          <SearchIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type keyword and press Enter..."
            className="pl-11 pr-10 py-6 text-base"
            autoFocus
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>

      <div>
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-serif">Searching...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg font-serif">No articles match &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-sm mt-1">Try another keyword or search term.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"} found
            </p>
            <div className="space-y-2">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-base">Enter a keyword above to search published posts.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <Suspense fallback={<div className="container py-12">Loading search...</div>}>
        <SearchContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
