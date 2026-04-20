import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, EmptyState, useConfirm } from "./AdminUI";
import { Book, db, useDB } from "@/data/store";
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
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const empty: Book = {
  id: "",
  title: "",
  author: "",
  notes: "",
  hadeethCount: 0,
  era: "",
  langCode: "ta",
  isPublished: true,
};

const BooksAdmin = () => {
  const { books, languages } = useDB();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return books.filter(
      (b) =>
        !n ||
        b.title.toLowerCase().includes(n) ||
        b.author.toLowerCase().includes(n)
    );
  }, [books, q]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");
    try {
      setSaving(true);
      await db.upsertBook(editing);
      toast.success("Book saved");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Books"
        subtitle="The top-level collections in the library."
        onCreate={() => setEditing({ ...empty })}
        createLabel="New book"
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search books or authors…"
      />

      {filtered.length === 0 ? (
        <EmptyState>No books match your search.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Lang</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <p className="font-serif text-base text-foreground">{b.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{b.notes}</p>
                  </td>
                  <td className="px-5 py-4 text-foreground/80">{b.author}</td>
                  <td className="px-5 py-4 uppercase text-muted-foreground">{b.langCode}</td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={b.isPublished ? "default" : "secondary"}
                      className={b.isPublished ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
                    >
                      {b.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing({ ...b })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          ask(`Delete "${b.title}" and all its chapters & hadeeth?`, () => {
                            void db
                              .deleteBook(b.id)
                              .then(() => toast.success("Book deleted"))
                              .catch((error: Error) => toast.error(error.message));
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">
              {editing?.id ? "Edit book" : "New book"}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <div className="mt-6 space-y-5">
              <Field label="Title">
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </Field>
              <Field label="Author">
                <Input
                  value={editing.author}
                  onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Era">
                  <Input
                    value={editing.era}
                    onChange={(e) => setEditing({ ...editing, era: e.target.value })}
                  />
                </Field>
                <Field label="Hadeeth count">
                  <Input
                    type="number"
                    value={editing.hadeethCount}
                    onChange={(e) =>
                      setEditing({ ...editing, hadeethCount: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
              </div>
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
              <Field label="Notes">
                <Textarea
                  rows={4}
                  value={editing.notes}
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
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default BooksAdmin;
