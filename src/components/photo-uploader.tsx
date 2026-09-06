import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { removePhoto, signPhotos, uploadPhoto } from "@/lib/api";
import { toFa } from "@/lib/data";

export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ["photo-urls", paths.join("|")],
    queryFn: () => signPhotos(paths),
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

export function PhotoUploader({
  paths,
  onChange,
}: {
  paths: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { data: urls } = usePhotoUrls(paths);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadPhoto(file));
      }
      onChange([...paths, ...uploaded]);
      toast.success(`${toFa(uploaded.length)} عکس بارگذاری شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بارگذاری عکس انجام نشد");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...paths];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    onChange(next);
  };

  const remove = async (path: string) => {
    onChange(paths.filter((p) => p !== path));
    await removePhoto(path);
    toast.success("عکس حذف شد");
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-card text-xs font-bold text-muted-foreground disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="size-5 animate-spin text-primary" /> در حال بارگذاری...
          </>
        ) : (
          <>
            <ImagePlus className="size-5 text-primary" /> افزودن عکس (چند عکس همزمان)
          </>
        )}
      </button>

      {paths.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          هنوز عکسی اضافه نشده است. اولین عکس به عنوان عکس اصلی نمایش داده می‌شود.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {paths.map((path, index) => (
            <li key={path} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-4/3 bg-secondary">
                {urls?.[path] ? (
                  <img src={urls[path]} alt={`عکس ${toFa(index + 1)}`} className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold text-foreground">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Star className="size-3" /> عکس اصلی
                    </span>
                  ) : (
                    `ترتیب ${toFa(index + 1)}`
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="انتقال به عقب"
                    className="grid size-8 place-items-center rounded-lg bg-secondary text-secondary-foreground disabled:opacity-40"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === paths.length - 1}
                    aria-label="انتقال به جلو"
                    className="grid size-8 place-items-center rounded-lg bg-secondary text-secondary-foreground disabled:opacity-40"
                  >
                    <ArrowLeft className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(path)}
                  aria-label="حذف عکس"
                  className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
