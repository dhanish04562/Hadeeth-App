import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, EmptyState, useConfirm } from "./AdminUI";
import { Chapter, db, useDB } from "@/data/store";
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
  title: "",
  hadeethCount: 0,
  langCode: "ta",
  isPublished: true,
  notes: "",
};

const ChaptersAdmin = () => {
  const { chapters, books, languages } = useDB();
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

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");
    if (!editing.bookId) return toast.error("Choose a parent book");
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

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Chapters"
        subtitle="Sections inside each book."
        onCreate={() =>
          setEditing({ ...empty, bookId: bookFilter !== "all" ? bookFilter : books[0]?.id || "" })
        }
        createLabel="New chapter"
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
            {books.map((b) => (
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
                <th className="px-5 py-3">Hadeeth</th>
                <th className="px-5 py-3">Lang</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const book = books.find((b) => b.id === c.bookId);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-serif text-base text-foreground">{c.title}</td>
                    <td className="px-5 py-4 text-foreground/80">{book?.title ?? "—"}</td>
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
                  value={editing.bookId}
                  onValueChange={(v) => setEditing({ ...editing, bookId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Choose a book" /></SelectTrigger>
                  <SelectContent>
                    {books.map((b) => (
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
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hadeeth count">
                  <Input
                    type="number"
                    value={editing.hadeethCount}
                    onChange={(e) =>
                      setEditing({ ...editing, hadeethCount: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Language">
                  <Select
                    value={editing.langCode}
                    onValueChange={(v) => setEditing({ ...editing, langCode: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name} ({l.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
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
