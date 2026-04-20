import { ReactNode, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminPageHeader({
  title,
  subtitle,
  onCreate,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  createLabel = "New",
}: {
  title: string;
  subtitle?: string;
  onCreate?: () => void;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  createLabel?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Manage</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        {onCreate && (
          <Button
            onClick={onCreate}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-1.5 h-4 w-4" /> {createLabel}
          </Button>
        )}
      </div>
      {onSearch && (
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-full bg-card pl-11"
          />
        </div>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
      {children}
    </div>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<{ msg: string; onYes: () => void } | null>(null);
  const ask = (msg: string, onYes: () => void) => setPending({ msg, onYes });
  const dialog = pending ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <p className="font-serif text-xl text-foreground">Are you sure?</p>
        <p className="mt-2 text-sm text-muted-foreground">{pending.msg}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              pending.onYes();
              setPending(null);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  ) : null;
  return { ask, dialog };
}
