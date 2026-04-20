import { Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Bookmark, Sparkles, Library } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDB } from "@/data/store";

const nav = [
  { title: "Home", url: "/", icon: Home },
  { title: "Collections", url: "/collections", icon: Library },
  { title: "Daily Hadeeth", url: "/daily", icon: Sparkles },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
];

export function AppSidebar() {
  const { books } = useDB();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
            <span className="font-serif text-xl text-primary">ن</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-xl text-sidebar-foreground">Nuur</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Hadeeth Library
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {books.map((b) => (
                <SidebarMenuItem key={b.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/book/${b.id}`}
                    tooltip={b.title}
                  >
                    <Link to={`/book/${b.id}`}>
                      <BookOpen className="h-4 w-4" />
                      <span className="truncate">{b.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <>
            <p className="px-3 py-2 text-[11px] leading-relaxed text-sidebar-foreground/50">
              “The ink of the scholar is more sacred than the blood of the martyr.”
            </p>
            <Link
              to="/admin"
              className="mx-2 mb-1 rounded-md px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              Admin →
            </Link>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
