"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import {
  CharCount,
  ImageField,
  PublishMenu,
  SidebarSection,
  SnippetPreview,
  selectClassName,
  textareaClassName,
} from "@/components/post-form-parts";
import { generateSlug } from "@/lib/slug";
import { hasBeenPublic, isLive } from "@/lib/post-status";
import { useUnsavedChangesWarning } from "@/lib/use-unsaved-changes-warning";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Pin,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface PostData {
  id?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: string;
  categoryId?: string | null;
  isPinned?: boolean;
  scheduledAt?: string | Date | null;
  publishedAt?: string | Date | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
}

/** What the server last confirmed about the post's lifecycle. */
interface ServerState {
  status: string;
  slug: string;
  scheduledAt: string | Date | null;
  publishedAt: string | Date | null;
}

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date; label: string }
  | { kind: "error"; message: string };

/** What the editor asks the server to do with the post's status. */
type SaveIntent = "draft" | "update" | "publish" | "schedule" | "unpublish";

// useLayoutEffect warns during server rendering; this component is server-rendered first.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const AUTOSAVE_DELAY_MS = 1500;
const EXCERPT_LIMIT = 160;
const META_TITLE_LIMIT = 60;
const META_DESCRIPTION_LIMIT = 160;

/** True while the slug is still the auto-generated one for this title (incl. a -2 style suffix). */
function slugFollowsTitle(slug: string, title: string): boolean {
  const base = generateSlug(title);
  return !!base && (slug === base || new RegExp(`^${base}-\\d+$`).test(slug));
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostForm({ initialData }: { initialData?: PostData }) {
  const [postId, setPostId] = React.useState(initialData?.id);
  const [server, setServer] = React.useState<ServerState>({
    status: initialData?.status || "DRAFT",
    slug: initialData?.slug || "",
    scheduledAt: initialData?.scheduledAt ?? null,
    publishedAt: initialData?.publishedAt ?? null,
  });

  // Editable fields
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [content, setContent] = React.useState(initialData?.content || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = React.useState(initialData?.coverImage || "");
  const [categoryId, setCategoryId] = React.useState(initialData?.categoryId || "");
  const [isPinned, setIsPinned] = React.useState(initialData?.isPinned || false);
  const [metaTitle, setMetaTitle] = React.useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = React.useState(initialData?.metaDescription || "");
  const [ogImage, setOgImage] = React.useState(initialData?.ogImage || "");

  // The slug follows the title until the admin types their own or the post has been public.
  const [slugInput, setSlugInput] = React.useState(initialData?.slug || "");
  const [slugManual, setSlugManual] = React.useState(() =>
    Boolean(
      initialData?.slug &&
        !hasBeenPublic({ ...initialData, status: initialData.status || "DRAFT" }) &&
        !slugFollowsTitle(initialData.slug, initialData.title)
    )
  );

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [saveState, setSaveState] = React.useState<SaveState>({ kind: "idle" });
  const [actionError, setActionError] = React.useState<string | null>(null);

  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const editorWrapRef = React.useRef<HTMLDivElement>(null);

  // Re-evaluated from the server state after every save, so publishing locks the URL at once.
  const slugLocked = hasBeenPublic(server);
  const followSlug = slugLocked
    ? server.slug
    : slugFollowsTitle(server.slug, title)
      ? server.slug
      : generateSlug(title);
  const typedSlug = generateSlug(slugInput);
  const slug = slugManual && typedSlug ? typedSlug : followSlug;

  const snapshot = {
    title: title.trim(),
    slug,
    content,
    excerpt: excerpt.trim(),
    coverImage: coverImage.trim(),
    categoryId,
    isPinned,
    metaTitle: metaTitle.trim(),
    metaDescription: metaDescription.trim(),
    ogImage: ogImage.trim(),
  };
  const snapshotKey = JSON.stringify(snapshot);
  const [savedKey, setSavedKey] = React.useState(snapshotKey);
  const isDirty = snapshotKey !== savedKey;

  const live = isLive(server);
  const isDraft = server.status === "DRAFT";
  const isScheduledPending = server.status === "SCHEDULED" && !live;
  const slugChangedOnPublicPost = slugLocked && !!server.slug && slug !== server.slug;

  // Saves run one at a time through this chain and read the latest values via refs, so an
  // autosave and a click on "Publish" can never race (e.g. creating the post twice).
  const latest = React.useRef({ snapshot, snapshotKey, postId });
  latest.current = { snapshot, snapshotKey, postId };
  const savedKeyRef = React.useRef(savedKey);
  const queueRef = React.useRef<Promise<unknown>>(Promise.resolve());

  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  // Grow the title textarea with its content.
  useIsomorphicLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  const save = React.useCallback(
    (intent: SaveIntent, opts: { auto?: boolean; scheduledAt?: string } = {}) => {
      const run = async (): Promise<boolean> => {
        const { snapshot: current, snapshotKey: currentKey, postId: currentId } = latest.current;

        if (opts.auto && currentKey === savedKeyRef.current) return true;
        if (!current.title) {
          if (!opts.auto) {
            setActionError("Add a title first.");
            titleRef.current?.focus();
          }
          return false;
        }

        setSaveState({ kind: "saving" });
        if (!opts.auto) setActionError(null);

        const statusByIntent: Record<SaveIntent, string | undefined> = {
          draft: "DRAFT",
          update: undefined, // keep the current status
          publish: "PUBLISHED",
          schedule: "SCHEDULED",
          unpublish: "DRAFT",
        };

        const payload = {
          ...current,
          slug: current.slug || undefined,
          categoryId: current.categoryId || null,
          status: statusByIntent[intent],
          scheduledAt:
            intent === "schedule" && opts.scheduledAt
              ? new Date(opts.scheduledAt).toISOString()
              : undefined,
        };

        try {
          const res = await fetch(currentId ? `/api/posts/${currentId}` : "/api/posts", {
            method: currentId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.error || "Couldn't save the post.");

          if (!currentId) {
            latest.current.postId = data.id;
            setPostId(data.id);
            // Swap the URL to the edit page without remounting the editor mid-typing.
            window.history.replaceState(null, "", `/admin/posts/${data.id}/edit`);
          }

          setServer({
            status: data.status,
            slug: data.slug,
            scheduledAt: data.scheduledAt,
            publishedAt: data.publishedAt,
          });
          // Keep what the admin typed unless the server had to change it (e.g. added "-2").
          setSlugInput((typed) => (generateSlug(typed) === data.slug ? typed : data.slug));

          const confirmedKey = JSON.stringify({ ...current, slug: data.slug });
          savedKeyRef.current = confirmedKey;
          setSavedKey(confirmedKey);

          const labels: Record<SaveIntent, string> = {
            draft: "Saved",
            update: "Updated",
            publish: "Published",
            schedule: "Scheduled",
            unpublish: "Moved to drafts",
          };
          setSaveState({ kind: "saved", at: new Date(), label: labels[intent] });
          return true;
        } catch (err: any) {
          const message = err?.message || "Couldn't save the post.";
          setSaveState({ kind: "error", message });
          if (!opts.auto) setActionError(message);
          return false;
        }
      };

      const result = queueRef.current.then(run);
      queueRef.current = result.catch(() => undefined);
      return result;
    },
    []
  );

  // Autosave drafts only: saving a published post would push half-finished edits live.
  React.useEffect(() => {
    if (!isDraft || !isDirty || !title.trim()) return;
    const timer = setTimeout(() => save("draft", { auto: true }), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [snapshotKey, isDraft, isDirty, title, save]);

  // Ctrl/Cmd+S saves (drafts) or updates (published / scheduled).
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(isDraft ? "draft" : "update");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDraft, save]);

  useUnsavedChangesWarning(isDirty || saveState.kind === "saving");

  async function openPreview() {
    // Open synchronously so the browser doesn't treat it as a pop-up, then point it at the
    // preview once the latest changes are saved. Only offered while the post isn't live.
    const tab = window.open("about:blank", "_blank");
    const ok = await save(isDraft ? "draft" : "update");
    const id = latest.current.postId;
    if (ok && id && tab) tab.location.href = `/preview/${id}`;
    else tab?.close();
  }

  function confirmUnpublish() {
    if (window.confirm("Unpublish this post? Readers will no longer see it until you publish again.")) {
      save("unpublish");
    }
  }

  function focusEditor() {
    editorWrapRef.current?.querySelector<HTMLElement>("[contenteditable='true']")?.focus();
  }

  /* ---------- Render ---------- */

  const statusChip = (() => {
    if (live) {
      return { label: "Published", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    }
    if (isScheduledPending && server.scheduledAt) {
      return {
        label: `Scheduled · ${formatDateTime(server.scheduledAt)}`,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      };
    }
    return { label: "Draft", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  })();

  const saveIndicator = (() => {
    if (saveState.kind === "saving") {
      return (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </span>
      );
    }
    if (saveState.kind === "error") {
      return (
        <span className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> Not saved
          <button type="button" className="underline underline-offset-2" onClick={() => save(isDraft ? "draft" : "update")}>
            Retry
          </button>
        </span>
      );
    }
    if (isDirty) {
      if (!title.trim()) return <span>Add a title to save</span>;
      return <span>{isDraft ? "Unsaved changes…" : "Unsaved changes"}</span>;
    }
    if (saveState.kind === "saved") {
      return (
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" /> {saveState.label} {formatTime(saveState.at)}
        </span>
      );
    }
    return null;
  })();

  const saving = saveState.kind === "saving";

  return (
    <div>
      <h1 className="sr-only">{postId ? "Edit post" : "New post"}</h1>

      {/* Action bar: stays visible while writing */}
      <div className="sticky top-0 z-30 -mx-8 -mt-8 mb-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-8">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <Link
              href="/admin/posts"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Posts
            </Link>
            <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-medium", statusChip.className)}>
              {statusChip.label}
            </span>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline" aria-live="polite">
              {saveIndicator}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {live ? (
              <Button variant="ghost" size="sm" asChild>
                <a href={`/post/${server.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> View
                </a>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={openPreview} disabled={saving || !title.trim()}>
                <Eye className="mr-1.5 h-4 w-4" /> Preview
              </Button>
            )}

            {isDraft && (
              <PublishMenu
                triggerLabel="Publish"
                disabled={saving}
                onPublishNow={() => save("publish")}
                onSchedule={(when) => save("schedule", { scheduledAt: when })}
              />
            )}

            {isScheduledPending && (
              <>
                <PublishMenu
                  triggerLabel="Schedule"
                  triggerVariant="outline"
                  currentSchedule={server.scheduledAt}
                  disabled={saving}
                  onPublishNow={() => save("publish")}
                  onSchedule={(when) => save("schedule", { scheduledAt: when })}
                  onRevertToDraft={() => save("unpublish")}
                />
                <Button onClick={() => save("update")} disabled={saving || !isDirty}>
                  Update
                </Button>
              </>
            )}

            {live && (
              <>
                <Button variant="outline" onClick={confirmUnpublish} disabled={saving}>
                  Unpublish
                </Button>
                <Button onClick={() => save("update")} disabled={saving || !isDirty}>
                  Update
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Writing column */}
        <div className="min-w-0 space-y-4">
          {actionError && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {actionError}
              </span>
              <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!isDraft && isDirty && (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {live
                ? "This post is live. Changes stay private until you click Update."
                : "Changes are saved when you click Update."}
            </p>
          )}

          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                focusEditor();
              }
            }}
            rows={1}
            placeholder="Post title"
            aria-label="Post title"
            className="w-full resize-none overflow-hidden bg-transparent font-serif text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight placeholder:text-muted-foreground/60 focus:outline-none"
          />

          <div ref={editorWrapRef}>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story…"
              toolbarClassName="top-14"
            />
          </div>
        </div>

        {/* Settings sidebar */}
        <aside
          aria-label="Post settings"
          className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:pb-4"
        >
          <SidebarSection title="Post settings">
            <div className="space-y-2">
              <Label htmlFor="slug">URL</Label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
                <span className="pl-3 text-sm text-muted-foreground">/post/</span>
                <input
                  id="slug"
                  value={slugManual ? slugInput : followSlug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlugInput(e.target.value);
                  }}
                  placeholder="generated-from-title"
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm focus:outline-none"
                />
              </div>
              {slugManual && !slugInput.trim() ? (
                <p className="text-xs text-muted-foreground">
                  {slugLocked ? "Leave empty to keep the current URL." : "Leave empty to use the title."}
                </p>
              ) : slugManual && !typedSlug ? (
                <p className="text-xs text-destructive">The URL needs letters or numbers.</p>
              ) : slugChangedOnPublicPost ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This post has been public. Changing its URL breaks existing links to it.
                </p>
              ) : !slugManual ? (
                <p className="text-xs text-muted-foreground">
                  {slugLocked
                    ? "Stays fixed now that the post has been public, so links keep working."
                    : "Follows the title until the post is published."}
                </p>
              ) : !slugLocked ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={() => {
                    setSlugManual(false);
                    setSlugInput("");
                  }}
                >
                  Generate from title
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={selectClassName}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="flex items-center gap-1 font-medium">
                  <Pin className="h-3.5 w-3.5" /> Pin to top of feed
                </span>
                <span className="text-xs text-muted-foreground">Shown first on the home page.</span>
              </span>
            </label>
          </SidebarSection>

          <SidebarSection title="Excerpt">
            <div className="space-y-1">
              <textarea
                id="excerpt"
                aria-label="Excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A one or two sentence summary shown in post lists and link previews."
                className={textareaClassName}
              />
              <div className="flex justify-end">
                <CharCount value={excerpt} max={EXCERPT_LIMIT} />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection title="Cover image">
            <ImageField id="coverImage" label="Cover image" value={coverImage} onChange={setCoverImage} hideLabel />
          </SidebarSection>

          <SidebarSection
            title="Search & social"
            collapsible
            defaultOpen={Boolean(metaTitle || metaDescription || ogImage)}
          >
            <SnippetPreview
              title={metaTitle || title}
              slug={slug}
              description={metaDescription || excerpt}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta title</Label>
                <CharCount value={metaTitle || title} max={META_TITLE_LIMIT} />
              </div>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Uses the post title if empty"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">Meta description</Label>
                <CharCount value={metaDescription || excerpt} max={META_DESCRIPTION_LIMIT} />
              </div>
              <textarea
                id="metaDescription"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Uses the excerpt if empty"
                className={textareaClassName}
              />
            </div>

            <ImageField
              id="ogImage"
              label="Social image"
              value={ogImage}
              onChange={setOgImage}
              hint="Shown when the post is shared. Uses the cover image if empty."
            />
          </SidebarSection>
        </aside>
      </div>
    </div>
  );
}
