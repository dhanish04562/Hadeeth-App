import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, EmptyState, useConfirm } from "./AdminUI";
import { db, useDB, getChildren } from "@/data/store";
type Chapter = { id: string; bookId: string; kitabId: string; title: string; notes: string; isPublished: boolean; langCode: string; hadeethCount: number; };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const empty: Chapter = {
  id: "",
  bookId: "",
  kitabId: "",
  title: "",
  hadeethCount: 0,
  langCode: "ta",
  isPublished: true,
  notes: "",
};

const ChaptersAdmin = () => {
  const { chapters, books, kitabs, languages } = useDB();
  const [q, setQ] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return chapters.filter(
      (c) =>
        (bookFilter === "all" || c.bookId === bookFilter) &&
        (!n || c.title.toLowerCase().includes(n))
    );
  }, [chapters, q, bookFilter]);

  const kitabsForBook = useMemo(() => {
    if (!editing?.bookId) return [];
    return kitabs.filter((k) => k.bookId === editing.bookId);
  }, [kitabs, editing?.bookId]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");
    if (!editing.bookId) return toast.error("Choose a parent book");
    if (!editing.kitabId) return toast.error("Choose a kitab");
    try {
      setSaving(true);
      await db.upsertChapter(editing);
      toast.success("Chapter saved");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save chapter");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async (file: File) => {
    try {
      let data: unknown[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const lines = text.split("\n").filter((line) => line.trim());
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          return headers.reduce((obj, header, i) => {
            obj[header] = values[i] || "";
            return obj;
          }, {} as Record<string, string>);
        });
      } else {
        return toast.error("Please upload a JSON or CSV file");
      }

      if (!Array.isArray(data) || data.length === 0) {
        return toast.error("File must contain an array of chapters");
      }

      let imported = 0;
      for (const item of data) {
        const raw = item as Record<string, unknown>;
        const chapter: Chapter = {
          id: String(raw.id ?? ""),
          bookId: String(raw.book_id ?? raw.bookId ?? ""),
          kitabId: String(raw.kitab_id ?? raw.kitabId ?? ""),
          title: String(raw.title ?? ""),
          hadeethCount: Number(raw.hadeeth_count ?? raw.hadeethCount ?? 0),
          langCode: String(raw.lang_code ?? raw.langCode ?? "ta"),
          isPublished: Boolean(raw.is_published ?? raw.isPublished ?? true),
          notes: String(raw.notes ?? ""),
        };

        if (chapter.title.trim() && chapter.bookId && chapter.kitabId) {
          try {
            await db.upsertChapter(chapter);
            imported++;
          } catch (error) {
            console.error(`Failed to import chapter "${chapter.title}":`, error);
          }
        }
      }

      toast.success(`Imported ${imported} chapter(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import chapters");
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Chapters"
        subtitle="Babs inside each kitab (e.g. باب بيان الإيمان)."
        onCreate={() =>
          setEditing({
            ...empty,
            bookId: bookFilter !== "all" ? bookFilter : books[0]?.id || "",
            kitabId: kitabs.find((k) => k.bookId === (bookFilter !== "all" ? bookFilter : books[0]?.id))?.id || "",
          })
        }
        createLabel="New chapter"
        onUpload={handleBulkImport}
        uploadLabel="Import chapters"
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search chapters…"
      />

      <div className="mb-6 max-w-xs">
        <Select value={bookFilter} onValueChange={setBookFilter}>
          <SelectTrigger className="h-11 rounded-full bg-card">
            <SelectValue placeholder="Filter by book" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All books</SelectItem>
            {books
              .filter((b) => b.id)
              .map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No chapters yet.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Kitab</th>
                <th className="px-5 py-3">Hadeeth</th>
                <th className="px-5 py-3">Lang</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const book = books.find((b) => b.id === c.bookId);
                const kitab = kitabs.find((k) => k.id === c.kitabId);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-serif text-base text-foreground">{c.title}</td>
                    <td className="px-5 py-4 text-foreground/80">{book?.title ?? "—"}</td>
                    <td className="px-5 py-4 text-muted-foreground">{kitab?.title ?? "—"}</td>
                    <td className="px-5 py-4 text-muted-foreground">{c.hadeethCount}</td>
                    <td className="px-5 py-4 uppercase text-muted-foreground">{c.langCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ ...c })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            ask(`Delete "${c.title}" and its hadeeth?`, () => {
                              void db
                                .deleteChapter(c.id)
                                .then(() => toast.success("Chapter deleted"))
                                .catch((error: Error) => toast.error(error.message));
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">
              {editing?.id ? "Edit chapter" : "New chapter"}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <div className="mt-6 space-y-5">
              <Field label="Book">
                <Select
                  value={editing.bookId || undefined}
                  onValueChange={(v) => {
                    const firstKitab = kitabs.find((k) => k.bookId === v);
                    setEditing({ ...editing, bookId: v, kitabId: firstKitab?.id || "" });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Choose a book" /></SelectTrigger>
                  <SelectContent>
                    {books
                      .filter((b) => b.id)
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Kitab">
                <Select
                  value={editing.kitabId || undefined}
                  onValueChange={(v) => setEditing({ ...editing, kitabId: v })}
                  disabled={!editing.bookId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a kitab" />
                  </SelectTrigger>
                  <SelectContent>
                    {kitabsForBook
                      .filter((k) => k.id)
                      .map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Title">
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </Field>

              <Field label="Language">
                <Select
                  value={editing.langCode || undefined}
                  onValueChange={(v) => setEditing({ ...editing, langCode: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((l) => l.code)
                      .map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name} ({l.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Notes">
                <Textarea
                  rows={3}
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </Field>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">Visible on the public site.</p>
                </div>
                <Switch
                  checked={editing.isPublished}
                  onCheckedChange={(v) => setEditing({ ...editing, isPublished: v })}
                />
              </div>
            </div>
          )}

          <SheetFooter className="mt-8 gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => void save()}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {dialog}
    </AdminLayout>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default ChaptersAdmin;
