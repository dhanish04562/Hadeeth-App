import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader } from "./AdminUI";
import { ImportLog } from "./ImportLog";
import { toast } from "sonner";
import { useDB, db as api } from "@/data/store";
import type { ImportCollectionResponse } from "@/data/import";
import { normalizeImportStats } from "@/data/import";
import { appendImportLog, summarizeImportStats } from "./import-log";
import { BookOpenText, ListTree, Library, ScrollText, Languages, GitFork } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const db = useDB();
  const [importLogKey, setImportLogKey] = useState(0);

  const rootNodes = db.nodes.filter((n) => !n.parent_id);

  const stats = [
    { label: "Root Nodes", value: rootNodes.length, icon: GitFork, to: "/admin/nodes" },
    { label: "Total Nodes", value: db.nodes.length, icon: ListTree, to: "/admin/nodes" },
    { label: "Hadith", value: db.hadeeth.length, icon: ScrollText, to: "/admin/hadeeth" },
    { label: "Languages", value: db.languages.length, icon: Languages, to: "/admin/languages" },
  ];

  const recent = [...db.hadeeth].slice(0, 5);

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const API = import.meta.env.VITE_API_URL || window.location.origin;

      const res = await fetch(
        `${API}/api/admin/import-json?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = (await res.json().catch(() => ({}))) as ImportCollectionResponse & {
        message?: string;
      };

      if (!res.ok) {
        appendImportLog({
          filename: file.name,
          book_title: typeof payload.book_title === "string" ? payload.book_title : undefined,
          status: "error",
          message: body.message || res.statusText || "Upload failed",
        });
        setImportLogKey((k) => k + 1);
        throw new Error(body.message || res.statusText || "Upload failed");
      }

      if (body.stats) {
        const logStats = normalizeImportStats(body.stats);
        appendImportLog({
          filename: file.name,
          book_title: typeof payload.book_title === "string" ? payload.book_title : undefined,
          status: logStats.errors > 0 ? "partial" : "success",
          message: summarizeImportStats(body),
          ...logStats,
        });
      } else {
        appendImportLog({
          filename: file.name,
          book_title: typeof payload.book_title === "string" ? payload.book_title : undefined,
          status: "success",
          message: body.message || "Imported",
        });
      }

      setImportLogKey((k) => k + 1);
      await api.refresh();
      toast.success("Data imported successfully");
    } catch (err: any) {
      appendImportLog({
        filename: file.name,
        status: "error",
        message: err.message || "Import failed",
      });
      setImportLogKey((k) => k + 1);
      toast.error(err.message || "Import failed");
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Dashboard"
        withUpload={{
          handleUpload,
          label: "Upload JSON",
        }}
      />

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="group rounded-xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="font-serif text-2xl text-foreground group-hover:text-primary">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent hadith */}
      <div className="mb-10 rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="font-serif text-lg text-foreground">Recent Hadith</h2>
        </div>
        <div className="divide-y divide-border/40">
          {recent.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No hadith yet.</p>
          )}
          {recent.map((h) => (
            <Link
              key={h.id}
              to={`/hadeeth/${h.id}`}
              className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-accent/5"
            >
              <span className="line-clamp-1 text-sm text-foreground">
                {h.tamil || h.english || h.arabic}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{h.referenceNumber}</span>
            </Link>
          ))}
        </div>
      </div>

      <ImportLog key={importLogKey} />
    </AdminLayout>
  );
};

export default Dashboard;
