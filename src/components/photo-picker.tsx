import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { toFa } from "@/lib/data";

async function fileToCompressedDataUrl(file: File, max = 1000): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image load failed"));
      image.src = dataUrl;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return dataUrl;
  }
}

export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      added.push(await fileToCompressedDataUrl(file));
    }
    onChange([...photos, ...added].slice(0, 12));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item as string);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card text-xs font-bold text-muted-foreground"
      >
        <ImagePlus className="size-5 text-primary" />
        {busy ? "در حال آماده‌سازی تصاویر..." : "افزودن عکس از گالری یا دوربین"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />

      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <li key={`${i}-${src.slice(-16)}`} className="relative overflow-hidden rounded-xl border border-border">
              <img src={src} alt={`عکس ${toFa(i + 1)} ملک`} className="h-24 w-full object-cover" />
              {i === 0 ? (
                <span className="absolute right-1 top-1 inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                  <Star className="size-2.5" /> اصلی
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
                aria-label="حذف عکس"
                className="absolute left-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground"
              >
                <X className="size-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  aria-label="انتقال به بعد"
                  className="grid size-5 place-items-center text-muted-foreground disabled:opacity-30"
                  disabled={i === photos.length - 1}
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-[10px] font-bold text-muted-foreground">{toFa(i + 1)}</span>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  aria-label="انتقال به قبل"
                  className="grid size-5 place-items-center text-muted-foreground disabled:opacity-30"
                  disabled={i === 0}
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          عکس‌ها فقط روی همین دستگاه ذخیره می‌شوند. عکس اول به عنوان عکس اصلی نمایش داده می‌شود.
        </p>
      )}
    </div>
  );
}
