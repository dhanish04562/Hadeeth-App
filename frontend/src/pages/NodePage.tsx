import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB, getChildren, getHadithByNode, getAncestors } from "@/data/store";
import { HadeethCard } from "@/components/HadeethCard";
import { ChevronRight, FolderOpen, FileText, BookOpen, Loader2 } from "lucide-react";

const NodePage = () => {
  const { id = "" } = useParams();
  const { nodes, hadeeth, isLoading } = useDB();
  const [listStyle, setListStyle] = useState<"tree" | "flat">("tree");

  const node = nodes.find((n) => n.id === id);
  const children = getChildren(nodes, id);
  const ancestors = getAncestors(nodes, id);
  const hadiths = getHadithByNode(hadeeth, id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!node) {
    return (
      <AppLayout>
        <section className="container max-w-3xl px-6 py-20 text-center">
          <h1 className="font-serif text-3xl text-muted-foreground">Page not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back to home</Link>
        </section>
      </AppLayout>
    );
  }

  const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1);

  return (
    <AppLayout>
      <section className="container max-w-3xl px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/node/${a.id}`} className="transition-colors hover:text-foreground">
                {a.title}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{node.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-accent">{typeLabel}</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">{node.title}</h1>
        </header>

        {/* Children (sub-sections) */}
        {children.length > 0 && (
          <div className="mb-12 space-y-3">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Sections ({children.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {children.map((child) => {
                const childHadithCount = getHadithByNode(hadeeth, child.id).length;
                const grandchildCount = getChildren(nodes, child.id).length;
                return (
                  <Link
                    key={child.id}
                    to={`/node/${child.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10">
                      {grandchildCount > 0 ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground group-hover:text-primary">
                        {child.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {childHadithCount > 0 && `${childHadithCount} hadiths`}
                        {childHadithCount > 0 && grandchildCount > 0 && " · "}
                        {grandchildCount > 0 && `${grandchildCount} sub-sections`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* View toggle */}
        {hadiths.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Hadiths ({hadiths.length})
            </h2>
          </div>
        )}

        {/* Hadiths */}
        <div className="space-y-6">
          {hadiths.length === 0 && children.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>No content here yet.</p>
            </div>
          )}
          {hadiths.map((h, i) => (
            <HadeethCard key={h.id} h={h} index={i} />
          ))}
        </div>
      </section>
    </AppLayout>
  );
};

export default NodePage;
