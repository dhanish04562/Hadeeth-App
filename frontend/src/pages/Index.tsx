import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB, getChildren, getHadithByNode, getDescendantNodeIds } from "@/data/store";
import { HadeethCard } from "@/components/HadeethCard";
import { SearchIcon, BookOpen, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function Index() {
  const { nodes, hadeeth, languages, isLoading, error } = useDB();
  const [query, setQuery] = useState("");

  const rootNodes = useMemo(() => getChildren(nodes, null), [nodes]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return hadeeth.filter((h) => {
      const node = nodes.find((n) => n.id === h.node_id);
      return (
        h.arabic.toLowerCase().includes(q) ||
        h.tamil.toLowerCase().includes(q) ||
        h.english.toLowerCase().includes(q) ||
        h.reportedBy.toLowerCase().includes(q) ||
        String(h.referenceNumber).includes(q) ||
        (node?.title || "").toLowerCase().includes(q)
      );
    });
  }, [query, hadeeth, nodes]);

  const langCount = languages.length;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-lg text-destructive">Failed to load data</p>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="container max-w-3xl px-6 py-20">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="font-serif text-5xl text-foreground md:text-6xl">
            Hadeeth Library
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {rootNodes.length} collections · {hadeeth.length} narrations · {langCount} languages
          </p>
        </div>

        {/* Search */}
        <div className="relative mx-auto mb-16 max-w-xl">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search all narrations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-border/60 bg-card py-4 pl-12 pr-4 font-serif text-lg text-foreground shadow-soft outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:shadow-elegant"
          />
        </div>

        {/* Search results */}
        {query.trim() && (
          <div className="mb-16 space-y-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Results ({filtered.length})
            </h2>
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
                No narrations match "{query}"
              </div>
            )}
            {filtered.slice(0, 50).map((h, i) => (
              <HadeethCard key={h.id} h={h} index={i} />
            ))}
          </div>
        )}

        {/* Collections grid */}
        {!query.trim() && (
          <div className="space-y-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Browse collections
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rootNodes.map((node) => {
                const descendantIds = getDescendantNodeIds(nodes, node.id);
                const hadithCount = descendantIds.reduce(
                  (sum, nid) => sum + getHadithByNode(hadeeth, nid).length,
                  0
                );
                const childCount = getChildren(nodes, node.id).length;
                return (
                  <Link
                    key={node.id}
                    to={`/node/${node.id}`}
                    className="group rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-xl text-foreground group-hover:text-primary">
                      {node.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {hadithCount} narrations · {childCount} sections
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
