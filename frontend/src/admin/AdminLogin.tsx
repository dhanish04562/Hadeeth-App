import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, DEFAULT_ADMIN, isAuthed } from "./auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEFAULT_ADMIN.email);
  const [password, setPassword] = useState("");

  if (isAuthed()) {
    navigate("/admin", { replace: true });
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success("Welcome back, admin");
      navigate("/admin", { replace: true });
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-card p-8 shadow-elegant md:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-foreground">Admin Console</h1>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Restricted area
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Lock className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-xs leading-relaxed text-foreground/80">
          <p className="mb-1 font-semibold uppercase tracking-wider text-accent">
            Demo credentials
          </p>
          <p>Email: <code className="font-mono">{DEFAULT_ADMIN.email}</code></p>
          <p>Password: <code className="font-mono">{DEFAULT_ADMIN.password}</code></p>
          <p className="mt-2 text-muted-foreground">
            Mock-only auth. Enable Lovable Cloud for real accounts + roles.
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary"
        >
          ← Back to public site
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
