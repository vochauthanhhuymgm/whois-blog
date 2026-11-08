import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Mail, Calendar, User as UserIcon } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | whois-blog",
  description: "About the author and the whois-blog platform",
};

export default async function AboutPage() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const memberSince = admin?.createdAt
    ? new Date(admin.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1 container max-w-3xl px-4 sm:px-8 py-16">
        <div className="space-y-12">
          {/* Author Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
            {admin?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={admin.image}
                alt={admin.name || "Admin Author"}
                className="w-32 h-32 rounded-full object-cover border-4 border-muted shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl border-4 border-muted shadow-md">
                {admin?.name ? admin.name[0] : <UserIcon className="w-16 h-16" />}
              </div>
            )}

            <div className="space-y-3 flex-1">
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight">
                {admin?.name || "The Author"}
              </h1>
              <p className="text-muted-foreground font-serif text-lg">
                Writer, creator, and administrator of whois-blog.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
                {admin?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {admin.email}
                  </span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Publishing since {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Author Bio Section */}
          <section className="border-t pt-8 space-y-6">
            <h2 className="font-serif text-2xl font-bold tracking-tight">About Me</h2>
            {admin?.bio ? (
              <div className="prose prose-stone dark:prose-invert font-serif text-base leading-relaxed whitespace-pre-wrap">
                {admin.bio}
              </div>
            ) : (
              <p className="text-muted-foreground font-serif italic">
                Welcome to whois-blog! The author hasn&apos;t written their bio yet. Check back soon for stories, technical deep-dives, and essays.
              </p>
            )}
          </section>

          {/* About Platform Section */}
          <section className="border-t pt-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold tracking-tight">About whois-blog</h2>
            <p className="text-muted-foreground font-serif leading-relaxed">
              whois-blog is an independent publishing platform designed for focused writing, thoughtful discussions, and clean typography. Built with Next.js, Tailwind CSS, Prisma, and NextAuth.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
