import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Download, Trash2, PackageOpen, CheckSquare, Square, X, ArrowLeft } from "lucide-react";
import { formatTimestamp, type ExtractedFrame, type ImageFormat } from "@/lib/video-extractor";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface FrameGalleryProps {
  frames: ExtractedFrame[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  format: ImageFormat;
  onClear?: () => void;
}

const FrameGallery = ({
  frames,
  onToggleSelect,
  onDelete,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  format,
  onClear,
}: FrameGalleryProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [viewingFrame, setViewingFrame] = useState<ExtractedFrame | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [downloading, setDownloading] = useState(false);
  const selectedCount = frames.filter((f) => f.selected).length;

  const togglePlay = (frame: ExtractedFrame) => {
    if (frame.type === 'audio') {
      const audio = audioRefs.current[frame.id];
      if (audio) {
        if (playingId === frame.id) {
          audio.pause();
          setPlayingId(null);
        } else {
          // Pause any currently playing
          if (playingId && audioRefs.current[playingId]) {
            audioRefs.current[playingId]?.pause();
          }
          if (playingId && videoRefs.current[playingId]) {
            videoRefs.current[playingId]?.pause();
          }
          audio.play();
          setPlayingId(frame.id);
        }
      }
    } else if (frame.type === 'video') {
      const video = videoRefs.current[frame.id];
      if (video) {
        if (playingId === frame.id) {
          video.pause();
          setPlayingId(null);
        } else {
          // Pause any currently playing
          if (playingId && audioRefs.current[playingId]) {
            audioRefs.current[playingId]?.pause();
          }
          if (playingId && videoRefs.current[playingId]) {
            videoRefs.current[playingId]?.pause();
          }
          video.play();
          setPlayingId(frame.id);
        }
      }
    }
  };

  const downloadSingle = async (frame: ExtractedFrame) => {
    const ext = frame.type === 'image' ? format : (frame.type === 'audio' ? 'mp3' : 'mp4');
    const filename = `${frame.type}-${formatTimestamp(frame.timestamp)}.${ext}`;
    
    if (frame.dataUrl.startsWith('data:')) {
      // For data URLs, convert to blob and use saveAs
      const base64 = frame.dataUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: frame.type === 'image' ? `image/${format}` : 
              frame.type === 'audio' ? 'audio/mp3' : 'video/mp4' 
      });
      saveAs(blob, filename);
    } else {
      // For URLs, fetch and download as blob
      try {
        const response = await fetch(frame.dataUrl);
        const blob = await response.blob();
        saveAs(blob, filename);
      } catch (error) {
        // Fallback to link method for CORS issues
        const link = document.createElement("a");
        link.href = frame.dataUrl;
        link.download = filename;
        link.target = '_blank';
        link.click();
      }
    }
  };

  const downloadZip = async () => {
    setDownloading(true);
    const zip = new JSZip();
    const selected = frames.filter((f) => f.selected);

    for (const frame of selected) {
      const ext = frame.type === 'image' ? format : (frame.type === 'audio' ? 'mp3' : 'mp4');
      const filename = `${frame.type}-${formatTimestamp(frame.timestamp)}.${ext}`;

      if (frame.dataUrl.startsWith('data:')) {
        const base64 = frame.dataUrl.split(",")[1];
        zip.file(filename, base64, { base64: true });
      } else {
        const response = await fetch(frame.dataUrl);
        const blob = await response.blob();
        zip.file(filename, blob);
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `media-${Date.now()}.zip`);
    setDownloading(false);
  };

  if (viewingFrame) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingFrame(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la galerie
          </Button>
          <h2 className="text-xl font-semibold">
            {viewingFrame.type === 'image' ? 'Image' : viewingFrame.type === 'audio' ? 'Audio' : 'Vidéo'} - {formatTimestamp(viewingFrame.timestamp)}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => downloadSingle(viewingFrame)}
              className="gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              Télécharger
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(viewingFrame.id);
                setViewingFrame(null);
              }}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-card border border-border">
          {viewingFrame.type === 'image' && (
            <img
              src={viewingFrame.dataUrl}
              alt={`Frame ${formatTimestamp(viewingFrame.timestamp)}`}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            />
          )}
          {viewingFrame.type === 'video' && (
            <video
              src={viewingFrame.dataUrl}
              className="w-full h-auto max-h-[70vh] mx-auto"
              controls
              autoPlay
            />
          )}
          {viewingFrame.type === 'audio' && (
            <div className="flex flex-col items-center justify-center p-12 gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <PackageOpen className="h-12 w-12 text-primary" />
              </div>
              <audio
                src={viewingFrame.dataUrl}
                controls
                autoPlay
                className="w-full max-w-md"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (frames.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">
          Galerie des extraits ({frames.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll} className="gap-1">
            <CheckSquare className="h-3.5 w-3.5" /> Tout
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll} className="gap-1">
            <Square className="h-3.5 w-3.5" /> Aucun
          </Button>
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Fermer
            </Button>
          )}
          <Button
            size="sm"
            onClick={downloadZip}
            disabled={selectedCount === 0 || downloading}
            className="gap-1"
          >
            <PackageOpen className="h-3.5 w-3.5" />
            {downloading ? "…" : `ZIP (${selectedCount})`}
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer ({selectedCount})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-card ${frame.selected
              ? "border-primary shadow-md shadow-primary/10"
              : "border-transparent hover:border-border"
              }`}
          >
            <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden relative">
              {frame.type === 'image' && (
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${formatTimestamp(frame.timestamp)}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setViewingFrame(frame)}
                />
              )}
              {frame.type === 'video' && (
                <video
                  ref={(el) => { videoRefs.current[frame.id] = el; }}
                  src={frame.dataUrl}
                  className="w-full h-full object-cover"
                  onEnded={() => setPlayingId(null)}
                />
              )}
              {frame.type === 'audio' && (
                <div className="flex flex-col items-center gap-2 p-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <PackageOpen className="h-6 w-6 text-primary" />
                  </div>
                  <audio
                    ref={(el) => { audioRefs.current[frame.id] = el; }}
                    src={frame.dataUrl}
                    onEnded={() => setPlayingId(null)}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Timestamp */}
            <span className="absolute bottom-1 left-8 text-[10px] font-mono bg-foreground/70 text-background px-1.5 py-0.5 rounded">
              {formatTimestamp(frame.timestamp)}
            </span>

            {/* Controls - toujours visibles */}
            <div className="absolute top-1 left-1 z-10">
              <Checkbox
                checked={frame.selected}
                onCheckedChange={() => onToggleSelect(frame.id)}
                className="bg-background/90 border-2 border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
            <div className="absolute top-1 right-1 flex gap-1 z-10">
              {(frame.type === 'audio' || frame.type === 'video') && (
                <button
                  onClick={() => togglePlay(frame)}
                  className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  title={playingId === frame.id ? "Pause" : "Lecture"}
                >
                  {playingId === frame.id ? (
                    <Square className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                </button>
              )}
              <button
                onClick={() => downloadSingle(frame)}
                className="p-1.5 rounded bg-foreground/70 text-background hover:bg-foreground/90 transition-colors"
                title="Télécharger"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(frame.id)}
                className="p-1.5 rounded bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Checkbox */}
            <div className="absolute top-1 left-1 z-10">
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
