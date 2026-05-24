import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export function ImageUpload({
  userId,
  value,
  onChange,
  folder = "misc",
  shape = "circle",
}: {
  userId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  shape?: "circle" | "square";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem");
    if (file.size > 5 * 1024 * 1024) return toast.error("Máximo 5MB");
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  };

  const cls = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="flex items-center gap-3">
      <div className={`size-16 ${cls} bg-secondary ring-1 ring-border overflow-hidden grid place-items-center`}>
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <Upload className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="px-4 py-2 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider disabled:opacity-50"
        >
          {busy ? "Enviando..." : value ? "Trocar" : "Enviar foto"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-2 rounded-full bg-secondary text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}