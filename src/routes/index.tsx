import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Calendar, Palette, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="font-serif italic text-xl font-bold tracking-tight">BoutiqueOS</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">(beauty platform)</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
          <Link to="/signup" className="text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-full hover:bg-accent transition-colors">Começar grátis</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        <section className="grid grid-cols-12 gap-12 mt-12 lg:mt-24">
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              <span className="size-2 rounded-full bg-accent animate-pulse" />
              (01) Para profissionais de cílios, unhas & salões
            </div>
            <h1 className="font-serif text-5xl lg:text-7xl leading-[1.05] tracking-tight">
              Seu <em className="italic text-accent">link na bio</em>,
              <br />
              sua agenda,
              <br />
              seu estúdio.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Crie uma página de perfil sofisticada com botões que levam direto para o WhatsApp, catálogo de serviços e agendamento online — com uma agenda separada para cada colaboradora.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/signup" className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium hover:bg-accent transition-all">
                Criar meu estúdio
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/u/$slug" params={{ slug: "demo" }} className="inline-flex items-center gap-3 border border-border px-7 py-4 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
                Ver demonstração
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="bg-card ring-1 ring-border rounded-[40px] p-8 shadow-2xl shadow-black/5 max-w-[380px] mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="size-20 rounded-full bg-secondary grid place-items-center mb-5 ring-1 ring-border">
                  <Sparkles className="size-7 text-accent" />
                </div>
                <h2 className="font-serif text-2xl mb-1">Studio Bella</h2>
                <p className="text-xs text-muted-foreground max-w-[220px]">Cílios & Unhas · Jardins</p>
              </div>
              <div className="space-y-3">
                {["Agendar Online", "WhatsApp — Alongamento", "WhatsApp — Manicure", "Ver Catálogo"].map((label, i) => (
                  <button key={label} className="w-full py-3.5 px-5 rounded-full border border-border text-sm font-medium flex items-center justify-between hover:bg-foreground hover:text-background transition-colors">
                    <span className={i > 0 && i < 3 ? "italic font-serif" : ""}>{label}</span>
                    <span className="font-mono text-[10px] opacity-50">(0{i + 1})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-32 lg:mt-48 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Palette, title: "Personalize tudo", desc: "Cores, fontes e botões do seu jeito. Sua identidade visual em cada detalhe." },
            { icon: Calendar, title: "Agenda online", desc: "Clientes agendam direto. Você bloqueia horários quando precisar." },
            { icon: Users, title: "Várias colaboradoras", desc: "Uma agenda independente para cada profissional do salão." },
          ].map((f) => (
            <div key={f.title} className="bg-card p-8 rounded-3xl ring-1 ring-border space-y-4">
              <f.icon className="size-6 text-accent" />
              <h3 className="font-serif text-xl">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-32 py-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-serif italic text-lg">BoutiqueOS</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agende · Gerencie · Brilhe</span>
        </footer>
      </main>
    </div>
  );
}