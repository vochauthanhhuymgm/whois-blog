"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoteH1 } from "@/lib/heading-utils";
import { uploadMedia } from "@/lib/media-client";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Loader2,
  X,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  /** Extra classes for the toolbar, e.g. a sticky `top-*` offset below a page header. */
  toolbarClassName?: string;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-1" aria-hidden />;
}

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  return `https://${url}`;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write your story...",
  toolbarClassName,
}: TiptapEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The post title is the page's h1, so the body starts at h2.
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    // Older posts may contain h1; keep them as headings rather than letting Tiptap drop them to paragraphs.
    content: demoteH1(content),
    editorProps: {
      attributes: {
        // Same typography as the published article, so what you write is what readers see.
        class:
          "prose prose-lg prose-stone dark:prose-invert font-serif max-w-none min-h-[60vh] px-1 py-6 focus:outline-none",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openLinkEditor();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content in sync if initial content changes (e.g. edit page load)
  React.useEffect(() => {
    const normalized = demoteH1(content);
    if (editor && normalized !== editor.getHTML()) {
      editor.commands.setContent(normalized, { emitUpdate: false });
    }
  }, [content, editor]);

  // handleKeyDown is captured once by Tiptap, so it reads the editor through a ref.
  const editorRef = React.useRef<Editor | null>(null);
  editorRef.current = editor;

  function openLinkEditor() {
    const current = editorRef.current;
    if (!current) return;
    setLinkUrl(current.getAttributes("link").href || "");
    setLinkOpen(true);
    requestAnimationFrame(() => linkInputRef.current?.focus());
  }

  function closeLinkEditor() {
    setLinkOpen(false);
    editorRef.current?.commands.focus();
  }

  function applyLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editor) return;
    const href = normalizeUrl(linkUrl);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setLinkOpen(false);
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const media = await uploadMedia(file);
      editor.chain().focus().setImage({ src: media.url, alt: media.fileName }).run();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!editor) {
    return <div className="min-h-[60vh] py-6 text-muted-foreground">Loading editor…</div>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        className={cn(
          "sticky z-20 -mx-1 rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs",
          toolbarClassName ?? "top-0"
        )}
      >
        <div className="flex flex-wrap items-center gap-1 p-1.5" role="toolbar" aria-label="Formatting">
          <ToolbarButton label="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Subheading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Link (Ctrl+K)" active={editor.isActive("link") || linkOpen} onClick={openLinkEditor}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <ToolbarButton
            label={isUploading ? "Uploading image…" : "Insert image"}
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {linkOpen && (
          <form
            onSubmit={applyLink}
            className="flex items-center gap-2 border-t p-2 motion-safe:animate-fade-in"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                closeLinkEditor();
              }
            }}
          >
            <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              ref={linkInputRef}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste or type a link…"
              aria-label="Link URL"
              className="h-8"
            />
            <Button type="submit" size="sm" className="h-8">
              Apply
            </Button>
            {editor.isActive("link") && (
              <Button type="button" size="sm" variant="ghost" className="h-8" onClick={removeLink}>
                Remove
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={closeLinkEditor}
              aria-label="Close link editor"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        )}

        {uploadError && (
          <div role="alert" className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm text-destructive">
            {uploadError}
            <button type="button" onClick={() => setUploadError(null)} aria-label="Dismiss" className="hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
