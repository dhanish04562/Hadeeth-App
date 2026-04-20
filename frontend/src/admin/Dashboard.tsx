import { AdminLayout } from "./AdminLayout";
import { useDB } from "@/data/store";
import { BookOpenText, ListTree, ScrollText, Languages } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const db = useDB();

  const stats = [
    { label: "Books", value: db.books.length, icon: BookOpenText, to: "/admin/books" },
    { label: "Chapters", value: db.chapters.length, icon: ListTree, to: "/admin/chapters" },
    { label: "Hadeeth", value: db.hadeeth.length, icon: ScrollText, to: "/admin/hadeeth" },
    { label: "Languages", value: db.languages.length, icon: Languages, to: "/admin/languages" },
  ];

  const recent = [...db.hadeeth].slice(0, 5);

  return (
    <AdminLayout>
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Overview</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the entire hadeeth library from a single place.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-5 font-serif text-4xl text-foreground">
              {s.value.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="mb-5 font-serif text-2xl text-foreground">Recent hadeeth</h2>
        <div className="divide-y divide-border">
          {recent.map((h) => (
            <Link
              key={h.id}
              to={`/admin/hadeeth?edit=${h.id}`}
              className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 font-serif text-base text-foreground">
                  {h.english}
                </p>
                <p className="text-xs text-muted-foreground">
                  #{h.referenceNumber} · {h.reportedBy}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{h.bookId}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
