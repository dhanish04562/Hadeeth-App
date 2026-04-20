import { AppLayout } from "@/components/AppLayout";
import { HadeethCard } from "@/components/HadeethCard";
import { useDB } from "@/data/store";

const Daily = () => {
  const { hadeeth, isLoading } = useDB();
  const list = hadeeth.filter((h) => h.isPublished);
  const today = list[Math.floor(Date.now() / 86400000) % Math.max(list.length, 1)] || hadeeth[0];
  return (
    <AppLayout>
      <section className="container max-w-3xl px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Today</p>
        <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
          Hadeeth of the day
        </h1>
        <p className="mt-4 text-muted-foreground">
          One narration. Read slowly. Reflect deeply.
        </p>
        <div className="mt-10">
          {today ? (
            <HadeethCard h={today} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
              {isLoading ? "Loading today's hadeeth..." : "No hadeeth available yet."}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
};

export default Daily;
