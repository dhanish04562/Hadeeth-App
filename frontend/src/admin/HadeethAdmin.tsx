import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, EmptyState, useConfirm } from "./AdminUI";
import { Hadeeth, db, useDB } from "@/data/store";
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

const empty: Hadeeth = {
  id: "",
  bookId: "",
  chapterId: "",
  referenceNumber: 0,
  reportedBy: "",
  arabic: "",
  english: "",
  grade: "Sahih",
  notes: "",
  langCode: "ta",
  isPublished: true,
};

const HadeethAdmin = () => {
  const { hadeeth, books, chapters, languages } = useDB();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Hadeeth | null>(null);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  // open editor via ?edit=<id>
  useEffect(() => {
    const id = params.get("edit");
    if (id) {
      const h = hadeeth.find((x) => x.id === id);
      if (h) setEditing({ ...h });
      params.delete("edit");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return hadeeth.filter(
      (h) =>
        (bookFilter === "all" || h.bookId === bookFilter) &&
        (!n ||
          h.english.toLowerCase().includes(n) ||
          h.arabic.includes(q) ||
          h.reportedBy.toLowerCase().includes(n))
    );
  }, [hadeeth, q, bookFilter]);

  const chaptersForBook = useMemo(
    () => chapters.filter((c) => c.bookId === editing?.bookId),
    [chapters, editing?.bookId]
  );

  const save = async () => {
    if (!editing) return;
    if (!editing.bookId) return toast.error("Choose a book");
    if (!editing.chapterId) return toast.error("Choose a chapter");
    if (!editing.english.trim() && !editing.arabic.trim())
      return toast.error("Add Arabic or English text");
    try {
      setSaving(true);
      await db.upsertHadeeth(editing);
      toast.success("Hadeeth saved");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save hadeeth");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Hadeeth"
        subtitle="Individual narrations within each chapter."
        onCreate={() => setEditing({ ...empty, bookId: books[0]?.id || "" })}
        createLabel="New hadeeth"
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search text or narrator…"
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
        <EmptyState>No hadeeth match.</EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => {
            const book = books.find((b) => b.id === h.bookId);
            const ch = chapters.find((c) => c.id === h.chapterId);
            return (
              <article
                key={h.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">#{h.referenceNumber}</span>
                      <span>·</span>
                      <span>{book?.title ?? "—"}</span>
                      <span>·</span>
                      <span>{ch?.title ?? "—"}</span>
                      {h.grade && (
                        <span className="ml-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                          {h.grade}
                        </span>
                      )}
                      {!h.isPublished && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Draft</span>
                      )}
                    </div>
                    <p
                      dir="rtl"
                      className="font-arabic mt-3 line-clamp-2 text-lg leading-relaxed text-foreground"
                    >
                      {h.arabic}
                    </p>
                    <p className="mt-2 line-clamp-2 font-serif text-base text-foreground/85">
                      {h.english}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reported by {h.reportedBy}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing({ ...h })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        ask(`Delete hadeeth #${h.referenceNumber}?`, () => {
                          void db
                            .deleteHadeeth(h.id)
                            .then(() => toast.success("Hadeeth deleted"))
                            .catch((error: Error) => toast.error(error.message));
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">
              {editing?.id ? "Edit hadeeth" : "New hadeeth"}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Book">
                  <Select
                    value={editing.bookId}
                    onValueChange={(v) =>
                      setEditing({ ...editing, bookId: v, chapterId: "" })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Choose a book" /></SelectTrigger>
                    <SelectContent>
                      {books.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Chapter">
                  <Select
                    value={editing.chapterId}
                    onValueChange={(v) => setEditing({ ...editing, chapterId: v })}
                    disabled={!editing.bookId}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose a chapter" /></SelectTrigger>
                    <SelectContent>
                      {chaptersForBook.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Reference #">
                  <Input
                    type="number"
                    value={editing.referenceNumber}
                    onChange={(e) =>
                      setEditing({ ...editing, referenceNumber: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Reported by">
                  <Input
                    value={editing.reportedBy}
                    onChange={(e) => setEditing({ ...editing, reportedBy: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Arabic">
                <Textarea
                  dir="rtl"
                  rows={4}
                  className="font-arabic text-lg leading-loose"
                  value={editing.arabic}
                  onChange={(e) => setEditing({ ...editing, arabic: e.target.value })}
                />
              </Field>
              <Field label="English">
                <Textarea
                  rows={5}
                  value={editing.english}
                  onChange={(e) => setEditing({ ...editing, english: e.target.value })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Grade">
                  <Select
                    value={editing.grade || ""}
                    onValueChange={(v) => setEditing({ ...editing, grade: v as Hadeeth["grade"] })}
                  >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sahih">Sahih</SelectItem>
                      <SelectItem value="Hasan">Hasan</SelectItem>
                      <SelectItem value="Da'if">Da'if</SelectItem>
                    </SelectContent>
                  </Select>
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

export default HadeethAdmin;
