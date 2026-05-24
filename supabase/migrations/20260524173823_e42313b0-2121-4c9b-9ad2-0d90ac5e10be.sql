
ALTER TABLE public.buttons ADD COLUMN IF NOT EXISTS color text;

CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery photos"
  ON public.gallery_photos FOR SELECT USING (true);

CREATE POLICY "Owner can insert gallery photos"
  ON public.gallery_photos FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Owner can update gallery photos"
  ON public.gallery_photos FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Owner can delete gallery photos"
  ON public.gallery_photos FOR DELETE USING (auth.uid() = profile_id);
