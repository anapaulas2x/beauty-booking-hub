import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/u/$slug/agendar")({
  component: BookPage,
});

function BookPage() {
  const { slug } = Route.useParams();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [staffId, setStaffId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["book-data", slug],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
      if (!profile) return null;
      const [{ data: staff }, { data: services }] = await Promise.all([
        supabase.from("staff").select("*").eq("profile_id", profile.user_id).eq("active", true).order("sort_order"),
        supabase.from("catalog_items").select("*").eq("profile_id", profile.user_id).eq("active", true).order("sort_order"),
      ]);
      return { profile, staff: staff ?? [], services: services ?? [] };
    },
  });

  const { data: busy } = useQuery({
    queryKey: ["busy", staffId, date],
    enabled: !!staffId && !!date,
    queryFn: async () => {
      const start = new Date(date + "T00:00").toISOString();
      const end = new Date(date + "T23:59").toISOString();
      const [{ data: blocks }, { data: bks }] = await Promise.all([
        supabase.from("blocked_slots").select("start_ts,end_ts").eq("staff_id", staffId!).gte("start_ts", start).lte("start_ts", end),
        supabase.from("bookings").select("start_ts,end_ts").eq("staff_id", staffId!).gte("start_ts", start).lte("start_ts", end),
      ]);
      return [...(blocks ?? []), ...(bks ?? [])];
    },
  });

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 9; h < 19; h++) {
      for (const m of [0, 30]) out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return out;
  }, []);

  const isBusy = (t: string) => {
    const slotStart = new Date(date + "T" + t).getTime();
    return (busy ?? []).some((b) => {
      const s = new Date(b.start_ts).getTime();
      const e = new Date(b.end_ts).getTime();
      return slotStart >= s && slotStart < e;
    });
  };

  const submit = async () => {
    if (!data || !staffId || !serviceId || !time) return;
    setSubmitting(true);
    const service = data.services.find((s) => s.id === serviceId)!;
    const startTs = new Date(date + "T" + time);
    const endTs = new Date(startTs.getTime() + service.duration_min * 60000);
    const { error } = await supabase.from("bookings").insert({
      profile_id: data.profile.user_id,
      staff_id: staffId,
      catalog_item_id: serviceId,
      service_name: service.name,
      customer_name: name,
      customer_phone: phone,
      start_ts: startTs.toISOString(),
      end_ts: endTs.toISOString(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Agendamento confirmado!");
    setTime(null);
    setName("");
    setPhone("");
  };

  if (!data) return <div className="min-h-screen grid place-items-center font-mono text-xs uppercase tracking-widest text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/u/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="size-4" /> Voltar</Link>
        <header className="mb-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agendamento</span>
          <h1 className="font-serif text-4xl mt-2">{data.profile.business_name}</h1>
        </header>

        <div className="space-y-8 bg-card p-8 rounded-3xl ring-1 ring-border">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">(01) Colaboradora</label>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {data.staff.map((s) => (
                <button key={s.id} onClick={() => setStaffId(s.id)} className={`text-left p-4 rounded-2xl border transition-colors ${staffId === s.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}>
                  <div className="font-medium">{s.name}</div>
                  {s.role && <div className="text-xs opacity-70">{s.role}</div>}
                </button>
              ))}
              {data.staff.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Nenhuma colaboradora cadastrada ainda.</p>}
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">(02) Serviço</label>
            <div className="space-y-2 mt-3">
              {data.services.filter((s) => !s.staff_id || s.staff_id === staffId).map((s) => (
                <button key={s.id} onClick={() => setServiceId(s.id)} className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-colors ${serviceId === s.id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}>
                  <div className="text-left">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-70">{s.duration_min} min{s.price_cents ? ` · R$ ${(s.price_cents / 100).toFixed(2)}` : ""}</div>
                  </div>
                </button>
              ))}
              {data.services.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>}
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">(03) Data & horário</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-3 px-4 py-2 rounded-full border border-border bg-background text-sm" />
            {staffId && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                {slots.map((t) => {
                  const b = isBusy(t);
                  return (
                    <button key={t} disabled={b} onClick={() => setTime(t)} className={`py-2 rounded-lg text-xs font-mono border transition-colors ${time === t ? "bg-foreground text-background border-foreground" : b ? "bg-secondary text-muted-foreground line-through border-transparent cursor-not-allowed" : "border-border hover:bg-secondary"}`}>{t}</button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">(04) Seus dados</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 rounded-full border border-border bg-background text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" className="w-full px-4 py-3 rounded-full border border-border bg-background text-sm" />
          </div>

          <button onClick={submit} disabled={submitting || !staffId || !serviceId || !time || !name || !phone} className="w-full py-4 rounded-full bg-accent text-accent-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">{submitting ? "Confirmando..." : "Confirmar agendamento"}</button>
        </div>
      </div>
    </div>
  );
}