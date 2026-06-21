import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB } from "@/data/store";
import { HadeethCard } from "@/components/HadeethCard";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";

const BookPage = () => {
  const { id = "" } = useParams();
  const dbState = useDB();
  const book = dbState.books.find((b) => b.id === id);
  const kitabs = dbState.kitabs.filter((k) => k.bookId === id);
  const chapters = dbState.chapters.filter((c) => c.bookId === id);
  const [activeChapter, setActiveChapter] = useState<string | "all">("all");
  const [q, setQ] = useState("");

  const chaptersByKitab = useMemo(() => {
    return chapters.reduce<Record<string, typeof chapters>>((groups, chapter) => {
      if (chapter.kitabId) {
        groups[chapter.kitabId] = groups[chapter.kitabId] || [];
        groups[chapter.kitabId].push(chapter);
      }
      return groups;
    }, {});
  }, [chapters]);

  const list = useMemo(() => {
    let base = dbState.hadeeth.filter((h) => h.bookId === id);

    if (activeChapter !== "all") {
      const selectedChapter = chapters.find((chapter) => chapter.id === activeChapter);
      if (selectedChapter) {
        base = base.filter((h) => h.chapterId === activeChapter);
      } else {
        const selectedKitab = kitabs.find((kitab) => kitab.id === activeChapter);
        if (selectedKitab) {
          const chapterIds = new Set(
            chapters
              .filter((chapter) => chapter.kitabId === selectedKitab.id)
              .map((chapter) => chapter.id)
          );
          base = base.filter((h) => chapterIds.has(h.chapterId));
        }
      }
    }

    if (!q.trim()) return base;
    const needle = q.toLowerCase();
    return base.filter(
      (h) =>
        h.english.toLowerCase().includes(needle) ||
        h.tamil.toLowerCase().includes(needle) ||
        h.arabic.toLowerCase().includes(needle) ||
        h.reportedBy.toLowerCase().includes(needle)
    );
  }, [id, activeChapter, q, dbState.hadeeth, chapters, kitabs]);

  if (!book && dbState.isLoading) {
    return (
      <AppLayout>
        <div className="container px-6 py-24 text-center text-muted-foreground">
          Loading book...
        </div>
      </AppLayout>
    );
  }

  if (!book) {
    return (
      <AppLayout>
        <div className="container px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">Book not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary">
            ← Home
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="border-b border-border bg-gradient-emerald text-primary-foreground">
        <div className="container px-6 py-16 md:py-20">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 hover:text-accent"
          >
            ← Library
          </Link>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
            {book.title}
          </h1>
          <p className="mt-3 text-lg text-primary-foreground/70">{book.author}</p>
          <p className="mt-6 max-w-2xl text-primary-foreground/80">{book.notes}</p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <span>
              <span className="font-serif text-2xl text-gradient-gold">
                {book.hadeethCount.toLocaleString()}
              </span>
              <span className="ml-2 text-primary-foreground/60">hadeeth</span>
            </span>
            <span>
              <span className="font-serif text-2xl text-gradient-gold">{kitabs.length}</span>
              <span className="ml-2 text-primary-foreground/60">kitabs</span>
            </span>
            <span>
              <span className="font-serif text-2xl text-gradient-gold">{chapters.length}</span>
              <span className="ml-2 text-primary-foreground/60">chapters</span>
            </span>
          </div>
        </div>
      </section>

      <div className="container grid gap-10 px-6 py-12 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Kitabs
          </p>
          <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-2">
            <button
              onClick={() => setActiveChapter("all")}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeChapter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              All hadeeth
            </button>
            {kitabs.map((kitab) => {
              const babs = chaptersByKitab[kitab.id] || [];
              const isKitabActive = activeChapter === kitab.id;

              return (
                <div key={kitab.id} className="rounded-lg border border-border/60 bg-card/40">
                  <button
                    onClick={() => setActiveChapter(kitab.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isKitabActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{kitab.title}</span>
                    <span
                      className={`text-[11px] ${
                        isKitabActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {kitab.hadeethCount}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  </button>

                  {babs.length > 0 && (
                    <div className="border-t border-border/60 py-1">
                      {babs.map((bab) => (
                        <button
                          key={bab.id}
                          onClick={() => setActiveChapter(bab.id)}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 pl-6 text-left text-xs transition-colors ${
                            activeChapter === bab.id
                              ? "bg-accent/15 text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{bab.title}</span>
                          <span>{bab.hadeethCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div>
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter within this book…"
              className="h-12 rounded-full border-border bg-card pl-11"
            />
          </div>

          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
              No hadeeth match your filter.
            </p>
          ) : (
            <div className="space-y-6">
              {list.map((h, i) => (
                <HadeethCard h={h} key={h.id} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BookPage;
