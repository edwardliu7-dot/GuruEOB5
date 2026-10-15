import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { PptxViewer } from "@aiden0z/pptx-renderer";

export function PptxDocumentPreview({ file }: { file: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isActive = true;
    let viewer: PptxViewer | null = null;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const { PptxViewer: BrowserPptxViewer, RECOMMENDED_ZIP_LIMITS } =
          await import("@aiden0z/pptx-renderer");
        const instance = await BrowserPptxViewer.open(
          await file.arrayBuffer(),
          container,
          {
            fitMode: "contain",
            lazySlides: true,
            lazyMedia: true,
            renderMode: "list",
            listOptions: {
              windowed: true,
              initialSlides: 2,
              batchSize: 3,
              showSlideLabels: true,
            },
            scrollContainer: container,
            zipLimits: RECOMMENDED_ZIP_LIMITS,
          },
        );

        if (!isActive) {
          instance.destroy();
          return;
        }
        viewer = instance;
        setIsLoading(false);
      } catch (cause) {
        if (!isActive) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "File PowerPoint ini tidak dapat ditampilkan.",
        );
        setIsLoading(false);
      }
    })();

    return () => {
      isActive = false;
      viewer?.destroy();
      container.replaceChildren();
    };
  }, [file]);

  return (
    <div className="relative h-full min-h-0 w-full bg-slate-100">
      <div
        ref={containerRef}
        className="h-full w-full overflow-auto overscroll-contain"
        aria-label="Pratinjau slide PowerPoint"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-100/90 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Menyiapkan pratinjau PowerPoint…
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 px-6 text-center"
        >
          <AlertTriangle className="h-7 w-7 text-amber-600" />
          <p className="font-medium text-slate-800">
            Pratinjau PowerPoint gagal dimuat
          </p>
          <p className="max-w-xl text-sm text-slate-600">{error}</p>
          <p className="text-xs text-slate-500">
            Beberapa efek atau elemen khusus PowerPoint mungkin belum didukung.
          </p>
        </div>
      )}
    </div>
  );
}
