import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LayoutDashboard, Package, Tags, Image, Settings, LogOut, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/lib/admin.functions";
import { TeamPanel, AccountPanel } from "@/components/admin/TeamPanel";
import { uploadMedia } from "@/lib/admin";
import { categoriesQuery, productsQuery, settingsQuery, slugify, type Category, type Product, type StoreSettings } from "@/lib/store";
import { AdminButton, Confirm, EmptyState, Field, Modal, Panel, inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Store Studio — King's n Queens Haven Couture" },
      { name: "description", content: "Private catalogue and storefront management." },
      { property: "og:title", content: "Store Studio — King's n Queens Haven Couture" },
      { property: "og:description", content: "Private catalogue and storefront management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "products" | "categories" | "homepage" | "settings";
type ProductDraft = {
  id?: string; name: string; slug: string; description: string; category_id: string;
  price: string; stock_quantity: string; display_order: string; images: string;
  in_stock: boolean; featured: boolean; new_arrival: boolean; published: boolean;
};
const emptyProduct: ProductDraft = { name: "", slug: "", description: "", category_id: "", price: "", stock_quantity: "", display_order: "0", images: "", in_stock: true, featured: false, new_arrival: false, published: true };

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(ensureAdmin);
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");
  const [tab, setTab] = useState<Tab>("overview");
  const { data: products = [] } = useQuery({ ...productsQuery, enabled: access === "allowed" });
  const { data: categories = [] } = useQuery({ ...categoriesQuery, enabled: access === "allowed" });
  const { data: settings } = useQuery({ ...settingsQuery, enabled: access === "allowed" });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      try {
        const result = await checkAdmin();
        if (!active) return;
        if (!result.isAdmin) setAccess("denied");
        else {
          setAccess("allowed");
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["products"] }),
            queryClient.invalidateQueries({ queryKey: ["categories"] }),
            queryClient.invalidateQueries({ queryKey: ["store_settings"] }),
          ]);
        }
      } catch {
        if (active) setAccess("denied");
      }
    });
    return () => { active = false; };
  }, [checkAdmin, navigate, queryClient]);

  if (access === "checking") return <AdminStatus title="Opening the studio…" />;
  if (access === "denied") return <AdminStatus title="Access denied" action />;

  const nav = [
    ["overview", "Overview", LayoutDashboard], ["products", "Products", Package],
    ["categories", "Categories", Tags], ["homepage", "Homepage", Image], ["settings", "Settings", Settings],
  ] as const;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-forest-deep text-ivory">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div><p className="kicker text-champagne">Private studio</p><h1 className="mt-1 text-2xl">King&apos;s n Queens</h1></div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-ivory/70 hover:text-ivory">View store</Link>
            <button aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] md:grid-cols-[220px_1fr]">
        <nav className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-border p-3 md:min-h-[calc(100dvh-85px)] md:flex-col md:border-b-0 md:border-r md:p-5">
          {nav.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={cn("flex shrink-0 items-center gap-3 px-4 py-3 text-left text-xs uppercase tracking-[0.16em]", tab === key ? "bg-forest text-primary-foreground" : "text-muted-foreground hover:text-foreground")}><Icon className="h-4 w-4" />{label}</button>)}
        </nav>
        <main className="min-w-0 p-5 md:p-8 lg:p-10">
          {tab === "overview" && <Overview products={products} categories={categories} />}
          {tab === "products" && <Products products={products} categories={categories} />}
          {tab === "categories" && <Categories categories={categories} />}
          {tab === "homepage" && settings && <SettingsForm settings={settings} mode="homepage" />}
          {tab === "settings" && settings && <SettingsForm settings={settings} mode="store" />}
        </main>
      </div>
    </div>
  );
}

function AdminStatus({ title, action }: { title: string; action?: boolean }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center bg-forest-deep px-5 text-center text-ivory"><h1 className="text-4xl">{title}</h1>{action && <Link to="/auth" className="mt-6 text-xs uppercase tracking-[0.2em] text-champagne">Return to sign in</Link>}</main>;
}

function Overview({ products, categories }: { products: Product[]; categories: Category[] }) {
  const stats = [["Products", products.length], ["Published", products.filter(p => p.published).length], ["Featured", products.filter(p => p.featured).length], ["New arrivals", products.filter(p => p.new_arrival).length], ["Categories", categories.length]];
  return <div><p className="kicker">Dashboard</p><h2 className="mt-2 text-4xl">Store overview</h2><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">{stats.map(([label, value]) => <div key={label} className="border border-border bg-card p-5"><strong className="display text-4xl font-light">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{label}</p></div>)}</div><Panel title="Catalogue status" className="mt-8"><p className="text-sm text-muted-foreground">{products.filter(p => p.price === null).length} products are awaiting prices. {products.filter(p => !p.in_stock).length} products are unavailable.</p></Panel></div>;
}

