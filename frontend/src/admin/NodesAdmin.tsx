import { useState, useMemo } from "react";
import { useDB, db, Node, getChildren } from "@/data/store";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderPlus, Pencil, Trash2, ChevronRight } from "lucide-react";

type Editing = {
  id?: string;
  parent_id: string | null;
  type: string;
  title: string;
  is_published: boolean;
};

const empty: Editing = {
  parent_id: null,
  type: "node",
  title: "",
  is_published: true,
};

export default function NodesAdmin() {
  const { nodes } = useDB();
  const [parentFilter, setParentFilter] = useState<string>("root");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (parentFilter === "root") return nodes.filter((n) => !n.parent_id);
    if (parentFilter === "all") return nodes;
    return nodes.filter((n) => n.parent_id === parentFilter);
  }, [nodes, parentFilter]);

  const parentOptions = useMemo(() => {
    return nodes.filter((n) => n.parent_id === null);
  }, [nodes]);

  async function handleSave() {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title is required");

    try {
      await db.upsertNode({
        id: editing.id,
        parent_id: editing.parent_id,
        type: editing.type,
        title: editing.title,
        is_published: editing.is_published,
      });
      toast.success(editing.id ? "Node updated" : "Node created");
      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save node");
    }
  }

  async function handleDelete(id: string) {
    try {
      await db.deleteNode(id);
      toast.success("Node deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete node");
    }
  }

  function handleEdit(node: Node) {
    setEditing({
      id: node.id,
      parent_id: node.parent_id,
      type: node.type,
      title: node.title,
      is_published: node.is_published,
    });
    setOpen(true);
  }

  function handleCreate(parentId: string | null) {
    setEditing({ ...empty, parent_id: parentId });
    setOpen(true);
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">Nodes</h1>
        <Button onClick={() => handleCreate(null)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New root node
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={parentFilter} onValueChange={setParentFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All nodes</SelectItem>
            <SelectItem value="root">Root nodes only</SelectItem>
            {parentOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                Children of "{p.title}"
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Children</th>
              <th className="px-5 py-3">Published</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((node) => {
              const parent = nodes.find((n) => n.id === node.parent_id);
              const childCount = getChildren(nodes, node.id).length;
              return (
                <tr key={node.id} className="border-b border-border/40 transition-colors hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium text-foreground">{node.title}</td>
                  <td className="px-5 py-3 text-xs uppercase text-muted-foreground">{node.type}</td>
                  <td className="px-5 py-3 text-muted-foreground">{parent?.title || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{childCount}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${node.is_published ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {node.is_published ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(node)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(node.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreate(node.id)}
                      >
                        <FolderPlus className="mr-1 h-3.5 w-3.5" />
                        Child
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit/Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Node" : "Create Node"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Node title"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={editing.type}
                  onValueChange={(v) => setEditing({ ...editing, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="kitab">Kitab</SelectItem>
                    <SelectItem value="chapter">Chapter</SelectItem>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="node">Node</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent</Label>
                <Select
                  value={editing.parent_id || "null"}
                  onValueChange={(v) =>
                    setEditing({ ...editing, parent_id: v === "null" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">None (root)</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.is_published}
                    onChange={(e) =>
                      setEditing({ ...editing, is_published: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Published</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
