
-- roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  images text[] NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  stock_quantity int,
  featured boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon USING (published = true);
CREATE POLICY "products authed read" ON public.products FOR SELECT TO authenticated USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- store settings (single row)
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'King''s n Queens Haven Couture',
  whatsapp_number text NOT NULL DEFAULT '0550545074',
  phone_number text NOT NULL DEFAULT '0207114171',
  currency text NOT NULL DEFAULT 'GHS',
  currency_symbol text NOT NULL DEFAULT 'GH₵',
  address text,
  email text,
  instagram_url text,
  hero_media_url text,
  hero_media_type text NOT NULL DEFAULT 'image',
  hero_poster_url text,
  hero_headline text NOT NULL DEFAULT 'KING''S N QUEENS',
  hero_subheadline text NOT NULL DEFAULT 'HAVEN COUTURE',
  hero_tagline text NOT NULL DEFAULT 'Your style. Your scent. Your presence.',
  hero_cta_label text NOT NULL DEFAULT 'Explore Collection',
  hero_cta_link text NOT NULL DEFAULT '/shop',
  about_title text NOT NULL DEFAULT 'The Haven',
  about_body text,
  policy_body text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.store_settings (address, email, about_body, policy_body) VALUES (
  'Accra, Ghana',
  NULL,
  'King''s n Queens Haven Couture is a Ghanaian boutique curating refined footwear, tailored pieces and signature fragrances. Every piece is selected for presence — the quiet confidence of someone who dresses for themselves first.',
  'Orders are confirmed on WhatsApp before dispatch. Delivery timelines and fees are agreed with each customer directly. Items may be exchanged within 48 hours of delivery if unworn and in original packaging.'
);

-- categories seed
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Fragrance', 'fragrance', 'Signature scents for him and her.', 1),
  ('Footwear', 'footwear', 'Sandals and statement footwear.', 2),
  ('Apparel', 'apparel', 'Tailored pieces and everyday luxury.', 3);

-- products seed
INSERT INTO public.products (name, slug, images, category_id, featured, new_arrival, display_order)
SELECT v.name, v.slug, ARRAY[v.img], c.id, v.featured, v.newa, v.ord
FROM (VALUES
  ('WT Sandals','wt-sandals','https://files.catbox.moe/68l0pd.jpg','footwear',true,true,1),
  ('Pleated Trousers','pleated-trousers','https://files.catbox.moe/fq9p2e.jpg','apparel',true,true,2),
  ('Grandior Solaire','grandior-solaire','https://files.catbox.moe/a2e9g6.jpg','fragrance',true,true,3),
  ('Nitro Pour Homme White','nitro-pour-homme-white','https://files.catbox.moe/vnfc2w.jpg','fragrance',true,true,4),
  ('Nitro Pour Homme','nitro-pour-homme','https://files.catbox.moe/fxmepw.jpg','fragrance',false,true,5),
  ('Nitro','nitro','https://files.catbox.moe/5h92tw.jpg','fragrance',false,true,6),
  ('Exciting Insense','exciting-insense','https://files.catbox.moe/rsqwce.jpg','fragrance',false,true,7),
  ('Nitro Pour Homme Red','nitro-pour-homme-red','https://files.catbox.moe/if1yaz.jpg','fragrance',true,false,8),
  ('Nitro Pour Homme Black','nitro-pour-homme-black','https://files.catbox.moe/wugtye.jpg','fragrance',false,false,9),
  ('Nitro Pour Homme Elixir','nitro-pour-homme-elixir','https://files.catbox.moe/j399mo.jpg','fragrance',false,false,10),
  ('Nitro Pour Homme Platinum','nitro-pour-homme-platinum','https://files.catbox.moe/3am7k6.jpg','fragrance',false,false,11),
  ('Soprano Ice','soprano-ice','https://files.catbox.moe/64e2dc.jpg','fragrance',false,false,12),
  ('Dominant Pour Homme – Inception','dominant-pour-homme-inception','https://files.catbox.moe/g4mpvg.jpg','fragrance',true,false,13),
  ('Dominant Pour Homme – For Men','dominant-pour-homme-for-men','https://files.catbox.moe/mgciox.jpg','fragrance',false,false,14),
  ('Gladio Grigio','gladio-grigio','https://files.catbox.moe/vujri7.jpg','fragrance',false,false,15),
  ('Celerio Epic','celerio-epic','https://files.catbox.moe/cvbya1.jpg','fragrance',false,false,16),
  ('Al Haramain Amber Oud – Ruby Edition','al-haramain-amber-oud-ruby-edition','https://files.catbox.moe/afj0hi.jpg','fragrance',true,false,17),
  ('Borouj Amnesty','borouj-amnesty','https://files.catbox.moe/793k28.jpg','fragrance',false,false,18),
  ('Hawas Ice','hawas-ice','https://files.catbox.moe/1mblyr.jpg','fragrance',false,false,19),
  ('Haven Selection 20','haven-selection-20','https://files.catbox.moe/jcnq37.jpg','fragrance',false,false,20),
  ('Haven Selection 21','haven-selection-21','https://files.catbox.moe/vb6pk7.jpg','fragrance',false,false,21)
) AS v(name, slug, img, cat, featured, newa, ord)
LEFT JOIN public.categories c ON c.slug = v.cat;
