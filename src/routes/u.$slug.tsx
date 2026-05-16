import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { whatsappUrl } from "@/lib/whatsapp";
import { Instagram, MessageCircle, BookOpen, Calendar, ExternalLink, Sparkles } from "lucide-react";

export const Route = createFileRoute("/u/$slug")({
  component: PublicProfile,
});

const iconFor = (kind: string) => {
  switch (kind) {
    case "whatsapp": return MessageCircle;
    case "catalog": return BookOpen;
    case "instagram": return Instagram;
    case "booking": return Calendar;
    default: return ExternalLink;
  }
};

function PublicProfile() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return null;
      const { data: buttons } = await supabase
        .from("buttons")
        .select("*")
        .eq("profile_id", profile.user_id)
        .order("sort_order");
      return { profile, buttons: buttons ?? [] };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center font-mono text-xs uppercase tracking-widest text-muted-foreground">Carregando...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-6">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-4xl">Perfil não encontrado</h1>
          <p className="text-muted-foreground">O link <span className="font-mono">/u/{slug}</span> não existe.</p>
          <Link to="/" className="inline-block underline text-sm">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const { profile, buttons } = data;
  const theme = (profile.theme ?? {}) as { accent?: string; font?: string; bg?: string };
  const accent = theme.accent || "#a8543a";
  const bg = theme.bg || "#fafaf7";
  const fontFamily = theme.font === "sans" ? "var(--font-sans)" : "var(--font-serif)";

  return (
    <div className="min-h-screen font-sans flex flex-col items-center pt-12 pb-24 px-6" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-[420px] bg-white ring-1 ring-black/5 rounded-[40px] p-8 shadow-2xl shadow-black/5">
        <div className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.business_name} className="size-24 rounded-full object-cover ring-1 ring-black/5 mb-6" />
          ) : (
            <div className="size-24 rounded-full bg-stone-100 grid place-items-center mb-6 ring-1 ring-black/5">
              <Sparkles className="size-7" style={{ color: accent }} />
            </div>
          )}
          <h1 style={{ fontFamily }} className="text-3xl mb-2">{profile.business_name}</h1>
          {profile.bio && <p className="text-stone-500 text-sm max-w-[280px] leading-relaxed">{profile.bio}</p>}
        </div>

        <div className="space-y-3">
          <Link
            to="/u/$slug/agendar"
            params={{ slug }}
            className="group w-full py-4 px-6 rounded-full text-white flex items-center justify-between transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <span className="text-sm font-medium flex items-center gap-3"><Calendar className="size-4" /> Agendar Online</span>
            <span className="font-mono text-[10px] opacity-70">→</span>
          </Link>

          {buttons.map((b, i) => {
            const Icon = iconFor(b.kind);
            const href =
              b.kind === "whatsapp"
                ? whatsappUrl(profile.whatsapp_phone, `Olá! Tenho interesse em: ${b.label}`)
                : b.kind === "instagram"
                  ? profile.instagram_url || b.value || "#"
                  : b.value || "#";
            return (
              <a
                key={b.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group w-full py-4 px-6 rounded-full border border-black/10 flex items-center justify-between hover:bg-stone-900 hover:text-white transition-all duration-300"
              >
                <span className="text-sm font-medium flex items-center gap-3" style={{ fontFamily: b.kind === "whatsapp" ? fontFamily : undefined, fontStyle: b.kind === "whatsapp" ? "italic" : undefined }}>
                  <Icon className="size-4" />
                  {b.label}
                </span>
                <span className="font-mono text-[10px] opacity-50 group-hover:opacity-100">(0{i + 2})</span>
              </a>
            );
          })}

          {buttons.length === 0 && (
            <p className="text-center text-xs text-stone-400 py-4 font-mono uppercase tracking-widest">Nenhum botão configurado</p>
          )}
        </div>

        {profile.instagram_url && (
          <div className="flex justify-center gap-6 mt-10 opacity-50">
            <a href={profile.instagram_url} target="_blank" rel="noreferrer"><Instagram className="size-5" /></a>
          </div>
        )}
      </div>

      <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-stone-400">
        powered by <Link to="/" className="underline">BoutiqueOS</Link>
      </p>
    </div>
  );
}