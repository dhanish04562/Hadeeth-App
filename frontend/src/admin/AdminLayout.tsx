import { ReactNode } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { isAuthed, logout, getAdminEmail } from "./auth";
import {
  BookOpenText,
  ListTree,
  ScrollText,
  Languages as LangIcon,
  LogOut,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NuurLogo } from "@/components/NuurLogo";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/books", label: "Books", icon: BookOpenText },
  { to: "/admin/chapters", label: "Chapters", icon: ListTree },
  { to: "/admin/hadeeth", label: "Hadeeth", icon: ScrollText },
  { to: "/admin/languages", label: "Languages", icon: LangIcon },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!isAuthed()) return <Navigate to="/admin/login" replace />;

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen w-full bg-gradient-paper">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <NuurLogo subtitle="Admin Console" className="text-sidebar-foreground" />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item.to, item.end)
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-[11px] text-sidebar-foreground/50">
            {getAdminEmail()}
          </p>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl md:hidden">
          <Link to="/admin" className="font-serif text-lg">
            Nuur Admin
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${
                isActive(item.to, item.end)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
