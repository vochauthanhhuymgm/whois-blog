import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t py-12 bg-muted/20 text-muted-foreground text-sm">
      <div className="container px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-serif font-bold text-foreground">whois-blog</span>
          <span className="mx-2">—</span>
          <span>A personal blog and thinking space.</span>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/archive" className="hover:underline">Archive</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/auth/signin" className="hover:underline">Admin Login</Link>
        </div>
      </div>
    </footer>
  );
}
