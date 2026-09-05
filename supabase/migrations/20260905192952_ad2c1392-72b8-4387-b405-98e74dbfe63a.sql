ALTER TABLE public.store_settings ALTER COLUMN hero_media_url SET DEFAULT 'https://files.catbox.moe/a2e9g6.jpg';
ALTER TABLE public.store_settings ALTER COLUMN hero_media_type SET DEFAULT 'image';
UPDATE public.store_settings SET hero_media_url = 'https://files.catbox.moe/a2e9g6.jpg', hero_media_type = 'image' WHERE hero_media_url IS NULL OR hero_media_url = '';