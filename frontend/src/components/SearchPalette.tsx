import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDB } from "@/data/store";
import { Button } from "@/components/ui/button";

export function SearchPalette() {
  const { books, hadeeth } = useDB();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="group h-10 w-full max-w-md justify-between gap-3 rounded-full border-border bg-card pl-4 pr-2 text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search hadeeth, narrators, books…</span>
        </span>
        <kbd className="hidden items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search the library…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Books">
            {books.map((b) => (
              <CommandItem
                key={b.id}
                onSelect={() => {
                  navigate(`/book/${b.id}`);
                  setOpen(false);
                }}
              >
                {b.title}
                <span className="ml-auto text-xs text-muted-foreground">{b.author}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Hadeeth">
            {hadeeth.slice(0, 8).map((h) => (
              <CommandItem
                key={h.id}
                onSelect={() => {
                  navigate(`/hadeeth/${h.id}`);
                  setOpen(false);
                }}
              >
                <span className="line-clamp-1">{h.english}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
