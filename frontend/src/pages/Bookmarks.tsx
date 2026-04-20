import { AppLayout } from "@/components/AppLayout";
import { Bookmark } from "lucide-react";

const Bookmarks = () => (
  <AppLayout>
    <section className="container max-w-2xl px-6 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10">
        <Bookmark className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-serif text-5xl text-foreground">Your bookmarks</h1>
      <p className="mt-4 text-muted-foreground">
        Save hadeeth as you read and they’ll appear here. (Coming soon — connect Lovable Cloud to enable accounts and persistent bookmarks.)
      </p>
    </section>
  </AppLayout>
);

export default Bookmarks;
