import { useState, useMemo } from "react";
import { useDB, db, Hadeeth, getChildren } from "@/data/store";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

type Editing = {
  id?: string;
  node_id: string;
  referenceNumber: number;
  arabic: string;
  tamil: string;
  english: string;
  reportedBy: string;
  grade: string;
  isPublished: boolean;
};

const empty: Editing = {
  node_id: "",
  referenceNumber: 0,
  arabic: "",
  tamil: "",
  english: "",
  reportedBy: "",
  grade: "",
  isPublished: true,
};

export default function HadeethAdmin() {
  const { nodes, hadeeth } = useDB();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [open, setOpen] = useState(false);

  const leafNodes = useMemo(() => {
    return nodes.filter((n) => getChildren(nodes, n.id).length === 0);
  }, [nodes]);

  async function handleSave() {
    if (!editing) return;
    if (!editing.node_id) return toast.error("Choose a parent node");
    if (!editing.arabic.trim() && !editing.english.trim()) return toast.error("Arabic or English text required");

    try {
      await db.upsertHadeeth(editing);
      toast.success(editing.id ? "Hadith updated" : "Hadith created");
      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save hadith");
    }
  }

  async function handleDelete(id: string) {
    try {
      await db.deleteHadeeth(id);
      toast.success("Hadith deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete hadith");
    }
  }

  function handleEdit(h: Hadeeth) {
    setEditing({
      id: h.id,
      node_id: h.node_id,
      referenceNumber: h.referenceNumber,
      arabic: h.arabic,
      tamil: h.tamil,
      english: h.english,
      reportedBy: h.reportedBy,
      grade: h.grade || "",
      isPublished: h.isPublished,
    });
    setOpen(true);
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">Hadith</h1>
        <Button onClick={() => { setEditing({ ...empty }); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Hadith
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Node</th>
              <th className="px-5 py-3">Arabic</th>
              <th className="px-5 py-3">Tamil</th>
              <th className="px-5 py-3">English</th>
              <th className="px-5 py-3">Grade</th>
              <th className="px-5 py-3">Published</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hadeeth.map((h) => {
              const node = nodes.find((n) => n.id === h.node_id);
              return (
                <tr key={h.id} className="border-b border-border/40 transition-colors hover:bg-accent/5">
                  <td className="px-5 py-3 text-muted-foreground">{h.referenceNumber}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{node?.title || "—"}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 font-arabic text-foreground">
                    {h.arabic}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-muted-foreground">
                    {h.tamil}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-muted-foreground">
                    {h.english}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{h.grade}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${h.isPublished ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {h.isPublished ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(h.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Hadith" : "New Hadith"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Parent Node</Label>
                <Select
                  value={editing.node_id}
                  onValueChange={(v) => setEditing({ ...editing, node_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a node" />
                  </SelectTrigger>
                  <SelectContent>
                    {leafNodes.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Reference #</Label>
                  <Input
                    type="number"
                    value={editing.referenceNumber}
                    onChange={(e) => setEditing({ ...editing, referenceNumber: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Reported By</Label>
                  <Input
                    value={editing.reportedBy}
                    onChange={(e) => setEditing({ ...editing, reportedBy: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Arabic</Label>
                <Textarea
                  dir="rtl"
                  className="font-arabic text-lg"
                  value={editing.arabic}
                  onChange={(e) => setEditing({ ...editing, arabic: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Tamil</Label>
                <Textarea
                  value={editing.tamil}
                  onChange={(e) => setEditing({ ...editing, tamil: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>English</Label>
                <Textarea
                  value={editing.english}
                  onChange={(e) => setEditing({ ...editing, english: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={editing.grade}
                    onValueChange={(v) => setEditing({ ...editing, grade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Sahih">Sahih</SelectItem>
                      <SelectItem value="Hasan">Hasan</SelectItem>
                      <SelectItem value="Da'if">Da'if</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.isPublished}
                      onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
