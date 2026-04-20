import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminPageHeader, useConfirm } from "./AdminUI";
import { Language, db, useDB } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const empty: Language = { code: "", name: "" };

const LanguagesAdmin = () => {
  const { languages } = useDB();
  const [editing, setEditing] = useState<Language | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const { ask, dialog } = useConfirm();

  const save = async () => {
    if (!editing) return;
    if (!editing.code.trim() || !editing.name.trim())
      return toast.error("Code and name are required");
    try {
      setSaving(true);
      await db.upsertLanguage({ ...editing, code: editing.code.trim().toLowerCase() });
      toast.success("Language saved");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save language");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Languages"
        subtitle="Available translations for books, chapters and hadeeth."
        onCreate={() => {
          setIsNew(true);
          setEditing({ ...empty });
        }}
        createLabel="New language"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {languages.map((l) => (
              <tr key={l.code} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-4 font-mono text-foreground">{l.code}</td>
                <td className="px-5 py-4 font-serif text-base text-foreground">{l.name}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsNew(false);
                        setEditing({ ...l });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        ask(`Delete language "${l.name}"?`, () => {
                          void db
                            .deleteLanguage(l.code)
                            .then(() => toast.success("Language deleted"))
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

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">
              {isNew ? "New language" : "Edit language"}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Code
                </Label>
                <Input
                  placeholder="en"
                  maxLength={6}
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  disabled={!isNew}
                />
                <p className="text-xs text-muted-foreground">
                  ISO 639-1 short code (max 6 chars).
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Name
                </Label>
                <Input
                  placeholder="English"
                  maxLength={24}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
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

export default LanguagesAdmin;
