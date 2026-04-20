import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB } from "@/data/store";
import { BookOpenText } from "lucide-react";

const Collections = () => {
  const { books } = useDB();
  return (
  <AppLayout>
    <section className="container px-6 py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.24em] text-accent">The Library</p>
      <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
        All collections
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Browse the full canon of authentic hadeeth literature.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b, i) => (
          <Link
            key={b.id}
            to={`/book/${b.id}`}
            style={{ animationDelay: `${i * 50}ms` }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-500 animate-fade-in hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <BookOpenText className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-2xl text-foreground">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.author}</p>
            <p className="mt-4 line-clamp-3 text-sm text-foreground/70">{b.notes}</p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">
                {b.hadeethCount.toLocaleString()} narrations
              </span>
              <span className="font-medium text-primary transition-transform group-hover:translate-x-1">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  </AppLayout>
  );
};

export default Collections;
