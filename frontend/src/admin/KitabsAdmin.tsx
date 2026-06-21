import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, EmptyState, useConfirm } from "./AdminUI";
import { db, useDB, getChildren } from "@/data/store";
type Kitab = { id: string; bookId: string; title: string; notes: string; isPublished: boolean; langCode: string; hadeethCount: number; };
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

const empty: Kitab = {
  id: "",
  bookId: "",
  title: "",
  hadeethCount: 0,
  langCode: "ta",
  isPublished: true,
  notes: "",
};

const KitabsAdmin = () => {
  const { kitabs, books, languages } = useDB();
  const [q, setQ] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Kitab | null>(null);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return kitabs.filter(
      (k) =>
        (bookFilter === "all" || k.bookId === bookFilter) &&
        (!n || k.title.toLowerCase().includes(n))
    );
  }, [kitabs, q, bookFilter]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");
    if (!editing.bookId) return toast.error("Choose a parent book");
    try {
      setSaving(true);
      await db.upsertKitab(editing);
      toast.success("Kitab saved");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save kitab");
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
        return toast.error("File must contain an array of kitabs");
      }

      let imported = 0;
      for (const item of data) {
        const raw = item as Record<string, unknown>;
        const kitab: Kitab = {
          id: String(raw.id ?? ""),
          bookId: String(raw.book_id ?? raw.bookId ?? ""),
          title: String(raw.title ?? ""),
          hadeethCount: Number(raw.hadeeth_count ?? raw.hadeethCount ?? 0),
          langCode: String(raw.lang_code ?? raw.langCode ?? "ta"),
          isPublished: Boolean(raw.is_published ?? raw.isPublished ?? true),
          notes: String(raw.notes ?? ""),
        };

        if (kitab.title.trim() && kitab.bookId) {
          try {
            await db.upsertKitab(kitab);
            imported++;
          } catch (error) {
            console.error(`Failed to import kitab "${kitab.title}":`, error);
          }
        }
      }

      toast.success(`Imported ${imported} kitab(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import kitabs");
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Kitabs"
        subtitle="Major sections inside each book (e.g. كتاب الإيمان)."
        onCreate={() =>
          setEditing({ ...empty, bookId: bookFilter !== "all" ? bookFilter : books[0]?.id || "" })
        }
        createLabel="New kitab"
        onUpload={handleBulkImport}
        uploadLabel="Import kitabs"
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search kitabs…"
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
        <EmptyState>No kitabs yet.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Hadeeth</th>
                <th className="px-5 py-3">Lang</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((k) => {
                const book = books.find((b) => b.id === k.bookId);
                return (
                  <tr key={k.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-serif text-base text-foreground">{k.title}</td>
                    <td className="px-5 py-4 text-foreground/80">{book?.title ?? "—"}</td>
                    <td className="px-5 py-4 text-muted-foreground">{k.hadeethCount}</td>
                    <td className="px-5 py-4 uppercase text-muted-foreground">{k.langCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing({ ...k })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            ask(`Delete "${k.title}" and all its chapters & hadeeth?`, () => {
                              void db
                                .deleteKitab(k.id)
                                .then(() => toast.success("Kitab deleted"))
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
              {editing?.id ? "Edit kitab" : "New kitab"}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <div className="mt-6 space-y-5">
              <Field label="Book">
                <Select
                  value={editing.bookId || undefined}
                  onValueChange={(v) => setEditing({ ...editing, bookId: v })}
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

export default KitabsAdmin;
