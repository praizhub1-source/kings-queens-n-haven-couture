# Haven Couture Admin

Build a BRAND-NEW production-quality ecommerce website called "King's n Queens Haven Couture" in this workspace. Do NOT modify, overwrite, remix, or use any existing project.

BUSINESS
Name: King's n Queens Haven Couture
WhatsApp: 0550545074
Phone: 0207114171
Currency: GHS / GH₵

CORE MODEL
This is a customer-facing fashion/fragrance boutique with NO customer accounts, NO customer signup, and NO customer login. Customers browse products, view details, add items to a cart, review the cart, enter basic order details, and send the complete order to the business WhatsApp number. WhatsApp is the initial order-confirmation channel; no online payment gateway is required in this first version.

CRITICAL ARCHITECTURE RULE
The ADMIN MUST control all storefront content. Do not hard-code product catalogue data into the frontend. The public website must read products/settings/content from the database. When admin adds/edits/deletes a product or changes prices, availability, categories, featured status, homepage media, business/contact details, etc., the public storefront must automatically reflect the change.

INITIAL PRODUCTS
Seed the catalogue with the 21 supplied Catbox image URLs as initial product image sources. Use these exact URLs as initial source images if accessible:
1 https://files.catbox.moe/68l0pd.jpg
2 https://files.catbox.moe/fq9p2e.jpg
3 https://files.catbox.moe/a2e9g6.jpg
4 https://files.catbox.moe/vnfc2w.jpg
5 https://files.catbox.moe/fxmepw.jpg
6 https://files.catbox.moe/5h92tw.jpg
7 https://files.catbox.moe/rsqwce.jpg
8 https://files.catbox.moe/if1yaz.jpg
9 https://files.catbox.moe/wugtye.jpg
10 https://files.catbox.moe/j399mo.jpg
11 https://files.catbox.moe/3am7k6.jpg
12 https://files.catbox.moe/64e2dc.jpg
13 https://files.catbox.moe/g4mpvg.jpg
14 https://files.catbox.moe/mgciox.jpg
15 https://files.catbox.moe/vujri7.jpg
16 https://files.catbox.moe/cvbya1.jpg
17 https://files.catbox.moe/afj0hi.jpg
18 https://files.catbox.moe/793k28.jpg
19 https://files.catbox.moe/1mblyr.jpg
20 https://files.catbox.moe/jcnq37.jpg
21 https://files.catbox.moe/vb6pk7.jpg

Use visible product labels for draft names where clearly readable. Known draft names include: WT Sandals; Pleated Trousers/Pants; Grandior Solaire / Grandior Solair; Nitro Pour Homme White; Nitro Pour Homme; Nitro; Exciting Insense; Nitro Pour Homme Red; Nitro Pour Homme Black; Nitro Pour Homme Elixir; Nitro Pour Homme Platinum; Soprano Ice; Dominant Pour Homme – Inception; Dominant Pour Homme – For Men; Gladio Grigio; Celerio Epic; Al Haramain Amber Oud – Ruby Edition; Borouj Amnesty; Hawas Ice. Where a label/name is uncertain, use a neutral draft name and make it editable in admin. DO NOT invent prices. Initial price can be null/blank and storefront should gracefully show "Price available soon" or equivalent until admin enters it.

DESIGN DIRECTION — VERY IMPORTANT
The user explicitly does NOT want a raw/static ecommerce template. Build a cinematic, video-first, highly interactive luxury boutique experience. Combine multiple high-end interaction patterns rather than copying one site. Inspirations include Awwwards/FWA/Landing.Love-style immersive fashion sites: cinematic hero, smooth scrolling, scroll-triggered reveals, hover transformations, parallax, magnetic-feeling buttons, horizontal product storytelling, animated cart, layered transitions, and premium editorial composition.

VISUAL LANGUAGE
Luxury couture / fragrance editorial. Warm ivory/cream background, black typography, deep green accents, restrained champagne/gold accents. Elegant serif display typography paired with a clean modern sans-serif. Lots of intentional whitespace, oversized type, high-quality product imagery, subtle grain/texture only if performant. Do not make it look like a generic AI-generated landing page.

