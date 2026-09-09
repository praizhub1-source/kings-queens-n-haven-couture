import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, ArrowLeft, ArrowRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, isVideoUrl } from "@/lib/admin";
import { AdminButton, inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_BYTES = 20 * 1024 * 1024;

type Pending = { id: string; name: string; preview: string; error?: string };

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const move = (index: number, delta: number) => {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item as string);
    onChange(next);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const accepted: { file: File; entry: Pending }[] = [];

    for (const file of list) {
      const id = crypto.randomUUID();
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: only image files are allowed.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 20MB.`);
        continue;
      }
      accepted.push({ file, entry: { id, name: file.name, preview: URL.createObjectURL(file) } });
    }
    if (accepted.length === 0) return;

    setPending((prev) => [...prev, ...accepted.map((a) => a.entry)]);

    const uploaded: string[] = [];
    for (const { file, entry } of accepted) {
      try {
        uploaded.push(await uploadMedia(file));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(`${file.name}: ${message}`);
      } finally {
        URL.revokeObjectURL(entry.preview);
        setPending((prev) => prev.filter((p) => p.id !== entry.id));
      }
    }

    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-forest bg-forest/5" : "border-ink/25",
        )}
      >
        <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm">Add product photos</p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WEBP, AVIF or GIF · up to 20MB each · first photo is the main one
        </p>
        <AdminButton
          className="mt-2 w-full sm:w-auto"
          onClick={() => inputRef.current?.click()}
          disabled={pending.length > 0}
        >
          {pending.length > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" /> Choose photos
            </>
          )}
        </AdminButton>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Choose product photos"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, index) => (
            <li key={`${url}-${index}`} className="relative border border-border bg-card">
              <div className="aspect-square w-full overflow-hidden bg-sand">
                {isVideoUrl(url) ? (
                  <video src={url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              {index === 0 && (
                <span className="absolute left-1 top-1 bg-forest px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.16em] text-primary-foreground">
                  Main
                </span>
              )}
              <div className="flex items-center justify-between border-t border-border">
                <button
                  type="button"
                  aria-label="Move image earlier"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="p-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move image later"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  className="p-2 disabled:opacity-30"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="relative border border-border bg-card">
              <div className="aspect-square w-full overflow-hidden bg-sand">
                <img src={p.preview} alt="" className="h-full w-full object-cover opacity-50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-forest" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setShowUrl((v) => !v)}
        className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Link2 className="h-3.5 w-3.5" /> {showUrl ? "Hide" : "Add image by link instead"}
      </button>
      {showUrl && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            value={urlValue}
            placeholder="https://…"
            aria-label="Image URL"
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <AdminButton
            variant="outline"
            onClick={() => {
              const url = urlValue.trim();
              if (!url) return;
              onChange([...value, url]);
              setUrlValue("");
            }}
          >
            Add
          </AdminButton>
        </div>
      )}
    </div>
  );
}
