import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useDB, getHadithByNode } from "@/data/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bookmark, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

const HadeethPage = () => {
  const { id = "" } = useParams();
  const { hadeeth, nodes, isLoading } = useDB();
  const { lang, getText } = useLanguage();
  const h = hadeeth.find((x) => x.id === id);
  const node = h ? nodes.find((n) => n.id === h.node_id) : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!h) {
    return (
      <AppLayout>
        <section className="container max-w-3xl px-6 py-20 text-center">
          <h1 className="font-serif text-3xl text-muted-foreground">Hadeeth not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back to home</Link>
        </section>
      </AppLayout>
    );
  }

  const hList = getHadithByNode(hadeeth, h.node_id);
  const idx = hList.findIndex((x) => x.id === h.id);
  const prev = idx > 0 ? hList[idx - 1] : null;
  const next = idx < hList.length - 1 ? hList[idx + 1] : null;

  return (
    <AppLayout>
      <section className="container max-w-3xl px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/node/${h.node_id}`} className="transition-colors hover:text-foreground">
            {node?.title || "Unknown"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Hadeeth #{h.referenceNumber}</span>
        </nav>

        {/* Meta */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Hadeeth</p>
            <h1 className="mt-1 font-serif text-3xl text-foreground md:text-4xl">
              #{h.referenceNumber}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reported by {h.reportedBy}
            </p>
          </div>
          {h.grade && (
            <Badge
              variant="secondary"
              className="border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground"
            >
              {h.grade}
            </Badge>
          )}
        </header>

        {/* Arabic */}
        <p
          dir="rtl"
          className="font-arabic text-3xl leading-[2.4] text-foreground md:text-[36px]"
        >
          {h.arabic}
        </p>

        {/* Active-language translation */}
        <div className="my-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>{lang === "ta" ? "தமிழ் மொழிபெயர்ப்பு" : lang === "ar" ? "ترجمة" : "Translation"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="font-serif text-2xl leading-relaxed text-foreground md:text-3xl">
          {getText(h)}
        </p>

        {/* Navigation between hadiths */}
        <footer className="mt-16 flex items-center justify-between border-t border-border/60 pt-6">
          <div>
            {prev && (
              <Link
                to={`/hadeeth/${prev.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                #{prev.referenceNumber}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            {next && (
              <Link
                to={`/hadeeth/${next.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                #{next.referenceNumber}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </footer>
      </section>
    </AppLayout>
  );
};

export default HadeethPage;
