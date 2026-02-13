import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Trash2, PackageOpen, CheckSquare, Square } from "lucide-react";
import { formatTimestamp, type ExtractedFrame, type ImageFormat } from "@/lib/video-extractor";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface FrameGalleryProps {
  frames: ExtractedFrame[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  format: ImageFormat;
}

const FrameGallery = ({
  frames,
  onToggleSelect,
  onDelete,
  onSelectAll,
  onDeselectAll,
  format,
}: FrameGalleryProps) => {
  const [downloading, setDownloading] = useState(false);
  const selectedCount = frames.filter((f) => f.selected).length;

  const downloadSingle = (frame: ExtractedFrame) => {
    const link = document.createElement("a");
    link.href = frame.dataUrl;
    link.download = `frame-${formatTimestamp(frame.timestamp)}.${format}`;
    link.click();
  };

  const downloadZip = async () => {
    setDownloading(true);
    const zip = new JSZip();
    const selected = frames.filter((f) => f.selected);
    selected.forEach((frame, i) => {
      const base64 = frame.dataUrl.split(",")[1];
      zip.file(
        `frame-${String(i + 1).padStart(4, "0")}-${formatTimestamp(frame.timestamp)}.${format}`,
        base64,
        { base64: true }
      );
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `frames-${Date.now()}.zip`);
    setDownloading(false);
  };

  if (frames.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">
          Images extraites ({frames.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll} className="gap-1">
            <CheckSquare className="h-3.5 w-3.5" /> Tout
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll} className="gap-1">
            <Square className="h-3.5 w-3.5" /> Aucun
          </Button>
          <Button
            size="sm"
            onClick={downloadZip}
            disabled={selectedCount === 0 || downloading}
            className="gap-1"
          >
            <PackageOpen className="h-3.5 w-3.5" />
            {downloading ? "…" : `ZIP (${selectedCount})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
              frame.selected
                ? "border-primary shadow-md shadow-primary/10"
                : "border-transparent hover:border-border"
            }`}
          >
            <img
              src={frame.dataUrl}
              alt={`Frame ${formatTimestamp(frame.timestamp)}`}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Timestamp */}
            <span className="absolute bottom-1 left-1 text-xs font-mono bg-foreground/70 text-background px-1.5 py-0.5 rounded">
              {formatTimestamp(frame.timestamp)}
            </span>

            {/* Controls */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => downloadSingle(frame)}
                className="p-1 rounded bg-foreground/60 text-background hover:bg-foreground/80 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(frame.id)}
                className="p-1 rounded bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Checkbox */}
            <div className="absolute top-1 left-1">
              <Checkbox
                checked={frame.selected}
                onCheckedChange={() => onToggleSelect(frame.id)}
                className="bg-background/80"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrameGallery;