PUBLIC PAGES/SECTIONS
- Home
- Shop / catalogue
- Product detail
- Cart drawer/page
- About / brand story section
- Contact
- Privacy/basic store policy placeholder if needed

HOMEPAGE EXPERIENCE
1. Cinematic full-width hero with replaceable hero video/media controlled by admin. If no uploaded video exists, use a tasteful lightweight fallback rather than a broken player.
2. Animated brand reveal: KING'S N QUEENS / HAVEN COUTURE.
3. Strong CTA: Explore Collection.
4. Scroll-driven editorial statement such as "YOUR STYLE. YOUR SCENT. YOUR PRESENCE." but keep copy editable through settings/content where practical.
5. Shop-by-category section using categories actually present in the database.
6. Featured products controlled by admin.
7. Fragrance/editorial storytelling section with smooth image/text movement.
8. New arrivals section.
9. Brand/about section.
10. WhatsApp CTA.
11. Premium footer.

PRODUCT UX
- Beautiful responsive product cards, not plain grids.
- Hover: image zoom/shift, information reveal, subtle motion.
- Touch-friendly mobile behavior with tap states instead of hover dependency.
- Quick view if useful.
- Product detail with large imagery, title, category, price, description, availability, quantity and Add to Cart.
- Gracefully handle missing price.
- Search and category filtering.
- Sort where useful.

CART + WHATSAPP
Cart persists during browsing using local storage or equivalent; no customer account is needed.
Cart shows product, image, quantity controls, remove, subtotal/total.
Checkout/order form collects customer name, phone number, delivery/location details, and optional note.
"Order on WhatsApp" generates a clean, readable WhatsApp message containing business name, customer details, every item with quantity and price (or price pending), and total where calculable. Use WhatsApp number 0550545074. Do not send an order to the wrong number.

ADMIN CONTROL CENTER
Create a secure /admin area. Customers must never see admin controls.
Admin can:
- Login securely
- Dashboard overview
- Products CRUD
- Upload product images to managed storage (prefer project/Supabase storage rather than permanent Catbox hotlinks)
- Add/edit/delete products
- Product name, price in GHS, description, category, images, availability/stock, featured, new arrival, display order
- Categories CRUD
- Homepage/hero media management
- Hero video/image, headline, subheadline, CTA labels/links where practical
- Store settings: business name, WhatsApp, phone, currency, address/contact text
- About/brand content
- Basic policy/contact content
- Preview-friendly management UI

DATABASE
Use the project's database/Supabase if available. Keep schema clean and normalized. At minimum: products, categories, store_settings/site_content, admin/auth support, media as appropriate. Do not hard-code catalogue content in React/TS files.

SECURITY
Admin authentication only. Protect /admin routes and all admin mutations. Customers have no account system. Validate uploads and form inputs. Do not expose admin credentials in client code.

MOTION/PERFORMANCE
Use tasteful production-quality motion. Prefer performant CSS transforms and a suitable animation library if already supported. Smooth page transitions, scroll reveals, parallax, image hover movement, magnetic-feeling buttons, horizontal sections, animated cart. Respect prefers-reduced-motion. Do not sacrifice mobile performance. Lazy-load heavy media, use poster/fallback for video, and avoid giant WebGL/3D effects unless they materially improve the experience and remain performant.

RESPONSIVE
Mobile-first. The primary customer device is Android/mobile. Desktop should be impressive, but mobile must remain fast, usable and visually premium. Every interaction must have a touch-friendly equivalent.

IMPORTANT QUALITY BAR
This must feel like a real premium boutique store, not a demo. Build functional navigation, functional cart, functional WhatsApp ordering, functional admin CRUD and database-backed storefront. Avoid fake testimonials, fake reviews, fake statistics, fake social proof, and invented business claims. Use empty states where real content is not available.

Do not ask the user for prices now; prices will be wired later from the admin panel. Build the system so admin can enter them at any time and the storefront updates automatically.

Start by implementing the full foundation and polished storefront + admin architecture, then verify all core interactions and routes work.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kings-queens-n-haven-couture.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/97900919-34a4-4646-ad20-2984b8ed89be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
