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

const PALETTE = ["#f7a8c4", "#b8a4e3", "#f4b89a", "#a8d8b9", "#f3c577", "#e89bb8"];

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
      const { data: photos } = await supabase
        .from("gallery_photos")
        .select("*")
        .eq("profile_id", profile.user_id)
        .order("sort_order");
      return { profile, buttons: buttons ?? [], photos: photos ?? [] };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs uppercase tracking-widest text-stone-400" style={{ backgroundColor: "#fde7ee" }}>Carregando...</div>;
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

  const { profile, buttons, photos } = data;
  const theme = (profile.theme ?? {}) as { accent?: string; bg?: string; nameColor?: string };
  const accent = theme.accent || "#ec6f9c";
  const bg = theme.bg || "#fde7ee";
  const nameColor = theme.nameColor || "#5a1f3d";

  return (
    <div className="min-h-screen font-sans flex flex-col items-center pt-10 pb-16 px-5" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-[440px]">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.business_name}
              className="size-36 rounded-full object-cover ring-4 ring-white shadow-lg"
              style={{ outline: `3px solid ${accent}`, outlineOffset: "4px" }}
            />
          ) : (
            <div className="size-36 rounded-full bg-white grid place-items-center shadow-lg" style={{ outline: `3px solid ${accent}`, outlineOffset: "4px" }}>
              <Sparkles className="size-10" style={{ color: accent }} />
            </div>
          )}

          <h1 className="mt-6 text-5xl leading-none" style={{ fontFamily: "var(--font-script)", color: nameColor }}>
            {profile.business_name}
          </h1>
          {profile.bio && (
            <p className="mt-2 text-sm font-medium" style={{ color: nameColor, opacity: 0.85 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Service pills */}
        {buttons.length > 0 && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {buttons.map((b, i) => {
              const Icon = iconFor(b.kind);
              const color = b.color || PALETTE[i % PALETTE.length];
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
                  className="px-5 py-3 rounded-2xl text-white text-sm font-semibold inline-flex items-center gap-2 shadow-md hover:scale-[1.03] active:scale-95 transition"
                  style={{ backgroundColor: color }}
                >
                  {b.icon ? (
                    <img src={b.icon} alt="" className="size-5 rounded object-cover" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                  {b.label}
                </a>
              );
            })}
          </div>
        )}

        {/* Fotos section */}
        {photos.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px flex-1 border-t border-dashed" style={{ borderColor: `${accent}80` }} />
              <h2 className="text-3xl" style={{ fontFamily: "var(--font-script)", color: nameColor }}>Fotos</h2>
              <div className="h-px flex-1 border-t border-dashed" style={{ borderColor: `${accent}80` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {photos.map((p) => (
                <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reservar Agora */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/u/$slug/agendar"
            params={{ slug }}
            className="px-10 py-4 rounded-full text-white text-lg font-semibold shadow-xl hover:scale-[1.02] active:scale-95 transition"
            style={{ backgroundColor: accent, boxShadow: `0 12px 30px -10px ${accent}` }}
          >
            Reservar Agora
          </Link>
        </div>

        {/* Socials */}
        <div className="mt-10 flex items-center justify-center gap-4">
          {profile.instagram_url && (
            <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="size-11 rounded-full bg-white grid place-items-center shadow-sm" style={{ color: "#ec4899" }}>
              <Instagram className="size-5" />
            </a>
          )}
          {profile.whatsapp_phone && (
            <a href={whatsappUrl(profile.whatsapp_phone, `Olá ${profile.business_name}!`)} target="_blank" rel="noreferrer" className="size-11 rounded-full grid place-items-center shadow-sm text-white" style={{ backgroundColor: "#25D366" }}>
              <MessageCircle className="size-5" />
            </a>
          )}
        </div>
      </div>

      <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-stone-400">
        powered by <Link to="/" className="underline">BoutiqueOS</Link>
      </p>
    </div>
  );
}