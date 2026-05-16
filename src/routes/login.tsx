import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vinda de volta!");
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erro no login com Google");
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background">
        <Link to="/" className="font-serif italic text-2xl">BoutiqueOS</Link>
        <div>
          <p className="font-serif text-3xl italic leading-snug">"Em poucos minutos meu link na bio ficou exatamente como eu imaginava."</p>
          <p className="font-mono text-[10px] uppercase tracking-widest mt-6 opacity-60">— Camila, Studio Bella</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">(01) Acesso</span>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleEmail} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entrar</span>
            <h1 className="font-serif text-3xl">Bem-vinda de volta</h1>
          </div>
          <div className="space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="seu@email.com" className="w-full px-4 py-3 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Senha" className="w-full px-4 py-3 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button disabled={loading} className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">{loading ? "Entrando..." : "Entrar"}</button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> ou <div className="flex-1 h-px bg-border" />
          </div>
          <button type="button" onClick={handleGoogle} className="w-full py-3.5 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors">Continuar com Google</button>
          <p className="text-xs text-center text-muted-foreground">
            Ainda não tem conta? <Link to="/signup" className="text-foreground underline">Criar agora</Link>
          </p>
        </form>
      </div>
    </div>
  );
}