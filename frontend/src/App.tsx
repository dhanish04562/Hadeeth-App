import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import BookPage from "./pages/BookPage.tsx";
import HadeethPage from "./pages/HadeethPage.tsx";
import Collections from "./pages/Collections.tsx";
import Daily from "./pages/Daily.tsx";
import Bookmarks from "./pages/Bookmarks.tsx";
import AdminLogin from "./admin/AdminLogin.tsx";
import Dashboard from "./admin/Dashboard.tsx";
import BooksAdmin from "./admin/BooksAdmin.tsx";
import ChaptersAdmin from "./admin/ChaptersAdmin.tsx";
import HadeethAdmin from "./admin/HadeethAdmin.tsx";
import LanguagesAdmin from "./admin/LanguagesAdmin.tsx";
import { DBProvider } from "./data/store";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DBProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/book/:id" element={<BookPage />} />
            <Route path="/hadeeth/:id" element={<HadeethPage />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/books" element={<BooksAdmin />} />
            <Route path="/admin/chapters" element={<ChaptersAdmin />} />
            <Route path="/admin/hadeeth" element={<HadeethAdmin />} />
            <Route path="/admin/languages" element={<LanguagesAdmin />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DBProvider>
  </QueryClientProvider>
);

export default App;
