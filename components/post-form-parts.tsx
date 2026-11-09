"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/media-client";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, ChevronDown, Loader2, Upload, X } from "lucide-react";

/* ---------- Small building blocks ---------- */

export function CharCount({ value, max }: { value: string; max: number }) {
  const length = value.length;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        length > max ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
      )}
      aria-live="polite"
    >
      {length}/{max}
    </span>
  );
}

export function SidebarSection({
  title,
  children,
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();

  return (
    <section className="rounded-lg border bg-card">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-accent/40 rounded-lg"
        >
          {title}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      ) : (
        <h2 className="px-4 pt-3 text-sm font-semibold">{title}</h2>
      )}
      {open && (
        <div id={id} className="space-y-4 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </section>
  );
}

export const textareaClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/* ---------- Image field (cover / social image) ---------- */

export function ImageField({
  id,
  label,
  value,
  onChange,
  hint,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** Keep the label for screen readers only, e.g. when the section title already says it. */
  hideLabel?: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [broken, setBroken] = React.useState(false);

  React.useEffect(() => setBroken(false), [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const media = await uploadMedia(file);
      onChange(media.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </Label>

      {value ? (
        <div className="relative overflow-hidden rounded-md border bg-muted aspect-video">
          {broken ? (
            <div className="flex h-full items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4" /> Image can&apos;t be loaded
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7 shadow"
            onClick={() => onChange("")}
            aria-label={`Remove ${label.toLowerCase()}`}
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed py-6 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {isUploading ? "Uploading…" : "Upload image"}
        </button>
      )}

      <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />

      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="h-9 text-xs"
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
            title="Replace with an upload"
            aria-label={`Upload a new ${label.toLowerCase()}`}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---------- Search result preview ---------- */

export function SnippetPreview({
  title,
  slug,
  description,
}: {
  title: string;
  slug: string;
  description: string;
}) {
  const [host, setHost] = React.useState("your-blog");
  React.useEffect(() => setHost(window.location.host), []);

  return (
    <div className="rounded-md border bg-background p-3 text-left font-sans" aria-label="Search result preview">
      <p className="truncate text-xs text-muted-foreground">
        {host} › post › {slug || "…"}
      </p>
      <p className="mt-1 line-clamp-1 text-base text-[#1a0dab] dark:text-[#8ab4f8]">
        {title || "Post title"} | whois-blog
      </p>
      <p className={cn("mt-1 line-clamp-2 text-xs", description ? "text-foreground/80" : "italic text-muted-foreground")}>
        {description || "Add an excerpt or meta description so search results show a summary."}
      </p>
    </div>
  );
}

/* ---------- Publish / schedule popover ---------- */

function defaultScheduleValue(current?: string | Date | null): string {
  if (current && new Date(current).getTime() > Date.now()) return toDateTimeLocalValue(current);
  const tomorrowNine = new Date();
  tomorrowNine.setDate(tomorrowNine.getDate() + 1);
  tomorrowNine.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(tomorrowNine);
}

export function PublishMenu({
  triggerLabel,
  triggerVariant = "default",
  currentSchedule,
  disabled,
  onPublishNow,
  onSchedule,
  onRevertToDraft,
}: {
  triggerLabel: string;
  triggerVariant?: "default" | "outline";
  currentSchedule?: string | Date | null;
  disabled?: boolean;
  onPublishNow: () => Promise<boolean>;
  onSchedule: (localDateTime: string) => Promise<boolean>;
  onRevertToDraft?: () => Promise<boolean>;
}) {
  const [open, setOpen] = React.useState(false);
  const [when, setWhen] = React.useState<"now" | "later">(currentSchedule ? "later" : "now");
  const [dateTime, setDateTime] = React.useState(() => defaultScheduleValue(currentSchedule));
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setWhen(currentSchedule ? "later" : "now");
    setDateTime(defaultScheduleValue(currentSchedule));
    setError(null);

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, currentSchedule]);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) setOpen(false);
  }

  function confirm() {
    setError(null);
    if (when === "now") return run(onPublishNow);
    const date = new Date(dateTime);
    if (!dateTime || isNaN(date.getTime())) return setError("Choose a date and time.");
    if (date.getTime() <= Date.now()) return setError("Pick a time in the future.");
    return run(() => onSchedule(dateTime));
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant={triggerVariant}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {triggerLabel}
        <ChevronDown className="ml-1.5 h-4 w-4" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Publish settings"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg motion-safe:animate-fade-in"
        >
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">When should readers see it?</legend>
            {(["now", "later"] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  when === option ? "border-primary bg-accent/40" : "hover:bg-accent/30"
                )}
              >
                <input
                  type="radio"
                  name="publish-when"
                  value={option}
                  checked={when === option}
                  onChange={() => setWhen(option)}
                  className="h-4 w-4"
                />
                {option === "now" ? "Publish now" : "Schedule for later"}
              </label>
            ))}
          </fieldset>

          {when === "later" && (
            <div className="mt-3 space-y-1">
              <Label htmlFor="publish-at" className="text-xs">
                Publish date and time (your local time)
              </Label>
              <Input
                id="publish-at"
                type="datetime-local"
                value={dateTime}
                min={toDateTimeLocalValue(new Date())}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            {onRevertToDraft ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => run(onRevertToDraft)}
                className="text-muted-foreground"
              >
                Revert to draft
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" size="sm" disabled={busy} onClick={confirm}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
              {when === "now" ? "Publish" : "Schedule"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