function Products({ products, categories }: { products: Product[]; categories: Category[] }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState(""); const [draft, setDraft] = useState<ProductDraft | null>(null); const [deleting, setDeleting] = useState<Product | null>(null); const [busy, setBusy] = useState(false);
  const shown = useMemo(() => products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const edit = (p: Product): ProductDraft => ({ id: p.id, name: p.name, slug: p.slug, description: p.description ?? "", category_id: p.category_id ?? "", price: p.price?.toString() ?? "", stock_quantity: p.stock_quantity?.toString() ?? "", display_order: String(p.display_order), images: p.images.join("\n"), in_stock: p.in_stock, featured: p.featured, new_arrival: p.new_arrival, published: p.published });
  const save = async (e: FormEvent) => { e.preventDefault(); if (!draft?.name.trim()) return; setBusy(true); const payload = { name: draft.name.trim(), slug: draft.slug.trim() || slugify(draft.name), description: draft.description.trim() || null, category_id: draft.category_id || null, price: draft.price === "" ? null : Number(draft.price), stock_quantity: draft.stock_quantity === "" ? null : Number(draft.stock_quantity), display_order: Number(draft.display_order) || 0, images: draft.images.split(/\n|,/).map(v => v.trim()).filter(Boolean), in_stock: draft.in_stock, featured: draft.featured, new_arrival: draft.new_arrival, published: draft.published }; const result = draft.id ? await supabase.from("products").update(payload).eq("id", draft.id) : await supabase.from("products").insert(payload); setBusy(false); if (result.error) { toast.error(result.error.message); return; } toast.success("Product saved"); setDraft(null); qc.invalidateQueries({ queryKey: ["products"] }); };
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="kicker">Catalogue</p><h2 className="mt-2 text-4xl">Products</h2></div><AdminButton onClick={() => setDraft({ ...emptyProduct })}><Plus className="h-4 w-4" />Add product</AdminButton></div><input aria-label="Search products" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" className={cn(inputClass, "mt-7 max-w-md")} />
    <div className="mt-6 space-y-2">{shown.length === 0 ? <EmptyState title="No products found" /> : shown.map(p => <div key={p.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border border-border bg-card p-3">{p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" className="h-14 w-14 object-cover" /> : <div className="h-14 w-14 bg-sand" />}<div className="min-w-0"><p className="truncate text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.price === null ? "Price pending" : `GH₵ ${p.price.toLocaleString()}`} · {p.published ? "Published" : "Draft"}</p></div><div className="flex gap-2"><button aria-label={`Edit ${p.name}`} onClick={() => setDraft(edit(p))} className="p-2"><Pencil className="h-4 w-4" /></button><button aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
    <Modal open={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? "Edit product" : "Add product"} wide>{draft && <form onSubmit={save} className="grid gap-5 md:grid-cols-2"><Field label="Name"><input className={inputClass} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></Field><Field label="Slug"><input className={inputClass} value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} placeholder="Created from name" /></Field><Field label="Category"><select className={inputClass} value={draft.category_id} onChange={e => setDraft({ ...draft, category_id: e.target.value })}><option value="">No category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Price (GH₵)" hint="Leave blank for price pending"><input className={inputClass} type="number" min="0" step="0.01" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} /></Field><Field label="Stock quantity"><input className={inputClass} type="number" min="0" value={draft.stock_quantity} onChange={e => setDraft({ ...draft, stock_quantity: e.target.value })} /></Field><Field label="Display order"><input className={inputClass} type="number" value={draft.display_order} onChange={e => setDraft({ ...draft, display_order: e.target.value })} /></Field><Field label="Description"><textarea className={cn(inputClass, "min-h-28")} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></Field><Field label="Image URLs" hint="One URL per line"><textarea className={cn(inputClass, "min-h-28")} value={draft.images} onChange={e => setDraft({ ...draft, images: e.target.value })} /><MediaUpload onUploaded={url => setDraft({ ...draft, images: [draft.images, url].filter(Boolean).join("\n") })} /></Field><div className="flex flex-wrap gap-4 md:col-span-2">{(["in_stock", "featured", "new_arrival", "published"] as const).map(key => <label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.checked })} />{key.replace("_", " ")}</label>)}</div><div className="flex gap-3 md:col-span-2"><AdminButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save product"}</AdminButton><AdminButton variant="ghost" onClick={() => setDraft(null)}>Cancel</AdminButton></div></form>}</Modal>
    <Confirm open={Boolean(deleting)} label={`Delete ${deleting?.name ?? "this product"}? This cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={async () => { if (!deleting) return; setBusy(true); const { error } = await supabase.from("products").delete().eq("id", deleting.id); setBusy(false); if (error) { toast.error(error.message); return; } setDeleting(null); toast.success("Product deleted"); qc.invalidateQueries({ queryKey: ["products"] }); }} busy={busy} />
  </div>;
}

function MediaUpload({ onUploaded }: { onUploaded: (url: string) => void }) { const [busy, setBusy] = useState(false); return <label className="mt-2 inline-flex cursor-pointer text-xs text-forest"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { onUploaded(await uploadMedia(file)); toast.success("Image uploaded"); } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); } finally { setBusy(false); } }} />{busy ? "Uploading…" : "Upload image"}</label>; }

function Categories({ categories }: { categories: Category[] }) { const qc = useQueryClient(); const [draft, setDraft] = useState<Category | null>(null); const [name, setName] = useState(""); const save = async (e: FormEvent) => { e.preventDefault(); if (!name.trim()) return; const payload = { name: name.trim(), slug: slugify(name), display_order: draft?.display_order ?? categories.length }; const result = draft ? await supabase.from("categories").update(payload).eq("id", draft.id) : await supabase.from("categories").insert(payload); if (result.error) { toast.error(result.error.message); return; } setName(""); setDraft(null); toast.success("Category saved"); qc.invalidateQueries({ queryKey: ["categories"] }); }; return <div><p className="kicker">Organisation</p><h2 className="mt-2 text-4xl">Categories</h2><Panel title={draft ? "Edit category" : "Add category"} className="mt-8"><form onSubmit={save} className="flex flex-col gap-3 sm:flex-row"><input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Category name" required /><AdminButton type="submit">Save</AdminButton>{draft && <AdminButton variant="ghost" onClick={() => { setDraft(null); setName(""); }}>Cancel</AdminButton>}</form></Panel><div className="mt-6 space-y-2">{categories.map(c => <div key={c.id} className="flex items-center justify-between border border-border bg-card p-4"><span>{c.name}</span><div className="flex gap-2"><button aria-label={`Edit ${c.name}`} onClick={() => { setDraft(c); setName(c.name); }} className="p-2"><Pencil className="h-4 w-4" /></button><button aria-label={`Delete ${c.name}`} onClick={async () => { if (!window.confirm(`Delete ${c.name}? Products will remain uncategorised.`)) return; const { error } = await supabase.from("categories").delete().eq("id", c.id); if (error) { toast.error(error.message); return; } qc.invalidateQueries({ queryKey: ["categories"] }); }} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div></div>)}</div></div>; }

function SettingsForm({ settings, mode }: { settings: StoreSettings; mode: "homepage" | "store" }) { const qc = useQueryClient(); const [form, setForm] = useState(settings); const [busy, setBusy] = useState(false); useEffect(() => setForm(settings), [settings]); const fields = mode === "homepage" ? [["hero_headline", "Headline"], ["hero_subheadline", "Subheadline"], ["hero_tagline", "Tagline"], ["hero_cta_label", "CTA text"], ["hero_cta_link", "CTA link"], ["hero_media_url", "Hero image or video URL"], ["hero_poster_url", "Video poster URL"]] as const : [["business_name", "Business name"], ["whatsapp_number", "WhatsApp"], ["phone_number", "Phone"], ["currency", "Currency"], ["currency_symbol", "Currency symbol"], ["email", "Email"], ["address", "Address"], ["about_title", "About title"]] as const; const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); const { error } = await supabase.from("store_settings").update(form).eq("id", settings.id); setBusy(false); if (error) { toast.error(error.message); return; } toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["store_settings"] }); }; return <div><p className="kicker">{mode === "homepage" ? "Campaign" : "Business details"}</p><h2 className="mt-2 text-4xl">{mode === "homepage" ? "Homepage" : "Store settings"}</h2><form onSubmit={save} className="mt-8"><Panel title={mode === "homepage" ? "Opening campaign" : "Contact and content"}><div className="grid gap-5 md:grid-cols-2">{fields.map(([key, label]) => <Field key={key} label={label}><input className={inputClass} value={String(form[key] ?? "")} onChange={e => setForm({ ...form, [key]: e.target.value || null })} /></Field>)}{mode === "homepage" ? <Field label="Media type"><select className={inputClass} value={form.hero_media_type} onChange={e => setForm({ ...form, hero_media_type: e.target.value })}><option value="image">Image</option><option value="video">Video</option></select><MediaUpload onUploaded={url => setForm({ ...form, hero_media_url: url, hero_media_type: "image" })} /></Field> : <><Field label="About story"><textarea className={cn(inputClass, "min-h-36")} value={form.about_body ?? ""} onChange={e => setForm({ ...form, about_body: e.target.value })} /></Field><Field label="Store policy"><textarea className={cn(inputClass, "min-h-36")} value={form.policy_body ?? ""} onChange={e => setForm({ ...form, policy_body: e.target.value })} /></Field></>}</div><div className="mt-7 flex gap-3"><AdminButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</AdminButton><AdminButton variant="ghost" onClick={() => setForm(settings)}>Cancel</AdminButton></div></Panel></form></div>; }