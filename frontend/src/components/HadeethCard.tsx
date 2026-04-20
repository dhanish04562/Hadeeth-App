import { Link } from "react-router-dom";
import { Hadeeth, useDB } from "@/data/store";
import { Bookmark, Share2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HadeethCard({
  h,
  index = 0,
  compact = false,
}: {
  h: Hadeeth;
  index?: number;
  compact?: boolean;
}) {
  const { books } = useDB();
  const book = books.find((b) => b.id === h.bookId);
  return (
    <article
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all duration-500 animate-fade-in hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant md:p-8"
    >
      {/* corner ornament */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-gold opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-20" />

      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <Link
              to={`/book/${h.bookId}`}
              className="font-serif text-base text-foreground transition-colors hover:text-primary"
            >
              {book?.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              Hadeeth #{h.referenceNumber} · Reported by {h.reportedBy}
            </p>
          </div>
        </div>
        {h.grade && (
          <Badge
            variant="secondary"
            className="border border-accent/30 bg-accent/10 font-medium text-accent-foreground"
          >
            {h.grade}
          </Badge>
        )}
      </header>

      <p
        dir="rtl"
        className="font-arabic text-2xl leading-[2.2] text-foreground md:text-[28px]"
      >
        {h.arabic}
      </p>

      <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Translation</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className={`font-serif text-foreground/90 ${compact ? "text-lg" : "text-xl leading-relaxed md:text-[22px]"}`}>
        {h.english}
      </p>

      {h.notes && !compact && (
        <p className="mt-4 border-l-2 border-accent/60 bg-accent/5 px-4 py-2 text-sm italic text-muted-foreground">
          {h.notes}
        </p>
      )}

      <footer className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <Link
          to={`/hadeeth/${h.id}`}
          className="text-sm font-medium text-primary transition-colors hover:text-primary-glow"
        >
          Read full →
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </article>
  );
}
