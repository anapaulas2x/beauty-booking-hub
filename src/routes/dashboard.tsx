import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ExternalLink, LogOut, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const { data: staff } = useQuery({
    queryKey: ["my-staff", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("staff").select("*").eq("profile_id", user!.id).order("sort_order")).data ?? [],
  });
  const { data: buttons } = useQuery({
    queryKey: ["my-buttons", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("buttons").select("*").eq("profile_id", user!.id).order("sort_order")).data ?? [],
  });
  const { data: services } = useQuery({
    queryKey: ["my-services", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("catalog_items").select("*").eq("profile_id", user!.id).order("sort_order")).data ?? [],
  });
  const { data: bookings } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("bookings").select("*, staff(name)").eq("profile_id", user!.id).gte("start_ts", new Date().toISOString()).order("start_ts").limit(20)).data ?? [],
  });
  const { data: photos } = useQuery({
    queryKey: ["my-photos", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("gallery_photos").select("*").eq("profile_id", user!.id).order("sort_order")).data ?? [],
  });

  const [tab, setTab] = useState<"perfil" | "botoes" | "galeria" | "colaboradoras" | "servicos" | "agenda" | "tema">("perfil");

  if (loading || !profile) return <div className="min-h-screen grid place-items-center font-mono text-xs uppercase tracking-widest text-muted-foreground">Carregando...</div>;

  const invalidate = () => qc.invalidateQueries();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif italic text-xl">BoutiqueOS</Link>
          <div className="flex items-center gap-4">
            <Link to="/u/$slug" params={{ slug: profile.slug }} target="_blank" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-2">/u/{profile.slug} <ExternalLink className="size-3" /></Link>
            <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><LogOut className="size-3" /> Sair</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-serif text-4xl mb-2">{profile.business_name}</h1>
        <p className="text-muted-foreground text-sm mb-8">Painel administrativo</p>

        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(["perfil", "botoes", "galeria", "colaboradoras", "servicos", "agenda", "tema"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap ${tab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </nav>

        {tab === "perfil" && <PerfilTab profile={profile} onSave={invalidate} />}
        {tab === "botoes" && <ButtonsTab userId={user!.id} items={buttons ?? []} onChange={invalidate} />}
        {tab === "galeria" && <GalleryTab userId={user!.id} items={photos ?? []} onChange={invalidate} />}
        {tab === "colaboradoras" && <StaffTab userId={user!.id} items={staff ?? []} onChange={invalidate} />}
        {tab === "servicos" && <ServicesTab userId={user!.id} items={services ?? []} staff={staff ?? []} onChange={invalidate} />}
        {tab === "agenda" && <AgendaTab userId={user!.id} staff={staff ?? []} bookings={bookings ?? []} onChange={invalidate} />}
        {tab === "tema" && <ThemeTab profile={profile} onSave={invalidate} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function input(cls = "") { return `w-full px-4 py-2.5 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring ${cls}`; }

function PerfilTab({ profile, onSave }: { profile: any; onSave: () => void }) {
  const [form, setForm] = useState({ business_name: profile.business_name, slug: profile.slug, bio: profile.bio ?? "", avatar_url: profile.avatar_url ?? "", whatsapp_phone: profile.whatsapp_phone ?? "", instagram_url: profile.instagram_url ?? "" });
  const save = async () => {
    const { error } = await supabase.from("profiles").update(form).eq("user_id", profile.user_id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    onSave();
  };
  return (
    <div className="bg-card p-8 rounded-3xl ring-1 ring-border space-y-4 max-w-2xl">
      <Field label="Nome do estúdio"><input className={input()} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></Field>
      <Field label="Slug (link público)"><input className={input()} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></Field>
      <Field label="Bio"><textarea className="w-full px-4 py-2.5 rounded-2xl border border-border bg-background text-sm" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
      <Field label="Foto de perfil">
        <ImageUpload userId={profile.user_id} value={form.avatar_url} onChange={(url) => setForm({ ...form, avatar_url: url ?? "" })} folder="avatar" />
      </Field>
      <Field label="WhatsApp (com DDD)"><input className={input()} value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} placeholder="5511999999999" /></Field>
      <Field label="Instagram"><input className={input()} value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/..." /></Field>
      <button onClick={save} className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium">Salvar</button>
    </div>
  );
}

function ButtonsTab({ userId, items, onChange }: { userId: string; items: any[]; onChange: () => void }) {
  const PILL_COLORS = ["#f7a8c4", "#b8a4e3", "#f4b89a", "#a8d8b9", "#f3c577", "#e89bb8"];
  const [draft, setDraft] = useState<{ label: string; kind: string; value: string; icon: string | null; color: string }>({ label: "", kind: "whatsapp", value: "", icon: null, color: PILL_COLORS[0] });
  const add = async () => {
    if (!draft.label) return;
    const { error } = await supabase.from("buttons").insert({ profile_id: userId, label: draft.label, kind: draft.kind, value: draft.value, icon: draft.icon, color: draft.color, sort_order: items.length });
    if (error) return toast.error(error.message);
    setDraft({ label: "", kind: "whatsapp", value: "", icon: null, color: PILL_COLORS[0] });
    onChange();
  };
  const del = async (id: string) => { await supabase.from("buttons").delete().eq("id", id); onChange(); };
  const updateIcon = async (id: string, url: string | null) => {
    const { error } = await supabase.from("buttons").update({ icon: url }).eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };
  const updateColor = async (id: string, color: string) => {
    const { error } = await supabase.from("buttons").update({ color }).eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };
  return (
    <div className="space-y-4 max-w-2xl">
      {items.map((b) => (
        <div key={b.id} className="bg-card p-4 rounded-2xl ring-1 ring-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium inline-flex items-center gap-2">
                <span className="inline-block size-3 rounded-full" style={{ backgroundColor: b.color || PILL_COLORS[0] }} />
                {b.label}
              </div>
              <div className="text-xs text-muted-foreground font-mono uppercase">{b.kind}{b.value ? ` · ${b.value}` : ""}</div>
            </div>
            <button onClick={() => del(b.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PILL_COLORS.map((c) => (
              <button key={c} onClick={() => updateColor(b.id, c)} className={`size-7 rounded-full ${b.color === c ? "ring-2 ring-foreground ring-offset-2" : ""}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <ImageUpload userId={userId} value={b.icon} onChange={(url) => updateIcon(b.id, url)} folder="icons" shape="square" />
        </div>
      ))}
      <div className="bg-card p-4 rounded-2xl ring-1 ring-border space-y-3">
        <input className={input()} placeholder="Rótulo (ex: WhatsApp — Cílios)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <select className={input()} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
          <option value="whatsapp">WhatsApp</option>
          <option value="catalog">Catálogo (link)</option>
          <option value="instagram">Instagram</option>
          <option value="link">Link genérico</option>
        </select>
        {draft.kind !== "whatsapp" && <input className={input()} placeholder="URL" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />}
        <Field label="Cor do botão">
          <div className="flex gap-2 flex-wrap">
            {PILL_COLORS.map((c) => (
              <button key={c} onClick={() => setDraft({ ...draft, color: c })} className={`size-8 rounded-full ${draft.color === c ? "ring-2 ring-foreground ring-offset-2" : ""}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </Field>
        <Field label="Ícone (opcional)">
          <ImageUpload userId={userId} value={draft.icon} onChange={(url) => setDraft({ ...draft, icon: url })} folder="icons" shape="square" />
        </Field>
        <button onClick={add} className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"><Plus className="size-4" /> Adicionar botão</button>
      </div>
    </div>
  );
}

function GalleryTab({ userId, items, onChange }: { userId: string; items: any[]; onChange: () => void }) {
  const add = async (url: string | null) => {
    if (!url) return;
    const { error } = await supabase.from("gallery_photos").insert({ profile_id: userId, image_url: url, sort_order: items.length });
    if (error) return toast.error(error.message);
    toast.success("Foto adicionada");
    onChange();
  };
  const del = async (id: string) => {
    await supabase.from("gallery_photos").delete().eq("id", id);
    onChange();
  };
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card p-4 rounded-2xl ring-1 ring-border space-y-3">
        <Field label="Adicionar foto à galeria">
          <ImageUpload userId={userId} value={null} onChange={add} folder="gallery" shape="square" />
        </Field>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma foto ainda.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden group ring-1 ring-border">
              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => del(p.id)} className="absolute top-2 right-2 size-8 rounded-full bg-white/90 grid place-items-center text-destructive opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffTab({ userId, items, onChange }: { userId: string; items: any[]; onChange: () => void }) {
  const [draft, setDraft] = useState({ name: "", role: "" });
  const add = async () => {
    if (!draft.name) return;
    const { error } = await supabase.from("staff").insert({ profile_id: userId, name: draft.name, role: draft.role, sort_order: items.length });
    if (error) return toast.error(error.message);
    setDraft({ name: "", role: "" });
    onChange();
  };
  const del = async (id: string) => { await supabase.from("staff").delete().eq("id", id); onChange(); };
  return (
    <div className="space-y-4 max-w-2xl">
      {items.map((s) => (
        <div key={s.id} className="bg-card p-4 rounded-2xl ring-1 ring-border flex items-center justify-between">
          <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.role}</div></div>
          <button onClick={() => del(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <div className="bg-card p-4 rounded-2xl ring-1 ring-border space-y-3">
        <input className={input()} placeholder="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={input()} placeholder="Função (ex: Designer de cílios)" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
        <button onClick={add} className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"><Plus className="size-4" /> Adicionar colaboradora</button>
      </div>
    </div>
  );
}

function ServicesTab({ userId, items, staff, onChange }: { userId: string; items: any[]; staff: any[]; onChange: () => void }) {
  const [d, setD] = useState({ name: "", duration_min: 60, price: "", staff_id: "" });
  const add = async () => {
    if (!d.name) return;
    const { error } = await supabase.from("catalog_items").insert({
      profile_id: userId, name: d.name, duration_min: d.duration_min,
      price_cents: d.price ? Math.round(parseFloat(d.price) * 100) : null,
      staff_id: d.staff_id || null, sort_order: items.length,
    });
    if (error) return toast.error(error.message);
    setD({ name: "", duration_min: 60, price: "", staff_id: "" });
    onChange();
  };
  const del = async (id: string) => { await supabase.from("catalog_items").delete().eq("id", id); onChange(); };
  return (
    <div className="space-y-4 max-w-2xl">
      {items.map((s) => (
        <div key={s.id} className="bg-card p-4 rounded-2xl ring-1 ring-border flex items-center justify-between">
          <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.duration_min} min{s.price_cents ? ` · R$ ${(s.price_cents / 100).toFixed(2)}` : ""}</div></div>
          <button onClick={() => del(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <div className="bg-card p-4 rounded-2xl ring-1 ring-border space-y-3">
        <input className={input()} placeholder="Nome do serviço" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={input()} type="number" placeholder="Duração (min)" value={d.duration_min} onChange={(e) => setD({ ...d, duration_min: parseInt(e.target.value) || 60 })} />
          <input className={input()} placeholder="Preço R$" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
        </div>
        <select className={input()} value={d.staff_id} onChange={(e) => setD({ ...d, staff_id: e.target.value })}>
          <option value="">Qualquer colaboradora</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={add} className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center gap-2"><Plus className="size-4" /> Adicionar serviço</button>
      </div>
    </div>
  );
}

function AgendaTab({ userId, staff, bookings, onChange }: { userId: string; staff: any[]; bookings: any[]; onChange: () => void }) {
  const [block, setBlock] = useState({ staff_id: staff[0]?.id ?? "", date: new Date().toISOString().slice(0, 10), start: "09:00", end: "12:00", reason: "" });
  const add = async () => {
    if (!block.staff_id) return toast.error("Cadastre uma colaboradora primeiro");
    const start_ts = new Date(block.date + "T" + block.start).toISOString();
    const end_ts = new Date(block.date + "T" + block.end).toISOString();
    const { error } = await supabase.from("blocked_slots").insert({ profile_id: userId, staff_id: block.staff_id, start_ts, end_ts, reason: block.reason });
    if (error) return toast.error(error.message);
    toast.success("Horário bloqueado");
    onChange();
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card p-6 rounded-3xl ring-1 ring-border">
        <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><CalendarIcon className="size-5" /> Próximos agendamentos</h3>
        <div className="space-y-3">
          {bookings.length === 0 && <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>}
          {bookings.map((b: any) => (
            <div key={b.id} className="p-3 rounded-2xl bg-secondary text-sm">
              <div className="font-medium">{b.service_name}</div>
              <div className="text-xs text-muted-foreground">{new Date(b.start_ts).toLocaleString("pt-BR")} · {b.staff?.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{b.customer_name} · {b.customer_phone}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card p-6 rounded-3xl ring-1 ring-border space-y-3">
        <h3 className="font-serif text-xl mb-2">Bloquear horário</h3>
        <select className={input()} value={block.staff_id} onChange={(e) => setBlock({ ...block, staff_id: e.target.value })}>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" className={input()} value={block.date} onChange={(e) => setBlock({ ...block, date: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input type="time" className={input()} value={block.start} onChange={(e) => setBlock({ ...block, start: e.target.value })} />
          <input type="time" className={input()} value={block.end} onChange={(e) => setBlock({ ...block, end: e.target.value })} />
        </div>
        <input className={input()} placeholder="Motivo (opcional)" value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} />
        <button onClick={add} className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium">Bloquear</button>
      </div>
    </div>
  );
}

function ThemeTab({ profile, onSave }: { profile: any; onSave: () => void }) {
  const [theme, setTheme] = useState({ accent: profile.theme?.accent ?? "#a8543a", font: profile.theme?.font ?? "serif", bg: profile.theme?.bg ?? "#fafaf7" });
  const palette = ["#a8543a", "#1c1917", "#9f1239", "#064e3b", "#3b3a36", "#7c6b5d"];
  const bgs = ["#fafaf7", "#ffffff", "#1c1917", "#f5f5f4", "#fef3e8"];
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ theme }).eq("user_id", profile.user_id);
    if (error) return toast.error(error.message);
    toast.success("Tema salvo");
    onSave();
  };
  return (
    <div className="bg-card p-8 rounded-3xl ring-1 ring-border space-y-6 max-w-2xl">
      <Field label="Cor de destaque">
        <div className="flex gap-3 mt-2">
          {palette.map((c) => (
            <button key={c} onClick={() => setTheme({ ...theme, accent: c })} className={`size-10 rounded-full ${theme.accent === c ? "ring-4 ring-offset-2 ring-offset-card" : ""}`} style={{ backgroundColor: c, boxShadow: theme.accent === c ? `0 0 0 4px ${c}30` : undefined }} />
          ))}
        </div>
      </Field>
      <Field label="Fundo">
        <div className="flex gap-3 mt-2">
          {bgs.map((c) => (
            <button key={c} onClick={() => setTheme({ ...theme, bg: c })} className={`size-10 rounded-full border border-border ${theme.bg === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>
      <Field label="Tipografia">
        <div className="flex gap-2 mt-2">
          <button onClick={() => setTheme({ ...theme, font: "serif" })} className={`px-4 py-2 rounded-full text-sm font-serif italic border ${theme.font === "serif" ? "bg-foreground text-background border-foreground" : "border-border"}`}>Serif elegante</button>
          <button onClick={() => setTheme({ ...theme, font: "sans" })} className={`px-4 py-2 rounded-full text-sm font-sans border ${theme.font === "sans" ? "bg-foreground text-background border-foreground" : "border-border"}`}>Sans moderno</button>
        </div>
      </Field>
      <button onClick={save} className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium">Salvar tema</button>
    </div>
  );
}