import { AppLayout } from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useDB } from "@/data/store";
import { HadeethCard } from "@/components/HadeethCard";
import { NuurLogo } from "@/components/NuurLogo";
import heroPattern from "@/assets/hero-pattern.jpg";
import { ArrowRight, BookOpenText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { books, hadeeth, isLoading } = useDB();
  const published = hadeeth.filter((item) => item.isPublished);
  const featured = published[0] || hadeeth[0];
  const today =
    published[Math.floor(Date.now() / 86400000) % Math.max(published.length, 1)] || featured;
  const firstBook = books[0];

  return (
    <AppLayout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <img
          src={heroPattern}
          alt=""
          width={1920}
          height={1080}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="container relative z-10 flex flex-col items-center px-6 py-24 text-center md:py-36">
          <Badge className="mb-6 border-accent/40 bg-accent/15 text-accent-foreground hover:bg-accent/20">
            <Sparkles className="mr-1.5 h-3 w-3" /> A modern hadeeth library
          </Badge>
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] text-primary-foreground md:text-7xl lg:text-8xl">
            Where the words of the
            <span className="block italic text-gradient-gold">Beloved Prophet</span>
            meet timeless design.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/70 md:text-lg">
            Read, search and reflect on authentic hadeeth from the great collections - beautifully
            typeset, lightning fast, distraction-free.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {firstBook ? (
              <Link
                to={`/book/${firstBook.id}`}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-3.5 text-sm font-medium text-primary shadow-gold transition-transform hover:-translate-y-0.5"
              >
                Begin reading
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gradient-gold px-7 py-3.5 text-sm font-medium text-primary shadow-gold">
                {isLoading ? "Loading library..." : "Library unavailable"}
              </span>
            )}
            <Link
              to="/daily"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-7 py-3.5 text-sm text-primary-foreground/90 backdrop-blur-sm transition-colors hover:bg-primary-foreground/10"
            >
              Hadeeth of the day
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur">
            {[
              { v: "34,000+", l: "Hadeeth" },
              { v: "7", l: "Major collections" },
              { v: "5", l: "Languages" },
            ].map((stat) => (
              <div key={stat.l} className="bg-primary/40 p-6 text-center">
                <div className="font-serif text-3xl text-gradient-gold md:text-4xl">{stat.v}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-primary-foreground/60">
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Featured</p>
            <h2 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">
              The opening hadeeth
            </h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {featured ? (
              <HadeethCard h={featured} index={0} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
                {isLoading ? "Loading featured hadeeth..." : "No published hadeeth available yet."}
              </div>
            )}
          </div>
          <aside className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-primary/15 bg-gradient-emerald p-8 text-primary-foreground shadow-elegant">
              <p className="text-[11px] uppercase tracking-[0.24em] text-accent/90">Today</p>
              <h3 className="mt-2 font-serif text-3xl">Hadeeth of the day</h3>
              <p
                dir="rtl"
                className="font-arabic mt-6 text-xl leading-loose text-primary-foreground/95"
              >
                {today?.arabic || ""}
              </p>
              <p className="mt-5 font-serif text-lg italic text-primary-foreground/80">
                "{today?.english || (isLoading ? "Loading..." : "No hadeeth available.")}"
              </p>
              <p className="mt-4 text-xs text-primary-foreground/60">
                - Reported by {today?.reportedBy || "N/A"}
              </p>
            </div>
            <div className="arabesque rounded-2xl border border-border bg-card p-8">
              <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Reflect</p>
              <p className="mt-3 font-serif text-2xl leading-snug text-foreground">
                Read one hadeeth a day. Let it shape a year.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="container px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">The Library</p>
            <h2 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">
              Canonical collections
            </h2>
          </div>
          <Link
            to="/collections"
            className="hidden text-sm text-primary hover:text-primary-glow md:inline-flex"
          >
            View all {"->"}
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-500 animate-fade-in hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {book.era}
                </span>
              </div>
              <h3 className="font-serif text-2xl leading-tight text-foreground">{book.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
              <p className="mt-4 line-clamp-2 text-sm text-foreground/70">{book.notes}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">
                  {book.hadeethCount.toLocaleString()} narrations
                </span>
                <span className="font-medium text-primary transition-transform group-hover:translate-x-1">
                  Open {"->"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="container flex flex-col items-center gap-3 px-6 py-12 text-center">
          <NuurLogo wordmark className="h-12" />
          <p className="max-w-md text-sm text-muted-foreground">
            Built with reverence. A modern reading experience for the timeless words of the
            Prophet.
          </p>
        </div>
      </footer>
    </AppLayout>
  );
};

export default Index;
