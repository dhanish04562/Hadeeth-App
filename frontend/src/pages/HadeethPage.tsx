import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB } from "@/data/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

const HadeethPage = () => {
  const { id = "" } = useParams();
  const { hadeeth, books, isLoading } = useDB();
  const h = hadeeth.find((x) => x.id === id);

  if (!h && isLoading) {
    return (
      <AppLayout>
        <div className="container px-6 py-24 text-center text-muted-foreground">
          Loading hadeeth...
        </div>
      </AppLayout>
    );
  }

  if (!h) {
    return (
      <AppLayout>
        <div className="container px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">Hadeeth not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary">← Home</Link>
        </div>
      </AppLayout>
    );
  }

  const book = books.find((b) => b.id === h.bookId);
  const idx = hadeeth.findIndex((x) => x.id === h.id);
  const prev = hadeeth[idx - 1];
  const next = hadeeth[idx + 1];

  return (
    <AppLayout>
      <article className="container max-w-3xl px-6 py-16 md:py-24">
        <Link
          to={`/book/${h.bookId}`}
          className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-primary"
        >
          ← {book?.title}
        </Link>

        <header className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-sm text-muted-foreground">
              Hadeeth #{h.referenceNumber}
            </p>
            <p className="text-sm text-foreground/80">Reported by {h.reportedBy}</p>
          </div>
          {h.grade && (
            <Badge className="border border-accent/30 bg-accent/15 text-accent-foreground hover:bg-accent/20">
              {h.grade}
            </Badge>
          )}
        </header>

        <div
          dir="rtl"
          className="font-arabic mt-12 text-3xl leading-[2.4] text-foreground md:text-4xl"
        >
          {h.arabic}
        </div>

        <div className="my-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>Translation</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="font-serif text-2xl leading-relaxed text-foreground md:text-3xl">
          {h.english}
        </p>

        {h.notes && (
          <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Note</p>
            <p className="mt-2 font-serif text-lg text-foreground/90">{h.notes}</p>
          </div>
        )}

        <div className="mt-10 flex items-center gap-2">
          <Button variant="outline" className="rounded-full">
            <Bookmark className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button variant="outline" className="rounded-full">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>

        <nav className="mt-16 flex items-center justify-between border-t border-border pt-6">
          {prev ? (
            <Link
              to={`/hadeeth/${prev.id}`}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Previous
            </Link>
          ) : <span />}
          {next && (
            <Link
              to={`/hadeeth/${next.id}`}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              Next
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </nav>
      </article>
    </AppLayout>
  );
};

export default HadeethPage;
