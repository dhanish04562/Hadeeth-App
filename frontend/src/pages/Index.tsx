import { AppLayout } from "@/components/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDB, Book } from "@/data/store";
import { NuurLogo } from "@/components/NuurLogo";
import heroPattern from "@/assets/hero-pattern.jpg";
import {
  ArrowRight,
  BookOpenText,
  Languages,
  Library,
  Search,
  ScrollText,
} from "lucide-react";

const nineBooks = [
  "Sahih al-Bukhari",
  "Sahih Muslim",
  "Sunan an-Nasa'i",
  "Sunan Abi Dawud",
  "Jami` at-Tirmidhi",
  "Sunan Ibn Majah",
  "Muwatta Malik",
  "Musnad Ahmad",
  "Sunan ad-Darimi",
];

const primaryCollections = [
  "Sahih Ibn Khuzayma",
  "Sahih Ibn Hibban",
  "Mustadrak al-Hakim",
  "Musannaf Abd ar-Razzaq",
  "Musannaf Ibn Abi Shayba",
  "Sunan ad-Daraqutni",
  "As-Sunan al-Kubra",
  "Al-Adab Al-Mufrad",
];

const selections = [
  "An-Nawawi's 40 Hadith",
  "Riyad as-Salihin",
  "Mishkat al-Masabih",
  "Bulugh al-Maram",
  "Hisn al-Muslim",
];

function findBook(books: Book[], title: string) {
  const normalized = title.toLowerCase();
  return books.find((book) => book.title.toLowerCase().includes(normalized));
}

function CollectionList({ title, items, books }: { title: string; items: string[]; books: Book[] }) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center gap-2">
        <Library className="h-4 w-4 text-accent" />
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      </div>
      <div className="grid gap-2">
        {items.map((item) => {
          const book = findBook(books, item);
          const content = (
            <>
              <span className="truncate">{book?.title || item}</span>
              {book ? (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {book.hadeethCount.toLocaleString()}
                </span>
              ) : (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">Soon</span>
              )}
            </>
          );

          return book ? (
            <Link
              key={item}
              to={`/book/${book.id}`}
              className="flex h-11 items-center gap-3 rounded-md border border-border bg-card px-4 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {content}
            </Link>
          ) : (
            <div
              key={item}
              className="flex h-11 items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 px-4 text-sm text-muted-foreground"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const Index = () => {
  const { books, hadeeth, languages, isLoading } = useDB();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const published = hadeeth.filter((item) => item.isPublished);
  const stats = [
    { label: "Collections", value: books.length, icon: BookOpenText },
    { label: "Hadeeth", value: published.length || hadeeth.length, icon: ScrollText },
    { label: "Languages", value: languages.length, icon: Languages },
  ];

  const liveResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return [
      ...books
        .filter((book) => [book.title, book.author, book.notes].join(" ").toLowerCase().includes(q))
        .slice(0, 3)
        .map((book) => ({ id: book.id, label: book.title, meta: book.author, to: `/book/${book.id}` })),
      ...hadeeth
        .filter((item) =>
          [item.english, item.reportedBy, item.referenceNumber].join(" ").toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          label: item.english || `Hadeeth ${item.referenceNumber}`,
          meta: item.reportedBy,
          to: `/hadeeth/${item.id}`,
        })),
    ];
  }, [books, hadeeth, query]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstResult = liveResults[0];
    if (firstResult) {
      navigate(firstResult.to);
    }
  }

  return (
    <AppLayout>
      <section className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
        <img
          src={heroPattern}
          alt=""
          width={1920}
          height={1080}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-luminosity"
        />
        <div className="container relative z-10 px-6 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-accent">Nuur Hadith Library</p>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
                The hadith of the Prophet Muhammad at your fingertips
              </h1>
              <form onSubmit={submitSearch} className="mt-8 max-w-3xl">
                <div className="flex min-h-14 items-center rounded-md border border-primary-foreground/15 bg-background text-foreground shadow-elegant">
                  <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search hadeeth, narrators, references, or books"
                    className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    className="mr-2 inline-flex h-10 items-center gap-2 rounded-md bg-gradient-gold px-4 text-sm font-medium text-primary transition-transform hover:-translate-y-0.5"
                  >
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {query ? (
                  <div className="mt-2 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-soft">
                    {liveResults.length ? (
                      liveResults.map((result) => (
                        <Link
                          key={result.id}
                          to={result.to}
                          className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/60"
                        >
                          <span className="line-clamp-1 text-sm">{result.label}</span>
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{result.meta}</span>
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        {isLoading ? "Loading library..." : "No matches found."}
                      </p>
                    )}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-primary-foreground/10 bg-primary-foreground/10">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-primary/70 p-4">
                  <stat.icon className="mb-4 h-5 w-5 text-accent" />
                  <p className="font-serif text-3xl text-gradient-gold">{stat.value.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-primary-foreground/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="container grid gap-4 px-6 py-8 md:grid-cols-4">
          {[
            { label: "Exact phrase", example: "\"actions are judged\"" },
            { label: "Narrator", example: "Umar ibn al-Khattab" },
            { label: "Reference", example: "1 or 223" },
            { label: "Topic", example: "purity, faith, intention" },
          ].map((tip) => (
            <div key={tip.label} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-accent">{tip.label}</p>
              <p className="mt-2 text-sm text-foreground">{tip.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container px-6 py-14">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Collections</p>
            <h2 className="mt-2 font-serif text-4xl text-foreground">Browse by source</h2>
          </div>
          <Link to="/collections" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-glow">
            View all collections
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <CollectionList title="The Nine Books" items={nineBooks} books={books} />
          <CollectionList title="Other Primary Collections" items={primaryCollections} books={books} />
          <CollectionList title="Selections" items={selections} books={books} />
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="container grid gap-8 px-6 py-10 md:grid-cols-[1fr_2fr] md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Languages</p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">Available translations</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.length ? (
              languages.map((language) => (
                <span
                  key={language.code}
                  className="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground"
                >
                  {language.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Loading languages...</span>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="container flex flex-col items-center gap-3 px-6 py-10 text-center">
          <NuurLogo wordmark className="h-12" />
          <p className="max-w-md text-sm text-muted-foreground">
            A searchable hadith library organized by collection, narration, and language.
          </p>
        </div>
      </footer>
    </AppLayout>
  );
};

export default Index;
